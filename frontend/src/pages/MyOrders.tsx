import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { OrderStatusBadge } from "../components/order/OrderStatusBadge";
import { useAuth } from "../hooks/useAuth";
import { orderService } from "../services/order.service";
import type { OrderSummary } from "../types/order";
import { formatARS } from "../utils/currency";

const PAGE_SIZE = 20;

export function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    orderService
      .list({ page, page_size: PAGE_SIZE, sort: "newest" })
      .then((res) => {
        setOrders(res.items);
        setPages(res.pages || 1);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user, page]);

  if (!user) return <Navigate to="/login" state={{ from: "/mis-pedidos" }} replace />;

  return (
    <Layout>
      <div className="max-w-screen-lg mx-auto px-6 py-12">
        <h1 className="font-serif text-3xl text-[#1A1A1A] mb-1">Mis pedidos</h1>
        <p className="text-sm text-[#6B6B6B] mb-8">Historial de tus compras y el estado de cada una.</p>

        {loading ? (
          <p className="text-sm text-[#8A8A8A] py-16 text-center">Cargando pedidos…</p>
        ) : error ? (
          <p className="text-sm text-[#B91C1C] py-16 text-center">No pudimos cargar tus pedidos.</p>
        ) : orders.length === 0 ? (
          <div className="border border-[#E8E2D8] rounded-lg bg-white p-12 text-center">
            <p className="text-sm text-[#6B6B6B] mb-4">Todavía no hiciste ningún pedido.</p>
            <Link to="/products" className="btn-primary inline-block px-6 py-3">
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {orders.map((o) => (
                <li key={o.order_id}>
                  <Link
                    to={`/mis-pedidos/${o.order_id}`}
                    className="flex items-center justify-between gap-4 border border-[#E8E2D8] rounded-lg bg-white px-5 py-4 hover:border-[#5A7A5C] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{o.order_number}</p>
                      <p className="text-xs text-[#8A8A8A] mt-0.5">
                        {new Date(o.created_at).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        · {o.item_count} {o.item_count === 1 ? "artículo" : "artículos"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <OrderStatusBadge status={o.status} />
                      <span className="text-sm font-semibold text-[#1A1A1A] w-24 text-right">
                        {formatARS(o.total)}
                      </span>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="#8A8A8A" strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-xs uppercase tracking-widest text-[#6B6B6B] disabled:opacity-40 hover:text-forest-deep transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-[#8A8A8A]">
                  Página {page} de {pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  className="text-xs uppercase tracking-widest text-[#6B6B6B] disabled:opacity-40 hover:text-forest-deep transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
