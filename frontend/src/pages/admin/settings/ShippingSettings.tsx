import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { storeSettingsService } from "../../../services/storeSettings.service";
import type { ShippingSettings as ShippingSettingsData, ShippingZone } from "../../../services/storeSettings.service";

// Vite empaqueta los íconos de Leaflet con hashes propios; sin este fix el
// pin por defecto queda roto (busca las imágenes en la ruta original).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// San Miguel de Tucumán — centro por defecto del mapa hasta que el
// vendedor marque la ubicación real del local.
const DEFAULT_CENTER: [number, number] = [-26.8241, -65.2226];

function emptyZone(): ShippingZone {
  return { id: crypto.randomUUID(), name: "", cost: 0, free_from: null, localities: [] };
}

function localitiesToText(localities: string[]): string {
  return localities.join(", ");
}

function textToLocalities(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Sugerencia inicial en base a lo que el vendedor charló con su cliente:
 * nada de esto se guarda hasta que apriete "Guardar cambios" — es sólo un
 * punto de partida editable para no arrancar de un formulario vacío. */
function suggestedDefaults(): Pick<ShippingSettingsData, "zones" | "other_zones_note" | "low_stock_note"> {
  return {
    zones: [
      {
        id: crypto.randomUUID(),
        name: "Yerba Buena y San Miguel de Tucumán",
        cost: 1_000_000, // $10.000
        free_from: 10_000_000, // gratis desde $100.000
        localities: ["Yerba Buena", "San Miguel de Tucumán"],
      },
    ],
    other_zones_note:
      "Para otras localidades del interior, escribinos por WhatsApp y coordinamos el envío con un transporte de confianza.",
    low_stock_note:
      "¿Necesitás una cantidad grande? Consultanos antes de comprar: no siempre tenemos el 100% del stock cargado en la web.",
  };
}

function pesosToCentavos(value: string): number {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

function centavosToPesos(value: number): string {
  return value ? String(value / 100) : "";
}

export function ShippingSettings() {
  const [data, setData] = useState<ShippingSettingsData | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    storeSettingsService
      .getShipping()
      .then((d) => {
        if (!alive) return;
        const isEmpty = d.zones.length === 0 && !d.other_zones_note && !d.low_stock_note;
        setData(isEmpty ? { ...d, ...suggestedDefaults() } : d);
        setPrefilled(isEmpty);
      })
      .catch(() => toast.error("No se pudo cargar la configuración de envíos"))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function patch(p: Partial<ShippingSettingsData>) {
    setData((prev) => (prev ? { ...prev, ...p } : prev));
  }

  function patchZone(index: number, p: Partial<ShippingZone>) {
    setData((prev) =>
      prev ? { ...prev, zones: prev.zones.map((z, i) => (i === index ? { ...z, ...p } : z)) } : prev
    );
  }

  function addZone() {
    setData((prev) => (prev ? { ...prev, zones: [...prev.zones, emptyZone()] } : prev));
  }

  function removeZone(index: number) {
    setData((prev) => (prev ? { ...prev, zones: prev.zones.filter((_, i) => i !== index) } : prev));
  }

  async function handleSave() {
    if (!data) return;
    const missingName = data.zones.find((z) => !z.name.trim());
    if (missingName) {
      toast.error("Completá el nombre de todas las zonas (o eliminá las vacías)");
      return;
    }
    setSaving(true);
    try {
      const saved = await storeSettingsService.updateShipping(data);
      setData(saved);
      setPrefilled(false);
      toast.success("Configuración de envíos guardada");
    } catch {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-lg p-12 text-center">
        <p className="font-serif text-lg text-[#8A8A8A]">Cargando…</p>
      </div>
    );
  }

  return (
    <>
      {/* Barra de acción mobile sticky — mismo patrón que el resto de las
          secciones de esta página. */}
      <div className="sm:hidden sticky top-0 z-10 -mx-4 -mt-6 mb-6 bg-white border-b border-[#E8E2D8] px-4 py-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <div className="flex flex-col gap-6 max-w-2xl">
        <div className="hidden sm:flex items-center justify-between bg-white border border-[#E8E2D8] rounded-lg px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Envíos</p>
            <p className="text-xs text-[#8A8A8A] mt-0.5">
              Ubicación del local, zonas de envío y los carteles del storefront
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>

        {prefilled && (
          <p className="text-xs text-[#8A6D3B] bg-[#FBF3E5] border border-[#EAD9B4] rounded-lg px-4 py-2.5">
            Prellenamos esta sección con lo que charlaste con tu cliente. Revisala y ajustala antes de guardar.
          </p>
        )}

        {/* Ubicación */}
        <Card
          title="Ubicación del local"
          hint="Tocá o arrastrá el pin para marcar dónde está el local. Se usa para mostrar el mapa en la página de contacto y como origen para calcular envíos."
        >
          <div className="rounded-lg overflow-hidden border border-[#E8E2D8] h-72">
            <MapContainer
              center={
                data.location.lat != null && data.location.lng != null
                  ? [data.location.lat, data.location.lng]
                  : DEFAULT_CENTER
              }
              zoom={data.location.lat != null ? 15 : 12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker
                position={data.location.lat != null && data.location.lng != null ? [data.location.lat, data.location.lng] : null}
                onChange={(lat, lng) => patch({ location: { ...data.location, lat, lng } })}
              />
            </MapContainer>
          </div>
          {data.location.lat != null && (
            <p className="text-[11px] text-[#8A8A8A] mt-1.5">
              {data.location.lat.toFixed(5)}, {data.location.lng!.toFixed(5)}
            </p>
          )}
          <label className="block mt-3">
            <span className="text-xs font-medium text-[#4A4A4A]">Dirección (se muestra tal cual la escribís)</span>
            <input
              value={data.location.address}
              onChange={(e) => patch({ location: { ...data.location, address: e.target.value } })}
              placeholder="Av. Aconquija 1200, San Miguel de Tucumán, Tucumán"
              className={`${INPUT} w-full mt-1`}
            />
          </label>
        </Card>

        {/* Zonas de envío */}
        <Card
          title="Zonas con envío a costo fijo"
          hint='Agrupá localidades que cobrás igual (ej: Yerba Buena y San Miguel). Fuera de estas zonas se muestra el cartel de "otras localidades" de abajo.'
        >
          <div className="flex flex-col gap-3">
            {data.zones.map((zone, i) => (
              <div key={zone.id} className="border border-[#E8E2D8] rounded-lg p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    value={zone.name}
                    onChange={(e) => patchZone(i, { name: e.target.value })}
                    placeholder="Ej: Yerba Buena y San Miguel de Tucumán"
                    className={`${INPUT} flex-1 min-w-0`}
                  />
                  <IconButton title="Eliminar zona" danger onClick={() => removeZone(i)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </IconButton>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-[#4A4A4A]">
                    Costo
                    <PrefixInput
                      value={centavosToPesos(zone.cost)}
                      onChange={(v) => patchZone(i, { cost: pesosToCentavos(v) })}
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[#4A4A4A]">
                    <input
                      type="checkbox"
                      checked={zone.free_from != null}
                      onChange={(e) => patchZone(i, { free_from: e.target.checked ? zone.cost || 1 : null })}
                      className="w-3.5 h-3.5 accent-[#1A2B1C]"
                    />
                    Gratis a partir de
                    {zone.free_from != null && (
                      <PrefixInput
                        value={centavosToPesos(zone.free_from)}
                        onChange={(v) => patchZone(i, { free_from: pesosToCentavos(v) })}
                      />
                    )}
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-[#4A4A4A]">Localidades que incluye</span>
                  <input
                    value={localitiesToText(zone.localities)}
                    onChange={(e) => patchZone(i, { localities: textToLocalities(e.target.value) })}
                    placeholder="Ej: San Miguel de Tucumán, Yerba Buena, Tafí Viejo"
                    className={`${INPUT} w-full mt-1`}
                  />
                  <span className="text-[11px] text-[#8A8A8A] mt-1 block">
                    Separadas por coma, sólo localidades (no hace falta poner barrios) — usá los mismos nombres
                    que va a ver el cliente en el combo de Localidad del checkout. Se usan para sugerir esta
                    zona sola; no afectan el costo.
                  </span>
                </label>
              </div>
            ))}
            {data.zones.length === 0 && (
              <p className="text-sm text-[#6B6B6B] py-4 text-center">Todavía no agregaste ninguna zona.</p>
            )}
          </div>
          <button
            onClick={addZone}
            className="mt-3 px-4 py-2 border border-[#C8C0B4] rounded-lg text-sm text-[#1A2B1C] font-medium bg-white hover:bg-[#F5F5F3] transition-colors"
          >
            + Agregar zona
          </button>
        </Card>

        {/* Retiro en el local */}
        <Card title="Retiro en el local" hint="Descuento que se aplica cuando el cliente retira en vez de pedir envío.">
          <label className="flex items-center gap-2">
            <PrefixInput
              prefix=""
              suffix="%"
              value={String(data.pickup_discount_pct)}
              onChange={(v) => patch({ pickup_discount_pct: Number(v.replace(",", ".")) || 0 })}
            />
            <span className="text-sm text-[#4A4A4A]">de descuento</span>
          </label>
        </Card>

        {/* Otras localidades */}
        <Card
          title="Otras localidades"
          hint="Se muestra cuando la localidad del cliente no está en ninguna zona de arriba, junto a un botón de WhatsApp (usa el número cargado en Redes sociales)."
        >
          <textarea
            value={data.other_zones_note}
            onChange={(e) => patch({ other_zones_note: e.target.value })}
            rows={3}
            placeholder="Ej: Para otras localidades del interior, escribinos por WhatsApp y coordinamos el envío."
            className={`${INPUT} w-full resize-none`}
          />
        </Card>

        {/* Aviso de stock */}
        <Card
          title="Aviso de stock por mayor"
          hint="Se muestra en la ficha de producto y en el carrito. Dejalo vacío para no mostrar nada."
        >
          <textarea
            value={data.low_stock_note}
            onChange={(e) => patch({ low_stock_note: e.target.value })}
            rows={2}
            placeholder="Ej: ¿Necesitás una cantidad grande? Consultanos antes de comprar."
            className={`${INPUT} w-full resize-none`}
          />
        </Card>
      </div>
    </>
  );
}

/** Click para poner el pin, arrastre para reubicarlo. */
function LocationPicker({
  position,
  onChange,
}: {
  position: [number, number] | null;
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  if (!position) return null;
  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target as L.Marker;
          const { lat, lng } = marker.getLatLng();
          onChange(lat, lng);
        },
      }}
    />
  );
}

/* ─── Shared helpers ─────────────────────────────────────────── */

const INPUT =
  "border border-[#E8E2D8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E8E2D8] rounded-lg p-5">
      <p className="text-sm font-semibold text-[#1A1A1A]">{title}</p>
      {hint && <p className="text-xs text-[#8A8A8A] mt-1 mb-3">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

function PrefixInput({
  prefix = "$",
  suffix,
  value,
  onChange,
}: {
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex border border-[#E8E2D8] rounded-lg overflow-hidden focus-within:border-[#1A2B1C] transition-colors">
      {prefix && (
        <span className="px-2.5 py-1.5 text-xs text-[#8A8A8A] bg-[#F9F8F5] border-r border-[#E8E2D8] shrink-0">
          {prefix}
        </span>
      )}
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 min-w-0 px-2.5 py-1.5 text-sm text-[#1A1A1A] bg-white outline-none"
      />
      {suffix && (
        <span className="px-2.5 py-1.5 text-xs text-[#8A8A8A] bg-[#F9F8F5] border-l border-[#E8E2D8] shrink-0">
          {suffix}
        </span>
      )}
    </div>
  );
}

function IconButton({
  title,
  danger,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-lg border border-transparent transition-colors shrink-0 ${
        danger
          ? "text-[#8A8A8A] hover:text-[#DC2626] hover:bg-[#FEF2F2]"
          : "text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F5F3]"
      }`}
    >
      {children}
    </button>
  );
}
