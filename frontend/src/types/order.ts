export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "disputed";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  disputed: "En disputa",
};

export interface OrderItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

export interface OrderAddress {
  full_name: string;
  phone_country_code: string;
  phone: string;
  street: string;
  no_number: boolean;
  province: string;
  locality: string;
  zip: string | null;
  zip_unknown: boolean;
  department: string | null;
}

export interface OrderPayment {
  provider: string;
  brand: string | null;
  last4: string | null;
  status: string;
  paid_at: string | null;
}

export interface OrderSummary {
  order_id: string;
  order_number: string;
  tenant_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  status: OrderStatus;
  item_count: number;
  total: number;
  created_at: string;
}

export interface Order extends OrderSummary {
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  discount: number;
  shipping_address: OrderAddress;
  payment: OrderPayment;
  tracking_number: string | null;
  notes: string | null;
  updated_at: string;
}
