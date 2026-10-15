import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ORDER_STATUS_LABEL,
  CHANNEL_LABEL,
  POS_PAYMENT_METHOD_LABEL,
} from "../../types/order";
import type { Order } from "../../types/order";
import { orderService } from "../../services/order.service";
import { formatARS } from "../../utils/currency";

/** Recibo imprimible de un pedido (online o venta POS): página standalone,
 * sin AdminLayout (sin sidebar/nav), pensada para `window.print()` — en el
 * diálogo de impresión del navegador, "Guardar como PDF" genera el PDF sin
 * necesidad de ninguna librería ni endpoint nuevo. */
export function OrderReceipt() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    orderService
      .getById(orderId)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <div className="p-8 text-sm text-[#8A8A8A]">Cargando recibo...</div>;
  }

  if (error || !order) {
    return <div className="p-8 text-sm text-[#6B6B6B]">No se encontró el pedido.</div>;
  }

  const customerName = order.buyer_name;
  const customerContact = order.buyer_email ?? order.guest_phone ?? null;

  return (
    <div className="min-h-screen bg-[#F5F5F3] print:bg-white">
      <div className="max-w-2xl mx-auto px-4 py-6 print:p-0 print:max-w-none">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Link to={`/seller/orders/${order.order_id}`} className="text-xs text-[#6B6B6B] hover:text-[#1A2B1C] transition-colors">
            ← Volver al pedido
          </Link>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-[#1A2B1C] text-white text-sm font-semibold px-4 py-2 hover:bg-[#253824] transition-colors"
          >
            Imprimir / Guardar como PDF
          </button>
        </div>

        <div className="bg-white border border-[#E8E2D8] rounded-lg p-8 print:border-0 print:rounded-none print:p-0">
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#E8E2D8]">
            <div className="flex items-center gap-3">
              <img src="/images/logo_verde_line.png" alt="Vivero El Cristo" className="h-10 w-auto" />
              <div>
                <p className="font-serif text-lg font-semibold text-[#1A1A1A] leading-tight">Vivero El Cristo</p>
                <p className="text-xs text-[#8A8A8A]">Recibo de compra</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#1A1A1A]">{order.order_number}</p>
              <p className="text-xs text-[#8A8A8A] mt-0.5">
                {new Date(order.created_at).toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-[#8A8A8A] mt-0.5">
                {ORDER_STATUS_LABEL[order.status]} · {CHANNEL_LABEL[order.channel]}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 py-5 border-b border-[#E8E2D8]">
            <div>
              <p className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Cliente</p>
              <p className="text-sm text-[#1A1A1A]">{customerName}</p>
              {customerContact && <p className="text-xs text-[#6B6B6B]">{customerContact}</p>}
              {!order.buyer_id && <p className="text-xs text-[#6B6B6B]">Cliente ocasional</p>}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Entrega</p>
              {order.shipping_address ? (
                <>
                  <p className="text-sm text-[#1A1A1A]">
                    {order.shipping_address.street}{order.shipping_address.no_number ? " (sin número)" : ""}
                  </p>
                  <p className="text-xs text-[#6B6B6B]">
                    {order.shipping_address.locality}, {order.shipping_address.province}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[#1A1A1A]">Retira en el local</p>
              )}
            </div>
          </div>

          <div className="py-5 border-b border-[#E8E2D8]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
                  <th className="text-left pb-2">Producto</th>
                  <th className="text-right pb-2 w-16">Cant.</th>
                  <th className="text-right pb-2 w-24">Precio</th>
                  <th className="text-right pb-2 w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE8]">
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-[#1A1A1A]">{item.title}</td>
                    <td className="py-2 text-right text-[#4A4A4A]">{item.quantity}</td>
                    <td className="py-2 text-right text-[#4A4A4A]">{formatARS(item.price)}</td>
                    <td className="py-2 text-right font-medium text-[#1A1A1A]">{formatARS(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="py-5 border-b border-[#E8E2D8] flex flex-col items-end gap-1.5">
            <ReceiptTotalRow label="Subtotal" value={formatARS(order.subtotal)} />
            <ReceiptTotalRow label="Envío" value={order.shipping_cost > 0 ? formatARS(order.shipping_cost) : "Gratis"} />
            {order.discount > 0 && <ReceiptTotalRow label="Descuento" value={`-${formatARS(order.discount)}`} />}
            <ReceiptTotalRow label="Total" value={formatARS(order.total)} bold />
          </div>

          <div className="pt-5 grid grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Pago</p>
              {order.channel === "pos" && order.payments.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {order.payments.map((p, i) => (
                    <p key={i} className="text-sm text-[#1A1A1A]">
                      {POS_PAYMENT_METHOD_LABEL[p.method]}
                      {p.installments ? ` (${p.installments} cuotas)` : ""}: {formatARS(p.amount)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#1A1A1A]">
                  {order.payment.last4
                    ? `${order.payment.brand ?? "Tarjeta"} terminada en ${order.payment.last4}`
                    : "Pago online"}
                </p>
              )}
            </div>
            {order.notes && (
              <div>
                <p className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Notas</p>
                <p className="text-sm text-[#4A4A4A]">{order.notes}</p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-[#ABABAB] mt-8 pt-4 border-t border-[#F0EDE8]">
            Gracias por tu compra en Vivero El Cristo.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReceiptTotalRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center gap-6 text-sm">
      <span className={bold ? "font-semibold text-[#1A1A1A]" : "text-[#6B6B6B]"}>{label}</span>
      <span className={`w-24 text-right ${bold ? "font-bold text-[#1A1A1A]" : "text-[#4A4A4A]"}`}>{value}</span>
    </div>
  );
}
