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
    build_query_from_description,
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


def _to_summary(doc: dict, *, stock_override: int | None = None) -> dict:
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
        "stock": stock_override if stock_override is not None else doc.get("stock", 0),
        "tags": doc.get("tags", []),
        "care": doc.get("care", {}),
        "product_type": doc.get("product_type", "simple"),
    }


async def _resolve_combo_items(db, doc: dict) -> tuple[list[dict], int]:
    """Resuelve los componentes de un combo contra el catálogo actual y
    calcula cuántas unidades del combo se pueden vender hoy: el mínimo,
    entre todos sus componentes, de `stock_del_componente // cantidad_por_combo`.
    El stock del combo nunca se guarda — siempre se deriva de sus
    componentes para no desincronizarse cuando esos productos se venden
    sueltos o en otro combo."""
    combo_items = doc.get("combo_items", [])
    if not combo_items:
        return [], 0

    oids = []
    for ci in combo_items:
        try:
            oids.append(ObjectId(ci["product_id"]))
        except Exception:
            continue
    components = await db.products.find({"_id": {"$in": oids}}).to_list(length=len(oids)) if oids else []
    components_by_id = {str(c["_id"]): c for c in components}

    resolved = []
    available: int | None = None
    for ci in combo_items:
        component = components_by_id.get(ci["product_id"])
        comp_stock = component.get("stock", 0) if component else 0
        qty = max(ci.get("quantity", 1), 1)
        max_units = comp_stock // qty
        available = max_units if available is None else min(available, max_units)
        resolved.append({
            "product_id": ci["product_id"],
            "title": component["title"] if component else "Producto no disponible",
            "image_url": (component.get("images") or [None])[0] if component else None,
            "price": component["price"] if component else 0,
            "stock": comp_stock,
            "quantity": ci["quantity"],
        })
    return resolved, (available or 0)


async def _validate_combo_items(db, combo_items: list[dict]) -> None:
    if len(combo_items) < 2:
        raise HTTPException(400, "Un combo debe incluir al menos 2 productos")

    seen: set[str] = set()
    oids = []
    for ci in combo_items:
        pid = ci["product_id"]
        if pid in seen:
            raise HTTPException(400, "Un combo no puede repetir el mismo producto")
        seen.add(pid)
        try:
            oids.append(ObjectId(pid))
        except Exception:
            raise HTTPException(400, f"ID de producto inválido en el combo: {pid}")

    docs = await db.products.find({"_id": {"$in": oids}, "deleted_at": None}).to_list(length=len(oids))
    if len(docs) != len(oids):
        raise HTTPException(400, "Uno de los productos del combo no existe")
    if any(d.get("product_type") == "combo" for d in docs):
        raise HTTPException(400, "Un combo no puede incluir otro combo")


async def _to_detail(db, doc: dict, category: dict | None = None) -> dict:
    is_combo = doc.get("product_type") == "combo"
    combo_items_resolved: list[dict] = []
    stock_override = None
    if is_combo:
        combo_items_resolved, stock_override = await _resolve_combo_items(db, doc)

    result = _to_summary(doc, stock_override=stock_override)
    result.update({
        "description": doc.get("description"),
        "target_markup_pct": doc.get("target_markup_pct"),
        "images": doc.get("images", []),
        "stock": result["stock"],
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
        "combo_items": combo_items_resolved,
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
    product_type: str | None = None,
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
    if product_type == "simple":
        # Los productos creados antes de que existieran los combos no tienen
        # `product_type` guardado en Mongo (el default del modelo sólo aplica
        # al leerlos con Pydantic, no a lo que ya está en la base) — por eso
        # "simple" se resuelve como "no es combo" y no como igual a "simple".
        f["product_type"] = {"$ne": "combo"}
    elif product_type:
        f["product_type"] = product_type

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

    items = []
    for doc in docs:
        if doc.get("product_type") == "combo":
            _, combo_stock = await _resolve_combo_items(db, doc)
            items.append(_to_summary(doc, stock_override=combo_stock))
        else:
            items.append(_to_summary(doc))

    return {
        "items": items,
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

    return await _to_detail(db, doc, category)


@router.post("", response_model=ProductDetail, status_code=201)
async def create_product(body: ProductCreate, request: Request):
    from datetime import UTC, datetime

    db = get_db()
    tenant_id = getattr(request.state, "tenant_id", None) or "default"
    now = datetime.now(UTC)

    if body.product_type == "combo":
        await _validate_combo_items(db, [ci.model_dump() for ci in body.combo_items])

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
        "product_type": body.product_type,
        "combo_items": [ci.model_dump() for ci in body.combo_items],
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
    return await _to_detail(db, doc)


@router.post("/{product_id}/images")
async def upload_product_image(
    product_id: str, request: Request, file: UploadFile = File(...)
):
    from datetime import UTC, datetime

    from app.utils.upload import MAX_UPLOAD_IMAGE_BYTES, save_image

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se permiten archivos de imagen")

    content = await file.read()
    if len(content) > MAX_UPLOAD_IMAGE_BYTES:
        raise HTTPException(400, "La imagen no puede superar 20MB")

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
async def suggest_product_images(
    product_id: str, request: Request, q: str | None = None, field: str = "title"
):
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

    if q:
        query = q
    elif field == "description":
        query = build_query_from_description(
            doc.get("short_description") or doc.get("description"), doc["title"]
        )
    else:
        query = build_query(doc["title"])
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

    effective_type = updates.get("product_type", old_doc.get("product_type", "simple"))
    if effective_type == "combo":
        effective_combo_items = updates.get("combo_items", old_doc.get("combo_items", []))
        await _validate_combo_items(db, effective_combo_items)

    updates["updated_at"] = datetime.now(UTC)

    await db.products.update_one(f, {"$set": updates})

    # Las imágenes que estaban antes y ya no quedan en la lista nueva se
    # borran del storage (no queda huérfanas ocupando espacio).
    if "images" in updates:
        removed = set(old_doc.get("images", [])) - set(updates["images"])
        for url in removed:
            await delete_image(url)

    doc = await db.products.find_one({"_id": oid, "deleted_at": None})
    return await _to_detail(db, doc)


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
