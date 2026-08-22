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
  // Sólo lo llena GetnetPaymentForm — el flujo mock (PaymentMethodForm) nunca
  // lo pide ni lo manda. Se usa una vez para cobrar con Getnet y se descarta.
  security_code?: string;
}
