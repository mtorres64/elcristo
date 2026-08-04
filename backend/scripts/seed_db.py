"""
Carga datos de prueba en MongoDB.
Ejecutar después de create_indexes.py:
    python scripts/seed_db.py

Crea: 1 vivero, 1 buyer, 1 seller, 10 plantas con todos los campos.
"""
import asyncio
from datetime import UTC, datetime

from motor.motor_asyncio import AsyncIOMotorClient

import sys
sys.path.insert(0, ".")

from app.config import settings
from app.utils.security import hash_password


async def seed():
    client = AsyncIOMotorClient(settings.mongo_url)
    db = client[settings.mongo_db_name]

    now = datetime.now(UTC)

    # Categorías
    categories = [
        {"name": "Plantas de Interior",  "slug": "plantas-interior",  "description": "Plantas perfectas para decorar y purificar los ambientes de tu hogar.",  "image_url": None, "parent_id": None, "sort_order": 1, "is_active": True, "created_at": now, "updated_at": now},
        {"name": "Plantas de Exterior",  "slug": "plantas-exterior",  "description": "Resistentes al sol y la lluvia, ideales para balcones, terrazas y jardines.", "image_url": None, "parent_id": None, "sort_order": 2, "is_active": True, "created_at": now, "updated_at": now},
        {"name": "Árboles y Arbustos",   "slug": "arboles-arbustos",  "description": "Desde olivos enanos hasta ficus de porte, árboles para interior y exterior.",  "image_url": None, "parent_id": None, "sort_order": 3, "is_active": True, "created_at": now, "updated_at": now},
        {"name": "Suculentas y Cactus",  "slug": "suculentas-cactus", "description": "Bajo mantenimiento, alto impacto visual. Perfectas para cualquier espacio.", "image_url": None, "parent_id": None, "sort_order": 4, "is_active": True, "created_at": now, "updated_at": now},
        {"name": "Macetas y Accesorios", "slug": "macetas-accesorios","description": "Macetas, sustratos, fertilizantes y todo lo que tu planta necesita.",       "image_url": None, "parent_id": None, "sort_order": 5, "is_active": True, "created_at": now, "updated_at": now},
    ]
    await db.categories.delete_many({})
    cat_result = await db.categories.insert_many(categories)
    cat_interior   = str(cat_result.inserted_ids[0])
    cat_exterior   = str(cat_result.inserted_ids[1])
    cat_arboles    = str(cat_result.inserted_ids[2])
    cat_suculentas = str(cat_result.inserted_ids[3])
    cat_macetas    = str(cat_result.inserted_ids[4])
    print("✓ Categorías (interior, exterior, árboles y arbustos, suculentas y cactus, macetas y accesorios)")

    # Seller
    await db.users.delete_many({"email": {"$in": ["seller@tienda.com", "buyer@tienda.com"]}})
    seller_result = await db.users.insert_one({
        "email": "seller@tienda.com",
        "hashed_password": hash_password("seller123"),
        "name": "Juan Vendedor",
        "role": "seller",
        "is_active": True,
        "email_verified": True,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    })
    seller_id = seller_result.inserted_id

    # Buyer
    await db.users.insert_one({
        "email": "buyer@tienda.com",
        "hashed_password": hash_password("buyer123"),
        "name": "María Compradora",
        "role": "buyer",
        "is_active": True,
        "email_verified": True,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    })
    print("✓ Usuarios (seller + buyer)")

    # Tienda vivero
    await db.tenants.delete_many({})  # limpia tenants previos
    await db.tenants.insert_one({
        "slug": "vivero-el-cristo",
        "owner_id": str(seller_id),
        "name": "Vivero El Cristo",
        "description": "Plantas de interior y exterior para tu hogar",
        "status": "active",
        "categories": ["plantas-interior", "plantas-exterior", "arboles-arbustos", "suculentas-cactus", "macetas-accesorios"],
        "plan": "basic",
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    })
    print("✓ Tienda: vivero-el-cristo")

    # Plantas
    await db.products.delete_many({})  # limpia cualquier dato previo
    plants = [
        {
            "tenant_id": "vivero-el-cristo",
            "title": "Ficus Lyrata",
            "short_description": "Gran árbol de interior con hojas brillantes en forma de violín. Elegante y decorativo.",
            "description": "El Ficus Lyrata es una de las plantas de interior más elegidas por su porte elegante y sus hojas grandes y brillantes. Aporta vida y estilo a cualquier ambiente.\n\nIdeal para living, oficinas y espacios con buena luz natural. Crece hasta 3 metros en interior.",
            "price": 3220000,
            "compare_at_price": 3890000,
            "currency": "ARS",
            "tax": "iva-21",
            "category_id": cat_interior,
            "images": [],
            "stock": 25,
            "sku": "PLT-FIC-LYR-001",
            "status": "active",
            "is_featured": True,
            "publish_at": now,
            "variants": [],
            "tags": ["interior", "fácil cuidado", "hoja grande", "árbol"],
            "weight_grams": 3200,
            "height_cm": 90,
            "care": {
                "light": "Luz brillante indirecta",
                "water": "Moderado, dejar secar la capa superior",
                "environment": "Interiores luminosos, evitar corrientes",
                "temperature": "Ideal 18° - 27°C / No inferior a 12°C",
            },
            "attributes": {
                "pot_diameter": "24 cm",
                "height_with_pot": "80 - 100 cm",
                "plant_type": "Árbol de interior",
                "growth_rate": "Medio",
            },
            "rating_avg": 4.8,
            "rating_count": 127,
            "sold_count": 342,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        },
        {
            "tenant_id": "vivero-el-cristo",
            "title": "Monstera Deliciosa",
            "short_description": "La planta tropical favorita de Instagram. Hojas perforadas únicas, muy resistente.",
            "description": "La Monstera Deliciosa, conocida como 'costilla de Adán', es una de las plantas tropicales más populares. Sus hojas perforadas le dan un aspecto exótico y moderno.\n\nMuy resistente y de rápido crecimiento. Perfecta para espacios amplios.",
            "price": 2850000,
            "compare_at_price": None,
            "currency": "ARS",
            "tax": "iva-21",
            "category_id": cat_interior,
            "images": [],
            "stock": 18,
            "sku": "PLT-MON-DEL-001",
            "status": "active",
            "is_featured": True,
            "publish_at": now,
            "variants": [],
            "tags": ["interior", "tropical", "hojas perforadas", "rápido crecimiento"],
            "weight_grams": 2800,
            "height_cm": 70,
            "care": {
                "light": "Luz indirecta brillante a media",
                "water": "Riego moderado, cada 7-10 días",
                "environment": "Ambientes cálidos con humedad moderada",
                "temperature": "16° - 30°C, tolera bien la calefacción",
            },
            "attributes": {
                "pot_diameter": "22 cm",
                "height_with_pot": "65 - 80 cm",
                "plant_type": "Trepadora tropical",
                "growth_rate": "Rápido",
            },
            "rating_avg": 4.9,
            "rating_count": 214,
            "sold_count": 589,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        },
        {
            "tenant_id": "vivero-el-cristo",
            "title": "Palmera Areca",
            "short_description": "Purifica el aire y aporta frescura tropical. Ideal para ambientes secos.",
            "description": "La Palmera Areca es conocida por su capacidad para humidificar y purificar el aire del hogar. Sus tallos amarillos y hojas arqueadas le dan un aspecto tropical muy elegante.\n\nUna de las mejores plantas para mejorar la calidad del aire interior según la NASA.",
            "price": 1890000,
            "compare_at_price": None,
            "currency": "ARS",
            "tax": "iva-21",
            "category_id": cat_interior,
            "images": [],
            "stock": 30,
            "sku": "PLT-PAL-ARE-001",
            "status": "active",
            "is_featured": True,
            "publish_at": now,
            "variants": [
                {"key": "tamaño", "value": "Pequeña (40 cm)", "stock": 15, "price_override": 129000, "sku_override": "PLT-PAL-ARE-S"},
                {"key": "tamaño", "value": "Mediana (70 cm)", "stock": 10, "price_override": 189000, "sku_override": "PLT-PAL-ARE-M"},
                {"key": "tamaño", "value": "Grande (100 cm)", "stock": 5, "price_override": 289000, "sku_override": "PLT-PAL-ARE-L"},
            ],
            "tags": ["interior", "purifica el aire", "tropical", "humidificador natural"],
            "weight_grams": 2500,
            "height_cm": 70,
            "care": {
                "light": "Luz brillante indirecta, tolera sombra parcial",
                "water": "Frecuente en verano, reducir en invierno",
                "environment": "Ambientes con buena ventilación",
                "temperature": "15° - 35°C / Evitar heladas",
            },
            "attributes": {
                "pot_diameter": "20 cm",
                "height_with_pot": "60 - 80 cm",
                "plant_type": "Palmera de interior",
                "growth_rate": "Lento",
            },
            "rating_avg": 4.7,
            "rating_count": 89,
            "sold_count": 201,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        },
        {
            "tenant_id": "vivero-el-cristo",
            "title": "Pothos Dorado",
            "short_description": "La planta más resistente del mundo. Perfecta para principiantes, cuelga o trepa.",
            "description": "El Pothos Dorado (Epipremnum aureum) es la planta perfecta para quienes se inician en el mundo de las plantas. Prácticamente indestructible, purifica el aire y crece en casi cualquier condición.\n\nIdeal como planta colgante o para guiar por una pared o estantería.",
            "price": 680000,
            "compare_at_price": None,
            "currency": "ARS",
            "tax": "iva-21",
            "category_id": cat_interior,
            "images": [],
            "stock": 60,
            "sku": "PLT-POT-DOR-001",
            "status": "active",
            "is_featured": False,
            "publish_at": now,
            "variants": [],
            "tags": ["interior", "principiantes", "colgante", "trepadora", "muy resistente"],
            "weight_grams": 800,
            "height_cm": 30,
            "care": {
                "light": "Tolera desde sombra hasta luz brillante indirecta",
                "water": "Poco exigente, regar cuando el sustrato esté seco",
                "environment": "Cualquier ambiente interior",
                "temperature": "10° - 30°C, muy adaptable",
            },
            "attributes": {
                "pot_diameter": "14 cm",
                "height_with_pot": "25 - 40 cm (colgante)",
                "plant_type": "Trepadora / colgante",
                "growth_rate": "Rápido",
            },
            "rating_avg": 4.6,
            "rating_count": 312,
            "sold_count": 1240,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        },
        {
            "tenant_id": "vivero-el-cristo",
            "title": "Cactus San Pedro",
            "short_description": "Cactus columnar de rápido crecimiento, originario de los Andes. Muy bajo mantenimiento.",
            "description": "El Cactus San Pedro (Echinopsis pachanoi) es un cactus columnar originario de los Andes peruanos. Crece recto y puede alcanzar varios metros de altura.\n\nExtremadamente resistente y de bajo mantenimiento. Produce flores blancas nocturnas espectaculares en verano.",
            "price": 1250000,
            "compare_at_price": None,
            "currency": "ARS",
            "tax": "iva-21",
            "category_id": cat_suculentas,
            "images": [],
            "stock": 15,
            "sku": "PLT-CAC-SAN-001",
            "status": "active",
            "is_featured": False,
            "publish_at": now,
            "variants": [
                {"key": "altura", "value": "20 cm", "stock": 8,  "price_override": 85000,  "sku_override": "PLT-CAC-SAN-S"},
                {"key": "altura", "value": "40 cm", "stock": 5,  "price_override": 125000, "sku_override": "PLT-CAC-SAN-M"},
                {"key": "altura", "value": "60 cm", "stock": 2,  "price_override": 195000, "sku_override": "PLT-CAC-SAN-L"},
            ],
            "tags": ["cactus", "suculenta", "exterior", "bajo mantenimiento", "andino"],
            "weight_grams": 1500,
            "height_cm": 40,
            "care": {
                "light": "Sol directo mínimo 6 horas diarias",
                "water": "Muy escaso, cada 15-20 días en verano",
                "environment": "Exterior o interior muy luminoso",
                "temperature": "Tolera desde -5°C hasta 40°C",
            },
            "attributes": {
                "pot_diameter": "16 cm",
                "height_with_pot": "35 - 65 cm",
                "plant_type": "Cactus columnar",
                "growth_rate": "Rápido (para cactus)",
            },
            "rating_avg": 4.5,
            "rating_count": 56,
            "sold_count": 98,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        },
        {
            "tenant_id": "vivero-el-cristo",
            "title": "Helecho Boston",
            "short_description": "Clásico helecho de hojas largas y arqueadas. El mejor purificador de aire natural.",
            "description": "El Helecho Boston (Nephrolepis exaltata) es uno de los helechos más populares para interior. Sus frondas largas y arqueadas crean un efecto muy decorativo.\n\nExcelente purificador de aire. Prefiere ambientes húmedos y semi-sombra.",
            "price": 990000,
            "compare_at_price": 1190000,
            "currency": "ARS",
            "tax": "iva-21",
            "category_id": cat_interior,
            "images": [],
            "stock": 22,
            "sku": "PLT-HEL-BOS-001",
            "status": "active",
            "is_featured": False,
            "publish_at": now,
            "variants": [],
            "tags": ["interior", "purifica el aire", "sombra", "colgante", "húmedo"],
            "weight_grams": 1200,
            "height_cm": 45,
            "care": {
                "light": "Luz media a baja, sin sol directo",
                "water": "Mantener sustrato húmedo, nebulizar hojas",
                "environment": "Baños, cocinas, ambientes húmedos",
                "temperature": "16° - 24°C / Evitar corrientes de aire frío",
            },
            "attributes": {
                "pot_diameter": "18 cm",
                "height_with_pot": "40 - 55 cm",
                "plant_type": "Helecho colgante",
                "growth_rate": "Medio",
            },
            "rating_avg": 4.4,
            "rating_count": 71,
            "sold_count": 178,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        },
        {
            "tenant_id": "vivero-el-cristo",
            "title": "Lavanda Vera",
            "short_description": "Aromática mediterránea de flores violetas. Ahuyenta insectos y relaja el ambiente.",
            "description": "La Lavanda Vera (Lavandula angustifolia) es la lavanda más aromática y versátil. Sus flores violetas en espigas son inconfundibles.\n\nPerfecta para balcones, jardines o como planta de interior muy luminoso. El aroma relaja y ahuyenta insectos naturalmente.",
            "price": 850000,
            "compare_at_price": None,
            "currency": "ARS",
            "tax": "iva-21",
            "category_id": cat_exterior,
            "images": [],
            "stock": 40,
            "sku": "PLT-LAV-VER-001",
            "status": "active",
            "is_featured": True,
            "publish_at": now,
            "variants": [],
            "tags": ["exterior", "aromática", "balcón", "flores", "mediterránea"],
            "weight_grams": 900,
            "height_cm": 35,
            "care": {
                "light": "Sol directo al menos 6 horas",
                "water": "Escaso, dejar secar bien entre riegos",
                "environment": "Exterior, balcones soleados, jardines",
                "temperature": "Tolera hasta -10°C cuando está establecida",
            },
            "attributes": {
                "pot_diameter": "16 cm",
                "height_with_pot": "30 - 45 cm",
                "plant_type": "Arbusto aromático",
                "growth_rate": "Lento",
            },
            "rating_avg": 4.7,
            "rating_count": 143,
            "sold_count": 412,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        },
        {
            "tenant_id": "vivero-el-cristo",
            "title": "Orquídea Phalaenopsis",
            "short_description": "La orquídea más fácil de cuidar. Florece durante meses con flores espectaculares.",
            "description": "La Phalaenopsis, llamada 'orquídea mariposa', es la orquídea más cultivada del mundo por lo fácil que es mantenerla en flor. Sus flores duran de 2 a 4 meses.\n\nLlega en plena floración. Disponible en blanco, rosa y fucsia.",
            "price": 1650000,
            "compare_at_price": None,
            "currency": "ARS",
            "tax": "iva-21",
            "category_id": cat_interior,
            "images": [],
            "stock": 20,
            "sku": "PLT-ORQ-PHA-001",
            "status": "active",
            "is_featured": True,
            "publish_at": now,
            "variants": [
                {"key": "color", "value": "Blanco",  "stock": 8,  "price_override": None, "sku_override": "PLT-ORQ-PHA-BL"},
                {"key": "color", "value": "Rosa",    "stock": 7,  "price_override": None, "sku_override": "PLT-ORQ-PHA-RO"},
                {"key": "color", "value": "Fucsia",  "stock": 5,  "price_override": None, "sku_override": "PLT-ORQ-PHA-FU"},
            ],
            "tags": ["orquídea", "flores", "regalo", "interior", "florida"],
            "weight_grams": 700,
            "height_cm": 50,
            "care": {
                "light": "Luz brillante indirecta, sin sol directo",
                "water": "1 vaso de agua por semana, dejar escurrir",
                "environment": "Interior con buena luminosidad",
                "temperature": "18° - 28°C, evitar cambios bruscos",
            },
            "attributes": {
                "pot_diameter": "12 cm",
                "height_with_pot": "45 - 60 cm",
                "plant_type": "Orquídea epífita",
                "growth_rate": "Lento",
            },
            "rating_avg": 4.9,
            "rating_count": 198,
            "sold_count": 534,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        },
        {
            "tenant_id": "vivero-el-cristo",
            "title": "Olivo Enano",
            "short_description": "Árbol mediterráneo en maceta para balcón o jardín. Produce aceitunas reales.",
            "description": "El Olivo Enano (Olea europaea 'Parvifolia') es una variedad de olivo compacta perfecta para terrazas y balcones. Con el tiempo produce aceitunas reales.\n\nSimbolo de paz y longevidad. Muy resistente a la sequía una vez establecido.",
            "price": 3800000,
            "compare_at_price": None,
            "currency": "ARS",
            "tax": "iva-21",
            "category_id": cat_arboles,
            "images": [],
            "stock": 8,
            "sku": "PLT-OLI-ENA-001",
            "status": "active",
            "is_featured": False,
            "publish_at": now,
            "variants": [],
            "tags": ["árbol", "exterior", "mediterráneo", "balcón", "terraza"],
            "weight_grams": 5000,
            "height_cm": 80,
            "care": {
                "light": "Sol pleno, mínimo 8 horas diarias",
                "water": "Escaso una vez adaptado, moderado al inicio",
                "environment": "Exterior, terrazas, balcones amplios",
                "temperature": "Tolera hasta -7°C / Ideal 15° - 35°C",
            },
            "attributes": {
                "pot_diameter": "30 cm",
                "height_with_pot": "75 - 100 cm",
                "plant_type": "Árbol frutal ornamental",
                "growth_rate": "Lento",
            },
            "rating_avg": 4.6,
            "rating_count": 42,
            "sold_count": 87,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        },
        {
            "tenant_id": "vivero-el-cristo",
            "title": "Pack Suculentas Surtidas x5",
            "short_description": "5 suculentas de distintas variedades para armar tu propio jardín miniatura.",
            "description": "Un pack de 5 suculentas surtidas de distintas variedades (Echeveria, Haworthia, Sedum, Crassula y Aloe vera). Perfectas para arreglos florales, terrarios o jardines en miniatura.\n\nLlegan en macetas individuales de 8 cm. Ideales como regalo.",
            "price": 1490000,
            "compare_at_price": 1850000,
            "currency": "ARS",
            "tax": "iva-21",
            "category_id": cat_suculentas,
            "images": [],
            "stock": 35,
            "sku": "PLT-SUC-PAK-005",
            "status": "active",
            "is_featured": True,
            "publish_at": now,
            "variants": [],
            "tags": ["suculenta", "pack", "regalo", "interior", "bajo mantenimiento", "miniatura"],
            "weight_grams": 1800,
            "height_cm": 12,
            "care": {
                "light": "Luz brillante directa o indirecta",
                "water": "Muy escaso, cada 15-20 días",
                "environment": "Cualquier ambiente luminoso",
                "temperature": "5° - 35°C, muy adaptables",
            },
            "attributes": {
                "pot_diameter": "8 cm (cada una)",
                "height_with_pot": "8 - 15 cm",
                "plant_type": "Suculentas mixtas",
                "growth_rate": "Lento",
            },
            "rating_avg": 4.8,
            "rating_count": 276,
            "sold_count": 723,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        },
    ]

    await db.products.insert_many(plants)
    print(f"✓ Productos ({len(plants)} plantas para vivero-el-cristo)")

    client.close()
    print("\n✅ Seed completado")
    print("   Seller: seller@tienda.com / seller123")
    print("   Buyer:  buyer@tienda.com  / buyer123")
    print("   Tienda: vivero-el-cristo")


if __name__ == "__main__":
    asyncio.run(seed())
