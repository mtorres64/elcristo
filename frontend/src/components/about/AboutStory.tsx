import { Reveal } from "../common/Reveal";
import type { AboutChapter } from "../../types/content";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function imgSrc(url: string) {
  return url.startsWith("/uploads") ? `${API_BASE}${url}` : url;
}

// Degradados de respaldo mientras un capítulo no tenga foto propia cargada
// desde /seller/settings → Sobre Nosotros.
const FALLBACK_BG = [
  "from-[#8AAB80] to-[#5A7A50]",
  "from-[#6A9A78] to-[#405A48]",
  "from-[#9AB890] to-[#6A8A60]",
];

export function AboutStory({
  introTitle,
  introText,
  chapters,
}: {
  introTitle: string;
  introText: string;
  chapters: AboutChapter[];
}) {
  return (
    <section className="bg-cream py-16 md:py-20">
      <div className="max-w-screen-xl mx-auto px-6">
        {/* Intro */}
        <Reveal className="max-w-2xl mx-auto text-center mb-16 md:mb-20">
          <p className="section-label mb-3 justify-center flex">Quiénes somos</p>
          <h2 className="section-title text-3xl md:text-4xl mb-5">{introTitle}</h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">{introText}</p>
        </Reveal>

        {/* Capítulos de la historia, alternando texto/foto */}
        <div className="flex flex-col gap-16 md:gap-24">
          {chapters.map((chapter, i) => (
            <Reveal
              key={chapter.id}
              className={`flex flex-col ${
                i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
              } items-center gap-8 md:gap-14`}
            >
              {/* Foto */}
              <div className="w-full md:w-1/2 shrink-0">
                <div className="relative overflow-hidden rounded-[8px]" style={{ paddingBottom: "70%" }}>
                  {chapter.image ? (
                    <img
                      src={imgSrc(chapter.image)}
                      alt={chapter.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <div className={`absolute inset-0 bg-gradient-to-br ${FALLBACK_BG[i % FALLBACK_BG.length]}`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img src="/images/trans.png" alt="" className="w-16 h-auto opacity-40" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Texto */}
              <div className="w-full md:w-1/2">
                <p className="text-[10px] uppercase tracking-widest text-forest-accent font-semibold mb-2">
                  {chapter.eyebrow}
                </p>
                <h3 className="font-serif text-2xl md:text-3xl text-[#1A1A1A] font-normal mb-4">
                  {chapter.title}
                </h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{chapter.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
