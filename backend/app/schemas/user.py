from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator


def _normalize_email(v: str) -> str:
    return v.strip().lower()


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["buyer", "seller", "platform_admin"]
    is_active: bool = True

    _normalize_email = field_validator("email", mode="before")(_normalize_email)


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    role: Literal["buyer", "seller", "platform_admin"] | None = None
    is_active: bool | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str | None) -> str | None:
        return _normalize_email(v) if v else v


class UserAdminResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    is_active: bool
    email_verified: bool
    avatar_url: str | None = None
    created_at: datetime
    deleted_at: datetime | None = None
