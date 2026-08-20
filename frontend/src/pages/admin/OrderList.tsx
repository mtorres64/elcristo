import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { orderService } from "../../services/order.service";
import { useAuth } from "../../hooks/useAuth";
import { ORDER_STATUS_LABEL } from "../../types/order";
import type { OrderStatus, OrderSummary } from "../../types/order";
import { formatARS } from "../../utils/currency";

const PAGE_SIZE = 20;

const INPUT =
  "rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

const SELECT =
  "rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors appearance-none cursor-pointer pr-8";

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending_payment: "bg-[#FFF4E5] text-[#A05A00]",
  paid: "bg-[#E6F4EA] text-[#2D6A4F]",
  preparing: "bg-[#EAF0FA] text-[#2D4F8A]",
  shipped: "bg-[#EDE8FA] text-[#5A3D8A]",
  delivered: "bg-[#E6F4EA] text-[#2D6A4F]",
  cancelled: "bg-[#F2F2F2] text-[#6B6B6B]",
  refunded: "bg-[#FDEDED] text-[#A03030]",
  disputed: "bg-[#FDEDED] text-[#A03030]",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLE[status]}`}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

function ChevronDown() {
  return (
    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8A8A]" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB]" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function SkeletonRows() {
  return (
    <div className="animate-pulse divide-y divide-[#F0EDE8]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[#EDE9E2] rounded w-1/4" />
            <div className="h-2.5 bg-[#F0EDE8] rounded w-1/3" />
          </div>
          <div className="h-5 w-20 bg-[#EDE9E2] rounded-full" />
          <div className="h-3 w-16 bg-[#F0EDE8] rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-14 h-14 rounded-full bg-[#F0EDE8] flex items-center justify-center">
        <svg className="w-7 h-7 text-[#ABABAB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
        </svg>
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm text-[#6B6B6B]">No se encontraron pedidos con esos filtros.</p>
          <button onClick={onReset} className="text-xs text-[#1A2B1C] underline underline-offset-2 hover:text-[#253824] transition-colors">
            Limpiar filtros
          </button>
        </>
      ) : (
        <p className="text-sm text-[#6B6B6B]">Todavía no hay pedidos.</p>
      )}
    </div>
  );
}

function OrderCardMobile({ order }: { order: OrderSummary }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button onClick={() => setExpanded((e) => !e)} className="w-full flex items-start gap-3 px-4 py-3.5 text-left">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1A2B1C] mb-0.5">{order.order_number}</p>
          <p className="text-sm text-[#1A1A1A] truncate">{order.buyer_name}</p>
          <p className="text-xs text-[#ABABAB] truncate">{order.buyer_email}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <p className="text-sm font-semibold text-[#1A1A1A]">{formatARS(order.total)}</p>
          <StatusBadge status={order.status} />
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-[#8A8A8A] transition-transform shrink-0 mt-1 ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-3.5 flex flex-col gap-2.5 border-t border-[#F0EDE8] pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8A8A8A]">Ítems</span>
            <span className="text-[#4A4A4A]">{order.item_count}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8A8A8A]">Fecha</span>
            <span className="text-[#4A4A4A]">
              {new Date(order.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
          <Link
            to={`/seller/orders/${order.order_id}`}
            className="mt-1 flex items-center justify-center px-3 py-1.5 text-xs font-medium text-[#1A2B1C] border border-[#E8E2D8] rounded-lg hover:bg-[#F5F5F3] transition-colors"
          >
            Ver pedido
          </Link>
        </div>
      )}
    </div>
  );
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const all = Array.from({ length: pages }, (_, i) => i + 1);
  let visible: (number | "...")[];
  if (pages <= 7) {
    visible = all;
  } else if (page <= 4) {
    visible = [...all.slice(0, 5), "...", pages];
  } else if (page >= pages - 3) {
    visible = [1, "...", ...all.slice(pages - 5)];
  } else {
    visible = [1, "...", page - 1, page, page + 1, "...", pages];
  }
  const btn = "rounded-lg px-2.5 py-1.5 text-xs border border-[#E8E2D8] text-[#4A4A4A] hover:bg-[#F9F8F5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E2D8]">
      <p className="text-xs text-[#8A8A8A]">Página {page} de {pages}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className={btn}>←</button>
        {visible.map((v, i) =>
          v === "..." ? (
            <span key={`e${i}`} className="px-2 py-1.5 text-xs text-[#ABABAB]">…</span>
          ) : (
            <button
              key={v}
              onClick={() => onPage(v as number)}
              className={`rounded-lg px-2.5 py-1.5 text-xs border transition-colors ${v === page ? "bg-[#1A2B1C] text-white border-[#1A2B1C]" : "border-[#E8E2D8] text-[#4A4A4A] hover:bg-[#F9F8F5]"}`}
            >
              {v}
            </button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === pages} className={btn}>→</button>
      </div>
    </div>
  );
}

export function OrderList() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [items, setItems] = useState<OrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, statusFilter, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    orderService
      .list({
        tenant_id: user?.tenant_id ?? undefined,
        q: debouncedQ || undefined,
        status: statusFilter || undefined,
        sort,
        page,
        page_size: PAGE_SIZE,
      })
      .then((data) => {
        if (!cancelled) {
          setItems(data.items);
          setTotal(data.total);
          setPages(data.pages);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudieron cargar los pedidos. Intentá de nuevo.");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [debouncedQ, statusFilter, sort, page, user?.tenant_id]);

  const hasFilters = !!(q || statusFilter || sort !== "newest");
  const activeFilterCount = [q, statusFilter, sort !== "newest" ? sort : ""].filter(Boolean).length;

  function handleReset() {
    setQ("");
    setStatusFilter("");
    setSort("newest");
    setPage(1);
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-8 py-6 min-h-full">
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">Pedidos</span>
        </nav>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">Pedidos</h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              {loading ? "Cargando..." : `${total} pedido${total !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Filter toggle (mobile only) */}
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="sm:hidden w-full flex items-center justify-between rounded-lg bg-white border border-[#E8E2D8] px-4 py-2.5 mb-4 text-sm text-[#1A1A1A]"
        >
          <span className="flex items-center gap-2">
            <FilterIcon />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-[#1A2B1C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-[#8A8A8A] transition-transform ${filtersOpen ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div className={`rounded-lg bg-white border border-[#E8E2D8] p-4 mb-4 ${filtersOpen ? "block" : "hidden"} sm:block`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
            <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
              <SearchIcon />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por Nº de pedido o cliente..."
                className={`${INPUT} w-full pl-9`}
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${SELECT} w-full sm:w-[190px]`}>
                <option value="">Todos los estados</option>
                {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
            <div className="relative w-full sm:w-auto">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${SELECT} w-full sm:w-[170px]`}>
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
              </select>
              <ChevronDown />
            </div>
            {hasFilters && (
              <button onClick={handleReset} className="text-xs text-[#8A8A8A] hover:text-[#1A2B1C] transition-colors underline underline-offset-2">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white border border-[#E8E2D8] overflow-hidden overflow-x-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-sm text-[#6B6B6B]">{error}</p>
            </div>
          ) : loading ? (
            <SkeletonRows />
          ) : items.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onReset={handleReset} />
          ) : (
            <>
              {/* Desktop table */}
              <table className="w-full hidden sm:table">
                <thead>
                  <tr className="border-b border-[#E8E2D8] bg-[#F9F8F5]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Nº pedido</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[100px]">Ítems</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[120px]">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[150px]">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[120px]">Fecha</th>
                    <th className="w-[60px] px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE8]">
                  {items.map((order) => (
                    <tr key={order.order_id} className="hover:bg-[#F9F8F5] transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/seller/orders/${order.order_id}`} className="text-sm font-medium text-[#1A2B1C] hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-[#1A1A1A]">{order.buyer_name}</p>
                        <p className="text-xs text-[#ABABAB]">{order.buyer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B6B6B]">{order.item_count}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#1A1A1A]">{formatARS(order.total)}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-xs text-[#6B6B6B] whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/seller/orders/${order.order_id}`} className="text-xs text-[#1A2B1C] hover:underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-[#F0EDE8]">
                {items.map((order) => (
                  <OrderCardMobile key={order.order_id} order={order} />
                ))}
              </div>

              {pages > 1 && <Pagination page={page} pages={pages} onPage={setPage} />}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
