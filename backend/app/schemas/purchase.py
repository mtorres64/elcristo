from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

PurchaseSize = Literal["pequeña", "mediana", "grande"]


class PurchaseItemIn(BaseModel):
    product_id: str
    size: PurchaseSize = "mediana"
    quantity: int = Field(gt=0)
    unit_cost: int = Field(gt=0)          # centavos
    new_price: int | None = Field(None, gt=0)   # centavos; si falta se calcula por markup


class PurchaseCreate(BaseModel):
    supplier: str | None = None
    reference: str | None = None
    note: str | None = None
    items: list[PurchaseItemIn] = Field(min_length=1)


class PurchaseItemOut(BaseModel):
    product_id: str
    title: str
    size: PurchaseSize
    quantity: int
    unit_cost: int
    prev_cost: int | None = None
    prev_price: int | None = None
    new_price: int | None = None
    markup_pct: float | None = None


class PurchaseSummary(BaseModel):
    purchase_id: str
    tenant_id: str
    supplier: str | None = None
    reference: str | None = None
    item_count: int
    total_units: int
    total_cost: int
    created_at: datetime


class PurchaseDetail(PurchaseSummary):
    note: str | None = None
    items: list[PurchaseItemOut]
    updated_at: datetime | None = None
