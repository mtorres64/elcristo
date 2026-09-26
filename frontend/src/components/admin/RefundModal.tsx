import type { Order, RefundOutcome } from "../../types/order";
import { formatARS } from "../../utils/currency";

interface Props {
  order: Order;
  // "confirm" = pidiendo confirmación; "processing" = esperando a Getnet; RefundOutcome = resultado final.
  state: "confirm" | "processing" | RefundOutcome;
  onConfirm: () => void;
  onClose: () => void;
}

const RESULT_STYLE: Record<RefundOutcome["outcome"], { title: string; badge: string; icon: string }> = {
  refunded: { title: "Devolución realizada", badge: "bg-[#E8F3EA] text-[#2F6B3A]", icon: "✓" },
  not_required: { title: "Pedido cancelado", badge: "bg-[#E8F3EA] text-[#2F6B3A]", icon: "✓" },
  skipped: { title: "Pedido cancelado sin devolución", badge: "bg-[#FFF4E0] text-[#8A5A00]", icon: "!" },
  failed: { title: "No se pudo devolver el pago", badge: "bg-[#FDEDED] text-[#A03030]", icon: "×" },
  unknown: { title: "Resultado de la devolución incierto", badge: "bg-[#FFF4E0] text-[#8A5A00]", icon: "?" },
};

export function RefundModal({ order, state, onConfirm, onClose }: Props) {
  const processing = state === "processing";
  const result = typeof state === "string" ? null : state;
  const card = `${order.payment.brand ?? "Tarjeta"} terminada en ${order.payment.last4 ?? "----"}`;
  const retryable = result?.outcome === "failed" || result?.outcome === "unknown";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="px-5 py-4 border-b border-[#E8E2D8]">
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {result ? RESULT_STYLE[result.outcome].title : "Cancelar pedido y devolver el pago"}
          </p>
        </div>

        <div className="px-5 py-4 text-sm text-[#4A4A4A] flex flex-col gap-3">
          {!result && (
            <>
              <p>
                Se va a devolver <strong>{formatARS(order.total)}</strong> a {card} a través de Getnet y el
                pedido pasará a <strong>Reembolsado</strong>.
              </p>
              <p className="text-xs text-[#8A8A8A]">Esta acción no se puede deshacer.</p>
            </>
          )}
          {result && (
            <div className={`rounded-lg px-3 py-2.5 flex gap-2.5 ${RESULT_STYLE[result.outcome].badge}`}>
              <span className="font-bold leading-5">{RESULT_STYLE[result.outcome].icon}</span>
              <p className="leading-5">{result.message}</p>
            </div>
          )}
          {result?.amount != null && (
            <p className="text-xs text-[#6B6B6B]">
              Importe: {formatARS(result.amount)}
              {result.refund_id && <> · Nº de devolución: {result.refund_id}</>}
            </p>
          )}
          {result?.outcome === "failed" && (
            <p className="text-xs text-[#6B6B6B]">El pedido sigue en su estado anterior y no se restauró el stock.</p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#E8E2D8] flex justify-end gap-2">
          {retryable && (
            <button
              onClick={onConfirm}
              className="rounded-lg border border-[#1A2B1C] text-[#1A2B1C] text-sm font-semibold px-4 py-2 hover:bg-[#F0EDE8]"
            >
              Reintentar
            </button>
          )}
          <button
            onClick={onClose}
            disabled={processing}
            className="rounded-lg border border-[#E8E2D8] text-sm font-medium text-[#4A4A4A] px-4 py-2 hover:bg-[#F9F8F5] disabled:opacity-50"
          >
            {result ? "Cerrar" : "Volver"}
          </button>
          {!result && (
            <button
              onClick={onConfirm}
              disabled={processing}
              className="rounded-lg bg-[#A03030] text-white text-sm font-semibold px-4 py-2 hover:bg-[#8A2828] disabled:opacity-50"
            >
              {processing ? "Devolviendo..." : "Cancelar y devolver"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
