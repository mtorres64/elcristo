import math
from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

from app.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserAdminResponse, UserCreate, UserUpdate
from app.utils.security import hash_password

router = APIRouter()

# TODO: proteger todos los endpoints con require_role("platform_admin")
#       cuando el sistema de auth esté implementado.


def _to_out(doc: dict) -> dict:
    return {
        "user_id": str(doc["_id"]),
        "email": doc["email"],
        "name": doc["name"],
        "role": doc["role"],
        "is_active": doc.get("is_active", True),
        "email_verified": doc.get("email_verified", False),
        "avatar_url": doc.get("avatar_url"),
        "created_at": doc["created_at"],
        "deleted_at": doc.get("deleted_at"),
    }


@router.get("", response_model=PaginatedResponse[UserAdminResponse])
async def list_users(
    q: str | None = None,
    role: str | None = None,
    is_active: bool | None = Query(None),
    sort: str = "newest",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    db = get_db()

    f: dict = {"deleted_at": None}

    if q:
        f["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ]
    if role:
        f["role"] = role
    if is_active is not None:
        f["is_active"] = is_active

    sort_map = {
        "newest":   [("created_at", -1)],
        "oldest":   [("created_at", 1)],
        "name_asc": [("name", 1)],
    }
    sort_spec = sort_map.get(sort, [("created_at", -1)])

    total = await db.users.count_documents(f)
    skip = (page - 1) * page_size
    docs = await db.users.find(f).sort(sort_spec).skip(skip).limit(page_size).to_list(page_size)

    return {
        "items": [_to_out(doc) for doc in docs],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total > 0 else 0,
    }


@router.post("", response_model=UserAdminResponse, status_code=201)
async def create_user(body: UserCreate):
    db = get_db()

    existing = await db.users.find_one({"email": body.email, "deleted_at": None})
    if existing:
        raise HTTPException(400, f"Ya existe un usuario con el email '{body.email}'")

    now = datetime.now(UTC)
    doc = {
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "name": body.name,
        "role": body.role,
        "is_active": body.is_active,
        "email_verified": body.role == "platform_admin",
        "avatar_url": None,
        "phone": None,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    result = await db.users.insert_one(doc)
    created = await db.users.find_one({"_id": result.inserted_id})
    return _to_out(created)


@router.get("/{user_id}", response_model=UserAdminResponse)
async def get_user(user_id: str):
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(400, "ID de usuario inválido")

    doc = await db.users.find_one({"_id": oid, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Usuario no encontrado")
    return _to_out(doc)


@router.patch("/{user_id}", response_model=UserAdminResponse)
async def update_user(user_id: str, body: UserUpdate):
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(400, "ID de usuario inválido")

    doc = await db.users.find_one({"_id": oid, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Usuario no encontrado")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(400, "No hay campos para actualizar")

    if "email" in updates and updates["email"] != doc["email"]:
        conflict = await db.users.find_one({"email": updates["email"], "_id": {"$ne": oid}, "deleted_at": None})
        if conflict:
            raise HTTPException(400, f"Ya existe un usuario con el email '{updates['email']}'")

    if "password" in updates:
        updates["hashed_password"] = hash_password(updates.pop("password"))

    updates["updated_at"] = datetime.now(UTC)
    await db.users.update_one({"_id": oid}, {"$set": updates})
    updated = await db.users.find_one({"_id": oid})
    return _to_out(updated)


@router.patch("/{user_id}/toggle-active", response_model=UserAdminResponse)
async def toggle_active(user_id: str):
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(400, "ID de usuario inválido")

    doc = await db.users.find_one({"_id": oid, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Usuario no encontrado")

    new_value = not doc.get("is_active", True)
    await db.users.update_one(
        {"_id": oid},
        {"$set": {"is_active": new_value, "updated_at": datetime.now(UTC)}},
    )
    updated = await db.users.find_one({"_id": oid})
    return _to_out(updated)


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str):
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(400, "ID de usuario inválido")

    doc = await db.users.find_one({"_id": oid, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Usuario no encontrado")

    await db.users.update_one(
        {"_id": oid},
        {"$set": {"deleted_at": datetime.now(UTC), "updated_at": datetime.now(UTC)}},
    )
