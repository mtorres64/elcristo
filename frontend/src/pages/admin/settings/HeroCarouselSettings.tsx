import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { contentService } from "../../../services/content.service";
import type { HeroLayout, HeroSlide, HeroTextPosition } from "../../../types/content";
import type { Category } from "../../../types/category";
import type { ProductSummary } from "../../../types/product";
import { hexToRgba } from "../../../utils/color";
import { HtmlEditor } from "./HtmlEditor";

// Páginas fijas del sitio (coinciden con las rutas públicas de App.tsx)
const SITE_PAGES: { label: string; value: string }[] = [
  { label: "Inicio", value: "/" },
  { label: "Todos los productos", value: "/products" },
  { label: "Categorías", value: "/categories" },
  { label: "Diseño & Paisajismo", value: "/diseno" },
  { label: "Inspiración", value: "/inspiracion" },
  { label: "Sobre Nosotros", value: "/nosotros" },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function imgSrc(url: string) {
  return url.startsWith("/uploads") ? `${API_BASE}${url}` : url;
}

export function emptySlide(): HeroSlide {
  return {
    id: crypto.randomUUID(),
    image_desktop: "",
    image_mobile: null,
    html: "",
    layout: "full",
    text_position: "left",
    text_color: "#FFFFFF",
    bg_color: "#1A2B1C",
    bg_opacity: 55,
    link_url: null,
    active: true,
    alt: "",
  };
}

const LAYOUTS: { id: HeroLayout; label: string; hint: string }[] = [
  { id: "full", label: "Imagen completa", hint: "El texto (si hay) se superpone sobre la imagen" },
  { id: "split", label: "Mitad y mitad", hint: "Un lado con la imagen, el otro con el texto" },
];

const POSITIONS: { id: HeroTextPosition; label: string }[] = [
  { id: "left", label: "Izquierda" },
  { id: "center", label: "Centro" },
  { id: "right", label: "Derecha" },
];

/** Estado del carrusel + sus handlers viven en `Settings.tsx` (el padre), no acá:
 * así el botón "Guardar cambios" puede salir en la barra sticky mobile que se
 * renderiza por fuera de esta sección — ver el comentario en Settings.tsx. */
export function HeroCarouselSettings({
  slides,
  loading,
  saving,
  categories,
  products,
  onAddSlide,
  onSave,
  onPatchSlide,
  onRemoveSlide,
  onMoveSlide,
}: {
  slides: HeroSlide[];
  loading: boolean;
  saving: boolean;
  categories: Category[];
  products: ProductSummary[];
  onAddSlide: () => void;
  onSave: () => void;
  onPatchSlide: (index: number, patch: Partial<HeroSlide>) => void;
  onRemoveSlide: (index: number) => void;
  onMoveSlide: (index: number, dir: -1 | 1) => void;
}) {
  if (loading) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-lg p-12 text-center">
        <p className="font-serif text-lg text-[#8A8A8A]">Cargando carrusel…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de acciones — en mobile las mismas acciones viven en la sticky bar de Settings.tsx */}
      <div className="hidden sm:flex items-center justify-between bg-white border border-[#E8E2D8] rounded-lg px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">Slides del hero</p>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            Se muestran en este orden en la página principal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddSlide}
            className="px-4 py-2 border border-[#C8C0B4] rounded-lg text-sm text-[#1A2B1C] font-medium bg-white hover:bg-[#F5F5F3] transition-colors"
          >
            + Agregar slide
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      {slides.length === 0 && (
        <div className="bg-white border border-dashed border-[#D0C8C0] rounded-lg p-12 text-center">
          <p className="text-sm text-[#6B6B6B] mb-4">Todavía no hay slides configurados.</p>
          <button
            onClick={onAddSlide}
            className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors"
          >
            Agregar el primer slide
          </button>
        </div>
      )}

      {slides.map((slide, index) => (
        <SlideCard
          key={slide.id}
          slide={slide}
          index={index}
          total={slides.length}
          categories={categories}
          products={products}
          onChange={(patch) => onPatchSlide(index, patch)}
          onRemove={() => onRemoveSlide(index)}
          onMove={(dir) => onMoveSlide(index, dir)}
        />
      ))}
    </div>
  );
}

/* ─── Slide card ─────────────────────────────────────────────── */

function SlideCard({
  slide,
  index,
  total,
  categories,
  products,
  onChange,
  onRemove,
  onMove,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
  categories: Category[];
  products: ProductSummary[];
  onChange: (patch: Partial<HeroSlide>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  async function uploadTo(field: "image_desktop" | "image_mobile", file: File) {
    try {
      const url = await contentService.uploadHeroImage(file);
      onChange({ [field]: url } as Partial<HeroSlide>);
    } catch {
      toast.error(`No se pudo subir ${file.name}`);
    }
  }

  // Igual que en el sitio (HeroSection.tsx): "Imagen completa" sin texto no
  // lleva velo ni panel — se renderiza como imagen limpia (FullBleedSlide).
  // Si mostráramos el velo/panel igual acá, el preview mentiría para fotos
  // que ya traen todo el diseño resuelto (texto y CTA incluidos).
  const hasText = slide.html.trim().length > 0;

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-lg p-5">
      {/* Header de la card */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-[#F0EDE8] text-[#4A4A4A] text-xs font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <Toggle checked={slide.active} onChange={(v) => onChange({ active: v })} />
          <span className="text-xs text-[#6B6B6B]">{slide.active ? "Activo" : "Oculto"}</span>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            title="Subir"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </IconButton>
          <IconButton
            title="Bajar"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </IconButton>
          <IconButton title="Eliminar slide" danger onClick={onRemove}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </IconButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Columna izquierda: imágenes + link + alt */}
        <div className="flex flex-col gap-4">
          {/* Escritorio (16:9, ancho completo) y mobile (9:16, angosta) no son la
              misma forma — el hero en el celular ocupa toda la pantalla en vertical,
              así que el recorte de esa imagen es completamente distinto al de desktop. */}
          <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
            <ImageDropzone
              label="Imagen de escritorio"
              required
              aspect="aspect-video"
              value={slide.image_desktop || null}
              onFile={(f) => uploadTo("image_desktop", f)}
              onClear={() => onChange({ image_desktop: "" })}
            />
            <ImageDropzone
              label="Mobile (opcional)"
              aspect="aspect-[9/16]"
              className="w-28"
              value={slide.image_mobile}
              onFile={(f) => uploadTo("image_mobile", f)}
              onClear={() => onChange({ image_mobile: null })}
            />
          </div>

          <FormField label="Alt de la imagen">
            <input
              value={slide.alt}
              onChange={(e) => onChange({ alt: e.target.value })}
              className={INPUT}
              placeholder="Descripción breve de la imagen"
            />
          </FormField>

          <FormField label="Destino del click">
            <LinkPicker
              value={slide.link_url}
              categories={categories}
              products={products}
              onChange={(link_url) => onChange({ link_url })}
            />
          </FormField>

          <FormField label="Diseño del slide">
            <div className="flex gap-1.5">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  title={l.hint}
                  onClick={() => {
                    // El diseño "mitad y mitad" reparte dos lados: si el
                    // texto estaba centrado, lo llevamos a la izquierda.
                    const patch: Partial<HeroSlide> =
                      l.id === "split" && slide.text_position === "center"
                        ? { layout: l.id, text_position: "left" }
                        : { layout: l.id };
                    onChange(patch);
                  }}
                  className={`flex-1 text-xs px-3 py-2 border rounded-lg transition-colors ${
                    slide.layout === l.id
                      ? "border-[#3D6040] bg-[#3D6040] text-white"
                      : "border-[#E8E2D8] text-[#6B6B6B] hover:border-[#5A7A5C] hover:text-[#3D6040]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Posición del texto">
            <div className="flex gap-1.5">
              {POSITIONS.filter((p) => slide.layout === "full" || p.id !== "center").map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ text_position: p.id })}
                  className={`flex-1 text-xs px-3 py-2 border rounded-lg transition-colors ${
                    slide.text_position === p.id
                      ? "border-[#3D6040] bg-[#3D6040] text-white"
                      : "border-[#E8E2D8] text-[#6B6B6B] hover:border-[#5A7A5C] hover:text-[#3D6040]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Color de fondo">
            <div className="flex items-center gap-2 border border-[#E8E2D8] rounded-lg px-2 py-1.5">
              <input
                type="color"
                value={slide.bg_color}
                onChange={(e) => onChange({ bg_color: e.target.value })}
                className="w-7 h-7 rounded border border-[#E8E2D8] cursor-pointer shrink-0"
                aria-label="Color de fondo"
              />
              <span className="text-xs text-[#6B6B6B] font-mono">{slide.bg_color}</span>
            </div>
          </FormField>

          <FormField label={`Opacidad del fondo (${slide.bg_opacity}%)`}>
            <input
              type="range"
              min={0}
              max={100}
              value={slide.bg_opacity}
              onChange={(e) => onChange({ bg_opacity: Number(e.target.value) })}
              className="w-full accent-[#3D6040]"
            />
          </FormField>
        </div>

        {/* Columna derecha: contenido del slide (editor visual, sin HTML a mano) */}
        <div className="flex flex-col gap-2">
          <FormField label="Contenido del slide">
            {slide.layout === "full" && slide.image_desktop ? (
              // "Imagen completa": mostramos la foto real a su ancho 100%, tal
              // como se ve en el sitio (sin recortarla a un aspect-ratio fijo
              // inventado) — el panel de texto se superpone encima, absoluto,
              // ocupando exactamente el alto que termina teniendo la imagen.
              <div className="relative border border-[#E8E2D8] rounded-lg overflow-hidden">
                <img src={imgSrc(slide.image_desktop)} alt="" className="block w-full h-auto" />
                {/* Velo oscuro sobre toda la foto — solo si hay texto, igual que en el sitio */}
                {hasText && <div className="absolute inset-0 bg-black/35" />}
                {/* El panel de texto va arriba, de borde a borde en ancho, con su
                    propio alto (según el contenido) — el resto de la imagen abajo
                    queda visible sin recortar. Sin texto todavía: ni velo ni fondo
                    de color, solo el editor (transparente) para poder empezar a
                    escribir — así una foto que ya trae todo resuelto se ve limpia. */}
                <div
                  className={`absolute inset-x-0 top-0 ${hasText ? "backdrop-blur-sm" : ""}`}
                  style={hasText ? { backgroundColor: hexToRgba(slide.bg_color, slide.bg_opacity) } : undefined}
                >
                  <HtmlEditor
                    value={slide.html}
                    onChange={(html) => onChange({ html })}
                    align={slide.text_position}
                  />
                </div>
              </div>
            ) : (
              <div
                className="relative border border-[#E8E2D8] rounded-lg overflow-hidden bg-cover bg-center"
                style={
                  slide.image_desktop
                    ? { backgroundImage: `url(${imgSrc(slide.image_desktop)})` }
                    : undefined
                }
              >
                {/* Sin imagen todavía: fondo a cuadros para no confundirlo con negro/blanco real */}
                {!slide.image_desktop && (
                  <div className="absolute inset-0 bg-[repeating-conic-gradient(#EFEFEF_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]" />
                )}
                {/* "Mitad y mitad": la imagen y el texto van lado a lado en el sitio,
                    no superpuestos, así que acá el panel queda content-driven. */}
                <div
                  className="relative backdrop-blur-sm"
                  style={{ backgroundColor: hexToRgba(slide.bg_color, slide.bg_opacity) }}
                >
                  <HtmlEditor
                    value={slide.html}
                    onChange={(html) => onChange({ html })}
                    align="left"
                  />
                </div>
              </div>
            )}
          </FormField>
          <p className="text-[10px] text-[#ABABAB] leading-relaxed">
            Así se ve tal cual sobre la imagen del slide. Dejalo vacío para un slide sin texto.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared helpers ─────────────────────────────────────────── */

const INPUT =
  "w-full border border-[#E8E2D8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";
const SELECT =
  "w-full border border-[#E8E2D8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors appearance-none cursor-pointer pr-8";
const LABEL = "text-xs font-medium text-[#6B6B6B]";

const LINK_NONE = "";
const LINK_CUSTOM = "__custom__";

/** Desplegable de destino del click: páginas del sitio, categorías,
 * productos, o una URL personalizada/externa como salida de emergencia. */
function LinkPicker({
  value,
  categories,
  products,
  onChange,
}: {
  value: string | null;
  categories: Category[];
  products: ProductSummary[];
  onChange: (v: string | null) => void;
}) {
  const categoryLinks = categories.map((c) => ({ label: c.name, value: `/products?category=${c.slug}` }));
  const productLinks = products.map((p) => ({ label: p.title, value: `/products/${p.product_id}` }));
  const known = new Set([...SITE_PAGES, ...categoryLinks, ...productLinks].map((o) => o.value));

  const isCustom = !!value && !known.has(value);
  const selectValue = !value ? LINK_NONE : isCustom ? LINK_CUSTOM : value;

  function handleSelect(v: string) {
    if (v === LINK_NONE) onChange(null);
    else if (v === LINK_CUSTOM) onChange(value && isCustom ? value : "https://");
    else onChange(v);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <select value={selectValue} onChange={(e) => handleSelect(e.target.value)} className={SELECT}>
          <option value={LINK_NONE}>Sin destino (no clickeable)</option>
          <optgroup label="Páginas del sitio">
            {SITE_PAGES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </optgroup>
          {categoryLinks.length > 0 && (
            <optgroup label="Categorías">
              {categoryLinks.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </optgroup>
          )}
          {productLinks.length > 0 && (
            <optgroup label="Productos">
              {productLinks.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </optgroup>
          )}
          <option value={LINK_CUSTOM}>URL personalizada / externa…</option>
        </select>
        <ChevronSelectIcon />
      </div>
      {selectValue === LINK_CUSTOM && (
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className={INPUT}
          placeholder="https://..."
          autoFocus
        />
      )}
    </div>
  );
}

function ChevronSelectIcon() {
  return (
    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A8A]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={`${LABEL} block mb-1.5`}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${
        checked ? "bg-[#1A2B1C]" : "bg-[#D0D0D0]"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
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
  required,
  value,
  onFile,
  onClear,
  aspect = "aspect-video",
  className = "w-full",
}: {
  label: string;
  required?: boolean;
  value: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  /** Clase Tailwind de aspect-ratio del recorte — 16:9 en desktop, 9:16 en mobile. */
  aspect?: string;
  /** Ancho del contenedor — angosto para el dropzone mobile (vertical). */
  className?: string;
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
    <div className={className}>
      <label className={`${LABEL} block mb-1.5`}>
        {label}
        {required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handle(e.target.files)}
      />
      <div
        className={`relative w-full ${aspect} border-2 border-dashed border-[#D0C8C0] rounded-lg overflow-hidden cursor-pointer hover:border-[#1A2B1C] transition-colors group bg-[#F9F8F5]`}
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
