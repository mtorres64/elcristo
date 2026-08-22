import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { OrderSummary } from "../components/checkout/OrderSummary";
import { orderService } from "../services/order.service";
import { ORDER_STATUS_LABEL } from "../types/order";
import type { Order } from "../types/order";

export function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    orderService
      .getById(orderId)
      .then(setOrder)
      .catch(() => setError(true));
  }, [orderId]);

  if (error) {
    return (
      <Layout>
        <div className="max-w-screen-xl mx-auto px-6 py-24 text-center">
          <p className="text-sm text-[#6B6B6B]">No pudimos encontrar ese pedido.</p>
          <Link to="/" className="link-arrow justify-center mt-4">Volver a la tienda</Link>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="max-w-screen-xl mx-auto px-6 py-24 text-center">
          <p className="text-sm text-[#8A8A8A]">Cargando pedido...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="max-w-lg mx-auto text-center mb-10">
          <div className="w-14 h-14 rounded-full bg-[#E8F0E8] flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3D6040" strokeWidth="2.2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl text-[#1A1A1A] mb-2">¡Gracias por tu pedido!</h1>
          <p className="text-sm text-[#6B6B6B]">
            Pedido <span className="font-semibold text-[#1A1A1A]">{order.order_number}</span> ·{" "}
            {ORDER_STATUS_LABEL[order.status]}
          </p>
          <p className="text-xs text-[#8A8A8A] mt-2 max-w-sm mx-auto">
            {order.payment.provider === "getnet"
              ? "Tu pago fue confirmado con Getnet."
              : "Todavía no procesamos ningún cobro real: en breve nos contactamos para confirmar el pago de tu pedido."}
          </p>
        </div>

        <div className="max-w-lg mx-auto flex flex-col gap-4">
          <OrderSummary
            items={order.items}
            subtotal={order.subtotal}
            shippingCost={order.shipping_cost}
            discount={order.discount}
            total={order.total}
          />

          <div className="rounded-lg border border-[#E8E2D8] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8A8A] mb-1.5">Envío a</p>
            <p className="text-sm text-[#4A4A4A]">
              {order.shipping_address.street} {order.shipping_address.no_number ? "(sin número)" : ""},{" "}
              {order.shipping_address.locality}, {order.shipping_address.province}
              <br />
              {order.shipping_address.full_name} · {order.shipping_address.phone_country_code}{" "}
              {order.shipping_address.phone}
            </p>
          </div>

          <Link to="/products" className="btn-primary w-full text-center">
            Seguir comprando
          </Link>
        </div>
      </div>
    </Layout>
  );
}
