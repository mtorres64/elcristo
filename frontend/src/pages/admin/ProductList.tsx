import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { productService } from "../../services/product.service";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { formatARS } from "../../utils/currency";
import type { ProductSummary } from "../../types/product";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────
const PAGE_SIZE = 8;

const INPUT =
  "rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

const SELECT =
  "rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors appearance-none cursor-pointer pr-8";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active:   { label: "Activo",    cls: "bg-[#E6F4EA] text-[#2D6A4F]" },
  draft:    { label: "Borrador",  cls: "bg-[#FFF8E7] text-[#926D20]" },
  inactive: { label: "Inactivo", cls: "bg-[#F2F2F2] text-[#6B6B6B]" },
};

// ─── Sub-components ───────────────────────────────────────────────
function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8A8A]"
      viewBox="0 0 16 16" fill="none"
    >
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

function PencilIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 rounded border-[#C8C4BE] accent-[#1A2B1C] cursor-pointer"
    />
  );
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function resolveImageUrl(src: string): string {
  return src.startsWith("/") ? `${API_BASE}${src}` : src;
}

function ProductThumb({ src, title }: { src: string | null; title: string }) {
  if (src) {
    return <img src={resolveImageUrl(src)} alt={title} className="w-10 h-10 object-cover shrink-0 rounded-lg" />;
  }
  return (
    <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-[#C8D8C0] to-[#A8BCA0] flex items-center justify-center">
      <svg className="w-5 h-5 text-[#5A7A5C]" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

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
  if (stock <= 5)
    return <span className="text-xs font-semibold text-[#926D20] bg-[#FFF8E7] px-2 py-0.5 rounded-full">{stock}</span>;
  return <span className="text-xs font-semibold text-[#2D6A4F] bg-[#E6F4EA] px-2 py-0.5 rounded-full">{stock}</span>;
}

const CARE_ICONS: Record<string, JSX.Element> = {
  light:       <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  luz:         <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  water:       <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  riego:       <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  environment: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  ambiente:    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  temperature: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  temperatura: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
};

function ProductRow({
  product,
  categoryName,
  selected,
  onToggle,
  onDelete,
}: {
  product: ProductSummary;
  categoryName: string | null;
  selected: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await productService.deleteById(product.product_id);
      toast.success(`"${product.title}" eliminado`);
      onDelete(product.product_id);
    } catch {
      toast.error("No se pudo eliminar el producto");
      setDeleting(false);
      setConfirming(false);
    }
  }

  const visibleTags = product.tags.slice(0, 3);
  const extraTags = product.tags.length - visibleTags.length;
  const careKeys = Object.entries(product.care).filter(([, v]) => v).map(([k]) => k);

  return (
    <tr className={`transition-colors group ${selected ? "bg-[#F4F8F4]" : "hover:bg-[#F9F8F5]"}`}>
      {/* Checkbox */}
      <td className="px-4 py-3.5 w-[48px] align-top">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(product.product_id)}
          className="w-4 h-4 rounded border-[#C8C4BE] accent-[#1A2B1C] cursor-pointer mt-0.5"
        />
      </td>

      {/* Imagen */}
      <td className="px-4 py-3.5 w-[58px] align-top">
        <ProductThumb src={product.image_url} title={product.title} />
      </td>

      {/* Nombre + descripción + etiquetas + cuidados */}
      <td className="px-4 py-3.5 max-w-[320px]">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-medium text-[#1A1A1A] leading-snug line-clamp-1">{product.title}</p>
          {product.is_featured && <span className="text-[#D4A017] text-sm shrink-0" title="Destacado">★</span>}
        </div>
        {product.short_description && (
          <p className="text-[11px] text-[#8A8A8A] line-clamp-1 mb-1.5 leading-relaxed">
            {product.short_description}
          </p>
        )}
        {(visibleTags.length > 0 || careKeys.length > 0) && (
          <div className="flex items-center gap-1 flex-wrap">
            {visibleTags.map((tag) => (
              <span key={tag} className="bg-[#F0EDE8] text-[#6B6B6B] text-[10px] px-1.5 py-0.5 rounded leading-none">
                {tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="text-[#ABABAB] text-[10px]">+{extraTags}</span>
            )}
            {careKeys.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {careKeys.map((k) => CARE_ICONS[k] && (
                  <span key={k} className="inline-flex items-center gap-0.5 bg-[#F0F5F0] text-[#3D6040] text-[10px] px-1.5 py-0.5 rounded leading-none">
                    <span className="shrink-0">{CARE_ICONS[k]}</span>
                    <span className="max-w-[90px] truncate">{product.care[k]}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </td>

      {/* Categoría */}
      <td className="px-4 py-3.5 w-[130px] align-top">
        {categoryName
          ? <span className="text-xs text-[#4A4A4A]">{categoryName}</span>
          : <span className="text-xs text-[#ABABAB]">—</span>
        }
      </td>

      {/* Stock */}
      <td className="px-4 py-3.5 w-[80px] text-center align-top">
        <StockBadge stock={product.stock} />
      </td>

      {/* Estado */}
      <td className="px-4 py-3.5 w-[110px] align-top">
        <StatusBadge status={product.status} />
      </td>

      {/* Precio */}
      <td className="px-4 py-3.5 w-[130px] text-right align-top">
        <p className="text-sm font-medium text-[#1A1A1A] tabular-nums">{formatARS(product.price)}</p>
        {product.compare_at_price && (
          <p className="text-[11px] text-[#2D6A4F] tabular-nums mt-0.5">{formatARS(product.compare_at_price)}</p>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 w-[80px] text-right align-top">
        {confirming ? (
          <div className="flex items-center justify-end gap-1">
            <span className="text-xs text-[#6B6B6B] mr-1">¿Eliminar?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2 py-1 text-xs font-medium bg-[#DC2626] text-white rounded hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
            >
              {deleting ? "…" : "Sí"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="px-2 py-1 text-xs text-[#6B6B6B] border border-[#E8E2D8] rounded hover:bg-[#F5F5F3] transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`/seller/products/${product.product_id}/edit`}
              className="p-1.5 text-[#6B6B6B] hover:text-[#1A2B1C] transition-colors"
              title="Editar"
            >
              <PencilIcon />
            </Link>
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 text-[#6B6B6B] hover:text-[#DC2626] transition-colors"
              title="Eliminar"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function SkeletonRows() {
  return (
    <div className="animate-pulse divide-y divide-[#F0EDE8]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-4 py-3.5">
          <div className="w-4 h-4 bg-[#EDE9E2] rounded shrink-0 mt-0.5" />
          <div className="w-10 h-10 bg-[#EDE9E2] rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5 pt-0.5">
            <div className="h-3 bg-[#EDE9E2] rounded w-2/5" />
            <div className="h-2.5 bg-[#F0EDE8] rounded w-3/5" />
            <div className="flex gap-1 mt-1">
              <div className="h-4 w-10 bg-[#F0EDE8] rounded" />
              <div className="h-4 w-12 bg-[#F0EDE8] rounded" />
            </div>
          </div>
          <div className="h-3 w-20 bg-[#EDE9E2] rounded mt-0.5" />
          <div className="h-5 w-8 bg-[#EDE9E2] rounded-full mt-0.5" />
          <div className="h-5 w-16 bg-[#EDE9E2] rounded-full mt-0.5" />
          <div className="h-3 w-20 bg-[#EDE9E2] rounded mt-0.5" />
          <div className="w-6" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-14 h-14 rounded-lg bg-[#F0EDE8] flex items-center justify-center">
        <svg className="w-7 h-7 text-[#ABABAB]" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm text-[#6B6B6B]">No se encontraron productos con esos filtros.</p>
          <button
            onClick={onReset}
            className="text-xs text-[#1A2B1C] underline underline-offset-2 hover:text-[#253824] transition-colors"
          >
            Limpiar filtros
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-[#6B6B6B]">Todavía no tenés productos cargados.</p>
          <Link to="/seller/products/new" className="btn-primary">
            + Nuevo producto
          </Link>
        </>
      )}
    </div>
  );
}

function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}) {
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

  const btn =
    "rounded-lg px-2.5 py-1.5 text-xs border border-[#E8E2D8] text-[#4A4A4A] hover:bg-[#F9F8F5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E2D8]">
      <p className="text-xs text-[#8A8A8A]">
        Página {page} de {pages}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className={btn}>
          ←
        </button>
        {visible.map((v, i) =>
          v === "..." ? (
            <span key={`e${i}`} className="px-2 py-1.5 text-xs text-[#ABABAB]">
              …
            </span>
          ) : (
            <button
              key={v}
              onClick={() => onPage(v as number)}
              className={`rounded-lg px-2.5 py-1.5 text-xs border transition-colors ${
                v === page
                  ? "bg-[#1A2B1C] text-white border-[#1A2B1C]"
                  : "border-[#E8E2D8] text-[#4A4A4A] hover:bg-[#F9F8F5]"
              }`}
            >
              {v}
            </button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === pages} className={btn}>
          →
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export function ProductList() {
  const { user } = useAuth();
  const { categories } = useCategories(100);
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.category_id, c.name])),
    [categories]
  );

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<ProductSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  // Reset page + selection when filters change
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
    setConfirmBulk(false);
  }, [debouncedQ, status, sort]);

  // Fetch products
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    productService
      .list({
        q: debouncedQ || undefined,
        status: status || undefined,
        sort,
        page,
        page_size: PAGE_SIZE,
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
          setError("No se pudieron cargar los productos. Intentá de nuevo.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQ, status, sort, page, user?.tenant_id]);

  const hasFilters = !!(q || status || sort !== "newest");

  function handleReset() {
    setQ("");
    setStatus("");
    setSort("newest");
    setPage(1);
  }

  // Selection helpers
  const allOnPageSelected = items.length > 0 && items.every((p) => selected.has(p.product_id));
  const someOnPageSelected = items.some((p) => selected.has(p.product_id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        items.forEach((p) => next.delete(p.product_id));
      } else {
        items.forEach((p) => next.add(p.product_id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setConfirmBulk(false);
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    const ids = [...selected];
    const results = await Promise.allSettled(ids.map((id) => productService.deleteById(id)));

    const succeeded = ids.filter((_, i) => results[i].status === "fulfilled");
    const failedCount = ids.length - succeeded.length;

    setItems((prev) => prev.filter((p) => !succeeded.includes(p.product_id)));
    setTotal((t) => t - succeeded.length);
    setSelected(new Set());
    setConfirmBulk(false);
    setBulkDeleting(false);

    if (failedCount === 0) {
      toast.success(
        `${succeeded.length} producto${succeeded.length !== 1 ? "s" : ""} eliminado${succeeded.length !== 1 ? "s" : ""}`
      );
    } else {
      toast.error(
        `${succeeded.length} eliminado${succeeded.length !== 1 ? "s" : ""}, ${failedCount} con error`
      );
    }
  }

  function handlePageChange(p: number) {
    setPage(p);
    setSelected(new Set());
    setConfirmBulk(false);
  }

  return (
    <AdminLayout>
      {/* Mobile sticky action bar */}
      <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3">
        <Link to="/seller/products/new" className="btn-primary w-full text-center block">
          + Nuevo producto
        </Link>
      </div>

      <div className="px-4 sm:px-8 py-6 min-h-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">Productos</span>
        </nav>

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">
              Todos los productos
            </h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              {loading
                ? "Cargando..."
                : `${total} producto${total !== 1 ? "s" : ""} en tu tienda`}
            </p>
          </div>
          <div className="hidden sm:block shrink-0">
            <Link to="/seller/products/new" className="btn-primary">
              + Nuevo producto
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="rounded-lg bg-white border border-[#E8E2D8] p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
            {/* Search */}
            <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
              <SearchIcon />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre..."
                className={`${INPUT} w-full pl-9`}
              />
            </div>

            {/* Status */}
            <div className="relative w-full sm:w-auto">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`${SELECT} w-full sm:w-[160px]`}
              >
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="draft">Borrador</option>
                <option value="inactive">Inactivo</option>
              </select>
              <ChevronDown />
            </div>

            {/* Sort */}
            <div className="relative w-full sm:w-auto">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={`${SELECT} w-full sm:w-[200px]`}
              >
                <option value="newest">Más recientes</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="title_asc">Nombre A → Z</option>
              </select>
              <ChevronDown />
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={handleReset}
                className="text-xs text-[#8A8A8A] hover:text-[#1A2B1C] transition-colors underline underline-offset-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Product table */}
        <div className="rounded-lg bg-white border border-[#E8E2D8] overflow-hidden overflow-x-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-sm text-[#6B6B6B]">{error}</p>
              <button
                onClick={() => setPage((p) => p)}
                className="text-xs text-[#1A2B1C] underline underline-offset-2"
              >
                Reintentar
              </button>
            </div>
          ) : loading ? (
            <SkeletonRows />
          ) : items.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onReset={handleReset} />
          ) : (
            <>
              {/* Bulk action bar */}
              {selected.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[#F4F8F4] border-b border-[#D4E8D4]">
                  <span className="text-sm font-medium text-[#1A2B1C]">
                    {selected.size} producto{selected.size !== 1 ? "s" : ""} seleccionado{selected.size !== 1 ? "s" : ""}
                  </span>
                  <div className="flex-1" />
                  {confirmBulk ? (
                    <>
                      <span className="text-xs text-[#6B6B6B]">
                        ¿Eliminar {selected.size} producto{selected.size !== 1 ? "s" : ""}?
                      </span>
                      <button
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
                      >
                        {bulkDeleting ? "Eliminando…" : "Confirmar"}
                      </button>
                      <button
                        onClick={() => setConfirmBulk(false)}
                        disabled={bulkDeleting}
                        className="px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#D4E8D4] rounded-lg hover:bg-white transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setConfirmBulk(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#DC2626] border border-[#FECACA] rounded-lg hover:bg-[#FEF2F2] transition-colors"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        Eliminar seleccionados
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#D4E8D4] rounded-lg hover:bg-white transition-colors"
                      >
                        Cancelar selección
                      </button>
                    </>
                  )}
                </div>
              )}

              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E2D8] bg-[#F9F8F5]">
                    <th className="w-[48px] px-4 py-3">
                      <SelectAllCheckbox
                        checked={allOnPageSelected}
                        indeterminate={someOnPageSelected && !allOnPageSelected}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="w-[58px] px-4 py-3" />
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[130px]">
                      Categoría
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[80px]">
                      Stock
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[110px]">
                      Estado
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[130px]">
                      Precio
                    </th>
                    <th className="w-[80px] px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE8]">
                  {items.map((p) => (
                    <ProductRow
                      key={p.product_id}
                      product={p}
                      categoryName={p.category_id ? (categoryMap[p.category_id] ?? null) : null}
                      selected={selected.has(p.product_id)}
                      onToggle={toggleOne}
                      onDelete={(id) => {
                        setItems((prev) => prev.filter((x) => x.product_id !== id));
                        setTotal((t) => t - 1);
                        setSelected((prev) => {
                          const next = new Set(prev);
                          next.delete(id);
                          return next;
                        });
                      }}
                    />
                  ))}
                </tbody>
              </table>

              {pages > 1 && (
                <Pagination page={page} pages={pages} onPage={handlePageChange} />
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
