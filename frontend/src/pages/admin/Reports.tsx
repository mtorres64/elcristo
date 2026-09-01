import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { useAuth } from "../../hooks/useAuth";
import { reportService } from "../../services/reports.service";
import { formatARS } from "../../utils/currency";
import type { DayPoint, ReportOverview } from "../../types/report";

// ─── Rango de fechas ────────────────────────────────────────────

type PresetKey = "7d" | "30d" | "90d" | "month";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "90d", label: "90 días" },
  { key: "month", label: "Este mes" },
];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rangeFor(preset: PresetKey): { from: string; to: string } {
  const today = new Date();
  const to = toISODate(today);
  if (preset === "month") {
    return { from: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)), to };
  }
  const days = preset === "7d" ? 6 : preset === "30d" ? 29 : 89;
  const start = new Date(today);
  start.setDate(start.getDate() - days);
  return { from: toISODate(start), to };
}

// ─── Formato ────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pago pendiente",
  paid: "Pagado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  disputed: "En disputa",
};

function fmtPct(pct: number | null): string {
  return pct === null ? "—" : `${pct.toFixed(1)}%`;
}

function fmtDayLabel(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function fmtRange(from: string, to: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const f = new Date(`${from}T00:00:00`).toLocaleDateString("es-AR", opts);
  const t = new Date(`${to}T00:00:00`).toLocaleDateString("es-AR", opts);
  return `${f} – ${t}`;
}

// ─── Sub-componentes ────────────────────────────────────────────

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-white border border-[#E8E2D8] p-4 sm:p-5">
      <p className="text-xs text-[#8A8A8A]">{label}</p>
      <p className="font-serif text-xl sm:text-2xl font-semibold text-[#1A1A1A] leading-tight mt-1">{value}</p>
      {hint && <p className="text-[11px] text-[#ABABAB] mt-1">{hint}</p>}
    </div>
  );
}

const PLOT_HEIGHT = 200;

function BarChart({
  data,
  valueKey,
  color,
}: {
  data: DayPoint[];
  valueKey: "revenue" | "cost";
  color: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  const labelEvery = data.length > 45 ? 10 : data.length > 20 ? 5 : 3;

  if (data.every((d) => d[valueKey] === 0)) {
    return <p className="text-sm text-[#8A8A8A] py-16 text-center">Sin movimientos en este período.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex pt-10" style={{ minWidth: data.length * 12 + 56 }}>
        <div
          className="hidden sm:flex flex-col justify-between shrink-0 w-14 pr-2 text-right"
          style={{ height: PLOT_HEIGHT }}
        >
          {[1, 0.5, 0].map((step) => (
            <span key={step} className="text-[10px] text-[#ABABAB] tabular-nums leading-none">
              {formatARS(Math.round((max * step) / 1000) * 1000)}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative" style={{ height: PLOT_HEIGHT }}>
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-t border-[#F0EDE8]" />
              ))}
            </div>
            <div className="relative flex items-end gap-[2px] h-full">
              {data.map((d, i) => {
                const pct = Math.max((d[valueKey] / max) * 100, 1);
                const isHovered = hovered === i;
                return (
                  <div
                    key={d.date}
                    className="relative flex-1 min-w-[6px] h-full flex flex-col justify-end"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                  >
                    {isHovered && (
                      <div
                        className={`absolute -top-10 z-10 whitespace-nowrap rounded-lg bg-[#1A1A1A] text-white text-[11px] px-2.5 py-1.5 shadow-lg pointer-events-none ${
                          i < 3 ? "left-0" : i > data.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                        }`}
                      >
                        <p className="font-semibold">{fmtDayLabel(d.date)}</p>
                        <p className="text-[#D5D9D4] mt-0.5">{formatARS(d[valueKey])}</p>
                      </div>
                    )}
                    <span
                      className="block w-full rounded-t-[3px] transition-opacity"
                      style={{ height: `${pct}%`, background: color, opacity: isHovered ? 0.8 : 1 }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-[2px] mt-2">
            {data.map((d, i) => (
              <div key={d.date} className="flex-1 min-w-[6px] text-center">
                {(i % labelEvery === 0 || i === data.length - 1) && (
                  <span className="text-[9px] text-[#ABABAB] whitespace-nowrap">{fmtDayLabel(d.date)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white border border-[#E8E2D8] p-5">
      <div className="mb-4">
        <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">{title}</h2>
        {subtitle && <p className="text-xs text-[#8A8A8A] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

// ─── Página ─────────────────────────────────────────────────────

export function Reports() {
  const { user } = useAuth();
  const [preset, setPreset] = useState<PresetKey>("30d");
  const range = useMemo(() => rangeFor(preset), [preset]);

  const [data, setData] = useState<ReportOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    reportService
      .overview({ from: range.from, to: range.to, tenant_id: user?.tenant_id ?? undefined })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("No se pudieron cargar los reportes. Intentá de nuevo.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, user?.tenant_id]);

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Fecha", "Ventas", "Pedidos", "Unidades vendidas", "Compras (costo)"],
      ...data.sales.by_day.map((d, i) => {
        const p = data.purchases.by_day[i];
        return [
          d.date,
          (d.revenue / 100).toFixed(2),
          String(d.orders),
          String(d.units),
          ((p?.cost ?? 0) / 100).toFixed(2),
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_${range.from}_${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-8 py-6 min-h-full">
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">Reportes</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">Reportes</h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              Ventas, compras y márgenes · {fmtRange(range.from, range.to)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex rounded-lg border border-[#E8E2D8] p-0.5 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPreset(p.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    preset === p.key ? "bg-[#1A2B1C] text-white" : "text-[#6B6B6B] hover:bg-[#F5F5F3]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={exportCsv}
              disabled={!data}
              className="rounded-lg border border-[#E8E2D8] px-3 py-1.5 text-xs font-medium text-[#4A4A4A] hover:bg-[#F9F8F5] transition-colors disabled:opacity-40"
            >
              Exportar CSV
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg bg-white border border-[#E8E2D8] p-16 text-center">
            <p className="text-sm text-[#6B6B6B]">{error}</p>
          </div>
        ) : loading || !data ? (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-white border border-[#E8E2D8]" />
              ))}
            </div>
            <div className="h-72 rounded-lg bg-white border border-[#E8E2D8]" />
            <div className="h-72 rounded-lg bg-white border border-[#E8E2D8]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Ventas */}
            <SectionCard title="Ventas" subtitle="Pedidos pagados, en preparación, enviados y entregados">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Ingresos" value={formatARS(data.sales.revenue)} />
                <StatCard label="Pedidos" value={String(data.sales.order_count)} />
                <StatCard label="Unidades vendidas" value={String(data.sales.units)} />
                <StatCard label="Ticket promedio" value={formatARS(data.sales.avg_ticket)} />
              </div>
              <BarChart data={data.sales.by_day} valueKey="revenue" color="#5A7A5C" />

              {data.sales.by_status.length > 0 && (
                <div className="mt-6 rounded-lg border border-[#E8E2D8] overflow-hidden overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E8E2D8] bg-[#F9F8F5]">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Estado</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Pedidos</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EDE8]">
                      {data.sales.by_status.map((s) => (
                        <tr key={s.status} className="hover:bg-[#F9F8F5] transition-colors">
                          <td className="px-4 py-2 text-sm text-[#1A1A1A]">{STATUS_LABEL[s.status] ?? s.status}</td>
                          <td className="px-4 py-2 text-sm text-[#4A4A4A] text-right tabular-nums">{s.count}</td>
                          <td className="px-4 py-2 text-sm font-medium text-[#1A1A1A] text-right tabular-nums">{formatARS(s.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            {/* Compras */}
            <SectionCard title="Compras" subtitle="Reposición de stock registrada a proveedores">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard label="Costo total" value={formatARS(data.purchases.total_cost)} />
                <StatCard label="Compras" value={String(data.purchases.purchase_count)} />
                <StatCard label="Unidades compradas" value={String(data.purchases.units)} />
              </div>
              <BarChart data={data.purchases.by_day} valueKey="cost" color="#B08968" />
            </SectionCard>

            {/* Márgenes */}
            <SectionCard
              title="Márgenes"
              subtitle="Ganancia bruta estimada con el costo actual de cada producto"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard label="Ingresos" value={formatARS(data.margins.revenue)} />
                <StatCard label="Costo de ventas" value={formatARS(data.margins.cogs)} />
                <StatCard label="Ganancia bruta" value={formatARS(data.margins.gross_profit)} />
                <StatCard label="Margen" value={fmtPct(data.margins.margin_pct)} />
              </div>

              {data.margins.items_without_cost > 0 && (
                <p className="text-[11px] text-[#B45309] mb-4">
                  {data.margins.items_without_cost} línea{data.margins.items_without_cost !== 1 ? "s" : ""} de venta sin
                  costo cargado — no se descontaron del margen. Cargá el costo en la ficha del producto para afinar el
                  cálculo.
                </p>
              )}

              {data.margins.by_product.length === 0 ? (
                <p className="text-sm text-[#8A8A8A] py-10 text-center">Sin ventas en este período.</p>
              ) : (
                <div className="rounded-lg border border-[#E8E2D8] overflow-hidden overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E8E2D8] bg-[#F9F8F5]">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Producto</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Unid.</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Ingresos</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Costo</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Ganancia</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Margen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EDE8]">
                      {data.margins.by_product.map((r) => (
                        <tr key={r.product_id} className="hover:bg-[#F9F8F5] transition-colors">
                          <td className="px-4 py-2 text-sm text-[#1A1A1A] max-w-[240px] truncate">{r.title}</td>
                          <td className="px-4 py-2 text-sm text-[#4A4A4A] text-right tabular-nums">{r.units}</td>
                          <td className="px-4 py-2 text-sm text-[#4A4A4A] text-right tabular-nums">{formatARS(r.revenue)}</td>
                          <td className="px-4 py-2 text-sm text-[#4A4A4A] text-right tabular-nums">{formatARS(r.cogs)}</td>
                          <td className="px-4 py-2 text-sm font-medium text-[#1A1A1A] text-right tabular-nums">{formatARS(r.profit)}</td>
                          <td className="px-4 py-2 text-sm text-right tabular-nums">
                            <span className={r.margin_pct !== null && r.margin_pct < 0 ? "text-[#B45309]" : "text-[#2D6A4F]"}>
                              {fmtPct(r.margin_pct)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
