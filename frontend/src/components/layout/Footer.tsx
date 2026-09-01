import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { contentService } from "../../services/content.service";
import { SOCIAL_PLATFORMS, SocialIcon } from "../social/socialPlatforms";
import type { SocialLink as SocialLinkItem } from "../../types/content";

export function Footer() {
  const [social, setSocial] = useState<SocialLinkItem[]>([]);

  useEffect(() => {
    contentService
      .getSocial()
      .then((d) => setSocial(d.links.filter((l) => l.url)))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-[#111810] text-[#A8B5A9]">
      {/* Main footer */}
      <div className="max-w-screen-xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand col */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <img src="/images/logo_blanco.png" alt="Vivero El Cristo" style={{ width: "2.5rem" }} />
            <div className="leading-none">
              <div className="text-[9px] tracking-widest uppercase text-[#6B7A6C] font-medium">Vivero</div>
              <div className="text-sm tracking-widest uppercase text-white font-bold">El Cristo</div>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-[#6B7A6C]">
            Diseñamos espacios únicos con plantas seleccionadas y asesoramiento personalizado.
          </p>
          {social.length > 0 && (
            <div className="flex items-center gap-3 mt-1">
              {social.map((link) => (
                <SocialLink
                  key={link.id}
                  href={link.url}
                  label={SOCIAL_PLATFORMS[link.platform]?.label ?? link.platform}
                >
                  <SocialIcon platform={link.platform} />
                </SocialLink>
              ))}
            </div>
          )}
        </div>

        {/* Tienda */}
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-white font-semibold mb-5">Tienda</h4>
          <ul className="flex flex-col gap-3">
            {[
              { label: "Plantas de Interior", to: "/products?category=plantas-interior" },
              { label: "Plantas de Exterior", to: "/products?category=plantas-exterior" },
              { label: "Árboles y Arbustos", to: "/products?category=arboles-arbustos" },
              { label: "Suculentas y Cactus", to: "/products?category=suculentas-cactus" },
              { label: "Macetas y Accesorios", to: "/products?category=macetas-accesorios" },
              { label: "Ofertas", to: "/products?on_sale=true" },
            ].map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-xs text-[#7A8A7B] hover:text-[#A8B5A9] transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Información */}
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-white font-semibold mb-5">Información</h4>
          <ul className="flex flex-col gap-3">
            {[
              { label: "Envíos", to: "/envios" },
              { label: "Medios de pago", to: "/medios-de-pago" },
              { label: "Cambios y devoluciones", to: "/cambios-y-devoluciones" },
              { label: "Preguntas frecuentes", to: "/preguntas-frecuentes" },
              { label: "Términos y condiciones", to: "/terminos-y-condiciones" },
            ].map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-xs text-[#7A8A7B] hover:text-[#A8B5A9] transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Nosotros */}
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-white font-semibold mb-5">Nosotros</h4>
          <ul className="flex flex-col gap-3">
            {[
              { label: "Sobre Nosotros", to: "/nosotros" },
              { label: "Nuestro equipo", to: "#" },
              { label: "Proyectos", to: "/inspiracion" },
              { label: "Blog", to: "#" },
              { label: "Contacto", to: "/contacto" },
            ].map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="text-xs text-[#7A8A7B] hover:text-[#A8B5A9] transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-white font-semibold mb-5">¿Necesitás Ayuda?</h4>
          <ul className="flex flex-col gap-4">
            <li className="flex items-start gap-2.5">
              <span className="text-[#5A7A5C] mt-0.5 shrink-0"><WhatsAppIcon /></span>
              <span className="text-xs text-[#7A8A7B]">Escribinos por WhatsApp<br /><span className="text-[#A8B5A9]">+54 381 2345 6789</span></span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#5A7A5C] mt-0.5 shrink-0"><MailIcon /></span>
              <span className="text-xs text-[#7A8A7B]">viveroelcristo@gmail.com</span>
            </li>
            <li className="text-xs text-[#7A8A7B] mt-1">Lun a Vie de 9 a 18 h</li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#1E2E1F] py-5">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-[#4A5A4B]">© 2024 Vivero El Cristo. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            {["Privacidad", "Cookies", "Legales"].map((item) => (
              <Link key={item} to="#" className="text-[10px] text-[#4A5A4B] hover:text-[#7A8A7B] transition-colors">{item}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="w-8 h-8 rounded-full border border-[#2A3A2B] flex items-center justify-center text-[#5A7A5C] hover:border-[#5A7A5C] hover:text-[#A8B5A9] transition-colors"
    >
      {children}
    </a>
  );
}

function WhatsAppIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>;
}
function MailIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
}
