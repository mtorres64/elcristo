from pydantic import BaseModel, EmailStr, field_validator


def _validate_password_length(v: str) -> str:
    if len(v) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres")
    return v


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        return _validate_password_length(v)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        return _validate_password_length(v)


class MessageResponse(BaseModel):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class RegisterResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str


class MeResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    avatar_url: str | None = None
    tenant_id: str | None = None
    email_verified: bool = False


class GoogleLoginRequest(BaseModel):
    access_token: str
