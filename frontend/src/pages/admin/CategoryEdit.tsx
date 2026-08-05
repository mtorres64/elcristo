import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { categoryService } from "../../services/category.service";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function resolveImageUrl(src: string): string {
  return src.startsWith("/") ? `${API_BASE}${src}` : src;
}

// ─── Shared UI constants ──────────────────────────────────────────
const INPUT =
  "w-full border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors rounded-lg";

const LABEL = "text-xs font-medium text-[#6B6B6B]";

// ─── Sub-components ───────────────────────────────────────────────
function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={`${LABEL} block mb-1.5`}>
        {label}
        {required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-[#ABABAB] mt-1">{hint}</p>}
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
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
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

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// ─── Page ─────────────────────────────────────────────────────────
export function CategoryEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    categoryService
      .getById(id)
      .then((cat) => {
        setName(cat.name);
        setSlug(cat.slug);
        setSlugManual(true);
        setDescription(cat.description ?? "");
        setIsActive(cat.is_active);
        setSortOrder(cat.sort_order);
        setProductCount(cat.product_count);
        setExistingImageUrl(cat.image_url);
        setCreatedAt(cat.created_at);
        setUpdatedAt(cat.updated_at);
        setLoadingData(false);
      })
      .catch(() => {
        setFetchError(true);
        setLoadingData(false);
      });
  }, [id]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManual) setSlug(toSlug(value));
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugManual(true);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      await categoryService.updateById(id!, {
        name: name.trim(),
        slug: slug.trim() || toSlug(name),
        description: description.trim() || null,
        is_active: isActive,
        sort_order: sortOrder,
      });
      if (imageFile) {
        try {
          await categoryService.uploadImage(id!, imageFile);
        } catch {
          toast.error("Guardado, pero no se pudo actualizar la imagen");
        }
      }
      toast.success("Categoría actualizada");
      navigate("/seller/categories");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "No se pudo guardar los cambios");
      setSaving(false);
    }
  }

  const currentImageSrc = previewUrl ?? (existingImageUrl ? resolveImageUrl(existingImageUrl) : null);

  if (loadingData) {
    return (
      <AdminLayout>
        <div className="px-8 py-6 min-h-full">
          <div className="animate-pulse">
            <div className="h-3 bg-[#EDE9E2] rounded w-40 mb-4" />
            <div className="h-7 bg-[#EDE9E2] rounded w-56 mb-2" />
            <div className="h-3 bg-[#F0EDE8] rounded w-32 mb-8" />
            <div className="flex gap-6">
              <div className="flex-1 bg-[#EDE9E2] rounded-lg h-64" />
              <div className="w-[300px] bg-[#EDE9E2] rounded-lg h-48" />
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (fetchError) {
    return (
      <AdminLayout>
        <div className="px-8 py-6 min-h-full flex flex-col items-center justify-center gap-4">
          <p className="text-sm text-[#6B6B6B]">No se pudo cargar la categoría.</p>
          <Link
            to="/seller/categories"
            className="text-xs text-[#1A2B1C] underline underline-offset-2"
          >
            Volver a categorías
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-8 py-6 min-h-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller/categories" className="hover:text-[#1A2B1C] transition-colors">
            Categorías
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="text-[#1A1A1A] font-medium">{name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">
              {name}
            </h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              {productCount} producto{productCount !== 1 ? "s" : ""} en esta categoría
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/seller/categories"
              className="px-4 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white hover:bg-[#F9F8F5] transition-colors rounded-lg"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 hover:bg-[#253824] transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="flex gap-6 items-start">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-[#E8E2D8] p-6 flex flex-col gap-6">
              {/* Name */}
              <FormField label="Nombre" required>
                <div className="relative">
                  <input
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    maxLength={80}
                    placeholder="Ej: Plantas de Interior"
                    className={INPUT}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#ABABAB]">
                    {name.length}/80
                  </span>
                </div>
              </FormField>

              {/* Slug */}
              <FormField
                label="Slug (URL)"
                hint="Solo letras minúsculas, números y guiones."
              >
                <div className="relative flex items-center border border-[#E8E2D8] rounded-lg focus-within:border-[#1A2B1C] transition-colors bg-white">
                  <span className="pl-3 text-xs text-[#ABABAB] shrink-0">/</span>
                  <input
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    maxLength={80}
                    placeholder="plantas-de-interior"
                    className="flex-1 px-2 py-2 text-sm text-[#1A1A1A] bg-transparent outline-none placeholder-[#ABABAB]"
                  />
                </div>
              </FormField>

              {/* Description */}
              <FormField label="Descripción">
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={4}
                    placeholder="Breve descripción de esta categoría..."
                    className={`${INPUT} resize-none`}
                  />
                  <span className="absolute right-3 bottom-2.5 text-[10px] text-[#ABABAB]">
                    {description.length}/500
                  </span>
                </div>
              </FormField>

              {/* Status + Sort order */}
              <div className="flex items-end gap-8 flex-wrap">
                <div>
                  <p className={`${LABEL} mb-1.5`}>Estado</p>
                  <div className="flex items-center gap-2">
                    <Toggle checked={isActive} onChange={setIsActive} />
                    <span className="text-sm text-[#4A4A4A]">
                      {isActive ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>
                <div className="w-32">
                  <FormField
                    label="Orden"
                    hint="Menor número = aparece primero"
                  >
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Math.max(0, Number(e.target.value)))}
                      min={0}
                      className={INPUT}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="w-[300px] shrink-0 flex flex-col gap-4">
            {/* Image card */}
            <div className="bg-white border border-[#E8E2D8] p-5">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Imagen de la categoría</p>

              {currentImageSrc ? (
                <div className="relative">
                  <img
                    src={currentImageSrc}
                    alt="Vista previa"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  {previewUrl && (
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 w-6 h-6 bg-white border border-[#E8E2D8] rounded-full flex items-center justify-center text-[#6B6B6B] hover:text-[#DC2626] transition-colors text-sm leading-none"
                      aria-label="Quitar imagen nueva"
                    >
                      ×
                    </button>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-full text-xs text-center text-[#6B6B6B] hover:text-[#1A2B1C] transition-colors underline underline-offset-2"
                  >
                    Cambiar imagen
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-[#D0C8C0] p-6 text-center hover:border-[#1A2B1C] transition-colors cursor-pointer group rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex justify-center mb-2 text-[#ABABAB] group-hover:text-[#5A7A5C] transition-colors">
                    <UploadIcon />
                  </div>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">
                    Arrastrá y soltá una imagen aquí
                    <br />
                    <span className="text-[#3D6040]">o hacé clic para seleccionar</span>
                  </p>
                  <p className="text-[10px] text-[#ABABAB] mt-1.5">JPG, PNG o WebP. Máx 5 MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* Info card */}
            <div className="bg-white border border-[#E8E2D8] p-5">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Información</p>
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">Productos</span>
                  <span className="text-[#1A1A1A] font-medium tabular-nums">{productCount}</span>
                </div>
                <div className="pt-2 border-t border-[#E8E2D8]">
                  <div className="flex justify-between mb-2">
                    <span className="text-[#8A8A8A]">Creada</span>
                    <span className="text-[#1A1A1A]">
                      {createdAt ? formatDate(createdAt) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A8A8A]">Modificada</span>
                    <span className="text-[#1A1A1A]">
                      {updatedAt ? formatDate(updatedAt) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
