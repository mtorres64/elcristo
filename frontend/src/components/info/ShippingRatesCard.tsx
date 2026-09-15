import { useEffect, useState } from "react";
import { storeSettingsService } from "../../services/storeSettings.service";
import type { ShippingSettings } from "../../services/storeSettings.service";
import { formatARS } from "../../utils/currency";
import { useWhatsappBase, withWhatsappMessage } from "../../hooks/useWhatsappBase";
import { SocialIcon } from "../social/socialPlatforms";

/** Bloque estructurado que se muestra arriba del texto libre de la página
 * de Envíos: zonas a costo fijo, descuento por retiro, y para el resto de
 * las localidades un cartel con botón de WhatsApp — la web no puede
 * "prohibir" ver el catálogo al resto del país, pero sí dejar claro que el
 * envío a esas localidades se coordina a mano en vez de prometer un
 * cálculo automático que no existe. */
export function ShippingRatesCard() {
  const [data, setData] = useState<ShippingSettings | null>(null);
  const whatsappBase = useWhatsappBase(data?.whatsapp_number);

  useEffect(() => {
    let alive = true;
    storeSettingsService
      .getShipping()
      .then((d) => alive && setData(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!data) return null;

  const hasZones = data.zones.length > 0;
  const hasOtherNote = data.other_zones_note.trim().length > 0;
  if (!hasZones && !hasOtherNote && !data.pickup_discount_pct) return null;

  const waHref = whatsappBase
    ? withWhatsappMessage(whatsappBase, "Hola! Quiero consultar por el envío a mi localidad.")
    : null;

  return (
    <div className="flex flex-col gap-4">
      {hasZones && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.zones.map((zone) => (
            <div key={zone.id} className="border border-[#E8E2D8] rounded-lg p-4">
              <p className="text-sm font-semibold text-[#1A1A1A]">{zone.name}</p>
              <p className="text-sm text-[#3D6040] font-medium mt-1">{formatARS(zone.cost)}</p>
              {zone.free_from != null && (
                <p className="text-xs text-[#8A8A8A] mt-0.5">
                  Envío gratis en compras desde {formatARS(zone.free_from)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {data.pickup_discount_pct > 0 && (
        <div className="border border-[#E8E2D8] rounded-lg p-4 bg-[#F4F8F4]">
          <p className="text-sm text-[#1A1A1A]">
            <strong>Retirás por el local?</strong> Tenés un {data.pickup_discount_pct}% de descuento.
          </p>
        </div>
      )}

      {hasOtherNote && (
        <div className="border border-[#E8E2D8] rounded-lg p-4">
          <p className="text-sm text-[#4A4A4A] leading-relaxed">{data.other_zones_note}</p>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-xs font-semibold uppercase tracking-widest text-[#1A2B1C] hover:underline"
            >
              <SocialIcon platform="whatsapp" size={14} />
              Consultar por WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}
