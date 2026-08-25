import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function imgSrc(url: string) {
  return url.startsWith("/uploads") ? `${API_BASE}${url}` : url;
}

export function InspirationHero({ title, image }: { title: string; image: string }) {
  return (
    <section className="relative min-h-[420px] md:min-h-[520px] flex items-end overflow-hidden">
      {/* Imagen de fondo — placeholder degradado hasta que se suba una foto real
          desde /seller/settings → Inspiración */}
      {image ? (
        <img src={imgSrc(image)} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#9AB890] to-[#253824]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <img src="/images/trans.png" alt="" className="w-28 h-auto opacity-25" />
          </div>
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

      {/* Breadcrumb */}
      <div className="absolute top-0 left-0 right-0">
        <div className="max-w-screen-xl mx-auto px-6 py-5">
          <nav className="flex items-center gap-2 text-xs text-white/70">
            <Link to="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <ChevronRight />
            <span className="text-white font-medium">Inspiración</span>
          </nav>
        </div>
      </div>

      {/* Título */}
      <div className="relative max-w-screen-xl mx-auto px-6 pb-14 md:pb-16 w-full">
        <p className="text-[11px] uppercase tracking-widest text-white/80 font-semibold italic mb-3">
          Diseño & Paisajismo
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl xl:text-6xl leading-[1.05] text-white font-normal max-w-2xl">
          {title}
        </h1>
      </div>
    </section>
  );
}

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
