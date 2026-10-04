from datetime import datetime
from typing import Literal

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


class InstallmentQuoteRequest(BaseModel):
    """Pedido de cotización de cuotas — se manda antes de crear la orden,
    apenas el comprador cargó la tarjeta (ver `GET /orders/installment-quotes`
    y el TODO de `getnet_client.get_installment_quotes`)."""

    card_bin: str          # primeros 6 a 8 dígitos de la tarjeta, sin el resto del PAN
    amount: int             # centavos, total del carrito (sin interés)

    @field_validator("card_bin")
    @classmethod
    def validate_bin(cls, v: str) -> str:
        digits = v.strip()
        if not digits.isdigit() or not (6 <= len(digits) <= 8):
            raise ValueError("BIN de tarjeta inválido")
        return digits

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Monto inválido")
        return v


class InstallmentPlanOut(BaseModel):
    number_installments: int
    installment_type: Literal["no_interest", "with_interest"]
    installment_schema: str
    quote_id: str
    installment_amount: int    # centavos, cuota
    total_amount: int          # centavos, lo que termina cobrando la tarjeta
    interest_amount: int       # centavos, total_amount - el monto cotizado


class InstallmentQuoteResponse(BaseModel):
    plans: list[InstallmentPlanOut]


class InstallmentSelectionIn(BaseModel):
    """El plan elegido por el comprador, eco de un `InstallmentPlanOut` — se
    reenvía tal cual al crear la orden."""

    number_installments: int
    installment_type: Literal["no_interest", "with_interest"]
    installment_schema: str
    quote_id: str
    # Informativo (para mostrar en el detalle del pedido): no es lo que se le
    # manda a Getnet para cobrar (eso sigue siendo `total`, sin interés — ver
    # `_charge_with_getnet`); Getnet calcula el monto real con interés a
    # partir del `quote_id`.
    total_amount: int


class OrderCreate(BaseModel):
    items: list[OrderItemIn]

    address_id: str | None = None
    shipping_address: AddressCreate | None = None

    # Envío: o retira en el local (pickup=True, aplica el % de descuento de
    # Configuración > Envíos sobre el subtotal) o eligió una de las zonas a
    # costo fijo configuradas (shipping_zone_id). El costo/descuento real se
    # recalcula siempre en el server (ver create_order) — nunca se confía en
    # un monto de envío mandado por el cliente. Si no manda ninguno de los
    # dos (localidad fuera de las zonas configuradas) el envío queda en 0
    # para coordinarlo a mano con el vendedor.
    shipping_zone_id: str | None = None
    pickup: bool = False

    payment_method_id: str | None = None
    payment_card: PaymentCardIn | None = None
    save_card: bool = False
    installment: InstallmentSelectionIn | None = None

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
    lat: float | None = None
    lng: float | None = None


class OrderPaymentOut(BaseModel):
    provider: str
    brand: str | None = None
    last4: str | None = None
    payment_id: str | None = None
    authorization_code: str | None = None
    status: str
    paid_at: datetime | None = None
    refund_id: str | None = None
    refunded_at: datetime | None = None
    # Sólo si se pagó en cuotas (ver InstallmentSelectionIn): cantidad de
    # cuotas y lo que realmente se le cobró a la tarjeta (con interés, si el
    # plan lo tenía) — `total` de la orden nunca incluye este interés.
    installments: int | None = None
    installment_total: int | None = None


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
    pickup: bool = False
    shipping_zone_name: str | None = None
    shipping_address: OrderAddressOut
    payment: OrderPaymentOut
    tracking_number: str | None = None
    notes: str | None = None
    updated_at: datetime


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_number: str | None = None


class RefundOutcome(BaseModel):
    """Resultado de la devolución en la pasarela al cancelar un pedido.

    - refunded: Getnet confirmó la devolución (el pedido pasó a "refunded").
    - not_required: el pedido no tenía un cobro aprobado, no hay nada que devolver.
    - skipped: cobro sin pasarela real (mock); se cancela sin devolución automática.
    - failed: Getnet rechazó la devolución; el pedido NO cambió de estado.
    - unknown: no se sabe si Getnet la ejecutó; el pedido NO cambió de estado y
      reintentar es seguro (misma clave de idempotencia).
    """

    outcome: Literal["refunded", "not_required", "skipped", "failed", "unknown"]
    message: str
    amount: int | None = None
    refund_id: str | None = None


class OrderStatusUpdateResult(OrderDetail):
    refund: RefundOutcome | None = None
