import { useEffect, useState } from "react";
import { contentService } from "../services/content.service";

/** Resuelve la URL base de WhatsApp (sin el mensaje precargado) para los
 * CTAs de envío: prioriza el número cargado en Configuración > Envíos; si
 * no hay, cae al link de WhatsApp de Redes sociales — así no se rompe para
 * quien ya tenía ese link cargado antes de que existiera este campo. */
export function useWhatsappBase(shippingNumber: string | undefined): string | null {
  const [socialUrl, setSocialUrl] = useState<string | null>(null);

  useEffect(() => {
    if (shippingNumber) return; // no hace falta pedir Redes sociales
    let alive = true;
    contentService
      .getSocial()
      .then((s) => {
        const link = s.links.find((l) => l.platform === "whatsapp");
        if (alive && link) setSocialUrl(link.url);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [shippingNumber]);

  if (shippingNumber) return `https://wa.me/${shippingNumber.replace(/\D/g, "")}`;
  return socialUrl;
}

/** Arma el link final agregando el mensaje precargado (encoded). */
export function withWhatsappMessage(base: string, message: string): string {
  return `${base}${base.includes("?") ? "&" : "?"}text=${encodeURIComponent(message)}`;
}
