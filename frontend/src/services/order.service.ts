import { api } from "./api";
import type { Order, OrderStatus, OrderStatusUpdateResult, OrderSummary } from "../types/order";
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
  // Zona a costo fijo elegida en el checkout, o `pickup: true` si retira por
  // el local — el server recalcula el costo/descuento real a partir de
  // Configuración > Envíos, esto sólo indica la elección.
  shipping_zone_id?: string;
  pickup?: boolean;
  // No se manda ningún dato de tarjeta: con Web Checkout, Getnet aloja el
  // formulario de pago (ver `checkout_url` en la respuesta de `create`) — el
  // backend nunca ve el número de tarjeta.
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
  /** Crea el pedido (nace `pending_payment`) y devuelve `checkout_url`: hay
   * que redirigir el navegador ahí para que el comprador complete el pago
   * en la página alojada por Getnet (Web Checkout). El pedido sólo pasa a
   * "paid" cuando llega el webhook — nunca en esta misma request. */
  async create(data: CreateOrderData): Promise<{ order_id: string; order_number: string; status: OrderStatus; total: number; checkout_url: string }> {
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

  async updateStatus(orderId: string, status: OrderStatus, trackingNumber?: string | null): Promise<OrderStatusUpdateResult> {
    const res = await api.patch(`/orders/${orderId}/status`, {
      status,
      tracking_number: trackingNumber ?? null,
    });
    return res.data;
  },
};
