from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PaymentMethodDocument(BaseModel):
    """Tarjeta guardada de un comprador.

    Nunca se persiste el número completo (PAN) ni el CVV: sólo los datos no
    sensibles necesarios para mostrarla en el checkout. Placeholder hasta
    integrar un procesador real (Mercado Pago) que tokenice del lado suyo.
    """

    id: str | None = Field(None, alias="_id")
    user_id: str
    type: Literal["card"] = "card"
    brand: Literal["visa", "mastercard", "amex", "other"] = "other"
    holder_name: str
    last4: str
    exp_month: int
    exp_year: int
    is_default: bool = False
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"populate_by_name": True}
