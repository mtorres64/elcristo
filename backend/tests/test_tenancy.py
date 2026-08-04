"""
Tests de aislamiento de tenant.
Verifican que BaseRepository nunca devuelve datos de otro tenant.
"""
import pytest
from datetime import UTC, datetime

from app.repositories.base import BaseRepository


@pytest.mark.asyncio
async def test_tenant_isolation_find_many(db):
    col = db["products"]
    now = datetime.now(UTC)

    await col.insert_many([
        {"tenant_id": "tienda-a", "title": "Prod A1", "deleted_at": None, "created_at": now, "updated_at": now},
        {"tenant_id": "tienda-a", "title": "Prod A2", "deleted_at": None, "created_at": now, "updated_at": now},
        {"tenant_id": "tienda-b", "title": "Prod B1", "deleted_at": None, "created_at": now, "updated_at": now},
    ])

    repo_a = BaseRepository(col, "tienda-a")
    repo_b = BaseRepository(col, "tienda-b")

    results_a = await repo_a.find_many()
    results_b = await repo_b.find_many()

    assert len(results_a) == 2
    assert len(results_b) == 1
    assert all(r["tenant_id"] == "tienda-a" for r in results_a)
    assert all(r["tenant_id"] == "tienda-b" for r in results_b)


@pytest.mark.asyncio
async def test_soft_delete_filters(db):
    col = db["products"]
    now = datetime.now(UTC)

    await col.insert_many([
        {"tenant_id": "tienda-a", "title": "Activo", "deleted_at": None, "created_at": now, "updated_at": now},
        {"tenant_id": "tienda-a", "title": "Borrado", "deleted_at": now, "created_at": now, "updated_at": now},
    ])

    repo = BaseRepository(col, "tienda-a")
    results = await repo.find_many()

    assert len(results) == 1
    assert results[0]["title"] == "Activo"


@pytest.mark.asyncio
async def test_cross_tenant_update_blocked(db):
    col = db["products"]
    now = datetime.now(UTC)

    result = await col.insert_one({
        "tenant_id": "tienda-b",
        "title": "Producto de B",
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
    })
    doc_id = str(result.inserted_id)

    # Repo de tienda-a intenta actualizar producto de tienda-b
    repo_a = BaseRepository(col, "tienda-a")
    updated = await repo_a.update_one(doc_id, {"title": "Hackeado"})

    assert updated is False

    # El documento original no fue modificado
    original = await col.find_one({"_id": result.inserted_id})
    assert original["title"] == "Producto de B"
