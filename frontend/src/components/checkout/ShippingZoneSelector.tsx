import type { ShippingZone } from "../../services/storeSettings.service";
import { formatARS } from "../../utils/currency";
import { useWhatsappBase, withWhatsappMessage } from "../../hooks/useWhatsappBase";
import { SocialIcon } from "../social/socialPlatforms";

export type ShippingChoice = string | null; // id de zona, "pickup", "other" o null (sin elegir)

/** Selector de zona de envío en el checkout: como la dirección es texto
 * libre ("Santillán" no dice si eso cae en una zona configurada), el costo
 * no se infiere de la dirección — el cliente elige de forma explícita entre
 * las zonas a costo fijo, retirar en el local, u "otra localidad" (que no
 * tiene costo calculable y deriva a WhatsApp en vez de dejar avanzar). */
export function ShippingZoneSelector({
  zones,
  pickupDiscountPct,
  otherNote,
  whatsappNumber,
  subtotal,
  value,
  onChange,
  suggestedZoneId,
}: {
  zones: ShippingZone[];
  pickupDiscountPct: number;
  otherNote: string;
  /** Número de Configuración > Envíos; si no hay, cae al de Redes sociales. */
  whatsappNumber?: string;
  subtotal: number;
  value: ShippingChoice;
  onChange: (value: ShippingChoice) => void;
  /** Zona sugerida a partir de la dirección del cliente (ver
   * matchZoneByLocality en Cart.tsx) — sólo cambia el rótulo de esa opción,
   * la selección real sigue siendo la que ya viene en `value`. */
  suggestedZoneId?: string | null;
}) {
  const whatsappBase = useWhatsappBase(whatsappNumber);
  const waHref = whatsappBase
    ? withWhatsappMessage(whatsappBase, "Hola! Quiero coordinar el envío a mi localidad.")
    : null;

  return (
    <div className="flex flex-col gap-3">
      {zones.map((zone) => {
        const free = zone.free_from != null && subtotal >= zone.free_from;
        return (
          <Option key={zone.id} selected={value === zone.id} onSelect={() => onChange(zone.id)}>
            <p className="text-sm font-semibold text-[#1A1A1A]">
              {zone.name}
              {suggestedZoneId === zone.id && (
                <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[#3D6040] bg-[#E8F0E8] px-2 py-0.5 rounded-full align-middle">
                  Según tu dirección
                </span>
              )}
            </p>
            <p className="text-xs mt-0.5">
              {free ? (
                <span className="text-[#3D6040] font-medium">Envío gratis</span>
              ) : (
                <span className="text-[#4A4A4A]">{formatARS(zone.cost)}</span>
              )}
              {!free && zone.free_from != null && (
                <span className="text-[#8A8A8A]"> · gratis desde {formatARS(zone.free_from)}</span>
              )}
            </p>
          </Option>
        );
      })}

      {pickupDiscountPct > 0 && (
        <Option selected={value === "pickup"} onSelect={() => onChange("pickup")}>
          <p className="text-sm font-semibold text-[#1A1A1A]">Retirar por el local</p>
          <p className="text-xs text-[#3D6040] font-medium mt-0.5">{pickupDiscountPct}% de descuento</p>
        </Option>
      )}

      <Option selected={value === "other"} onSelect={() => onChange("other")}>
        <p className="text-sm font-semibold text-[#1A1A1A]">
          Mi localidad no está en la lista
          {suggestedZoneId === "other" && (
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[#3D6040] bg-[#E8F0E8] px-2 py-0.5 rounded-full align-middle">
              Según tu dirección
            </span>
          )}
        </p>
        {otherNote && <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">{otherNote}</p>}
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              onChange("other");
            }}
            className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold uppercase tracking-widest text-[#1A2B1C] hover:underline"
          >
            <SocialIcon platform="whatsapp" size={13} />
            Consultar por WhatsApp
          </a>
        )}
      </Option>

      {value === "other" && (
        <p className="text-xs text-[#8A6D3B] bg-[#FBF3E5] border border-[#EAD9B4] rounded-lg px-3.5 py-2.5">
          Coordiná el envío por WhatsApp antes de continuar — todavía no podemos calcular ese costo solos.
          {waHref && (
            <>
              {" "}
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline hover:no-underline align-middle"
              >
                <SocialIcon platform="whatsapp" size={12} />
                Abrir WhatsApp
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function Option({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
        selected ? "border-[#1A2B1C] bg-[#F4F8F4]" : "border-[#E8E2D8] hover:border-[#C8C0B4] bg-white"
      }`}
    >
      <input
        type="radio"
        checked={selected}
        onChange={onSelect}
        className="mt-1 w-4 h-4 accent-[#1A2B1C] cursor-pointer shrink-0"
      />
      <div className="flex-1 min-w-0">{children}</div>
    </label>
  );
}
