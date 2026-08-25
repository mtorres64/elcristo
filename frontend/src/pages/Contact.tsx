import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout/Layout";

const ADDRESS = "Av. Aconquija 1200, San Miguel de Tucumán, Tucumán";
const MAPS_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`;
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // No hay backend de mensajes todavía (mismo caso que el newsletter del
    // home): confirmamos en el momento y sugerimos WhatsApp/email para una
    // respuesta más rápida mientras tanto.
    setSubmitted(true);
    setForm({ name: "", email: "", phone: "", message: "" });
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-cream border-b border-[#E8E2D8]">
        <div className="max-w-screen-xl mx-auto px-6 py-3">
          <nav className="flex items-center gap-2 text-xs text-[#8A8A8A]">
            <Link to="/" className="hover:text-[#3D6040] transition-colors">
              Inicio
            </Link>
            <ChevronRight />
            <span className="text-[#1A1A1A] font-medium">Contacto</span>
          </nav>
        </div>
      </div>

      <section className="bg-cream py-14 md:py-20">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="section-label mb-3">Contacto</p>
            <h1 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] font-normal mb-4">
              Hablemos de tu próximo espacio verde
            </h1>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              Escribinos por el formulario, por WhatsApp o pasá directamente por el vivero —
              te contestamos a la brevedad.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Formulario */}
            <div>
              {submitted ? (
                <div className="bg-white border border-[#E8E2D8] rounded-lg p-8 text-center">
                  <p className="text-[#3D6040] font-serif text-xl mb-2">¡Gracias por escribirnos!</p>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed mb-5">
                    Recibimos tu mensaje y te vamos a responder a la brevedad. Si preferís una
                    respuesta más rápida, también podés escribirnos por WhatsApp.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs uppercase tracking-widest font-semibold text-[#1A2B1C] hover:underline"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nombre">
                      <input
                        required
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Tu nombre"
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Teléfono (opcional)">
                      <input
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="Tu teléfono"
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <Field label="Email">
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="tu@email.com"
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Mensaje">
                    <textarea
                      required
                      value={form.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      placeholder="Contanos en qué podemos ayudarte..."
                      className={`${INPUT} min-h-[140px] resize-y`}
                    />
                  </Field>
                  <button type="submit" className="btn-primary mt-2 self-start">
                    Enviar mensaje
                  </button>
                </form>
              )}
            </div>

            {/* Ubicación y datos de contacto */}
            <div className="flex flex-col gap-6">
              <div className="rounded-lg overflow-hidden border border-[#E8E2D8]">
                <iframe
                  title="Ubicación de Vivero El Cristo"
                  src={MAPS_EMBED_SRC}
                  className="w-full h-[280px] sm:h-[320px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="bg-white border border-[#E8E2D8] rounded-lg p-6 flex flex-col gap-5">
                <InfoRow icon={<PinIcon />}>
                  <span className="text-sm text-[#1A1A1A]">{ADDRESS}</span>
                  <a
                    href={MAPS_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#3D6040] hover:underline mt-0.5 inline-block"
                  >
                    Cómo llegar
                  </a>
                </InfoRow>
                <InfoRow icon={<WhatsAppIcon />}>
                  <span className="text-sm text-[#1A1A1A]">Escribinos por WhatsApp</span>
                  <a
                    href="https://wa.me/5438123456789"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#3D6040] hover:underline mt-0.5 inline-block"
                  >
                    +54 381 2345 6789
                  </a>
                </InfoRow>
                <InfoRow icon={<MailIcon />}>
                  <a href="mailto:viveroelcristo@gmail.com" className="text-sm text-[#1A1A1A] hover:text-[#3D6040]">
                    viveroelcristo@gmail.com
                  </a>
                </InfoRow>
                <InfoRow icon={<ClockIcon />}>
                  <span className="text-sm text-[#1A1A1A]">Lun a Vie de 9 a 18 h</span>
                </InfoRow>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

const INPUT =
  "w-full border border-[#E8E2D8] rounded-lg px-3.5 py-2.5 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[#6B6B6B]">{label}</span>
      {children}
    </label>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[#5A7A5C] mt-0.5 shrink-0">{icon}</span>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
