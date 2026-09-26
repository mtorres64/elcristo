import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { contentService } from "../../services/content.service";
import type { Testimonial } from "../../types/content";
import { TestimonialCard } from "../testimonials/TestimonialCard";

const VISIBLE = 3;

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [offset, setOffset] = useState(0);
  const maxOffset = Math.max(0, testimonials.length - VISIBLE);

  useEffect(() => {
    contentService
      .getTestimonials()
      .then((d) => setTestimonials(d.items))
      .catch(() => setTestimonials([]));
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="bg-cream py-14">
      <div className="max-w-screen-xl mx-auto px-3 sm:px-6">
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
              {testimonials.map((t, i) => (
                <TestimonialCard key={t.id} testimonial={t} colorIndex={i} className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3" />
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

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
