from typing import Literal

from pydantic import BaseModel, Field


class VariantSchema(BaseModel):
    key: str
    value: str
    stock: int = 0
    price_override: int | None = None
    compare_at_price_override: int | None = None
    weight_grams_override: int | None = None
    height_cm_override: int | None = None
    sku_override: str | None = None
    active: bool = True
    recommended_pot_ids: list[str] = []


class ProductCreate(BaseModel):
    title: str = Field(max_length=150)
    short_description: str | None = Field(None, max_length=160)
    description: str | None = None
    price: int = Field(gt=0)
    compare_at_price: int | None = None
    currency: Literal["ARS", "USD"] = "ARS"
    tax: Literal["iva-21", "iva-10", "exento"] = "iva-21"
    category_id: str | None = None
    stock: int = Field(ge=0, default=0)
    sku: str | None = None
    is_featured: bool = False
    publish_at: str | None = None
    weight_grams: int | None = None
    height_cm: int | None = None
    tags: list[str] = []
    care: dict[str, str] = {}
    attributes: dict[str, str] = {}
    variants: list[VariantSchema] = []
    recommended_pot_ids: list[str] = []


class ProductUpdate(BaseModel):
    title: str | None = Field(None, max_length=150)
    short_description: str | None = Field(None, max_length=160)
    description: str | None = None
    price: int | None = Field(None, gt=0)
    compare_at_price: int | None = None
    currency: Literal["ARS", "USD"] | None = None
    tax: Literal["iva-21", "iva-10", "exento"] | None = None
    category_id: str | None = None
    stock: int | None = Field(None, ge=0)
    sku: str | None = None
    status: Literal["draft", "active", "paused"] | None = None
    is_featured: bool | None = None
    publish_at: str | None = None
    weight_grams: int | None = None
    height_cm: int | None = None
    tags: list[str] | None = None
    care: dict[str, str] | None = None
    attributes: dict[str, str] | None = None
    images: list[str] | None = None
    variants: list[VariantSchema] | None = None
    recommended_pot_ids: list[str] | None = None


class ProductSummary(BaseModel):
    product_id: str
    tenant_id: str
    tenant_name: str
    title: str
    short_description: str | None = None
    price: int
    compare_at_price: int | None = None
    currency: str = "ARS"
    image_url: str | None = None
    is_featured: bool = False
    rating_avg: float | None = None
    rating_count: int
    status: str
    category_id: str | None = None
    stock: int = 0
    tags: list[str] = []
    care: dict[str, str] = {}


class ProductDetail(ProductSummary):
    description: str | None = None
    images: list[str]
    stock: int
    variants: list[VariantSchema]
    category_id: str | None = None
    category_name: str | None = None
    sold_count: int
    sku: str | None = None
    tags: list[str]
    tax: str = "iva-21"
    weight_grams: int | None = None
    height_cm: int | None = None
    care: dict[str, str] = {}
    attributes: dict[str, str] = {}
    recommended_pot_ids: list[str] = []
