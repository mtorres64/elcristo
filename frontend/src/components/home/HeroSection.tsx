import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const SLIDES = [
  { src: "/images/entrada.png", alt: "Entrada jardín" },
  { src: "/images/hero2.png",   alt: "Plantas de interior" },
  { src: "/images/hero3.png",   alt: "Diseño de jardines" },
  { src: "/images/hero4.png",   alt: "Paisajismo" },
  { src: "/images/hero5.png",   alt: "Vivero" },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section className="overflow-hidden">
      <div className="relative min-h-[630px] overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>

        {/* Slide 0 — layout completo con texto */}
        <div
          className="absolute inset-0 transition-opacity duration-1000 z-10"
          style={{ opacity: current === 0 ? 1 : 0, pointerEvents: current === 0 ? "auto" : "none" }}
        >
          <div className="absolute inset-0 bg-cream" />

          {/* Imagen derecha */}
          <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[58%] bg-[#C8CFC4]">
            <img src={SLIDES[0].src} alt={SLIDES[0].alt} className="absolute inset-0 w-full h-full object-cover" />
          </div>

          {/* Texto + card */}
          <div className="relative z-10 max-w-screen-xl mx-auto px-6">
            <div className="lg:w-[42%] bg-cream flex items-center min-h-[630px] py-16 lg:py-24 lg:pr-12">
              <div className="max-w-xl">
                <p className="section-label mb-5 flex items-center gap-3">
                  <span className="block w-8 h-px bg-[#B5ADA2]" />
                  Diseño que Transforma
                </p>
                <h1 className="font-serif text-5xl sm:text-6xl xl:text-7xl leading-[1.05] text-[#1A1A1A] mb-6 font-normal">
                  Espacios que{" "}
                  <em className="italic font-normal">inspiran</em>{" "}
                  bienestar.
                </h1>
                <p className="text-[#3A3A3A] text-sm leading-relaxed mb-10 max-w-sm">
                  Plantas seleccionadas, diseño de calidad y asesoramiento personalizado para crear
                  entornos únicos y llenos de vida.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/products" className="btn-primary">Comprar Plantas</Link>
                  <Link to="/diseno" className="btn-outline">Diseño de Jardines</Link>
                </div>
              </div>
            </div>

            {/* Floating card */}
            <div
              className="hidden lg:block absolute bottom-8 right-6 backdrop-blur-sm shadow-lg rounded-[8px] p-9 max-w-[320px] z-20"
              style={{ backgroundColor: "rgba(26,43,28,0.78)" }}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="text-white/70 mt-0.5 shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </span>
                <div>
                  <p className="text-[13px] uppercase tracking-widest text-white/80 font-semibold">Asesoramiento</p>
                  <p className="text-[13px] uppercase tracking-widest text-white/80 font-semibold">Personalizado</p>
                </div>
              </div>
              <p className="text-[15px] text-white/80 leading-relaxed mb-5">
                Diseñamos tu jardín ideal. Contanos tu proyecto.
              </p>
              <Link
                to="/diseno"
                className="text-[13px] uppercase tracking-widest font-bold text-white flex items-center gap-1 hover:gap-2 transition-all"
              >
                Agendar Consulta
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Slides 1–4 — imagen full width */}
        {SLIDES.slice(1).map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-0"
            style={{ opacity: current === i + 1 ? 1 : 0 }}
          />
        ))}

        {/* Dots — centrados en toda la sección */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i === current ? "#1A2B1C" : "rgba(26,43,28,0.3)",
                transform: i === current ? "scale(1.25)" : "scale(1)",
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Trust badges strip */}
      <div className="bg-white border-t border-[#EAE4DB] py-5">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-[#EAE4DB]">
            <TrustBadge icon={<TruckIcon />} text="Envíos a todo el país" />
            <TrustBadge icon={<ShieldIcon />} text="Compra segura y protegida" />
            <TrustBadge icon={<CardIcon />} text="Pagá en cuotas sin interés" />
            <TrustBadge icon={<LeafIcon />} text="Plantas cuidadas con amor" />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 px-4 first:pl-0">
      <span className="text-[#5A7A5C] shrink-0">{icon}</span>
      <span className="text-[13px] text-[#5A5A5A] font-medium leading-tight">{text}</span>
    </div>
  );
}

function TruckIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
}
function ShieldIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
function CardIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
}
function LeafIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 8C8 10 5.9 16.17 3.82 19.31a1 1 0 1 0 1.56 1.25C8 16 11 13 15 12l2 4c-4.27.41-8 3.52-8 8H22V8s-3.33-2-5-0z" /></svg>;
}
