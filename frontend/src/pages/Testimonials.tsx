import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { TestimonialCard } from "../components/testimonials/TestimonialCard";
import { contentService } from "../services/content.service";
import type { Testimonial } from "../types/content";

export function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentService
      .getTestimonials()
      .then((d) => setItems(d.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-cream border-b border-[#E8E2D8]">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-xs text-[#8A8A8A]">
            <Link to="/" className="hover:text-[#3D6040] transition-colors">
              Inicio
            </Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span className="text-[#1A1A1A] font-medium">Testimonios</span>
          </nav>
        </div>
      </div>

      <section className="bg-cream py-14 md:py-20 min-h-[50vh]">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-6">
          <h1 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] font-normal mb-10 md:mb-12">
            Lo que Dicen Nuestros Clientes
          </h1>

          {!loading && items.length === 0 && (
            <p className="text-sm text-[#6B6B6B]">Todavía no hay testimonios.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((t, i) => (
              <TestimonialCard key={t.id} testimonial={t} colorIndex={i} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
