from datetime import UTC, datetime, timedelta

import httpx
from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from jose import JWTError, jwt
from pymongo.errors import DuplicateKeyError

from app.config import settings
from app.database import get_db
from app.schemas.auth import (
    AccessTokenResponse,
    ForgotPasswordRequest,
    GoogleLoginRequest,
    LoginRequest,
    MeResponse,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.utils.email import resolve_smtp_config, send_email
from app.utils.security import (
    ALGORITHM,
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    decode_email_verification_token,
    decode_password_reset_token,
    hash_password,
    verify_password,
)

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


def _tenant_id(request: Request) -> str:
    return getattr(request.state, "tenant_id", None) or "default"


async def _queue_verification_email(
    bg: BackgroundTasks, tenant_id: str, email: str, name: str, user_id: str
) -> None:
    token = create_email_verification_token(user_id)
    link = f"{settings.frontend_url}/verify-email?token={token}"
    greeting = f"Hola {name}," if name else "Hola,"
    small = 'style="font-size:13px;color:#6B6B6B"'
    html = (
        '<div style="font-family:Arial,Helvetica,sans-serif;color:#1A1A1A;line-height:1.6">'
        f"<p>{greeting}</p>"
        "<p>Gracias por crear tu cuenta en <strong>Vivero El Cristo</strong>. "
        "Para activarla, confirmá tu dirección de correo:</p>"
        '<p style="margin:28px 0">'
        f'<a href="{link}" style="background:#253824;color:#fff;text-decoration:none;'
        'padding:12px 24px;border-radius:8px;display:inline-block">Confirmar mi correo</a></p>'
        f"<p {small}>Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>"
        f'<a href="{link}">{link}</a></p>'
        f"<p {small}>El enlace vence en 24 horas. "
        "Si no creaste esta cuenta, ignorá este correo.</p>"
        "</div>"
    )
    text = (
        f"{greeting}\n\n"
        "Confirmá tu correo para activar tu cuenta en Vivero El Cristo:\n"
        f"{link}\n\n"
        "El enlace vence en 24 horas. Si no creaste esta cuenta, ignorá este correo."
    )
    config = await resolve_smtp_config(tenant_id)
    bg.add_task(send_email, email, "Confirmá tu correo", html, text, config)


async def _queue_password_reset_email(
    bg: BackgroundTasks, tenant_id: str, email: str, name: str, user_id: str
) -> None:
    token = create_password_reset_token(user_id)
    link = f"{settings.frontend_url}/reset-password?token={token}"
    greeting = f"Hola {name}," if name else "Hola,"
    small = 'style="font-size:13px;color:#6B6B6B"'
    html = (
        '<div style="font-family:Arial,Helvetica,sans-serif;color:#1A1A1A;line-height:1.6">'
        f"<p>{greeting}</p>"
        "<p>Recibimos un pedido para restablecer la contraseña de tu cuenta en "
        "<strong>Vivero El Cristo</strong>. Para elegir una nueva:</p>"
        '<p style="margin:28px 0">'
        f'<a href="{link}" style="background:#253824;color:#fff;text-decoration:none;'
        'padding:12px 24px;border-radius:8px;display:inline-block">Cambiar mi contraseña</a></p>'
        f"<p {small}>Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>"
        f'<a href="{link}">{link}</a></p>'
        f"<p {small}>El enlace vence en 1 hora. Si no pediste esto, ignorá este correo: "
        "tu contraseña no cambia hasta que uses el enlace.</p>"
        "</div>"
    )
    text = (
        f"{greeting}\n\n"
        "Pediste restablecer tu contraseña en Vivero El Cristo. Elegí una nueva acá:\n"
        f"{link}\n\n"
        "El enlace vence en 1 hora. Si no pediste esto, ignorá este correo."
    )
    config = await resolve_smtp_config(tenant_id)
    bg.add_task(send_email, email, "Restablecé tu contraseña", html, text, config)


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(body: RegisterRequest, request: Request, background: BackgroundTasks):
    db = get_db()
    # Sin filtrar por deleted_at: el índice único de `email` es global, así que
    # un usuario borrado con ese email también bloquea el alta.
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(400, f"Ya existe una cuenta con el email '{body.email}'")

    now = datetime.now(UTC)
    doc = {
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "name": body.name,
        "role": "buyer",
        "is_active": True,
        "email_verified": False,
        "avatar_url": None,
        "phone": None,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    try:
        result = await db.users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(400, f"Ya existe una cuenta con el email '{body.email}'") from None
    user_id = str(result.inserted_id)
    await _queue_verification_email(
        background, _tenant_id(request), body.email, body.name, user_id
    )
    return {"user_id": user_id, "email": body.email, "name": body.name, "role": "buyer"}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    db = get_db()
    doc = await db.users.find_one({"email": body.email, "deleted_at": None})
    has_pw = bool(doc and doc.get("hashed_password"))
    if not has_pw or not verify_password(body.password, doc["hashed_password"]):
        raise HTTPException(401, "Credenciales incorrectas")
    if not doc.get("is_active", True):
        raise HTTPException(403, "Tu cuenta está desactivada. Contactá al administrador.")
    if not doc.get("email_verified", False):
        raise HTTPException(
            403,
            "Confirmá tu correo antes de iniciar sesión. Te enviamos un enlace al registrarte.",
        )

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
        "email_verified": doc.get("email_verified", False),
    }


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(body: VerifyEmailRequest):
    user_id = decode_email_verification_token(body.token)
    if not user_id:
        raise HTTPException(400, "El enlace de confirmación es inválido o expiró.")

    db = get_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(400, "El enlace de confirmación es inválido.") from None

    doc = await db.users.find_one({"_id": oid, "deleted_at": None})
    if not doc:
        raise HTTPException(404, "Usuario no encontrado.")

    if not doc.get("email_verified", False):
        await db.users.update_one(
            {"_id": oid},
            {"$set": {"email_verified": True, "updated_at": datetime.now(UTC)}},
        )
    return {"message": "¡Correo confirmado! Ya podés iniciar sesión."}


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    body: ResendVerificationRequest, request: Request, background: BackgroundTasks
):
    db = get_db()
    doc = await db.users.find_one({"email": body.email, "deleted_at": None})
    if doc and doc.get("hashed_password") and not doc.get("email_verified", False):
        await _queue_verification_email(
            background, _tenant_id(request), doc["email"], doc.get("name", ""), str(doc["_id"])
        )
    # Respuesta genérica: no revelamos si el email existe.
    return {"message": "Si el correo está registrado y sin confirmar, te enviamos un nuevo enlace."}


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest, request: Request, background: BackgroundTasks
):
    db = get_db()
    doc = await db.users.find_one({"email": body.email, "deleted_at": None})
    # Sólo cuentas con contraseña (las de Google no tienen una que restablecer).
    if doc and doc.get("hashed_password") and doc.get("is_active", True):
        await _queue_password_reset_email(
            background, _tenant_id(request), doc["email"], doc.get("name", ""), str(doc["_id"])
        )
    # Respuesta genérica: no revelamos si el email existe.
    return {
        "message": (
            "Si el correo está registrado, te enviamos un enlace para restablecer la contraseña."
        )
    }


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordRequest):
    user_id = decode_password_reset_token(body.token)
    if not user_id:
        raise HTTPException(400, "El enlace para restablecer la contraseña es inválido o expiró.")

    db = get_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(400, "El enlace para restablecer la contraseña es inválido.") from None

    doc = await db.users.find_one({"_id": oid, "deleted_at": None})
    if not doc or not doc.get("hashed_password"):
        raise HTTPException(404, "Usuario no encontrado.")

    await db.users.update_one(
        {"_id": oid},
        {"$set": {
            "hashed_password": hash_password(body.password),
            # Poder abrir el email de recupero prueba que el correo es válido.
            "email_verified": True,
            "updated_at": datetime.now(UTC),
        }},
    )
    return {"message": "¡Contraseña actualizada! Ya podés iniciar sesión."}


@router.post("/google", response_model=TokenResponse)
async def google_login(body: GoogleLoginRequest):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {body.access_token}"},
        )

    if resp.status_code != 200:
        raise HTTPException(401, "Token de Google inválido")

    info = resp.json()
    email = info.get("email")
    if not email:
        raise HTTPException(401, "No se pudo obtener el email de Google")

    name = info.get("name") or email.split("@")[0]
    avatar_url = info.get("picture")
    email_verified = bool(info.get("email_verified", False))

    db = get_db()
    now = datetime.now(UTC)
    doc = await db.users.find_one({"email": email, "deleted_at": None})

    if not doc:
        result = await db.users.insert_one({
            "email": email,
            "hashed_password": None,
            "name": name,
            "role": "buyer",
            "is_active": True,
            "email_verified": email_verified,
            "avatar_url": avatar_url,
            "phone": None,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        })
        user_id = str(result.inserted_id)
        role = "buyer"
        tenant_id = None
    else:
        if not doc.get("is_active", True):
            raise HTTPException(403, "Tu cuenta está desactivada. Contactá al administrador.")
        user_id = str(doc["_id"])
        role = doc["role"]
        tenant_id = doc.get("tenant_id")
        update_fields: dict = {"updated_at": now}
        if avatar_url and doc.get("avatar_url") != avatar_url:
            update_fields["avatar_url"] = avatar_url
        # Google ya validó el correo: si la cuenta se había creado por
        # auto-registración y quedó sin confirmar, la damos por confirmada.
        if email_verified and not doc.get("email_verified", False):
            update_fields["email_verified"] = True
        await db.users.update_one({"_id": doc["_id"]}, {"$set": update_fields})

    token_payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "tenant_id": tenant_id,
    }
    return {
        "access_token": create_access_token(token_payload),
        "refresh_token": _create_refresh_token(user_id),
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
    }
