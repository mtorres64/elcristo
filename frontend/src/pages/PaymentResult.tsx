import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { orderService } from "../services/order.service";
import type { OrderSummary } from "../types/order";

/** Páginas de vuelta desde Web Checkout de Getnet (success_url / error_url,
 * configuradas como URLs FIJAS en el Getnet Portal — no pueden llevar el id
 * del pedido en la ruta). Ninguna de las dos asume el resultado a partir de
 * en cuál cayó el navegador: el manual de Getnet es explícito en que el
 * redirect es sólo UX y el webhook es la única fuente de verdad, así que acá
 * se busca el pedido más reciente del comprador (está autenticado) y se
 * muestra SU estado real, consultado a nuestro backend — nunca "éxito" sólo
 * porque la URL dice "pago-exitoso". */
function usePaymentOutcome() {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    orderService
      .list({ sort: "newest", page_size: 1 })
      .then((res) => alive && setOrder(res.items[0] ?? null))
      .catch(() => alive && setOrder(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  // El webhook puede llegar unos segundos después del redirect — un único
  // refresco automático alcanza para la mayoría de los casos sin armar un
  // polling indefinido.
  useEffect(() => {
    const t = setTimeout(() => setRefreshKey((k) => k + 1), 4000);
    return () => clearTimeout(t);
  }, []);

  return { order, loading, refresh: () => setRefreshKey((k) => k + 1) };
}

function OutcomeMessage({ order }: { order: OrderSummary | null }) {
  if (!order) {
    return (
      <p className="text-sm text-[#6B6B6B]">
        No encontramos un pedido reciente. Si acabás de pagar, revisá el estado en{" "}
        <Link to="/mis-pedidos" className="underline">Mis pedidos</Link>.
      </p>
    );
  }
  if (order.status === "pending_payment") {
    return (
      <p className="text-sm text-[#6B6B6B]">
        Todavía estamos confirmando el pago de tu pedido{" "}
        <span className="font-semibold text-[#1A1A1A]">{order.order_number}</span> con Getnet.
        Puede tardar un par de minutos — no hace falta que vuelvas a pagar.
      </p>
    );
  }
  if (order.status === "cancelled" || order.status === "refunded") {
    return (
      <p className="text-sm text-[#6B6B6B]">
        El pedido <span className="font-semibold text-[#1A1A1A]">{order.order_number}</span> no
        quedó pagado. Podés intentar de nuevo desde el carrito.
      </p>
    );
  }
  return (
    <p className="text-sm text-[#6B6B6B]">
      Tu pedido <span className="font-semibold text-[#1A1A1A]">{order.order_number}</span> está
      confirmado. ¡Gracias por tu compra!
    </p>
  );
}

function PaymentResultPage({ title }: { title: string }) {
  const { order, loading, refresh } = usePaymentOutcome();

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 py-24">
        <div className="max-w-md mx-auto text-center flex flex-col items-center gap-4">
          <h1 className="font-serif text-2xl text-[#1A1A1A]">{title}</h1>
          {loading ? (
            <p className="text-sm text-[#8A8A8A]">Consultando el estado de tu pedido…</p>
          ) : (
            <OutcomeMessage order={order} />
          )}
          <div className="flex items-center gap-4 mt-2">
            <button onClick={refresh} className="text-xs uppercase tracking-widest text-[#6B6B6B] hover:text-forest-deep transition-colors">
              Actualizar
            </button>
            <Link to="/mis-pedidos" className="link-arrow">Ver mis pedidos</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function PaymentSuccess() {
  return <PaymentResultPage title="Volviste de Getnet" />;
}

export function PaymentError() {
  return <PaymentResultPage title="El pago no se completó" />;
}
