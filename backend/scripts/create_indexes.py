"""
Crea todos los índices de MongoDB.
Ejecutar UNA VEZ antes de insertar datos:
    python scripts/create_indexes.py
"""
import asyncio

from motor.motor_asyncio import AsyncIOMotorClient

import sys
sys.path.insert(0, ".")

from app.config import settings


async def create_indexes():
    client = AsyncIOMotorClient(settings.mongo_url)
    db = client[settings.mongo_db_name]

    # users
    await db.users.create_index([("email", 1)], unique=True)
    await db.users.create_index([("role", 1), ("is_active", 1)])
    print("✓ users")

    # tenants
    await db.tenants.create_index([("slug", 1)], unique=True)
    await db.tenants.create_index([("owner_id", 1)])
    await db.tenants.create_index([("status", 1)])
    print("✓ tenants")

    # products — per-tenant
    await db.products.create_index([("tenant_id", 1), ("status", 1), ("created_at", -1)])
    await db.products.create_index([("tenant_id", 1), ("category_id", 1), ("price", 1)])
    await db.products.create_index([("tenant_id", 1), ("status", 1), ("sold_count", -1)])
    await db.products.create_index([("tenant_id", 1), ("deleted_at", 1)])
    # búsqueda full-text cross-tenant
    await db.products.create_index([("title", "text"), ("description", "text")])
    print("✓ products")

    # categories
    await db.categories.create_index([("slug", 1)], unique=True)
    await db.categories.create_index([("parent_id", 1), ("order", 1)])
    print("✓ categories")

    # orders — per-tenant
    await db.orders.create_index([("tenant_id", 1), ("status", 1), ("created_at", -1)])
    await db.orders.create_index([("tenant_id", 1), ("created_at", -1)])
    await db.orders.create_index([("buyer_id", 1), ("created_at", -1)])
    await db.orders.create_index([("order_number", 1)], unique=True)
    await db.orders.create_index([("payment.payment_id", 1)])
    print("✓ orders")

    # reviews — per-tenant
    await db.reviews.create_index([("tenant_id", 1), ("product_id", 1), ("created_at", -1)])
    await db.reviews.create_index([("buyer_id", 1)])
    await db.reviews.create_index(
        [("order_id", 1), ("buyer_id", 1)], unique=True
    )
    print("✓ reviews")

    # carts
    await db.carts.create_index([("user_id", 1)])
    await db.carts.create_index([("session_id", 1)])
    print("✓ carts")

    # refresh_tokens
    await db.refresh_tokens.create_index([("token", 1)], unique=True)
    await db.refresh_tokens.create_index([("user_id", 1)])
    await db.refresh_tokens.create_index(
        [("expires_at", 1)], expireAfterSeconds=0
    )
    print("✓ refresh_tokens")

    # store_settings
    await db.store_settings.create_index([("tenant_id", 1)], unique=True)
    print("✓ store_settings")

    # tenant_integrations — config de pasarelas de pago por tenant (ej. Getnet)
    await db.tenant_integrations.create_index([("tenant_id", 1), ("provider", 1)], unique=True)
    print("✓ tenant_integrations")

    client.close()
    print("\n✅ Todos los índices creados correctamente")


if __name__ == "__main__":
    asyncio.run(create_indexes())
