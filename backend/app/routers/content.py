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
    InfoPageSettings,
    InfoPageSettingsUpdate,
    InspirationSettings,
    InspirationSettingsUpdate,
    SocialSettings,
    SocialSettingsUpdate,
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


# ─── Páginas de solo texto del footer ───────────────────────────────
# Un único par de endpoints parametrizado por slug atiende las cinco
# páginas de "Información" del footer. Cada tenant guarda su propia versión
# en site_content con type "info:<slug>"; hasta entonces se sirve el copy
# por defecto de acá, que replica el texto que estaba hardcodeado en el
# frontend para que la página no quede vacía.
INFO_PAGE_SLUGS = (
    "envios",
    "medios-de-pago",
    "cambios-y-devoluciones",
    "preguntas-frecuentes",
    "terminos-y-condiciones",
)


def _info_section(n: int, title: str, text: str) -> dict:
    return {"id": f"default-{n}", "title": title, "text": text}


_DEFAULT_INFO_PAGES: dict[str, dict] = {
    "envios": {
        "title": "Envíos",
        "sections": [
            _info_section(
                1,
                "Envíos a todo el país",
                "Despachamos pedidos a todas las provincias de Argentina a través de "
                "transporte y correo. En Tucumán capital y alrededores ofrecemos envío "
                "propio, ideal para plantas grandes o macetas que requieren un traslado "
                "más cuidadoso.",
            ),
            _info_section(
                2,
                "Plazos de entrega",
                "Área metropolitana: 24 a 48 horas hábiles.\nInterior del país: entre 3 y "
                "7 días hábiles, según la localidad y el transporte disponible.\nLos plazos "
                "pueden variar en fechas de alta demanda (Día de la Madre, Navidad y "
                "Primavera).",
            ),
            _info_section(
                3,
                "Costo de envío",
                "El costo se calcula automáticamente en el checkout según el código postal "
                "de destino y el volumen del pedido. Podés ver el valor exacto antes de "
                "confirmar la compra.",
            ),
            _info_section(
                4,
                "Cuidado de las plantas en el viaje",
                "Cada planta se prepara y embala especialmente para el transporte: sustrato "
                "humedecido, protección de hojas y ramas, y maceta fijada para evitar "
                "movimientos. Aun así, recomendamos revisar el pedido apenas llega y "
                "regarlo si el sustrato está seco.",
            ),
            _info_section(
                5,
                "Seguimiento del pedido",
                "Una vez despachado tu pedido vas a recibir un email con el número de "
                'seguimiento. También podés consultar el estado desde tu cuenta, en la '
                'sección "Mis pedidos".',
            ),
        ],
    },
    "medios-de-pago": {
        "title": "Medios de pago",
        "sections": [
            _info_section(
                1,
                "Tarjetas de crédito y débito",
                "Aceptamos las principales tarjetas de crédito y débito (Visa, Mastercard "
                "y American Express), procesadas de forma segura al finalizar la compra. "
                "Consultá promociones y cuotas sin interés disponibles según el banco "
                "emisor.",
            ),
            _info_section(
                2,
                "Transferencia bancaria",
                "Podés abonar tu pedido por transferencia o depósito bancario. Al elegir "
                "esta opción en el checkout te vamos a enviar los datos de la cuenta y tu "
                "pedido queda reservado mientras se acredita el pago.",
            ),
            _info_section(
                3,
                "Efectivo en puntos de pago",
                "También podés pagar en efectivo en las redes de cobranza habilitadas. El "
                "pedido se confirma automáticamente una vez acreditado el pago.",
            ),
            _info_section(
                4,
                "Seguridad de tus datos",
                "Todos los pagos con tarjeta se procesan a través de una pasarela de pago "
                "certificada. No almacenamos los números de tarjeta en nuestros "
                "servidores.",
            ),
        ],
    },
    "cambios-y-devoluciones": {
        "title": "Cambios y devoluciones",
        "sections": [
            _info_section(
                1,
                "Plazo para solicitar un cambio",
                "Tenés hasta 5 días corridos desde que recibís tu pedido para solicitar un "
                "cambio o devolución, escribiéndonos por WhatsApp o email con tu número de "
                "pedido y una foto del producto.",
            ),
            _info_section(
                2,
                "Plantas con problemas de salud",
                "Si una planta llega dañada o con signos de haber sufrido en el viaje, la "
                "cambiamos sin cargo. Pedimos que nos avises dentro de las 48 horas de "
                "recibida, con fotos del estado en que llegó.",
            ),
            _info_section(
                3,
                "Macetas y accesorios",
                "Los productos que no sean plantas se pueden cambiar o devolver si no "
                "fueron usados y conservan su embalaje original. El costo del envío de "
                "devolución corre por cuenta del comprador, salvo que el producto haya "
                "llegado con una falla.",
            ),
            _info_section(
                4,
                "Cómo se procesa el reembolso",
                "Una vez que recibimos y revisamos el producto devuelto, el reembolso se "
                "acredita por el mismo medio de pago utilizado en la compra. El tiempo de "
                "acreditación depende de cada entidad bancaria.",
            ),
            _info_section(
                5,
                "Productos que no admiten devolución",
                "Por su naturaleza perecedera, los sustratos abiertos y las plantas ya "
                "trasplantadas no admiten devolución, salvo problema de salud de la planta "
                "detectado a tiempo.",
            ),
        ],
    },
    "preguntas-frecuentes": {
        "title": "Preguntas frecuentes",
        "sections": [
            _info_section(
                1,
                "¿Cómo sé qué planta elegir para mi espacio?",
                "En cada ficha de producto vas a encontrar los cuidados recomendados: luz, "
                "riego y tamaño adulto. Si tenés dudas, escribinos por WhatsApp y te "
                "asesoramos según la luz y el ambiente que tenés disponible.",
            ),
            _info_section(
                2,
                "¿Las plantas vienen con maceta?",
                "Depende del producto: algunas plantas se venden solo con la maceta de "
                "vivero (de plástico, para trasplantar) y otras incluyen maceta "
                "decorativa. Esto figura siempre en la descripción de cada producto, y en "
                "varios casos podés elegir la maceta al momento de comprar.",
            ),
            _info_section(
                3,
                "¿Hacen envíos a todo el país?",
                "Sí, enviamos a todas las provincias. Podés ver los plazos y costos en la "
                "sección de Envíos.",
            ),
            _info_section(
                4,
                "¿Puedo retirar mi pedido en el vivero?",
                "Sí, podés elegir la opción de retiro en el checkout y coordinamos un "
                "horario para que pases a buscarlo sin costo de envío.",
            ),
            _info_section(
                5,
                "¿Ofrecen servicio de diseño de jardines?",
                "Sí, contamos con un equipo de paisajistas para proyectos de diseño y "
                "paisajismo integral, desde un balcón hasta un jardín completo. Podés "
                "conocer más en la sección Diseño & Paisajismo.",
            ),
            _info_section(
                6,
                "¿Qué pasa si mi planta llega con problemas?",
                "La cambiamos sin cargo. Más detalles en la sección Cambios y "
                "devoluciones.",
            ),
        ],
    },
    "terminos-y-condiciones": {
        "title": "Términos y condiciones",
        "sections": [
            _info_section(
                1,
                "Aceptación de los términos",
                "El uso de este sitio y la compra de productos implica la aceptación de "
                "estos términos y condiciones. Te recomendamos leerlos antes de realizar "
                "un pedido.",
            ),
            _info_section(
                2,
                "Productos y disponibilidad",
                "Trabajamos con stock vivo, por lo que la disponibilidad de plantas puede "
                "variar según la temporada. Si un producto no está disponible luego de "
                "confirmada la compra, te contactamos para ofrecerte un reemplazo o el "
                "reembolso correspondiente.",
            ),
            _info_section(
                3,
                "Precios",
                "Los precios publicados están expresados en pesos argentinos e incluyen "
                "los impuestos correspondientes. Nos reservamos el derecho de modificar "
                "precios sin previo aviso, aunque respetamos siempre el valor vigente al "
                "momento de confirmar tu compra.",
            ),
            _info_section(
                4,
                "Cuentas de usuario",
                "Sos responsable de mantener la confidencialidad de tu usuario y "
                "contraseña, y de toda actividad realizada desde tu cuenta.",
            ),
            _info_section(
                5,
                "Propiedad intelectual",
                "Las imágenes, textos y contenido de este sitio son propiedad de Vivero El "
                "Cristo y no pueden reproducirse sin autorización previa.",
            ),
            _info_section(
                6,
                "Modificaciones",
                "Estos términos pueden actualizarse en cualquier momento. Los cambios "
                "entran en vigencia desde su publicación en esta misma página.",
            ),
            _info_section(
                7,
                "Contacto",
                "Ante cualquier consulta sobre estos términos podés escribirnos a "
                "viveroelcristo@gmail.com.",
            ),
        ],
    },
}


@router.get("/info/{slug}", response_model=InfoPageSettings)
async def get_info_page(slug: str, request: Request):
    if slug not in INFO_PAGE_SLUGS:
        raise HTTPException(404, "Página no encontrada")
    db = get_db()
    doc = await db.site_content.find_one(
        {"tenant_id": _tenant_id(request), "type": f"info:{slug}"}
    )
    if not doc:
        return _DEFAULT_INFO_PAGES[slug]
    return {"title": doc.get("title", ""), "sections": doc.get("sections", [])}


@router.put("/info/{slug}", response_model=InfoPageSettings)
async def update_info_page(slug: str, body: InfoPageSettingsUpdate, request: Request):
    if slug not in INFO_PAGE_SLUGS:
        raise HTTPException(404, "Página no encontrada")

    tid = _tenant_id(request)
    sections = []
    for section in body.sections:
        data = section.model_dump()
        data["id"] = data["id"] or uuid.uuid4().hex
        sections.append(data)

    new_data = {"title": body.title, "sections": sections}

    db = get_db()
    await db.site_content.update_one(
        {"tenant_id": tid, "type": f"info:{slug}"},
        {
            "$set": {**new_data, "updated_at": datetime.now(UTC)},
            "$setOnInsert": {
                "tenant_id": tid, "type": f"info:{slug}", "created_at": datetime.now(UTC)
            },
        },
        upsert=True,
    )

    return new_data


# ─── Redes sociales del footer ─────────────────────────────────────
# Default usado hasta que el tenant guarda sus propias redes — replica los
# links que estaban hardcodeados en el footer del frontend.
_DEFAULT_SOCIAL = {
    "links": [
        {
            "id": "default-1",
            "platform": "instagram",
            "url": "https://www.instagram.com/viveroelcristo",
        },
        {
            "id": "default-2",
            "platform": "facebook",
            "url": "https://www.facebook.com/profile.php?id=100063910389465",
        },
    ]
}


@router.get("/social", response_model=SocialSettings)
async def get_social(request: Request):
    db = get_db()
    doc = await db.site_content.find_one(
        {"tenant_id": _tenant_id(request), "type": "social"}
    )
    if not doc:
        return _DEFAULT_SOCIAL
    return {"links": doc.get("links", [])}


@router.put("/social", response_model=SocialSettings)
async def update_social(body: SocialSettingsUpdate, request: Request):
    tid = _tenant_id(request)
    links = []
    for link in body.links:
        data = link.model_dump()
        data["id"] = data["id"] or uuid.uuid4().hex
        links.append(data)

    db = get_db()
    await db.site_content.update_one(
        {"tenant_id": tid, "type": "social"},
        {
            "$set": {"links": links, "updated_at": datetime.now(UTC)},
            "$setOnInsert": {
                "tenant_id": tid, "type": "social", "created_at": datetime.now(UTC)
            },
        },
        upsert=True,
    )

    return {"links": links}
