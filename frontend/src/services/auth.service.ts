import { api } from "./api";

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: "buyer" | "seller";
}

export const authService = {
  async register(payload: RegisterPayload) {
    const res = await api.post("/auth/register", payload);
    return res.data;
  },

  async me() {
    const res = await api.get("/auth/me");
    return res.data;
  },
};
