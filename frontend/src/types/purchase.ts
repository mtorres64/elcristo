export type PurchaseSize = "pequeña" | "mediana" | "grande";

export interface PurchaseItem {
  product_id: string;
  title: string;
  size: PurchaseSize;
  quantity: number;
  unit_cost: number;
  prev_cost: number | null;
  prev_price: number | null;
  new_price: number | null;
  markup_pct: number | null;
}

export interface PurchaseSummary {
  purchase_id: string;
  tenant_id: string;
  supplier: string | null;
  reference: string | null;
  item_count: number;
  total_units: number;
  total_cost: number;
  created_at: string;
}

export interface PurchaseDetail extends PurchaseSummary {
  note: string | null;
  items: PurchaseItem[];
  updated_at: string | null;
}

export interface PurchaseItemInput {
  product_id: string;
  size: PurchaseSize;
  quantity: number;
  unit_cost: number;
  new_price?: number | null;
}

export interface PurchaseCreateInput {
  supplier?: string | null;
  reference?: string | null;
  note?: string | null;
  items: PurchaseItemInput[];
}
