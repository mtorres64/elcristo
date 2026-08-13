import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { formatARS } from "../../utils/currency";

// ─────────────────────────────────────────────────────────────────
// Datos hardcodeados hasta que exista el endpoint de analytics
// (ver docs/roadmap.md → Fase 4 "Analytics: ventas por día/semana/mes").
// Cuando se conecte la API, extraer a un hook `useDashboardStats`
// (ver convención en docs/ui-ux-guidelines.md, sección "Convenciones de componentes").
// ─────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 60;
const AVG_TICKET = 2_150_000; // centavos ($21.500 ARS), acorde al catálogo del vivero

interface DaySales {
  date: Date;
  orders: number;
  revenue: number; // centavos
}

// PRNG determinístico: mismos datos en cada render, sin depender de Math.random
function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSalesHistory(days: number): DaySales[] {
  const random = mulberry32(2026_08_07);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const history: DaySales[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * DAY_MS);
    const dow = date.getDay(); // 0 = domingo
    const weekendBoost = dow === 0 || dow === 6 ? 1.35 : 1;
    const trend = 1 + (days - i) / (days * 5); // leve crecimiento sostenido
    const noise = 0.65 + random() * 0.7;

    const orders = Math.max(1, Math.round(8 * weekendBoost * trend * noise));
    const ticketNoise = 0.8 + random() * 0.4;
    const revenue = Math.round((orders * AVG_TICKET * ticketNoise) / 1000) * 1000;

    history.push({ date, orders, revenue });
  }
  return history;
}

// ─── Iconos ─────────────────────────────────────────────────────
function SalesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
    </svg>
  );
}
function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" strokeLinecap="round" />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.29 3.86l-8.18 14.18A1.5 1.5 0 0 0 3.36 20h17.28a1.5 1.5 0 0 0 1.25-2L13.71 3.86a1.5 1.5 0 0 0-2.42 0z" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  );
}
function TrendArrow({ up }: { up: boolean }) {
  return (
    <svg
      width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      className={up ? "" : "rotate-180"}
    >
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}
function CategoriesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <path d="M7 7h.01" strokeLinecap="round" />
    </svg>
  );
}
function DiscountIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <line x1="19" y1="5" x2="5" y2="19" strokeLinecap="round" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}
function ReportsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
      <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" />
    </svg>
  );
}
function ClientsShortcutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}
function TableIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
      <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" />
    </svg>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  deltaLabel?: string;
  deltaUp?: boolean;
  sparkline?: number[];
  to?: string;
}

function StatCard({ icon, label, value, deltaLabel, deltaUp, sparkline, to }: StatCardProps) {
  const content = (
    <div className="rounded-lg bg-white border border-[#E8E2D8] p-5 h-full flex flex-col gap-3 transition-colors hover:border-[#C8D8C0]">
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-lg bg-[#E8EDE5] text-[#1A2B1C] flex items-center justify-center shrink-0">
          {icon}
        </div>
        {sparkline && sparkline.length > 1 && <Sparkline values={sparkline} />}
      </div>
      <div>
        <p className="text-xs text-[#8A8A8A]">{label}</p>
        <p className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight mt-0.5">{value}</p>
      </div>
      {deltaLabel && (
        <p
          className={`inline-flex items-center gap-1 text-[11px] font-medium ${
            deltaUp ? "text-[#2D6A4F]" : "text-[#B45309]"
          }`}
        >
          <TrendArrow up={!!deltaUp} />
          {deltaLabel}
        </p>
      )}
    </div>
  );

  return to ? (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}

function Sparkline({ values }: { values: number[] }) {
  const width = 64;
  const height = 28;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });

  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0" aria-hidden="true">
      <path d={path} fill="none" stroke="#C8D8C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill="#1A2B1C" />
    </svg>
  );
}

interface QuickLink {
  icon: React.ReactNode;
  label: string;
  description: string;
  to: string;
  badge?: number;
}

function QuickLinkCard({ icon, label, description, to, badge }: QuickLink) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg bg-white border border-[#E8E2D8] p-4 transition-colors hover:border-[#1A2B1C] hover:bg-[#F9FBF9]"
    >
      <div className="w-10 h-10 rounded-lg bg-[#F0EDE8] text-[#1A2B1C] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#1A1A1A] truncate">{label}</p>
          {!!badge && (
            <span className="bg-[#5A7A5C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#8A8A8A] truncate">{description}</p>
      </div>
      <ChevronRightIcon />
    </Link>
  );
}

const WEEKDAY_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function formatDayLabel(date: Date): string {
  return `${WEEKDAY_SHORT[date.getDay()]} ${date.getDate()}`;
}

function formatDayFull(date: Date): string {
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
}

// Alto del área de barras. `overflow-x-auto` en el contenedor scrolleable
// fuerza overflow-y a "auto" (regla del spec CSS), así que nada puede
// sobresalir del box en el eje Y — el tooltip y la etiqueta "Hoy" viven
// en un `pt-12` reservado arriba en lugar de un `-top-*` sin contención.
const PLOT_HEIGHT = 220;

function SalesBarChart({ data }: { data: DaySales[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.revenue), 1);

  // Grid lines de referencia, de arriba (100%) hacia abajo (0)
  const gridSteps = [1, 0.75, 0.5, 0.25, 0];

  // Mostrar etiqueta de fecha cada N barras para que no se amontonen
  const labelEvery = data.length > 45 ? 10 : data.length > 20 ? 5 : 3;

  return (
    <div className="overflow-x-auto">
      <div className="flex pt-12" style={{ minWidth: data.length * 10 + 56 }}>
        {/* Eje Y */}
        <div
          className="hidden sm:flex flex-col justify-between shrink-0 w-12 pr-2 text-right"
          style={{ height: PLOT_HEIGHT }}
        >
          {gridSteps.map((step) => (
            <span key={step} className="text-[10px] text-[#ABABAB] tabular-nums leading-none">
              {step === 0 ? "$0" : formatARS(Math.round((max * step) / 1000) * 1000)}
            </span>
          ))}
        </div>

        {/* Barras + eje X */}
        <div className="flex-1 min-w-0">
          <div className="relative" style={{ height: PLOT_HEIGHT }}>
            {/* Gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {gridSteps.map((step) => (
                <div key={step} className="border-t border-[#F0EDE8]" />
              ))}
            </div>

            {/* Barras */}
            <div className="relative flex items-end gap-[2px] h-full">
              {data.map((d, i) => {
                const pct = Math.max((d.revenue / max) * 100, 2);
                const isToday = i === data.length - 1;
                const isHovered = hovered === i;
                return (
                  <div
                    key={d.date.toISOString()}
                    className="relative flex-1 min-w-[6px] h-full flex flex-col justify-end"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                  >
                    {isToday && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-[#1A2B1C] uppercase tracking-wide whitespace-nowrap">
                        Hoy
                      </span>
                    )}
                    {/* Tooltip — cabe dentro del pt-12 reservado en el contenedor con scroll */}
                    {isHovered && (
                      <div
                        className={`absolute -top-12 z-10 whitespace-nowrap rounded-lg bg-[#1A1A1A] text-white text-[11px] px-2.5 py-1.5 shadow-lg pointer-events-none ${
                          i < 3 ? "left-0" : i > data.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                        }`}
                      >
                        <p className="font-semibold capitalize">{formatDayFull(d.date)}</p>
                        <p className="text-[#D5D9D4] mt-0.5">
                          {formatARS(d.revenue)} · {d.orders} pedido{d.orders !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      onFocus={() => setHovered(i)}
                      onBlur={() => setHovered((h) => (h === i ? null : h))}
                      aria-label={`${formatDayFull(d.date)}: ${formatARS(d.revenue)}, ${d.orders} pedidos`}
                      className="w-full h-full flex flex-col justify-end focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A2B1C] rounded-t-[4px]"
                    >
                      <span
                        className={`block w-full rounded-t-[4px] transition-colors ${
                          isToday || isHovered ? "bg-[#1A2B1C]" : "bg-[#7AA07C]"
                        }`}
                        style={{ height: `${pct}%` }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Eje X */}
          <div className="flex gap-[2px] mt-2">
            {data.map((d, i) => (
              <div key={d.date.toISOString()} className="flex-1 min-w-[6px] text-center">
                {(i % labelEvery === 0 || i === data.length - 1) && (
                  <span className="text-[9px] text-[#ABABAB] whitespace-nowrap">{formatDayLabel(d.date)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesTable({ data }: { data: DaySales[] }) {
  const rows = [...data].reverse(); // más reciente primero
  return (
    <div className="rounded-lg border border-[#E8E2D8] overflow-hidden max-h-72 overflow-y-auto">
      <table className="w-full">
        <thead className="sticky top-0">
          <tr className="border-b border-[#E8E2D8] bg-[#F9F8F5]">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Fecha
            </th>
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Pedidos
            </th>
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Ventas
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0EDE8]">
          {rows.map((d) => (
            <tr key={d.date.toISOString()} className="hover:bg-[#F9F8F5] transition-colors">
              <td className="px-4 py-2 text-sm text-[#1A1A1A] capitalize whitespace-nowrap">
                {formatDayFull(d.date)}
              </td>
              <td className="px-4 py-2 text-sm text-[#4A4A4A] text-right tabular-nums">{d.orders}</td>
              <td className="px-4 py-2 text-sm font-medium text-[#1A1A1A] text-right tabular-nums">
                {formatARS(d.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────

export function Dashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState<30 | 60>(30);
  const [view, setView] = useState<"chart" | "table">("chart");

  const fullHistory = useMemo(() => generateSalesHistory(MAX_DAYS), []);
  const visible = useMemo(() => fullHistory.slice(-range), [fullHistory, range]);

  const today = fullHistory[fullHistory.length - 1];
  const yesterday = fullHistory[fullHistory.length - 2];
  const todayDelta = yesterday.revenue === 0 ? 0 : ((today.revenue - yesterday.revenue) / yesterday.revenue) * 100;
  const sparklineValues = fullHistory.slice(-14).map((d) => d.revenue);

  const totalRevenue = visible.reduce((sum, d) => sum + d.revenue, 0);
  const avgPerDay = Math.round(totalRevenue / visible.length);

  // Métricas derivadas de forma liviana a partir del día actual, hasta tener endpoints reales
  const pendingOrders = Math.round(today.orders * 0.55) + 3;
  const lowStockCount = 3;
  const newClients = 14;

  const firstName = user?.name?.split(" ")[0] ?? "Vendedor";

  return (
    <AdminLayout>
      <div className="px-4 sm:px-8 py-6 min-h-full">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">
              Hola, {firstName}
            </h1>
            <p className="text-xs text-[#8A8A8A] mt-1">Así viene tu tienda hoy</p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<SalesIcon />}
            label="Ventas de hoy"
            value={formatARS(today.revenue)}
            deltaLabel={`${todayDelta >= 0 ? "+" : ""}${todayDelta.toFixed(1)}% vs. ayer`}
            deltaUp={todayDelta >= 0}
            sparkline={sparklineValues}
          />
          <StatCard
            icon={<ClipboardIcon />}
            label="Pedidos pendientes"
            value={String(pendingOrders)}
            deltaLabel="Esperando preparación"
            deltaUp
            to="/seller/orders"
          />
          <StatCard
            icon={<WarningIcon />}
            label="Stock bajo"
            value={String(lowStockCount)}
            deltaLabel="Revisar inventario"
            deltaUp={false}
            to="/seller/products"
          />
          <StatCard
            icon={<UsersIcon />}
            label="Clientes nuevos"
            value={String(newClients)}
            deltaLabel="Últimos 30 días"
            deltaUp
            to="/seller/clients"
          />
        </div>

        {/* Accesos rápidos */}
        <div className="mb-8">
          <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-3">Accesos rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickLinkCard
              icon={<PlusIcon />}
              label="Nuevo producto"
              description="Cargar una planta al catálogo"
              to="/seller/products/new"
            />
            <QuickLinkCard
              icon={<ClipboardIcon />}
              label="Pedidos"
              description="Preparar y despachar ventas"
              to="/seller/orders"
              badge={pendingOrders}
            />
            <QuickLinkCard
              icon={<ClientsShortcutIcon />}
              label="Clientes"
              description="Ver compradores de la tienda"
              to="/seller/clients"
            />
            <QuickLinkCard
              icon={<CategoriesIcon />}
              label="Categorías"
              description="Organizar el catálogo"
              to="/seller/categories"
            />
            <QuickLinkCard
              icon={<DiscountIcon />}
              label="Descuentos"
              description="Crear una promoción"
              to="/seller/discounts"
            />
            <QuickLinkCard
              icon={<ReportsIcon />}
              label="Reportes"
              description="Exportar datos de ventas"
              to="/seller/reports"
            />
          </div>
        </div>

        {/* Gráfico de ventas */}
        <div className="rounded-lg bg-white border border-[#E8E2D8] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                Ventas de los últimos {range} días
              </h2>
              <p className="text-xs text-[#8A8A8A] mt-1">
                Total {formatARS(totalRevenue)} · Promedio {formatARS(avgPerDay)}/día
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Toggle 30 / 60 días */}
              <div className="inline-flex rounded-lg border border-[#E8E2D8] p-0.5">
                {([30, 60] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      range === r ? "bg-[#1A2B1C] text-white" : "text-[#6B6B6B] hover:bg-[#F5F5F3]"
                    }`}
                  >
                    {r} días
                  </button>
                ))}
              </div>

              {/* Toggle chart / table */}
              <div className="inline-flex rounded-lg border border-[#E8E2D8] p-0.5">
                <button
                  onClick={() => setView("chart")}
                  aria-label="Ver como gráfico"
                  title="Ver como gráfico"
                  className={`p-1.5 rounded-md transition-colors ${
                    view === "chart" ? "bg-[#1A2B1C] text-white" : "text-[#6B6B6B] hover:bg-[#F5F5F3]"
                  }`}
                >
                  <ChartIcon />
                </button>
                <button
                  onClick={() => setView("table")}
                  aria-label="Ver como tabla"
                  title="Ver como tabla"
                  className={`p-1.5 rounded-md transition-colors ${
                    view === "table" ? "bg-[#1A2B1C] text-white" : "text-[#6B6B6B] hover:bg-[#F5F5F3]"
                  }`}
                >
                  <TableIcon />
                </button>
              </div>
            </div>
          </div>

          {view === "chart" ? <SalesBarChart data={visible} /> : <SalesTable data={visible} />}
        </div>
      </div>
    </AdminLayout>
  );
}
