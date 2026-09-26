import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { contentService } from "../../../services/content.service";
import type { Testimonial } from "../../../types/content";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function imgSrc(url: string) {
  return url.startsWith("/uploads") ? `${API_BASE}${url}` : url;
}

function emptyTestimonial(): Testimonial {
  return { id: crypto.randomUUID(), text: "", name: "", location: "", image: "" };
}

/** Editor de los testimonios del carrusel del home. Autónomo (carga y guarda
 * su propio documento), igual que InfoPageSettings. */
export function TestimonialsSettings() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    contentService
      .getTestimonials()
      .then((d) => setItems(d.items))
      .catch(() => toast.error("No se pudieron cargar los testimonios"))
      .finally(() => setLoading(false));
  }, []);

  function patchItem(index: number, p: Partial<Testimonial>) {
    setItems((prev) => prev.map((t, i) => (i === index ? { ...t, ...p } : t)));
  }

  function moveItem(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  }

  async function uploadPhoto(index: number, file: File) {
    try {
      const url = await contentService.uploadTestimonialImage(file);
      patchItem(index, { image: url });
    } catch {
      toast.error(`No se pudo subir ${file.name}`);
    }
  }

  async function handleSave() {
    const incomplete = items.findIndex((t) => !t.name.trim() || !t.text.trim());
    if (incomplete !== -1) {
      toast.error(`Completá el nombre y el testimonio de la reseña ${incomplete + 1}`);
      return;
    }
    setSaving(true);
    try {
      const saved = await contentService.updateTestimonials(items);
      setItems(saved.items);
      toast.success("Testimonios actualizados");
    } catch {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-lg p-12 text-center">
        <p className="font-serif text-lg text-[#8A8A8A]">Cargando testimonios…</p>
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
        <div className="hidden sm:flex items-center justify-between bg-white border border-[#E8E2D8] rounded-lg px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Testimonios de clientes</p>
            <p className="text-xs text-[#8A8A8A] mt-0.5">
              Se muestran en el carrusel "Lo que dicen nuestros clientes" del inicio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setItems((prev) => [...prev, emptyTestimonial()])}
              className="px-4 py-2 border border-[#C8C0B4] rounded-lg text-sm text-[#1A2B1C] font-medium bg-white hover:bg-[#F5F5F3] transition-colors"
            >
              + Agregar testimonio
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>

        {items.length === 0 && (
          <div className="bg-white border border-dashed border-[#D0C8C0] rounded-lg p-12 text-center">
            <p className="text-sm text-[#6B6B6B] mb-4">
              No hay testimonios. La sección no se muestra en el inicio.
            </p>
            <button
              onClick={() => setItems([emptyTestimonial()])}
              className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors"
            >
              Agregar el primer testimonio
            </button>
          </div>
        )}

        {items.map((t, index) => (
          <div key={t.id} className="bg-white border border-[#E8E2D8] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="w-6 h-6 rounded-full bg-[#F0EDE8] text-[#4A4A4A] text-xs font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <IconButton title="Subir" disabled={index === 0} onClick={() => moveItem(index, -1)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </IconButton>
                <IconButton
                  title="Bajar"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 1)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </IconButton>
                <IconButton
                  title="Eliminar testimonio"
                  danger
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </IconButton>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[112px_1fr] gap-5">
              <PhotoDropzone
                value={t.image || null}
                onFile={(f) => uploadPhoto(index, f)}
                onClear={() => patchItem(index, { image: "" })}
              />
              <div className="flex flex-col gap-3">
                <FormField label="Testimonio">
                  <textarea
                    value={t.text}
                    onChange={(e) => patchItem(index, { text: e.target.value })}
                    className={`${INPUT} min-h-[90px] resize-y`}
                    placeholder="Lo que dijo el cliente…"
                  />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Nombre">
                    <input
                      value={t.name}
                      onChange={(e) => patchItem(index, { name: e.target.value })}
                      className={INPUT}
                      placeholder="María B."
                    />
                  </FormField>
                  <FormField label="Ubicación">
                    <input
                      value={t.location}
                      onChange={(e) => patchItem(index, { location: e.target.value })}
                      className={INPUT}
                      placeholder="Córdoba"
                    />
                  </FormField>
                </div>
              </div>
            </div>
          </div>
        ))}

        {items.length > 0 && (
          <button
            onClick={() => setItems((prev) => [...prev, emptyTestimonial()])}
            className="sm:hidden px-4 py-2.5 border border-[#C8C0B4] rounded-lg text-sm text-[#1A2B1C] font-medium bg-white hover:bg-[#F5F5F3] transition-colors"
          >
            + Agregar testimonio
          </button>
        )}
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
      <label className={`${LABEL} block mb-1.5`}>{label}</label>
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

/** Foto redonda (avatar) — el sitio la muestra en un círculo. */
function PhotoDropzone({
  value,
  onFile,
  onClear,
}: {
  value: string | null;
  onFile: (file: File) => Promise<void> | void;
  onClear: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(files: FileList | File[]) {
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    setUploading(true);
    try {
      await onFile(file);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className={`${LABEL} block mb-1.5`}>Foto (opcional)</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handle(e.target.files)}
      />
      <div
        className="relative w-28 h-28 border-2 border-dashed border-[#D0C8C0] rounded-full overflow-hidden cursor-pointer hover:border-[#1A2B1C] transition-colors group bg-[#F9F8F5]"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handle(e.dataTransfer.files);
        }}
      >
        {value ? (
          <img src={imgSrc(value)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#ABABAB] group-hover:text-[#5A7A5C] transition-colors text-center">
            <span className="text-[10px]">{uploading ? "Subiendo…" : "Subir foto"}</span>
          </div>
        )}
      </div>
      {value && !uploading && (
        <button
          type="button"
          onClick={onClear}
          className="mt-1.5 text-[11px] text-[#8A8A8A] hover:text-[#DC2626] transition-colors"
        >
          Quitar foto
        </button>
      )}
    </div>
  );
}
