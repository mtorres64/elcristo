const STORAGE_KEY = "pending_getnet_order";

interface PendingOrder {
  order_id: string;
  order_number: string;
}

/** Referencia al último pedido creado que esperaba el pago de Getnet —
 * sobrevive a cualquier camino de vuelta a la tienda (botón "volver",
 * "atrás" del navegador, cerrar la pestaña y abrir "Mis pedidos" después),
 * no sólo a la redirección por `/pago-exitoso`. Se usa en Cart.tsx para
 * vaciar el carrito si resulta que el pedido ya se pagó, sin depender de
 * por dónde volvió el comprador — mismo principio que el webhook: nunca
 * confiar en el redirect como única señal. */
export function savePendingOrder(order: PendingOrder): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // localStorage puede fallar (modo privado, cuota llena) — no es crítico,
    // en el peor caso el carrito no se autolimpia y el comprador lo vacía a mano.
  }
}

export function getPendingOrder(): PendingOrder | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingOrder) : null;
  } catch {
    return null;
  }
}

export function clearPendingOrder(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ídem savePendingOrder
  }
}
