import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { contentService } from "../../../services/content.service";
import type { AboutChapter, AboutSettings } from "../../../types/content";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function imgSrc(url: string) {
  return url.startsWith("/uploads") ? `${API_BASE}${url}` : url;
}

export function emptyChapter(): AboutChapter {
  return { id: crypto.randomUUID(), eyebrow: "", title: "", text: "", image: "" };
}

/** Estado de la página "Sobre Nosotros" vive en `Settings.tsx` (el padre),
 * igual que el carrusel del hero — así el botón "Guardar cambios" puede
 * salir tanto en la barra desktop de acá como en la sticky bar mobile. */
export function AboutPageSettings({
  data,
  loading,
  saving,
  onChange,
  onSave,
}: {
  data: AboutSettings;
  loading: boolean;
  saving: boolean;
  onChange: (patch: Partial<AboutSettings>) => void;
  onSave: () => void;
}) {
  async function uploadHeroImage(file: File) {
    try {
      const url = await contentService.uploadAboutImage(file);
      onChange({ hero_image: url });
    } catch {
      toast.error(`No se pudo subir ${file.name}`);
    }
  }

  function patchChapter(index: number, patch: Partial<AboutChapter>) {
    onChange({
      chapters: data.chapters.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    });
  }

  function addChapter() {
    onChange({ chapters: [...data.chapters, emptyChapter()] });
  }

  function removeChapter(index: number) {
    onChange({ chapters: data.chapters.filter((_, i) => i !== index) });
  }

  function moveChapter(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= data.chapters.length) return;
    const next = [...data.chapters];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ chapters: next });
  }

  async function addGalleryImage(file: File) {
    try {
      const url = await contentService.uploadAboutImage(file);
      onChange({ gallery: [...data.gallery, url] });
    } catch {
      toast.error(`No se pudo subir ${file.name}`);
    }
  }

  function removeGalleryImage(index: number) {
    onChange({ gallery: data.gallery.filter((_, i) => i !== index) });
  }

  function moveGalleryImage(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= data.gallery.length) return;
    const next = [...data.gallery];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ gallery: next });
  }

  if (loading) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-lg p-12 text-center">
        <p className="font-serif text-lg text-[#8A8A8A]">Cargando página…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de acciones — en mobile la misma acción vive en la sticky bar de Settings.tsx */}
      <div className="hidden sm:flex items-center justify-between bg-white border border-[#E8E2D8] rounded-lg px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">Página "Sobre Nosotros"</p>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            Descripción, historia y fotos de la sección /nosotros
          </p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      {/* Portada */}
      <div className="bg-white border border-[#E8E2D8] rounded-lg p-5">
        <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Portada</p>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <ImageDropzone
            label="Imagen de portada"
            value={data.hero_image || null}
            onFile={uploadHeroImage}
            onClear={() => onChange({ hero_image: "" })}
          />
          <FormField label="Título">
            <input
              value={data.hero_title}
              onChange={(e) => onChange({ hero_title: e.target.value })}
              className={INPUT}
              placeholder="Nuestra historia, cultivada con paciencia."
            />
          </FormField>
        </div>
      </div>

      {/* Descripción */}
      <div className="bg-white border border-[#E8E2D8] rounded-lg p-5">
        <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Descripción</p>
        <div className="flex flex-col gap-4">
          <FormField label="Título de la sección">
            <input
              value={data.intro_title}
              onChange={(e) => onChange({ intro_title: e.target.value })}
              className={INPUT}
              placeholder="Cultivamos espacios verdes desde hace más de dos décadas"
            />
          </FormField>
          <FormField label="Texto">
            <textarea
              value={data.intro_text}
              onChange={(e) => onChange({ intro_text: e.target.value })}
              className={`${INPUT} min-h-[100px] resize-y`}
              placeholder="Contanos quiénes son y qué los distingue…"
            />
          </FormField>
        </div>
      </div>

      {/* Historia — capítulos con foto */}
      <div className="bg-white border border-[#E8E2D8] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Historia</p>
            <p className="text-xs text-[#8A8A8A] mt-0.5">
              Se muestran en este orden, alternando foto y texto
            </p>
          </div>
          <button
            onClick={addChapter}
            className="px-4 py-2 border border-[#C8C0B4] rounded-lg text-sm text-[#1A2B1C] font-medium bg-white hover:bg-[#F5F5F3] transition-colors shrink-0"
          >
            + Agregar capítulo
          </button>
        </div>

        {data.chapters.length === 0 && (
          <p className="text-sm text-[#6B6B6B] py-6 text-center">Todavía no hay capítulos.</p>
        )}

        <div className="flex flex-col gap-4">
          {data.chapters.map((chapter, index) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              index={index}
              total={data.chapters.length}
              onChange={(patch) => patchChapter(index, patch)}
              onRemove={() => removeChapter(index)}
              onMove={(dir) => moveChapter(index, dir)}
            />
          ))}
        </div>
      </div>

      {/* Galería de fotos */}
      <div className="bg-white border border-[#E8E2D8] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Galería de fotos</p>
            <p className="text-xs text-[#8A8A8A] mt-0.5">
              Aparecen progresivamente a medida que se hace scroll en la página
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.gallery.map((url, index) => (
            <div key={`${url}-${index}`} className="relative">
              <ImageDropzone
                label=""
                value={url}
                onFile={() => {}}
                onClear={() => removeGalleryImage(index)}
              />
              <div className="flex items-center justify-center gap-1 mt-1">
                <IconButton title="Mover antes" disabled={index === 0} onClick={() => moveGalleryImage(index, -1)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </IconButton>
                <IconButton
                  title="Mover después"
                  disabled={index === data.gallery.length - 1}
                  onClick={() => moveGalleryImage(index, 1)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </IconButton>
              </div>
            </div>
          ))}

          <AddImageTile onFile={addGalleryImage} />
        </div>
      </div>
    </div>
  );
}

/* ─── Capítulo de historia ───────────────────────────────────── */

function ChapterCard({
  chapter,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  chapter: AboutChapter;
  index: number;
  total: number;
  onChange: (patch: Partial<AboutChapter>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  async function upload(file: File) {
    try {
      const url = await contentService.uploadAboutImage(file);
      onChange({ image: url });
    } catch {
      toast.error(`No se pudo subir ${file.name}`);
    }
  }

  return (
    <div className="border border-[#E8E2D8] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="w-6 h-6 rounded-full bg-[#F0EDE8] text-[#4A4A4A] text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <IconButton title="Subir" disabled={index === 0} onClick={() => onMove(-1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </IconButton>
          <IconButton title="Bajar" disabled={index === total - 1} onClick={() => onMove(1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </IconButton>
          <IconButton title="Eliminar capítulo" danger onClick={onRemove}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </IconButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5">
        <ImageDropzone
          label="Foto"
          value={chapter.image || null}
          onFile={upload}
          onClear={() => onChange({ image: "" })}
        />
        <div className="flex flex-col gap-3">
          <FormField label="Etiqueta">
            <input
              value={chapter.eyebrow}
              onChange={(e) => onChange({ eyebrow: e.target.value })}
              className={INPUT}
              placeholder="Los comienzos"
            />
          </FormField>
          <FormField label="Título">
            <input
              value={chapter.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className={INPUT}
              placeholder="Una semilla familiar"
            />
          </FormField>
          <FormField label="Texto">
            <textarea
              value={chapter.text}
              onChange={(e) => onChange({ text: e.target.value })}
              className={`${INPUT} min-h-[80px] resize-y`}
              placeholder="Contá esta parte de la historia…"
            />
          </FormField>
        </div>
      </div>
    </div>
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

function ImageDropzone({
  label,
  value,
  onFile,
  onClear,
}: {
  label: string;
  value: string | null;
  onFile: (file: File) => void;
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
    <div className="w-full">
      {label && <label className={`${LABEL} block mb-1.5`}>{label}</label>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handle(e.target.files)}
      />
      <div
        className="relative w-full aspect-square border-2 border-dashed border-[#D0C8C0] rounded-lg overflow-hidden cursor-pointer hover:border-[#1A2B1C] transition-colors group bg-[#F9F8F5]"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files); }}
      >
        {value ? (
          <img src={imgSrc(value)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#ABABAB] group-hover:text-[#5A7A5C] transition-colors p-2 text-center">
            {uploading ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-spin">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-[10px] mt-1">Subir imagen</span>
              </>
            )}
          </div>
        )}
        {value && !uploading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute top-1 right-1 w-5 h-5 bg-white border border-[#E8E2D8] text-[#6B6B6B] hover:text-[#DC2626] text-xs leading-none rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Quitar imagen"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/** Tile con el mismo tamaño que un ImageDropzone, para agregar una foto nueva a la galería. */
function AddImageTile({ onFile }: { onFile: (file: File) => void }) {
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
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handle(e.target.files)}
      />
      <div
        className="relative w-full aspect-square border-2 border-dashed border-[#D0C8C0] rounded-lg overflow-hidden cursor-pointer hover:border-[#1A2B1C] transition-colors group bg-[#F9F8F5] flex flex-col items-center justify-center text-[#ABABAB] group-hover:text-[#5A7A5C]"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files); }}
      >
        {uploading ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-spin">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-[10px] mt-1">Agregar foto</span>
          </>
        )}
      </div>
    </div>
  );
}
