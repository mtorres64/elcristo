import { Link } from "react-router-dom";

const IMAGES = [
  { id: 1, bg: "from-[#8AAB80] to-[#5A7A50]", alt: "Jardín con vegetación tropical" },
  { id: 2, bg: "from-[#6A9A78] to-[#405A48]", alt: "Espacio interior con plantas" },
  { id: 3, bg: "from-[#9AB890] to-[#6A8A60]", alt: "Terraza paisajismo nocturno" },
  { id: 4, bg: "from-[#80A878] to-[#507050]", alt: "Jardín minimalista moderno" },
];

export function InspirationSection() {
  return (
    <section className="bg-cream py-14">
      <div className="max-w-screen-xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-7">
          <div>
            <h2 className="section-title mb-1.5">Inspiración</h2>
            <p className="text-[11px] text-[#8A8A8A] tracking-wide">
              Ideas, tendencias y consejos para vivir rodeado de verde.
            </p>
          </div>
          <Link to="/inspiracion" className="link-arrow">
            Ver Más
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Images grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {IMAGES.map((img) => (
            <Link
              key={img.id}
              to="/inspiracion"
              className="group relative overflow-hidden rounded-[8px] block"
              style={{ paddingBottom: "75%" }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${img.bg} transition-transform duration-500 group-hover:scale-105`}
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
              {/* Placeholder text */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white text-xs tracking-widest uppercase font-medium">Ver más</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
