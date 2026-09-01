"""Reportes del panel de administración: ventas, compras y márgenes.

Un único endpoint (`GET /reports/overview`) que agrega, para un rango de fechas,
los pedidos y las compras del tenant. La lógica de agregación vive en funciones
puras (`compute_sales`, `compute_purchases`, `compute_margins`) para poder
testearlas sin base de datos.

El margen se calcula uniendo cada línea de pedido con el costo *actual* del
producto (o de su variante de tamaño). Es una aproximación: el pedido no
guarda un snapshot del costo, y el extra de la maceta no se descuenta del
costo. Las líneas sin costo cargado se informan aparte (`items_without_cost`).
"""

from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, HTTPException, Query, Request

from app.database import get_db
from app.schemas.report import ReportOverview
from app.utils.auth_deps import require_user

router = APIRouter()

# Estados en los que el pedido representa una venta efectiva (se cobró / se
# está preparando / se despachó / se entregó). Los pending/cancelled/refunded/
# disputed quedan fuera de la facturación pero sí aparecen en `by_status`.
REVENUE_STATUSES = frozenset({"paid", "preparing", "shipped", "delivered"})

_SIZE_VALUES = frozenset({"pequeña", "mediana", "grande"})
_MAX_MARGIN_ROWS = 20
_MAX_RANGE_DAYS = 366


def _require_seller(request: Request) -> dict:
    user = require_user(request)
    if user.get("role") not in ("seller", "platform_admin"):
        raise HTTPException(403, "No tenés permisos para ver reportes")
    return user


def _parse_range(date_from: str | None, date_to: str | None) -> tuple[date, date]:
    today = datetime.now(UTC).date()
    try:
        end = date.fromisoformat(date_to) if date_to else today
        start = date.fromisoformat(date_from) if date_from else end - timedelta(days=29)
    except ValueError:
        raise HTTPException(400, "Fechas inválidas (usar formato YYYY-MM-DD)") from None
    if start > end:
        raise HTTPException(400, "La fecha de inicio no puede ser posterior a la de fin")
    if (end - start).days > _MAX_RANGE_DAYS:
        raise HTTPException(400, f"El rango no puede superar {_MAX_RANGE_DAYS} días")
    return start, end


def _day_range(start: date, end: date) -> list[date]:
    return [start + timedelta(days=i) for i in range((end - start).days + 1)]


def _as_date(value) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return None


def _split_product_ref(ref: str) -> tuple[str, str | None]:
    """`<id>__<size>__<pot>` (lo arma el carrito) → (id_real, tamaño|None)."""
    parts = ref.split("__")
    size = parts[1] if len(parts) > 1 and parts[1] in _SIZE_VALUES else None
    return parts[0], size


def compute_sales(orders: list[dict], start: date, end: date) -> dict:
    days = {d: {"revenue": 0, "orders": 0, "units": 0} for d in _day_range(start, end)}
    by_status: dict[str, dict] = {}
    revenue = order_count = units = 0

    for o in orders:
        status = o.get("status", "unknown")
        total = o.get("total", 0)
        bucket = by_status.setdefault(status, {"count": 0, "total": 0})
        bucket["count"] += 1
        bucket["total"] += total

        if status not in REVENUE_STATUSES:
            continue

        order_units = sum(i.get("quantity", 0) for i in o.get("items", []))
        revenue += total
        order_count += 1
        units += order_units

        d = _as_date(o.get("created_at"))
        if d in days:
            days[d]["revenue"] += total
            days[d]["orders"] += 1
            days[d]["units"] += order_units

    return {
        "revenue": revenue,
        "order_count": order_count,
        "units": units,
        "avg_ticket": round(revenue / order_count) if order_count else 0,
        "by_day": [{"date": d, **v} for d, v in days.items()],
        "by_status": [
            {"status": s, "count": v["count"], "total": v["total"]}
            for s, v in sorted(by_status.items(), key=lambda kv: kv[1]["total"], reverse=True)
        ],
    }


def compute_purchases(purchases: list[dict], start: date, end: date) -> dict:
    days = {d: {"cost": 0, "units": 0} for d in _day_range(start, end)}
    total_cost = purchase_count = units = 0

    for p in purchases:
        cost = p.get("total_cost", 0)
        p_units = p.get("total_units", 0)
        total_cost += cost
        purchase_count += 1
        units += p_units

        d = _as_date(p.get("created_at"))
        if d in days:
            days[d]["cost"] += cost
            days[d]["units"] += p_units

    return {
        "total_cost": total_cost,
        "purchase_count": purchase_count,
        "units": units,
        "by_day": [{"date": d, **v} for d, v in days.items()],
    }


def _resolve_unit_cost(product: dict | None, size: str | None) -> int | None:
    if not product:
        return None
    if size and size != "mediana":
        variant = next(
            (v for v in product.get("variants", [])
             if v.get("key") == "size" and v.get("value") == size),
            None,
        )
        if variant and variant.get("cost_price_override"):
            return variant["cost_price_override"]
    return product.get("cost_price")


def compute_margins(orders: list[dict], products_by_id: dict[str, dict]) -> dict:
    rows: dict[str, dict] = {}
    revenue = cogs = items_without_cost = 0

    for o in orders:
        if o.get("status") not in REVENUE_STATUSES:
            continue
        for item in o.get("items", []):
            base_id, size = _split_product_ref(item.get("product_id", ""))
            qty = item.get("quantity", 0)
            line_revenue = item.get("price", 0) * qty
            unit_cost = _resolve_unit_cost(products_by_id.get(base_id), size)
            if unit_cost is None:
                items_without_cost += 1
                line_cogs = 0
            else:
                line_cogs = unit_cost * qty

            revenue += line_revenue
            cogs += line_cogs

            row = rows.setdefault(
                base_id,
                {"title": item.get("title", "—"), "units": 0, "revenue": 0, "cogs": 0},
            )
            row["units"] += qty
            row["revenue"] += line_revenue
            row["cogs"] += line_cogs

    by_product = []
    for pid, row in sorted(rows.items(), key=lambda kv: kv[1]["revenue"], reverse=True):
        profit = row["revenue"] - row["cogs"]
        by_product.append({
            "product_id": pid,
            "title": row["title"],
            "units": row["units"],
            "revenue": row["revenue"],
            "cogs": row["cogs"],
            "profit": profit,
            "margin_pct": round(profit / row["revenue"] * 100, 2) if row["revenue"] else None,
        })

    gross_profit = revenue - cogs
    return {
        "revenue": revenue,
        "cogs": cogs,
        "gross_profit": gross_profit,
        "margin_pct": round(gross_profit / revenue * 100, 2) if revenue else None,
        "items_without_cost": items_without_cost,
        "by_product": by_product[:_MAX_MARGIN_ROWS],
    }


@router.get("/overview", response_model=ReportOverview)
async def reports_overview(
    request: Request,
    date_from: str | None = Query(None, alias="from"),
    date_to: str | None = Query(None, alias="to"),
    tenant_id: str | None = None,
):
    _require_seller(request)
    db = get_db()
    start, end = _parse_range(date_from, date_to)

    start_dt = datetime(start.year, start.month, start.day, tzinfo=UTC)
    end_dt = datetime(end.year, end.month, end.day, 23, 59, 59, 999999, tzinfo=UTC)

    tid = tenant_id or getattr(request.state, "tenant_id", None)
    date_filter = {"deleted_at": None, "created_at": {"$gte": start_dt, "$lte": end_dt}}
    if tid:
        date_filter["tenant_id"] = tid

    orders = await db.orders.find(date_filter).to_list(None)
    purchases = await db.purchases.find(date_filter).to_list(None)

    product_filter: dict = {"deleted_at": None}
    if tid:
        product_filter["tenant_id"] = tid
    products = await db.products.find(product_filter).to_list(None)
    products_by_id = {str(p["_id"]): p for p in products}

    return {
        "date_from": start,
        "date_to": end,
        "sales": compute_sales(orders, start, end),
        "purchases": compute_purchases(purchases, start, end),
        "margins": compute_margins(orders, products_by_id),
    }
