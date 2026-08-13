import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contentService } from "../../services/content.service";
import type { HeroSlide } from "../../types/content";
import { hexToRgba } from "../../utils/color";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function imgSrc(url: string) {
  return url.startsWith("/uploads") ? `${API_BASE}${url}` : url;
}

/** Estilo inline para el contenedor .hero-copy: fija el color de texto
 * elegido por el vendedor vía la variable CSS que consume index.css. */
function heroCopyStyle(slide: HeroSlide): React.CSSProperties {
  return { "--hero-text": slide.text_color } as React.CSSProperties;
}

export function HeroSection() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    contentService
      .getHero()
      .then((data) => setSlides(data.slides.filter((s) => s.active)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides, current]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  function handleSlideClick(e: React.MouseEvent | React.KeyboardEvent, slide: HeroSlide) {
    if (!slide.link_url) return;
    if ((e.target as HTMLElement).closest("a,button")) return;
    if (slide.link_url.startsWith("/")) navigate(slide.link_url);
    else window.location.href = slide.link_url;
  }

  if (loading) {
    return <section className="min-h-[630px] bg-cream" />;
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden">
      <div
        className="relative min-h-[630px] overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.map((slide, i) => {
          const clickable = !!slide.link_url;
          const hasText = slide.html.trim().length > 0;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 z-10 ${clickable ? "cursor-pointer" : ""}`}
              style={{ opacity: current === i ? 1 : 0, pointerEvents: current === i ? "auto" : "none" }}
              onClick={(e) => handleSlideClick(e, slide)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSlideClick(e, slide); }}
              role={clickable ? "link" : undefined}
              tabIndex={clickable ? 0 : undefined}
            >
              {slide.layout === "split" ? (
                <SplitSlide slide={slide} side={slide.text_position === "right" ? "right" : "left"} />
              ) : hasText ? (
                <OverlaySlide slide={slide} align={slide.text_position} />
              ) : (
                <FullBleedSlide slide={slide} />
              )}
            </div>
          );
        })}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-30">
            {slides.map((_, i) => (
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
        )}
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

/* ─── Slide layouts ──────────────────────────────────────────── */

function SlideImage({ slide }: { slide: HeroSlide }) {
  const desktopSrc = imgSrc(slide.image_desktop);
  const mobileSrc = slide.image_mobile ? imgSrc(slide.image_mobile) : null;
  return (
    <>
      <img
        src={desktopSrc}
        alt={slide.alt}
        className={`absolute inset-0 w-full h-full object-cover ${mobileSrc ? "hidden md:block" : ""}`}
      />
      {mobileSrc && (
        <img src={mobileSrc} alt={slide.alt} className="absolute inset-0 w-full h-full object-cover md:hidden" />
      )}
    </>
  );
}

function FullBleedSlide({ slide }: { slide: HeroSlide }) {
  return (
    <div className="absolute inset-0">
      <SlideImage slide={slide} />
    </div>
  );
}

function SplitSlide({ slide, side }: { slide: HeroSlide; side: "left" | "right" }) {
  const isLeft = side === "left";
  const panelBg = hexToRgba(slide.bg_color, slide.bg_opacity);
  return (
    <div className="absolute inset-0">
      <div className="hidden lg:block absolute inset-0" style={{ backgroundColor: panelBg }} />

      {/* Imagen */}
      <div
        className={`absolute top-0 bottom-0 w-full lg:w-[58%] bg-[#C8CFC4] ${
          isLeft ? "right-0" : "left-0"
        }`}
      >
        <SlideImage slide={slide} />
      </div>

      {/* Texto */}
      <div className="relative z-10 max-w-screen-xl mx-auto lg:px-6 h-full">
        <div
          className={`lg:w-[42%] px-6 lg:px-0 backdrop-blur-sm lg:backdrop-blur-none flex items-center min-h-[630px] py-16 lg:py-24 ${
            isLeft ? "lg:pr-12" : "lg:pl-12 lg:ml-auto"
          }`}
          style={{ backgroundColor: panelBg }}
        >
          <div className="hero-copy" style={heroCopyStyle(slide)} dangerouslySetInnerHTML={{ __html: slide.html }} />
        </div>
      </div>
    </div>
  );
}

function OverlaySlide({ slide, align }: { slide: HeroSlide; align: "left" | "center" | "right" }) {
  const justify = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";
  const panelBg = hexToRgba(slide.bg_color, slide.bg_opacity);
  return (
    <div className="absolute inset-0">
      <SlideImage slide={slide} />
      <div className="absolute inset-0 bg-black/35" />
      <div className={`relative z-10 h-full flex items-center ${justify} max-w-screen-xl mx-auto px-6`}>
        <div
          className={`hero-copy rounded-lg p-8 backdrop-blur-sm ${align === "center" ? "text-center" : ""}`}
          style={{ backgroundColor: panelBg, ...heroCopyStyle(slide) }}
          dangerouslySetInnerHTML={{ __html: slide.html }}
        />
      </div>
    </div>
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
