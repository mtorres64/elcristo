import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { purchaseService } from "../../services/purchase.service";
import { useAuth } from "../../hooks/useAuth";
import { formatARS } from "../../utils/currency";
import type { PurchaseSummary } from "../../types/purchase";

const PAGE_SIZE = 20;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

export function PurchaseList() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<PurchaseSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => setPage(1), [debouncedQ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    purchaseService
      .list({
        tenant_id: user?.tenant_id ?? undefined,
        q: debouncedQ || undefined,
        page,
        page_size: PAGE_SIZE,
      })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
        setPages(data.pages);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("No se pudieron cargar las compras. Intentá de nuevo.");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQ, page, user?.tenant_id]);

  return (
    <AdminLayout>
      <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3">
        <Link to="/seller/purchases/new" className="btn-primary w-full text-center block">
          + Registrar compra
        </Link>
      </div>

      <div className="px-4 sm:px-8 py-6 min-h-full">
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">Compras</span>
        </nav>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">Compras</h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              {loading ? "Cargando..." : `${total} compra${total !== 1 ? "s" : ""} registrada${total !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="hidden sm:block shrink-0">
            <Link to="/seller/purchases/new" className="btn-primary">+ Registrar compra</Link>
          </div>
        </div>

        <div className="rounded-lg bg-white border border-[#E8E2D8] p-4 mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por proveedor o referencia…"
            className="w-full rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors"
          />
        </div>

        <div className="rounded-lg bg-white border border-[#E8E2D8] overflow-hidden overflow-x-auto">
          {error ? (
            <p className="text-sm text-[#6B6B6B] py-16 text-center">{error}</p>
          ) : loading ? (
            <div className="animate-pulse divide-y divide-[#F0EDE8]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-white" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-sm text-[#6B6B6B]">Todavía no registraste compras.</p>
              <Link to="/seller/purchases/new" className="text-xs text-[#1A2B1C] underline underline-offset-2">
                Registrar la primera
              </Link>
            </div>
          ) : (
            <>
              <table className="w-full hidden sm:table">
                <thead>
                  <tr className="border-b border-[#E8E2D8] bg-[#F9F8F5]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[120px]">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Proveedor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Referencia</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[90px]">Ítems</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[90px]">Unidades</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider w-[130px]">Costo total</th>
                    <th className="w-[60px] px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE8]">
                  {items.map((p) => (
                    <tr key={p.purchase_id} className="hover:bg-[#F9F8F5] transition-colors">
                      <td className="px-4 py-3 text-xs text-[#6B6B6B] whitespace-nowrap">{fmtDate(p.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-[#1A1A1A]">{p.supplier || "—"}</td>
                      <td className="px-4 py-3 text-sm text-[#6B6B6B]">{p.reference || "—"}</td>
                      <td className="px-4 py-3 text-sm text-[#6B6B6B]">{p.item_count}</td>
                      <td className="px-4 py-3 text-sm text-[#6B6B6B]">{p.total_units}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#1A1A1A]">{formatARS(p.total_cost)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/seller/purchases/${p.purchase_id}`} className="text-xs text-[#1A2B1C] hover:underline">Ver</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="sm:hidden divide-y divide-[#F0EDE8]">
                {items.map((p) => (
                  <Link
                    key={p.purchase_id}
                    to={`/seller/purchases/${p.purchase_id}`}
                    className="flex items-start gap-3 px-4 py-3.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A2B1C]">{p.supplier || "Compra"}</p>
                      <p className="text-xs text-[#ABABAB]">{p.reference || fmtDate(p.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{formatARS(p.total_cost)}</p>
                      <p className="text-xs text-[#ABABAB]">{p.total_units} u.</p>
                    </div>
                  </Link>
                ))}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E2D8]">
                  <p className="text-xs text-[#8A8A8A]">Página {page} de {pages}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg px-2.5 py-1.5 text-xs border border-[#E8E2D8] text-[#4A4A4A] hover:bg-[#F9F8F5] transition-colors disabled:opacity-40"
                    >←</button>
                    <button
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="rounded-lg px-2.5 py-1.5 text-xs border border-[#E8E2D8] text-[#4A4A4A] hover:bg-[#F9F8F5] transition-colors disabled:opacity-40"
                    >→</button>
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
