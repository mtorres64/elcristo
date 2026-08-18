from datetime import datetime

from pydantic import BaseModel, Field


class AddressDocument(BaseModel):
    id: str | None = Field(None, alias="_id")
    user_id: str
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
    is_default: bool = False
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"populate_by_name": True}
