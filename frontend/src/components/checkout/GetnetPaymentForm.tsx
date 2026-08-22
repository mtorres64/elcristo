import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { PaymentCardInput } from "../../types/payment";
import { formatCardNumber, luhnValid } from "../../utils/card";

const INPUT =
  "w-full rounded-lg border border-[#E8E2D8] px-3.5 py-2.5 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

const LABEL = "block text-xs font-medium text-[#4A4A4A] mb-1.5";

interface Props {
  onCancel: () => void;
  onSave: (card: Required<Pick<PaymentCardInput, "security_code">> & PaymentCardInput) => Promise<void>;
}

/** Tarjeta de pago cuando la tienda cobra con Getnet.
 *
 * A diferencia de PaymentMethodForm (mock), acá el número de tarjeta y el
 * CVV sí viajan — al backend, no a ningún tercero: Getnet no ofrece
 * tokenización client-side en esta API, así que el backend recibe la
 * tarjeta transitoriamente, la tokeniza y cobra server-to-server contra
 * Getnet, y no la persiste en ningún lado (ver `_charge_with_getnet` en
 * `orders.py`). No hay opción de "guardar tarjeta": cada cobro con Getnet
 * es con una tarjeta nueva en el momento.
 */
export function GetnetPaymentForm({ onCancel, onSave }: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [saving, setSaving] = useState(false);

  const cardInputRef = useRef<HTMLInputElement>(null);
  const cardCaretDigitsRef = useRef<number | null>(null);

  function handleCardNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const cursorPos = input.selectionStart ?? input.value.length;
    cardCaretDigitsRef.current = input.value.slice(0, cursorPos).replace(/\D/g, "").length;
    const digits = input.value.replace(/\D/g, "").slice(0, 19);
    setCardNumber(formatCardNumber(digits));
  }

  useEffect(() => {
    const target = cardCaretDigitsRef.current;
    if (target === null || !cardInputRef.current) return;
    let seen = 0;
    let pos = cardNumber.length;
    if (target === 0) {
      pos = 0;
    } else {
      for (let i = 0; i < cardNumber.length; i++) {
        if (/\d/.test(cardNumber[i])) seen++;
        if (seen === target) {
          pos = i + 1;
          break;
        }
      }
    }
    cardInputRef.current.setSelectionRange(pos, pos);
    cardCaretDigitsRef.current = null;
  }, [cardNumber]);

  function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const prevDigits = expiry.replace(/\D/g, "");
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) {
      setExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else if (digits.length === 2 && digits.length > prevDigits.length) {
      setExpiry(`${digits}/`);
    } else {
      setExpiry(digits);
    }
  }

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
      await onSave({
        card_number: digits,
        holder_name: holderName.trim(),
        exp_month: month,
        exp_year: year,
        security_code: cvv,
      });
    } catch {
      toast.error("No se pudo procesar la tarjeta. Verificá los datos e intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-xs text-[#8A8A8A] bg-[#F9F8F5] border border-[#E8E2D8] rounded-lg px-3.5 py-2.5">
        Pago seguro procesado por Getnet. Tu tarjeta se cobra al confirmar el pedido.
      </p>

      <div>
        <label className={LABEL}>Número de tarjeta</label>
        <input
          ref={cardInputRef}
          value={cardNumber}
          onChange={handleCardNumberChange}
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
            onChange={handleExpiryChange}
            placeholder="MM/AA"
            inputMode="numeric"
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
          {saving ? "Procesando..." : "Usar esta tarjeta"}
        </button>
      </div>
    </form>
  );
}
