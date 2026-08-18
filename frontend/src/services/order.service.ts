import { api } from "./api";
import type { Order, OrderStatus, OrderSummary } from "../types/order";
import type { AddressInput } from "../types/address";

interface PaginatedOrders {
  items: OrderSummary[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

interface CreateOrderItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

interface CreateOrderData {
  items: CreateOrderItem[];
  address_id?: string;
  shipping_address?: AddressInput;
  payment_method_id?: string;
  payment_card?: {
    card_number: string;
    holder_name: string;
    exp_month: number;
    exp_year: number;
  };
  save_card?: boolean;
  notes?: string | null;
}

interface ListOrdersParams {
  status?: string;
  q?: string;
  sort?: string;
  tenant_id?: string;
  page?: number;
  page_size?: number;
}

export const orderService = {
  async create(data: CreateOrderData): Promise<{ order_id: string; order_number: string; status: OrderStatus; total: number }> {
    const res = await api.post("/orders", data);
    return res.data;
  },

  async list(params: ListOrdersParams = {}): Promise<PaginatedOrders> {
    const res = await api.get("/orders", { params });
    return res.data;
  },

  async getById(orderId: string): Promise<Order> {
    const res = await api.get(`/orders/${orderId}`);
    return res.data;
  },

  async updateStatus(orderId: string, status: OrderStatus, trackingNumber?: string | null): Promise<Order> {
    const res = await api.patch(`/orders/${orderId}/status`, {
      status,
      tracking_number: trackingNumber ?? null,
    });
    return res.data;
  },
};
