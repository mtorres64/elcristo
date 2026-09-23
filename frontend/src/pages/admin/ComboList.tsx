import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { productService } from "../../services/product.service";
import { useAuth } from "../../context/AuthContext";
import { usePageSize } from "../../hooks/usePageSize";
import { PageSizeSelect } from "../../components/admin/PageSizeSelect";
import { formatARS } from "../../utils/currency";
import type { ProductSummary } from "../../types/product";
import toast from "react-hot-toast";

const INPUT =
  "rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";
const SELECT =
  "rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors appearance-none cursor-pointer pr-8";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function resolveImageUrl(src: string): string {
  return src.startsWith("/") ? `${API_BASE}${src}` : src;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active: { label: "Activo", cls: "bg-[#E6F4EA] text-[#2D6A4F]" },
  draft: { label: "Borrador", cls: "bg-[#FFF8E7] text-[#926D20]" },
  paused: { label: "Pausado", cls: "bg-[#F2F2F2] text-[#6B6B6B]" },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, cls: "bg-[#F2F2F2] text-[#6B6B6B]" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded-full">0</span>;
  if (stock <= 3)
    return <span className="text-xs font-semibold text-[#926D20] bg-[#FFF8E7] px-2 py-0.5 rounded-full">{stock}</span>;
  return <span className="text-xs font-semibold text-[#2D6A4F] bg-[#E6F4EA] px-2 py-0.5 rounded-full">{stock}</span>;
}

function ComboThumb({ src, title }: { src: string | null; title: string }) {
  if (src) {
    return <img src={resolveImageUrl(src)} alt={title} className="w-10 h-10 object-cover shrink-0 rounded-lg" />;
  }
  return (
    <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-[#C8D8C0] to-[#A8BCA0] flex items-center justify-center">
      <svg className="w-5 h-5 text-[#5A7A5C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

function ChevronDown() {
  return (
    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8A8A]" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ComboRow({ combo, onDelete }: { combo: ProductSummary; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await productService.deleteById(combo.product_id);
      toast.success(`"${combo.title}" eliminado`);
      onDelete(combo.product_id);
    } catch {
      toast.error("No se pudo eliminar el combo");
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <tr className="transition-colors hover:bg-[#F9F8F5]">
      <td className="px-4 py-3.5 w-[58px]">
        <ComboThumb src={combo.image_url} title={combo.title} />
      </td>
      <td className="px-4 py-3.5 max-w-[320px]">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-[#1A1A1A] leading-snug line-clamp-1">{combo.title}</p>
          {combo.is_featured && <span className="text-[#D4A017] text-sm shrink-0" title="Destacado">★</span>}
        </div>
        {combo.short_description && (
          <p className="text-[11px] text-[#8A8A8A] line-clamp-1 mt-0.5 leading-relaxed">{combo.short_description}</p>
        )}
      </td>
      <td className="px-4 py-3.5 w-[110px] text-center">
        <StockBadge stock={combo.stock} />
      </td>
      <td className="px-4 py-3.5 w-[110px]">
        <StatusBadge status={combo.status} />
      </td>
      <td className="px-4 py-3.5 w-[130px] text-right">
        <p className="text-sm font-medium text-[#1A1A1A] tabular-nums">{formatARS(combo.price)}</p>
        {combo.compare_at_price && (
          <p className="text-[11px] text-[#ABABAB] line-through tabular-nums mt-0.5">{formatARS(combo.compare_at_price)}</p>
        )}
      </td>
      <td className="px-4 py-3.5 w-[80px] text-right">
        {confirming ? (
          <div className="flex items-center justify-end gap-1">
            <span className="text-xs text-[#6B6B6B] mr-1">¿Eliminar?</span>
            <button onClick={handleDelete} disabled={deleting} className="px-2 py-1 text-xs font-medium bg-[#DC2626] text-white rounded hover:bg-[#B91C1C] transition-colors disabled:opacity-50">
              {deleting ? "…" : "Sí"}
            </button>
            <button onClick={() => setConfirming(false)} disabled={deleting} className="px-2 py-1 text-xs text-[#6B6B6B] border border-[#E8E2D8] rounded hover:bg-[#F5F5F3] transition-colors">
              No
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <Link to={`/seller/combos/${combo.product_id}/edit`} className="p-1.5 text-[#6B6B6B] hover:text-[#1A2B1C] transition-colors" title="Editar">
              <PencilIcon />
            </Link>
            <button onClick={() => setConfirming(true)} className="p-1.5 text-[#6B6B6B] hover:text-[#DC2626] transition-colors" title="Eliminar">
              <TrashIcon />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export function ComboList() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize();

  const [items, setItems] = useState<ProductSummary[]>([]);
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
  }, [debouncedQ, status, pageSize]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    productService
      .list({
        q: debouncedQ || undefined,
        status: status || undefined,
        product_type: "combo",
        page,
        page_size: pageSize,
        tenant_id: user?.tenant_id ?? undefined,
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
          setError("No se pudieron cargar los combos. Intentá de nuevo.");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [debouncedQ, status, page, pageSize, user?.tenant_id]);

  function handleRowDelete(id: string) {
    setItems((prev) => prev.filter((c) => c.product_id !== id));
    setTotal((t) => t - 1);
  }

  return (
    <AdminLayout>
      <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3">
        <Link to="/seller/combos/new" className="btn-primary w-full text-center block">
          + Nuevo combo
        </Link>
      </div>

      <div className="px-4 sm:px-8 py-6 min-h-full">
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">Combos</span>
        </nav>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">Combos y promociones</h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              {loading ? "Cargando..." : `${total} combo${total !== 1 ? "s" : ""} en tu tienda`}
            </p>
          </div>
          <div className="hidden sm:block shrink-0">
            <Link to="/seller/combos/new" className="btn-primary">+ Nuevo combo</Link>
          </div>
        </div>

        <div className="rounded-lg bg-white border border-[#E8E2D8] p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
            <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
              <SearchIcon />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar combo por nombre..."
                className={`${INPUT} w-full pl-9`}
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${SELECT} w-full sm:w-[160px]`}>
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="draft">Borrador</option>
                <option value="paused">Pausado</option>
              </select>
              <ChevronDown />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white border border-[#E8E2D8] overflow-hidden overflow-x-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-sm text-[#6B6B6B]">{error}</p>
            </div>
          ) : loading ? (
            <div className="animate-pulse divide-y divide-[#F0EDE8]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-10 h-10 bg-[#EDE9E2] rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-[#EDE9E2] rounded w-1/4" />
                    <div className="h-2.5 bg-[#F0EDE8] rounded w-1/6" />
                  </div>
                  <div className="h-5 w-16 bg-[#EDE9E2] rounded-full" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-sm text-[#6B6B6B]">
                {q || status ? "No se encontraron combos con esos filtros." : "Todavía no creaste ningún combo."}
              </p>
              {!q && !status && (
                <Link to="/seller/combos/new" className="btn-primary">+ Nuevo combo</Link>
              )}
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E2D8] bg-[#F9F8F5]">
                    <th className="w-[58px] px-4 py-3" />
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Nombre</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[110px]">Stock disponible</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[110px]">Estado</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[130px]">Precio</th>
                    <th className="w-[80px] px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE8]">
                  {items.map((c) => (
                    <ComboRow key={c.product_id} combo={c} onDelete={handleRowDelete} />
                  ))}
                </tbody>
              </table>

              {pages > 1 && (
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-[#E8E2D8] flex-wrap">
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-[#8A8A8A]">Página {page} de {pages}</p>
                    <PageSizeSelect value={pageSize} onChange={setPageSize} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg px-2.5 py-1.5 text-xs border border-[#E8E2D8] text-[#4A4A4A] hover:bg-[#F9F8F5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="rounded-lg px-2.5 py-1.5 text-xs border border-[#E8E2D8] text-[#4A4A4A] hover:bg-[#F9F8F5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
