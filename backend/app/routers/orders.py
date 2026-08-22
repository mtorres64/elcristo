import math
from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, Request

from app.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.order import (
    OrderCreate,
    OrderCreateResponse,
    OrderDetail,
    OrderStatusUpdate,
    OrderSummary,
    PaymentCardIn,
)
from app.utils import getnet_client
from app.utils.auth_deps import require_user
from app.utils.card import detect_brand, luhn_is_valid
from app.utils.crypto import CryptoConfigError, decrypt_secret

router = APIRouter()

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
        "shipping_address": doc["shipping_address"],
        "payment": doc["payment"],
        "tracking_number": doc.get("tracking_number"),
        "notes": doc.get("notes"),
        "updated_at": doc["updated_at"],
    })
    return result


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


async def _mark_stock_decremented(db, doc: dict) -> dict:
    """Descuenta el stock de cada item del pedido `doc` y devuelve el dict de
    updates a mergear (o {} si ya se había descontado antes). Idempotente vía
    `stock_decremented` — usado tanto acá (pago síncrono aprobado) como en
    `update_order_status` (seller marca "paid" a mano) y en el webhook de
    Getnet (refuerzo eventual), para no descontar dos veces el mismo pedido
    sin importar por cuál de los tres caminos llegó a "paid"."""
    if doc.get("stock_decremented", False):
        return {}
    for item in doc["items"]:
        await db.products.update_one(
            {"_id": ObjectId(item["product_id"])}, {"$inc": {"stock": -item["quantity"]}}
        )
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


async def _charge_with_getnet(
    db,
    cfg: getnet_client.GetnetConfig,
    tenant_id: str,
    order_number: str,
    total: int,
    buyer: dict,
    card: PaymentCardIn,
) -> dict:
    """Tokeniza y cobra en dos llamadas server-to-server a Getnet.

    El número de tarjeta pasa transitoriamente por acá (Getnet no ofrece
    tokenización client-side en esta API — ver `tokenize_card`) pero nunca se
    persiste: sólo se usa en memoria para armar el request y se descarta al
    salir de esta función. Lo mismo el CVV (`card.security_code`), que ni
    siquiera viaja a `tokenize_card` (Getnet no lo pide para tokenizar), sólo
    al cobro final.
    """
    brand = detect_brand(card.card_number)
    last4 = card.card_number[-4:]
    try:
        tokenized = await getnet_client.tokenize_card(cfg, tenant_id, card_number=card.card_number)
        result = await getnet_client.create_payment(
            cfg,
            tenant_id,
            idempotency_key=f"{tenant_id}:{order_number}",
            order_number=order_number,
            amount_cents=total,
            currency="ARS",
            customer={"name": buyer["name"], "email": buyer["email"]},
            number_token=tokenized.number_token,
            exp_month=card.exp_month,
            exp_year=card.exp_year,
            holder_name=card.holder_name,
            security_code=card.security_code,
            device_session_id=None,
        )
    except getnet_client.GetnetError as exc:
        raise HTTPException(502, str(exc)) from exc

    if result.status not in getnet_client.GETNET_APPROVED_STATUSES:
        raise HTTPException(402, "El pago fue rechazado por la pasarela")

    now = datetime.now(UTC)
    return {
        "provider": "getnet",
        "payment_method_id": None,
        "brand": result.brand or brand,
        "last4": last4,
        "payment_id": result.payment_id,
        "preference_id": None,
        "authorization_code": result.authorization_code,
        "environment": cfg.environment,
        "status": "approved",
        "paid_at": now,
    }


async def _resolve_payment(
    db, tenant_id: str, order_number: str, total: int, buyer: dict, user_id: str, body: OrderCreate
) -> dict:
    integration = await _get_active_getnet_integration(db, tenant_id)
    if integration:
        # Una tarjeta "guardada" hoy es mock (last4/brand sin token real, ver
        # payment_methods.py): no sirve para cobrar de verdad, así que con
        # Getnet activo sólo se acepta una tarjeta nueva en el mismo request.
        if not body.payment_card:
            raise HTTPException(400, "Esta tienda cobra con Getnet: falta la tarjeta")
        card = body.payment_card
        if not luhn_is_valid(card.card_number):
            raise HTTPException(400, "Número de tarjeta inválido")
        if not card.security_code:
            raise HTTPException(400, "Falta el código de seguridad")
        return await _charge_with_getnet(
            db, integration, tenant_id, order_number, total, buyer, card
        )

    if body.payment_method_id:
        try:
            oid = ObjectId(body.payment_method_id)
        except Exception:
            raise HTTPException(400, "ID de método de pago inválido")
        pm = await db.payment_methods.find_one({"_id": oid, "user_id": user_id, "deleted_at": None})
        if not pm:
            raise HTTPException(404, "Método de pago no encontrado")
        return {
            "provider": "mock",
            "payment_method_id": str(pm["_id"]),
            "brand": pm["brand"],
            "last4": pm["last4"],
            "payment_id": None,
            "preference_id": None,
            "status": "pending",
            "paid_at": None,
        }

    card = body.payment_card
    if not luhn_is_valid(card.card_number):
        raise HTTPException(400, "Número de tarjeta inválido")
    brand = detect_brand(card.card_number)
    last4 = card.card_number[-4:]
    payment_method_id = None

    if body.save_card:
        now = datetime.now(UTC)
        existing_count = await db.payment_methods.count_documents(
            {"user_id": user_id, "deleted_at": None}
        )
        doc = {
            "user_id": user_id,
            "type": "card",
            "brand": brand,
            "holder_name": card.holder_name,
            "last4": last4,
            "exp_month": card.exp_month,
            "exp_year": card.exp_year,
            "is_default": existing_count == 0,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        }
        result = await db.payment_methods.insert_one(doc)
        payment_method_id = str(result.inserted_id)

    return {
        "provider": "mock",
        "payment_method_id": payment_method_id,
        "brand": brand,
        "last4": last4,
        "payment_id": None,
        "preference_id": None,
        "status": "pending",
        "paid_at": None,
    }


@router.post("", response_model=OrderCreateResponse, status_code=201)
async def create_order(body: OrderCreate, request: Request):
    db = get_db()
    user = require_user(request)
    user_id = user["sub"]

    if not body.items:
        raise HTTPException(400, "El carrito está vacío")

    order_items = []
    tenant_ids: set[str] = set()
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
        if product.get("stock", 0) < item.quantity:
            raise HTTPException(400, f"Stock insuficiente para \"{product['title']}\"")

        tenant_ids.add(product["tenant_id"])
        order_items.append({
            "product_id": str(product["_id"]),
            "title": item.title,
            "price": item.price,
            "quantity": item.quantity,
            "image_url": item.image_url,
        })

    if len(tenant_ids) > 1:
        raise HTTPException(400, "Los productos del pedido deben ser de la misma tienda")
    tenant_id = next(iter(tenant_ids))

    address = await _resolve_address(db, user_id, body)

    buyer = await db.users.find_one({"_id": ObjectId(user_id), "deleted_at": None})
    if not buyer:
        raise HTTPException(404, "Usuario no encontrado")

    subtotal = sum(i["price"] * i["quantity"] for i in order_items)
    shipping_cost = 0
    discount = 0
    total = subtotal + shipping_cost - discount

    now = datetime.now(UTC)
    year = now.year
    count_this_year = await db.orders.count_documents({"order_number": {"$regex": f"^ORD-{year}-"}})
    order_number = f"ORD-{year}-{count_this_year + 1:04d}"

    # Se resuelve DESPUÉS de calcular total/order_number/buyer: Getnet necesita
    # el order_number (idempotency_key) y el total (monto a cobrar) y los datos
    # del comprador para el request de cobro. Si el tenant no tiene Getnet
    # activo, el comportamiento es idéntico al de antes (mock, status "pending").
    payment = await _resolve_payment(db, tenant_id, order_number, total, buyer, user_id, body)

    # Con Getnet (auth+captura inmediata) el pedido puede nacer ya pago; con
    # el flujo mock (o cualquier otro proveedor todavía sin cobro real) sigue
    # naciendo pending_payment exactamente como antes.
    initial_status = "paid" if payment["status"] == "approved" else "pending_payment"

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

    if initial_status == "paid":
        stock_updates = await _mark_stock_decremented(db, order_doc)
        if stock_updates:
            await db.orders.update_one({"_id": result.inserted_id}, {"$set": stock_updates})

    return {
        "order_id": str(result.inserted_id),
        "order_number": order_number,
        "status": initial_status,
        "total": total,
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


@router.patch("/{order_id}/status", response_model=OrderDetail)
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

    if new_status == "paid":
        updates["payment.status"] = "approved"
        updates["payment.paid_at"] = now
        updates.update(await _mark_stock_decremented(db, doc))
    elif new_status in ("cancelled", "refunded"):
        if new_status == "refunded":
            updates["payment.status"] = "refunded"
        if current_status in _STOCK_DECREMENTED_STATES and was_decremented:
            for item in doc["items"]:
                await db.products.update_one(
                    {"_id": ObjectId(item["product_id"])},
                    {"$inc": {"stock": item["quantity"]}},
                )
            updates["stock_decremented"] = False

    await db.orders.update_one({"_id": doc["_id"]}, {"$set": updates})
    updated = await db.orders.find_one({"_id": doc["_id"]})
    return _to_detail(updated)


@router.post("/webhook/mercadopago")
async def mp_webhook():
    # TODO: implementar cuando se integre Mercado Pago (Fase 2, ver roadmap.md)
    return {"ok": True}


@router.post("/webhook/getnet")
async def getnet_webhook(request: Request):
    """Refuerzo asíncrono del resultado síncrono de `create_order`/`_charge_with_getnet`.

    Idempotente: no-op si el pedido ya no está en pending_payment (ya fue
    resuelto por el camino síncrono o por una entrega anterior del mismo
    webhook) o si el evento no es una aprobación. Siempre devuelve 200 con
    payload no reconocido para no generar reintentos infinitos del lado de
    Getnet — el payload se loggea igual dentro de `parse_webhook_payload`
    para poder confirmar el shape real la primera vez que llegue uno de
    sandbox de verdad.
    """
    raw = await request.json()
    # TODO: una vez confirmado el mecanismo real de firma de Getnet, validar acá
    # con getnet_client.verify_webhook_signature antes de confiar en el payload.
    event = getnet_client.parse_webhook_payload(raw)
    if event is None:
        return {"ok": True}

    db = get_db()
    doc = await db.orders.find_one({"payment.payment_id": event.payment_id, "deleted_at": None})
    if not doc and event.order_number:
        doc = await db.orders.find_one({"order_number": event.order_number, "deleted_at": None})

    if (
        not doc
        or doc["status"] != "pending_payment"
        or event.status not in getnet_client.GETNET_APPROVED_STATUSES
    ):
        return {"ok": True}

    now = datetime.now(UTC)
    updates: dict = {
        "status": "paid",
        "updated_at": now,
        "payment.status": "approved",
        "payment.paid_at": now,
    }
    updates.update(await _mark_stock_decremented(db, doc))
    await db.orders.update_one({"_id": doc["_id"]}, {"$set": updates})
    return {"ok": True}
