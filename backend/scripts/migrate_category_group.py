"""
Backfill del campo `group` en la colección `categories`.

Asigna la sección del nav a cada categoría existente:
  - "macetas"  → slug "macetas-accesorios"
  - "quimicos" → slug "productos-quimicos"
  - "plantas"  → el resto (y cualquier doc sin `group`)

Idempotente: se puede correr varias veces sin efecto adicional.
    python scripts/migrate_category_group.py
"""
import asyncio
import sys

from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, ".")

from app.config import settings

# slug -> group para las categorías que NO son "plantas".
NON_PLANT_GROUPS = {
    "macetas-accesorios": "macetas",
    "productos-quimicos": "quimicos",
}


async def migrate():
    client = AsyncIOMotorClient(settings.mongo_url)
    db = client[settings.mongo_db_name]

    # 1) Todo lo que no tenga group todavía queda como "plantas".
    base = await db.categories.update_many(
        {"group": {"$exists": False}},
        {"$set": {"group": "plantas"}},
    )

    # 2) Overrides por slug para las secciones que no son plantas.
    overrides = 0
    for slug, group in NON_PLANT_GROUPS.items():
        res = await db.categories.update_many(
            {"slug": slug, "group": {"$ne": group}},
            {"$set": {"group": group}},
        )
        overrides += res.modified_count

    print(f"✓ group='plantas' seteado en {base.modified_count} categoría(s)")
    print(f"✓ {overrides} categoría(s) reasignada(s) a macetas/quimicos")

    client.close()
    print("\n✅ Migración de category.group completada")


if __name__ == "__main__":
    asyncio.run(migrate())
