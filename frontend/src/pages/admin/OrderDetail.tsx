import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { orderService } from "../../services/order.service";
import { ORDER_STATUS_LABEL } from "../../types/order";
import type { Order, OrderStatus } from "../../types/order";
import { formatARS } from "../../utils/currency";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending_payment",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "disputed",
];

export function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [nextStatus, setNextStatus] = useState<OrderStatus>("pending_payment");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [updating, setUpdating] = useState(false);

  function load() {
    if (!orderId) return;
    setLoading(true);
    orderService
      .getById(orderId)
      .then((data) => {
        setOrder(data);
        setNextStatus(data.status);
        setTrackingNumber(data.tracking_number ?? "");
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [orderId]);

  async function handleUpdateStatus() {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await orderService.updateStatus(order.order_id, nextStatus, trackingNumber.trim() || null);
      setOrder(updated);
      toast.success("Pedido actualizado");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "No se pudo actualizar el pedido";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="px-4 sm:px-8 py-6"><p className="text-sm text-[#8A8A8A]">Cargando pedido...</p></div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="px-4 sm:px-8 py-6"><p className="text-sm text-[#6B6B6B]">No se encontró el pedido.</p></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-8 py-6 min-h-full">
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">Dashboard</Link>
          <span>/</span>
          <Link to="/seller/orders" className="hover:text-[#1A2B1C] transition-colors">Pedidos</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">{order.order_number}</span>
        </nav>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">{order.order_number}</h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              {new Date(order.created_at).toLocaleString("es-AR")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="rounded-lg bg-white border border-[#E8E2D8] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E8E2D8] bg-[#F9F8F5]">
                <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Productos</p>
              </div>
              <div className="divide-y divide-[#F0EDE8]">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-[#F0EDE8] shrink-0">
                      {item.image_url && (
                        <img
                          src={item.image_url.startsWith("/uploads") ? `${API_BASE}${item.image_url}` : item.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.title}</p>
                      <p className="text-xs text-[#8A8A8A]">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{formatARS(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-[#E8E2D8] flex flex-col gap-1.5 items-end">
                <TotalRow label="Subtotal" value={formatARS(order.subtotal)} />
                <TotalRow label="Envío" value={order.shipping_cost > 0 ? formatARS(order.shipping_cost) : "Gratis"} />
                {order.discount > 0 && <TotalRow label="Descuento" value={`-${formatARS(order.discount)}`} />}
                <TotalRow label="Total" value={formatARS(order.total)} bold />
              </div>
            </div>

            <div className="rounded-lg bg-white border border-[#E8E2D8] p-4">
              <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Dirección de envío</p>
              <p className="text-sm text-[#1A1A1A]">
                {order.shipping_address.street} {order.shipping_address.no_number ? "(sin número)" : ""}
              </p>
              <p className="text-sm text-[#4A4A4A]">
                {order.shipping_address.locality}, {order.shipping_address.province}
                {order.shipping_address.zip ? ` (CP ${order.shipping_address.zip})` : ""}
              </p>
              {order.shipping_address.department && (
                <p className="text-sm text-[#4A4A4A]">Depto/Piso: {order.shipping_address.department}</p>
              )}
              <p className="text-xs text-[#8A8A8A] mt-2">
                {order.shipping_address.full_name} · {order.shipping_address.phone_country_code} {order.shipping_address.phone}
              </p>
            </div>

            <div className="rounded-lg bg-white border border-[#E8E2D8] p-4">
              <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Pago</p>
              <p className="text-sm text-[#1A1A1A]">
                {order.payment.brand ?? "Tarjeta"} terminada en {order.payment.last4 ?? "----"}
              </p>
              <p className="text-xs text-[#8A8A8A] mt-1">
                Estado del pago: {order.payment.status} · Proveedor: {order.payment.provider}
                {order.payment.provider === "mock" && " (sin pasarela real conectada todavía)"}
              </p>
            </div>

            {order.notes && (
              <div className="rounded-lg bg-white border border-[#E8E2D8] p-4">
                <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Notas del comprador</p>
                <p className="text-sm text-[#4A4A4A]">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-white border border-[#E8E2D8] p-4">
              <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-3">Estado del pedido</p>
              <p className="text-sm font-semibold text-[#1A1A1A] mb-4">{ORDER_STATUS_LABEL[order.status]}</p>

              <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">Cambiar a</label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                className="w-full rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] mb-3"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                ))}
              </select>

              <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">
                Nº de seguimiento <span className="text-[#ABABAB] font-normal">(opcional)</span>
              </label>
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Ej: OCA123456789"
                className="w-full rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] mb-4"
              />

              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="w-full rounded-lg bg-[#1A2B1C] text-white text-sm font-semibold py-2.5 hover:bg-[#253824] transition-colors disabled:opacity-50"
              >
                {updating ? "Actualizando..." : "Actualizar pedido"}
              </button>
            </div>

            <div className="rounded-lg bg-white border border-[#E8E2D8] p-4">
              <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Comprador</p>
              <p className="text-sm text-[#1A1A1A]">{order.buyer_name}</p>
              <p className="text-xs text-[#8A8A8A]">{order.buyer_email}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function TotalRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center gap-6 text-sm">
      <span className={bold ? "font-semibold text-[#1A1A1A]" : "text-[#6B6B6B]"}>{label}</span>
      <span className={bold ? "font-bold text-[#1A1A1A]" : "text-[#4A4A4A]"}>{value}</span>
    </div>
  );
}
