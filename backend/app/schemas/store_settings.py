from pydantic import BaseModel, Field


class StoreSettingsOut(BaseModel):
    default_markup_pct: float = 60.0


class StoreSettingsUpdate(BaseModel):
    default_markup_pct: float = Field(ge=0, le=100000)


class ShippingLocation(BaseModel):
    """Ubicación del local, elegida en el mapa del admin. `lat`/`lng` quedan
    en None hasta que el vendedor la define por primera vez."""

    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    address: str = ""


class ShippingZone(BaseModel):
    """Regla de envío a costo fijo para una o más localidades (ej: "Yerba
    Buena y San Miguel de Tucumán"). `free_from` es el monto del pedido (en
    centavos) a partir del cual el envío a esa zona sale gratis; None
    desactiva el envío gratis para la zona."""

    id: str
    name: str = Field(min_length=1, max_length=120)
    cost: int = Field(ge=0)
    free_from: int | None = Field(default=None, ge=0)
    # Localidades/barrios que agrupa esta zona (ej: "Santillán", "Villa
    # Luján", "Yerba Buena"). Sólo se usan para sugerir esta zona en el
    # checkout a partir de la dirección del cliente — no afectan el costo.
    localities: list[str] = []


class ShippingSettings(BaseModel):
    location: ShippingLocation = ShippingLocation()
    # Descuento por retirar en el local en vez de pedir envío.
    pickup_discount_pct: float = Field(default=5.0, ge=0, le=100)
    zones: list[ShippingZone] = []
    # Cartel para localidades sin zona de costo fijo (interior del país).
    other_zones_note: str = ""
    # Cartel opcional sobre disponibilidad de stock para compras grandes.
    low_stock_note: str = ""
