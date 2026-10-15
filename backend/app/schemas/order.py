from datetime import datetime
from typing import Literal

from pydantic import BaseModel, model_validator

from app.schemas.address import AddressCreate


class OrderItemIn(BaseModel):
    product_id: str
    title: str
    price: int
    quantity: int
    image_url: str | None = None


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

    # Con Web Checkout no se manda ningún dato de tarjeta: Getnet aloja el
    # formulario de pago (ver `getnet_client.create_payment_intent`). El
    # pedido se crea en `pending_payment` y el cobro real se confirma por
    # webhook, nunca en esta misma request.
    notes: str | None = None

    @model_validator(mode="after")
    def check_address(self) -> "OrderCreate":
        if not self.address_id and not self.shipping_address:
            raise ValueError("Falta la dirección de envío")
        return self


class OrderCreateResponse(BaseModel):
    order_id: str
    order_number: str
    status: str
    total: int
    # URL de Getnet a la que hay que redirigir al comprador para completar el
    # pago (ver `getnet_client.create_payment_intent`).
    checkout_url: str


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
    # Web Checkout nunca nos dice marca/últimos 4 — la tarjeta la carga el
    # comprador en la página de Getnet, no en la nuestra.
    brand: str | None = None
    last4: str | None = None
    # Con Getnet, este campo guarda el `payment_intent_id` (lo confirma el
    # webhook — ver getnet_client.GetnetWebhookEvent).
    payment_id: str | None = None
    authorization_code: str | None = None
    status: str
    paid_at: datetime | None = None
    refund_id: str | None = None
    refunded_at: datetime | None = None


class OrderPaymentSplitIn(BaseModel):
    method: Literal["efectivo", "debito", "credito", "transferencia", "otro"]
    amount: int
    installments: int | None = None


class OrderSummary(BaseModel):
    order_id: str
    order_number: str
    tenant_id: str
    buyer_id: str | None = None
    buyer_name: str
    buyer_email: str | None = None
    channel: str = "online"
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
    shipping_address: OrderAddressOut | None = None
    payment: OrderPaymentOut
    payments: list[OrderPaymentSplitIn] = []
    guest_name: str | None = None
    guest_phone: str | None = None
    tracking_number: str | None = None
    notes: str | None = None
    updated_at: datetime


class OrderCreatePos(BaseModel):
    """Venta registrada en el local (punto de venta). A diferencia de
    `OrderCreate`, no pasa por Getnet: se crea directamente `paid` y el
    stock se descuenta en la misma request, porque el cobro ya se hizo in
    situ (posnet físico, no esta app)."""

    items: list[OrderItemIn]

    # Cliente: o un comprador con cuenta (buyer_id) o uno ocasional
    # (guest_name + guest_phone) — exactamente uno de los dos caminos.
    buyer_id: str | None = None
    guest_name: str | None = None
    guest_phone: str | None = None

    pickup: bool = False
    shipping_zone_id: str | None = None
    shipping_address: AddressCreate | None = None     # requerido sólo si pickup=False

    discount_type: Literal["none", "flat", "percent"] = "none"
    discount_value: int = 0    # centavos si "flat", 0-100 si "percent"

    payments: list[OrderPaymentSplitIn]

    notes: str | None = None

    @model_validator(mode="after")
    def check_customer(self) -> "OrderCreatePos":
        has_account = bool(self.buyer_id)
        has_guest = bool(self.guest_name) and bool(self.guest_phone)
        if has_account == has_guest:
            raise ValueError(
                "Elegí un cliente registrado o completá nombre y teléfono del cliente ocasional"
            )
        return self

    @model_validator(mode="after")
    def check_address(self) -> "OrderCreatePos":
        if not self.pickup and not self.shipping_address:
            raise ValueError("Falta la dirección de envío")
        return self

    @model_validator(mode="after")
    def check_payments(self) -> "OrderCreatePos":
        if not self.payments:
            raise ValueError("Agregá al menos un método de pago")
        if any(p.amount <= 0 for p in self.payments):
            raise ValueError("El monto de cada medio de pago debe ser mayor a cero")
        return self

    @model_validator(mode="after")
    def check_discount(self) -> "OrderCreatePos":
        if self.discount_type == "percent" and not (0 <= self.discount_value <= 100):
            raise ValueError("El descuento porcentual debe estar entre 0 y 100")
        if self.discount_type == "flat" and self.discount_value < 0:
            raise ValueError("El descuento no puede ser negativo")
        return self


class OrderCreatePosResponse(BaseModel):
    order_id: str
    order_number: str
    status: str
    total: int


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_number: str | None = None


class RefundOutcome(BaseModel):
    """Resultado de la devolución al cancelar un pedido.

    - not_required: el pedido no tenía un cobro aprobado, no hay nada que devolver.
    - skipped: no hay devolución automática — hoy es siempre este caso con
      Getnet (Web Checkout no tiene API de reembolso: se hace a mano desde
      el Getnet Portal, ver `_refund_approved_payment`).
    - refunded / failed / unknown: quedan del modelo anterior (reembolso por
      API) por si en el futuro algún proveedor sí lo soporta — hoy ningún
      camino de Getnet los produce.
    """

    outcome: Literal["refunded", "not_required", "skipped", "failed", "unknown"]
    message: str
    amount: int | None = None
    refund_id: str | None = None


class OrderStatusUpdateResult(OrderDetail):
    refund: RefundOutcome | None = None
