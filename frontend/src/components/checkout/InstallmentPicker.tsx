import type { InstallmentPlan } from "../../types/order";
import { formatARS } from "../../utils/currency";

interface Props {
  plans: InstallmentPlan[];
  /** Centavos, total del pedido sin interés — lo que se muestra para "1 pago". */
  amount: number;
  /** null = 1 pago (sin cuotas). */
  value: InstallmentPlan | null;
  onChange: (plan: InstallmentPlan | null) => void;
}

const OPTION =
  "flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 cursor-pointer transition-colors";

/** Selector de cuotas — se muestra debajo de la tarjeta elegida en el paso de
 * pago, sólo cuando Getnet devolvió algún plan financiado (ver
 * `orderService.quoteInstallments` y el TODO en `getnet_client.get_installment_quotes`:
 * el contrato exacto de esta cotización todavía no está confirmado contra un
 * sandbox real). Si no hay planes financiados, no se renderiza nada y el
 * checkout sigue como pago único, igual que antes de esta feature. */
export function InstallmentPicker({ plans, amount, value, onChange }: Props) {
  const financed = plans.filter((p) => p.number_installments > 1);
  if (financed.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-[#4A4A4A] mb-2">Cuotas</p>
      <div className="flex flex-col gap-2">
        <label
          className={`${OPTION} ${value === null ? "border-[#1A2B1C] bg-[#F4F8F4]" : "border-[#E8E2D8] hover:border-[#C8D8C0]"}`}
        >
          <span className="flex items-center gap-2.5">
            <input
              type="radio"
              checked={value === null}
              onChange={() => onChange(null)}
              className="w-4 h-4 accent-[#1A2B1C] shrink-0"
            />
            <span className="text-sm text-[#1A1A1A]">1 pago</span>
          </span>
          <span className="text-sm font-medium text-[#1A1A1A]">{formatARS(amount)}</span>
        </label>

        {financed.map((plan) => (
          <label
            key={plan.quote_id}
            className={`${OPTION} ${value?.quote_id === plan.quote_id ? "border-[#1A2B1C] bg-[#F4F8F4]" : "border-[#E8E2D8] hover:border-[#C8D8C0]"}`}
          >
            <span className="flex items-center gap-2.5">
              <input
                type="radio"
                checked={value?.quote_id === plan.quote_id}
                onChange={() => onChange(plan)}
                className="w-4 h-4 accent-[#1A2B1C] shrink-0"
              />
              <span className="text-sm text-[#1A1A1A]">
                {plan.number_installments} cuotas de {formatARS(plan.installment_amount)}
              </span>
            </span>
            <span className="text-right shrink-0">
              <span className="block text-sm font-medium text-[#1A1A1A]">{formatARS(plan.total_amount)}</span>
              {plan.interest_amount > 0 && (
                <span className="block text-[11px] text-[#8A8A8A]">
                  Incluye {formatARS(plan.interest_amount)} de interés
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
