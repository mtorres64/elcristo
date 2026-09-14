"""Configuración comercial de la tienda (un doc por tenant en `store_settings`).

Guarda el markup por defecto que usan las Compras para sugerir el precio de
venta cuando el producto no tiene un markup objetivo propio, y la
configuración de envíos (ubicación del local, zonas a costo fijo, descuento
por retiro y los carteles del storefront). Cada sección vive en su propio
sub-recurso (`""` y `/shipping`) y se actualiza con un `$set` que sólo toca
su propia clave del documento, para que guardar una no pise la otra.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request

from app.database import get_db
from app.schemas.store_settings import ShippingSettings, StoreSettingsOut, StoreSettingsUpdate
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


@router.get("/shipping", response_model=ShippingSettings)
async def get_shipping_settings(request: Request):
    """Pública (sin auth): la usa tanto el admin como el storefront para
    mostrar zonas de envío, descuento por retiro y los carteles."""
    db = get_db()
    doc = await db.store_settings.find_one({"tenant_id": _tenant_id(request)})
    if not doc or "shipping" not in doc:
        return ShippingSettings()
    return doc["shipping"]


@router.put("/shipping", response_model=ShippingSettings)
async def update_shipping_settings(body: ShippingSettings, request: Request):
    _require_seller(request)
    tid = _tenant_id(request)
    now = datetime.now(UTC)
    db = get_db()
    await db.store_settings.update_one(
        {"tenant_id": tid},
        {
            "$set": {"shipping": body.model_dump(), "updated_at": now},
            "$setOnInsert": {"tenant_id": tid, "created_at": now},
        },
        upsert=True,
    )
    return body
