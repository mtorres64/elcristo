import { useEffect, useRef, useState } from "react";
import { productService } from "../../../services/product.service";
import type { ProductSummary } from "../../../types/product";
import { formatARS } from "../../../utils/currency";

const INPUT =
  "w-full rounded-lg border border-[#E8E2D8] px-3 py-2.5 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

/** Buscador de productos con autocompletado (debounce 300ms, igual que en
 * PurchaseNew.tsx) para armar el carrito de una venta POS: a diferencia de
 * esa pantalla, acá cada resultado elegido se agrega como una línea nueva
 * del carrito en vez de llenar una única fila fija. */
export function ProductAutocomplete({ onSelect }: { onSelect: (product: ProductSummary) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      productService
        .list({ q: q.trim(), page_size: 8, sort: "title_asc", status: "active" })
        .then((r) => setResults(r.items))
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar producto por nombre o SKU…"
        className={INPUT}
      />
      {open && q.trim() && (
        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#E8E2D8] rounded-lg shadow-lg divide-y divide-[#F0EDE8] max-h-72 overflow-y-auto">
          {searching && <p className="text-xs text-[#8A8A8A] px-3 py-2.5">Buscando…</p>}
          {!searching && results.length === 0 && (
            <p className="text-xs text-[#8A8A8A] px-3 py-2.5">Sin resultados.</p>
          )}
          {!searching && results.map((r) => (
            <button
              key={r.product_id}
              type="button"
              onClick={() => { onSelect(r); setQ(""); setResults([]); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F9F8F5] transition-colors"
            >
              <div className="w-9 h-9 rounded-md overflow-hidden bg-[#F0EDE8] shrink-0">
                {r.image_url && <img src={r.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">{r.title}</p>
                <p className="text-[11px] text-[#8A8A8A]">Stock: {r.stock}</p>
              </div>
              <span className="text-xs font-semibold text-[#1A1A1A] shrink-0">{formatARS(r.price)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
