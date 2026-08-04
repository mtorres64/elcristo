import { api } from "./api";
import type { Category } from "../types/category";

interface PaginatedCategories {
  items: Category[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

interface ListCategoriesParams {
  q?: string;
  is_active?: boolean;
  sort?: string;
  page?: number;
  page_size?: number;
}

interface CategoryPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export const categoryService = {
  async list(params: ListCategoriesParams = {}): Promise<PaginatedCategories> {
    const res = await api.get("/categories", { params });
    return res.data;
  },

  async getById(categoryId: string): Promise<Category> {
    const res = await api.get(`/categories/${categoryId}`);
    return res.data;
  },

  async create(data: CategoryPayload): Promise<Category> {
    const res = await api.post("/categories", data);
    return res.data;
  },

  async updateById(categoryId: string, data: CategoryPayload): Promise<Category> {
    const res = await api.patch(`/categories/${categoryId}`, data);
    return res.data;
  },

  async uploadImage(categoryId: string, file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post(`/categories/${categoryId}/image`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url as string;
  },

  async deleteById(categoryId: string): Promise<void> {
    await api.delete(`/categories/${categoryId}`);
  },
};
