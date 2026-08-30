import { api } from "./api";
import type { PurchaseCreateInput, PurchaseDetail, PurchaseSummary } from "../types/purchase";

interface PaginatedPurchases {
  items: PurchaseSummary[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

interface ListParams {
  q?: string;
  page?: number;
  page_size?: number;
  tenant_id?: string;
}

export const purchaseService = {
  async list(params: ListParams = {}): Promise<PaginatedPurchases> {
    const res = await api.get("/purchases", { params });
    return res.data;
  },

  async getById(purchaseId: string): Promise<PurchaseDetail> {
    const res = await api.get(`/purchases/${purchaseId}`);
    return res.data;
  },

  async create(data: PurchaseCreateInput): Promise<PurchaseDetail> {
    const res = await api.post("/purchases", data);
    return res.data;
  },
};
