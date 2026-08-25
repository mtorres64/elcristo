import { Link } from "react-router-dom";
import { Layout } from "../layout/Layout";

export interface InfoSection {
  title: string;
  text: string;
}

/** Plantilla para páginas de solo texto (Envíos, Medios de pago, Cambios y
 * devoluciones, Preguntas frecuentes, Términos y condiciones): breadcrumb +
 * título, y una lista de secciones cortas con un título chico y un párrafo
 * cada una. Sin fotos ni contenido editable desde el admin — es texto fijo. */
export function InfoPage({ title, sections }: { title: string; sections: InfoSection[] }) {
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
            <span className="text-[#1A1A1A] font-medium">{title}</span>
          </nav>
        </div>
      </div>

      <section className="bg-cream py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] font-normal mb-10 md:mb-12">
            {title}
          </h1>
          <div className="flex flex-col gap-8 md:gap-10">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="font-serif text-lg md:text-xl text-[#1A1A1A] font-semibold mb-2">
                  {s.title}
                </h2>
                <p className="text-sm text-[#6B6B6B] leading-relaxed whitespace-pre-line">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
