from datetime import datetime

from pydantic import BaseModel, field_validator


class PaymentMethodCreate(BaseModel):
    card_number: str            # sólo se usa para derivar brand/last4, no se persiste
    holder_name: str
    exp_month: int
    exp_year: int
    is_default: bool = False

    @field_validator("card_number")
    @classmethod
    def strip_spaces(cls, v: str) -> str:
        return v.replace(" ", "").replace("-", "")

    @field_validator("exp_month")
    @classmethod
    def valid_month(cls, v: int) -> int:
        if not 1 <= v <= 12:
            raise ValueError("Mes de vencimiento inválido")
        return v


class PaymentMethodResponse(BaseModel):
    payment_method_id: str
    type: str
    brand: str
    holder_name: str
    last4: str
    exp_month: int
    exp_year: int
    is_default: bool
    created_at: datetime
