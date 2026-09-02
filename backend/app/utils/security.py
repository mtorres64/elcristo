from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.config import settings

ALGORITHM = "HS256"
EMAIL_VERIFY_TOKEN_EXPIRE_HOURS = 24
PASSWORD_RESET_TOKEN_EXPIRE_HOURS = 1


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(payload: dict[str, Any]) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    data["iat"] = datetime.now(UTC)
    return jwt.encode(data, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None


def create_email_verification_token(user_id: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "type": "email_verify",
        "iat": now,
        "exp": now + timedelta(hours=EMAIL_VERIFY_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_email_verification_token(token: str) -> str | None:
    """Devuelve el user_id si el token es válido y del tipo correcto, si no None."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
    if payload.get("type") != "email_verify":
        return None
    return payload.get("sub")


def create_password_reset_token(user_id: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "type": "password_reset",
        "iat": now,
        "exp": now + timedelta(hours=PASSWORD_RESET_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_password_reset_token(token: str) -> str | None:
    """Devuelve el user_id si el token es válido y del tipo correcto, si no None."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
    if payload.get("type") != "password_reset":
        return None
    return payload.get("sub")
