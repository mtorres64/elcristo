import { Reveal } from "../common/Reveal";
import type { DesignProject } from "../../types/content";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function imgSrc(url: string) {
  return url.startsWith("/uploads") ? `${API_BASE}${url}` : url;
}

// Degradados de respaldo mientras un trabajo no tenga foto propia cargada
// desde /seller/settings → Diseño & Paisajismo.
const FALLBACK_BG = [
  "from-[#5A7A5C] to-[#1A2B1C]",
  "from-[#6A9A78] to-[#111810]",
  "from-[#8AAB80] to-[#253824]",
  "from-[#7A9A72] to-[#1A2B1C]",
];

/** Cada trabajo ocupa la pantalla completa (foto a 100vh) con su ficha
 * integrada a la propia foto — superpuesta abajo sobre un velo degradado,
 * no en un bloque aparte — y aparece con fade-in a medida que se scrollea. */
export function DesignGallery({ projects }: { projects: DesignProject[] }) {
  if (projects.length === 0) return null;

  return (
    <section className="bg-cream">
      {projects.map((project, i) => (
        <Reveal key={project.id} className="block">
          <div className="relative w-full h-screen overflow-hidden">
            {/* Foto a pantalla completa */}
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
                  <img src="/images/trans.png" alt="" className="w-24 h-auto opacity-25" />
                </div>
              </>
            )}

            {/* Velo degradado + ficha integrada a la foto, no un bloque aparte */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent pt-24 md:pt-32">
              <div className="max-w-screen-xl mx-auto px-6 pb-10 md:pb-14">
                {project.location && (
                  <p className="text-[10px] uppercase tracking-widest text-white/70 font-semibold mb-2">
                    {project.location}
                  </p>
                )}
                <h3 className="font-serif text-3xl md:text-4xl text-white font-normal mb-3 max-w-2xl">
                  {project.title}
                </h3>
                {project.description && (
                  <p className="text-sm text-white/85 leading-relaxed max-w-lg">{project.description}</p>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </section>
  );
}
