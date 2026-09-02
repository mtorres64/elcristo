import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { OrderStatusBadge } from "../components/order/OrderStatusBadge";
import { useAuth } from "../hooks/useAuth";
import { orderService } from "../services/order.service";
import { ORDER_STATUS_LABEL } from "../types/order";
import type { Order, OrderStatus } from "../types/order";
import { formatARS } from "../utils/currency";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const FLOW: { status: OrderStatus; label: string }[] = [
  { status: "pending_payment", label: "Pedido realizado" },
  { status: "paid", label: "Pago confirmado" },
  { status: "preparing", label: "Preparando" },
  { status: "shipped", label: "Enviado" },
  { status: "delivered", label: "Entregado" },
];
const INTERRUPTED: OrderStatus[] = ["cancelled", "refunded", "disputed"];

function Stepper({ status }: { status: OrderStatus }) {
  if (INTERRUPTED.includes(status)) {
    return (
      <div className="rounded-lg border border-[#F2D6D6] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
        Este pedido está marcado como <strong>{ORDER_STATUS_LABEL[status]}</strong>.
      </div>
    );
  }
  const currentIndex = FLOW.findIndex((s) => s.status === status);
  return (
    <ol className="flex items-center">
      {FLOW.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <li key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  done ? "bg-[#253824] text-white" : "bg-[#E8E2D8] text-[#8A8A8A]"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`text-[10px] text-center leading-tight w-16 ${
                  done ? "text-[#1A1A1A] font-medium" : "text-[#8A8A8A]"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <span
                className={`h-0.5 flex-1 mx-1 -mt-5 ${i < currentIndex ? "bg-[#253824]" : "bg-[#E8E2D8]"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function MyOrderDetail() {
  const { user } = useAuth();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user || !orderId) return;
    setLoading(true);
    orderService
      .getById(orderId)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user, orderId]);

  if (!user) return <Navigate to="/login" state={{ from: `/mis-pedidos/${orderId ?? ""}` }} replace />;

  return (
    <Layout>
      <div className="max-w-screen-lg mx-auto px-6 py-12">
        <Link
          to="/mis-pedidos"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#6B6B6B] hover:text-forest-deep transition-colors mb-6"
        >
          ← Mis pedidos
        </Link>

        {loading ? (
          <p className="text-sm text-[#8A8A8A] py-16 text-center">Cargando pedido…</p>
        ) : error || !order ? (
          <p className="text-sm text-[#B91C1C] py-16 text-center">No pudimos encontrar ese pedido.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h1 className="font-serif text-3xl text-[#1A1A1A]">{order.order_number}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-[#8A8A8A] mb-8">
              Realizado el{" "}
              {new Date(order.created_at).toLocaleString("es-AR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <div className="border border-[#E8E2D8] rounded-lg bg-white p-5 mb-6 overflow-x-auto">
              <Stepper status={order.status} />
            </div>

            {order.tracking_number && (
              <div className="border border-[#E8E2D8] rounded-lg bg-white p-4 mb-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8A8A] mb-1">
                  Número de seguimiento
                </p>
                <p className="text-sm text-[#1A1A1A]">{order.tracking_number}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="rounded-lg border border-[#E8E2D8] bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E8E2D8] bg-[#F9F8F5]">
                    <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
                      Productos
                    </p>
                  </div>
                  <div className="divide-y divide-[#F0EDE8]">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 px-4 py-3">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-[#F0EDE8] shrink-0">
                          {item.image_url && (
                            <img
                              src={
                                item.image_url.startsWith("/uploads")
                                  ? `${API_BASE}${item.image_url}`
                                  : item.image_url
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.title}</p>
                          <p className="text-xs text-[#8A8A8A]">Cantidad: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-[#1A1A1A]">
                          {formatARS(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-[#E8E2D8] flex flex-col gap-1.5 items-end">
                    <Row label="Subtotal" value={formatARS(order.subtotal)} />
                    <Row
                      label="Envío"
                      value={order.shipping_cost > 0 ? formatARS(order.shipping_cost) : "Gratis"}
                    />
                    {order.discount > 0 && (
                      <Row label="Descuento" value={`-${formatARS(order.discount)}`} />
                    )}
                    <Row label="Total" value={formatARS(order.total)} bold />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="rounded-lg border border-[#E8E2D8] bg-white p-4">
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                    Envío a
                  </p>
                  <p className="text-sm text-[#1A1A1A]">
                    {order.shipping_address.street}{" "}
                    {order.shipping_address.no_number ? "(sin número)" : ""}
                  </p>
                  <p className="text-sm text-[#4A4A4A]">
                    {order.shipping_address.locality}, {order.shipping_address.province}
                    {order.shipping_address.zip ? ` (CP ${order.shipping_address.zip})` : ""}
                  </p>
                  {order.shipping_address.department && (
                    <p className="text-sm text-[#4A4A4A]">Depto/Piso: {order.shipping_address.department}</p>
                  )}
                  <p className="text-xs text-[#8A8A8A] mt-2">
                    {order.shipping_address.full_name} · {order.shipping_address.phone_country_code}{" "}
                    {order.shipping_address.phone}
                  </p>
                </div>

                <div className="rounded-lg border border-[#E8E2D8] bg-white p-4">
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                    Pago
                  </p>
                  <p className="text-sm text-[#1A1A1A]">
                    {order.payment.brand ?? "Tarjeta"} terminada en {order.payment.last4 ?? "----"}
                  </p>
                  <p className="text-xs text-[#8A8A8A] mt-1">
                    {order.payment.status === "approved"
                      ? "Pago confirmado"
                      : "Pago pendiente de confirmación"}
                  </p>
                </div>

                {order.notes && (
                  <div className="rounded-lg border border-[#E8E2D8] bg-white p-4">
                    <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                      Notas
                    </p>
                    <p className="text-sm text-[#4A4A4A]">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center gap-6 text-sm">
      <span className={bold ? "font-semibold text-[#1A1A1A]" : "text-[#6B6B6B]"}>{label}</span>
      <span className={bold ? "font-bold text-[#1A1A1A]" : "text-[#4A4A4A]"}>{value}</span>
    </div>
  );
}
