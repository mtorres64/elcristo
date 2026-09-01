export interface DayPoint {
  date: string;        // YYYY-MM-DD
  revenue: number;     // centavos
  cost: number;        // centavos
  orders: number;
  units: number;
}

export interface StatusCount {
  status: string;
  count: number;
  total: number;       // centavos
}

export interface SalesReport {
  revenue: number;
  order_count: number;
  units: number;
  avg_ticket: number;
  by_day: DayPoint[];
  by_status: StatusCount[];
}

export interface PurchasesReport {
  total_cost: number;
  purchase_count: number;
  units: number;
  by_day: DayPoint[];
}

export interface MarginProductRow {
  product_id: string;
  title: string;
  units: number;
  revenue: number;
  cogs: number;
  profit: number;
  margin_pct: number | null;
}

export interface MarginsReport {
  revenue: number;
  cogs: number;
  gross_profit: number;
  margin_pct: number | null;
  items_without_cost: number;
  by_product: MarginProductRow[];
}

export interface ReportOverview {
  date_from: string;
  date_to: string;
  sales: SalesReport;
  purchases: PurchasesReport;
  margins: MarginsReport;
}
