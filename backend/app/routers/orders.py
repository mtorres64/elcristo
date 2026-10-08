import logging
import math
from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request

from app.config import settings
from app.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.order import (
    OrderCreate,
    OrderCreateResponse,
    OrderDetail,
    OrderStatusUpdate,
    OrderStatusUpdateResult,
    OrderSummary,
    RefundOutcome,
)
from app.schemas.store_settings import ShippingSettings
from app.utils import getnet_client
from app.utils.auth_deps import require_user
from app.utils.crypto import CryptoConfigError, decrypt_secret
from app.utils.email import resolve_smtp_config, send_email

logger = logging.getLogger(__name__)

router = APIRouter()

ORDER_STATUS_LABEL_ES: dict[str, str] = {
    "pending_payment": "Pendiente de pago",
    "paid": "Pagado",
    "preparing": "Preparando",
    "shipped": "Enviado",
    "delivered": "Entregado",
    "cancelled": "Cancelado",
    "refunded": "Reembolsado",
    "disputed": "En disputa",
}


def _ars(cents: int) -> str:
    return "$" + f"{cents / 100:,.0f}".replace(",", ".")

# Transiciones permitidas por estado actual. Una lista vacía = estado terminal.
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "pending_payment": {"paid", "cancelled"},
    "paid": {"preparing", "cancelled", "refunded", "disputed"},
    "preparing": {"shipped", "cancelled", "disputed"},
    "shipped": {"delivered", "disputed"},
    "delivered": {"refunded", "disputed"},
    "cancelled": set(),
    "refunded": set(),
    "disputed": {"paid", "cancelled", "refunded"},
}

# Estados en los que ya se descontó el stock (para saber cuándo restaurarlo).
_STOCK_DECREMENTED_STATES = {"paid", "preparing", "shipped", "delivered"}


def _to_summary(doc: dict) -> dict:
    return {
        "order_id": str(doc["_id"]),
        "order_number": doc["order_number"],
        "tenant_id": doc["tenant_id"],
        "buyer_id": doc["buyer_id"],
        "buyer_name": doc["buyer_name"],
        "buyer_email": doc["buyer_email"],
        "status": doc["status"],
        "item_count": sum(i["quantity"] for i in doc["items"]),
        "total": doc["total"],
        "created_at": doc["created_at"],
    }


def _to_detail(doc: dict) -> dict:
    result = _to_summary(doc)
    result.update({
        "items": doc["items"],
        "subtotal": doc["subtotal"],
        "shipping_cost": doc.get("shipping_cost", 0),
        "discount": doc.get("discount", 0),
        "pickup": doc.get("pickup", False),
        "shipping_zone_name": doc.get("shipping_zone_name"),
        "shipping_address": doc["shipping_address"],
        "payment": doc["payment"],
        "tracking_number": doc.get("tracking_number"),
        "notes": doc.get("notes"),
        "updated_at": doc["updated_at"],
    })
    return result


async def _queue_order_confirmation_email(
    bg: BackgroundTasks, tenant_id: str, order_doc: dict
) -> None:
    """Encola el email con el detalle del pedido al comprador. Best-effort:
    si el SMTP del tenant no está configurado, sólo se loguea (ver utils/email)."""
    order_id = str(order_doc["_id"])
    number = order_doc["order_number"]
    status_label = ORDER_STATUS_LABEL_ES.get(order_doc["status"], order_doc["status"])
    link = f"{settings.frontend_url}/mis-pedidos/{order_id}"
    addr = order_doc["shipping_address"]
    greeting = f"Hola {order_doc['buyer_name']}," if order_doc.get("buyer_name") else "Hola,"

    rows_html = "".join(
        f'<tr><td style="padding:6px 0">{i["title"]} '
        f'<span style="color:#8A8A8A">× {i["quantity"]}</span></td>'
        f'<td style="padding:6px 0;text-align:right;white-space:nowrap">'
        f'{_ars(i["price"] * i["quantity"])}</td></tr>'
        for i in order_doc["items"]
    )
    totals_html = (
        f'<tr><td>Subtotal</td><td style="text-align:right">{_ars(order_doc["subtotal"])}</td></tr>'
        f'<tr><td>Envío</td><td style="text-align:right">'
        f'{_ars(order_doc.get("shipping_cost", 0)) if order_doc.get("shipping_cost") else "Gratis"}'
        "</td></tr>"
    )
    if order_doc.get("discount"):
        totals_html += (
            f'<tr><td>Descuento</td><td style="text-align:right">'
            f'-{_ars(order_doc["discount"])}</td></tr>'
        )
    totals_html += (
        f'<tr><td style="padding-top:6px;font-weight:bold">Total</td>'
        f'<td style="padding-top:6px;text-align:right;font-weight:bold">'
        f'{_ars(order_doc["total"])}</td></tr>'
    )

    html = (
        '<div style="font-family:Arial,Helvetica,sans-serif;color:#1A1A1A;line-height:1.6;'
        'max-width:560px">'
        f"<p>{greeting}</p>"
        f"<p>Recibimos tu pedido <strong>{number}</strong>. "
        f"Estado actual: <strong>{status_label}</strong>.</p>"
        '<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">'
        f"{rows_html}"
        '<tr><td colspan="2"><hr style="border:none;border-top:1px solid #E8E2D8;margin:8px 0">'
        "</td></tr>"
        f"{totals_html}"
        "</table>"
        f'<p style="font-size:13px;color:#6B6B6B">Envío a: {addr["street"]}'
        f'{" (sin número)" if addr.get("no_number") else ""}, {addr["locality"]}, '
        f'{addr["province"]}<br>{addr["full_name"]} · '
        f'{addr.get("phone_country_code", "")} {addr["phone"]}</p>'
        '<p style="margin:24px 0">'
        f'<a href="{link}" style="background:#253824;color:#fff;text-decoration:none;'
        'padding:12px 24px;border-radius:8px;display:inline-block">Ver mi pedido</a></p>'
        '<p style="font-size:13px;color:#6B6B6B">Gracias por tu compra en Vivero El Cristo.</p>'
        "</div>"
    )

    text_lines = [
        greeting,
        "",
        f"Recibimos tu pedido {number}. Estado actual: {status_label}.",
        "",
    ]
    text_lines += [f"- {i['title']} x{i['quantity']}: {_ars(i['price'] * i['quantity'])}"
                   for i in order_doc["items"]]
    text_lines += [
        "",
        f"Total: {_ars(order_doc['total'])}",
        "",
        f"Ver el detalle: {link}",
        "",
        "Gracias por tu compra en Vivero El Cristo.",
    ]

    config = await resolve_smtp_config(tenant_id)
    bg.add_task(
        send_email,
        order_doc["buyer_email"],
        f"Tu pedido {number} — Vivero El Cristo",
        html,
        "\n".join(text_lines),
        config,
    )


async def _resolve_address(db, user_id: str, body: OrderCreate) -> dict:
    if body.address_id:
        try:
            oid = ObjectId(body.address_id)
        except Exception:
            raise HTTPException(400, "ID de dirección inválido")
        addr = await db.addresses.find_one({"_id": oid, "user_id": user_id, "deleted_at": None})
        if not addr:
            raise HTTPException(404, "Dirección no encontrada")
        return addr

    # Dirección inline nueva: se guarda como dirección del comprador para reutilizarla después.
    now = datetime.now(UTC)
    body_addr = body.shipping_address
    existing_count = await db.addresses.count_documents({"user_id": user_id, "deleted_at": None})
    make_default = body_addr.is_default or existing_count == 0
    doc = {
        "user_id": user_id,
        "full_name": body_addr.full_name,
        "phone_country_code": body_addr.phone_country_code,
        "phone": body_addr.phone,
        "street": body_addr.street,
        "no_number": body_addr.no_number,
        "province": body_addr.province,
        "locality": body_addr.locality,
        "zip": None if body_addr.zip_unknown else body_addr.zip,
        "zip_unknown": body_addr.zip_unknown,
        "department": body_addr.department,
        "lat": body_addr.lat,
        "lng": body_addr.lng,
        "is_default": make_default,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    result = await db.addresses.insert_one(doc)
    if make_default:
        await db.addresses.update_many(
            {"user_id": user_id, "_id": {"$ne": result.inserted_id}, "deleted_at": None},
            {"$set": {"is_default": False}},
        )
    doc["_id"] = result.inserted_id
    return doc


async def _resolve_shipping(db, tenant_id: str, subtotal: int, body: OrderCreate) -> tuple[int, int, str | None]:
    """Recalcula costo de envío y descuento en el server a partir de
    Configuración > Envíos — nunca se confía en un monto que mande el
    cliente. Devuelve (shipping_cost, discount, shipping_zone_name), los dos
    primeros en centavos. El nombre de zona se guarda en la orden para poder
    explicar más tarde por qué el envío salió gratis o con descuento."""
    doc = await db.store_settings.find_one({"tenant_id": tenant_id})
    shipping_cfg = ShippingSettings(**(doc or {}).get("shipping", {}))

    if body.pickup:
        discount = round(subtotal * shipping_cfg.pickup_discount_pct / 100)
        return 0, discount, None

    if body.shipping_zone_id:
        zone = next((z for z in shipping_cfg.zones if z.id == body.shipping_zone_id), None)
        if not zone:
            raise HTTPException(400, "La zona de envío elegida ya no está disponible")
        if zone.free_from is not None and subtotal >= zone.free_from:
            return 0, 0, zone.name
        return zone.cost, 0, zone.name

    # Ni retiro ni zona: localidad fuera de las zonas configuradas — el envío
    # queda en 0 y se coordina a mano con el vendedor (ver ShippingRatesCard).
    return 0, 0, None


async def _expand_stock_lines(db, items: list[dict]) -> list[tuple[ObjectId, int]]:
    """Traduce cada línea del pedido al producto cuyo stock hay que tocar de
    verdad: si la línea es un combo, sus componentes (cantidad por combo ×
    cantidad vendida) — el combo en sí nunca guarda stock propio. Si es un
    producto simple, el producto mismo."""
    expanded: list[tuple[ObjectId, int]] = []
    for item in items:
        try:
            product_oid = ObjectId(item["product_id"])
        except Exception:
            continue
        product = await db.products.find_one({"_id": product_oid})
        if product and product.get("product_type") == "combo":
            for combo_item in product.get("combo_items", []):
                try:
                    component_oid = ObjectId(combo_item["product_id"])
                except Exception:
                    continue
                expanded.append((component_oid, combo_item.get("quantity", 1) * item["quantity"]))
        else:
            expanded.append((product_oid, item["quantity"]))
    return expanded


async def _mark_stock_decremented(db, doc: dict) -> dict:
    """Descuenta el stock de cada item del pedido `doc` (expandiendo combos a
    sus componentes) y devuelve el dict de updates a mergear (o {} si ya se
    había descontado antes). Idempotente vía `stock_decremented` — usado
    tanto acá (pago síncrono aprobado) como en `update_order_status` (seller
    marca "paid" a mano) y en el webhook de Getnet (refuerzo eventual), para
    no descontar dos veces el mismo pedido sin importar por cuál de los tres
    caminos llegó a "paid"."""
    if doc.get("stock_decremented", False):
        return {}
    for product_oid, quantity in await _expand_stock_lines(db, doc["items"]):
        await db.products.update_one({"_id": product_oid}, {"$inc": {"stock": -quantity}})
    return {"stock_decremented": True}


async def _get_active_getnet_integration(db, tenant_id: str) -> getnet_client.GetnetConfig | None:
    doc = await db.tenant_integrations.find_one(
        {"tenant_id": tenant_id, "provider": "getnet", "enabled": True, "deleted_at": None}
    )
    if not doc:
        return None
    active_env = doc.get("active_environment", "sandbox")
    env_doc = doc.get(active_env) or {}
    if not env_doc.get("client_secret_encrypted"):
        return None
    try:
        client_secret = decrypt_secret(env_doc["client_secret_encrypted"])
    except CryptoConfigError as exc:
        raise HTTPException(500, "La configuración de la pasarela de pago es inválida") from exc
    return getnet_client.GetnetConfig(
        environment=active_env,
        seller_id=env_doc["seller_id"],
        client_id=env_doc["client_id"],
        client_secret=client_secret,
    )


def _split_name(full_name: str) -> tuple[str, str]:
    """Getnet pide first_name/last_name separados; nuestros usuarios sólo
    tienen un `name` completo. Todo lo que no sea la primera palabra va a
    last_name (si no hay más que una palabra, se repite — Getnet exige ambos
    campos no vacíos)."""
    parts = full_name.strip().split(maxsplit=1)
    if len(parts) == 2:
        return parts[0], parts[1]
    return (parts[0], parts[0]) if parts else ("Comprador", "Comprador")


async def _start_getnet_payment(
    db, tenant_id: str, order_id: str, total: int, buyer: dict, items: list[dict],
    address: dict, pickup: bool,
) -> tuple[dict, str]:
    """Arranca el cobro con Web Checkout — o rechaza crear el pedido si la
    tienda no puede cobrar de verdad.

    A diferencia del flujo anterior (server-to-server, cobro aprobado en la
    misma request), acá sólo se consigue una `checkout_url` a la que hay que
    mandar al comprador: el pedido nace `pending_payment` y el cobro real se
    confirma recién cuando llega el webhook (ver `getnet_webhook` más abajo
    — es la única fuente de verdad, el manual de Getnet lo aclara explícito).

    Devuelve `(payment_dict_para_la_orden, checkout_url)`."""
    integration = await _get_active_getnet_integration(db, tenant_id)
    if not integration:
        raise HTTPException(
            400,
            "Esta tienda no tiene un método de pago habilitado por el momento. "
            "Contactá al vendedor para coordinar tu compra.",
        )

    first_name, last_name = _split_name(buyer["name"])
    phone_digits = (address.get("phone_country_code", "") + address.get("phone", "")).replace("+", "").strip()
    customer = getnet_client.GetnetCustomerInfo(
        customer_id=str(buyer["_id"]),
        first_name=first_name,
        last_name=last_name,
        full_name=buyer["name"],
        email=buyer["email"],
        email_verified=buyer.get("email_verified", False),
        phone_number=phone_digits or None,
        street=address["street"],
        locality=address["locality"],
        province=address["province"],
        postal_code=address.get("zip"),
    )
    try:
        result = await getnet_client.create_payment_intent(
            integration,
            tenant_id,
            order_id=order_id,
            amount_cents=total,
            currency="ARS",
            customer=customer,
            pickup=pickup,
            items=[
                getnet_client.GetnetLineItem(
                    title=i["title"], quantity=i["quantity"], value_cents=i["price"]
                )
                for i in items
            ],
        )
    except getnet_client.GetnetError as exc:
        raise HTTPException(502, str(exc)) from exc

    payment = {
        "provider": "getnet",
        "payment_method_id": None,
        "brand": None,
        "last4": None,
        "payment_id": result.payment_intent_id,
        "preference_id": None,
        "authorization_code": None,
        "environment": integration.environment,
        "status": "pending",
        "paid_at": None,
    }
    return payment, result.checkout_url


@router.post("", response_model=OrderCreateResponse, status_code=201)
async def create_order(body: OrderCreate, request: Request, background: BackgroundTasks):
    db = get_db()
    user = require_user(request)
    user_id = user["sub"]

    if not body.items:
        raise HTTPException(400, "El carrito está vacío")

    order_items = []
    tenant_ids: set[str] = set()
    # Cantidad total requerida por producto "real" (el que efectivamente
    # tiene stock propio): para un combo son sus componentes, cantidad por
    # combo × cantidad vendida. Se acumula acá — en vez de validar cada línea
    # del carrito por separado — para no vender de más cuando dos combos
    # distintos comparten un componente, o un componente se vende suelto y
    # también dentro de un combo en el mismo pedido.
    stock_requirements: dict[str, int] = {}
    for item in body.items:
        # El carrito (CartContext, frontend) arma product_id como
        # "<id-real>__<tamaño>__<maceta-o-sin-maceta>" para poder tener una
        # línea de carrito distinta por combinación de variante + maceta, con
        # el precio ya combinado (precio de variante + extra de maceta) en
        # item.price. Por eso acá se confía en el snapshot que manda el
        # cliente (price/title/image_url) igual que el resto de la app
        # (CartItem.price_snapshot) y sólo se usa el id real para validar que
        # el producto exista y tenga stock.
        base_product_id = item.product_id.split("__", 1)[0]
        try:
            product_oid = ObjectId(base_product_id)
        except Exception:
            raise HTTPException(400, f"ID de producto inválido: {item.product_id}")

        product = await db.products.find_one({"_id": product_oid, "deleted_at": None})
        if not product:
            raise HTTPException(404, f"Producto no encontrado: {item.title}")

        if product.get("product_type") == "combo":
            if not product.get("combo_items"):
                raise HTTPException(400, f"\"{product['title']}\" ya no está disponible")
            for combo_item in product["combo_items"]:
                stock_requirements[combo_item["product_id"]] = (
                    stock_requirements.get(combo_item["product_id"], 0)
                    + combo_item.get("quantity", 1) * item.quantity
                )
        else:
            stock_requirements[base_product_id] = (
                stock_requirements.get(base_product_id, 0) + item.quantity
            )

        tenant_ids.add(product["tenant_id"])
        order_items.append({
            "product_id": str(product["_id"]),
            "title": item.title,
            "price": item.price,
            "quantity": item.quantity,
            "image_url": item.image_url,
        })

    for real_product_id, required_qty in stock_requirements.items():
        try:
            real_oid = ObjectId(real_product_id)
        except Exception:
            raise HTTPException(400, f"ID de producto inválido: {real_product_id}")
        real_product = await db.products.find_one({"_id": real_oid, "deleted_at": None})
        if not real_product:
            raise HTTPException(404, "Uno de los productos del pedido ya no está disponible")
        if real_product.get("stock", 0) < required_qty:
            raise HTTPException(400, f"Stock insuficiente para \"{real_product['title']}\"")

    if len(tenant_ids) > 1:
        raise HTTPException(400, "Los productos del pedido deben ser de la misma tienda")
    tenant_id = next(iter(tenant_ids))

    address = await _resolve_address(db, user_id, body)

    buyer = await db.users.find_one({"_id": ObjectId(user_id), "deleted_at": None})
    if not buyer:
        raise HTTPException(404, "Usuario no encontrado")

    subtotal = sum(i["price"] * i["quantity"] for i in order_items)
    shipping_cost, discount, shipping_zone_name = await _resolve_shipping(db, tenant_id, subtotal, body)
    total = subtotal + shipping_cost - discount

    now = datetime.now(UTC)
    year = now.year
    count_this_year = await db.orders.count_documents({"order_number": {"$regex": f"^ORD-{year}-"}})
    order_number = f"ORD-{year}-{count_this_year + 1:04d}"

    # Se resuelve DESPUÉS de calcular total/order_number/buyer: Getnet necesita
    # el order_number (se lo manda como `order_id` — es lo que después vuelve
    # tal cual en el webhook para encontrar este pedido), el total (monto a
    # cobrar) y los datos del comprador. Sin una integración de pago activa,
    # esto lanza un 400 y el pedido no llega a crearse.
    payment, checkout_url = await _start_getnet_payment(
        db, tenant_id, order_number, total, buyer, order_items, address, body.pickup
    )

    # Web Checkout nunca aprueba en esta misma request — el comprador todavía
    # no cargó la tarjeta (lo hace en `checkout_url`, alojado por Getnet). El
    # pedido siempre nace pending_payment; sólo el webhook lo pasa a "paid".
    initial_status = "pending_payment"

    order_doc = {
        "tenant_id": tenant_id,
        "buyer_id": user_id,
        "buyer_name": buyer["name"],
        "buyer_email": buyer["email"],
        "order_number": order_number,
        "status": initial_status,
        "items": order_items,
        "subtotal": subtotal,
        "shipping_cost": shipping_cost,
        "discount": discount,
        "pickup": body.pickup,
        "shipping_zone_name": shipping_zone_name,
        "total": total,
        "shipping_address": {
            "full_name": address["full_name"],
            "phone_country_code": address.get("phone_country_code", "+54"),
            "phone": address["phone"],
            "street": address["street"],
            "no_number": address.get("no_number", False),
            "province": address["province"],
            "locality": address["locality"],
            "zip": address.get("zip"),
            "zip_unknown": address.get("zip_unknown", False),
            "department": address.get("department"),
            "lat": address.get("lat"),
            "lng": address.get("lng"),
        },
        "payment": payment,
        "tracking_number": None,
        "notes": body.notes,
        "stock_decremented": False,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    result = await db.orders.insert_one(order_doc)
    order_doc["_id"] = result.inserted_id

    # El stock se descuenta recién cuando el webhook confirma "paid" (ver
    # `getnet_webhook`) — acá el pago ni empezó, así que nunca corresponde
    # reservar ni descontar todavía.

    return {
        "order_id": str(result.inserted_id),
        "order_number": order_number,
        "status": initial_status,
        "total": total,
        "checkout_url": checkout_url,
    }


@router.get("", response_model=PaginatedResponse[OrderSummary])
async def list_orders(
    request: Request,
    status: str | None = None,
    q: str | None = None,
    sort: str = "newest",
    tenant_id: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    db = get_db()
    user = require_user(request)
    role = user.get("role")
    # Igual que en /products: además del claim del JWT (TenantMiddleware),
    # se acepta el query param explícito que ya usa el dashboard del seller.
    tenant_id = tenant_id or getattr(request.state, "tenant_id", None)

    f: dict = {"deleted_at": None}
    if role in ("seller", "platform_admin"):
        # Igual que en /products (`tid = tenant_id or request.state.tenant_id`):
        # el filtro de tenant sólo se aplica si hay uno resuelto. Hoy
        # `tenants.py` todavía es un stub y ningún usuario tiene `tenant_id`
        # seteado, así que sin esto el seller no vería ningún pedido.
        if tenant_id:
            f["tenant_id"] = tenant_id
        if q:
            f["$or"] = [
                {"order_number": {"$regex": q, "$options": "i"}},
                {"buyer_name": {"$regex": q, "$options": "i"}},
                {"buyer_email": {"$regex": q, "$options": "i"}},
            ]
    else:
        f["buyer_id"] = user["sub"]

    if status:
        f["status"] = status

    sort_map = {"newest": [("created_at", -1)], "oldest": [("created_at", 1)]}
    sort_spec = sort_map.get(sort, [("created_at", -1)])

    total = await db.orders.count_documents(f)
    skip = (page - 1) * page_size
    docs = await db.orders.find(f).sort(sort_spec).skip(skip).limit(page_size).to_list(page_size)

    return {
        "items": [_to_summary(d) for d in docs],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total > 0 else 0,
    }


async def _get_order_or_404(db, order_id: str, user: dict) -> dict:
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(400, "ID de pedido inválido")

    doc = await db.orders.find_one({"_id": oid, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Pedido no encontrado")

    role = user.get("role")
    is_owner = doc["buyer_id"] == user["sub"]
    is_platform_admin = role == "platform_admin"
    # Mismo criterio que en list_orders: sin tenant_id propio (hoy siempre es
    # el caso, `tenants.py` es un stub) el seller ve todos los pedidos; si en
    # el futuro los usuarios sí tienen tenant_id, ahí sí se exige que coincida.
    seller_tenant_id = user.get("tenant_id")
    is_tenant_seller = role == "seller" and (not seller_tenant_id or doc["tenant_id"] == seller_tenant_id)
    if not (is_owner or is_platform_admin or is_tenant_seller):
        raise HTTPException(404, "Pedido no encontrado")

    return doc


@router.get("/{order_id}", response_model=OrderDetail)
async def get_order(order_id: str, request: Request):
    db = get_db()
    user = require_user(request)
    doc = await _get_order_or_404(db, order_id, user)
    return _to_detail(doc)


async def _refund_approved_payment(db, doc: dict) -> tuple[RefundOutcome, dict]:
    """Avisa cómo devolver el cobro aprobado de `doc` al cancelar el pedido.

    Web Checkout no tiene API de reembolso (confirmado en el manual de
    Getnet: "las devoluciones se gestionan exclusivamente desde el Getnet
    Portal... no se realizan por API"). Esta función ya no intenta devolver
    nada — sólo deja pasar la cancelación (`outcome="skipped"`) con el
    mensaje de qué hacer a mano, para el admin que cancela el pedido.
    """
    payment = doc["payment"]

    if payment.get("provider") != "getnet" or not payment.get("payment_id"):
        return RefundOutcome(
            outcome="skipped",
            message="El cobro no pasó por una pasarela real: se canceló el pedido "
            "sin devolución automática.",
        ), {}

    return RefundOutcome(
        outcome="skipped",
        message="Este pedido se cobró con Getnet (Web Checkout): la devolución no se "
        "puede hacer por API, hay que hacerla a mano desde el Getnet Portal "
        "(buscá la transacción por el número de pedido y ejecutá la devolución ahí).",
        amount=doc["total"],
    ), {}


@router.patch("/{order_id}/status", response_model=OrderStatusUpdateResult)
async def update_order_status(order_id: str, body: OrderStatusUpdate, request: Request):
    db = get_db()
    user = require_user(request)
    role = user.get("role")
    if role not in ("seller", "platform_admin"):
        raise HTTPException(403, "No tenés permisos para actualizar pedidos")

    doc = await _get_order_or_404(db, order_id, user)
    current_status = doc["status"]
    new_status = body.status

    if new_status not in ALLOWED_TRANSITIONS:
        raise HTTPException(400, f"Estado inválido: {new_status}")

    if new_status != current_status and new_status not in ALLOWED_TRANSITIONS[current_status]:
        raise HTTPException(400, f"No se puede pasar de \"{current_status}\" a \"{new_status}\"")

    now = datetime.now(UTC)
    updates: dict = {"status": new_status, "updated_at": now}
    if body.tracking_number is not None:
        updates["tracking_number"] = body.tracking_number

    was_decremented = doc.get("stock_decremented", False)
    refund: RefundOutcome | None = None

    if new_status == "cancelled" and current_status != "cancelled":
        if doc["payment"].get("status") == "approved":
            refund, payment_updates = await _refund_approved_payment(db, doc)
            if refund.outcome in ("failed", "unknown"):
                # El pedido no cambia: sólo se guarda el contador de rechazos.
                if payment_updates:
                    await db.orders.update_one({"_id": doc["_id"]}, {"$set": payment_updates})
                    doc = await db.orders.find_one({"_id": doc["_id"]})
                return {**_to_detail(doc), "refund": refund}
            updates.update(payment_updates)
            if refund.outcome == "refunded":
                # Cancelar un pedido ya cobrado y devuelto termina en "refunded".
                updates["status"] = "refunded"
        else:
            refund = RefundOutcome(
                outcome="not_required",
                message="El pedido no tenía un pago aprobado: no hay nada que devolver.",
            )

    if new_status == "paid":
        updates["payment.status"] = "approved"
        updates["payment.paid_at"] = now
        updates.update(await _mark_stock_decremented(db, doc))
    elif updates["status"] in ("cancelled", "refunded"):
        if updates["status"] == "refunded":
            updates["payment.status"] = "refunded"
        restore_stock = current_status in _STOCK_DECREMENTED_STATES and was_decremented
        if restore_stock:
            updates["stock_decremented"] = False

    # Filtro por estado actual: dos requests simultáneos (doble click) no pueden
    # devolver el stock dos veces ni pisarse el resultado.
    written = await db.orders.update_one(
        {"_id": doc["_id"], "status": current_status}, {"$set": updates}
    )
    if written.matched_count == 0:
        if refund is not None and refund.outcome == "refunded":
            logger.error(
                "Pedido %s: Getnet devolvió el pago pero el estado cambió en paralelo",
                doc["order_number"],
            )
        raise HTTPException(409, "El pedido cambió mientras se procesaba. Recargá e intentá de nuevo.")

    if updates.get("stock_decremented") is False and was_decremented:
        for product_oid, quantity in await _expand_stock_lines(db, doc["items"]):
            await db.products.update_one({"_id": product_oid}, {"$inc": {"stock": quantity}})

    updated = await db.orders.find_one({"_id": doc["_id"]})
    return {**_to_detail(updated), "refund": refund}


@router.post("/webhook/mercadopago")
async def mp_webhook():
    # TODO: implementar cuando se integre Mercado Pago (Fase 2, ver roadmap.md)
    return {"ok": True}


@router.post("/webhook/getnet")
async def getnet_webhook(request: Request, background: BackgroundTasks):
    """Notificación de Web Checkout — es la ÚNICA fuente de verdad del
    resultado del pago (el manual de Getnet lo aclara explícito: no confiar
    en el redirect ni en datos del frontend). Acá, y sólo acá, un pedido pasa
    de `pending_payment` a `paid`.

    Idempotente: no-op si el pedido ya no está en `pending_payment` (webhook
    entregado más de una vez) o si el estado no es una aprobación. Siempre
    devuelve 200 — incluso ante un payload no reconocido — para no generar
    reintentos infinitos del lado de Getnet; el payload crudo se loggea
    igual dentro de `parse_webhook_payload`.
    """
    raw = await request.json()
    # TODO: el manual no documenta un mecanismo de firma para este webhook —
    # preguntarle a Getnet (consultasecommerce@getnet.com.ar) y validar acá
    # con getnet_client.verify_webhook_signature antes de confiar en el payload.
    event = getnet_client.parse_webhook_payload(raw)
    if event is None:
        return {"ok": True}

    db = get_db()
    # `order_id` es nuestro propio `order_number`, tal como lo mandamos en
    # `create_payment_intent` — Getnet lo devuelve sin modificar.
    doc = await db.orders.find_one({"order_number": event.order_id, "deleted_at": None})

    if not doc or doc["status"] != "pending_payment":
        return {"ok": True}

    if event.status not in getnet_client.GETNET_APPROVED_STATUSES:
        # No se conoce el vocabulario completo de estados de rechazo (el
        # manual sólo confirma "APPROVED"): se deja el pedido en
        # pending_payment para que el admin lo revise, en vez de adivinar a
        # qué estado final corresponde.
        logger.info(
            "Getnet webhook: pedido %s con estado no aprobado (%s)",
            doc["order_number"], event.status,
        )
        await db.orders.update_one(
            {"_id": doc["_id"]}, {"$set": {"payment.status": "rejected"}}
        )
        return {"ok": True}

    now = datetime.now(UTC)
    updates: dict = {
        "status": "paid",
        "updated_at": now,
        "payment.status": "approved",
        "payment.paid_at": now,
        "payment.payment_id": event.payment_intent_id,
    }
    updates.update(await _mark_stock_decremented(db, doc))
    await db.orders.update_one({"_id": doc["_id"]}, {"$set": updates})

    updated = await db.orders.find_one({"_id": doc["_id"]})
    await _queue_order_confirmation_email(background, doc["tenant_id"], updated)
    return {"ok": True}
