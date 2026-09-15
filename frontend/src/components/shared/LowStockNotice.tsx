import { useWhatsappBase, withWhatsappMessage } from "../../hooks/useWhatsappBase";

/** Cartel de "consultá antes de comprar cantidades grandes" — se muestra en
 * la ficha de producto y en el carrito, con el mismo link de WhatsApp que
 * usa el resto de los CTAs de envío (Configuración > Envíos, o el de Redes
 * sociales si no hay uno propio cargado). */
export function LowStockNotice({
  note,
  whatsappNumber,
  className = "",
}: {
  note: string;
  whatsappNumber?: string;
  className?: string;
}) {
  const whatsappBase = useWhatsappBase(whatsappNumber);
  const waHref = whatsappBase
    ? withWhatsappMessage(whatsappBase, "Hola! Quiero consultar disponibilidad de stock.")
    : null;

  if (!note) return null;

  return (
    <p
      className={`text-xs text-[#6B6B6B] bg-[#F9F8F5] border border-[#E8E2D8] rounded-lg px-3.5 py-2.5 leading-relaxed ${className}`}
    >
      {note}
      {waHref && (
        <>
          {" "}
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#1A2B1C] underline hover:no-underline"
          >
            Consultar por WhatsApp
          </a>
        </>
      )}
    </p>
  );
}
