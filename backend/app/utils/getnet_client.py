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
3. `parse_webhook_payload` / `verify_webhook_auth`: para la notificación
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

import base64
import logging
import re
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

# Confirmado contra el swagger real (modelo del webhook, enum de
# payment.result.status): "Authorized", "Denied", "Registered", "Approved".
# El manual (con un ejemplo simplificado, "status": "APPROVED") llevó a
# asumir mal el shape completo — ver `parse_webhook_payload`. Se tratan
# ambos "Authorized" y "Approved" como aprobación: no está confirmado cuál
# usan los pagos con tarjeta en la práctica (el ejemplo de respuesta del
# swagger para un pago con tarjeta mostraba "Authorized").
GETNET_APPROVED_STATUSES = {"Authorized", "Approved"}

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


@dataclass
class GetnetLineItem:
    title: str
    quantity: int
    value_cents: int


_TRAILING_NUMBER = re.compile(r"^(.*?)\s+(\d+)\s*$")


def _split_street_number(street: str) -> tuple[str, str]:
    """El modelo `Address` de Getnet exige `street` y `number` por
    separado (ambos requeridos, confirmado contra el swagger real) —
    nuestro formulario de dirección los pide juntos en un solo campo libre
    (ej. "Av. Aconquija 1200"), como es común en direcciones argentinas.
    Se intenta separar el número al final; si no hay ninguno (la calle no
    termina en dígitos, o el comprador marcó "sin número"), se manda "S/N"
    para no dejar un campo requerido vacío."""
    match = _TRAILING_NUMBER.match(street.strip())
    if match:
        return match.group(1).strip(), match.group(2)
    return street.strip(), "S/N"


@dataclass
class GetnetCustomerInfo:
    customer_id: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    email_verified: bool
    phone_number: str | None            # E.164 sin "+" (ej. "5491145678901")
    street: str
    locality: str
    province: str
    postal_code: str | None
    # DNI del comprador: hoy el checkout no lo pide en ningún paso, así que
    # no hay de dónde sacarlo — se manda None y, si Getnet lo exige de
    # verdad, el próximo rechazo debería decirlo explícito (como pasó con
    # el resto de estos campos).
    document_type: str | None = None
    document_number: str | None = None


async def create_payment_intent(
    cfg: GetnetConfig,
    tenant_id: str,
    *,
    order_id: str,
    amount_cents: int,
    currency: str,
    customer: GetnetCustomerInfo,
    pickup: bool,
    items: list[GetnetLineItem],
) -> GetnetPaymentIntentResult:
    """Arranca un pago de Web Checkout: Getnet devuelve una URL a la que hay
    que redirigir al comprador para que cargue la tarjeta en una página
    alojada por Getnet (nunca en la nuestra).

    El manual oficial que mandó Getnet sólo mostraba un body mínimo
    (order_id/customer/payment) y nada de headers — el resto se fue
    confirmando a los golpes contra la cuenta real (seller 94009), porque
    cada rechazo (400) venía con un mensaje bien específico, hasta que
    encontramos un ejemplo de request real y completo (curl, ambiente
    sandbox) que confirma el resto:
    - Headers — `country`: "AR"; `tenant`: "santander" (Getnet Argentina es
      la marca de pagos de Banco Santander, no es el seller_id ni el país);
      `x-seller-id`: pese al nombre, NO es el "Seller ID" numérico del
      portal — Getnet exige un GUID ahí. El Client ID tiene forma
      `cid_<guid>` (ej. `cid_fc29cdab-60a6-4278-92bf-e84d65c31ae1`): se
      manda esa parte, sacándole el prefijo `cid_`. (El ejemplo encontrado
      no muestra estos tres headers, pero contra nuestra cuenta real sí
      hacen falta — se los sigue mandando.)
    - `product`: array de objetos, uno por ítem del carrito, con
      `product_type` ("physical_goods" — son plantas/macetas físicas),
      `title`, `description`, `value` (centavos) y `quantity`.
    - `customer`: mucho más rico de lo que se mandaba antes — incluye
      `customer_id`, `name` (completo, además de first/last), teléfono,
      `checked_email` y `billing_address`. No se manda `document_type`/
      `document_number` (DNI) porque el checkout no lo recolecta hoy; si
      Getnet lo exige, el próximo rechazo debería decirlo.
    - `pickup_store`: true/false — mapea directo a si el comprador elige
      retirar en el local en vez de que se lo envíen.
    """
    token = await get_access_token(cfg, tenant_id)
    billing_street, billing_number = _split_street_number(customer.street)
    body = {
        "order_id": order_id,
        "payment": {
            "currency": currency,
            "amount": amount_cents,
        },
        "product": [
            {
                "product_type": "physical_goods",
                "title": item.title,
                "description": item.title,
                "value": item.value_cents,
                "quantity": item.quantity,
            }
            for item in items
        ],
        "customer": {
            "customer_id": customer.customer_id,
            "first_name": customer.first_name,
            "last_name": customer.last_name,
            "name": customer.full_name,
            "email": customer.email,
            "checked_email": customer.email_verified,
            **({"document_type": customer.document_type} if customer.document_type else {}),
            **({"document_number": customer.document_number} if customer.document_number else {}),
            **({"phone_number": customer.phone_number} if customer.phone_number else {}),
            "billing_address": {
                "street": billing_street,
                "number": billing_number,
                "city": customer.locality,
                "state": customer.province,
                "country": "AR",
                # Requerido por Getnet; si el comprador marcó "no sé el
                # código postal" en el checkout no tenemos un valor real —
                # se manda un placeholder en vez de dejarlo vacío, ya que
                # el campo es obligatorio.
                "postal_code": customer.postal_code or "0000",
            },
        },
        "pickup_store": pickup,
    }
    url = f"{_base_url(cfg)}/digital-checkout/v1/payment-intent"
    # El Client ID guardado tiene forma "cid_<guid>" — el GUID que pide
    # x-seller-id es esa parte, sin el prefijo.
    seller_guid = cfg.client_id.removeprefix("cid_")
    headers = {
        "authorization": f"Bearer {token}",
        "x-seller-id": seller_guid,
        "country": "AR",
        "tenant": "santander",
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
    # Confirmado contra el swagger real (payment-intent, respuesta 201):
    # el campo se llama "redirect_url", no "checkout_url" (eso era sólo
    # cómo lo nombraba el texto del manual). Se dejan los otros dos como
    # respaldo por si alguna variante de la cuenta difiere.
    checkout_url = payload.get("redirect_url") or payload.get("checkout_url") or payload.get("url")
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


async def get_sellers(cfg: GetnetConfig, tenant_id: str) -> list[dict]:
    """Lista los sellers de la cuenta — existe en el mismo swagger de Web
    Checkout (sección "Seller", `GET /sellers`). Se usa de diagnóstico para
    encontrar el GUID real que espera `x-seller-id` en `payment-intent`
    (confirmado por rechazo real: ni el seller_id numérico del portal ni el
    GUID del Client ID son ese valor — Getnet respondió "Seller not found"
    con ambos). No manda `x-seller-id` (es lo que se busca); si este
    endpoint también lo exige, el error debería decirlo.
    """
    token = await get_access_token(cfg, tenant_id)
    url = f"{_base_url(cfg)}/digital-checkout/v1/sellers"
    headers = {
        "authorization": f"Bearer {token}",
        "country": "AR",
        "tenant": "santander",
    }
    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            resp = await client.get(url, headers=headers)
    except httpx.HTTPError as exc:
        raise GetnetError(f"No se pudo consultar los sellers: {exc}") from exc

    if resp.status_code != 200:
        logger.warning(
            "Getnet GET /sellers rechazado (tenant=%s, status=%s): %s",
            tenant_id, resp.status_code, resp.text[:1000],
        )
        raise GetnetError(f"Getnet rechazó GET /sellers (HTTP {resp.status_code}): {resp.text[:300]}")

    payload = resp.json()
    sellers = payload if isinstance(payload, list) else payload.get("sellers") or payload.get("data") or [payload]
    return sellers


@dataclass
class GetnetWebhookEvent:
    order_id: str
    payment_intent_id: str | None
    status: str


def parse_webhook_payload(raw: dict) -> GetnetWebhookEvent | None:
    """Interpreta el body de una notificación de Getnet.

    Confirmado contra el swagger real (modelo del webhook) — el shape es
    bastante más anidado de lo que sugería el ejemplo simplificado del
    manual: el estado vive en `payment.result.status`, no suelto en la raíz.
    `order_id` sí está en la raíz (es nuestro propio order_number, tal como
    lo mandamos al crear el payment intent) y es la clave de reconciliación
    recomendada por Getnet; `payment_intent_id` también está en la raíz.

    Devuelve None (en vez de levantar) ante un payload no reconocido para que
    el router pueda hacer ACK igual y loggear el payload crudo.
    """
    order_id = raw.get("order_id")
    status = raw.get("payment", {}).get("result", {}).get("status")
    if not order_id or not status:
        logger.warning("Getnet webhook con shape no reconocido: %s", raw)
        return None
    return GetnetWebhookEvent(
        order_id=order_id, payment_intent_id=raw.get("payment_intent_id"), status=status
    )


def verify_webhook_auth(authorization_header: str | None, username: str, password: str) -> bool:
    """Valida el webhook de Web Checkout.

    Confirmado contra el swagger real: NO es un header de firma (HMAC) —
    Getnet llama a nuestra URL con HTTP Basic Auth,
    `Authorization: Basic {base64(usuario:contraseña)}`, usando el usuario y
    contraseña que se configuran en el Getnet Portal (Checkout
    Configurations > Webhook). Esas credenciales hay que guardarlas acá
    también (ver `tenant_integrations`) para poder compararlas en cada
    notificación entrante.
    """
    if not authorization_header or not authorization_header.startswith("Basic "):
        return False
    try:
        decoded = base64.b64decode(authorization_header.removeprefix("Basic ")).decode("utf-8")
        sent_user, _, sent_password = decoded.partition(":")
    except Exception:
        return False
    return sent_user == username and sent_password == password
