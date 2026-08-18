import { useState } from "react";
import toast from "react-hot-toast";
import type { PaymentCardInput } from "../../types/payment";

const INPUT =
  "w-full rounded-lg border border-[#E8E2D8] px-3.5 py-2.5 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

const LABEL = "block text-xs font-medium text-[#4A4A4A] mb-1.5";

interface Props {
  onCancel: () => void;
  onSave: (card: PaymentCardInput, save: boolean) => Promise<void>;
}

function luhnValid(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return digits.length >= 12 && sum % 10 === 0;
}

export function PaymentMethodForm({ onCancel, onSave }: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = cardNumber.replace(/\s|-/g, "");
    const [monthStr, yearStr] = expiry.split("/").map((s) => s.trim());
    const month = parseInt(monthStr, 10);
    const year = yearStr ? 2000 + parseInt(yearStr, 10) : NaN;

    if (!luhnValid(digits)) {
      toast.error("Número de tarjeta inválido");
      return;
    }
    if (!holderName.trim()) {
      toast.error("Ingresá el nombre del titular");
      return;
    }
    if (!month || month < 1 || month > 12 || !year) {
      toast.error("Vencimiento inválido (MM/AA)");
      return;
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      toast.error("Código de seguridad inválido");
      return;
    }

    setSaving(true);
    try {
      // El CVV nunca viaja al backend ni se persiste — no hay pasarela de pago
      // real conectada todavía, sólo se validan datos localmente.
      await onSave(
        { card_number: digits, holder_name: holderName.trim(), exp_month: month, exp_year: year },
        saveCard
      );
    } catch {
      toast.error("No se pudo procesar la tarjeta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-xs text-[#8A8A8A] bg-[#F9F8F5] border border-[#E8E2D8] rounded-lg px-3.5 py-2.5">
        Todavía no hay una pasarela de pago conectada: esta tarjeta no se cobra
        ahora, el pedido queda pendiente de pago para que lo confirmes por otro
        medio.
      </p>

      <div>
        <label className={LABEL}>Número de tarjeta</label>
        <input
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="4111 1111 1111 1111"
          inputMode="numeric"
          className={INPUT}
          required
        />
      </div>

      <div>
        <label className={LABEL}>Nombre del titular</label>
        <input
          value={holderName}
          onChange={(e) => setHolderName(e.target.value.toUpperCase())}
          placeholder="Como figura en la tarjeta"
          className={INPUT}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Vencimiento</label>
          <input
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            placeholder="MM/AA"
            className={INPUT}
            required
          />
        </div>
        <div>
          <label className={LABEL}>Código de seguridad</label>
          <input
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
            placeholder="CVV"
            inputMode="numeric"
            maxLength={4}
            className={INPUT}
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-[#1A1A1A] cursor-pointer">
        <input
          type="checkbox"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          className="w-4 h-4 rounded border-[#C8C4BE] accent-[#1A2B1C] cursor-pointer"
        />
        Guardar esta tarjeta para próximas compras
      </label>

      <div className="flex items-center justify-end gap-3 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#1A2B1C] text-white text-sm font-semibold px-6 py-2.5 hover:bg-[#253824] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Usar esta tarjeta"}
        </button>
      </div>
    </form>
  );
}
