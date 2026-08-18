from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

OrderStatus = Literal[
    "pending_payment",
    "paid",
    "preparing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
    "disputed",
]


class OrderItem(BaseModel):
    product_id: str
    title: str
    price: int                     # centavos, snapshot al momento de compra
    quantity: int
    image_url: str | None = None


class OrderAddress(BaseModel):
    full_name: str
    phone_country_code: str = "+54"
    phone: str
    street: str
    no_number: bool = False
    province: str
    locality: str
    zip: str | None = None
    zip_unknown: bool = False
    department: str | None = None


class OrderPayment(BaseModel):
    provider: Literal["mock", "mercadopago"] = "mock"
    payment_method_id: str | None = None
    brand: str | None = None
    last4: str | None = None
    payment_id: str | None = None
    preference_id: str | None = None
    status: Literal["pending", "approved", "rejected", "refunded"] = "pending"
    paid_at: datetime | None = None


class OrderDocument(BaseModel):
    id: str | None = Field(None, alias="_id")
    tenant_id: str
    buyer_id: str
    buyer_name: str
    buyer_email: str
    order_number: str
    status: OrderStatus = "pending_payment"
    items: list[OrderItem]
    subtotal: int                  # centavos
    shipping_cost: int = 0         # centavos, fijo en 0 por ahora
    discount: int = 0              # centavos
    total: int                     # centavos
    shipping_address: OrderAddress
    payment: OrderPayment
    tracking_number: str | None = None
    notes: str | None = None
    stock_decremented: bool = False    # evita descontar stock más de una vez
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"populate_by_name": True}
