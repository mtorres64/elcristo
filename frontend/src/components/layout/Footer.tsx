import { Link } from "react-router-dom";

export function Footer() {
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
          <div className="flex items-center gap-3 mt-1">
            <SocialLink href="#" label="Instagram"><InstagramIcon /></SocialLink>
            <SocialLink href="#" label="Facebook"><FacebookIcon /></SocialLink>
            <SocialLink href="#" label="Pinterest"><PinterestIcon /></SocialLink>
          </div>
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
    <a href={href} aria-label={label} className="w-8 h-8 rounded-full border border-[#2A3A2B] flex items-center justify-center text-[#5A7A5C] hover:border-[#5A7A5C] hover:text-[#A8B5A9] transition-colors">
      {children}
    </a>
  );
}

function InstagramIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
}
function FacebookIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>;
}
function PinterestIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.19-.77 1.27-5.38 1.27-5.38s-.32-.65-.32-1.61c0-1.51.88-2.64 1.97-2.64.93 0 1.38.7 1.38 1.54 0 .94-.6 2.34-.91 3.64-.26 1.09.54 1.97 1.6 1.97 1.92 0 3.4-2.02 3.4-4.94 0-2.58-1.86-4.39-4.51-4.39-3.07 0-4.87 2.3-4.87 4.68 0 .93.36 1.92.8 2.46.09.11.1.2.07.31-.08.33-.26 1.09-.3 1.24-.05.2-.17.24-.38.14-1.39-.65-2.26-2.69-2.26-4.33 0-3.51 2.55-6.74 7.36-6.74 3.86 0 6.86 2.75 6.86 6.42 0 3.83-2.41 6.91-5.76 6.91-1.12 0-2.18-.58-2.54-1.27l-.69 2.58c-.25.96-.93 2.17-1.38 2.9.04.01.07.03.11.04" /></svg>;
}
function WhatsAppIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>;
}
function MailIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
}
