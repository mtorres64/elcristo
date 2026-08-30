import { api } from "./api";

export interface StoreSettings {
  default_markup_pct: number;
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
};
