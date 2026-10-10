import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { useCart } from "../hooks/useCart";
import { orderService } from "../services/order.service";
import { PAID_ORDER_STATUSES } from "../types/order";
import type { OrderSummary } from "../types/order";
import { clearPendingOrder } from "../utils/pendingOrder";

/** success_url de Web Checkout (Getnet) — URL FIJA configurada en el Getnet
 * Portal, no puede llevar el id del pedido en la ruta. El manual de Getnet
 * es explícito en que el redirect es sólo UX y el webhook es la única
 * fuente de verdad, así que acá se busca el pedido más reciente del
 * comprador (está autenticado) y se muestra SU estado real, consultado a
 * nuestro backend — nunca se asume éxito sólo porque Getnet redirigió acá. */
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
  if (PAID_ORDER_STATUSES.has(order.status)) {
    return (
      <p className="text-sm text-[#6B6B6B]">
        Tu pedido <span className="font-semibold text-[#1A1A1A]">{order.order_number}</span> está
        confirmado. ¡Gracias por tu compra!
      </p>
    );
  }
  return (
    <p className="text-sm text-[#6B6B6B]">
      El pedido <span className="font-semibold text-[#1A1A1A]">{order.order_number}</span> no
      quedó pagado. Podés intentar de nuevo desde el carrito.
    </p>
  );
}

/** success_url — ver comentario de `usePaymentOutcome`. Acá, y sólo acá, se
 * vacía el carrito, y sólo cuando el pedido más reciente ya está realmente
 * pagado (nunca por estar en esta URL: Getnet puede redirigir acá incluso
 * si el pago todavía se está confirmando). */
export function PaymentSuccess() {
  const { order, loading, refresh } = usePaymentOutcome();
  const { clearCart } = useCart();

  useEffect(() => {
    if (order && PAID_ORDER_STATUSES.has(order.status)) {
      clearCart();
      clearPendingOrder();
    }
  }, [order, clearCart]);

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 py-24">
        <div className="max-w-md mx-auto text-center flex flex-col items-center gap-4">
          <h1 className="font-serif text-2xl text-[#1A1A1A]">Volviste de Getnet</h1>
          {loading ? (
            <p className="text-sm text-[#8A8A8A]">Consultando el estado de tu pedido…</p>
          ) : (
            <OutcomeMessage order={order} />
          )}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={refresh}
              className="text-xs uppercase tracking-widest text-[#6B6B6B] hover:text-forest-deep transition-colors"
            >
              Actualizar
            </button>
            <Link to="/mis-pedidos" className="link-arrow">Ver mis pedidos</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/** error_url — a diferencia de la de éxito, esta página no intenta
 * adivinar el estado de ningún pedido (el "pedido más reciente" del
 * comprador podría ser uno anterior ya pagado, y mostrar "confirmado" acá
 * sería activamente engañoso). El mensaje es siempre el mismo: el pago no
 * se completó, hay que reintentarlo — y el carrito sigue intacto porque
 * nunca se vació (ver Cart.tsx: `clearCart` sólo corre en PaymentSuccess). */
export function PaymentError() {
  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 py-24">
        <div className="max-w-md mx-auto text-center flex flex-col items-center gap-4">
          <h1 className="font-serif text-2xl text-[#1A1A1A]">El pago no se completó</h1>
          <p className="text-sm text-[#6B6B6B]">
            No pudimos procesar tu pago con Getnet. Tu pedido no se confirmó — necesitás volver al
            carrito y reintentarlo. Los productos siguen ahí, no se perdió nada.
          </p>
          <Link to="/cart" className="btn-primary mt-2">Volver al carrito</Link>
        </div>
      </div>
    </Layout>
  );
}
