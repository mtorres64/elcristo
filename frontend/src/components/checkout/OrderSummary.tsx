import { formatARS } from "../../utils/currency";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

interface SummaryItem {
  title: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

export function OrderSummary({
  items,
  subtotal,
  shippingCost,
  discount,
  total,
}: {
  items: SummaryItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
}) {
  return (
    <div className="rounded-lg border border-[#E8E2D8] bg-white p-5">
      <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Resumen del pedido</h2>

      <ul className="flex flex-col gap-3 mb-4 max-h-72 overflow-y-auto">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-[#F0EDE8] shrink-0">
              {item.image_url ? (
                <img
                  src={item.image_url.startsWith("/uploads") ? `${API_BASE}${item.image_url}` : item.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#1A1A1A] truncate">{item.title}</p>
              <p className="text-[11px] text-[#8A8A8A]">Cantidad: {item.quantity}</p>
            </div>
            <p className="text-xs font-semibold text-[#1A1A1A] shrink-0">
              {formatARS(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="border-t border-[#F0EDE8] pt-4 flex flex-col gap-2">
        <Row label="Subtotal" value={formatARS(subtotal)} />
        <Row label="Envío" value={shippingCost > 0 ? formatARS(shippingCost) : "A calcular"} />
        {discount > 0 && <Row label="Descuento" value={`-${formatARS(discount)}`} />}
        <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE8]">
          <span className="text-sm font-semibold text-[#1A1A1A]">Total</span>
          <span className="text-base font-bold text-[#1A1A1A]">{formatARS(total)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[#6B6B6B]">{label}</span>
      <span className="text-[#1A1A1A] font-medium">{value}</span>
    </div>
  );
}
