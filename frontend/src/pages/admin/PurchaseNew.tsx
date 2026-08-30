import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { productService } from "../../services/product.service";
import { purchaseService } from "../../services/purchase.service";
import { storeSettingsService } from "../../services/storeSettings.service";
import { formatARS } from "../../utils/currency";
import { formatPct, markupPct, suggestedPrice } from "../../utils/pricing";
import type { ProductDetail, ProductSummary } from "../../types/product";
import type { PurchaseSize } from "../../types/purchase";

const INPUT =
  "w-full rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

const SIZE_OPTIONS: { value: PurchaseSize; label: string }[] = [
  { value: "pequeña", label: "Chica" },
  { value: "mediana", label: "Mediana" },
  { value: "grande", label: "Grande" },
];

interface Line {
  key: string;
  product: ProductDetail | null;
  loading: boolean;
  size: PurchaseSize;
  quantity: number;
  unitCost: string;
  price: string;
  priceTouched: boolean;
}

function emptyLine(): Line {
  return {
    key: Math.random().toString(36).slice(2),
    product: null,
    loading: false,
    size: "mediana",
    quantity: 1,
    unitCost: "",
    price: "",
    priceTouched: false,
  };
}

// Costo y precio actuales del tamaño elegido (centavos).
function currentForSize(p: ProductDetail, size: PurchaseSize): { cost: number | null; price: number | null } {
  if (size === "mediana") return { cost: p.cost_price, price: p.price };
  const v = p.variants.find((x) => x.key === "size" && x.value === size);
  return {
    cost: v?.cost_price_override ?? p.cost_price,
    price: v?.price_override ?? p.price,
  };
}

export function PurchaseNew() {
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [defaultMarkup, setDefaultMarkup] = useState(60);
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    storeSettingsService.get().then((s) => setDefaultMarkup(s.default_markup_pct)).catch(() => {});
  }, []);

  function patchLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function effectiveMarkup(l: Line): number {
    return l.product?.target_markup_pct ?? defaultMarkup;
  }

  function recalcPrice(l: Line, unitCostStr: string): string {
    const cents = Math.round(Number(unitCostStr) * 100);
    if (!cents || cents <= 0) return "";
    return String(suggestedPrice(cents, effectiveMarkup(l)) / 100);
  }

  async function pickProduct(key: string, summary: ProductSummary) {
    patchLine(key, { loading: true });
    try {
      const detail = await productService.getById(summary.product_id);
      const { cost } = currentForSize(detail, "mediana");
      const costStr = cost != null ? String(cost / 100) : "";
      setLines((prev) =>
        prev.map((l) => {
          if (l.key !== key) return l;
          const base = { ...l, product: detail, loading: false, size: "mediana" as PurchaseSize, unitCost: costStr };
          return { ...base, price: recalcPrice(base, costStr), priceTouched: false };
        })
      );
    } catch {
      toast.error("No se pudo cargar el producto");
      patchLine(key, { loading: false });
    }
  }

  function changeSize(key: string, size: PurchaseSize) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key || !l.product) return l;
        const { cost } = currentForSize(l.product, size);
        const costStr = cost != null ? String(cost / 100) : "";
        const base = { ...l, size, unitCost: costStr };
        return { ...base, price: recalcPrice(base, costStr), priceTouched: false };
      })
    );
  }

  function changeUnitCost(key: string, value: string) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, unitCost: value };
        return l.priceTouched ? next : { ...next, price: recalcPrice(l, value) };
      })
    );
  }

  const totals = useMemo(() => {
    let units = 0;
    let cost = 0;
    for (const l of lines) {
      const c = Math.round(Number(l.unitCost) * 100);
      if (l.product && l.quantity > 0 && c > 0) {
        units += l.quantity;
        cost += c * l.quantity;
      }
    }
    return { units, cost };
  }, [lines]);

  async function handleSubmit() {
    const items = lines
      .filter((l) => l.product && l.quantity > 0 && Number(l.unitCost) > 0)
      .map((l) => ({
        product_id: l.product!.product_id,
        size: l.size,
        quantity: l.quantity,
        unit_cost: Math.round(Number(l.unitCost) * 100),
        new_price: l.price ? Math.round(Number(l.price) * 100) : null,
      }));
    if (items.length === 0) {
      toast.error("Agregá al menos una línea con producto, cantidad y costo");
      return;
    }
    setSaving(true);
    try {
      const created = await purchaseService.create({
        supplier: supplier || null,
        reference: reference || null,
        note: note || null,
        items,
      });
      toast.success("Compra registrada. Stock y precios actualizados.");
      navigate(`/seller/purchases/${created.purchase_id}`);
    } catch {
      toast.error("No se pudo registrar la compra");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3 flex gap-2">
        <Link
          to="/seller/purchases"
          className="px-4 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white rounded-lg"
        >
          Cancelar
        </Link>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
          {saving ? "Registrando…" : "Registrar compra"}
        </button>
      </div>

      <div className="px-4 sm:px-8 py-6 min-h-full max-w-4xl">
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">Dashboard</Link>
          <span>/</span>
          <Link to="/seller/purchases" className="hover:text-[#1A2B1C] transition-colors">Compras</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">Nueva</span>
        </nav>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">Registrar compra</h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              Al guardar se suma el stock y se actualizan el costo y el precio de venta de cada producto.
            </p>
          </div>
          <div className="hidden sm:block shrink-0">
            <button onClick={handleSubmit} disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? "Registrando…" : "Registrar compra"}
            </button>
          </div>
        </div>

        {/* Cabecera */}
        <div className="rounded-lg bg-white border border-[#E8E2D8] p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-[#4A4A4A]">Proveedor</span>
            <input value={supplier} onChange={(e) => setSupplier(e.target.value)} className={`${INPUT} mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#4A4A4A]">Referencia (factura / remito)</span>
            <input value={reference} onChange={(e) => setReference(e.target.value)} className={`${INPUT} mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#4A4A4A]">Nota</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={`${INPUT} mt-1`} />
          </label>
        </div>

        {/* Líneas */}
        <div className="flex flex-col gap-3">
          {lines.map((line) => (
            <PurchaseLineRow
              key={line.key}
              line={line}
              markup={effectiveMarkup(line)}
              canRemove={lines.length > 1}
              onRemove={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
              onPickProduct={(s) => pickProduct(line.key, s)}
              onClearProduct={() => patchLine(line.key, { product: null, unitCost: "", price: "", priceTouched: false })}
              onSize={(s) => changeSize(line.key, s)}
              onQuantity={(n) => patchLine(line.key, { quantity: n })}
              onUnitCost={(v) => changeUnitCost(line.key, v)}
              onPrice={(v) => patchLine(line.key, { price: v, priceTouched: true })}
            />
          ))}
        </div>

        <button
          onClick={() => setLines((prev) => [...prev, emptyLine()])}
          className="mt-3 px-4 py-2 text-sm font-medium text-[#1A2B1C] border border-[#E8E2D8] rounded-lg hover:bg-[#F9F8F5] transition-colors"
        >
          + Agregar línea
        </button>

        {/* Totales */}
        <div className="mt-5 flex items-center justify-end gap-6 text-sm">
          <span className="text-[#6B6B6B]">Unidades: <strong className="text-[#1A1A1A]">{totals.units}</strong></span>
          <span className="text-[#6B6B6B]">Costo total: <strong className="text-[#1A1A1A]">{formatARS(totals.cost)}</strong></span>
        </div>
      </div>
    </AdminLayout>
  );
}

function PurchaseLineRow({
  line,
  markup,
  canRemove,
  onRemove,
  onPickProduct,
  onClearProduct,
  onSize,
  onQuantity,
  onUnitCost,
  onPrice,
}: {
  line: Line;
  markup: number;
  canRemove: boolean;
  onRemove: () => void;
  onPickProduct: (s: ProductSummary) => void;
  onClearProduct: () => void;
  onSize: (s: PurchaseSize) => void;
  onQuantity: (n: number) => void;
  onUnitCost: (v: string) => void;
  onPrice: (v: string) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (line.product) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      productService
        .list({ q: q.trim(), page_size: 8, sort: "title_asc" })
        .then((r) => setResults(r.items))
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, line.product]);

  const unitCostCents = Math.round(Number(line.unitCost) * 100) || null;
  const priceCents = Math.round(Number(line.price) * 100) || null;
  const cur = line.product ? currentForSize(line.product, line.size) : { cost: null, price: null };
  const resultMarkup = markupPct(priceCents, unitCostCents);

  return (
    <div className="border border-[#E8E2D8] rounded-lg p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        {line.product ? (
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1A1A1A] truncate">{line.product.title}</p>
            <p className="text-xs text-[#8A8A8A]">
              Costo actual: {cur.cost != null ? formatARS(cur.cost) : "—"} · Precio actual: {cur.price != null ? formatARS(cur.price) : "—"}
            </p>
          </div>
        ) : (
          <div className="flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto por nombre…"
              className={INPUT}
            />
            {q.trim() && (
              <div className="border border-[#E8E2D8] rounded-lg divide-y divide-[#E8E2D8] mt-2 max-h-56 overflow-y-auto">
                {searching && <p className="text-xs text-[#8A8A8A] px-3 py-2">Buscando…</p>}
                {!searching && results.length === 0 && (
                  <p className="text-xs text-[#8A8A8A] px-3 py-2">Sin resultados.</p>
                )}
                {!searching && results.map((r) => (
                  <button
                    key={r.product_id}
                    type="button"
                    onClick={() => { onPickProduct(r); setQ(""); setResults([]); }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[#F9F8F5] transition-colors"
                  >
                    <span className="text-xs font-medium text-[#1A1A1A] truncate">{r.title}</span>
                    <span className="text-[10px] text-[#8A8A8A] shrink-0">{formatARS(r.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {line.product && (
            <button onClick={onClearProduct} className="text-xs text-[#8A8A8A] hover:text-[#1A2B1C] transition-colors">
              Cambiar
            </button>
          )}
          {canRemove && (
            <button onClick={onRemove} className="text-[#ABABAB] hover:text-[#DC2626] transition-colors" aria-label="Quitar línea">
              ×
            </button>
          )}
        </div>
      </div>

      {line.product && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <label className="block">
            <span className="text-[11px] font-semibold text-[#4A4A4A]">Tamaño</span>
            <select
              value={line.size}
              onChange={(e) => onSize(e.target.value as PurchaseSize)}
              className={`${INPUT} mt-1 appearance-none cursor-pointer`}
            >
              {SIZE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-[#4A4A4A]">Cantidad</span>
            <input
              type="number"
              min={1}
              value={line.quantity}
              onChange={(e) => onQuantity(Math.max(1, Number(e.target.value)))}
              className={`${INPUT} mt-1`}
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-[#4A4A4A]">Costo unitario</span>
            <input
              inputMode="decimal"
              value={line.unitCost}
              onChange={(e) => onUnitCost(e.target.value)}
              className={`${INPUT} mt-1`}
              placeholder="$"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-[#4A4A4A]">Precio de venta</span>
            <input
              inputMode="decimal"
              value={line.price}
              onChange={(e) => onPrice(e.target.value)}
              className={`${INPUT} mt-1`}
              placeholder="$"
            />
          </label>
          <div className="block">
            <span className="text-[11px] font-semibold text-[#4A4A4A]">Markup</span>
            <p className="mt-1 px-3 py-2 text-sm text-[#1A2B1C] bg-[#F4F8F4] border border-[#D4E8D4] rounded-lg">
              {formatPct(resultMarkup)}
            </p>
          </div>
        </div>
      )}
      {line.product && !line.priceTouched && (
        <p className="text-[11px] text-[#8A8A8A] mt-2">
          Precio sugerido con markup {formatPct(markup)}
          {line.product.target_markup_pct != null ? " (objetivo del producto)" : " (config. de la tienda)"}.
        </p>
      )}
    </div>
  );
}
