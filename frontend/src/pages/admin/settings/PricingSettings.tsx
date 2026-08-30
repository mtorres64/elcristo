import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { storeSettingsService } from "../../../services/storeSettings.service";
import { suggestedPrice } from "../../../utils/pricing";

export function PricingSettings() {
  const [markup, setMarkup] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    storeSettingsService
      .get()
      .then((s) => setMarkup(String(s.default_markup_pct)))
      .catch(() => toast.error("No se pudo cargar la configuración"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    const value = Number(markup);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Ingresá un markup válido");
      return;
    }
    setSaving(true);
    try {
      const s = await storeSettingsService.update({ default_markup_pct: value });
      setMarkup(String(s.default_markup_pct));
      toast.success("Configuración guardada");
    } catch {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-[#8A8A8A]">Cargando…</p>;

  const preview = Number(markup) >= 0 ? suggestedPrice(600000, Number(markup)) : null;

  return (
    <div className="max-w-md">
      <div className="rounded-lg bg-white border border-[#E8E2D8] p-4">
        <label className="block">
          <span className="text-sm font-semibold text-[#1A1A1A]">Markup por defecto (%)</span>
          <p className="text-xs text-[#8A8A8A] mt-1 mb-2">
            Se usa para sugerir el precio de venta al registrar una compra:
            <br />
            <code>precio = costo × (1 + markup / 100)</code>. Un producto puede definir
            su propio markup objetivo para pisarlo.
          </p>
          <input
            inputMode="decimal"
            value={markup}
            onChange={(e) => setMarkup(e.target.value)}
            className="w-full rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors"
          />
        </label>
        {preview != null && (
          <p className="text-xs text-[#6B6B6B] mt-2">
            Ejemplo: costo $6.000 → precio sugerido{" "}
            <strong className="text-[#1A2B1C]">
              ${(preview / 100).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
            </strong>
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
