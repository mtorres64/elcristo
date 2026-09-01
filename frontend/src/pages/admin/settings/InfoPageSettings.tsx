import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { contentService } from "../../../services/content.service";
import type { InfoPageSection, InfoPageSettings as InfoPageData, InfoPageSlug } from "../../../types/content";

function emptySection(): InfoPageSection {
  return { id: crypto.randomUUID(), title: "", text: "" };
}

/** Editor de una página de solo texto del footer (Envíos, Medios de pago,
 * Cambios y devoluciones, Preguntas frecuentes, Términos y condiciones).
 *
 * A diferencia de "Sobre Nosotros" / "Inspiración" / "Diseño", este
 * componente es autónomo: se trae su propio documento por slug y maneja su
 * estado, carga y guardado. Todas las páginas de texto comparten la misma
 * forma, así que una sola pieza reutilizable las cubre a las cinco. La barra
 * sticky mobile se saca del padding de la página con `-mx-4 -mt-6` para que
 * quede pegada al topbar, igual que el resto de las páginas admin. */
export function InfoPageSettings({
  slug,
  label,
  description,
}: {
  slug: InfoPageSlug;
  label: string;
  description: string;
}) {
  const [data, setData] = useState<InfoPageData>({ title: label, sections: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    contentService
      .getInfoPage(slug)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => toast.error(`No se pudo cargar la página "${label}"`))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug, label]);

  function patch(p: Partial<InfoPageData>) {
    setData((prev) => ({ ...prev, ...p }));
  }

  function patchSection(index: number, p: Partial<InfoPageSection>) {
    patch({ sections: data.sections.map((s, i) => (i === index ? { ...s, ...p } : s)) });
  }

  function addSection() {
    patch({ sections: [...data.sections, emptySection()] });
  }

  function removeSection(index: number) {
    patch({ sections: data.sections.filter((_, i) => i !== index) });
  }

  function moveSection(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= data.sections.length) return;
    const next = [...data.sections];
    [next[index], next[target]] = [next[target], next[index]];
    patch({ sections: next });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await contentService.updateInfoPage(slug, data);
      setData(saved);
      toast.success(`Página "${label}" actualizada`);
    } catch {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-lg p-12 text-center">
        <p className="font-serif text-lg text-[#8A8A8A]">Cargando página…</p>
      </div>
    );
  }

  return (
    <>
      {/* Barra de acción mobile sticky — sacada del padding de la página */}
      <div className="sm:hidden sticky top-0 z-10 -mx-4 -mt-6 mb-6 bg-white border-b border-[#E8E2D8] px-4 py-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Barra de acciones desktop */}
        <div className="hidden sm:flex items-center justify-between bg-white border border-[#E8E2D8] rounded-lg px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Página "{label}"</p>
            <p className="text-xs text-[#8A8A8A] mt-0.5">{description}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>

        {/* Título de la página */}
        <div className="bg-white border border-[#E8E2D8] rounded-lg p-5">
          <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Título de la página</p>
          <FormField label="Se muestra como encabezado y en el breadcrumb">
            <input
              value={data.title}
              onChange={(e) => patch({ title: e.target.value })}
              className={INPUT}
              placeholder={label}
            />
          </FormField>
        </div>

        {/* Secciones */}
        <div className="bg-white border border-[#E8E2D8] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Secciones</p>
              <p className="text-xs text-[#8A8A8A] mt-0.5">
                Se muestran en este orden, cada una con un subtítulo y un párrafo
              </p>
            </div>
            <button
              onClick={addSection}
              className="px-4 py-2 border border-[#C8C0B4] rounded-lg text-sm text-[#1A2B1C] font-medium bg-white hover:bg-[#F5F5F3] transition-colors shrink-0"
            >
              + Agregar sección
            </button>
          </div>

          {data.sections.length === 0 && (
            <p className="text-sm text-[#6B6B6B] py-6 text-center">
              Todavía no hay secciones cargadas.
            </p>
          )}

          <div className="flex flex-col gap-4">
            {data.sections.map((section, index) => (
              <div key={section.id} className="border border-[#E8E2D8] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-6 h-6 rounded-full bg-[#F0EDE8] text-[#4A4A4A] text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <IconButton title="Subir" disabled={index === 0} onClick={() => moveSection(index, -1)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                    </IconButton>
                    <IconButton
                      title="Bajar"
                      disabled={index === data.sections.length - 1}
                      onClick={() => moveSection(index, 1)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </IconButton>
                    <IconButton title="Eliminar sección" danger onClick={() => removeSection(index)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </IconButton>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <FormField label="Subtítulo">
                    <input
                      value={section.title}
                      onChange={(e) => patchSection(index, { title: e.target.value })}
                      className={INPUT}
                      placeholder="Título de la sección"
                    />
                  </FormField>
                  <FormField label="Texto">
                    <textarea
                      value={section.text}
                      onChange={(e) => patchSection(index, { text: e.target.value })}
                      className={`${INPUT} min-h-[100px] resize-y`}
                      placeholder="Contenido de la sección… (los saltos de línea se respetan)"
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Shared helpers ─────────────────────────────────────────── */

const INPUT =
  "w-full border border-[#E8E2D8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";
const LABEL = "text-xs font-medium text-[#6B6B6B]";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label className={`${LABEL} block mb-1.5`}>{label}</label>}
      {children}
    </div>
  );
}

function IconButton({
  title,
  danger,
  disabled,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-lg border border-transparent transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        danger
          ? "text-[#8A8A8A] hover:text-[#DC2626] hover:bg-[#FEF2F2]"
          : "text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F5F3]"
      }`}
    >
      {children}
    </button>
  );
}
