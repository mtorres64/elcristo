"""Tests del router de integraciones (config de Getnet por tenant, con
credenciales separadas por ambiente).

Llaman directo a las funciones del router (mismo espíritu que test_tenancy.py,
que ejercita BaseRepository directo contra la fixture `db`) en vez de levantar
la app completa por ASGI: FastAPI corre `connect_db()` recién en el lifespan,
y este repo no tiene todavía un fixture de cliente HTTP de tests — armar uno
nuevo sin poder correrlo contra Mongo en este entorno (sin Docker disponible)
sería un patrón sin verificar. Se monkeypatchea `get_db` para apuntar a la
fixture `db` (misma base de test que usa `conftest.py`) y se arma un objeto
`Request` liviano con sólo lo que el router lee (`request.state`).
"""

from types import SimpleNamespace

import pytest
from cryptography.fernet import Fernet
from fastapi import HTTPException

from app.config import settings
from app.routers import integrations as integrations_router
from app.schemas.integration import GetnetEnvCredentialsUpdate, GetnetIntegrationUpdate


class _FakeRequest:
    def __init__(self, *, role: str = "seller", tenant_id: str = "default"):
        self.state = SimpleNamespace(
            current_user={"sub": "user-1", "role": role}, tenant_id=tenant_id
        )


def _creds(
    *, seller_id="seller-1", client_id="client-1", client_secret=None
) -> GetnetEnvCredentialsUpdate:
    return GetnetEnvCredentialsUpdate(
        seller_id=seller_id, client_id=client_id, client_secret=client_secret
    )


def _empty_creds() -> GetnetEnvCredentialsUpdate:
    return GetnetEnvCredentialsUpdate(seller_id="", client_id="")


@pytest.fixture(autouse=True)
def _encryption_key(monkeypatch):
    monkeypatch.setattr(settings, "integrations_encryption_key", Fernet.generate_key().decode())


@pytest.fixture(autouse=True)
def _patch_db(monkeypatch, db):
    monkeypatch.setattr(integrations_router, "get_db", lambda: db)


@pytest.mark.asyncio
async def test_get_without_config_returns_defaults():
    out = await integrations_router.get_getnet_integration(_FakeRequest())
    assert out["enabled"] is False
    assert out["active_environment"] == "sandbox"
    assert out["sandbox"]["client_secret_set"] is False
    assert out["production"]["client_secret_set"] is False


@pytest.mark.asyncio
async def test_put_requires_secret_of_active_env_to_enable():
    body = GetnetIntegrationUpdate(
        enabled=True, active_environment="sandbox",
        sandbox=_creds(client_secret=None), production=_empty_creds(),
    )
    with pytest.raises(HTTPException) as exc_info:
        await integrations_router.update_getnet_integration(body, _FakeRequest())
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_put_does_not_require_secret_of_inactive_env():
    """Se puede activar sandbox sin haber cargado nada de producción todavía."""
    body = GetnetIntegrationUpdate(
        enabled=True, active_environment="sandbox",
        sandbox=_creds(client_secret="s3cr3t"), production=_empty_creds(),
    )
    out = await integrations_router.update_getnet_integration(body, _FakeRequest())
    assert out["enabled"] is True
    assert out["sandbox"]["client_secret_set"] is True
    assert out["production"]["client_secret_set"] is False


@pytest.mark.asyncio
async def test_environments_are_stored_independently(db):
    """Guardar sandbox no debe pisar producción, y viceversa."""
    first = GetnetIntegrationUpdate(
        enabled=False, active_environment="sandbox",
        sandbox=_creds(seller_id="sbx-seller", client_id="sbx-client", client_secret="sbx-secret"),
        production=_empty_creds(),
    )
    await integrations_router.update_getnet_integration(first, _FakeRequest())

    second = GetnetIntegrationUpdate(
        enabled=True, active_environment="production",
        sandbox=_creds(seller_id="sbx-seller", client_id="sbx-client", client_secret=None),
        production=_creds(
            seller_id="prod-seller", client_id="prod-client", client_secret="prod-secret"
        ),
    )
    out = await integrations_router.update_getnet_integration(second, _FakeRequest())

    assert out["active_environment"] == "production"
    assert out["sandbox"]["seller_id"] == "sbx-seller"
    assert out["sandbox"]["client_secret_set"] is True  # se mantuvo, no se pisó
    assert out["production"]["seller_id"] == "prod-seller"
    assert out["production"]["client_secret_set"] is True

    doc = await db.tenant_integrations.find_one({"tenant_id": "default", "provider": "getnet"})
    from app.utils.crypto import decrypt_secret

    assert decrypt_secret(doc["sandbox"]["client_secret_encrypted"]) == "sbx-secret"
    assert decrypt_secret(doc["production"]["client_secret_encrypted"]) == "prod-secret"


@pytest.mark.asyncio
async def test_put_resets_verification_of_changed_env_only(db):
    from datetime import UTC, datetime

    first = GetnetIntegrationUpdate(
        enabled=True, active_environment="sandbox",
        sandbox=_creds(client_secret="s3cr3t"), production=_empty_creds(),
    )
    await integrations_router.update_getnet_integration(first, _FakeRequest())

    await db.tenant_integrations.update_one(
        {"tenant_id": "default", "provider": "getnet"},
        {"$set": {
            "sandbox.last_verified_ok": True, "sandbox.last_verified_message": "Conexión exitosa",
            "sandbox.last_verified_at": datetime.now(UTC),
        }},
    )

    # Cambiar sandbox de nuevo debería resetear su verificación.
    changed = GetnetIntegrationUpdate(
        enabled=True, active_environment="sandbox",
        sandbox=_creds(seller_id="seller-2", client_secret=None), production=_empty_creds(),
    )
    out = await integrations_router.update_getnet_integration(changed, _FakeRequest())
    assert out["sandbox"]["last_verified_ok"] is None


@pytest.mark.asyncio
async def test_get_and_put_require_seller_or_admin_role():
    with pytest.raises(HTTPException) as exc_info:
        await integrations_router.get_getnet_integration(_FakeRequest(role="buyer"))
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_public_config_hides_seller_id_when_disabled():
    out = await integrations_router.get_getnet_public_config(_FakeRequest())
    assert out == {"enabled": False, "environment": "sandbox", "seller_id": None}


@pytest.mark.asyncio
async def test_public_config_reflects_active_environment_only():
    body = GetnetIntegrationUpdate(
        enabled=True, active_environment="production",
        sandbox=_creds(seller_id="sbx-seller", client_secret="sbx-secret"),
        production=_creds(seller_id="prod-seller", client_secret="prod-secret"),
    )
    await integrations_router.update_getnet_integration(body, _FakeRequest())

    out = await integrations_router.get_getnet_public_config(_FakeRequest())
    assert out == {"enabled": True, "environment": "production", "seller_id": "prod-seller"}


@pytest.mark.asyncio
async def test_test_connection_requires_saved_config_for_that_env():
    with pytest.raises(HTTPException) as exc_info:
        await integrations_router.test_getnet_connection(_FakeRequest(), environment="sandbox")
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_tenants_are_isolated(db):
    body_a = GetnetIntegrationUpdate(
        enabled=True, active_environment="sandbox",
        sandbox=_creds(seller_id="seller-a", client_id="client-a", client_secret="secret-a"),
        production=_empty_creds(),
    )
    await integrations_router.update_getnet_integration(body_a, _FakeRequest(tenant_id="tienda-a"))

    out_b = await integrations_router.get_getnet_integration(_FakeRequest(tenant_id="tienda-b"))
    assert out_b["enabled"] is False
    assert out_b["sandbox"]["client_secret_set"] is False
