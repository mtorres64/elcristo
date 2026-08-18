import { api } from "./api";
import type { PaymentCardInput, PaymentMethod } from "../types/payment";

export const paymentService = {
  async list(): Promise<PaymentMethod[]> {
    const res = await api.get("/payment-methods");
    return res.data;
  },

  async create(data: PaymentCardInput): Promise<PaymentMethod> {
    const res = await api.post("/payment-methods", data);
    return res.data;
  },

  async setDefault(paymentMethodId: string): Promise<PaymentMethod> {
    const res = await api.patch(`/payment-methods/${paymentMethodId}/default`);
    return res.data;
  },

  async remove(paymentMethodId: string): Promise<void> {
    await api.delete(`/payment-methods/${paymentMethodId}`);
  },
};
