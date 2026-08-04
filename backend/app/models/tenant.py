from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class TenantAddress(BaseModel):
    street: str | None = None
    city: str | None = None
    province: str | None = None
    zip: str | None = None
    country: str = "Argentina"


class TenantDocument(BaseModel):
    id: str | None = Field(None, alias="_id")
    slug: str
    owner_id: str
    name: str
    description: str | None = None
    logo_url: str | None = None
    banner_url: str | None = None
    status: Literal["pending_setup", "active", "suspended", "deleted"] = "pending_setup"
    categories: list[str] = []
    contact_email: EmailStr | None = None
    contact_phone: str | None = None
    address: TenantAddress | None = None
    plan: Literal["basic", "pro", "enterprise"] = "basic"
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"populate_by_name": True}
