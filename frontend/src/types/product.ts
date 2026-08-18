export interface ProductVariant {
  key: string;
  value: string;
  stock: number;
  price_override: number | null;
  compare_at_price_override: number | null;
  weight_grams_override: number | null;
  height_cm_override: number | null;
  sku_override: string | null;
  active: boolean;
  recommended_pot_ids: string[];
}

export interface ProductSummary {
  product_id: string;
  tenant_id: string;
  tenant_name: string;
  title: string;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  image_url: string | null;
  is_featured: boolean;
  rating_avg: number | null;
  rating_count: number;
  status: string;
  category_id: string | null;
  stock: number;
  tags: string[];
  care: Record<string, string>;
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  images: string[];
  stock: number;
  variants: ProductVariant[];
  category_id: string | null;
  category_name: string | null;
  sold_count: number;
  sku: string | null;
  tags: string[];
  tax: string;
  weight_grams: number | null;
  height_cm: number | null;
  care: Record<string, string>;
  attributes: Record<string, string>;
  recommended_pot_ids: string[];
}
