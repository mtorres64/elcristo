"""Cliente HTTP para Web Checkout de Getnet.

Confirmado contra el "Manual de pruebas Web Checkout" que mandó Getnet (no
hay ambiente de sandbox: las credenciales de la cuenta 94009 son directo de
producción). A diferencia de la Regional API (que se evaluó antes y se
descartó: esta cuenta no la tiene habilitada), acá Getnet aloja el
formulario de pago — la tarjeta nunca pasa por nuestro backend ni por
nuestro frontend.

Flujo que implementa este módulo:
1. `get_access_token`: OAuth2 client_credentials -> Bearer token (cacheado en
   memoria del proceso, no en Mongo). Mismo endpoint que ya estaba confirmado.
2. `create_payment_intent`: arranca el pago — Getnet devuelve un
   `checkout_url` al que hay que redirigir al comprador para que complete el
   pago en una página alojada por Getnet.
3. `parse_webhook_payload` / `verify_webhook_signature`: para la notificación
   asíncrona con el resultado real del pago — es la ÚNICA fuente de verdad
   (el manual es explícito: "no depender del redirect para confirmar el
   estado de una operación").

Lo que el manual aclara que NO se puede hacer desde la API (importante,
porque es lo contrario de lo que se había armado antes de tener el manual):
- Elegir cuotas por transacción (se configuran una única vez en el Getnet
  Portal, por marca de tarjeta).
- Pedir un reembolso (se hace a mano desde el Getnet Portal).
- Mandar las URLs de éxito/error/webhook por request (son fijas, se
  configuran en el portal).
"""

import logging
import time
from dataclasses import dataclass
from typing import Literal

import httpx

logger = logging.getLogger(__name__)

Environment = Literal["sandbox", "production"]

BASE_URLS: dict[Environment, str] = {
    # No hay sandbox real para esta cuenta (ver manual) — se deja el entry
    # por si en el futuro Getnet lo habilita; hoy sólo se usa "production".
    "sandbox": "https://api-sbx.globalgetnet.com",
    "production": "https://api.globalgetnet.com",
}

# Confirmado en el manual (sección 4, ejemplo de webhook real).
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

    # Confirmado en el manual: POST {base}/authentication/oauth2/access_token,
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
class GetnetPaymentIntentResult:
    checkout_url: str
    # El manual no muestra este campo en la respuesta de creación (sólo lo
    # confirma como parte del payload del webhook) — se guarda si viene, pero
    # no se asume presente.
    payment_intent_id: str | None


async def create_payment_intent(
    cfg: GetnetConfig,
    tenant_id: str,
    *,
    order_id: str,
    amount_cents: int,
    currency: str,
    first_name: str,
    last_name: str,
    email: str,
) -> GetnetPaymentIntentResult:
    """Arranca un pago de Web Checkout: Getnet devuelve una URL a la que hay
    que redirigir al comprador para que cargue la tarjeta en una página
    alojada por Getnet (nunca en la nuestra).

    Confirmado contra el manual real de Getnet (sección 2 y 3): POST
    {base}/digital-checkout/v1/payment-intent, con el body de acá abajo
    (ejemplo literal del manual). `order_id` es nuestro propio número de
    pedido — Getnet lo devuelve tal cual en el webhook, así enlazamos la
    notificación con el pedido sin depender de nada que ellos generen.

    El manual no muestra los headers del request (sólo el body) — probado
    contra la cuenta real, Getnet rechaza el request sin `country` y
    `tenant` ("Invalid Headers": "\"country\" and \"tenant\" headers are
    required"). `country` es el país del comercio (hoy siempre "AR" — no
    hay forma de saberlo de otro lado, ver TODO de `currency` más abajo);
    `tenant` no está confirmado qué valor espera exactamente, se prueba con
    `cfg.seller_id` (mismo identificador que ya se usa en `x-seller-id`) por
    ser el dato que más sentido tiene como "de qué comercio es este
    request" — si Getnet lo sigue rechazando, el próximo error debería
    decir con qué valor lo esperaba.
    """
    token = await get_access_token(cfg, tenant_id)
    body = {
        "order_id": order_id,
        "customer": {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
        },
        "payment": {
            "currency": currency,
            "amount": amount_cents,
        },
    }
    url = f"{_base_url(cfg)}/digital-checkout/v1/payment-intent"
    headers = {
        "authorization": f"Bearer {token}",
        "x-seller-id": cfg.seller_id,
        "country": "AR",
        "tenant": cfg.seller_id,
        "content-type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            resp = await client.post(url, json=body, headers=headers)
    except httpx.TimeoutException as exc:
        logger.warning("Getnet payment-intent timeout (tenant=%s, order=%s)", tenant_id, order_id)
        raise GetnetError("La pasarela de pago no respondió a tiempo") from exc
    except httpx.HTTPError as exc:
        logger.warning(
            "Getnet payment-intent error de red (tenant=%s, order=%s): %s", tenant_id, order_id, exc
        )
        raise GetnetError("No se pudo conectar con la pasarela de pago") from exc

    if resp.status_code not in (200, 201):
        logger.warning(
            "Getnet payment-intent rechazado (tenant=%s, order=%s, status=%s): %s",
            tenant_id, order_id, resp.status_code, resp.text[:1000],
        )
        try:
            error_body = resp.json()
            # Confirmado contra un rechazo real: {"reason": "...", "description": "..."}.
            # Se dejan message/error como respaldo por si otro tipo de
            # rechazo usa un shape distinto.
            reason = (
                error_body.get("description")
                or error_body.get("reason")
                or error_body.get("message")
                or error_body.get("error")
            )
        except ValueError:
            reason = None
        message = f"La pasarela de pago rechazó la operación: {reason}" if reason else (
            "La pasarela de pago rechazó la operación"
        )
        raise GetnetError(message)

    payload = resp.json()
    # El manual describe el campo como "checkout_url" en el texto del flujo
    # (sección 3) pero no muestra el JSON de respuesta completo — se prueba
    # también "redirect_url"/"url" por si el nombre real difiere.
    checkout_url = payload.get("checkout_url") or payload.get("redirect_url") or payload.get("url")
    if not checkout_url:
        logger.warning(
            "Getnet payment-intent respuesta sin checkout_url (tenant=%s, order=%s): %s",
            tenant_id, order_id, payload,
        )
        raise GetnetError("Respuesta inesperada de la pasarela de pago")

    return GetnetPaymentIntentResult(
        checkout_url=checkout_url,
        payment_intent_id=payload.get("payment_intent_id"),
    )


@dataclass
class GetnetWebhookEvent:
    order_id: str
    payment_intent_id: str
    status: str


def parse_webhook_payload(raw: dict) -> GetnetWebhookEvent | None:
    """Interpreta el body de una notificación de Getnet.

    Confirmado contra el ejemplo real del manual (sección 4):
    {"order_id": "12345", "payment_intent_id": "abc123", "status": "APPROVED"}.
    Devuelve None (en vez de levantar) ante un payload no reconocido para que
    el router pueda hacer ACK igual y loggear el payload crudo.
    """
    order_id = raw.get("order_id")
    payment_intent_id = raw.get("payment_intent_id")
    status = raw.get("status")
    if not order_id or not payment_intent_id or not status:
        logger.warning("Getnet webhook con shape no reconocido: %s", raw)
        return None
    return GetnetWebhookEvent(order_id=order_id, payment_intent_id=payment_intent_id, status=status)


def verify_webhook_signature(headers: dict, raw_body: bytes, expected_seller_id: str) -> bool:
    """TODO: el manual no documenta un mecanismo de firma (HMAC u otro) para
    el webhook de Web Checkout. Hasta confirmarlo con Getnet, esta
    verificación es deliberadamente débil (sólo matchea x-seller-id si viene
    en los headers) — el router que la usa loggea headers y payload crudos
    de cada webhook real para poder reforzar esta función apenas se sepa el
    mecanismo real (preguntar a consultasecommerce@getnet.com.ar)."""
    seller_header = headers.get("x-seller-id")
    if seller_header is None:
        return True
    return seller_header == expected_seller_id
