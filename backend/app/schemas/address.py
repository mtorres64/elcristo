from datetime import datetime

from pydantic import BaseModel


class AddressCreate(BaseModel):
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


class AddressUpdate(BaseModel):
    full_name: str | None = None
    phone_country_code: str | None = None
    phone: str | None = None
    street: str | None = None
    no_number: bool | None = None
    province: str | None = None
    locality: str | None = None
    zip: str | None = None
    zip_unknown: bool | None = None
    department: str | None = None
    is_default: bool | None = None


class AddressResponse(BaseModel):
    address_id: str
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
    is_default: bool
    created_at: datetime
