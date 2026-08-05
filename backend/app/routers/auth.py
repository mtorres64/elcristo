from datetime import UTC, datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request
from jose import JWTError, jwt

from app.config import settings
from app.database import get_db
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
)
from app.utils.security import ALGORITHM, create_access_token, hash_password, verify_password

router = APIRouter()


def _create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days),
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def _decode_refresh_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(body: RegisterRequest):
    db = get_db()
    existing = await db.users.find_one({"email": body.email, "deleted_at": None})
    if existing:
        raise HTTPException(400, f"Ya existe una cuenta con el email '{body.email}'")

    now = datetime.now(UTC)
    doc = {
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "name": body.name,
        "role": body.role,
        "is_active": True,
        "email_verified": False,
        "avatar_url": None,
        "phone": None,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    result = await db.users.insert_one(doc)
    return {"user_id": str(result.inserted_id), "email": body.email, "name": body.name, "role": body.role}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    db = get_db()
    doc = await db.users.find_one({"email": body.email, "deleted_at": None})
    if not doc or not verify_password(body.password, doc["hashed_password"]):
        raise HTTPException(401, "Credenciales incorrectas")
    if not doc.get("is_active", True):
        raise HTTPException(403, "Tu cuenta está desactivada. Contactá al administrador.")

    user_id = str(doc["_id"])
    token_payload = {
        "sub": user_id,
        "email": doc["email"],
        "role": doc["role"],
        "tenant_id": doc.get("tenant_id"),
    }
    return {
        "access_token": create_access_token(token_payload),
        "refresh_token": _create_refresh_token(user_id),
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
    }


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(body: RefreshRequest):
    payload = _decode_refresh_token(body.refresh_token)
    if not payload:
        raise HTTPException(401, "Token de refresco inválido o expirado")

    db = get_db()
    try:
        oid = ObjectId(payload["sub"])
    except Exception:
        raise HTTPException(401, "Token inválido")

    doc = await db.users.find_one({"_id": oid, "deleted_at": None, "is_active": True})
    if not doc:
        raise HTTPException(401, "Usuario no encontrado o desactivado")

    token_payload = {
        "sub": str(doc["_id"]),
        "email": doc["email"],
        "role": doc["role"],
        "tenant_id": doc.get("tenant_id"),
    }
    return {
        "access_token": create_access_token(token_payload),
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
    }


@router.get("/me", response_model=MeResponse)
async def me(request: Request):
    if not request.state.current_user:
        raise HTTPException(401, "No autenticado")

    user_id = request.state.current_user.get("sub")
    if not user_id:
        raise HTTPException(401, "Token inválido")

    db = get_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(401, "Token inválido")

    doc = await db.users.find_one({"_id": oid, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Usuario no encontrado")

    return {
        "user_id": str(doc["_id"]),
        "email": doc["email"],
        "name": doc["name"],
        "role": doc["role"],
        "avatar_url": doc.get("avatar_url"),
        "tenant_id": doc.get("tenant_id"),
    }
