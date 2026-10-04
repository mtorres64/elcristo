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
  lat?: number | null;
  lng?: number | null;
}

export interface OrderPayment {
  provider: string;
  brand: string | null;
  last4: string | null;
  payment_id: string | null;
  authorization_code: string | null;
  status: string;
  paid_at: string | null;
  refund_id?: string | null;
  refunded_at?: string | null;
  // Sólo si se pagó en cuotas: cantidad y lo que realmente se le cobró a la
  // tarjeta (con interés, si el plan lo tenía) — `total` del pedido nunca lo incluye.
  installments?: number | null;
  installment_total?: number | null;
}

export type InstallmentType = "no_interest" | "with_interest";

/** Un plan de cuotas cotizado por Getnet para una tarjeta y un monto — ver
 * `POST /orders/installment-quotes`. */
export interface InstallmentPlan {
  number_installments: number;
  installment_type: InstallmentType;
  installment_schema: string;
  quote_id: string;
  installment_amount: number; // centavos, cada cuota
  total_amount: number;       // centavos, total que se le cobra a la tarjeta
  interest_amount: number;    // centavos, total_amount - el monto cotizado
}

/** El plan elegido por el comprador — eco de un `InstallmentPlan`, se manda
 * tal cual al crear el pedido. */
export type InstallmentSelection = InstallmentPlan;

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
  pickup: boolean;
  shipping_zone_name: string | null;
  shipping_address: OrderAddress;
  payment: OrderPayment;
  tracking_number: string | null;
  notes: string | null;
  updated_at: string;
}

export type RefundOutcomeKind = "refunded" | "not_required" | "skipped" | "failed" | "unknown";

// Resultado de la devolución en la pasarela al cancelar un pedido cobrado.
export interface RefundOutcome {
  outcome: RefundOutcomeKind;
  message: string;
  amount: number | null;
  refund_id: string | null;
}

export interface OrderStatusUpdateResult extends Order {
  refund: RefundOutcome | null;
}
