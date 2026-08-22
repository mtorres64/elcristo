from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PaymentMethodDocument(BaseModel):
    """Tarjeta guardada de un comprador.

    Nunca se persiste el número completo (PAN) ni el CVV: sólo los datos no
    sensibles necesarios para mostrarla en el checkout. Placeholder hasta
    integrar un procesador real que tokenice del lado suyo.

    `getnet_card_token` queda preparado para una fase futura de "recompra con
    Getnet" (fuera de alcance por ahora): hoy nada lo escribe ni lo lee.
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
    getnet_card_token: str | None = None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"populate_by_name": True}
