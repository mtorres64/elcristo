import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { PotPicker } from "../../components/admin/PotPicker";
import { productService } from "../../services/product.service";
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
export function ProductNew() {
  const [tab, setTab] = useState<Tab>("general");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [stock, setStock] = useState(0);
  const [priceChica, setPriceChica] = useState("");
  const [promoChica, setPromoChica] = useState("");
  const [stockChica, setStockChica] = useState(0);
  const [weightChica, setWeightChica] = useState("");
  const [heightChica, setHeightChica] = useState("");
  const [activeChica, setActiveChica] = useState(true);
  const [potsChica, setPotsChica] = useState<string[]>([]);
  const [priceGrande, setPriceGrande] = useState("");
  const [promoGrande, setPromoGrande] = useState("");
  const [stockGrande, setStockGrande] = useState(0);
  const [weightGrande, setWeightGrande] = useState("");
  const [heightGrande, setHeightGrande] = useState("");
  const [activeGrande, setActiveGrande] = useState(true);
  const [potsGrande, setPotsGrande] = useState<string[]>([]);
  const currency = "ARS";
  const tax = "iva-21";
  const [active, setActive] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [publishDate] = useState("");
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
  const [recommendedPotIds, setRecommendedPotIds] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
    setPendingFiles((prev) => prev.filter((_, idx) => idx !== i));
    if (coverIndex === i) setCoverIndex(0);
    else if (coverIndex > i) setCoverIndex((c) => c - 1);
  }

  function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setPendingFiles((prev) => [...prev, ...list]);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function buildSizeVariants() {
    return [
      {
        key: "size",
        value: "pequeña",
        stock: stockChica,
        price_override: priceChica ? Math.round(Number(priceChica) * 100) : null,
        compare_at_price_override: promoChica ? Math.round(Number(promoChica) * 100) : null,
        weight_grams_override: weightChica ? Math.round(Number(weightChica) * 1000) : null,
        height_cm_override: heightChica ? Number(heightChica) : null,
        active: activeChica,
        recommended_pot_ids: potsChica,
      },
      {
        key: "size",
        value: "grande",
        stock: stockGrande,
        price_override: priceGrande ? Math.round(Number(priceGrande) * 100) : null,
        compare_at_price_override: promoGrande ? Math.round(Number(promoGrande) * 100) : null,
        weight_grams_override: weightGrande ? Math.round(Number(weightGrande) * 1000) : null,
        height_cm_override: heightGrande ? Number(heightGrande) : null,
        active: activeGrande,
        recommended_pot_ids: potsGrande,
      },
    ];
  }

  async function handleSubmit(publish: boolean) {
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
        variants: buildSizeVariants(),
        recommended_pot_ids: recommendedPotIds,
      });
      const productId = product.product_id;
      if (pendingFiles.length > 0) {
        await Promise.all(
          pendingFiles.map(async (file) => {
            try { await productService.uploadImage(productId, file); }
            catch { toast.error(`No se pudo subir ${file.name}`); }
          })
        );
      }
      if (publish) {
        await productService.updateById(productId, { status: "active" });
      }
      toast.success(publish ? "Producto publicado" : "Borrador guardado");
      navigate(`/seller/products/${productId}/edit`);
    } catch {
      toast.error("No se pudo crear el producto");
    } finally {
      setSaving(false);
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "general", label: "Información general" },
    { id: "variantes", label: "Variantes" },
    { id: "imagenes", label: "Imágenes" },
    { id: "seo", label: "SEO y visibilidad" },
  ];

  return (
    <AdminLayout>
      {/* Mobile action bar */}
      <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3 flex items-center gap-3">
        <Link
          to="/seller/products"
          className="px-4 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white hover:bg-[#F9F8F5] transition-colors rounded-lg"
        >
          Cancelar
        </Link>
        <button
          onClick={() => handleSubmit(true)}
          disabled={saving}
          className="flex-1 bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 hover:bg-[#253824] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Publicar producto"}
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
          <span className="text-[#1A1A1A] font-medium">Nuevo producto</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">
              Nuevo producto
            </h1>
            <p className="text-xs text-[#8A8A8A] mt-1">Creá un nuevo producto para tu tienda</p>
          </div>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link
              to="/seller/products"
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
              {saving ? "Guardando…" : "Publicar producto"}
            </button>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          {/* ── Left column ───────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Card with tabs */}
            <div className="bg-white border-y sm:border border-[#E8E2D8] -mx-4 sm:mx-0">
              {/* Tabs */}
              <div className="flex overflow-x-auto border-b border-[#E8E2D8] px-6">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`py-4 pr-6 text-sm whitespace-nowrap shrink-0 transition-colors border-b-2 -mb-px rounded-none ${
                      t.id === "imagenes" || t.id === "seo" ? "lg:hidden" : ""
                    } ${
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
                            <option value="plantas-interior">Plantas de interior</option>
                            <option value="plantas-exterior">Plantas de exterior</option>
                            <option value="cactus">Cactus y suculentas</option>
                            <option value="arboles">Árboles ornamentales</option>
                          </select>
                          <ChevronSelectIcon />
                        </div>
                      </FormField>
                      <FormField label="Etiquetas">
                        <div
                          className="flex flex-wrap items-center gap-1.5 border border-[#E8E2D8] px-2 py-1.5 min-h-[38px] bg-white focus-within:border-[#1A2B1C] transition-colors cursor-text"
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

                    {/* Row 3: Destacado + Date */}
                    <div className="flex items-end gap-5 flex-wrap">
                      <div>
                        <p className={LABEL}>Destacado</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Toggle checked={featured} onChange={setFeatured} />
                          <span className="text-sm text-[#4A4A4A]">{featured ? "Sí" : "No"}</span>
                        </div>
                      </div>
                      <div>
                        <p className={LABEL}>Fecha de publicación</p>
                        <div className="flex items-center gap-2 border border-[#E8E2D8] px-3 py-2 bg-white mt-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[#8A8A8A] shrink-0">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span className="text-sm text-[#4A4A4A]">{publishDate}</span>
                        </div>
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
                      <div className="relative">
                        <textarea
                          value={fullDesc}
                          onChange={(e) => setFullDesc(e.target.value)}
                          rows={7}
                          maxLength={3000}
                          className={`${INPUT} resize-none`}
                          placeholder="Descripción detallada del producto..."
                        />
                        <span className="absolute right-3 bottom-2.5 text-[10px] text-[#ABABAB]">
                          {fullDesc.length}/3000
                        </span>
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
                            className={`border p-3 transition-colors ${
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
                                  className={`text-[10px] px-2 py-0.5 border transition-colors leading-relaxed ${
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

                {tab === "variantes" && (
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A] mb-3">
                      Precio y stock por tamaño
                    </p>
                    <div className="flex flex-col gap-3">
                      <SizePricingRow
                        label="Planta chica (pequeña)"
                        price={priceChica}
                        setPrice={setPriceChica}
                        promo={promoChica}
                        setPromo={setPromoChica}
                        stock={stockChica}
                        setStock={setStockChica}
                        weight={weightChica}
                        setWeight={setWeightChica}
                        height={heightChica}
                        setHeight={setHeightChica}
                        active={activeChica}
                        setActive={setActiveChica}
                        pots={potsChica}
                        setPots={setPotsChica}
                      />
                      <SizePricingRow
                        label="Planta mediana"
                        price={price}
                        setPrice={setPrice}
                        promo={promoPrice}
                        setPromo={setPromoPrice}
                        stock={stock}
                        setStock={setStock}
                        weight={weight}
                        setWeight={setWeight}
                        height={height}
                        setHeight={setHeight}
                        active={active}
                        setActive={setActive}
                        pots={recommendedPotIds}
                        setPots={setRecommendedPotIds}
                        required
                      />
                      <SizePricingRow
                        label="Planta grande"
                        price={priceGrande}
                        setPrice={setPriceGrande}
                        promo={promoGrande}
                        setPromo={setPromoGrande}
                        stock={stockGrande}
                        setStock={setStockGrande}
                        weight={weightGrande}
                        setWeight={setWeightGrande}
                        height={heightGrande}
                        setHeight={setHeightGrande}
                        active={activeGrande}
                        setActive={setActiveGrande}
                        pots={potsGrande}
                        setPots={setPotsGrande}
                      />
                    </div>
                  </div>
                )}

                {tab === "imagenes" && (
                  <div className="lg:hidden">
                    <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Imágenes del producto</p>
                    <ProductImageUploader
                      pendingFiles={pendingFiles}
                      coverIndex={coverIndex}
                      onSelectCover={setCoverIndex}
                      onRemove={removeImage}
                      onFiles={handleFiles}
                      onDrop={handleDrop}
                    />
                  </div>
                )}

                {tab === "seo" && (
                  <div className="lg:hidden">
                    <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Vista previa en tienda</p>
                    <ProductPreviewCard
                      pendingFiles={pendingFiles}
                      coverIndex={coverIndex}
                      name={name}
                      plantType={plantType}
                      price={price}
                      promoPrice={promoPrice}
                      careLight={careLight}
                      careWater={careWater}
                      careEnv={careEnv}
                    />
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── Right column ──────────────────────────────────── */}
          <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4">
            {/* Images card (desktop only — en mobile vive en la solapa "Imágenes") */}
            <div className="hidden lg:block bg-white border border-[#E8E2D8] p-5">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Imágenes del producto</p>
              <ProductImageUploader
                pendingFiles={pendingFiles}
                coverIndex={coverIndex}
                onSelectCover={setCoverIndex}
                onRemove={removeImage}
                onFiles={handleFiles}
                onDrop={handleDrop}
              />
            </div>

            {/* Preview card (desktop only — en mobile vive en la solapa "SEO y visibilidad") */}
            <div className="hidden lg:block bg-white border border-[#E8E2D8] p-5">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Vista previa en tienda</p>
              <ProductPreviewCard
                pendingFiles={pendingFiles}
                coverIndex={coverIndex}
                name={name}
                plantType={plantType}
                price={price}
                promoPrice={promoPrice}
                careLight={careLight}
                careWater={careWater}
                careEnv={careEnv}
              />
            </div>

            {/* Info card */}
            <div className="bg-white border border-[#E8E2D8] p-5">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Información adicional</p>
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">Creado por</span>
                  <span className="text-[#1A1A1A] font-medium">Admin</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">Fecha de creación</span>
                  <span className="text-[#ABABAB] font-medium">—</span>
                </div>
                <div className="pt-2 border-t border-[#E8E2D8]">
                  <p className="text-[#8A8A8A] mb-0.5">Última modificación</p>
                  <p className="text-[#ABABAB] font-medium">—</p>
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
  "w-full border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";
const SELECT =
  "w-full border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors appearance-none cursor-pointer pr-8";
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

function ProductPreviewCard({
  pendingFiles,
  coverIndex,
  name,
  plantType,
  price,
  promoPrice,
  careLight,
  careWater,
  careEnv,
}: {
  pendingFiles: File[];
  coverIndex: number;
  name: string;
  plantType: string;
  price: string;
  promoPrice: string;
  careLight: string;
  careWater: string;
  careEnv: string;
}) {
  return (
    <div className="border border-[#E8E2D8]">
      <div className="aspect-[4/3] bg-gradient-to-br from-[#C8D8C0] to-[#A8BCA0] flex items-center justify-center overflow-hidden">
        {pendingFiles[coverIndex] ? (
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
        <p className="font-serif text-base font-normal text-[#1A1A1A] leading-tight">{name || <span className="text-[#ABABAB]">Nombre del producto</span>}</p>
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
        <button className="w-full bg-[#1A2B1C] text-white text-[10px] font-semibold uppercase tracking-widest py-2">
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}

function ProductImageUploader({
  pendingFiles,
  coverIndex,
  onSelectCover,
  onRemove,
  onFiles,
  onDrop,
}: {
  pendingFiles: File[];
  coverIndex: number;
  onSelectCover: (i: number) => void;
  onRemove: (i: number) => void;
  onFiles: (files: FileList | File[]) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Drop zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
      <div
        className="border-2 border-dashed border-[#D0C8C0] p-6 text-center mb-4 hover:border-[#1A2B1C] transition-colors cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="flex justify-center mb-2 text-[#ABABAB] group-hover:text-[#5A7A5C] transition-colors">
          <UploadIcon />
        </div>
        <p className="text-xs text-[#6B6B6B] leading-relaxed">
          Arrastrá y soltá imágenes aquí<br />
          <span className="text-[#3D6040]">o hacé clic para seleccionar</span>
        </p>
        <p className="text-[10px] text-[#ABABAB] mt-1.5">
          Formato recomendado: 1:1 o 4:5. Máx 5MB
        </p>
      </div>

      {/* Thumbnails */}
      {pendingFiles.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {pendingFiles.map((file, i) => {
            const src = URL.createObjectURL(file);
            return (
              <div key={i} className="relative group">
                <img
                  src={src}
                  alt={file.name}
                  onLoad={() => URL.revokeObjectURL(src)}
                  className="aspect-square w-full object-cover cursor-pointer"
                  onClick={() => onSelectCover(i)}
                />
                {i === coverIndex && (
                  <span className="absolute bottom-0 left-0 right-0 bg-[#1A2B1C] text-white text-[8px] font-bold text-center py-0.5">
                    Portada
                  </span>
                )}
                <button
                  onClick={() => onRemove(i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-white border border-[#E8E2D8] text-[#6B6B6B] hover:text-[#DC2626] text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Quitar imagen"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
      {pendingFiles.length > 0 && (
        <p className="text-[10px] text-[#ABABAB] text-center">Tocá para marcar como portada</p>
      )}
    </>
  );
}

function SizePricingRow({
  label,
  price,
  setPrice,
  promo,
  setPromo,
  stock,
  setStock,
  weight,
  setWeight,
  height,
  setHeight,
  active,
  setActive,
  pots,
  setPots,
  required,
}: {
  label: string;
  price: string;
  setPrice: (v: string) => void;
  promo: string;
  setPromo: (v: string) => void;
  stock: number;
  setStock: React.Dispatch<React.SetStateAction<number>>;
  weight: string;
  setWeight: (v: string) => void;
  height: string;
  setHeight: (v: string) => void;
  active: boolean;
  setActive: (v: boolean) => void;
  pots: string[];
  setPots: (v: string[]) => void;
  required?: boolean;
}) {
  return (
    <div className="border border-[#E8E2D8] p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-[#4A4A4A]">{label}</p>
        <div className="flex items-center gap-2">
          <Toggle checked={active} onChange={setActive} />
          <span className="text-xs text-[#4A4A4A]">{active ? "Activo" : "Inactivo"}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <FormField label="Precio" required={required}>
          <PrefixInput prefix="$" value={price} onChange={setPrice} />
        </FormField>
        <FormField label="Precio promocional">
          <div className="relative">
            <PrefixInput prefix="$" value={promo} onChange={setPromo} />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#DC2626] transition-colors"
              aria-label="Quitar precio promocional"
              onClick={() => setPromo("")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </FormField>
        <FormField label="Stock" required={required}>
          <div className="flex border border-[#E8E2D8]">
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
        <FormField label="Peso (kg)">
          <input value={weight} onChange={(e) => setWeight(e.target.value)} className={INPUT} />
        </FormField>
        <FormField label="Altura (cm)">
          <input value={height} onChange={(e) => setHeight(e.target.value)} className={INPUT} />
        </FormField>
      </div>
      <div className="mt-4 pt-4 border-t border-[#E8E2D8]">
        <PotPicker selectedIds={pots} onChange={setPots} />
      </div>
    </div>
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
