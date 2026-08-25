import { Reveal } from "../common/Reveal";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function imgSrc(url: string) {
  return url.startsWith("/uploads") ? `${API_BASE}${url}` : url;
}

// Placeholder hasta que se cargue al menos una foto real desde
// /seller/settings → Sobre Nosotros — mismo patrón de InspirationSection.tsx.
const FALLBACK_PHOTOS = [
  "from-[#8AAB80] to-[#5A7A50]",
  "from-[#6A9A78] to-[#405A48]",
  "from-[#9AB890] to-[#6A8A60]",
  "from-[#80A878] to-[#507050]",
  "from-[#7A9A72] to-[#4A6A46]",
  "from-[#93B389] to-[#5F7F56]",
];

export function AboutGallery({ photos }: { photos: string[] }) {
  const items = photos.length > 0 ? photos : FALLBACK_PHOTOS;

  return (
    <section className="bg-cream py-16 md:py-20">
      <div className="max-w-screen-xl mx-auto px-6">
        <Reveal className="mb-10">
          <p className="section-label mb-1.5">Detrás de escena</p>
          <h2 className="section-title text-3xl">Así es nuestro día a día</h2>
        </Reveal>

        {/* Grid escalonado — cada foto aparece con un pequeño delay respecto
            a la anterior a medida que entra en el viewport. */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {items.map((item, i) => {
            const isPhoto = photos.length > 0;
            return (
              <Reveal key={isPhoto ? item : `placeholder-${i}`} delay={(i % 3) * 120}>
                <div className="relative overflow-hidden rounded-[8px] group" style={{ paddingBottom: "100%" }}>
                  {isPhoto ? (
                    <img
                      src={imgSrc(item)}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <>
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${item} transition-transform duration-500 group-hover:scale-105`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img src="/images/trans.png" alt="" className="w-12 h-auto opacity-40" />
                      </div>
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
