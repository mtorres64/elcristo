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
    lat: float | None = None
    lng: float | None = None


class OrderPaymentSplit(BaseModel):
    """Un medio de pago dentro de una venta POS (puede haber varios por
    venta — ej: mitad efectivo, mitad tarjeta). `installments` es sólo
    informativo (lo real lo define el posnet físico de Getnet in situ, la
    app nunca cobra ni valida cuotas)."""
    method: Literal["efectivo", "debito", "credito", "transferencia", "otro"]
    amount: int                        # centavos
    installments: int | None = None


class OrderPayment(BaseModel):
    provider: Literal["mock", "mercadopago", "getnet", "pos"] = "mock"
    payment_method_id: str | None = None
    brand: str | None = None                                      # Web Checkout nunca lo informa (Getnet aloja la tarjeta)
    last4: str | None = None                                      # ídem
    payment_id: str | None = None                                 # Getnet: payment_intent_id (lo confirma el webhook)
    preference_id: str | None = None
    authorization_code: str | None = None                         # Getnet: código de autorización
    environment: Literal["sandbox", "production"] | None = None   # Getnet: ambiente en que se cobró
    status: Literal["pending", "approved", "rejected", "refunded"] = "pending"
    paid_at: datetime | None = None
    refund_id: str | None = None                                  # Getnet: id de la devolución
    refunded_at: datetime | None = None
    refund_attempts: int = 0                                      # rechazos definitivos previos (rota la idempotency key)


class OrderDocument(BaseModel):
    id: str | None = Field(None, alias="_id")
    tenant_id: str
    buyer_id: str | None = None    # None para ventas POS a un cliente ocasional (ver guest_name/guest_phone)
    buyer_name: str
    buyer_email: str | None = None     # el cliente ocasional de una venta POS puede no tener email
    guest_name: str | None = None      # nombre del cliente ocasional (venta POS sin cuenta)
    guest_phone: str | None = None     # teléfono del cliente ocasional (venta POS sin cuenta)
    order_number: str
    status: OrderStatus = "pending_payment"
    items: list[OrderItem]
    subtotal: int                  # centavos
    shipping_cost: int = 0         # centavos, calculado en base a Configuración > Envíos
    discount: int = 0              # centavos (ej: descuento por retiro en el local, o descuento manual en una venta POS)
    pickup: bool = False           # true si el comprador eligió retirar en el local
    shipping_zone_name: str | None = None  # snapshot del nombre de la zona elegida (si no fue pickup)
    total: int                     # centavos
    shipping_address: OrderAddress | None = None   # None si pickup=True y no se cargó dirección (venta POS)
    payment: OrderPayment
    payments: list[OrderPaymentSplit] = []     # desglose de medios de pago de una venta POS (vacío en ventas online)
    channel: Literal["online", "pos"] = "online"   # "pos" = venta registrada en el local, "online" = compra en la tienda
    created_by: str | None = None      # id del vendedor que registró la venta POS
    tracking_number: str | None = None
    notes: str | None = None
    stock_decremented: bool = False    # evita descontar stock más de una vez
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"populate_by_name": True}
