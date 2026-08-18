import type { PaymentMethod } from "../../types/payment";

const BRAND_LABEL: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  other: "Tarjeta",
};

export function PaymentMethodCard({
  method,
  selected,
  onSelect,
  onDelete,
}: {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
        selected ? "border-[#1A2B1C] bg-[#F4F8F4]" : "border-[#E8E2D8] hover:border-[#C8C0B4] bg-white"
      }`}
    >
      <input
        type="radio"
        checked={selected}
        onChange={onSelect}
        className="w-4 h-4 accent-[#1A2B1C] cursor-pointer shrink-0"
      />
      <CardIcon />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {BRAND_LABEL[method.brand] ?? "Tarjeta"} terminada en {method.last4}
          </p>
          {method.is_default && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#3D6040] bg-[#E8F0E8] px-2 py-0.5 rounded-full">
              Predeterminada
            </span>
          )}
        </div>
        <p className="text-xs text-[#8A8A8A] mt-0.5">
          {method.holder_name} · Vence {String(method.exp_month).padStart(2, "0")}/{String(method.exp_year).slice(-2)}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onDelete();
        }}
        className="text-[#ABABAB] hover:text-[#DC2626] transition-colors shrink-0"
        aria-label="Eliminar tarjeta"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
        </svg>
      </button>
    </label>
  );
}

function CardIcon() {
  return (
    <svg width="26" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A2B1C" strokeWidth="1.6" className="shrink-0">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="9" x2="23" y2="9" />
    </svg>
  );
}
