import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from app.database import get_db
from app.schemas.content import (
    AboutSettings,
    AboutSettingsUpdate,
    DesignSettings,
    DesignSettingsUpdate,
    HeroSettings,
    HeroSettingsUpdate,
    InspirationSettings,
    InspirationSettingsUpdate,
)

router = APIRouter()

# El hero ocupa todo el ancho de pantalla: se sube tal cual, sin el límite
# de tamaño que sí aplica a fotos de producto/categoría (DEFAULT_MAX_IMAGE_DIMENSION
# en upload.py).
HERO_MAX_IMAGE_DIMENSION: int | None = None

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


def _slide_image_urls(slides: list[dict]) -> set[str]:
    urls = set()
    for s in slides:
        if s.get("image_desktop"):
            urls.add(s["image_desktop"])
        if s.get("image_mobile"):
            urls.add(s["image_mobile"])
    return urls


@router.put("/hero", response_model=HeroSettings)
async def update_hero(body: HeroSettingsUpdate, request: Request):
    from app.utils.upload import delete_image

    tid = _tenant_id(request)
    slides = []
    for slide in body.slides:
        data = slide.model_dump()
        data["id"] = data["id"] or uuid.uuid4().hex
        slides.append(data)

    db = get_db()
    old_doc = await db.site_content.find_one({"tenant_id": tid, "type": "hero"})
    old_urls = _slide_image_urls(old_doc.get("slides", [])) if old_doc else set()

    await db.site_content.update_one(
        {"tenant_id": tid, "type": "hero"},
        {"$set": {"slides": slides, "updated_at": datetime.now(UTC)},
         "$setOnInsert": {"tenant_id": tid, "type": "hero", "created_at": datetime.now(UTC)}},
        upsert=True,
    )

    # Imágenes (desktop o mobile) que ya no están en ningún slide -> se borran
    # del storage. Nunca toca /images/* estáticas (delete_image las ignora).
    for url in old_urls - _slide_image_urls(slides):
        await delete_image(url)

    return {"slides": slides}


@router.post("/hero/images")
async def upload_hero_image(file: UploadFile = File(...)):
    from app.utils.upload import save_image

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se permiten archivos de imagen")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "La imagen no puede superar 5MB")

    url = await save_image(
        content, file.filename or "image", max_dimension=HERO_MAX_IMAGE_DIMENSION
    )
    return {"url": url}


# Default usado cuando el tenant todavía no guardó su propia página "Sobre
# Nosotros" — replica el copy original hardcodeado del frontend para que la
# página no quede vacía antes de que un vendedor entre a Configuración.
_DEFAULT_ABOUT = {
    "hero_image": "",
    "hero_title": "Nuestra historia, cultivada con paciencia.",
    "intro_title": "Cultivamos espacios verdes desde hace más de dos décadas",
    "intro_text": (
        "Somos un vivero familiar dedicado a acercar plantas, diseño y paisajismo a cada hogar. "
        "Creemos que el verde transforma los espacios y la manera en que vivimos en ellos — "
        "por eso acompañamos a nuestros clientes desde la elección de la primera planta hasta "
        "el diseño completo de su jardín."
    ),
    "chapters": [
        {
            "id": "default-1",
            "eyebrow": "Los comienzos",
            "title": "Una semilla familiar",
            "text": (
                "Vivero El Cristo nació como un pequeño emprendimiento familiar, entre almácigos y "
                "un galpón de chapa. Con más ganas que recursos, empezamos vendiendo plantas de "
                "estación a los vecinos del barrio y aprendiendo, planta por planta, lo que cada "
                "especie necesitaba para crecer sana."
            ),
            "image": "",
        },
        {
            "id": "default-2",
            "eyebrow": "El crecimiento",
            "title": "De la tierra al diseño",
            "text": (
                "Con el tiempo, el vivero se transformó: sumamos invernáculos, ampliamos "
                "el catálogo a macetas y accesorios, y formamos un equipo de paisajistas "
                "para acompañar cada proyecto de principio a fin. Hoy diseñamos jardines, "
                "terrazas y espacios verdes para hogares y comercios en todo el país."
            ),
            "image": "",
        },
        {
            "id": "default-3",
            "eyebrow": "Hoy",
            "title": "Verde que se cuida a sí mismo",
            "text": (
                "Seguimos siendo el mismo negocio familiar de siempre, con la misma pasión por las "
                "plantas. Cada especie que vendemos pasa por nuestras manos antes de llegar a las "
                "tuyas, y cada consejo que damos sale de años de prueba, error y mucho cariño por "
                "lo que hacemos."
            ),
            "image": "",
        },
    ],
    "gallery": [],
}


@router.get("/about", response_model=AboutSettings)
async def get_about(request: Request):
    db = get_db()
    doc = await db.site_content.find_one({"tenant_id": _tenant_id(request), "type": "about"})
    if not doc:
        return _DEFAULT_ABOUT
    return {
        "hero_image": doc.get("hero_image", ""),
        "hero_title": doc.get("hero_title", ""),
        "intro_title": doc.get("intro_title", ""),
        "intro_text": doc.get("intro_text", ""),
        "chapters": doc.get("chapters", []),
        "gallery": doc.get("gallery", []),
    }


def _about_image_urls(data: dict) -> set[str]:
    urls = set()
    if data.get("hero_image"):
        urls.add(data["hero_image"])
    for chapter in data.get("chapters", []):
        if chapter.get("image"):
            urls.add(chapter["image"])
    for url in data.get("gallery", []):
        if url:
            urls.add(url)
    return urls


@router.put("/about", response_model=AboutSettings)
async def update_about(body: AboutSettingsUpdate, request: Request):
    from app.utils.upload import delete_image

    tid = _tenant_id(request)
    chapters = []
    for chapter in body.chapters:
        data = chapter.model_dump()
        data["id"] = data["id"] or uuid.uuid4().hex
        chapters.append(data)

    new_data = {
        "hero_image": body.hero_image,
        "hero_title": body.hero_title,
        "intro_title": body.intro_title,
        "intro_text": body.intro_text,
        "chapters": chapters,
        "gallery": [url for url in body.gallery if url],
    }

    db = get_db()
    old_doc = await db.site_content.find_one({"tenant_id": tid, "type": "about"})
    old_urls = _about_image_urls(old_doc) if old_doc else set()

    await db.site_content.update_one(
        {"tenant_id": tid, "type": "about"},
        {"$set": {**new_data, "updated_at": datetime.now(UTC)},
         "$setOnInsert": {"tenant_id": tid, "type": "about", "created_at": datetime.now(UTC)}},
        upsert=True,
    )

    # Imágenes que ya no están referenciadas (hero, capítulos o galería) -> se
    # borran del storage. Nunca toca /images/* estáticas (delete_image las ignora).
    for url in old_urls - _about_image_urls(new_data):
        await delete_image(url)

    return new_data


@router.post("/about/images")
async def upload_about_image(file: UploadFile = File(...)):
    from app.utils.upload import save_image

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se permiten archivos de imagen")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "La imagen no puede superar 5MB")

    url = await save_image(
        content, file.filename or "image", max_dimension=HERO_MAX_IMAGE_DIMENSION
    )
    return {"url": url}


# Default usado cuando el tenant todavía no guardó su propia página
# "Inspiración" — proyectos de paisajismo de ejemplo para que la página no
# quede vacía antes de que un vendedor entre a Configuración.
_DEFAULT_INSPIRATION = {
    "hero_image": "",
    "hero_title": "Proyectos que inspiran.",
    "intro_title": "Paisajismo hecho a medida",
    "intro_text": (
        "Cada proyecto es distinto: un patio, una terraza, un jardín entero. Estos son "
        "algunos de los espacios que diseñamos y llevamos a cabo para nuestros clientes."
    ),
    "projects": [
        {
            "id": "default-1",
            "title": "Jardín mediterráneo",
            "description": "Un patio trasero transformado en un rincón seco y luminoso, con "
            "especies resistentes y un sendero de piedra natural.",
            "location": "Casa particular, zona norte",
            "image": "",
        },
        {
            "id": "default-2",
            "title": "Terraza urbana",
            "description": "Diseño vertical para aprovechar cada metro de una terraza "
            "porteña, combinando macetas de distintas alturas y riego automatizado.",
            "location": "Departamento, CABA",
            "image": "",
        },
        {
            "id": "default-3",
            "title": "Paisajismo comercial",
            "description": "Espacios verdes para la entrada de un local comercial, pensados "
            "para dar una primera impresión cálida y de bajo mantenimiento.",
            "location": "Local comercial",
            "image": "",
        },
    ],
}


@router.get("/inspiration", response_model=InspirationSettings)
async def get_inspiration(request: Request):
    db = get_db()
    doc = await db.site_content.find_one({"tenant_id": _tenant_id(request), "type": "inspiration"})
    if not doc:
        return _DEFAULT_INSPIRATION
    return {
        "hero_image": doc.get("hero_image", ""),
        "hero_title": doc.get("hero_title", ""),
        "intro_title": doc.get("intro_title", ""),
        "intro_text": doc.get("intro_text", ""),
        "projects": doc.get("projects", []),
    }


def _inspiration_image_urls(data: dict) -> set[str]:
    urls = set()
    if data.get("hero_image"):
        urls.add(data["hero_image"])
    for project in data.get("projects", []):
        if project.get("image"):
            urls.add(project["image"])
    return urls


@router.put("/inspiration", response_model=InspirationSettings)
async def update_inspiration(body: InspirationSettingsUpdate, request: Request):
    from app.utils.upload import delete_image

    tid = _tenant_id(request)
    projects = []
    for project in body.projects:
        data = project.model_dump()
        data["id"] = data["id"] or uuid.uuid4().hex
        projects.append(data)

    new_data = {
        "hero_image": body.hero_image,
        "hero_title": body.hero_title,
        "intro_title": body.intro_title,
        "intro_text": body.intro_text,
        "projects": projects,
    }

    db = get_db()
    old_doc = await db.site_content.find_one({"tenant_id": tid, "type": "inspiration"})
    old_urls = _inspiration_image_urls(old_doc) if old_doc else set()

    await db.site_content.update_one(
        {"tenant_id": tid, "type": "inspiration"},
        {
            "$set": {**new_data, "updated_at": datetime.now(UTC)},
            "$setOnInsert": {
                "tenant_id": tid, "type": "inspiration", "created_at": datetime.now(UTC)
            },
        },
        upsert=True,
    )

    # Imágenes que ya no están referenciadas (hero o proyectos) -> se borran
    # del storage. Nunca toca /images/* estáticas (delete_image las ignora).
    for url in old_urls - _inspiration_image_urls(new_data):
        await delete_image(url)

    return new_data


@router.post("/inspiration/images")
async def upload_inspiration_image(file: UploadFile = File(...)):
    from app.utils.upload import save_image

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se permiten archivos de imagen")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "La imagen no puede superar 5MB")

    url = await save_image(
        content, file.filename or "image", max_dimension=HERO_MAX_IMAGE_DIMENSION
    )
    return {"url": url}


# Default usado cuando el tenant todavía no guardó su propia página "Diseño
# & Paisajismo" — trabajos de ejemplo para que la página no quede vacía
# antes de que un vendedor entre a Configuración.
_DEFAULT_DESIGN = {
    "hero_image": "",
    "hero_title": "Diseño que transforma espacios.",
    "intro_title": "Diseño & Paisajismo integral",
    "intro_text": (
        "Desde el primer boceto hasta la última planta: diseñamos, construimos y "
        "mantenemos espacios verdes a medida de cada proyecto."
    ),
    "projects": [
        {
            "id": "default-1",
            "title": "Patio con deck y pérgola",
            "description": "Rediseño completo de un patio trasero: deck de madera, pérgola "
            "y canteros escalonados con especies de bajo mantenimiento.",
            "location": "Casa particular",
            "image": "",
        },
        {
            "id": "default-2",
            "title": "Jardín de entrada corporativo",
            "description": "Paisajismo de bajo mantenimiento para la fachada de un edificio "
            "de oficinas, con foco en primera impresión y sombra.",
            "location": "Edificio corporativo",
            "image": "",
        },
        {
            "id": "default-3",
            "title": "Reforma de jardín residencial",
            "description": "Renovación integral de un jardín existente: nuevo sistema de "
            "riego, iluminación y una selección de plantas nativas.",
            "location": "Casa particular",
            "image": "",
        },
    ],
}


@router.get("/design", response_model=DesignSettings)
async def get_design(request: Request):
    db = get_db()
    doc = await db.site_content.find_one({"tenant_id": _tenant_id(request), "type": "design"})
    if not doc:
        return _DEFAULT_DESIGN
    return {
        "hero_image": doc.get("hero_image", ""),
        "hero_title": doc.get("hero_title", ""),
        "intro_title": doc.get("intro_title", ""),
        "intro_text": doc.get("intro_text", ""),
        "projects": doc.get("projects", []),
    }


def _design_image_urls(data: dict) -> set[str]:
    urls = set()
    if data.get("hero_image"):
        urls.add(data["hero_image"])
    for project in data.get("projects", []):
        if project.get("image"):
            urls.add(project["image"])
    return urls


@router.put("/design", response_model=DesignSettings)
async def update_design(body: DesignSettingsUpdate, request: Request):
    from app.utils.upload import delete_image

    tid = _tenant_id(request)
    projects = []
    for project in body.projects:
        data = project.model_dump()
        data["id"] = data["id"] or uuid.uuid4().hex
        projects.append(data)

    new_data = {
        "hero_image": body.hero_image,
        "hero_title": body.hero_title,
        "intro_title": body.intro_title,
        "intro_text": body.intro_text,
        "projects": projects,
    }

    db = get_db()
    old_doc = await db.site_content.find_one({"tenant_id": tid, "type": "design"})
    old_urls = _design_image_urls(old_doc) if old_doc else set()

    await db.site_content.update_one(
        {"tenant_id": tid, "type": "design"},
        {
            "$set": {**new_data, "updated_at": datetime.now(UTC)},
            "$setOnInsert": {
                "tenant_id": tid, "type": "design", "created_at": datetime.now(UTC)
            },
        },
        upsert=True,
    )

    # Imágenes que ya no están referenciadas (hero o proyectos) -> se borran
    # del storage. Nunca toca /images/* estáticas (delete_image las ignora).
    for url in old_urls - _design_image_urls(new_data):
        await delete_image(url)

    return new_data


@router.post("/design/images")
async def upload_design_image(file: UploadFile = File(...)):
    from app.utils.upload import save_image

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se permiten archivos de imagen")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "La imagen no puede superar 5MB")

    url = await save_image(
        content, file.filename or "image", max_dimension=HERO_MAX_IMAGE_DIMENSION
    )
    return {"url": url}
