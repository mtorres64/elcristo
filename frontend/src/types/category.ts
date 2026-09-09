export type CategoryGroup = "plantas" | "macetas" | "quimicos";

/** Secciones del nav superior. El orden acá define el orden de los desplegables
 * y de los bloques en /categories y el footer. */
export const CATEGORY_GROUPS: { value: CategoryGroup; label: string }[] = [
  { value: "plantas", label: "Plantas" },
  { value: "macetas", label: "Macetas & Accesorios" },
  { value: "quimicos", label: "Productos Químicos" },
];

export const CATEGORY_GROUP_LABEL: Record<CategoryGroup, string> = {
  plantas: "Plantas",
  macetas: "Macetas & Accesorios",
  quimicos: "Productos Químicos",
};

export interface Category {
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  group: CategoryGroup;
  product_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
