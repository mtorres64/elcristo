import { useState } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { HeroCarouselSettings } from "./settings/HeroCarouselSettings";

/* ─── Secciones de configuración ────────────────────────────────
 * Botonera extensible: para sumar una nueva sección alcanza con
 * agregar una entrada acá y su componente correspondiente abajo. */
type SectionId = "hero";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "hero", label: "Carrusel principal" },
];

export function Settings() {
  const [section, setSection] = useState<SectionId>("hero");

  return (
    <AdminLayout>
      <div className="px-4 sm:px-8 py-6 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">
            Configuración
          </h1>
          <p className="text-xs text-[#8A8A8A] mt-1">
            Administrá el contenido y la apariencia de tu tienda
          </p>
        </div>

        {/* Botonera de secciones */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                section === s.id
                  ? "bg-[#1A2B1C] text-white border-[#1A2B1C]"
                  : "bg-white text-[#4A4A4A] border-[#E8E2D8] hover:border-[#5A7A5C] hover:text-[#1A2B1C]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Contenido de la sección activa */}
        {section === "hero" && <HeroCarouselSettings />}
      </div>
    </AdminLayout>
  );
}
