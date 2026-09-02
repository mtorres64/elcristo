"""Tests del checkout con Getnet (create_order / _resolve_payment).

Mismo enfoque que test_integrations.py: se llama directo a `create_order`
(FastAPI la corre igual con un objeto Request liviano — sólo lee
`request.state.current_user`) contra la fixture `db`, y se monkeypatchea
`getnet_client.tokenize_card`/`create_payment` en vez de pegarle a la red
real de Getnet. El número de tarjeta pasa transitoriamente por el backend
(tokenización server-to-server, ver `_charge_with_getnet` en orders.py) así
que estos tests mandan `payment_card` con `security_code`, no un token
generado client-side.
"""

from datetime import UTC, datetime
from types import SimpleNamespace

import pytest
from bson import ObjectId
from cryptography.fernet import Fernet
from fastapi import BackgroundTasks, HTTPException

from app.config import settings
from app.routers import orders as orders_router
from app.schemas.order import OrderCreate, OrderItemIn, PaymentCardIn
from app.utils import getnet_client
from app.utils.crypto import encrypt_secret


class _FakeRequest:
    def __init__(self, *, user_id: str):
        self.state = SimpleNamespace(current_user={"sub": user_id, "role": "buyer"})


def _shipping_address() -> dict:
    return {
        "full_name": "Juana Pérez",
        "phone": "1122334455",
        "street": "Av. Siempre Viva 123",
        "province": "Buenos Aires",
        "locality": "CABA",
    }


async def _seed_buyer(db) -> str:
    now = datetime.now(UTC)
    result = await db.users.insert_one({
        "email": "buyer@test.com", "name": "Juana Pérez", "role": "buyer",
        "hashed_password": "x", "is_active": True,
        "created_at": now, "updated_at": now, "deleted_at": None,
    })
    return str(result.inserted_id)


async def _seed_product(db, *, tenant_id: str, price: int = 5000, stock: int = 10) -> str:
    now = datetime.now(UTC)
    result = await db.products.insert_one({
        "tenant_id": tenant_id, "title": "Maceta de barro", "price": price, "stock": stock,
        "created_at": now, "updated_at": now, "deleted_at": None,
    })
    return str(result.inserted_id)


async def _enable_getnet(db, *, tenant_id: str, client_secret: str = "s3cr3t") -> None:
    now = datetime.now(UTC)
    env_config = {
        "seller_id": "seller-1", "client_id": "client-1",
        "client_secret_encrypted": encrypt_secret(client_secret),
        "last_verified_at": None, "last_verified_ok": None, "last_verified_message": None,
    }
    await db.tenant_integrations.insert_one({
        "tenant_id": tenant_id, "provider": "getnet", "enabled": True,
        "active_environment": "sandbox", "sandbox": env_config, "production": {},
        "created_at": now, "updated_at": now, "deleted_at": None,
    })


def _order_body(*, product_id: str, price: int, security_code: str | None = "123") -> OrderCreate:
    item = OrderItemIn(product_id=product_id, title="Maceta de barro", price=price, quantity=1)
    card = PaymentCardIn(
        card_number="4111111111111111", holder_name="Juana Pérez",
        exp_month=12, exp_year=2030, security_code=security_code,
    )
    return OrderCreate(items=[item], shipping_address=_shipping_address(), payment_card=card)


def _mock_getnet_calls(monkeypatch, *, payment_result: getnet_client.GetnetPaymentResult) -> None:
    async def fake_tokenize_card(cfg, tid, **kwargs):
        return getnet_client.GetnetTokenizeResult(number_token="tok_abc123")

    async def fake_create_payment(cfg, tid, **kwargs):
        return payment_result

    monkeypatch.setattr(getnet_client, "tokenize_card", fake_tokenize_card)
    monkeypatch.setattr(getnet_client, "create_payment", fake_create_payment)


@pytest.fixture(autouse=True)
def _encryption_key(monkeypatch):
    monkeypatch.setattr(settings, "integrations_encryption_key", Fernet.generate_key().decode())


@pytest.mark.asyncio
async def test_mock_checkout_unchanged_without_getnet(db):
    """Regresión: un tenant sin integración de Getnet sigue naciendo pending_payment."""
    user_id = await _seed_buyer(db)
    tenant_id = "tienda-sin-getnet"
    product_id = await _seed_product(db, tenant_id=tenant_id, price=5000, stock=3)

    body = _order_body(product_id=product_id, price=5000, security_code=None)
    result = await orders_router.create_order(
        body, _FakeRequest(user_id=user_id), BackgroundTasks()
    )

    assert result["status"] == "pending_payment"

    order = await db.orders.find_one({"_id": ObjectId(result["order_id"])})
    assert order["payment"]["provider"] == "mock"
    assert order["stock_decremented"] is False

    product = await db.products.find_one({"_id": ObjectId(product_id)})
    assert product["stock"] == 3  # no se tocó: sólo se descuenta stock en status "paid"


@pytest.mark.asyncio
async def test_getnet_approved_creates_paid_order_and_decrements_stock(db, monkeypatch):
    user_id = await _seed_buyer(db)
    tenant_id = "tienda-getnet-ok"
    product_id = await _seed_product(db, tenant_id=tenant_id, price=5000, stock=3)
    await _enable_getnet(db, tenant_id=tenant_id)

    _mock_getnet_calls(monkeypatch, payment_result=getnet_client.GetnetPaymentResult(
        payment_id="pay_123", status="APPROVED", authorization_code="AUTH1",
        brand="MASTERCARD", last4=None,
    ))

    body = _order_body(product_id=product_id, price=5000)
    result = await orders_router.create_order(
        body, _FakeRequest(user_id=user_id), BackgroundTasks()
    )

    assert result["status"] == "paid"

    order = await db.orders.find_one({"_id": ObjectId(result["order_id"])})
    assert order["payment"]["provider"] == "getnet"
    assert order["payment"]["payment_id"] == "pay_123"
    assert order["payment"]["status"] == "approved"
    assert order["payment"]["last4"] == "1111"  # derivado del card_number, no de Getnet
    assert order["stock_decremented"] is True

    product = await db.products.find_one({"_id": ObjectId(product_id)})
    assert product["stock"] == 2  # se descontó una sola vez


@pytest.mark.asyncio
async def test_getnet_rejected_creates_no_order(db, monkeypatch):
    user_id = await _seed_buyer(db)
    tenant_id = "tienda-getnet-rechazo"
    product_id = await _seed_product(db, tenant_id=tenant_id, price=5000, stock=3)
    await _enable_getnet(db, tenant_id=tenant_id)

    _mock_getnet_calls(monkeypatch, payment_result=getnet_client.GetnetPaymentResult(
        payment_id="pay_999", status="DENIED", authorization_code=None, brand=None, last4=None,
    ))

    before_count = await db.orders.count_documents({})
    body = _order_body(product_id=product_id, price=5000)

    with pytest.raises(HTTPException) as exc_info:
        await orders_router.create_order(body, _FakeRequest(user_id=user_id), BackgroundTasks())
    assert exc_info.value.status_code == 402

    after_count = await db.orders.count_documents({})
    assert after_count == before_count  # ningún pedido "fantasma" no pagado

    product = await db.products.find_one({"_id": ObjectId(product_id)})
    assert product["stock"] == 3  # tampoco se tocó el stock


@pytest.mark.asyncio
async def test_getnet_tokenize_error_creates_no_order(db, monkeypatch):
    user_id = await _seed_buyer(db)
    tenant_id = "tienda-getnet-tokenize-error"
    product_id = await _seed_product(db, tenant_id=tenant_id, price=5000, stock=3)
    await _enable_getnet(db, tenant_id=tenant_id)

    async def fake_tokenize_card(cfg, tid, **kwargs):
        raise getnet_client.GetnetError("No se pudo tokenizar la tarjeta")

    monkeypatch.setattr(getnet_client, "tokenize_card", fake_tokenize_card)

    before_count = await db.orders.count_documents({})
    body = _order_body(product_id=product_id, price=5000)

    with pytest.raises(HTTPException) as exc_info:
        await orders_router.create_order(body, _FakeRequest(user_id=user_id), BackgroundTasks())
    assert exc_info.value.status_code == 502

    after_count = await db.orders.count_documents({})
    assert after_count == before_count


@pytest.mark.asyncio
async def test_getnet_gateway_error_creates_no_order(db, monkeypatch):
    user_id = await _seed_buyer(db)
    tenant_id = "tienda-getnet-timeout"
    product_id = await _seed_product(db, tenant_id=tenant_id, price=5000, stock=3)
    await _enable_getnet(db, tenant_id=tenant_id)

    async def fake_tokenize_card(cfg, tid, **kwargs):
        return getnet_client.GetnetTokenizeResult(number_token="tok_abc123")

    async def fake_create_payment(cfg, tid, **kwargs):
        raise getnet_client.GetnetError("La pasarela de pago no respondió a tiempo")

    monkeypatch.setattr(getnet_client, "tokenize_card", fake_tokenize_card)
    monkeypatch.setattr(getnet_client, "create_payment", fake_create_payment)

    before_count = await db.orders.count_documents({})
    body = _order_body(product_id=product_id, price=5000)

    with pytest.raises(HTTPException) as exc_info:
        await orders_router.create_order(body, _FakeRequest(user_id=user_id), BackgroundTasks())
    assert exc_info.value.status_code == 502

    after_count = await db.orders.count_documents({})
    assert after_count == before_count


@pytest.mark.asyncio
async def test_missing_security_code_when_getnet_enabled(db):
    user_id = await _seed_buyer(db)
    tenant_id = "tienda-getnet-sin-cvv"
    product_id = await _seed_product(db, tenant_id=tenant_id, price=5000, stock=3)
    await _enable_getnet(db, tenant_id=tenant_id)

    # Tarjeta sin CVV — Getnet lo exige para cobrar (no para tokenizar).
    body = _order_body(product_id=product_id, price=5000, security_code=None)

    with pytest.raises(HTTPException) as exc_info:
        await orders_router.create_order(body, _FakeRequest(user_id=user_id), BackgroundTasks())
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_saved_mock_card_rejected_when_getnet_enabled(db):
    user_id = await _seed_buyer(db)
    tenant_id = "tienda-getnet-tarjeta-guardada"
    product_id = await _seed_product(db, tenant_id=tenant_id, price=5000, stock=3)
    await _enable_getnet(db, tenant_id=tenant_id)

    now = datetime.now(UTC)
    pm = await db.payment_methods.insert_one({
        "user_id": user_id, "type": "card", "brand": "visa", "holder_name": "Juana Pérez",
        "last4": "1111", "exp_month": 12, "exp_year": 2030, "is_default": True,
        "created_at": now, "updated_at": now, "deleted_at": None,
    })

    item = OrderItemIn(product_id=product_id, title="Maceta de barro", price=5000, quantity=1)
    body = OrderCreate(
        items=[item], shipping_address=_shipping_address(),
        payment_method_id=str(pm.inserted_id),
    )

    with pytest.raises(HTTPException) as exc_info:
        await orders_router.create_order(body, _FakeRequest(user_id=user_id), BackgroundTasks())
    assert exc_info.value.status_code == 400
