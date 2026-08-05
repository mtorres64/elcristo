import { api } from "./api";
import type { User, UserListParams, UserCreatePayload, UserUpdatePayload } from "../types/user";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const userService = {
  async list(params: UserListParams = {}): Promise<PaginatedResponse<User>> {
    const res = await api.get("/users", { params });
    return res.data;
  },

  async create(payload: UserCreatePayload): Promise<User> {
    const res = await api.post("/users", payload);
    return res.data;
  },

  async getById(userId: string): Promise<User> {
    const res = await api.get(`/users/${userId}`);
    return res.data;
  },

  async updateById(userId: string, payload: UserUpdatePayload): Promise<User> {
    const res = await api.patch(`/users/${userId}`, payload);
    return res.data;
  },

  async toggleActive(userId: string): Promise<User> {
    const res = await api.patch(`/users/${userId}/toggle-active`);
    return res.data;
  },

  async deleteById(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`);
  },
};
