from datetime import datetime

from pydantic import BaseModel, field_validator, model_validator

from app.schemas.address import AddressCreate


class OrderItemIn(BaseModel):
    product_id: str
    title: str
    price: int
    quantity: int
    image_url: str | None = None


class PaymentCardIn(BaseModel):
    card_number: str
    holder_name: str
    exp_month: int
    exp_year: int
    # Sólo se usa (y sólo se exige) cuando el tenant cobra con Getnet — ver
    # `_charge_with_getnet` en orders.py. El flujo mock lo ignora: nunca lo
    # pide, nunca lo persiste. Con Getnet tampoco se persiste en ningún lado
    # (ni en `payment_methods` ni en la orden); viaja transitoriamente en
    # este request y se reenvía tal cual al cobro con Getnet.
    security_code: str | None = None

    @field_validator("card_number")
    @classmethod
    def strip_spaces(cls, v: str) -> str:
        return v.replace(" ", "").replace("-", "")


class OrderCreate(BaseModel):
    items: list[OrderItemIn]

    address_id: str | None = None
    shipping_address: AddressCreate | None = None

    payment_method_id: str | None = None
    payment_card: PaymentCardIn | None = None
    save_card: bool = False

    notes: str | None = None

    @model_validator(mode="after")
    def check_address_and_payment(self) -> "OrderCreate":
        if not self.address_id and not self.shipping_address:
            raise ValueError("Falta la dirección de envío")
        if not (self.payment_method_id or self.payment_card):
            raise ValueError("Falta el método de pago")
        return self


class OrderCreateResponse(BaseModel):
    order_id: str
    order_number: str
    status: str
    total: int


class OrderAddressOut(BaseModel):
    full_name: str
    phone_country_code: str
    phone: str
    street: str
    no_number: bool
    province: str
    locality: str
    zip: str | None = None
    zip_unknown: bool
    department: str | None = None


class OrderPaymentOut(BaseModel):
    provider: str
    brand: str | None = None
    last4: str | None = None
    payment_id: str | None = None
    authorization_code: str | None = None
    status: str
    paid_at: datetime | None = None


class OrderSummary(BaseModel):
    order_id: str
    order_number: str
    tenant_id: str
    buyer_id: str
    buyer_name: str
    buyer_email: str
    status: str
    item_count: int
    total: int
    created_at: datetime


class OrderDetail(OrderSummary):
    items: list[OrderItemIn]
    subtotal: int
    shipping_cost: int
    discount: int
    shipping_address: OrderAddressOut
    payment: OrderPaymentOut
    tracking_number: str | None = None
    notes: str | None = None
    updated_at: datetime


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_number: str | None = None
