import { api } from "./api";
import type { TenantPublic } from "../types/tenant";

export const tenantService = {
  async getBySlug(slug: string): Promise<TenantPublic> {
    const res = await api.get(`/tenants/${slug}`);
    return res.data;
  },
};
