"""Compras a proveedores.

Registrar una compra suma stock y actualiza el costo del producto (o de la
variante de tamaño elegida), y aplica un nuevo precio de venta: el que mande el
cliente por línea, o uno sugerido con `costo * (1 + markup/100)` donde el markup
sale de `product.target_markup_pct` o, en su defecto, del markup global de la
tienda (`store_settings.default_markup_pct`).
"""

import math
from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, Request

from app.database import get_db
from app.routers.store_settings import DEFAULT_MARKUP_PCT
from app.schemas.common import PaginatedResponse
from app.schemas.purchase import PurchaseCreate, PurchaseDetail, PurchaseItemIn, PurchaseSummary
from app.utils.auth_deps import require_user

router = APIRouter()

_SIZE_VALUE = {"pequeña": "pequeña", "grande": "grande"}   # "mediana" = producto base


def _require_seller(request: Request) -> dict:
    user = require_user(request)
    if user.get("role") not in ("seller", "platform_admin"):
        raise HTTPException(403, "No tenés permisos para registrar compras")
    return user


def _suggested_price(unit_cost: int, markup_pct: float) -> int:
    return round(unit_cost * (1 + markup_pct / 100))


def _markup_pct(price: int | None, cost: int) -> float | None:
    if not cost or price is None:
        return None
    return round((price - cost) / cost * 100, 2)


def _to_summary(doc: dict) -> dict:
    return {
        "purchase_id": str(doc["_id"]),
        "tenant_id": doc["tenant_id"],
        "supplier": doc.get("supplier"),
        "reference": doc.get("reference"),
        "item_count": len(doc.get("items", [])),
        "total_units": doc.get("total_units", 0),
        "total_cost": doc.get("total_cost", 0),
        "created_at": doc["created_at"],
    }


def _to_detail(doc: dict) -> dict:
    result = _to_summary(doc)
    result.update({
        "note": doc.get("note"),
        "items": doc.get("items", []),
        "updated_at": doc.get("updated_at"),
    })
    return result


async def _global_markup(db, tenant_id: str) -> float:
    doc = await db.store_settings.find_one({"tenant_id": tenant_id})
    if not doc:
        return DEFAULT_MARKUP_PCT
    return doc.get("default_markup_pct", DEFAULT_MARKUP_PCT)


async def _apply_purchase_item(
    db, tenant_id: str, item: PurchaseItemIn, global_markup: float, now: datetime
) -> dict:
    try:
        oid = ObjectId(item.product_id)
    except Exception:
        raise HTTPException(400, f"ID de producto inválido: {item.product_id}") from None

    f: dict = {"_id": oid, "deleted_at": None}
    if tenant_id:
        f["tenant_id"] = tenant_id
    product = await db.products.find_one(f)
    if not product:
        raise HTTPException(404, f"Producto no encontrado: {item.product_id}")

    markup = product.get("target_markup_pct")
    if markup is None:
        markup = global_markup

    size = item.size
    if size == "mediana":
        prev_cost = product.get("cost_price")
        prev_price = product.get("price")
    else:
        variant = next(
            (v for v in product.get("variants", [])
             if v.get("key") == "size" and v.get("value") == _SIZE_VALUE[size]),
            None,
        )
        if variant:
            prev_cost = variant.get("cost_price_override") or product.get("cost_price")
            prev_price = variant.get("price_override") or product.get("price")
        else:
            prev_cost = product.get("cost_price")
            prev_price = product.get("price")

    new_price = item.new_price or _suggested_price(item.unit_cost, markup)

    if size == "mediana":
        await db.products.update_one(
            {"_id": oid},
            {
                "$inc": {"stock": item.quantity},
                "$set": {"cost_price": item.unit_cost, "price": new_price, "updated_at": now},
            },
        )
    else:
        value = _SIZE_VALUE[size]
        matched = await db.products.update_one(
            {"_id": oid, "variants": {"$elemMatch": {"key": "size", "value": value}}},
            {
                "$inc": {"variants.$.stock": item.quantity},
                "$set": {
                    "variants.$.price_override": new_price,
                    "variants.$.cost_price_override": item.unit_cost,
                    "updated_at": now,
                },
            },
        )
        if matched.matched_count == 0:
            await db.products.update_one(
                {"_id": oid},
                {
                    "$push": {"variants": {
                        "key": "size", "value": value, "stock": item.quantity,
                        "price_override": new_price, "compare_at_price_override": None,
                        "cost_price_override": item.unit_cost, "weight_grams_override": None,
                        "height_cm_override": None, "sku_override": None,
                        "active": True, "recommended_pot_ids": [],
                    }},
                    "$set": {"updated_at": now},
                },
            )

    return {
        "product_id": str(oid),
        "title": product["title"],
        "size": size,
        "quantity": item.quantity,
        "unit_cost": item.unit_cost,
        "prev_cost": prev_cost,
        "prev_price": prev_price,
        "new_price": new_price,
        "markup_pct": _markup_pct(new_price, item.unit_cost),
    }


@router.post("", response_model=PurchaseDetail, status_code=201)
async def create_purchase(body: PurchaseCreate, request: Request):
    user = _require_seller(request)
    db = get_db()
    tenant_id = getattr(request.state, "tenant_id", None) or "default"
    now = datetime.now(UTC)

    global_markup = await _global_markup(db, tenant_id)

    items_out: list[dict] = []
    for item in body.items:
        items_out.append(
            await _apply_purchase_item(db, tenant_id, item, global_markup, now)
        )

    total_cost = sum(i["unit_cost"] * i["quantity"] for i in items_out)
    total_units = sum(i["quantity"] for i in items_out)

    doc = {
        "tenant_id": tenant_id,
        "created_by": user.get("sub"),
        "supplier": body.supplier,
        "reference": body.reference,
        "note": body.note,
        "items": items_out,
        "total_cost": total_cost,
        "total_units": total_units,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    result = await db.purchases.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_detail(doc)


@router.get("", response_model=PaginatedResponse[PurchaseSummary])
async def list_purchases(
    request: Request,
    q: str | None = None,
    tenant_id: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    _require_seller(request)
    db = get_db()

    f: dict = {"deleted_at": None}
    tid = tenant_id or getattr(request.state, "tenant_id", None)
    if tid:
        f["tenant_id"] = tid
    if q:
        f["$or"] = [
            {"supplier": {"$regex": q, "$options": "i"}},
            {"reference": {"$regex": q, "$options": "i"}},
        ]

    total = await db.purchases.count_documents(f)
    skip = (page - 1) * page_size
    docs = (
        await db.purchases.find(f)
        .sort([("created_at", -1)])
        .skip(skip)
        .limit(page_size)
        .to_list(page_size)
    )

    return {
        "items": [_to_summary(d) for d in docs],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total > 0 else 0,
    }


@router.get("/{purchase_id}", response_model=PurchaseDetail)
async def get_purchase(purchase_id: str, request: Request):
    _require_seller(request)
    db = get_db()
    try:
        oid = ObjectId(purchase_id)
    except Exception:
        raise HTTPException(400, "ID de compra inválido") from None

    doc = await db.purchases.find_one({"_id": oid, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Compra no encontrada")

    tid = getattr(request.state, "tenant_id", None)
    if tid and doc.get("tenant_id") != tid:
        raise HTTPException(404, "Compra no encontrada")

    return _to_detail(doc)
