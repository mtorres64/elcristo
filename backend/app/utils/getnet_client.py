"""Cliente HTTP para la Regional API (SEP) de Getnet.

Documentación: docs.globalgetnet.com. Todavía no tenemos credenciales reales
(el comercio está gestionando el alta del canal online sobre su cuenta
existente — ya tiene Posnet físico), así que varios detalles exactos del
contrato quedan marcados como TODO acá, concentrados en este único archivo
para que confirmarlos contra sandbox sea un cambio quirúrgico.

Flujo que implementa este módulo (auth + captura en un solo paso, con
tokenización client-side — la tarjeta nunca pasa por nuestro backend):
1. `get_access_token`: OAuth2 client_credentials -> Bearer token (cacheado en
   memoria del proceso, no en Mongo).
2. `create_payment`: cobra usando el token de tarjeta que ya tokenizó el
   frontend contra Getnet.
3. `parse_webhook_payload` / `verify_webhook_signature`: para la notificación
   asíncrona que refuerza/corrige el resultado síncrono de `create_payment`.
"""

import logging
import time
import uuid
from dataclasses import dataclass
from typing import Literal

import httpx

logger = logging.getLogger(__name__)

Environment = Literal["sandbox", "production"]

BASE_URLS: dict[Environment, str] = {
    "sandbox": "https://api-sbx.globalgetnet.com",
    "production": "https://api.globalgetnet.com",
}

# Confirmados contra el spec real (swagger de Regional API, sección Payments,
# ejemplo "Create - Authorize" con tarjeta): auth+captura en un solo paso usa
# payment_method="CREDIT" (o "DEBIT") + transaction_type="FULL".
GETNET_SINGLE_STEP_PAYMENT_METHOD = "CREDIT"
GETNET_SINGLE_STEP_TRANSACTION_TYPE = "FULL"

# Confirmado contra el ejemplo de respuesta real del spec: "status": "APPROVED".
GETNET_APPROVED_STATUSES = {"APPROVED"}

_REQUEST_TIMEOUT = httpx.Timeout(15.0, connect=5.0)

# Margen de seguridad antes de que expire el token cacheado, para no arrancar
# un request con un token que vence a mitad de camino.
_TOKEN_EXPIRY_MARGIN_SECONDS = 60


class GetnetError(Exception):
    """Mensaje seguro para mostrarle al usuario final.

    El detalle completo (respuesta cruda, status code) siempre se loggea
    aparte con `logger.warning`/`logger.error` antes de levantar esta
    excepción — nunca se pierde para debugging, pero tampoco se filtra tal
    cual a la respuesta HTTP del checkout.
    """


@dataclass
class GetnetConfig:
    environment: Environment
    seller_id: str
    client_id: str
    client_secret: str


# Cache de tokens en memoria del proceso: (tenant_id, client_id) -> (token, expira_epoch).
# Se pierde en cada restart del proceso — está bien, un access token se
# consigue en un request y no vale la pena persistirlo en Mongo.
_token_cache: dict[tuple[str, str], tuple[str, float]] = {}


def _base_url(cfg: GetnetConfig) -> str:
    return BASE_URLS[cfg.environment]


async def get_access_token(
    cfg: GetnetConfig, tenant_id: str, *, force_refresh: bool = False
) -> str:
    """Devuelve un Bearer token válido, cacheado en memoria por (tenant, client_id).

    `force_refresh=True` lo usa el botón "Probar conexión" del panel de
    Integraciones para no devolver un token cacheado y así validar que las
    credenciales guardadas funcionan de verdad en este momento.
    """
    cache_key = (tenant_id, cfg.client_id)
    if not force_refresh:
        cached = _token_cache.get(cache_key)
        if cached and cached[1] > time.time():
            return cached[0]

    # Confirmado contra el spec real (swagger de Regional API, tag
    # Authentication): POST {base}/authentication/oauth2/access_token,
    # credenciales en el header Authorization como Basic client_id:client_secret
    # (base64), body application/x-www-form-urlencoded con grant_type=client_credentials.
    url = f"{_base_url(cfg)}/authentication/oauth2/access_token"
    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            resp = await client.post(
                url,
                auth=(cfg.client_id, cfg.client_secret),
                data={"grant_type": "client_credentials"},
            )
    except httpx.TimeoutException as exc:
        logger.warning("Getnet auth timeout (tenant=%s, env=%s)", tenant_id, cfg.environment)
        raise GetnetError("No se pudo conectar con Getnet (timeout)") from exc
    except httpx.HTTPError as exc:
        logger.warning("Getnet auth error de red (tenant=%s): %s", tenant_id, exc)
        raise GetnetError("No se pudo conectar con Getnet") from exc

    if resp.status_code != 200:
        snippet = resp.text[:300].strip()
        logger.warning(
            "Getnet auth rechazado (tenant=%s, env=%s, status=%s): %s",
            tenant_id, cfg.environment, resp.status_code, resp.text[:500],
        )
        # Se incluye el status code y un extracto de la respuesta de Getnet
        # (no sólo un mensaje genérico): esto lo ve el seller/admin en el
        # botón "Probar conexión" y es la única forma de distinguir "URL de
        # endpoint equivocada" (404), "formato de auth equivocado" (400) o
        # "credenciales realmente incorrectas" (401) sin acceso a los logs
        # del servidor — crítico mientras el endpoint exacto de Getnet
        # (arriba, TODO) todavía no está confirmado contra sandbox real.
        detail = (
            f" — Getnet respondió {resp.status_code}: {snippet}"
            if snippet
            else f" (HTTP {resp.status_code})"
        )
        raise GetnetError(f"Getnet rechazó las credenciales configuradas{detail}")

    body = resp.json()
    token = body.get("access_token")
    expires_in = body.get("expires_in", 300)
    if not token:
        logger.warning(
            "Getnet auth sin access_token en la respuesta (tenant=%s): %s", tenant_id, body
        )
        raise GetnetError("Respuesta inesperada de Getnet al autenticar")

    _token_cache[cache_key] = (token, time.time() + expires_in - _TOKEN_EXPIRY_MARGIN_SECONDS)
    return token


@dataclass
class GetnetPaymentResult:
    payment_id: str
    status: str
    authorization_code: str | None
    brand: str | None
    last4: str | None


async def create_payment(
    cfg: GetnetConfig,
    tenant_id: str,
    *,
    idempotency_key: str,
    order_number: str,
    amount_cents: int,
    currency: str,
    customer: dict,
    number_token: str,
    exp_month: int,
    exp_year: int,
    holder_name: str,
    security_code: str,
    device_session_id: str | None,
) -> GetnetPaymentResult:
    """Cobra con auth+captura inmediata usando el `number_token` que devolvió
    `tokenize_card` (nunca recibe ni ve el PAN acá — sólo el token, más los
    datos de tarjeta que Getnet exige igual en cada cobro: vencimiento,
    titular y CVV, ninguno de los cuales se persiste en ningún lado)."""
    token = await get_access_token(cfg, tenant_id)

    body = {
        "idempotency_key": idempotency_key,
        # Presente en todos los ejemplos del spec real junto a idempotency_key;
        # se usa un UUID propio por request (no reutiliza idempotency_key, que
        # debe repetirse en un reintento — request_id no tiene ese requisito).
        "request_id": str(uuid.uuid4()),
        "order_id": order_number,
        "data": {
            "amount": amount_cents,
            "currency": currency,
            "customer": customer,
            "payment": {
                "payment_method": GETNET_SINGLE_STEP_PAYMENT_METHOD,
                "transaction_type": GETNET_SINGLE_STEP_TRANSACTION_TYPE,
                "number_installments": 1,
                "card": {
                    "number_token": number_token,
                    # Confirmado en el ejemplo real del spec: mes de 2 dígitos
                    # con cero a la izquierda ("09", "12") y año de 2 dígitos
                    # ("30" para 2030) — ambos como string.
                    "expiration_month": f"{exp_month:02d}",
                    "expiration_year": f"{exp_year % 100:02d}",
                    "cardholder_name": holder_name,
                    "security_code": security_code,
                },
            },
            "additional_data": (
                {"device": {"session_id": device_session_id}} if device_session_id else {}
            ),
        },
    }
    url = f"{_base_url(cfg)}/dpm/payments-gwproxy/v2/payments"
    headers = {
        "authorization": f"Bearer {token}",
        "x-seller-id": cfg.seller_id,
        "content-type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            resp = await client.post(url, json=body, headers=headers)
    except httpx.TimeoutException as exc:
        logger.warning(
            "Getnet payment timeout (tenant=%s, order=%s)", tenant_id, order_number
        )
        raise GetnetError("La pasarela de pago no respondió a tiempo") from exc
    except httpx.HTTPError as exc:
        logger.warning(
            "Getnet payment error de red (tenant=%s, order=%s): %s", tenant_id, order_number, exc
        )
        raise GetnetError("No se pudo conectar con la pasarela de pago") from exc

    if resp.status_code != 200:
        logger.warning(
            "Getnet payment rechazado (tenant=%s, order=%s, status=%s): %s",
            tenant_id, order_number, resp.status_code, resp.text[:1000],
        )
        # Forma de error confirmada en el spec real: {message, name, status_code,
        # details: [{status, error_code, description, description_detail}]}.
        # Se prioriza `description_detail` (el más específico) para que el
        # seller vea la causa real en vez de un genérico.
        try:
            error_body = resp.json()
            details = error_body.get("details") or [{}]
            reason = details[0].get("description_detail") or error_body.get("message")
        except ValueError:
            reason = None
        message = f"La pasarela de pago rechazó la operación: {reason}" if reason else (
            "La pasarela de pago rechazó la operación"
        )
        raise GetnetError(message)

    # Confirmado en el spec real (ejemplo de respuesta 200): payment_id,
    # status, brand y authorization_code van todos en la raíz del payload,
    # no anidados bajo "card".
    payload = resp.json()
    payment_id = payload.get("payment_id")
    status = payload.get("status")
    if not payment_id or not status:
        logger.warning(
            "Getnet payment respuesta inesperada (tenant=%s, order=%s): %s",
            tenant_id, order_number, payload,
        )
        raise GetnetError("Respuesta inesperada de la pasarela de pago")

    return GetnetPaymentResult(
        payment_id=payment_id,
        status=status,
        authorization_code=payload.get("authorization_code"),
        brand=payload.get("brand"),
        last4=None,
    )


@dataclass
class GetnetTokenizeResult:
    number_token: str


async def tokenize_card(
    cfg: GetnetConfig, tenant_id: str, *, card_number: str, customer_id: str | None = None
) -> GetnetTokenizeResult:
    """Tokeniza un número de tarjeta contra Getnet (server-to-server).

    Confirmado en el spec real: POST {base}/dpm/cofre-gw-proxy/v1/tokens/card,
    requiere el mismo Bearer token que el resto de la API — Getnet no expone
    una clave pública separada para tokenizar directo desde el browser. Por
    eso el número de tarjeta pasa transitoriamente por nuestro backend (nunca
    se persiste) para intercambiarlo acá por un `number_token`. El CVV NO se
    manda a este endpoint (no hace falta para tokenizar, sólo al pagar).
    """
    token = await get_access_token(cfg, tenant_id)
    body: dict = {"card_number": card_number}
    if customer_id:
        body["customer_id"] = customer_id

    url = f"{_base_url(cfg)}/dpm/cofre-gw-proxy/v1/tokens/card"
    headers = {
        "authorization": f"Bearer {token}",
        "x-seller-id": cfg.seller_id,
        "content-type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            resp = await client.post(url, json=body, headers=headers)
    except httpx.TimeoutException as exc:
        raise GetnetError("La tokenización de la tarjeta no respondió a tiempo") from exc
    except httpx.HTTPError as exc:
        logger.warning("Getnet tokenize error de red (tenant=%s): %s", tenant_id, exc)
        raise GetnetError("No se pudo conectar con la pasarela de pago") from exc

    if resp.status_code != 200:
        logger.warning(
            "Getnet tokenize rechazado (tenant=%s, status=%s): %s",
            tenant_id, resp.status_code, resp.text[:500],
        )
        raise GetnetError("No se pudo tokenizar la tarjeta")

    payload = resp.json()
    number_token = payload.get("number_token")
    if not number_token:
        raise GetnetError("Respuesta inesperada de Getnet al tokenizar la tarjeta")
    return GetnetTokenizeResult(number_token=number_token)


@dataclass
class GetnetWebhookEvent:
    payment_id: str
    order_number: str | None
    status: str


def parse_webhook_payload(raw: dict) -> GetnetWebhookEvent | None:
    """Interpreta el body de una notificación de Getnet.

    TODO(confirmar contra sandbox real): shape exacto del payload de webhook.
    Se asume por ahora la misma forma que la respuesta síncrona de
    create_payment (`payment_id`, `order_id`, `status`), ya que no se
    encontró un ejemplo confirmado de notificación en la documentación
    pública ya revisada. Devuelve None (en vez de levantar) ante un payload
    no reconocido para que el router pueda hacer ACK igual y loggear el
    payload crudo — así se puede inspeccionar el shape real la primera vez
    que llegue un webhook de sandbox de verdad.
    """
    payment_id = raw.get("payment_id")
    status = raw.get("status")
    if not payment_id or not status:
        logger.warning("Getnet webhook con shape no reconocido: %s", raw)
        return None
    return GetnetWebhookEvent(
        payment_id=payment_id, order_number=raw.get("order_id"), status=status
    )


def verify_webhook_signature(headers: dict, raw_body: bytes, expected_seller_id: str) -> bool:
    """TODO: no se encontró documentación confirmada de un mecanismo de firma
    (HMAC u otro) para webhooks de la Regional API/SEP. Hasta confirmarlo,
    esta verificación es deliberadamente débil (sólo matchea x-seller-id si
    viene en los headers) — el router que la usa debe loggear headers y
    payload crudos del primer webhook real de sandbox que llegue, para poder
    reforzar esta función con el mecanismo real."""
    seller_header = headers.get("x-seller-id")
    if seller_header is None:
        return True
    return seller_header == expected_seller_id
