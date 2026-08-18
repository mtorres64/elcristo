from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProductVariant(BaseModel):
    key: str
    value: str
    stock: int = 0
    price_override: int | None = None
    compare_at_price_override: int | None = None
    weight_grams_override: int | None = None
    height_cm_override: int | None = None
    sku_override: str | None = None
    active: bool = True
    recommended_pot_ids: list[str] = []          # IDs de productos "maceta" sugeridos para este tamaño


class ProductDocument(BaseModel):
    id: str | None = Field(None, alias="_id")
    tenant_id: str
    title: str
    short_description: str | None = None          # Descripción corta (≤160 chars)
    description: str | None = None                 # Descripción completa
    price: int                                     # centavos
    compare_at_price: int | None = None            # centavos
    currency: Literal["ARS", "USD"] = "ARS"
    tax: Literal["iva-21", "iva-10", "exento"] = "iva-21"
    category_id: str | None = None
    images: list[str] = []
    stock: int = 0
    sku: str | None = None
    status: Literal["draft", "active", "paused", "out_of_stock"] = "draft"
    is_featured: bool = False
    publish_at: datetime | None = None
    variants: list[ProductVariant] = []
    recommended_pot_ids: list[str] = []          # IDs de productos "maceta" sugeridos
    tags: list[str] = []
    weight_grams: int | None = None
    height_cm: int | None = None                   # Altura del producto en cm
    care: dict[str, str] = {}                      # {"light": "...", "water": "...", ...}
    attributes: dict[str, str] = {}                # {"pot_diameter": "...", "plant_type": "...", ...}
    rating_avg: float | None = None
    rating_count: int = 0
    sold_count: int = 0
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"populate_by_name": True}
