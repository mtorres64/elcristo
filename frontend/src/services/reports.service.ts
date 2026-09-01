import { api } from "./api";
import type { ReportOverview } from "../types/report";

interface OverviewParams {
  from: string;          // YYYY-MM-DD
  to: string;            // YYYY-MM-DD
  tenant_id?: string;
}

export const reportService = {
  async overview(params: OverviewParams): Promise<ReportOverview> {
    const res = await api.get("/reports/overview", { params });
    return res.data;
  },
};
