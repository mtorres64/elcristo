import math
from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.database import get_db
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate
from app.schemas.common import PaginatedResponse

router = APIRouter()


def _to_out(doc: dict, product_count: int = 0) -> dict:
    return {
        "category_id": str(doc["_id"]),
        "name": doc["name"],
        "slug": doc["slug"],
        "description": doc.get("description"),
        "image_url": doc.get("image_url"),
        "product_count": product_count,
        "is_active": doc.get("is_active", True),
        "sort_order": doc.get("sort_order", 0),
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
    }


async def _get_product_counts(db) -> dict[str, int]:
    """Devuelve un mapa category_id → cantidad de productos activos."""
    pipeline = [
        {"$match": {"deleted_at": None, "status": "active"}},
        {"$group": {"_id": "$category_id", "count": {"$sum": 1}}},
    ]
    results = await db.products.aggregate(pipeline).to_list(None)
    return {doc["_id"]: doc["count"] for doc in results if doc["_id"]}


@router.get("", response_model=PaginatedResponse[CategoryOut])
async def list_categories(
    q: str | None = None,
    is_active: bool | None = Query(None),
    sort: str = "sort_order",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    db = get_db()

    f: dict = {}
    if is_active is not None:
        f["is_active"] = is_active
    if q:
        f["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"slug": {"$regex": q, "$options": "i"}},
        ]

    sort_map = {
        "newest":     [("created_at", -1)],
        "name_asc":   [("name", 1)],
        "sort_order": [("sort_order", 1)],
    }
    sort_spec = sort_map.get(sort, [("sort_order", 1)])

    total = await db.categories.count_documents(f)
    skip = (page - 1) * page_size
    docs = await db.categories.find(f).sort(sort_spec).skip(skip).limit(page_size).to_list(page_size)

    counts = await _get_product_counts(db)

    return {
        "items": [_to_out(doc, counts.get(str(doc["_id"]), 0)) for doc in docs],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total > 0 else 0,
    }


@router.get("/{category_id}", response_model=CategoryOut)
async def get_category(category_id: str):
    db = get_db()
    try:
        oid = ObjectId(category_id)
    except Exception:
        raise HTTPException(400, "ID de categoría inválido")

    doc = await db.categories.find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Categoría no encontrada")

    counts = await _get_product_counts(db)
    return _to_out(doc, counts.get(category_id, 0))


@router.post("", response_model=CategoryOut, status_code=201)
async def create_category(body: CategoryCreate):
    db = get_db()

    existing = await db.categories.find_one({"slug": body.slug})
    if existing:
        raise HTTPException(400, f"Ya existe una categoría con el slug '{body.slug}'")

    now = datetime.now(UTC)
    doc = {
        "name": body.name,
        "slug": body.slug,
        "description": body.description,
        "image_url": None,
        "parent_id": None,
        "sort_order": body.sort_order,
        "is_active": body.is_active,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.categories.insert_one(doc)
    created = await db.categories.find_one({"_id": result.inserted_id})
    return _to_out(created)


@router.patch("/{category_id}", response_model=CategoryOut)
async def update_category(category_id: str, body: CategoryUpdate):
    db = get_db()
    try:
        oid = ObjectId(category_id)
    except Exception:
        raise HTTPException(400, "ID de categoría inválido")

    doc = await db.categories.find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Categoría no encontrada")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(400, "No hay campos para actualizar")

    if "slug" in updates and updates["slug"] != doc["slug"]:
        conflict = await db.categories.find_one({"slug": updates["slug"], "_id": {"$ne": oid}})
        if conflict:
            raise HTTPException(400, f"Ya existe una categoría con el slug '{updates['slug']}'")

    updates["updated_at"] = datetime.now(UTC)
    await db.categories.update_one({"_id": oid}, {"$set": updates})

    updated = await db.categories.find_one({"_id": oid})
    counts = await _get_product_counts(db)
    return _to_out(updated, counts.get(category_id, 0))


@router.post("/{category_id}/image")
async def upload_category_image(category_id: str, file: UploadFile = File(...)):
    from app.utils.upload import delete_image, save_image

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se permiten archivos de imagen")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "La imagen no puede superar 5MB")

    db = get_db()
    try:
        oid = ObjectId(category_id)
    except Exception:
        raise HTTPException(400, "ID de categoría inválido")

    doc = await db.categories.find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Categoría no encontrada")

    old_url = doc.get("image_url")

    url = await save_image(content, file.filename or "image")
    await db.categories.update_one(
        {"_id": oid},
        {"$set": {"image_url": url, "updated_at": datetime.now(UTC)}},
    )
    if old_url and old_url != url:
        await delete_image(old_url)
    return {"url": url}


@router.delete("/{category_id}", status_code=204)
async def delete_category(category_id: str):
    db = get_db()
    try:
        oid = ObjectId(category_id)
    except Exception:
        raise HTTPException(400, "ID de categoría inválido")

    result = await db.categories.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Categoría no encontrada")
