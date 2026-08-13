import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from app.database import get_db
from app.schemas.content import HeroSettings, HeroSettingsUpdate

router = APIRouter()

# Default usado cuando el tenant todavía no guardó su propia configuración
# del carrusel — replica el hero original hardcodeado para que la home no
# quede vacía antes de que un vendedor entre a Configuración por primera vez.
_DEFAULT_SLIDES = [
    {
        "id": "default-1",
        "image_desktop": "/images/entrada.png",
        "image_mobile": None,
        "html": (
            '<p class="eyebrow">Diseño que Transforma</p>'
            "<h1>Espacios que <em>inspiran</em> bienestar.</h1>"
            "<p>Plantas seleccionadas, diseño de calidad y asesoramiento personalizado "
            "para crear entornos únicos y llenos de vida.</p>"
            '<a href="/products" class="btn-primary">Comprar Plantas</a>'
            '<a href="/diseno" class="btn-outline">Diseño de Jardines</a>'
        ),
        "layout": "split",
        "text_position": "left",
        "text_color": "#1A1A1A",
        "bg_color": "#F5F5F3",
        "bg_opacity": 100,
        "link_url": None,
        "active": True,
        "alt": "Entrada jardín",
    },
    {"id": "default-2", "image_desktop": "/images/hero2.png", "image_mobile": None, "html": "",
     "layout": "full", "text_position": "left", "text_color": "#FFFFFF", "bg_color": "#1A2B1C",
     "bg_opacity": 55, "link_url": None, "active": True, "alt": "Plantas de interior"},
    {"id": "default-3", "image_desktop": "/images/hero3.png", "image_mobile": None, "html": "",
     "layout": "full", "text_position": "left", "text_color": "#FFFFFF", "bg_color": "#1A2B1C",
     "bg_opacity": 55, "link_url": None, "active": True, "alt": "Diseño de jardines"},
    {"id": "default-4", "image_desktop": "/images/hero4.png", "image_mobile": None, "html": "",
     "layout": "full", "text_position": "left", "text_color": "#FFFFFF", "bg_color": "#1A2B1C",
     "bg_opacity": 55, "link_url": None, "active": True, "alt": "Paisajismo"},
    {"id": "default-5", "image_desktop": "/images/hero5.png", "image_mobile": None, "html": "",
     "layout": "full", "text_position": "left", "text_color": "#FFFFFF", "bg_color": "#1A2B1C",
     "bg_opacity": 55, "link_url": None, "active": True, "alt": "Vivero"},
]


def _tenant_id(request: Request) -> str:
    return getattr(request.state, "tenant_id", None) or "default"


@router.get("/hero", response_model=HeroSettings)
async def get_hero(request: Request):
    db = get_db()
    doc = await db.site_content.find_one({"tenant_id": _tenant_id(request), "type": "hero"})
    if not doc:
        return {"slides": _DEFAULT_SLIDES}
    return {"slides": doc.get("slides", [])}


@router.put("/hero", response_model=HeroSettings)
async def update_hero(body: HeroSettingsUpdate, request: Request):
    tid = _tenant_id(request)
    slides = []
    for slide in body.slides:
        data = slide.model_dump()
        data["id"] = data["id"] or uuid.uuid4().hex
        slides.append(data)

    db = get_db()
    await db.site_content.update_one(
        {"tenant_id": tid, "type": "hero"},
        {"$set": {"slides": slides, "updated_at": datetime.now(UTC)},
         "$setOnInsert": {"tenant_id": tid, "type": "hero", "created_at": datetime.now(UTC)}},
        upsert=True,
    )
    return {"slides": slides}


@router.post("/hero/images")
async def upload_hero_image(file: UploadFile = File(...)):
    from app.utils.upload import save_image

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se permiten archivos de imagen")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "La imagen no puede superar 5MB")

    url = await save_image(content, file.filename or "image")
    return {"url": url}
