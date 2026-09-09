from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

# Sección del nav a la que pertenece la categoría. Fija en código, igual que
# los ítems del nav superior. Agregar un valor acá para sumar una sección.
CategoryGroup = Literal["plantas", "macetas", "quimicos"]

# Orden de las secciones en el nav / listados y su etiqueta visible.
CATEGORY_GROUP_ORDER: tuple[str, ...] = ("plantas", "macetas", "quimicos")
CATEGORY_GROUP_LABELS: dict[str, str] = {
    "plantas": "Plantas",
    "macetas": "Macetas & Accesorios",
    "quimicos": "Productos Químicos",
}


class CategoryOut(BaseModel):
    category_id: str
    name: str
    slug: str
    description: str | None = None
    image_url: str | None = None
    group: CategoryGroup = "plantas"
    product_count: int = 0
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime


class CategoryCreate(BaseModel):
    name: str = Field(max_length=80)
    slug: str = Field(max_length=80)
    description: str | None = Field(None, max_length=500)
    group: CategoryGroup = "plantas"
    is_active: bool = True
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = Field(None, max_length=80)
    slug: str | None = Field(None, max_length=80)
    description: str | None = Field(None, max_length=500)
    group: CategoryGroup | None = None
    is_active: bool | None = None
    sort_order: int | None = None
