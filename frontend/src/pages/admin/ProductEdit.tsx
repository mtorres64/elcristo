import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { productService } from "../../services/product.service";
import { useCategories } from "../../hooks/useCategories";
import toast from "react-hot-toast";

/* ─── Types ──────────────────────────────────────────────────── */
type Tab = "general" | "variantes" | "imagenes" | "seo";


const CARE_OPTIONS: Record<string, string[]> = {
  Luz: [
    "Luz directa intensa",
    "Luz brillante indirecta",
    "Luz brillante indirecta, tolera sombra parcial",
    "Luz indirecta moderada",
    "Sombra parcial",
    "Sombra total",
  ],
  Riego: [
    "Abundante (casi diario)",
    "Frecuente en verano, reducir en invierno",
    "Moderado, dejar secar entre riegos",
    "Escaso, tolerante a la sequía",
    "Mínimo (cactus y suculentas)",
  ],
  Ambiente: [
    "Ambientes con buena ventilación",
    "Interior luminoso",
    "Interior con poca luz",
    "Exterior protegido",
    "Interior o exterior",
    "Alta humedad ambiental",
  ],
  Temperatura: [
    "5° - 15°C (resistente al frío)",
    "10° - 25°C (templado)",
    "15° - 35°C / Evitar heladas",
    "20° - 40°C (tropical)",
    "Resistente a heladas",
  ],
};

/* ─── Page ───────────────────────────────────────────────────── */
export function ProductEdit() {
  const { productId } = useParams<{ productId: string }>();
  const { categories: categoryList } = useCategories(100);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("general");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [tax, setTax] = useState("iva-21");
  const [stock, setStock] = useState(0);
  const [active, setActive] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [careLight, setCareLight] = useState("");
  const [careWater, setCareWater] = useState("");
  const [careEnv, setCareEnv] = useState("");
  const [careTemp, setCareTemp] = useState("");
  const [dimPot, setDimPot] = useState("");
  const [dimHeight, setDimHeight] = useState("");
  const [plantType, setPlantType] = useState("");
  const [growth, setGrowth] = useState("Medio");
  const [coverIndex, setCoverIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

  useEffect(() => {
    if (!productId) { setLoading(false); return; }
    setLoading(true);
    productService
      .getById(productId)
      .then((p) => {
        setName(p.title);
        setSku(p.sku ?? "");
        setCategory(p.category_id ?? "");
        setTags(p.tags ?? []);
        setPrice(p.price != null ? String(p.price / 100) : "");
        setPromoPrice(p.compare_at_price != null ? String(p.compare_at_price / 100) : "");
        setCurrency(p.currency ?? "ARS");
        setTax(p.tax ?? "iva-21");
        setStock(p.stock ?? 0);
        setActive(p.status === "active");
        setFeatured(p.is_featured ?? false);
        setWeight(p.weight_grams != null ? String(p.weight_grams / 1000) : "");
        setHeight(p.height_cm != null ? String(p.height_cm) : "");
        setShortDesc(p.short_description ?? "");
        setFullDesc(p.description ?? "");
        setCareLight(p.care?.light ?? p.care?.luz ?? "");
        setCareWater(p.care?.water ?? p.care?.riego ?? "");
        setCareEnv(p.care?.environment ?? p.care?.ambiente ?? "");
        setCareTemp(p.care?.temperature ?? p.care?.temperatura ?? "");
        setDimPot(p.attributes?.pot_diameter ?? p.attributes?.diametro_maceta ?? "");
        setDimHeight(p.attributes?.height_with_pot ?? p.attributes?.altura_con_maceta ?? "");
        setPlantType(p.attributes?.plant_type ?? p.attributes?.tipo_planta ?? "");
        setGrowth(p.attributes?.growth ?? p.attributes?.crecimiento ?? "Medio");
        setImages(p.images ?? []);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  function addTag(value: string) {
    const v = value.trim();
    if (v && !tags.includes(v)) setTags((prev) => [...prev, v]);
  }
  function commitTag() {
    addTag(tagInput);
    setTagInput("");
  }
  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTag();
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }
  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }
  function removeImage(i: number) {
    if (!productId) {
      setPendingFiles((prev) => prev.filter((_, idx) => idx !== i));
    } else {
      setImages((prev) => prev.filter((_, idx) => idx !== i));
    }
    if (coverIndex === i) setCoverIndex(0);
    else if (coverIndex > i) setCoverIndex((c) => c - 1);
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    if (!productId) {
      setPendingFiles((prev) => [...prev, ...list]);
      return;
    }
    setUploadingCount((n) => n + list.length);
    await Promise.all(
      list.map(async (file) => {
        try {
          const url = await productService.uploadImage(productId, file);
          setImages((prev) => [...prev, url]);
        } catch {
          toast.error(`No se pudo subir ${file.name}`);
        } finally {
          setUploadingCount((n) => n - 1);
        }
      })
    );
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "general", label: "Información general" },
    { id: "variantes", label: "Variantes" },
    { id: "imagenes", label: "Imágenes" },
    { id: "seo", label: "SEO y visibilidad" },
  ];

  async function handleCreate(publish: boolean) {
    if (!name.trim()) { toast.error("El nombre del producto es obligatorio"); return; }
    if (!price || Number(price) <= 0) { toast.error("El precio debe ser mayor a 0"); return; }
    setSaving(true);
    try {
      const product = await productService.create({
        title: name.trim(),
        short_description: shortDesc || null,
        description: fullDesc || null,
        price: Math.round(Number(price) * 100),
        compare_at_price: promoPrice ? Math.round(Number(promoPrice) * 100) : null,
        currency,
        tax,
        category_id: category || null,
        stock,
        sku: sku || null,
        is_featured: featured,
        weight_grams: weight ? Math.round(Number(weight) * 1000) : null,
        height_cm: height ? Number(height) : null,
        tags,
        care: {
          ...(careLight && { light: careLight }),
          ...(careWater && { water: careWater }),
          ...(careEnv && { environment: careEnv }),
          ...(careTemp && { temperature: careTemp }),
        },
        attributes: {
          ...(dimPot && { pot_diameter: dimPot }),
          ...(dimHeight && { height_with_pot: dimHeight }),
          ...(plantType && { plant_type: plantType }),
          ...(growth && { growth }),
        },
      });
      const newId = product.product_id;
      if (pendingFiles.length > 0) {
        const ordered = coverIndex === 0
          ? pendingFiles
          : [pendingFiles[coverIndex], ...pendingFiles.filter((_, i) => i !== coverIndex)];
        await Promise.all(
          ordered.map(async (file) => {
            try { await productService.uploadImage(newId, file); }
            catch { toast.error(`No se pudo subir ${file.name}`); }
          })
        );
      }
      if (publish) await productService.updateById(newId, { status: "active" });
      toast.success(publish ? "Producto publicado" : "Borrador guardado");
      navigate(`/seller/products/${newId}/edit`);
    } catch {
      toast.error("No se pudo crear el producto");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(newStatus?: string) {
    if (!productId) return;
    setSaving(true);
    try {
      await productService.updateById(productId, {
        title: name,
        short_description: shortDesc || null,
        description: fullDesc || null,
        price: price ? Math.round(parseFloat(price) * 100) : undefined,
        compare_at_price: promoPrice ? Math.round(parseFloat(promoPrice) * 100) : null,
        currency,
        tax,
        category_id: category || null,
        stock,
        sku: sku || null,
        status: newStatus ?? (active ? "active" : "draft"),
        is_featured: featured,
        weight_grams: weight ? Math.round(parseFloat(weight) * 1000) : null,
        height_cm: height ? Math.round(parseFloat(height)) : null,
        tags,
        images: coverIndex === 0
          ? images
          : [images[coverIndex], ...images.filter((_, i) => i !== coverIndex)],
        care: {
          light: careLight,
          water: careWater,
          environment: careEnv,
          temperature: careTemp,
        },
        attributes: {
          pot_diameter: dimPot,
          height_with_pot: dimHeight,
          plant_type: plantType,
          growth,
        },
      });
      if (coverIndex !== 0) {
        setImages((prev) => [prev[coverIndex], ...prev.filter((_, i) => i !== coverIndex)]);
        setCoverIndex(0);
      }
      toast.success("Producto actualizado");
    } catch {
      toast.error("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="px-8 py-6 min-h-full flex items-center justify-center">
          <p className="font-serif text-lg text-[#8A8A8A]">Cargando producto…</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Mobile action bar */}
      <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3 flex items-center gap-3">
        <Link
          to="/seller/products"
          className="px-4 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white hover:bg-[#F9F8F5] transition-colors rounded-lg"
        >
          Cerrar
        </Link>
        <button
          onClick={() => productId ? handleSave() : handleCreate(true)}
          disabled={saving}
          className="flex-1 bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 hover:bg-[#253824] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando…" : productId ? "Guardar cambios" : "Publicar producto"}
        </button>
      </div>

      <div className="px-4 sm:px-8 py-6 min-h-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
          <Link to="/seller/products" className="hover:text-[#3D6040] transition-colors">
            Productos
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="text-[#1A1A1A] font-medium">
            {productId ? "Editar producto" : "Nuevo producto"}
          </span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">
              {productId ? (name || "Editar producto") : "Nuevo producto"}
            </h1>
            <p className="text-xs text-[#8A8A8A] mt-1">
              {productId ? "Modificá los datos del producto" : "Creá un nuevo producto para tu tienda"}
            </p>
          </div>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link
              to="/seller/products"
              className="px-4 py-2 border border-[#E8E2D8] rounded-lg text-sm text-[#4A4A4A] bg-white hover:bg-[#F9F8F5] transition-colors"
            >
              Cerrar
            </Link>
            <button
              onClick={() => productId ? handleSave("draft") : handleCreate(false)}
              disabled={saving}
              className="px-4 py-2 border border-[#C8C0B4] rounded-lg text-sm text-[#1A2B1C] font-medium bg-white hover:bg-[#F5F5F3] transition-colors disabled:opacity-50"
            >
              Guardar borrador
            </button>
            <button
              onClick={() => productId ? handleSave() : handleCreate(true)}
              disabled={saving}
              className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando…" : productId ? "Guardar cambios" : "Publicar producto"}
            </button>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          {/* ── Left column ───────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Card with tabs */}
            <div className="bg-white border border-[#E8E2D8] rounded-lg overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-[#E8E2D8] px-6">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`py-4 pr-6 text-sm transition-colors border-b-2 -mb-px ${
                      tab === t.id
                        ? "text-[#1A1A1A] font-semibold border-[#1A2B1C]"
                        : "text-[#8A8A8A] border-transparent hover:text-[#4A4A4A]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-6">
                {tab === "general" && (
                  <div className="flex flex-col gap-6">
                    {/* Row 1: Name + SKU */}
                    <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
                      <FormField label="Nombre del producto" required>
                        <div className="relative">
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={120}
                            className={INPUT}
                            placeholder="Ej: Ficus Lyrata Grande"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#ABABAB]">
                            {name.length}/120
                          </span>
                        </div>
                      </FormField>
                      <FormField label="SKU" required>
                        <input
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          className={INPUT}
                          placeholder="PLT-XXX-001"
                        />
                      </FormField>
                    </div>

                    {/* Row 2: Category + Tags */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Categoría" required>
                        <div className="relative">
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={SELECT}
                          >
                            <option value="">Sin categoría</option>
                            {categoryList.map((cat) => (
                              <option key={cat.category_id} value={cat.category_id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          <ChevronSelectIcon />
                        </div>
                      </FormField>
                      <FormField label="Etiquetas">
                        <div
                          className="flex flex-wrap items-center gap-1.5 border border-[#E8E2D8] rounded-lg px-2 py-1.5 min-h-[38px] bg-white focus-within:border-[#1A2B1C] transition-colors cursor-text"
                          onClick={() => tagInputRef.current?.focus()}
                        >
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="flex items-center gap-1 bg-[#F0EDE8] text-[#4A4A4A] text-xs px-2 py-0.5"
                            >
                              {t}
                              <button
                                onClick={(e) => { e.stopPropagation(); removeTag(t); }}
                                className="text-[#8A8A8A] hover:text-[#1A1A1A] leading-none"
                                aria-label={`Quitar etiqueta ${t}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <input
                            ref={tagInputRef}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            onBlur={commitTag}
                            placeholder={tags.length === 0 ? "Escribí y presioná Enter…" : ""}
                            className="flex-1 min-w-[80px] text-xs text-[#1A1A1A] outline-none placeholder-[#ABABAB] bg-transparent py-0.5"
                          />
                        </div>
                      </FormField>
                    </div>

                    {/* Row 3: Price + Promo + Currency + Tax + Stock */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <FormField label="Precio" required>
                        <PrefixInput prefix="$" value={price} onChange={setPrice} />
                      </FormField>
                      <FormField label="Precio promocional">
                        <div className="relative">
                          <PrefixInput prefix="$" value={promoPrice} onChange={setPromoPrice} />
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#DC2626] transition-colors"
                            aria-label="Quitar precio promocional"
                            onClick={() => setPromoPrice("")}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </FormField>
                      <FormField label="Moneda">
                        <div className="relative">
                          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={SELECT}>
                            <option value="ARS">ARS</option>
                            <option value="USD">USD</option>
                          </select>
                          <ChevronSelectIcon />
                        </div>
                      </FormField>
                      <FormField label="Impuesto">
                        <div className="relative">
                          <select value={tax} onChange={(e) => setTax(e.target.value)} className={SELECT}>
                            <option value="iva-21">21% - IVA</option>
                            <option value="iva-10">10,5% - IVA</option>
                            <option value="exento">Exento</option>
                          </select>
                          <ChevronSelectIcon />
                        </div>
                      </FormField>
                      <FormField label="Stock" required>
                        <div className="flex border border-[#E8E2D8] rounded-lg overflow-hidden">
                          <input
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(Number(e.target.value))}
                            min={0}
                            className="flex-1 min-w-0 px-3 py-2 text-sm text-[#1A1A1A] bg-white outline-none"
                          />
                          <div className="flex flex-col border-l border-[#E8E2D8]">
                            <button
                              onClick={() => setStock((s) => s + 1)}
                              className="flex-1 px-2 hover:bg-[#F5F5F3] transition-colors flex items-center"
                              aria-label="Incrementar"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M18 15l-6-6-6 6" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setStock((s) => Math.max(0, s - 1))}
                              className="flex-1 px-2 hover:bg-[#F5F5F3] transition-colors border-t border-[#E8E2D8] flex items-center"
                              aria-label="Decrementar"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </FormField>
                    </div>

                    {/* Row 4: Estado + Destacado + Weight + Height */}
                    <div className="flex items-end gap-5 flex-wrap">
                      <div>
                        <p className={LABEL}>Estado</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Toggle checked={active} onChange={setActive} />
                          <span className="text-sm text-[#4A4A4A]">{active ? "Activo" : "Inactivo"}</span>
                        </div>
                      </div>
                      <div>
                        <p className={LABEL}>Destacado</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Toggle checked={featured} onChange={setFeatured} />
                          <span className="text-sm text-[#4A4A4A]">{featured ? "Sí" : "No"}</span>
                        </div>
                      </div>
                      <div className="w-24">
                        <FormField label="Peso (kg)">
                          <input value={weight} onChange={(e) => setWeight(e.target.value)} className={INPUT} />
                        </FormField>
                      </div>
                      <div className="w-24">
                        <FormField label="Altura (cm)">
                          <input value={height} onChange={(e) => setHeight(e.target.value)} className={INPUT} />
                        </FormField>
                      </div>
                    </div>

                    {/* Descripción corta */}
                    <FormField label="Descripción corta" required>
                      <div className="relative">
                        <textarea
                          value={shortDesc}
                          onChange={(e) => setShortDesc(e.target.value)}
                          maxLength={160}
                          rows={3}
                          className={`${INPUT} resize-none`}
                          placeholder="Descripción breve que aparece en los listados..."
                        />
                        <span className="absolute right-3 bottom-2.5 text-[10px] text-[#ABABAB]">
                          {shortDesc.length}/160
                        </span>
                      </div>
                    </FormField>

                    {/* Descripción completa */}
                    <FormField label="Descripción completa">
                      <div className="border border-[#E8E2D8] rounded-lg overflow-hidden">
                        {/* Toolbar */}
                        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[#E8E2D8] flex-wrap">
                          <select className="text-xs border border-[#E8E2D8] rounded px-2 py-1 text-[#4A4A4A] outline-none mr-2 bg-white">
                            <option>Párrafo</option>
                            <option>Título 1</option>
                            <option>Título 2</option>
                          </select>
                          {[
                            { label: "B", title: "Negrita", style: "font-bold" },
                            { label: "I", title: "Cursiva", style: "italic" },
                            { label: "U", title: "Subrayado", style: "underline" },
                          ].map((b) => (
                            <ToolbarBtn key={b.label} title={b.title}>
                              <span className={b.style}>{b.label}</span>
                            </ToolbarBtn>
                          ))}
                          <div className="w-px h-4 bg-[#E8E2D8] mx-1" />
                          <ToolbarBtn title="Lista con viñetas">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
                              <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
                              <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
                              <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
                            </svg>
                          </ToolbarBtn>
                          <ToolbarBtn title="Lista numerada">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
                              <path d="M4 6h1v4" /><path d="M4 10h2" />
                              <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
                            </svg>
                          </ToolbarBtn>
                          <div className="w-px h-4 bg-[#E8E2D8] mx-1" />
                          {["left", "center", "right"].map((a) => (
                            <ToolbarBtn key={a} title={`Alinear ${a}`}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {a === "left" && <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" /></>}
                                {a === "center" && <><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></>}
                                {a === "right" && <><line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" /></>}
                              </svg>
                            </ToolbarBtn>
                          ))}
                          <div className="w-px h-4 bg-[#E8E2D8] mx-1" />
                          <ToolbarBtn title="Link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                          </ToolbarBtn>
                          <ToolbarBtn title="Código">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                            </svg>
                          </ToolbarBtn>
                          <ToolbarBtn title="Imagen">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                          </ToolbarBtn>
                        </div>
                        {/* Editor area */}
                        <div className="relative">
                          <textarea
                            value={fullDesc}
                            onChange={(e) => setFullDesc(e.target.value)}
                            rows={7}
                            maxLength={3000}
                            className="w-full px-4 py-3 text-sm text-[#1A1A1A] bg-white outline-none resize-none leading-relaxed"
                            placeholder="Descripción detallada del producto..."
                          />
                          <span className="absolute right-3 bottom-2.5 text-[10px] text-[#ABABAB]">
                            {fullDesc.length}/3000
                          </span>
                        </div>
                      </div>
                    </FormField>

                    {/* Cuidados */}
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Cuidados</p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { icon: <SunIcon />, label: "Luz", value: careLight, onChange: setCareLight },
                          { icon: <WaterIcon />, label: "Riego", value: careWater, onChange: setCareWater },
                          { icon: <EnvIcon />, label: "Ambiente", value: careEnv, onChange: setCareEnv },
                          { icon: <TempIcon />, label: "Temperatura", value: careTemp, onChange: setCareTemp },
                        ].map((c) => (
                          <div
                            key={c.label}
                            className={`border rounded-lg p-3 transition-colors ${
                              c.value ? "border-[#5A7A5C] bg-[#F0F5F0]" : "border-[#E8E2D8]"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[#5A7A5C]">{c.icon}</span>
                              <span className="text-xs font-semibold text-[#4A4A4A]">{c.label}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {CARE_OPTIONS[c.label]?.map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => c.onChange(c.value === opt ? "" : opt)}
                                  className={`text-[10px] px-2 py-0.5 border rounded-full transition-colors leading-relaxed ${
                                    c.value === opt
                                      ? "border-[#3D6040] bg-[#3D6040] text-white"
                                      : "border-[#E8E2D8] text-[#6B6B6B] hover:border-[#5A7A5C] hover:text-[#3D6040]"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                            <input
                              value={c.value}
                              onChange={(e) => c.onChange(e.target.value)}
                              placeholder="Personalizado..."
                              className="w-full text-xs text-[#6B6B6B] bg-transparent outline-none border-b border-[#E8E2D8] pb-0.5 placeholder:text-[#C0B8B0]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dimensiones */}
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A] mb-4">
                        Dimensiones y características
                      </p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField label="Diámetro de maceta">
                          <input value={dimPot} onChange={(e) => setDimPot(e.target.value)} className={INPUT} />
                        </FormField>
                        <FormField label="Altura con maceta">
                          <input value={dimHeight} onChange={(e) => setDimHeight(e.target.value)} className={INPUT} />
                        </FormField>
                        <FormField label="Tipo de planta">
                          <input value={plantType} onChange={(e) => setPlantType(e.target.value)} className={INPUT} />
                        </FormField>
                        <FormField label="Crecimiento">
                          <div className="relative">
                            <select value={growth} onChange={(e) => setGrowth(e.target.value)} className={SELECT}>
                              <option>Lento</option>
                              <option>Medio</option>
                              <option>Rápido</option>
                            </select>
                            <ChevronSelectIcon />
                          </div>
                        </FormField>
                      </div>
                    </div>
                  </div>
                )}

                {tab !== "general" && (
                  <div className="py-12 text-center">
                    <p className="font-serif text-lg text-[#8A8A8A]">
                      {TABS.find((t) => t.id === tab)?.label} — próximamente
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column ──────────────────────────────────── */}
          <div className="w-full lg:w-[420px] shrink-0 flex flex-col gap-4">
            {/* Images card */}
            <div className="bg-white border border-[#E8E2D8] rounded-lg p-5">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Imágenes del producto</p>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />

              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-[#D0C8C0] rounded-lg p-6 text-center mb-4 hover:border-[#1A2B1C] transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="flex justify-center mb-2 text-[#ABABAB] group-hover:text-[#5A7A5C] transition-colors">
                  {uploadingCount > 0 ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-spin">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : (
                    <UploadIcon />
                  )}
                </div>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  {uploadingCount > 0
                    ? `Subiendo ${uploadingCount} imagen${uploadingCount > 1 ? "es" : ""}…`
                    : <>Arrastrá y soltá imágenes aquí<br /><span className="text-[#3D6040]">o hacé clic para seleccionar</span></>
                  }
                </p>
                <p className="text-[10px] text-[#ABABAB] mt-1.5">
                  Formato recomendado: 1:1 o 4:5. Máx 5MB
                </p>
              </div>

              {/* Thumbnails */}
              {(productId ? images : pendingFiles).length > 0 && (
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {productId
                    ? images.map((url, i) => (
                        <div key={url} className="relative group">
                          <div
                            className="aspect-square bg-[#F0EDE8] rounded-lg overflow-hidden cursor-pointer"
                            onClick={() => setCoverIndex(i)}
                          >
                            <img
                              src={url.startsWith("/uploads") ? `${API_BASE}${url}` : url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {i === coverIndex && (
                            <span className="absolute bottom-0 left-0 right-0 bg-[#1A2B1C] text-white text-[8px] font-bold text-center py-0.5">
                              Portada
                            </span>
                          )}
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-white border border-[#E8E2D8] text-[#6B6B6B] hover:text-[#DC2626] text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Quitar imagen"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    : pendingFiles.map((file, i) => {
                        const src = URL.createObjectURL(file);
                        return (
                          <div key={i} className="relative group">
                            <img
                              src={src}
                              alt={file.name}
                              onLoad={() => URL.revokeObjectURL(src)}
                              className="aspect-square w-full object-cover rounded-lg cursor-pointer"
                              onClick={() => setCoverIndex(i)}
                            />
                            {i === coverIndex && (
                              <span className="absolute bottom-0 left-0 right-0 bg-[#1A2B1C] text-white text-[8px] font-bold text-center py-0.5">
                                Portada
                              </span>
                            )}
                            <button
                              onClick={() => removeImage(i)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-white border border-[#E8E2D8] text-[#6B6B6B] hover:text-[#DC2626] text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Quitar imagen"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })
                  }
                </div>
              )}
              {(productId ? images : pendingFiles).length > 0 && (
                <p className="text-[10px] text-[#ABABAB] text-center">Clic en una imagen para elegir portada</p>
              )}
            </div>

            {/* Preview card */}
            <div className="bg-white border border-[#E8E2D8] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-[#1A1A1A]">Vista previa en tienda</p>
                {productId && (
                  <Link
                    to={`/products/${productId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[#3D6040] hover:text-[#1A2B1C] transition-colors"
                  >
                    Ver página
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </Link>
                )}
              </div>
              <div className="border border-[#E8E2D8] rounded-lg overflow-hidden">
                <div className="aspect-[4/3] bg-gradient-to-br from-[#C8D8C0] to-[#A8BCA0] flex items-center justify-center overflow-hidden">
                  {productId && images[coverIndex] ? (
                    <img
                      src={images[coverIndex].startsWith("/uploads") ? `${API_BASE}${images[coverIndex]}` : images[coverIndex]}
                      alt="Portada"
                      className="w-full h-full object-cover"
                    />
                  ) : !productId && pendingFiles[coverIndex] ? (
                    <img
                      src={URL.createObjectURL(pendingFiles[coverIndex])}
                      alt="Portada"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PlantPreviewIcon />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-serif text-base font-normal text-[#1A1A1A] leading-tight">
                    {name || <span className="text-[#ABABAB]">Nombre del producto</span>}
                  </p>
                  {plantType && <p className="text-[10px] text-[#6B6B6B] mb-2">{plantType}</p>}
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {price ? (
                      <span className="text-sm font-bold text-[#1A1A1A]">${price}</span>
                    ) : (
                      <span className="text-sm text-[#ABABAB]">$ —</span>
                    )}
                    {promoPrice && price && (
                      <span className="text-[10px] text-[#ABABAB] line-through">${promoPrice}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mb-3">
                    {[
                      { icon: <PreviewSunIcon />, text: careLight, placeholder: "Luz" },
                      { icon: <PreviewWaterIcon />, text: careWater, placeholder: "Riego" },
                      { icon: <PreviewEnvIcon />, text: careEnv, placeholder: "Ambiente" },
                    ].map((row) => (
                      <div key={row.placeholder} className="flex items-center gap-1.5">
                        <span className="text-[#5A7A5C] shrink-0">{row.icon}</span>
                        <span className={`text-[10px] truncate ${row.text ? "text-[#6B6B6B]" : "text-[#CCCCCC]"}`}>
                          {row.text || row.placeholder}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full bg-[#1A2B1C] text-white text-[10px] font-semibold uppercase tracking-widest py-2 rounded-lg">
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </div>

            {/* Info card */}
            <div className="bg-white border border-[#E8E2D8] rounded-lg p-5">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Información adicional</p>
              <div className="flex flex-col gap-3 text-xs">
                {productId && (
                  <div className="flex justify-between">
                    <span className="text-[#8A8A8A]">ID del producto</span>
                    <span className="text-[#ABABAB] font-mono">{productId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">Estado actual</span>
                  <span className={`font-medium ${active ? "text-[#2D6A4F]" : "text-[#6B6B6B]"}`}>
                    {productId ? (active ? "Activo" : "Inactivo") : "Borrador (nuevo)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ─── Shared helpers ─────────────────────────────────────────── */

const INPUT =
  "w-full border border-[#E8E2D8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";
const SELECT =
  "w-full border border-[#E8E2D8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors appearance-none cursor-pointer pr-8";
const LABEL = "text-xs font-medium text-[#6B6B6B]";

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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

function PrefixInput({ prefix, value, onChange }: { prefix: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex border border-[#E8E2D8] rounded-lg overflow-hidden focus-within:border-[#1A2B1C] transition-colors">
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

function ToolbarBtn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <button
      title={title}
      className="w-7 h-7 flex items-center justify-center text-[#4A4A4A] hover:bg-[#F5F5F3] transition-colors text-xs"
    >
      {children}
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

function PlantPreviewIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 64 64" fill="currentColor" className="text-white opacity-30">
      <path d="M32 56 C28 44 22 32 32 12 C42 32 36 44 32 56Z" />
      <path d="M32 56 C24 46 14 36 12 22 C22 32 30 44 32 56Z" opacity="0.7" />
      <path d="M32 56 C40 46 50 36 52 22 C42 32 34 44 32 56Z" opacity="0.7" />
      <rect x="30" y="50" width="4" height="10" rx="2" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function smallIcon(d: string) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d={d} />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function WaterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function EnvIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function TempIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}

function PreviewSunIcon() { return smallIcon("M12 8a4 4 0 0 1 0 8m0-8a4 4 0 0 0 0 8m0-8V4m0 16v-4m-4-4H4m16 0h-4"); }
function PreviewWaterIcon() { return smallIcon("M12 2.69l3.77 3.77a5.33 5.33 0 1 1-7.54 0z"); }
function PreviewEnvIcon() { return smallIcon("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"); }
