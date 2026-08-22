from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Query, Request

from app.database import get_db
from app.schemas.integration import (
    Environment,
    GetnetIntegrationOut,
    GetnetIntegrationUpdate,
    GetnetPublicConfig,
    GetnetTestConnectionResult,
)
from app.utils import getnet_client
from app.utils.auth_deps import require_user
from app.utils.crypto import CryptoConfigError, decrypt_secret, encrypt_secret

router = APIRouter()

_EMPTY_ENV_CREDS = {
    "seller_id": None, "client_id": None, "client_secret_set": False,
    "last_verified_at": None, "last_verified_ok": None, "last_verified_message": None,
}


def _require_seller_or_admin(request: Request) -> dict:
    user = require_user(request)
    if user.get("role") not in ("seller", "platform_admin"):
        raise HTTPException(403, "No tenés permisos para administrar integraciones")
    return user


def _tenant_id(request: Request) -> str:
    # Mismo patrón que content.py: se resuelve del header/subdominio/JWT que
    # ya inyecta TenantMiddleware, con el mismo fallback "default" que usa el
    # resto de la config por tenant hasta que tenants.py deje de ser un stub.
    return getattr(request.state, "tenant_id", None) or "default"


def _env_out(env_doc: dict | None) -> dict:
    if not env_doc:
        return dict(_EMPTY_ENV_CREDS)
    return {
        "seller_id": env_doc.get("seller_id"),
        "client_id": env_doc.get("client_id"),
        "client_secret_set": bool(env_doc.get("client_secret_encrypted")),
        "last_verified_at": env_doc.get("last_verified_at"),
        "last_verified_ok": env_doc.get("last_verified_ok"),
        "last_verified_message": env_doc.get("last_verified_message"),
    }


def _to_out(doc: dict | None) -> dict:
    if not doc:
        return {
            "enabled": False,
            "active_environment": "sandbox",
            "sandbox": dict(_EMPTY_ENV_CREDS),
            "production": dict(_EMPTY_ENV_CREDS),
            "updated_at": None,
        }
    return {
        "enabled": doc.get("enabled", False),
        "active_environment": doc.get("active_environment", "sandbox"),
        "sandbox": _env_out(doc.get("sandbox")),
        "production": _env_out(doc.get("production")),
        "updated_at": doc.get("updated_at"),
    }


@router.get("/getnet", response_model=GetnetIntegrationOut)
async def get_getnet_integration(request: Request):
    _require_seller_or_admin(request)
    db = get_db()
    doc = await db.tenant_integrations.find_one(
        {"tenant_id": _tenant_id(request), "provider": "getnet", "deleted_at": None}
    )
    return _to_out(doc)


@router.put("/getnet", response_model=GetnetIntegrationOut)
async def update_getnet_integration(body: GetnetIntegrationUpdate, request: Request):
    _require_seller_or_admin(request)
    db = get_db()
    tid = _tenant_id(request)

    existing = await db.tenant_integrations.find_one(
        {"tenant_id": tid, "provider": "getnet", "deleted_at": None}
    )
    existing_envs = existing or {}

    now = datetime.now(UTC)
    update: dict = {
        "enabled": body.enabled, "active_environment": body.active_environment, "updated_at": now,
    }

    for env_name, env_body in (("sandbox", body.sandbox), ("production", body.production)):
        existing_env = existing_envs.get(env_name) or {}
        has_existing_secret = bool(existing_env.get("client_secret_encrypted"))
        is_active = body.active_environment == env_name
        if body.enabled and is_active and not env_body.client_secret and not has_existing_secret:
            msg = (
                f"Falta el client secret del ambiente activo ({env_name}) "
                "para activar la integración"
            )
            raise HTTPException(400, msg)

        env_update = {
            "seller_id": env_body.seller_id,
            "client_id": env_body.client_id,
            # Cambiar cualquier dato de conexión de ESE ambiente invalida su
            # última verificación — una prueba vieja no debe aparentar estar
            # vigente con credenciales nuevas.
            "last_verified_at": None,
            "last_verified_ok": None,
            "last_verified_message": None,
        }
        if env_body.client_secret:
            try:
                env_update["client_secret_encrypted"] = encrypt_secret(env_body.client_secret)
            except CryptoConfigError as exc:
                raise HTTPException(500, str(exc)) from exc
        elif has_existing_secret:
            env_update["client_secret_encrypted"] = existing_env["client_secret_encrypted"]
        update[env_name] = env_update

    await db.tenant_integrations.update_one(
        {"tenant_id": tid, "provider": "getnet"},
        {
            "$set": update,
            "$setOnInsert": {
                "tenant_id": tid, "provider": "getnet", "created_at": now, "deleted_at": None,
            },
        },
        upsert=True,
    )
    updated = await db.tenant_integrations.find_one({"tenant_id": tid, "provider": "getnet"})
    return _to_out(updated)


@router.post("/getnet/test-connection", response_model=GetnetTestConnectionResult)
async def test_getnet_connection(request: Request, environment: Environment = Query(...)):
    """Prueba el ambiente que se le pida (`?environment=sandbox|production`),
    no necesariamente el `active_environment` guardado — así se puede probar
    un ambiente antes de activarlo, sin tener que guardarlo como activo primero.
    """
    _require_seller_or_admin(request)
    db = get_db()
    tid = _tenant_id(request)

    doc = await db.tenant_integrations.find_one(
        {"tenant_id": tid, "provider": "getnet", "deleted_at": None}
    )
    env_doc = (doc or {}).get(environment) or {}
    has_full_config = bool(
        env_doc.get("client_id")
        and env_doc.get("seller_id")
        and env_doc.get("client_secret_encrypted")
    )
    if not has_full_config:
        msg = (
            f"Completá y guardá seller ID, client ID y client secret "
            f"de {environment} antes de probar"
        )
        raise HTTPException(400, msg)

    try:
        client_secret = decrypt_secret(env_doc["client_secret_encrypted"])
    except CryptoConfigError as exc:
        raise HTTPException(500, str(exc)) from exc

    cfg = getnet_client.GetnetConfig(
        environment=environment,
        seller_id=env_doc["seller_id"],
        client_id=env_doc["client_id"],
        client_secret=client_secret,
    )

    now = datetime.now(UTC)
    try:
        await getnet_client.get_access_token(cfg, f"{tid}:{environment}", force_refresh=True)
        result = {"last_verified_ok": True, "last_verified_message": "Conexión exitosa"}
    except getnet_client.GetnetError as exc:
        result = {"last_verified_ok": False, "last_verified_message": str(exc)}

    await db.tenant_integrations.update_one(
        {"tenant_id": tid, "provider": "getnet"},
        {"$set": {
            f"{environment}.last_verified_ok": result["last_verified_ok"],
            f"{environment}.last_verified_message": result["last_verified_message"],
            f"{environment}.last_verified_at": now,
        }},
    )
    return {"ok": result["last_verified_ok"], "message": result["last_verified_message"]}


@router.get("/getnet/public-config", response_model=GetnetPublicConfig)
async def get_getnet_public_config(request: Request):
    # Sin auth a propósito: la usa el checkout para decidir si mostrar el
    # formulario de Getnet antes de saber si hay un comprador logueado. Nunca
    # expone client_id/client_secret, y si la integración está apagada
    # tampoco expone seller_id. Siempre refleja el ambiente ACTIVO.
    db = get_db()
    doc = await db.tenant_integrations.find_one(
        {"tenant_id": _tenant_id(request), "provider": "getnet", "deleted_at": None}
    )
    if not doc or not doc.get("enabled"):
        return {"enabled": False, "environment": "sandbox", "seller_id": None}
    active_env = doc.get("active_environment", "sandbox")
    env_doc = doc.get(active_env) or {}
    return {"enabled": True, "environment": active_env, "seller_id": env_doc.get("seller_id")}
