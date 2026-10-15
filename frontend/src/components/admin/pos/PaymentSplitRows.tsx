import { POS_PAYMENT_METHOD_LABEL } from "../../../types/order";
import type { PosPaymentMethod } from "../../../types/order";
import { formatARS } from "../../../utils/currency";

export interface PosPaymentRow {
  key: string;
  method: PosPaymentMethod;
  amount: string;        // pesos (sin centavos), string cruda del input
  installments: string;  // "" salvo débito/crédito
}

export function emptyPaymentRow(): PosPaymentRow {
  return { key: Math.random().toString(36).slice(2), method: "efectivo", amount: "", installments: "" };
}

const INPUT =
  "w-full rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

const METHODS_WITH_INSTALLMENTS = new Set<PosPaymentMethod>(["debito", "credito"]);

export function PaymentSplitRows({
  rows,
  total,
  onChange,
}: {
  rows: PosPaymentRow[];
  total: number;
  onChange: (rows: PosPaymentRow[]) => void;
}) {
  function patch(key: string, patch: Partial<PosPaymentRow>) {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  const paidCents = rows.reduce((acc, r) => acc + (Math.round(Number(r.amount) * 100) || 0), 0);
  const remaining = total - paidCents;

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-2">
          <select
            value={row.method}
            onChange={(e) => {
              const method = e.target.value as PosPaymentMethod;
              patch(row.key, { method, installments: METHODS_WITH_INSTALLMENTS.has(method) ? row.installments : "" });
            }}
            className={`${INPUT} appearance-none cursor-pointer flex-1`}
          >
            {Object.entries(POS_PAYMENT_METHOD_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            inputMode="decimal"
            value={row.amount}
            onChange={(e) => patch(row.key, { amount: e.target.value })}
            placeholder="$"
            className={`${INPUT} w-28`}
          />
          {METHODS_WITH_INSTALLMENTS.has(row.method) && (
            <input
              inputMode="numeric"
              value={row.installments}
              onChange={(e) => patch(row.key, { installments: e.target.value.replace(/\D/g, "") })}
              placeholder="Cuotas"
              className={`${INPUT} w-20`}
            />
          )}
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
              className="text-[#ABABAB] hover:text-[#DC2626] transition-colors shrink-0"
              aria-label="Quitar medio de pago"
            >
              ×
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...rows, emptyPaymentRow()])}
        className="self-start text-xs font-medium text-[#1A2B1C] hover:underline"
      >
        + Agregar medio de pago
      </button>

      <div className={`flex items-center justify-between text-xs mt-1 ${remaining === 0 ? "text-[#3D6040]" : "text-[#A03030]"}`}>
        <span>{remaining === 0 ? "Los pagos cubren el total" : remaining > 0 ? "Falta cubrir" : "Supera el total"}</span>
        <span className="font-semibold">{formatARS(Math.abs(remaining))}</span>
      </div>
    </div>
  );
}
