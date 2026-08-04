from datetime import datetime

from pydantic import BaseModel, Field


class CategoryOut(BaseModel):
    category_id: str
    name: str
    slug: str
    description: str | None = None
    image_url: str | None = None
    product_count: int = 0
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime


class CategoryCreate(BaseModel):
    name: str = Field(max_length=80)
    slug: str = Field(max_length=80)
    description: str | None = Field(None, max_length=500)
    is_active: bool = True
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = Field(None, max_length=80)
    slug: str | None = Field(None, max_length=80)
    description: str | None = Field(None, max_length=500)
    is_active: bool | None = None
    sort_order: int | None = None
