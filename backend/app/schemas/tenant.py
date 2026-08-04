import re

from pydantic import BaseModel, EmailStr, field_validator

SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


class TenantCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    categories: list[str] = []

    @field_validator("slug")
    @classmethod
    def slug_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not SLUG_RE.match(v) or len(v) < 3 or len(v) > 50:
            raise ValueError("Slug inválido. Use solo letras minúsculas, números y guiones (3-50 chars)")
        return v


class TenantUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    categories: list[str] | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = None


class TenantPublicResponse(BaseModel):
    slug: str
    name: str
    description: str | None = None
    logo_url: str | None = None
    banner_url: str | None = None
    categories: list[str]
    status: str


class TenantCreateResponse(BaseModel):
    tenant_id: str
    slug: str
    name: str
    status: str
