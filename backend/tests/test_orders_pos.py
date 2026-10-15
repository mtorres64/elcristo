"""Tests de la venta POS (`POST /orders/pos`).

A diferencia de `create_order` (checkout online, Getnet), acá se llama
directo a `orders_router.create_pos_sale` con un `_FakeRequest` liviano,
igual que el resto de los tests de este módulo. El pago ya se hizo in situ
(efectivo/posnet físico), así que la venta nace `paid` y el stock se
descuenta en la misma llamada — no hay webhook ni integración de pago
involucrada.
"""

from datetime import UTC, datetime
from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi import BackgroundTasks, HTTPException

from app.routers import orders as orders_router
from app.schemas.order import OrderCreatePos, OrderItemIn, OrderPaymentSplitIn


class _FakeRequest:
    def __init__(self, *, user_id: str = "seller-1", role: str = "seller"):
        self.state = SimpleNamespace(current_user={"sub": user_id, "role": role})


async def _seed_buyer(db, *, name: str = "Juana Pérez", email: str = "buyer@test.com") -> str:
    now = datetime.now(UTC)
    result = await db.users.insert_one({
        "email": email, "name": name, "role": "buyer",
        "hashed_password": "x", "is_active": True,
        "created_at": now, "updated_at": now, "deleted_at": None,
    })
    return str(result.inserted_id)


async def _seed_product(
    db, *, tenant_id: str, title: str = "Maceta de barro", price: int = 5000, stock: int = 10,
    product_type: str = "simple", combo_items: list[dict] | None = None,
) -> str:
    now = datetime.now(UTC)
    doc = {
        "tenant_id": tenant_id, "title": title, "price": price, "stock": stock,
        "product_type": product_type,
        "created_at": now, "updated_at": now, "deleted_at": None,
    }
    if product_type == "combo":
        doc["combo_items"] = combo_items or []
        doc["stock"] = 0
    result = await db.products.insert_one(doc)
    return str(result.inserted_id)


def _item(product_id: str, *, price: int = 5000, quantity: int = 1, title: str = "Maceta de barro") -> OrderItemIn:
    return OrderItemIn(product_id=product_id, title=title, price=price, quantity=quantity)


@pytest.fixture(autouse=True)
def _patch_db(monkeypatch, db):
    monkeypatch.setattr(orders_router, "get_db", lambda: db)


async def _seed_no_pickup_discount(db, *, tenant_id: str) -> None:
    """Por default `pickup_discount_pct` es 5% (ver ShippingSettings) — se
    desactiva acá para que los tests de retiro en el local puedan comparar
    el total exacto sin tener en cuenta ese descuento automático."""
    now = datetime.now(UTC)
    await db.store_settings.insert_one({
        "tenant_id": tenant_id,
        "shipping": {"pickup_discount_pct": 0, "zones": []},
        "created_at": now, "updated_at": now,
    })


@pytest.mark.asyncio
async def test_pos_sale_registered_buyer_pickup_cash(db):
    tenant_id = "tienda-pos-1"
    buyer_id = await _seed_buyer(db)
    product_id = await _seed_product(db, tenant_id=tenant_id, price=5000, stock=3)
    await _seed_no_pickup_discount(db, tenant_id=tenant_id)

    body = OrderCreatePos(
        items=[_item(product_id)],
        buyer_id=buyer_id,
        pickup=True,
        payments=[OrderPaymentSplitIn(method="efectivo", amount=5000)],
    )
    result = await orders_router.create_pos_sale(body, _FakeRequest(), BackgroundTasks())

    assert result["status"] == "paid"
    assert result["total"] == 5000

    order = await db.orders.find_one({"_id": ObjectId(result["order_id"])})
    assert order["channel"] == "pos"
    assert order["buyer_id"] == buyer_id
    assert order["payment"]["provider"] == "pos"
    assert order["payment"]["status"] == "approved"
    assert order["stock_decremented"] is True
    assert order["shipping_address"] is None

    product = await db.products.find_one({"_id": ObjectId(product_id)})
    assert product["stock"] == 2


@pytest.mark.asyncio
async def test_pos_sale_guest_customer_with_shipping_zone(db):
    tenant_id = "tienda-pos-2"
    product_id = await _seed_product(db, tenant_id=tenant_id, price=5000, stock=5)
    now = datetime.now(UTC)
    await db.store_settings.insert_one({
        "tenant_id": tenant_id,
        "shipping": {
            "pickup_discount_pct": 0,
            "zones": [{"id": "zona-1", "name": "Zona Norte", "cost": 800, "free_from": None}],
        },
        "created_at": now, "updated_at": now,
    })

    body = OrderCreatePos(
        items=[_item(product_id)],
        guest_name="Cliente Ocasional",
        guest_phone="1133445566",
        pickup=False,
        shipping_zone_id="zona-1",
        shipping_address={
            "full_name": "Cliente Ocasional", "phone": "1133445566",
            "street": "Calle Falsa 123", "province": "Buenos Aires", "locality": "CABA",
            "lat": -34.6, "lng": -58.4,
        },
        payments=[OrderPaymentSplitIn(method="transferencia", amount=5800)],
    )
    result = await orders_router.create_pos_sale(body, _FakeRequest(), BackgroundTasks())

    assert result["total"] == 5800
    order = await db.orders.find_one({"_id": ObjectId(result["order_id"])})
    assert order["buyer_id"] is None
    assert order["guest_name"] == "Cliente Ocasional"
    assert order["guest_phone"] == "1133445566"
    assert order["shipping_cost"] == 800
    assert order["shipping_address"]["street"] == "Calle Falsa 123"


@pytest.mark.asyncio
async def test_pos_sale_combo_decrements_component_stock(db):
    tenant_id = "tienda-pos-combo"
    component_id = await _seed_product(db, tenant_id=tenant_id, title="Maceta", price=1000, stock=10)
    combo_id = await _seed_product(
        db, tenant_id=tenant_id, title="Combo maceta x2", price=1800, product_type="combo",
        combo_items=[{"product_id": component_id, "quantity": 2}],
    )
    await _seed_no_pickup_discount(db, tenant_id=tenant_id)

    body = OrderCreatePos(
        items=[_item(combo_id, price=1800, title="Combo maceta x2")],
        guest_name="Walk In", guest_phone="111",
        pickup=True,
        payments=[OrderPaymentSplitIn(method="efectivo", amount=1800)],
    )
    await orders_router.create_pos_sale(body, _FakeRequest(), BackgroundTasks())

    component = await db.products.find_one({"_id": ObjectId(component_id)})
    assert component["stock"] == 8  # 10 - 2 (1 combo vendido x2 por combo)


@pytest.mark.asyncio
async def test_pos_sale_insufficient_stock_blocks_and_creates_nothing(db):
    tenant_id = "tienda-pos-stock"
    product_id = await _seed_product(db, tenant_id=tenant_id, price=5000, stock=1)

    before = await db.orders.count_documents({})
    body = OrderCreatePos(
        items=[_item(product_id, quantity=2)],
        guest_name="Walk In", guest_phone="111",
        pickup=True,
        payments=[OrderPaymentSplitIn(method="efectivo", amount=10000)],
    )
    with pytest.raises(HTTPException) as exc_info:
        await orders_router.create_pos_sale(body, _FakeRequest(), BackgroundTasks())
    assert exc_info.value.status_code == 400

    after = await db.orders.count_documents({})
    assert after == before
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    assert product["stock"] == 1


@pytest.mark.asyncio
async def test_pos_sale_payment_sum_mismatch_rejected(db):
    tenant_id = "tienda-pos-mismatch"
    product_id = await _seed_product(db, tenant_id=tenant_id, price=5000, stock=5)

    body = OrderCreatePos(
        items=[_item(product_id)],
        guest_name="Walk In", guest_phone="111",
        pickup=True,
        payments=[OrderPaymentSplitIn(method="efectivo", amount=3000)],
    )
    with pytest.raises(HTTPException) as exc_info:
        await orders_router.create_pos_sale(body, _FakeRequest(), BackgroundTasks())
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_pos_sale_split_payment_and_manual_discount(db):
    tenant_id = "tienda-pos-split"
    product_id = await _seed_product(db, tenant_id=tenant_id, price=10000, stock=5)
    await _seed_no_pickup_discount(db, tenant_id=tenant_id)

    body = OrderCreatePos(
        items=[_item(product_id, price=10000)],
        guest_name="Walk In", guest_phone="111",
        pickup=True,
        discount_type="percent", discount_value=10,   # -1000
        payments=[
            OrderPaymentSplitIn(method="efectivo", amount=4000),
            OrderPaymentSplitIn(method="credito", amount=5000, installments=3),
        ],
    )
    result = await orders_router.create_pos_sale(body, _FakeRequest(), BackgroundTasks())
    assert result["total"] == 9000

    order = await db.orders.find_one({"_id": ObjectId(result["order_id"])})
    assert order["discount"] == 1000
    assert len(order["payments"]) == 2
    assert order["payments"][1]["installments"] == 3


@pytest.mark.asyncio
async def test_pos_sale_rejects_non_seller(db):
    tenant_id = "tienda-pos-auth"
    product_id = await _seed_product(db, tenant_id=tenant_id, price=5000, stock=5)

    body = OrderCreatePos(
        items=[_item(product_id)],
        guest_name="Walk In", guest_phone="111",
        pickup=True,
        payments=[OrderPaymentSplitIn(method="efectivo", amount=5000)],
    )
    with pytest.raises(HTTPException) as exc_info:
        await orders_router.create_pos_sale(body, _FakeRequest(role="buyer"), BackgroundTasks())
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_pos_sale_mixed_tenant_cart_rejected(db):
    product_a = await _seed_product(db, tenant_id="tienda-a", price=1000, stock=5)
    product_b = await _seed_product(db, tenant_id="tienda-b", price=1000, stock=5)

    body = OrderCreatePos(
        items=[_item(product_a, price=1000), _item(product_b, price=1000)],
        guest_name="Walk In", guest_phone="111",
        pickup=True,
        payments=[OrderPaymentSplitIn(method="efectivo", amount=2000)],
    )
    with pytest.raises(HTTPException) as exc_info:
        await orders_router.create_pos_sale(body, _FakeRequest(), BackgroundTasks())
    assert exc_info.value.status_code == 400
