import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { alertService } from "../../services/alert.service";
import type { AlertsResponse } from "../../services/alert.service";
import { formatARS } from "../../utils/currency";

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

function StockPill({ stock }: { stock: number }) {
  const cls = stock === 0 ? "text-[#DC2626] bg-[#FEF2F2]" : "text-[#926D20] bg-[#FFF8E7]";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{stock} en stock</span>;
}

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2.5 px-4 sm:px-5 py-4 border-b border-[#E8E2D8]">
      <span className="shrink-0">{icon}</span>
      <h2 className="text-sm font-semibold text-[#1A1A1A]">{title}</h2>
      {count > 0 && (
        <span className="bg-[#1A2B1C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-none">
          {count}
        </span>
      )}
    </div>
  );
}

function SectionEmpty({ text }: { text: string }) {
  return <p className="text-sm text-[#6B6B6B] text-center py-10">{text}</p>;
}

function SectionSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-[#F0EDE8]">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 sm:px-5 py-3">
          <div className="w-10 h-10 rounded-lg bg-[#EDE9E2] shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[#EDE9E2] rounded w-1/3" />
            <div className="h-2.5 bg-[#F0EDE8] rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AlertList() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    alertService
      .get()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar las alertas. Intentá de nuevo.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout>
      <div className="px-4 sm:px-8 py-6 min-h-full">
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">Alertas</span>
        </nav>

        <div className="mb-6">
          <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">Alertas</h1>
          <p className="text-xs text-[#8A8A8A] mt-1">
            {loading
              ? "Cargando..."
              : `${(data?.low_stock_count ?? 0) + (data?.new_orders_count ?? 0)} alerta${
                  (data?.low_stock_count ?? 0) + (data?.new_orders_count ?? 0) !== 1 ? "s" : ""
                } activa${(data?.low_stock_count ?? 0) + (data?.new_orders_count ?? 0) !== 1 ? "s" : ""}`}
          </p>
        </div>

        {error ? (
          <div className="rounded-lg bg-white border border-[#E8E2D8] flex items-center justify-center py-20">
            <p className="text-sm text-[#6B6B6B]">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Stock bajo */}
            <div className="rounded-lg bg-white border border-[#E8E2D8] overflow-hidden">
              <SectionHeader icon={<StockIcon />} title="Stock bajo" count={data?.low_stock_count ?? 0} />
              {loading ? (
                <SectionSkeleton />
              ) : !data || data.low_stock.length === 0 ? (
                <SectionEmpty text="No hay productos con stock bajo." />
              ) : (
                <div className="divide-y divide-[#F0EDE8]">
                  {data.low_stock.map((item) => (
                    <Link
                      key={item.product_id}
                      to={`/seller/products/${item.product_id}/edit`}
                      className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-[#F9F8F5] transition-colors"
                    >
                      <ProductThumb src={item.image_url} title={item.title} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1A1A1A] truncate">{item.title}</p>
                        {item.category_name && (
                          <p className="text-xs text-[#ABABAB] truncate">{item.category_name}</p>
                        )}
                      </div>
                      <StockPill stock={item.stock} />
                    </Link>
                  ))}
                  {data.low_stock_count > data.low_stock.length && (
                    <p className="text-xs text-[#8A8A8A] text-center py-2.5">
                      +{data.low_stock_count - data.low_stock.length} más
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Nuevos pedidos */}
            <div className="rounded-lg bg-white border border-[#E8E2D8] overflow-hidden">
              <SectionHeader icon={<OrdersIcon />} title="Pedidos pendientes de pago" count={data?.new_orders_count ?? 0} />
              {loading ? (
                <SectionSkeleton />
              ) : !data || data.new_orders.length === 0 ? (
                <SectionEmpty text="No hay pedidos pendientes de pago." />
              ) : (
                <div className="divide-y divide-[#F0EDE8]">
                  {data.new_orders.map((order) => (
                    <Link
                      key={order.order_id}
                      to={`/seller/orders/${order.order_id}`}
                      className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-[#F9F8F5] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A2B1C]">{order.order_number}</p>
                        <p className="text-xs text-[#ABABAB] truncate">{order.buyer_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-[#1A1A1A]">{formatARS(order.total)}</p>
                        <p className="text-[10px] text-[#8A8A8A]">
                          {new Date(order.created_at).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {data.new_orders_count > data.new_orders.length && (
                    <p className="text-xs text-[#8A8A8A] text-center py-2.5">
                      +{data.new_orders_count - data.new_orders.length} más
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#926D20" strokeWidth="1.8">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2D4F8A" strokeWidth="1.8">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}
