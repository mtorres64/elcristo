import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { productService } from "../../services/product.service";
import { useCategories } from "../../hooks/useCategories";
import { formatARS } from "../../utils/currency";
import { ComboItemsPicker, comboItemDetailsToRows, type ComboItemRow } from "./ComboItemsPicker";
import type { ProductDetail } from "../../types/product";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const INPUT =
  "w-full border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";
const SELECT =
  "w-full border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors appearance-none cursor-pointer pr-8";
const LABEL = "text-xs font-medium text-[#6B6B6B]";

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={`${LABEL} block mb-1.5`}>
        {label}
        {required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function resolveImageUrl(src: string): string {
  return src.startsWith("/") ? `${API_BASE}${src}` : src;
}

/**
 * Formulario de alta/edición de combos, compartido por ComboNew y ComboEdit
 * (a diferencia de Productos, donde cada uno vive en su propio archivo: acá
 * el formulario es mucho más chico y prácticamente idéntico en ambos modos).
 */
export function ComboForm({ productId }: { productId?: string }) {
  const isEdit = !!productId;
  const navigate = useNavigate();
  const { categories } = useCategories(100);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [featured, setFeatured] = useState(false);
  const [items, setItems] = useState<ComboItemRow[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!productId) return;
    productService
      .getById(productId)
      .then((p: ProductDetail) => {
        setTitle(p.title);
        setCategory(p.category_id ?? "");
        setShortDesc(p.short_description ?? "");
        setFullDesc(p.description ?? "");
        setPrice(String(p.price / 100));
        setComparePrice(p.compare_at_price ? String(p.compare_at_price / 100) : "");
        setFeatured(p.is_featured);
        setItems(comboItemDetailsToRows(p.combo_items));
        setImages(p.images);
      })
      .catch(() => toast.error("No se pudo cargar el combo"))
      .finally(() => setLoading(false));
  }, [productId]);

  const componentsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const savings = price ? componentsTotal - Math.round(Number(price) * 100) : 0;

  function buildPayload() {
    return {
      title: title.trim(),
      short_description: shortDesc || null,
      description: fullDesc || null,
      price: Math.round(Number(price) * 100),
      compare_at_price: comparePrice ? Math.round(Number(comparePrice) * 100) : null,
      category_id: category || null,
      is_featured: featured,
      product_type: "combo" as const,
      combo_items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    };
  }

  function validate(): string | null {
    if (!title.trim()) return "El nombre del combo es obligatorio";
    if (!price || Number(price) <= 0) return "El precio del combo debe ser mayor a 0";
    if (items.length < 2) return "Un combo debe incluir al menos 2 productos";
    return null;
  }

  async function handleSubmit(publish: boolean) {
    const error = validate();
    if (error) { toast.error(error); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await productService.updateById(productId, {
          ...buildPayload(),
          status: publish ? "active" : "draft",
        });
        if (pendingFiles.length > 0) {
          await Promise.all(
            pendingFiles.map((file) =>
              productService.uploadImage(productId, file).catch(() => toast.error(`No se pudo subir ${file.name}`))
            )
          );
        }
        toast.success("Combo actualizado");
        navigate("/seller/combos");
      } else {
        const combo = await productService.create(buildPayload());
        if (pendingFiles.length > 0) {
          await Promise.all(
            pendingFiles.map((file) =>
              productService.uploadImage(combo.product_id, file).catch(() => toast.error(`No se pudo subir ${file.name}`))
            )
          );
        }
        if (publish) {
          await productService.updateById(combo.product_id, { status: "active" });
        }
        toast.success(publish ? "Combo publicado" : "Borrador guardado");
        navigate("/seller/combos");
      }
    } catch {
      toast.error("No se pudo guardar el combo");
    } finally {
      setSaving(false);
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;

    if (!isEdit) {
      setPendingFiles((prev) => [...prev, ...list]);
      return;
    }
    setUploading(true);
    for (const file of list) {
      try {
        const url = await productService.uploadImage(productId, file);
        setImages((prev) => [...prev, url]);
      } catch {
        toast.error(`No se pudo subir ${file.name}`);
      }
    }
    setUploading(false);
  }

  async function removeExistingImage(i: number) {
    const next = images.filter((_, idx) => idx !== i);
    setImages(next);
    if (isEdit) {
      try {
        await productService.updateById(productId, { images: next });
      } catch {
        toast.error("No se pudo quitar la imagen");
      }
    }
  }

  function removePendingFile(i: number) {
    setPendingFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  if (loading) {
    return <p className="px-4 sm:px-8 py-6 text-sm text-[#8A8A8A]">Cargando combo…</p>;
  }

  return (
    <>
    {/* Mobile action bar */}
    <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3 flex items-center gap-2">
      <Link
        to="/seller/combos"
        className="px-3 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white rounded-lg"
      >
        Cancelar
      </Link>
      <button
        onClick={() => handleSubmit(false)}
        disabled={saving}
        className="px-3 py-2 border border-[#C8C0B4] text-sm text-[#1A2B1C] font-medium bg-white rounded-lg disabled:opacity-50"
      >
        Borrador
      </button>
      <button
        onClick={() => handleSubmit(true)}
        disabled={saving}
        className="flex-1 bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-3 py-2.5 hover:bg-[#253824] transition-colors disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Publicar"}
      </button>
    </div>

    <div className="px-4 sm:px-8 py-6 min-h-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
        <Link to="/seller/combos" className="hover:text-[#3D6040] transition-colors">
          Combos
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="text-[#1A1A1A] font-medium">{isEdit ? "Editar combo" : "Nuevo combo"}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">
            {isEdit ? "Editar combo" : "Nuevo combo"}
          </h1>
          <p className="text-xs text-[#8A8A8A] mt-1">
            Armá una promoción combinando productos existentes a un precio especial
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Link
            to="/seller/combos"
            className="px-4 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white hover:bg-[#F9F8F5] transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="px-4 py-2 border border-[#C8C0B4] text-sm text-[#1A2B1C] font-medium bg-white hover:bg-[#F5F5F3] transition-colors disabled:opacity-50"
          >
            Guardar borrador
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 hover:bg-[#253824] transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Publicar combo"}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
        {/* Left column */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="bg-white border border-[#E8E2D8] p-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Nombre del combo" required>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                  className={INPUT}
                  placeholder="Ej: Combo Ficus + Maceta de cerámica"
                />
              </FormField>
              <FormField label="Categoría">
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={SELECT}>
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronSelectIcon />
                </div>
              </FormField>
            </div>

            <FormField label="Descripción corta">
              <textarea
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                maxLength={160}
                rows={2}
                className={`${INPUT} resize-none`}
                placeholder="Descripción breve que aparece en los listados..."
              />
            </FormField>

            <FormField label="Descripción completa">
              <textarea
                value={fullDesc}
                onChange={(e) => setFullDesc(e.target.value)}
                rows={5}
                maxLength={3000}
                className={`${INPUT} resize-none`}
                placeholder="Descripción detallada del combo..."
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Precio del combo" required>
                <PrefixInput prefix="$" value={price} onChange={setPrice} />
                {componentsTotal > 0 && (
                  <SuggestPriceHint
                    amount={componentsTotal}
                    current={price}
                    onUse={() => setPrice(String(componentsTotal / 100))}
                  />
                )}
              </FormField>
              <FormField label="Precio de comparación (tachado)">
                <PrefixInput prefix="$" value={comparePrice} onChange={setComparePrice} />
                {componentsTotal > 0 && (
                  <SuggestPriceHint
                    amount={componentsTotal}
                    current={comparePrice}
                    onUse={() => setComparePrice(String(componentsTotal / 100))}
                  />
                )}
              </FormField>
            </div>

            <div className="flex items-center gap-2">
              <Toggle checked={featured} onChange={setFeatured} />
              <span className="text-sm text-[#4A4A4A]">Combo destacado</span>
            </div>
          </div>

          <div className="bg-white border border-[#E8E2D8] p-6">
            <ComboItemsPicker items={items} onChange={setItems} excludeProductId={productId} />
          </div>
        </div>

        {/* Right column */}
        <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4">
          <div className="bg-white border border-[#E8E2D8] p-5">
            <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Imágenes del combo</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <div
              className="border-2 border-dashed border-[#D0C8C0] p-6 text-center mb-4 hover:border-[#1A2B1C] transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            >
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                {uploading ? "Subiendo…" : (
                  <>Arrastrá y soltá imágenes aquí<br /><span className="text-[#3D6040]">o hacé clic para seleccionar</span></>
                )}
              </p>
              <p className="text-[10px] text-[#ABABAB] mt-1.5">Máx 20MB por imagen — se redimensiona automáticamente</p>
            </div>

            {(images.length > 0 || pendingFiles.length > 0) && (
              <div className="grid grid-cols-4 gap-1.5">
                {images.map((url, i) => (
                  <div key={url} className="relative group">
                    <img src={resolveImageUrl(url)} alt="" className="aspect-square w-full object-cover" />
                    <button
                      onClick={() => removeExistingImage(i)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-white border border-[#E8E2D8] text-[#6B6B6B] hover:text-[#DC2626] text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Quitar imagen"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {pendingFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                      className="aspect-square w-full object-cover"
                    />
                    <button
                      onClick={() => removePendingFile(i)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-white border border-[#E8E2D8] text-[#6B6B6B] hover:text-[#DC2626] text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Quitar imagen"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="bg-white border border-[#E8E2D8] p-5">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-3">Resumen de precio</p>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">Suma de productos sueltos</span>
                  <span className="text-[#1A1A1A] font-medium tabular-nums">{formatARS(componentsTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">Precio del combo</span>
                  <span className="text-[#1A1A1A] font-medium tabular-nums">
                    {price ? formatARS(Math.round(Number(price) * 100)) : "—"}
                  </span>
                </div>
                {price && (
                  <div className="flex justify-between pt-2 border-t border-[#E8E2D8]">
                    <span className="text-[#8A8A8A]">Ahorro del cliente</span>
                    <span className={`font-semibold tabular-nums ${savings > 0 ? "text-[#2D6A4F]" : "text-[#DC2626]"}`}>
                      {formatARS(savings)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

function SuggestPriceHint({ amount, current, onUse }: { amount: number; current: string; onUse: () => void }) {
  const suggestedPesos = String(amount / 100);
  if (current === suggestedPesos) return null;
  return (
    <button
      type="button"
      onClick={onUse}
      className="mt-1 text-[11px] text-[#3D6040] hover:text-[#2D6A4F] hover:underline underline-offset-2 transition-colors"
    >
      Sugerido: {formatARS(amount)} (suma de los productos) · usar
    </button>
  );
}

function PrefixInput({ prefix, value, onChange }: { prefix: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex border border-[#E8E2D8] focus-within:border-[#1A2B1C] transition-colors">
      <span className="px-2.5 py-2 text-sm text-[#8A8A8A] bg-[#F9F8F5] border-r border-[#E8E2D8] shrink-0">
        {prefix}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 px-3 py-2 text-sm text-[#1A1A1A] bg-white outline-none"
      />
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${checked ? "bg-[#1A2B1C]" : "bg-[#D0D0D0]"}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
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
