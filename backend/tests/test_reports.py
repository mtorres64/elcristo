"""Tests de agregación de reportes.

Ejercitan las funciones puras (`compute_sales`, `compute_purchases`,
`compute_margins`, `_parse_range`) y un happy-path del endpoint contra la
fixture `db` (mismo patrón que test_integrations.py: monkeypatch de `get_db`
+ Request liviano).
"""

from datetime import UTC, date, datetime, timedelta
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.routers import reports as reports_router
from app.routers.reports import (
    _parse_range,
    _split_product_ref,
    compute_margins,
    compute_purchases,
    compute_sales,
)


class _FakeRequest:
    def __init__(self, *, role: str = "seller", tenant_id: str | None = None):
        self.state = SimpleNamespace(
            current_user={"sub": "user-1", "role": role}, tenant_id=tenant_id
        )


def _order(status: str, total: int, day: date, items: list[dict]):
    return {
        "status": status,
        "total": total,
        "created_at": datetime(day.year, day.month, day.day, 12, tzinfo=UTC),
        "items": items,
    }


# ─── _parse_range ────────────────────────────────────────────────

def test_parse_range_defaults_to_last_30_days():
    start, end = _parse_range(None, None)
    assert end == datetime.now(UTC).date()
    assert (end - start).days == 29


def test_parse_range_rejects_inverted_range():
    with pytest.raises(HTTPException) as exc:
        _parse_range("2026-02-01", "2026-01-01")
    assert exc.value.status_code == 400


def test_parse_range_rejects_bad_format():
    with pytest.raises(HTTPException):
        _parse_range("01/02/2026", None)


# ─── _split_product_ref ──────────────────────────────────────────

def test_split_product_ref_variants():
    assert _split_product_ref("abc123") == ("abc123", None)
    assert _split_product_ref("abc123__grande__pot9") == ("abc123", "grande")
    assert _split_product_ref("abc123__sin-maceta") == ("abc123", None)


# ─── compute_sales ───────────────────────────────────────────────

def test_compute_sales_only_counts_revenue_statuses():
    start = date(2026, 1, 1)
    end = date(2026, 1, 3)
    orders = [
        _order("paid", 10_000, date(2026, 1, 1), [{"quantity": 2}]),
        _order("delivered", 5_000, date(2026, 1, 2), [{"quantity": 1}]),
        _order("pending_payment", 99_000, date(2026, 1, 2), [{"quantity": 3}]),
        _order("cancelled", 99_000, date(2026, 1, 3), [{"quantity": 1}]),
    ]
    out = compute_sales(orders, start, end)

    assert out["revenue"] == 15_000
    assert out["order_count"] == 2
    assert out["units"] == 3
    assert out["avg_ticket"] == 7_500
    assert len(out["by_day"]) == 3
    assert out["by_day"][0] == {"date": start, "revenue": 10_000, "orders": 1, "units": 2}
    statuses = {s["status"]: s for s in out["by_status"]}
    assert statuses["pending_payment"]["count"] == 1
    assert statuses["cancelled"]["total"] == 99_000


def test_compute_sales_empty():
    out = compute_sales([], date(2026, 1, 1), date(2026, 1, 2))
    assert out["revenue"] == 0
    assert out["avg_ticket"] == 0
    assert [d["revenue"] for d in out["by_day"]] == [0, 0]


# ─── compute_purchases ───────────────────────────────────────────

def test_compute_purchases_aggregates_by_day():
    start = date(2026, 3, 1)
    end = date(2026, 3, 2)
    purchases = [
        {"total_cost": 40_000, "total_units": 10,
         "created_at": datetime(2026, 3, 1, 9, tzinfo=UTC)},
        {"total_cost": 60_000, "total_units": 5,
         "created_at": datetime(2026, 3, 2, 9, tzinfo=UTC)},
    ]
    out = compute_purchases(purchases, start, end)
    assert out["total_cost"] == 100_000
    assert out["purchase_count"] == 2
    assert out["units"] == 15
    assert out["by_day"][1] == {"date": end, "cost": 60_000, "units": 5}


# ─── compute_margins ─────────────────────────────────────────────

def test_compute_margins_joins_current_cost():
    products = {
        "p1": {"_id": "p1", "cost_price": 3_000,
               "variants": [{"key": "size", "value": "grande", "cost_price_override": 5_000}]},
        "p2": {"_id": "p2", "cost_price": None},
    }
    orders = [
        _order("paid", 0, date(2026, 1, 1), [
            {"product_id": "p1", "title": "Ficus", "price": 10_000, "quantity": 2},
            {"product_id": "p1__grande__x", "title": "Ficus", "price": 15_000, "quantity": 1},
            {"product_id": "p2", "title": "Sin costo", "price": 8_000, "quantity": 1},
        ]),
        _order("pending_payment", 0, date(2026, 1, 1), [
            {"product_id": "p1", "title": "Ficus", "price": 10_000, "quantity": 99},
        ]),
    ]
    out = compute_margins(orders, products)

    # revenue = 20_000 + 15_000 + 8_000 (el pedido pending no cuenta)
    assert out["revenue"] == 43_000
    # cogs = 2*3_000 + 1*5_000 (variante) + 0 (p2 sin costo)
    assert out["cogs"] == 11_000
    assert out["gross_profit"] == 32_000
    assert out["items_without_cost"] == 1
    top = out["by_product"][0]
    assert top["product_id"] == "p1"
    assert top["units"] == 3
    assert top["revenue"] == 35_000
    assert top["cogs"] == 11_000
    assert top["margin_pct"] == round(24_000 / 35_000 * 100, 2)


# ─── endpoint ────────────────────────────────────────────────────
# `_patch_db` no es autouse a propósito: los tests puros de arriba no deben
# arrastrar la fixture `db` (conexión a Mongo) sólo por estar en el archivo.

@pytest.fixture
def _patch_db(monkeypatch, db):
    monkeypatch.setattr(reports_router, "get_db", lambda: db)


@pytest.mark.asyncio
async def test_overview_requires_seller_role():
    # El chequeo de rol ocurre antes de tocar la base, no hace falta `_patch_db`.
    with pytest.raises(HTTPException) as exc:
        await reports_router.reports_overview(_FakeRequest(role="buyer"))
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_overview_happy_path(db, _patch_db):
    today = datetime.now(UTC)
    prod = await db.products.insert_one(
        {"tenant_id": "default", "title": "Ficus", "price": 10_000,
         "cost_price": 4_000, "variants": [], "deleted_at": None}
    )
    pid = str(prod.inserted_id)
    await db.orders.insert_many([
        {"tenant_id": "default", "status": "paid", "total": 20_000, "deleted_at": None,
         "created_at": today - timedelta(days=1),
         "items": [{"product_id": pid, "title": "Ficus", "price": 10_000, "quantity": 2}]},
        {"tenant_id": "default", "status": "pending_payment", "total": 10_000, "deleted_at": None,
         "created_at": today - timedelta(days=1),
         "items": [{"product_id": pid, "title": "Ficus", "price": 10_000, "quantity": 1}]},
    ])
    await db.purchases.insert_one(
        {"tenant_id": "default", "total_cost": 8_000, "total_units": 2, "deleted_at": None,
         "created_at": today - timedelta(days=2)}
    )

    # Llamada directa (sin FastAPI): hay que pasar los defaults de Query a mano.
    out = await reports_router.reports_overview(
        _FakeRequest(tenant_id="default"), date_from=None, date_to=None, tenant_id="default"
    )

    assert out["sales"]["revenue"] == 20_000
    assert out["sales"]["order_count"] == 1
    assert out["purchases"]["total_cost"] == 8_000
    assert out["margins"]["cogs"] == 8_000        # 2 unidades * 4_000
    assert out["margins"]["gross_profit"] == 12_000
    assert out["margins"]["by_product"][0]["product_id"] == pid
