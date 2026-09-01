import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AboutPageSettings } from "./settings/AboutPageSettings";
import { InspirationPageSettings } from "./settings/InspirationPageSettings";
import { DesignPageSettings } from "./settings/DesignPageSettings";
import { InfoPageSettings } from "./settings/InfoPageSettings";
import { contentService } from "../../services/content.service";
import type {
  AboutSettings,
  DesignSettings,
  InfoPageSlug,
  InspirationSettings,
} from "../../types/content";

/* ─── Secciones de contenido ────────────────────────────────────
 * Botonera extensible: para sumar una nueva página de contenido alcanza
 * con agregar una entrada acá y su componente correspondiente abajo.
 * El carrusel del hero vive aparte, en /seller/settings — es apariencia
 * de la tienda, no una página de contenido. */
type SectionId = "about" | "inspiration" | "design" | InfoPageSlug;

/* Páginas de solo texto del footer ("Información"). Todas comparten el
 * mismo editor autónomo (InfoPageSettings), así que se listan como datos
 * y se renderizan en un solo lugar. */
const INFO_PAGES: { slug: InfoPageSlug; label: string; description: string }[] = [
  { slug: "envios", label: "Envíos", description: "Página de solo texto de la sección /envios" },
  { slug: "medios-de-pago", label: "Medios de pago", description: "Página de solo texto de la sección /medios-de-pago" },
  { slug: "cambios-y-devoluciones", label: "Cambios y devoluciones", description: "Página de solo texto de la sección /cambios-y-devoluciones" },
  { slug: "preguntas-frecuentes", label: "Preguntas frecuentes", description: "Página de solo texto de la sección /preguntas-frecuentes" },
  { slug: "terminos-y-condiciones", label: "Términos y condiciones", description: "Página de solo texto de la sección /terminos-y-condiciones" },
];

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "about", label: "Sobre Nosotros" },
  { id: "inspiration", label: "Inspiración" },
  { id: "design", label: "Diseño & Paisajismo" },
  ...INFO_PAGES.map((p) => ({ id: p.slug, label: p.label })),
];

const EMPTY_ABOUT: AboutSettings = {
  hero_image: "",
  hero_title: "",
  intro_title: "",
  intro_text: "",
  chapters: [],
  gallery: [],
};

const EMPTY_INSPIRATION: InspirationSettings = {
  hero_image: "",
  hero_title: "",
  intro_title: "",
  intro_text: "",
  projects: [],
};

const EMPTY_DESIGN: DesignSettings = {
  hero_image: "",
  hero_title: "",
  intro_title: "",
  intro_text: "",
  projects: [],
};

export function Content() {
  const [section, setSection] = useState<SectionId>("about");

  // Estado de la página "Sobre Nosotros" vive acá (no en AboutPageSettings)
  // para que el botón "Guardar cambios" pueda salir tanto en la barra de
  // acciones desktop como en la barra sticky mobile de abajo, que se
  // renderiza por fuera (antes) del contenido con padding — el mismo
  // patrón universal de "barra de acción mobile sticky" que usan el resto
  // de las páginas admin.
  const [about, setAbout] = useState<AboutSettings>(EMPTY_ABOUT);
  const [aboutLoading, setAboutLoading] = useState(true);
  const [aboutSaving, setAboutSaving] = useState(false);

  // Estado de la página "Inspiración" — mismo motivo que el de arriba.
  const [inspiration, setInspiration] = useState<InspirationSettings>(EMPTY_INSPIRATION);
  const [inspirationLoading, setInspirationLoading] = useState(true);
  const [inspirationSaving, setInspirationSaving] = useState(false);

  // Estado de la página "Diseño & Paisajismo" — mismo motivo que el resto.
  const [design, setDesign] = useState<DesignSettings>(EMPTY_DESIGN);
  const [designLoading, setDesignLoading] = useState(true);
  const [designSaving, setDesignSaving] = useState(false);

  useEffect(() => {
    contentService
      .getAbout()
      .then(setAbout)
      .catch(() => toast.error('No se pudo cargar la página "Sobre Nosotros"'))
      .finally(() => setAboutLoading(false));
    contentService
      .getInspiration()
      .then(setInspiration)
      .catch(() => toast.error('No se pudo cargar la página "Inspiración"'))
      .finally(() => setInspirationLoading(false));
    contentService
      .getDesign()
      .then(setDesign)
      .catch(() => toast.error('No se pudo cargar la página "Diseño & Paisajismo"'))
      .finally(() => setDesignLoading(false));
  }, []);

  function patchAbout(patch: Partial<AboutSettings>) {
    setAbout((prev) => ({ ...prev, ...patch }));
  }

  async function handleSaveAbout() {
    setAboutSaving(true);
    try {
      const data = await contentService.updateAbout(about);
      setAbout(data);
      toast.success('Página "Sobre Nosotros" actualizada');
    } catch {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setAboutSaving(false);
    }
  }

  function patchInspiration(patch: Partial<InspirationSettings>) {
    setInspiration((prev) => ({ ...prev, ...patch }));
  }

  async function handleSaveInspiration() {
    setInspirationSaving(true);
    try {
      const data = await contentService.updateInspiration(inspiration);
      setInspiration(data);
      toast.success('Página "Inspiración" actualizada');
    } catch {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setInspirationSaving(false);
    }
  }

  function patchDesign(patch: Partial<DesignSettings>) {
    setDesign((prev) => ({ ...prev, ...patch }));
  }

  async function handleSaveDesign() {
    setDesignSaving(true);
    try {
      const data = await contentService.updateDesign(design);
      setDesign(data);
      toast.success('Página "Diseño & Paisajismo" actualizada');
    } catch {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setDesignSaving(false);
    }
  }

  return (
    <AdminLayout>
      {/* Barra de acción mobile sticky — patrón universal en páginas admin:
          fija justo debajo del topbar, por fuera del padding de la página. */}
      {section === "about" && (
        <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3">
          <button
            onClick={handleSaveAbout}
            disabled={aboutSaving}
            className="w-full bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
          >
            {aboutSaving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}
      {section === "inspiration" && (
        <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3">
          <button
            onClick={handleSaveInspiration}
            disabled={inspirationSaving}
            className="w-full bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
          >
            {inspirationSaving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}
      {section === "design" && (
        <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3">
          <button
            onClick={handleSaveDesign}
            disabled={designSaving}
            className="w-full bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
          >
            {designSaving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}

      <div className="px-4 sm:px-8 py-6 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">
            Contenido
          </h1>
          <p className="text-xs text-[#8A8A8A] mt-1">
            Administrá las páginas de contenido de tu sitio
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
        {section === "about" && (
          <AboutPageSettings
            data={about}
            loading={aboutLoading}
            saving={aboutSaving}
            onChange={patchAbout}
            onSave={handleSaveAbout}
          />
        )}
        {section === "inspiration" && (
          <InspirationPageSettings
            data={inspiration}
            loading={inspirationLoading}
            saving={inspirationSaving}
            onChange={patchInspiration}
            onSave={handleSaveInspiration}
          />
        )}
        {section === "design" && (
          <DesignPageSettings
            data={design}
            loading={designLoading}
            saving={designSaving}
            onChange={patchDesign}
            onSave={handleSaveDesign}
          />
        )}
        {INFO_PAGES.map(
          (p) =>
            section === p.slug && (
              <InfoPageSettings
                key={p.slug}
                slug={p.slug}
                label={p.label}
                description={p.description}
              />
            ),
        )}
      </div>
    </AdminLayout>
  );
}
