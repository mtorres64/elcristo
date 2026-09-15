import { api } from "./api";

export interface StoreSettings {
  default_markup_pct: number;
}

export interface ShippingLocation {
  lat: number | null;
  lng: number | null;
  address: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  /** Centavos. */
  cost: number;
  /** Centavos; null = sin envío gratis para esta zona. */
  free_from: number | null;
  /** Localidades/barrios que agrupa — para sugerir la zona en el checkout
   * a partir de la dirección del cliente. No afecta el costo. */
  localities: string[];
}

export interface ShippingSettings {
  location: ShippingLocation;
  pickup_discount_pct: number;
  zones: ShippingZone[];
  other_zones_note: string;
  /** Sólo dígitos con código de país (ej: "5493811234567"); "" = sin definir,
   * el storefront cae al WhatsApp de Redes sociales si existe. */
  whatsapp_number: string;
  low_stock_note: string;
}

export const storeSettingsService = {
  async get(): Promise<StoreSettings> {
    const res = await api.get("/store-settings");
    return res.data;
  },

  async update(data: StoreSettings): Promise<StoreSettings> {
    const res = await api.put("/store-settings", data);
    return res.data;
  },

  /** Pública: la usa tanto el admin (tab Envíos) como el storefront
   * (página de Envíos, ficha de producto, carrito). */
  async getShipping(): Promise<ShippingSettings> {
    const res = await api.get("/store-settings/shipping");
    return res.data;
  },

  async updateShipping(data: ShippingSettings): Promise<ShippingSettings> {
    const res = await api.put("/store-settings/shipping", data);
    return res.data;
  },
};
