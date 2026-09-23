import { useEffect, useRef, useState } from "react";
import { productService } from "../../services/product.service";
import type { ComboItemDetail, ProductSummary } from "../../types/product";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface ComboItemRow {
  product_id: string;
  quantity: number;
  title: string;
  image_url: string | null;
  price: number;
  stock: number;
}

export function comboItemDetailsToRows(items: ComboItemDetail[]): ComboItemRow[] {
  return items.map((i) => ({
    product_id: i.product_id,
    quantity: i.quantity,
    title: i.title,
    image_url: i.image_url,
    price: i.price,
    stock: i.stock,
  }));
}

/**
 * Buscador + selector de los productos que integran un combo, con la
 * cantidad de cada uno. El stock del combo no se carga a mano: se calcula
 * acá mismo (stock de cada componente ÷ cantidad por combo, el mínimo entre
 * todos) para mostrarle al admin cuántos combos puede vender hoy — el mismo
 * cálculo que hace el backend al leer el producto.
 */
export function ComboItemsPicker({
  items,
  onChange,
  excludeProductId,
}: {
  items: ComboItemRow[];
  onChange: (items: ComboItemRow[]) => void;
  excludeProductId?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      productService
        .list({ q: query.trim(), product_type: "simple", page_size: 8, sort: "title_asc" })
        .then((res) => setResults(res.items))
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const selectedIds = new Set(items.map((i) => i.product_id));
  const visibleResults = results.filter(
    (p) => !selectedIds.has(p.product_id) && p.product_id !== excludeProductId
  );

  function addItem(p: ProductSummary) {
    onChange([
      ...items,
      { product_id: p.product_id, quantity: 1, title: p.title, image_url: p.image_url, price: p.price, stock: p.stock },
    ]);
  }
  function removeItem(id: string) {
    onChange(items.filter((i) => i.product_id !== id));
  }
  function setQuantity(id: string, quantity: number) {
    onChange(items.map((i) => (i.product_id === id ? { ...i, quantity: Math.max(1, quantity) } : i)));
  }

  const availableToday = items.length
    ? Math.min(...items.map((i) => Math.floor(i.stock / Math.max(1, i.quantity))))
    : 0;

  return (
    <div>
      <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Productos del combo</p>
      <p className="text-xs text-[#8A8A8A] mb-3">
        Elegí al menos 2 productos y cuántas unidades de cada uno incluye el combo. El stock del combo
        se calcula solo a partir del stock de estos productos.
      </p>

      {/* Buscador */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ABABAB]">
          <SearchIcon />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto por nombre…"
          className="w-full border border-[#E8E2D8] rounded-lg pl-9 pr-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors"
        />
      </div>

      {/* Resultados de búsqueda */}
      {query.trim() && (
        <div className="border border-[#E8E2D8] rounded-lg divide-y divide-[#E8E2D8] mb-4 max-h-64 overflow-y-auto">
          {searching && <p className="text-xs text-[#8A8A8A] px-3 py-3">Buscando…</p>}
          {!searching && visibleResults.length === 0 && (
            <p className="text-xs text-[#8A8A8A] px-3 py-3">No se encontraron productos.</p>
          )}
          {!searching && visibleResults.map((p) => (
            <button
              key={p.product_id}
              type="button"
              onClick={() => addItem(p)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#F9F8F5] transition-colors"
            >
              <ItemThumb url={p.image_url} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1A1A1A] truncate">{p.title}</p>
                <p className="text-[10px] text-[#8A8A8A]">{formatARS(p.price)} · stock {p.stock}</p>
              </div>
              <span className="text-xs text-[#3D6040] font-semibold shrink-0">+ Agregar</span>
            </button>
          ))}
        </div>
      )}

      {/* Productos elegidos */}
      {items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {items.map((i) => (
            <div key={i.product_id} className="flex items-center gap-3 border border-[#E8E2D8] rounded-lg p-2">
              <ItemThumb url={i.image_url} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1A1A1A] truncate">{i.title}</p>
                <p className="text-[10px] text-[#8A8A8A]">{formatARS(i.price)} · stock disponible {i.stock}</p>
              </div>
              <div className="flex items-center border border-[#E8E2D8] rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(i.product_id, i.quantity - 1)}
                  className="px-2 py-1 text-[#4A4A4A] hover:bg-[#F5F5F3] transition-colors"
                  aria-label="Restar unidad"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={i.quantity}
                  onChange={(e) => setQuantity(i.product_id, Number(e.target.value) || 1)}
                  className="w-10 text-center text-xs text-[#1A1A1A] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(i.product_id, i.quantity + 1)}
                  className="px-2 py-1 text-[#4A4A4A] hover:bg-[#F5F5F3] transition-colors"
                  aria-label="Sumar unidad"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeItem(i.product_id)}
                className="text-[#ABABAB] hover:text-[#DC2626] transition-colors shrink-0"
                aria-label={`Quitar ${i.title}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#ABABAB]">Todavía no agregaste productos al combo.</p>
      )}

      {items.length >= 2 && (
        <div
          className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
            availableToday > 0 ? "bg-[#F0F5F0] text-[#3D6040]" : "bg-[#FEF2F2] text-[#DC2626]"
          }`}
        >
          <StockIcon />
          {availableToday > 0
            ? `Con el stock actual se pueden vender ${availableToday} combo${availableToday !== 1 ? "s" : ""} hoy.`
            : "Con el stock actual no hay unidades suficientes para vender este combo."}
        </div>
      )}
      {items.length === 1 && (
        <p className="mt-3 text-xs text-[#DC2626]">Un combo necesita al menos 2 productos distintos.</p>
      )}
    </div>
  );
}

function ItemThumb({ url }: { url: string | null }) {
  const src = url ? (url.startsWith("/uploads") ? `${API_BASE}${url}` : url) : null;
  return (
    <div className="w-10 h-10 rounded-md bg-[#F0EDE8] overflow-hidden shrink-0 flex items-center justify-center">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[#C8C0B4]">
          <BoxIcon />
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

function BoxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function StockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" />
    </svg>
  );
}
