export interface PaymentMethod {
  payment_method_id: string;
  type: string;
  brand: "visa" | "mastercard" | "amex" | "other";
  holder_name: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
}

export interface PaymentCardInput {
  card_number: string;
  holder_name: string;
  exp_month: number;
  exp_year: number;
  is_default?: boolean;
  // Sólo lo pide el flujo mock (PaymentMethodForm) — con Getnet activo
  // (Web Checkout) ningún formulario propio pide ni manda datos de tarjeta,
  // Getnet aloja ese formulario.
  security_code?: string;
}
