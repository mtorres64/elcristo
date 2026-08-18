import { useEffect, useRef, useState } from "react";
import { productService } from "../../services/product.service";
import { useCategories } from "../../hooks/useCategories";
import type { ProductSummary } from "../../types/product";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/**
 * Buscador + selector de "macetas" (u otros productos) recomendados para un
 * producto. Filtra por categoría/texto y guarda los IDs elegidos, que luego
 * se ofrecen como opción de maceta en la página de venta del producto.
 */
export function PotPicker({
  selectedIds,
  onChange,
  excludeProductId,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  excludeProductId?: string;
}) {
  const { categories } = useCategories(50);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [cache, setCache] = useState<Record<string, ProductSummary>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Trae los datos (nombre, imagen, precio) de las macetas ya elegidas que
  // todavía no tenemos en caché (por ejemplo al cargar un producto existente).
  useEffect(() => {
    const missing = selectedIds.filter((id) => !cache[id]);
    if (!missing.length) return;
    productService
      .list({ ids: missing.join(","), page_size: Math.min(100, missing.length) })
      .then((res) => {
        setCache((prev) => {
          const next = { ...prev };
          res.items.forEach((p) => { next[p.product_id] = p; });
          return next;
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(",")]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() && !categoryId) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      productService
        .list({
          q: query.trim() || undefined,
          category_id: categoryId || undefined,
          page_size: 8,
          sort: "title_asc",
        })
        .then((res) => {
          setResults(res.items.filter((p) => p.product_id !== excludeProductId));
          setCache((prev) => {
            const next = { ...prev };
            res.items.forEach((p) => { next[p.product_id] = p; });
            return next;
          });
        })
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, categoryId, excludeProductId]);

  function addPot(id: string) {
    if (selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
  }
  function removePot(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  const selectedProducts = selectedIds.map((id) => cache[id]).filter(Boolean) as ProductSummary[];
  const visibleResults = results.filter((p) => !selectedIds.includes(p.product_id));

  return (
    <div>
      <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Macetas recomendadas</p>
      <p className="text-xs text-[#8A8A8A] mb-3">
        Buscá y elegí las macetas que se van a poder agregar a esta planta en la página de venta.
      </p>

      {/* Buscador */}
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3 mb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ABABAB]">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar maceta por nombre…"
            className="w-full border border-[#E8E2D8] rounded-lg pl-9 pr-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-[#E8E2D8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors appearance-none cursor-pointer pr-8"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>{c.name}</option>
            ))}
          </select>
          <ChevronSelectIcon />
        </div>
      </div>

      {/* Resultados de búsqueda */}
      {(query.trim() || categoryId) && (
        <div className="border border-[#E8E2D8] rounded-lg divide-y divide-[#E8E2D8] mb-4 max-h-64 overflow-y-auto">
          {searching && <p className="text-xs text-[#8A8A8A] px-3 py-3">Buscando…</p>}
          {!searching && visibleResults.length === 0 && (
            <p className="text-xs text-[#8A8A8A] px-3 py-3">No se encontraron productos.</p>
          )}
          {!searching && visibleResults.map((p) => (
            <button
              key={p.product_id}
              type="button"
              onClick={() => addPot(p.product_id)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#F9F8F5] transition-colors"
            >
              <PotThumb url={p.image_url} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1A1A1A] truncate">{p.title}</p>
                <p className="text-[10px] text-[#8A8A8A]">{formatARS(p.price)}</p>
              </div>
              <span className="text-xs text-[#3D6040] font-semibold shrink-0">+ Agregar</span>
            </button>
          ))}
        </div>
      )}

      {/* Macetas seleccionadas */}
      {selectedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {selectedProducts.map((p) => (
            <div
              key={p.product_id}
              className="flex items-center gap-2 border border-[#E8E2D8] rounded-lg p-2"
            >
              <PotThumb url={p.image_url} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1A1A1A] truncate">{p.title}</p>
                <p className="text-[10px] text-[#8A8A8A]">{formatARS(p.price)}</p>
              </div>
              <button
                type="button"
                onClick={() => removePot(p.product_id)}
                className="text-[#ABABAB] hover:text-[#DC2626] transition-colors shrink-0"
                aria-label={`Quitar ${p.title}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#ABABAB]">Todavía no agregaste macetas recomendadas.</p>
      )}
    </div>
  );
}

// Miniatura cuadrada, recortada de forma consistente sin importar el tamaño
// original de la imagen del producto.
function PotThumb({ url }: { url: string | null }) {
  const src = url ? (url.startsWith("/uploads") ? `${API_BASE}${url}` : url) : null;
  return (
    <div className="w-10 h-10 rounded-md bg-[#F0EDE8] overflow-hidden shrink-0 flex items-center justify-center">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[#C8C0B4]">
          <PotIcon />
        </span>
      )}
    </div>
  );
}

function formatARS(centavos: number): string {
  const pesos = centavos / 100;
  return `$${pesos.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronSelectIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] pointer-events-none"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function PotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
      <path d="M10 14 L11 26 Q16 28 21 26 L22 14 Z" fill="#D8D0C4" stroke="#C8C0B4" strokeWidth="1" />
      <rect x="9" y="12" width="14" height="3" rx="1" fill="#D8D0C4" stroke="#C8C0B4" strokeWidth="1" />
    </svg>
  );
}
