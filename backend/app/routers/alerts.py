from bson import ObjectId
from fastapi import APIRouter, Request

from app.database import get_db
from app.schemas.alert import AlertsResponse
from app.utils.auth_deps import require_user

router = APIRouter()

# Mismo corte que usa el badge "Stock bajo" en la lista de productos
# (`StockBadge` en ProductList.tsx) — hay que mantenerlos sincronizados.
LOW_STOCK_THRESHOLD = 5

_MAX_ITEMS = 20


@router.get("", response_model=AlertsResponse)
async def get_alerts(request: Request):
    """Alertas calculadas en vivo (sin estado de leído/descartado): stock
    bajo de productos activos y pedidos pendientes de pago."""
    require_user(request)
    db = get_db()
    tenant_id = getattr(request.state, "tenant_id", None)

    product_filter: dict = {
        "deleted_at": None,
        "status": "active",
        # El stock de un combo se calcula de sus componentes, no se controla aquí
        "product_type": {"$ne": "combo"},
        "stock": {"$lte": LOW_STOCK_THRESHOLD},
    }
    if tenant_id:
        product_filter["tenant_id"] = tenant_id

    low_stock_count = await db.products.count_documents(product_filter)
    low_stock_docs = await (
        db.products.find(product_filter).sort("stock", 1).limit(_MAX_ITEMS).to_list(_MAX_ITEMS)
    )

    category_ids = {d["category_id"] for d in low_stock_docs if d.get("category_id")}
    category_names: dict[str, str] = {}
    if category_ids:
        oids = []
        for cid in category_ids:
            try:
                oids.append(ObjectId(cid))
            except Exception:
                continue
        if oids:
            cat_docs = await db.categories.find({"_id": {"$in": oids}}).to_list(len(oids))
            category_names = {str(c["_id"]): c["name"] for c in cat_docs}

    low_stock = [
        {
            "product_id": str(d["_id"]),
            "title": d["title"],
            "image_url": d["images"][0] if d.get("images") else None,
            "stock": d.get("stock", 0),
            "category_name": category_names.get(d.get("category_id")),
        }
        for d in low_stock_docs
    ]

    order_filter: dict = {"deleted_at": None, "status": "pending_payment"}
    if tenant_id:
        order_filter["tenant_id"] = tenant_id

    new_orders_count = await db.orders.count_documents(order_filter)
    order_docs = await (
        db.orders.find(order_filter).sort("created_at", -1).limit(_MAX_ITEMS).to_list(_MAX_ITEMS)
    )

    new_orders = [
        {
            "order_id": str(d["_id"]),
            "order_number": d["order_number"],
            "buyer_name": d["buyer_name"],
            "total": d["total"],
            "created_at": d["created_at"],
        }
        for d in order_docs
    ]

    return {
        "low_stock": low_stock,
        "low_stock_count": low_stock_count,
        "new_orders": new_orders,
        "new_orders_count": new_orders_count,
    }
