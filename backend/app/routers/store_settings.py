"""Configuración comercial de la tienda (un doc por tenant en `store_settings`).

Por ahora sólo guarda el markup por defecto que usan las Compras para sugerir
el precio de venta cuando el producto no tiene un markup objetivo propio.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request

from app.database import get_db
from app.schemas.store_settings import StoreSettingsOut, StoreSettingsUpdate
from app.utils.auth_deps import require_user

router = APIRouter()

DEFAULT_MARKUP_PCT = 60.0


def _tenant_id(request: Request) -> str:
    return getattr(request.state, "tenant_id", None) or "default"


def _require_seller(request: Request) -> None:
    user = require_user(request)
    if user.get("role") not in ("seller", "platform_admin"):
        raise HTTPException(403, "No tenés permisos para esta acción")


@router.get("", response_model=StoreSettingsOut)
async def get_store_settings(request: Request):
    db = get_db()
    doc = await db.store_settings.find_one({"tenant_id": _tenant_id(request)})
    if not doc:
        return {"default_markup_pct": DEFAULT_MARKUP_PCT}
    return {"default_markup_pct": doc.get("default_markup_pct", DEFAULT_MARKUP_PCT)}


@router.put("", response_model=StoreSettingsOut)
async def update_store_settings(body: StoreSettingsUpdate, request: Request):
    _require_seller(request)
    tid = _tenant_id(request)
    now = datetime.now(UTC)
    db = get_db()
    await db.store_settings.update_one(
        {"tenant_id": tid},
        {
            "$set": {"default_markup_pct": body.default_markup_pct, "updated_at": now},
            "$setOnInsert": {"tenant_id": tid, "created_at": now},
        },
        upsert=True,
    )
    return {"default_markup_pct": body.default_markup_pct}
