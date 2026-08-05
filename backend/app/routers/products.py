import math

from bson import ObjectId
from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile

from app.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.product import ProductCreate, ProductDetail, ProductSummary, ProductUpdate

router = APIRouter()


def _to_summary(doc: dict) -> dict:
    return {
        "product_id": str(doc["_id"]),
        "tenant_id": doc["tenant_id"],
        "tenant_name": doc.get("tenant_name", doc["tenant_id"]),
        "title": doc["title"],
        "short_description": doc.get("short_description"),
        "price": doc["price"],
        "compare_at_price": doc.get("compare_at_price"),
        "currency": doc.get("currency", "ARS"),
        "image_url": doc["images"][0] if doc.get("images") else None,
        "is_featured": doc.get("is_featured", False),
        "rating_avg": doc.get("rating_avg"),
        "rating_count": doc.get("rating_count", 0),
        "status": doc["status"],
        "category_id": doc.get("category_id"),
        "stock": doc.get("stock", 0),
        "tags": doc.get("tags", []),
        "care": doc.get("care", {}),
    }


def _to_detail(doc: dict) -> dict:
    result = _to_summary(doc)
    result.update({
        "description": doc.get("description"),
        "images": doc.get("images", []),
        "stock": doc.get("stock", 0),
        "variants": doc.get("variants", []),
        "category_id": doc.get("category_id"),
        "category_name": None,
        "sold_count": doc.get("sold_count", 0),
        "sku": doc.get("sku"),
        "tags": doc.get("tags", []),
        "tax": doc.get("tax", "iva-21"),
        "weight_grams": doc.get("weight_grams"),
        "height_cm": doc.get("height_cm"),
        "care": doc.get("care", {}),
        "attributes": doc.get("attributes", {}),
    })
    return result


@router.get("", response_model=PaginatedResponse[ProductSummary])
async def list_products(
    request: Request,
    q: str | None = None,
    tenant_id: str | None = None,
    category_id: str | None = None,
    status: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    featured: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = "newest",
):
    db = get_db()

    f: dict = {"deleted_at": None}
    if status:
        f["status"] = status

    tid = tenant_id or request.state.tenant_id
    if tid:
        f["tenant_id"] = tid

    if category_id:
        f["category_id"] = category_id

    if min_price is not None or max_price is not None:
        price_filter: dict = {}
        if min_price is not None:
            price_filter["$gte"] = min_price
        if max_price is not None:
            price_filter["$lte"] = max_price
        f["price"] = price_filter

    if q:
        f["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"short_description": {"$regex": q, "$options": "i"}},
            {"tags": {"$elemMatch": {"$regex": q, "$options": "i"}}},
        ]

    if featured is not None:
        f["is_featured"] = featured

    sort_map = {
        "newest": [("created_at", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "rating": [("rating_avg", -1)],
        "featured": [("is_featured", -1), ("created_at", -1)],
        "title_asc": [("title", 1)],
    }
    sort_spec = sort_map.get(sort, [("created_at", -1)])

    total = await db.products.count_documents(f)
    skip = (page - 1) * page_size
    cursor = db.products.find(f).sort(sort_spec).skip(skip).limit(page_size)
    docs = await cursor.to_list(length=page_size)

    return {
        "items": [_to_summary(doc) for doc in docs],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total > 0 else 0,
    }


@router.get("/{product_id}", response_model=ProductDetail)
async def get_product(product_id: str):
    db = get_db()
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(400, "ID de producto inválido")

    doc = await db.products.find_one({"_id": oid, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Producto no encontrado")

    return _to_detail(doc)


@router.post("", response_model=ProductDetail, status_code=201)
async def create_product(body: ProductCreate, request: Request):
    from datetime import UTC, datetime

    db = get_db()
    tenant_id = getattr(request.state, "tenant_id", None) or "default"
    now = datetime.now(UTC)

    doc = {
        "tenant_id": tenant_id,
        "tenant_name": tenant_id,
        "title": body.title,
        "short_description": body.short_description,
        "description": body.description,
        "price": body.price,
        "compare_at_price": body.compare_at_price,
        "currency": body.currency,
        "tax": body.tax,
        "category_id": body.category_id,
        "stock": body.stock,
        "sku": body.sku,
        "is_featured": body.is_featured,
        "status": "draft",
        "images": [],
        "variants": [],
        "tags": body.tags,
        "care": body.care,
        "attributes": body.attributes,
        "weight_grams": body.weight_grams,
        "height_cm": body.height_cm,
        "rating_avg": None,
        "rating_count": 0,
        "sold_count": 0,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.products.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_detail(doc)


@router.post("/{product_id}/images")
async def upload_product_image(
    product_id: str, request: Request, file: UploadFile = File(...)
):
    from datetime import UTC, datetime

    from app.utils.upload import save_image

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se permiten archivos de imagen")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "La imagen no puede superar 5MB")

    db = get_db()
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(400, "ID de producto inválido")

    f: dict = {"_id": oid, "deleted_at": None}
    tid = request.state.tenant_id
    if tid:
        f["tenant_id"] = tid

    doc = await db.products.find_one(f)
    if not doc:
        raise HTTPException(404, "Producto no encontrado")

    url = await save_image(content, file.filename or "image")

    await db.products.update_one(
        {"_id": oid},
        {"$push": {"images": url}, "$set": {"updated_at": datetime.now(UTC)}},
    )

    return {"url": url}


@router.patch("/{product_id}", response_model=ProductDetail)
async def update_product(product_id: str, body: ProductUpdate, request: Request):
    from datetime import UTC, datetime
    db = get_db()
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(400, "ID de producto inválido")

    f: dict = {"_id": oid, "deleted_at": None}
    tid = request.state.tenant_id
    if tid:
        f["tenant_id"] = tid

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(400, "No hay campos para actualizar")

    updates["updated_at"] = datetime.now(UTC)

    result = await db.products.update_one(f, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(404, "Producto no encontrado")

    doc = await db.products.find_one({"_id": oid, "deleted_at": None})
    return _to_detail(doc)


@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: str, request: Request):
    from datetime import UTC, datetime
    db = get_db()
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(400, "ID de producto inválido")

    f: dict = {"_id": oid, "deleted_at": None}
    tid = request.state.tenant_id
    if tid:
        f["tenant_id"] = tid

    result = await db.products.update_one(
        f,
        {"$set": {"deleted_at": datetime.now(UTC), "updated_at": datetime.now(UTC)}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Producto no encontrado")
