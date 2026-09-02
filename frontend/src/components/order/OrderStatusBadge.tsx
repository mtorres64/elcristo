import { ORDER_STATUS_LABEL } from "../../types/order";
import type { OrderStatus } from "../../types/order";

const STYLES: Record<OrderStatus, string> = {
  pending_payment: "bg-[#FBF6E7] text-[#8A6D1F]",
  paid: "bg-[#EAF3EA] text-[#2E5A2E]",
  preparing: "bg-[#EEF2FF] text-[#3949AB]",
  shipped: "bg-[#E7F1FB] text-[#1F5C8A]",
  delivered: "bg-[#EAF3EA] text-[#2E5A2E]",
  cancelled: "bg-[#FEF2F2] text-[#B91C1C]",
  refunded: "bg-[#F1F1F0] text-[#6B6B6B]",
  disputed: "bg-[#FEF2F2] text-[#B91C1C]",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STYLES[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
