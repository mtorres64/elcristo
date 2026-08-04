from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId


class UserDocument(BaseModel):
    id: str | None = Field(None, alias="_id")
    email: EmailStr
    hashed_password: str
    name: str
    role: Literal["buyer", "seller", "platform_admin"]
    phone: str | None = None
    avatar_url: str | None = None
    is_active: bool = True
    email_verified: bool = False
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
