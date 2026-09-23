import { api } from "./api";

export interface LowStockAlertItem {
  product_id: string;
  title: string;
  image_url: string | null;
  stock: number;
  category_name: string | null;
}

export interface NewOrderAlertItem {
  order_id: string;
  order_number: string;
  buyer_name: string;
  total: number;
  created_at: string;
}

export interface AlertsResponse {
  low_stock: LowStockAlertItem[];
  low_stock_count: number;
  new_orders: NewOrderAlertItem[];
  new_orders_count: number;
}

export const alertService = {
  async get(): Promise<AlertsResponse> {
    const res = await api.get("/alerts");
    return res.data;
  },
};
