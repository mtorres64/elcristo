import { api } from "./api";
import type { ImportJob, ProductDetail, ProductSummary, ProductVariant } from "../types/product";

interface PaginatedProducts {
  items: ProductSummary[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

interface ListProductsParams {
  q?: string;
  status?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  on_sale?: boolean;
  ids?: string;
  page?: number;
  page_size?: number;
  sort?: string;
  tenant_id?: string;
}

export const productService = {
  async list(params: ListProductsParams = {}): Promise<PaginatedProducts> {
    const res = await api.get("/products", { params });
    return res.data;
  },

  async getById(productId: string): Promise<ProductDetail> {
    const res = await api.get(`/products/${productId}`);
    return res.data;
  },

  async create(data: {
    title: string;
    short_description?: string | null;
    description?: string | null;
    price: number;
    compare_at_price?: number | null;
    cost_price?: number | null;
    target_markup_pct?: number | null;
    currency?: string;
    tax?: string;
    category_id?: string | null;
    stock?: number;
    sku?: string | null;
    is_featured?: boolean;
    weight_grams?: number | null;
    height_cm?: number | null;
    tags?: string[];
    care?: Record<string, string>;
    attributes?: Record<string, string>;
    variants?: Partial<ProductVariant>[];
    recommended_pot_ids?: string[];
  }): Promise<ProductDetail> {
    const res = await api.post("/products", data);
    return res.data;
  },

  async uploadImage(productId: string, file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post(`/products/${productId}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url as string;
  },

  async updateById(
    productId: string,
    data: {
      title?: string;
      short_description?: string | null;
      description?: string | null;
      price?: number;
      compare_at_price?: number | null;
      cost_price?: number | null;
      target_markup_pct?: number | null;
      currency?: string;
      tax?: string;
      category_id?: string | null;
      stock?: number;
      sku?: string | null;
      status?: string;
      is_featured?: boolean;
      weight_grams?: number | null;
      height_cm?: number | null;
      tags?: string[];
      images?: string[];
      care?: Record<string, string>;
      attributes?: Record<string, string>;
      variants?: Partial<ProductVariant>[];
      recommended_pot_ids?: string[];
    }
  ): Promise<ProductDetail> {
    const res = await api.patch(`/products/${productId}`, data);
    return res.data;
  },

  async deleteById(productId: string): Promise<void> {
    await api.delete(`/products/${productId}`);
  },
};

export const productImportService = {
  async downloadTemplate(): Promise<void> {
    const res = await api.get("/products/import/template", { responseType: "blob" });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-productos.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  async start(file: File): Promise<{ job_id: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/products/import", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getJob(jobId: string): Promise<ImportJob> {
    const res = await api.get(`/products/import/${jobId}`);
    return res.data;
  },
};
