from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request

from app.database import get_db
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodResponse
from app.utils.auth_deps import require_user_id
from app.utils.card import detect_brand, luhn_is_valid

router = APIRouter()


def _to_out(doc: dict) -> dict:
    return {
        "payment_method_id": str(doc["_id"]),
        "type": doc.get("type", "card"),
        "brand": doc["brand"],
        "holder_name": doc["holder_name"],
        "last4": doc["last4"],
        "exp_month": doc["exp_month"],
        "exp_year": doc["exp_year"],
        "is_default": doc.get("is_default", False),
        "created_at": doc["created_at"],
    }


async def _unset_other_defaults(db, user_id: str, keep_id: ObjectId) -> None:
    await db.payment_methods.update_many(
        {"user_id": user_id, "_id": {"$ne": keep_id}, "deleted_at": None},
        {"$set": {"is_default": False}},
    )


@router.get("", response_model=list[PaymentMethodResponse])
async def list_payment_methods(request: Request):
    db = get_db()
    user_id = require_user_id(request)
    docs = await db.payment_methods.find(
        {"user_id": user_id, "deleted_at": None}
    ).sort([("is_default", -1), ("created_at", -1)]).to_list(50)
    return [_to_out(d) for d in docs]


@router.post("", response_model=PaymentMethodResponse, status_code=201)
async def create_payment_method(body: PaymentMethodCreate, request: Request):
    db = get_db()
    user_id = require_user_id(request)

    if not luhn_is_valid(body.card_number):
        raise HTTPException(400, "Número de tarjeta inválido")

    existing_count = await db.payment_methods.count_documents(
        {"user_id": user_id, "deleted_at": None}
    )
    make_default = body.is_default or existing_count == 0

    now = datetime.now(UTC)
    doc = {
        "user_id": user_id,
        "type": "card",
        "brand": detect_brand(body.card_number),
        "holder_name": body.holder_name,
        "last4": body.card_number[-4:],
        "exp_month": body.exp_month,
        "exp_year": body.exp_year,
        "is_default": make_default,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    result = await db.payment_methods.insert_one(doc)
    if make_default:
        await _unset_other_defaults(db, user_id, result.inserted_id)
    doc["_id"] = result.inserted_id
    return _to_out(doc)


@router.patch("/{payment_method_id}/default", response_model=PaymentMethodResponse)
async def set_default_payment_method(payment_method_id: str, request: Request):
    db = get_db()
    user_id = require_user_id(request)
    try:
        oid = ObjectId(payment_method_id)
    except Exception:
        raise HTTPException(400, "ID de método de pago inválido")

    doc = await db.payment_methods.find_one({"_id": oid, "user_id": user_id, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Método de pago no encontrado")

    await db.payment_methods.update_one(
        {"_id": oid}, {"$set": {"is_default": True, "updated_at": datetime.now(UTC)}}
    )
    await _unset_other_defaults(db, user_id, oid)

    updated = await db.payment_methods.find_one({"_id": oid})
    return _to_out(updated)


@router.delete("/{payment_method_id}", status_code=204)
async def delete_payment_method(payment_method_id: str, request: Request):
    db = get_db()
    user_id = require_user_id(request)
    try:
        oid = ObjectId(payment_method_id)
    except Exception:
        raise HTTPException(400, "ID de método de pago inválido")

    doc = await db.payment_methods.find_one({"_id": oid, "user_id": user_id, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Método de pago no encontrado")

    await db.payment_methods.update_one(
        {"_id": oid},
        {"$set": {"deleted_at": datetime.now(UTC), "updated_at": datetime.now(UTC)}},
    )
