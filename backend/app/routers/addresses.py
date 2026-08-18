from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request

from app.database import get_db
from app.schemas.address import AddressCreate, AddressResponse, AddressUpdate
from app.utils.auth_deps import require_user_id

router = APIRouter()


def _to_out(doc: dict) -> dict:
    return {
        "address_id": str(doc["_id"]),
        "full_name": doc["full_name"],
        "phone_country_code": doc.get("phone_country_code", "+54"),
        "phone": doc["phone"],
        "street": doc["street"],
        "no_number": doc.get("no_number", False),
        "province": doc["province"],
        "locality": doc["locality"],
        "zip": doc.get("zip"),
        "zip_unknown": doc.get("zip_unknown", False),
        "department": doc.get("department"),
        "is_default": doc.get("is_default", False),
        "created_at": doc["created_at"],
    }


async def _unset_other_defaults(db, user_id: str, keep_id: ObjectId) -> None:
    await db.addresses.update_many(
        {"user_id": user_id, "_id": {"$ne": keep_id}, "deleted_at": None},
        {"$set": {"is_default": False}},
    )


@router.get("", response_model=list[AddressResponse])
async def list_addresses(request: Request):
    db = get_db()
    user_id = require_user_id(request)
    docs = await db.addresses.find(
        {"user_id": user_id, "deleted_at": None}
    ).sort([("is_default", -1), ("created_at", -1)]).to_list(200)
    return [_to_out(d) for d in docs]


@router.post("", response_model=AddressResponse, status_code=201)
async def create_address(body: AddressCreate, request: Request):
    db = get_db()
    user_id = require_user_id(request)

    existing_count = await db.addresses.count_documents({"user_id": user_id, "deleted_at": None})
    make_default = body.is_default or existing_count == 0

    now = datetime.now(UTC)
    doc = {
        "user_id": user_id,
        "full_name": body.full_name,
        "phone_country_code": body.phone_country_code,
        "phone": body.phone,
        "street": body.street,
        "no_number": body.no_number,
        "province": body.province,
        "locality": body.locality,
        "zip": None if body.zip_unknown else body.zip,
        "zip_unknown": body.zip_unknown,
        "department": body.department,
        "is_default": make_default,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    result = await db.addresses.insert_one(doc)
    if make_default:
        await _unset_other_defaults(db, user_id, result.inserted_id)
    doc["_id"] = result.inserted_id
    return _to_out(doc)


@router.patch("/{address_id}", response_model=AddressResponse)
async def update_address(address_id: str, body: AddressUpdate, request: Request):
    db = get_db()
    user_id = require_user_id(request)
    try:
        oid = ObjectId(address_id)
    except Exception:
        raise HTTPException(400, "ID de dirección inválido")

    doc = await db.addresses.find_one({"_id": oid, "user_id": user_id, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Dirección no encontrada")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(400, "No hay campos para actualizar")

    updates["updated_at"] = datetime.now(UTC)
    await db.addresses.update_one({"_id": oid}, {"$set": updates})

    if updates.get("is_default"):
        await _unset_other_defaults(db, user_id, oid)

    updated = await db.addresses.find_one({"_id": oid})
    return _to_out(updated)


@router.patch("/{address_id}/default", response_model=AddressResponse)
async def set_default_address(address_id: str, request: Request):
    db = get_db()
    user_id = require_user_id(request)
    try:
        oid = ObjectId(address_id)
    except Exception:
        raise HTTPException(400, "ID de dirección inválido")

    doc = await db.addresses.find_one({"_id": oid, "user_id": user_id, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Dirección no encontrada")

    await db.addresses.update_one(
        {"_id": oid}, {"$set": {"is_default": True, "updated_at": datetime.now(UTC)}}
    )
    await _unset_other_defaults(db, user_id, oid)

    updated = await db.addresses.find_one({"_id": oid})
    return _to_out(updated)


@router.delete("/{address_id}", status_code=204)
async def delete_address(address_id: str, request: Request):
    db = get_db()
    user_id = require_user_id(request)
    try:
        oid = ObjectId(address_id)
    except Exception:
        raise HTTPException(400, "ID de dirección inválido")

    doc = await db.addresses.find_one({"_id": oid, "user_id": user_id, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Dirección no encontrada")

    await db.addresses.update_one(
        {"_id": oid},
        {"$set": {"deleted_at": datetime.now(UTC), "updated_at": datetime.now(UTC)}},
    )
