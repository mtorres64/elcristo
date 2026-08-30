from pydantic import BaseModel, Field


class StoreSettingsOut(BaseModel):
    default_markup_pct: float = 60.0


class StoreSettingsUpdate(BaseModel):
    default_markup_pct: float = Field(ge=0, le=100000)
