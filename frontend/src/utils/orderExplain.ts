import type { Order } from "../types/order";

type ShippingFields = Pick<Order, "pickup" | "shipping_cost" | "shipping_zone_name">;

// Explica por qué el envío salió gratis, con costo o a coordinar — ver
// `_resolve_shipping` en backend/app/routers/orders.py, que es la única
// fuente de estos tres casos.
export function getShippingNote(order: ShippingFields): string | null {
  if (order.pickup) return "Retirás en el local";
  if (order.shipping_cost === 0) {
    return order.shipping_zone_name ? `Envío gratis en ${order.shipping_zone_name}` : "A coordinar con el vendedor";
  }
  return order.shipping_zone_name ? `Envío a ${order.shipping_zone_name}` : null;
}

export function getDiscountNote(order: Pick<Order, "pickup">): string | null {
  return order.pickup ? "Descuento por retirar en el local" : null;
}
