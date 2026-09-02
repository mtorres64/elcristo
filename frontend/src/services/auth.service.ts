import { api } from "./api";

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export const authService = {
  async register(payload: RegisterPayload) {
    const res = await api.post("/auth/register", payload);
    return res.data;
  },

  async verifyEmail(token: string) {
    const res = await api.post("/auth/verify-email", { token });
    return res.data as { message: string };
  },

  async resendVerification(email: string) {
    const res = await api.post("/auth/resend-verification", { email });
    return res.data as { message: string };
  },

  async forgotPassword(email: string) {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data as { message: string };
  },

  async resetPassword(token: string, password: string) {
    const res = await api.post("/auth/reset-password", { token, password });
    return res.data as { message: string };
  },

  async me() {
    const res = await api.get("/auth/me");
    return res.data;
  },
};
