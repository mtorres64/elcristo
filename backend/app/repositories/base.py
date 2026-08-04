from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection


class BaseRepository:
    """
    Repositorio base que garantiza el aislamiento de tenant y el filtro de soft delete.
    Todos los repositorios per-tenant heredan de esta clase.

    El tenant_id siempre es el slug de la tienda (string).
    Nunca se hacen queries sin incluir tenant_id + deleted_at: None.
    Para queries cross-tenant usar CrossTenantRepository (solo platform_admin).
    """

    def __init__(self, collection: AsyncIOMotorCollection, tenant_id: str) -> None:
        self._col = collection
        self._tenant_id = tenant_id

    def _base_filter(self, extra: dict[str, Any] | None = None) -> dict[str, Any]:
        f: dict[str, Any] = {"tenant_id": self._tenant_id, "deleted_at": None}
        if extra:
            f.update(extra)
        return f

    async def find_by_id(self, doc_id: str) -> dict[str, Any] | None:
        return await self._col.find_one(
            self._base_filter({"_id": ObjectId(doc_id)})
        )

    async def find_many(
        self,
        filter: dict[str, Any] | None = None,
        skip: int = 0,
        limit: int = 20,
        sort: list[tuple[str, int]] | None = None,
    ) -> list[dict[str, Any]]:
        cursor = self._col.find(self._base_filter(filter))
        if sort:
            cursor = cursor.sort(sort)
        cursor = cursor.skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def count(self, filter: dict[str, Any] | None = None) -> int:
        return await self._col.count_documents(self._base_filter(filter))

    async def insert_one(self, doc: dict[str, Any]) -> str:
        now = datetime.now(UTC)
        doc = {
            **doc,
            "tenant_id": self._tenant_id,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        }
        result = await self._col.insert_one(doc)
        return str(result.inserted_id)

    async def update_one(self, doc_id: str, updates: dict[str, Any]) -> bool:
        updates["updated_at"] = datetime.now(UTC)
        result = await self._col.update_one(
            self._base_filter({"_id": ObjectId(doc_id)}),
            {"$set": updates},
        )
        return result.modified_count > 0

    async def soft_delete(self, doc_id: str) -> bool:
        result = await self._col.update_one(
            self._base_filter({"_id": ObjectId(doc_id)}),
            {"$set": {"deleted_at": datetime.now(UTC), "updated_at": datetime.now(UTC)}},
        )
        return result.modified_count > 0
