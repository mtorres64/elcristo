import asyncio
import math

from bson import ObjectId
from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile

from app.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.product import (
    BulkConfirmRequest,
    BulkConfirmResponse,
    BulkImageSuggestionRow,
    ConfirmSuggestionRequest,
    ConfirmSuggestionResponse,
    ImageSuggestionResponse,
    ProductCreate,
    ProductDetail,
    ProductSummary,
    ProductUpdate,
)
from app.utils.auth_deps import require_user
from app.utils.plant_image_search import (
    WikimediaUnavailableError,
    build_query,
    is_wikimedia_host,
    search_with_fallback,
)

router = APIRouter()


def _validate_wikimedia_urls(image_urls: list[str]) -> list[str]:
    """Los links elegidos por el admin se guardan tal cual como imágenes
    del producto — apuntan al thumbnail que sirve Wikimedia, no se
    descargan ni se suben a Cloudinary. Solo se valida que de verdad sean
    de Wikimedia para que este endpoint no termine usándose para guardar
    cualquier URL arbitraria como imagen de producto."""
    for image_url in image_urls:
        if not is_wikimedia_host(image_url):
            raise ValueError("La URL no pertenece a Wikimedia")
    return image_urls


def _to_summary(doc: dict) -> dict:
    return {
        "product_id": str(doc["_id"]),
        "tenant_id": doc["tenant_id"],
        "tenant_name": doc.get("tenant_name", doc["tenant_id"]),
        "title": doc["title"],
        "short_description": doc.get("short_description"),
        "price": doc["price"],
        "compare_at_price": doc.get("compare_at_price"),
        "cost_price": doc.get("cost_price"),
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


def _to_detail(doc: dict, category: dict | None = None) -> dict:
    result = _to_summary(doc)
    result.update({
        "description": doc.get("description"),
        "target_markup_pct": doc.get("target_markup_pct"),
        "images": doc.get("images", []),
        "stock": doc.get("stock", 0),
        "variants": doc.get("variants", []),
        "category_id": doc.get("category_id"),
        "category_name": category["name"] if category else None,
        "category_slug": category["slug"] if category else None,
        "sold_count": doc.get("sold_count", 0),
        "sku": doc.get("sku"),
        "tags": doc.get("tags", []),
        "tax": doc.get("tax", "iva-21"),
        "weight_grams": doc.get("weight_grams"),
        "height_cm": doc.get("height_cm"),
        "care": doc.get("care", {}),
        "attributes": doc.get("attributes", {}),
        "recommended_pot_ids": doc.get("recommended_pot_ids", []),
    })
    return result


@router.get("", response_model=PaginatedResponse[ProductSummary])
async def list_products(
    request: Request,
    q: str | None = None,
    tenant_id: str | None = None,
    category_id: str | None = None,
    category_group: str | None = None,
    status: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    featured: bool | None = None,
    on_sale: bool | None = None,
    ids: str | None = None,
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
    elif category_group:
        # Filtra por sección del nav (plantas / macetas / quimicos): resuelve
        # el grupo a la lista de category_id que le pertenecen. Un category_id
        # explícito tiene prioridad sobre el grupo.
        cat_ids = await db.categories.find(
            {"group": category_group}, {"_id": 1}
        ).to_list(None)
        f["category_id"] = {"$in": [str(c["_id"]) for c in cat_ids]}

    if ids:
        oids = []
        for raw in ids.split(","):
            raw = raw.strip()
            if not raw:
                continue
            try:
                oids.append(ObjectId(raw))
            except Exception:
                continue
        f["_id"] = {"$in": oids}

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

    if on_sale:
        # "En oferta": el precio de comparación (tachado) existe y es mayor
        # al precio actual — mismo criterio que usa el badge "% OFF" del sitio.
        f["$expr"] = {"$gt": ["$compare_at_price", "$price"]}

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


@router.get("/image-suggestions", response_model=list[BulkImageSuggestionRow])
async def suggest_product_images_bulk(request: Request, ids: str = Query(...)):
    """Sugerencias para varios productos a la vez (edición masiva). Una
    sola request: el fan-out a Wikimedia se hace acá en paralelo, y un
    error puntual en un producto no tira abajo los demás."""
    require_user(request)

    oids = []
    for raw in ids.split(","):
        raw = raw.strip()
        if not raw:
            continue
        try:
            oids.append(ObjectId(raw))
        except Exception:
            continue
    if not oids:
        raise HTTPException(400, "No se especificaron productos válidos")

    db = get_db()
    f: dict = {"_id": {"$in": oids}, "deleted_at": None}
    tid = request.state.tenant_id
    if tid:
        f["tenant_id"] = tid

    docs = await db.products.find(f).to_list(length=len(oids))
    docs_by_id = {str(doc["_id"]): doc for doc in docs}

    async def suggest_one(oid: ObjectId) -> dict:
        pid = str(oid)
        doc = docs_by_id.get(pid)
        if not doc:
            return {"product_id": pid, "title": "", "query": "", "candidates": [], "error": "Producto no encontrado"}
        query = build_query(doc["title"])
        try:
            resolved_query, candidates = await search_with_fallback(query)
        except WikimediaUnavailableError as e:
            return {"product_id": pid, "title": doc["title"], "query": query, "candidates": [], "error": str(e)}
        return {"product_id": pid, "title": doc["title"], "query": resolved_query, "candidates": candidates}

    return await asyncio.gather(*(suggest_one(oid) for oid in oids))


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

    category = None
    if doc.get("category_id"):
        try:
            category = await db.categories.find_one({"_id": ObjectId(doc["category_id"])})
        except Exception:
            category = None

    return _to_detail(doc, category)


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
        "cost_price": body.cost_price,
        "target_markup_pct": body.target_markup_pct,
        "currency": body.currency,
        "tax": body.tax,
        "category_id": body.category_id,
        "stock": body.stock,
        "sku": body.sku,
        "is_featured": body.is_featured,
        "status": "draft",
        "images": [],
        "variants": [v.model_dump() for v in body.variants],
        "recommended_pot_ids": body.recommended_pot_ids,
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


@router.get("/{product_id}/image-suggestions", response_model=ImageSuggestionResponse)
async def suggest_product_images(product_id: str, request: Request, q: str | None = None):
    require_user(request)

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

    query = q or build_query(doc["title"])
    try:
        resolved_query, candidates = await search_with_fallback(query)
    except WikimediaUnavailableError as e:
        raise HTTPException(502, str(e)) from None

    return {"query": resolved_query, "candidates": candidates}


@router.post("/{product_id}/image-suggestions/confirm", response_model=ConfirmSuggestionResponse)
async def confirm_product_image_suggestion(
    product_id: str, body: ConfirmSuggestionRequest, request: Request
):
    from datetime import UTC, datetime

    require_user(request)

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

    try:
        urls = _validate_wikimedia_urls(body.image_urls)
    except ValueError as e:
        raise HTTPException(400, str(e)) from None

    await db.products.update_one(
        {"_id": oid},
        {"$push": {"images": {"$each": urls}}, "$set": {"updated_at": datetime.now(UTC)}},
    )
    return {"urls": urls}


@router.post("/image-suggestions/confirm-bulk", response_model=BulkConfirmResponse)
async def confirm_product_image_suggestions_bulk(body: BulkConfirmRequest, request: Request):
    """Confirma en un solo click las sugerencias elegidas para varios
    productos. Endpoint dedicado (no un loop de confirmaciones individuales
    desde el frontend): un fallo puntual en un producto no aborta el resto
    del lote."""
    from datetime import UTC, datetime

    require_user(request)

    db = get_db()
    tid = request.state.tenant_id

    async def confirm_one(item) -> dict:
        try:
            oid = ObjectId(item.product_id)
        except Exception:
            return {"product_id": item.product_id, "status": "error", "message": "ID de producto inválido"}

        f: dict = {"_id": oid, "deleted_at": None}
        if tid:
            f["tenant_id"] = tid

        doc = await db.products.find_one(f)
        if not doc:
            return {"product_id": item.product_id, "status": "error", "message": "Producto no encontrado"}

        try:
            urls = _validate_wikimedia_urls(item.image_urls)
        except ValueError as e:
            return {"product_id": item.product_id, "status": "error", "message": str(e)}

        await db.products.update_one(
            {"_id": oid},
            {"$push": {"images": {"$each": urls}}, "$set": {"updated_at": datetime.now(UTC)}},
        )
        return {"product_id": item.product_id, "status": "ok", "urls": urls}

    results = await asyncio.gather(*(confirm_one(item) for item in body.items))
    return {"results": results}


@router.patch("/{product_id}", response_model=ProductDetail)
async def update_product(product_id: str, body: ProductUpdate, request: Request):
    from datetime import UTC, datetime

    from app.utils.upload import delete_image

    db = get_db()
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(400, "ID de producto inválido")

    f: dict = {"_id": oid, "deleted_at": None}
    tid = request.state.tenant_id
    if tid:
        f["tenant_id"] = tid

    old_doc = await db.products.find_one(f)
    if not old_doc:
        raise HTTPException(404, "Producto no encontrado")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(400, "No hay campos para actualizar")

    updates["updated_at"] = datetime.now(UTC)

    await db.products.update_one(f, {"$set": updates})

    # Las imágenes que estaban antes y ya no quedan en la lista nueva se
    # borran del storage (no queda huérfanas ocupando espacio).
    if "images" in updates:
        removed = set(old_doc.get("images", [])) - set(updates["images"])
        for url in removed:
            await delete_image(url)

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
