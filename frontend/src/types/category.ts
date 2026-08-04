export interface Category {
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  product_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
