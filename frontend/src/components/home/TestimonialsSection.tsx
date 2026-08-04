import { useState } from "react";
import { Link } from "react-router-dom";

const TESTIMONIALS = [
  {
    id: 1,
    text: "Excelente asesoramiento y plantas de primera calidad. Mi jardín quedó increíble.",
    name: "María Belén R.",
    location: "Córdoba",
    initials: "MB",
    color: "bg-[#8AAB80]",
  },
  {
    id: 2,
    text: "Cumplieron en todo: el diseño, las plantas y el mantenimiento. Super recomendables.",
    name: "Diego L.",
    location: "Rosario, Santa Fe",
    initials: "DL",
    color: "bg-[#7A9B90]",
  },
  {
    id: 3,
    text: "Me ayudaron a diseñar mi patio soñado. 100% profesionales y dedicados.",
    name: "Agustina M.",
    location: "Buenos Aires",
    initials: "AM",
    color: "bg-[#9A8BAA]",
  },
  {
    id: 4,
    text: "Servicio impecable. Las plantas llegaron en perfectas condiciones y el diseño superó mis expectativas.",
    name: "Carlos V.",
    location: "Mendoza",
    initials: "CV",
    color: "bg-[#AA9B7A]",
  },
];

const VISIBLE = 3;

export function TestimonialsSection() {
  const [offset, setOffset] = useState(0);
  const maxOffset = Math.max(0, TESTIMONIALS.length - VISIBLE);

  return (
    <section className="bg-cream py-14">
      <div className="max-w-screen-xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Lo que Dicen Nuestros Clientes</h2>
          <Link to="/testimonios" className="link-arrow">
            Ver Todos los Testimonios
            <ArrowRight />
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative">
          <button
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#DDD6CC] shadow-sm flex items-center justify-center text-[#1A2B1C] hover:border-[#1A2B1C] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            aria-label="Anterior"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>

          <div className="overflow-hidden">
            <div
              className="flex gap-4 transition-transform duration-400 ease-out"
              style={{ transform: `translateX(-${offset * (100 / VISIBLE)}%)` }}
            >
              {TESTIMONIALS.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
          </div>

          <button
            onClick={() => setOffset((o) => Math.min(maxOffset, o + 1))}
            disabled={offset >= maxOffset}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#DDD6CC] shadow-sm flex items-center justify-center text-[#1A2B1C] hover:border-[#1A2B1C] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            aria-label="Siguiente"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: typeof TESTIMONIALS[0] }) {
  return (
    <div className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 bg-white p-7 rounded-[8px]">
      {/* Big quote mark */}
      <div className="font-serif text-6xl leading-none text-[#E8E0D4] mb-3 select-none">"</div>

      {/* Review text */}
      <p className="text-sm text-[#4A4A4A] leading-relaxed mb-6">
        {testimonial.text}
      </p>

      {/* Divider */}
      <div className="border-t border-[#EAE4DB] mb-5" />

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full ${testimonial.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {testimonial.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A] leading-tight">{testimonial.name}</p>
          <p className="text-[11px] text-[#8A8A8A] mt-0.5">{testimonial.location}</p>
        </div>
      </div>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
