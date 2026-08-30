import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { purchaseService } from "../../services/purchase.service";
import { formatARS } from "../../utils/currency";
import { formatPct } from "../../utils/pricing";
import type { PurchaseDetail as Purchase, PurchaseSize } from "../../types/purchase";

const SIZE_LABEL: Record<PurchaseSize, string> = {
  "pequeña": "Chica",
  "mediana": "Mediana",
  "grande": "Grande",
};

export function PurchaseDetail() {
  const { purchaseId } = useParams();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!purchaseId) return;
    setLoading(true);
    purchaseService
      .getById(purchaseId)
      .then(setPurchase)
      .catch(() => setError("No se pudo cargar la compra."))
      .finally(() => setLoading(false));
  }, [purchaseId]);

  return (
    <AdminLayout>
      <div className="px-4 sm:px-8 py-6 min-h-full max-w-4xl">
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">Dashboard</Link>
          <span>/</span>
          <Link to="/seller/purchases" className="hover:text-[#1A2B1C] transition-colors">Compras</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">Detalle</span>
        </nav>

        {loading ? (
          <p className="text-sm text-[#8A8A8A]">Cargando…</p>
        ) : error || !purchase ? (
          <p className="text-sm text-[#6B6B6B]">{error || "Compra no encontrada."}</p>
        ) : (
          <>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight mb-1">
              {purchase.supplier || "Compra"}
            </h1>
            <p className="text-xs text-[#8A8A8A] mb-6">
              {new Date(purchase.created_at).toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              {purchase.reference ? ` · Ref. ${purchase.reference}` : ""}
            </p>

            {purchase.note && (
              <p className="text-sm text-[#4A4A4A] bg-[#F9F8F5] border border-[#E8E2D8] rounded-lg p-3 mb-4">
                {purchase.note}
              </p>
            )}

            <div className="rounded-lg bg-white border border-[#E8E2D8] overflow-hidden overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E2D8] bg-[#F9F8F5] text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Producto</th>
                    <th className="text-left px-4 py-3">Tamaño</th>
                    <th className="text-right px-4 py-3">Cant.</th>
                    <th className="text-right px-4 py-3">Costo unit.</th>
                    <th className="text-right px-4 py-3">Costo → Nuevo</th>
                    <th className="text-right px-4 py-3">Precio → Nuevo</th>
                    <th className="text-right px-4 py-3">Markup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE8]">
                  {purchase.items.map((it, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <Link to={`/seller/products/${it.product_id}/edit`} className="text-[#1A2B1C] hover:underline">
                          {it.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#6B6B6B]">{SIZE_LABEL[it.size]}</td>
                      <td className="px-4 py-3 text-right text-[#6B6B6B]">{it.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-[#1A1A1A]">{formatARS(it.unit_cost)}</td>
                      <td className="px-4 py-3 text-right text-[#6B6B6B] whitespace-nowrap">
                        {it.prev_cost != null ? formatARS(it.prev_cost) : "—"} → <span className="text-[#1A1A1A]">{formatARS(it.unit_cost)}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#6B6B6B] whitespace-nowrap">
                        {it.prev_price != null ? formatARS(it.prev_price) : "—"} → <span className="text-[#1A1A1A]">{it.new_price != null ? formatARS(it.new_price) : "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#1A2B1C] font-medium">{formatPct(it.markup_pct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-6 text-sm">
              <span className="text-[#6B6B6B]">Unidades: <strong className="text-[#1A1A1A]">{purchase.total_units}</strong></span>
              <span className="text-[#6B6B6B]">Costo total: <strong className="text-[#1A1A1A]">{formatARS(purchase.total_cost)}</strong></span>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
