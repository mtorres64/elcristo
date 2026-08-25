import { Reveal } from "../common/Reveal";
import type { InspirationProject } from "../../types/content";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function imgSrc(url: string) {
  return url.startsWith("/uploads") ? `${API_BASE}${url}` : url;
}

// Degradados de respaldo mientras un proyecto no tenga foto propia cargada
// desde /seller/settings → Inspiración.
const FALLBACK_BG = [
  "from-[#8AAB80] to-[#5A7A50]",
  "from-[#6A9A78] to-[#405A48]",
  "from-[#9AB890] to-[#6A8A60]",
  "from-[#80A878] to-[#507050]",
];

/** Cada proyecto se muestra como una foto a ancho completo (edge-to-edge,
 * sin el max-w del resto de la página) con su ficha debajo, y aparece con
 * un fade-in + slide-up al entrar en el viewport a medida que se scrollea. */
export function InspirationProjects({ projects }: { projects: InspirationProject[] }) {
  if (projects.length === 0) return null;

  return (
    <section className="bg-cream py-10 md:py-14">
      <div className="flex flex-col gap-14 md:gap-20">
        {projects.map((project, i) => (
          <Reveal key={project.id}>
            <div className="w-full">
              {/* Foto a ancho completo */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden">
                {project.image ? (
                  <img
                    src={imgSrc(project.image)}
                    alt={project.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className={`absolute inset-0 bg-gradient-to-br ${FALLBACK_BG[i % FALLBACK_BG.length]}`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img src="/images/trans.png" alt="" className="w-20 h-auto opacity-30" />
                    </div>
                  </>
                )}
              </div>

              {/* Ficha del proyecto */}
              <div className="max-w-screen-xl mx-auto px-6 pt-6 md:pt-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 border-b border-[#EAE4DB] pb-8">
                  <div>
                    {project.location && (
                      <p className="text-[10px] uppercase tracking-widest text-forest-accent font-semibold mb-2">
                        {project.location}
                      </p>
                    )}
                    <h3 className="font-serif text-2xl md:text-3xl text-[#1A1A1A] font-normal">
                      {project.title}
                    </h3>
                  </div>
                  {project.description && (
                    <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-md">{project.description}</p>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
