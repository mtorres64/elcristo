from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["buyer", "seller", "platform_admin"]
    is_active: bool = True


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    role: Literal["buyer", "seller", "platform_admin"] | None = None
    is_active: bool | None = None


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
