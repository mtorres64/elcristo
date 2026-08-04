import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { categoryService } from "../../services/category.service";
import type { Category } from "../../types/category";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const INPUT =
  "rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

const SELECT =
  "rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors appearance-none cursor-pointer pr-8";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// ─── Sub-components ───────────────────────────────────────────────
function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8A8A]"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB]"
      viewBox="0 0 24 24"
      fill="none"
    >
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
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <polyline
        points="3 6 5 6 21 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function resolveImageUrl(src: string): string {
  return src.startsWith("/") ? `${API_BASE}${src}` : src;
}

function CategoryThumb({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <img
        src={resolveImageUrl(src)}
        alt={name}
        className="w-10 h-10 object-cover shrink-0 rounded-lg"
      />
    );
  }
  return (
    <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-[#C8D8C0] to-[#A8BCA0] flex items-center justify-center">
      <svg className="w-5 h-5 text-[#5A7A5C]" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 20s-2-5.5 1-9 9-3 9-3-1 5-4 8-6 4-6 4z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 20c0 0 0-7 5-10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#E6F4EA] text-[#2D6A4F]">
        Activa
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#F2F2F2] text-[#6B6B6B]">
      Inactiva
    </span>
  );
}

function CategoryRow({
  category,
  selected,
  onToggle,
  onDelete,
}: {
  category: Category;
  selected: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await categoryService.deleteById(category.category_id);
      toast.success(`"${category.name}" eliminada`);
      onDelete(category.category_id);
    } catch {
      toast.error("No se pudo eliminar la categoría");
      setDeleting(false);
      setConfirming(false);
    }
  }

  const truncatedDesc =
    category.description && category.description.length > 60
      ? category.description.slice(0, 60) + "…"
      : category.description;

  return (
    <tr className={`transition-colors group ${selected ? "bg-[#F4F8F4]" : "hover:bg-[#F9F8F5]"}`}>
      <td className="px-4 py-3 w-[48px]">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(category.category_id)}
          className="w-4 h-4 rounded border-[#C8C4BE] accent-[#1A2B1C] cursor-pointer"
        />
      </td>
      <td className="px-4 py-3">
        <CategoryThumb src={category.image_url} name={category.name} />
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{category.name}</p>
        <p className="text-xs text-[#ABABAB] mt-0.5">/{category.slug}</p>
      </td>
      <td className="px-4 py-3 max-w-[280px]">
        {truncatedDesc ? (
          <p className="text-xs text-[#6B6B6B] leading-relaxed">{truncatedDesc}</p>
        ) : (
          <span className="text-[#ABABAB]">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {category.product_count > 0 ? (
          <span className="text-sm font-medium text-[#1A1A1A] tabular-nums">
            {category.product_count}
          </span>
        ) : (
          <span className="text-[#ABABAB]">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge isActive={category.is_active} />
      </td>
      <td className="px-4 py-3 text-right">
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
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`/seller/categories/${category.category_id}/edit`}
              className="p-1.5 text-[#6B6B6B] hover:text-[#1A2B1C] transition-colors"
              title="Editar categoría"
            >
              <PencilIcon />
            </Link>
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 text-[#6B6B6B] hover:text-[#DC2626] transition-colors"
              title="Eliminar categoría"
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
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="w-4 h-4 bg-[#EDE9E2] rounded shrink-0" />
          <div className="w-10 h-10 bg-[#EDE9E2] rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[#EDE9E2] rounded w-1/4" />
            <div className="h-2.5 bg-[#F0EDE8] rounded w-1/6" />
          </div>
          <div className="h-3 bg-[#EDE9E2] rounded w-2/5" />
          <div className="h-3 w-6 bg-[#F0EDE8] rounded" />
          <div className="h-5 w-16 bg-[#EDE9E2] rounded-full" />
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
          <path
            d="M7 20s-2-5.5 1-9 9-3 9-3-1 5-4 8-6 4-6 4z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 20c0 0 0-7 5-10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm text-[#6B6B6B]">No se encontraron categorías con esos filtros.</p>
          <button
            onClick={onReset}
            className="text-xs text-[#1A2B1C] underline underline-offset-2 hover:text-[#253824] transition-colors"
          >
            Limpiar filtros
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-[#6B6B6B]">Todavía no tenés categorías creadas.</p>
          <Link to="/seller/categories/new" className="btn-primary">
            + Nueva categoría
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
export function CategoryList() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
    setConfirmBulk(false);
  }, [debouncedQ, statusFilter, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: Parameters<typeof categoryService.list>[0] = {
      q: debouncedQ || undefined,
      sort,
      page,
      page_size: PAGE_SIZE,
    };
    if (statusFilter === "active") params.is_active = true;
    if (statusFilter === "inactive") params.is_active = false;

    categoryService
      .list(params)
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
          setError("No se pudieron cargar las categorías. Intentá de nuevo.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQ, statusFilter, sort, page]);

  const hasFilters = !!(q || statusFilter || sort !== "newest");

  function handleReset() {
    setQ("");
    setStatusFilter("");
    setSort("newest");
    setPage(1);
  }

  const allOnPageSelected = items.length > 0 && items.every((c) => selected.has(c.category_id));
  const someOnPageSelected = items.some((c) => selected.has(c.category_id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        items.forEach((c) => next.delete(c.category_id));
      } else {
        items.forEach((c) => next.add(c.category_id));
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
    const results = await Promise.allSettled(
      ids.map((id) => categoryService.deleteById(id))
    );

    const succeeded = ids.filter((_, i) => results[i].status === "fulfilled");
    const failedCount = ids.length - succeeded.length;

    setItems((prev) => prev.filter((c) => !succeeded.includes(c.category_id)));
    setTotal((t) => t - succeeded.length);
    setSelected(new Set());
    setConfirmBulk(false);
    setBulkDeleting(false);

    if (failedCount === 0) {
      toast.success(
        `${succeeded.length} categoría${succeeded.length !== 1 ? "s" : ""} eliminada${succeeded.length !== 1 ? "s" : ""}`
      );
    } else {
      toast.error(
        `${succeeded.length} eliminada${succeeded.length !== 1 ? "s" : ""}, ${failedCount} con error`
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
      <div className="px-8 py-6 min-h-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">Categorías</span>
        </nav>

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">
              Categorías
            </h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              {loading
                ? "Cargando..."
                : `${total} categoría${total !== 1 ? "s" : ""} en tu tienda`}
            </p>
          </div>
          <Link to="/seller/categories/new" className="btn-primary shrink-0">
            + Nueva categoría
          </Link>
        </div>

        {/* Filter bar */}
        <div className="rounded-lg bg-white border border-[#E8E2D8] p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <SearchIcon />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre..."
                className={`${INPUT} w-full pl-9`}
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`${SELECT} w-[160px]`}
              >
                <option value="">Todos los estados</option>
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
              <ChevronDown />
            </div>

            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={`${SELECT} w-[180px]`}
              >
                <option value="newest">Más recientes</option>
                <option value="name_asc">Nombre A → Z</option>
                <option value="sort_order">Por orden</option>
              </select>
              <ChevronDown />
            </div>

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

        {/* Category table */}
        <div className="rounded-lg bg-white border border-[#E8E2D8] overflow-hidden">
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
                    {selected.size} categoría{selected.size !== 1 ? "s" : ""} seleccionada{selected.size !== 1 ? "s" : ""}
                  </span>
                  <div className="flex-1" />
                  {confirmBulk ? (
                    <>
                      <span className="text-xs text-[#6B6B6B]">
                        ¿Eliminar {selected.size} categoría{selected.size !== 1 ? "s" : ""}?
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
                        Eliminar seleccionadas
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[100px]">
                      Productos
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[110px]">
                      Estado
                    </th>
                    <th className="w-[60px] px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE8]">
                  {items.map((c) => (
                    <CategoryRow
                      key={c.category_id}
                      category={c}
                      selected={selected.has(c.category_id)}
                      onToggle={toggleOne}
                      onDelete={(id) => {
                        setItems((prev) => prev.filter((x) => x.category_id !== id));
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
