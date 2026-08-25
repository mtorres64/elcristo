import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { HeroCarouselSettings, emptySlide } from "./settings/HeroCarouselSettings";
import { contentService } from "../../services/content.service";
import { categoryService } from "../../services/category.service";
import { productService } from "../../services/product.service";
import type { HeroSlide } from "../../types/content";
import type { Category } from "../../types/category";
import type { ProductSummary } from "../../types/product";

/* ─── Secciones de configuración ────────────────────────────────
 * Botonera extensible: para sumar una nueva sección alcanza con
 * agregar una entrada acá y su componente correspondiente abajo.
 * Las páginas de contenido (Sobre Nosotros, Inspiración, Diseño &
 * Paisajismo) viven aparte, en /seller/content — acá solo apariencia. */
type SectionId = "hero";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "hero", label: "Carrusel principal" },
];

export function Settings() {
  const [section, setSection] = useState<SectionId>("hero");

  // Estado del carrusel hero. Vive acá (no en HeroCarouselSettings) para que
  // el botón "Guardar cambios" pueda salir tanto en la barra de acciones
  // desktop como en la barra sticky mobile de abajo, que se renderiza por
  // fuera (antes) del contenido con padding — el mismo patrón universal de
  // "barra de acción mobile sticky" que usan el resto de las páginas admin.
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);

  useEffect(() => {
    contentService
      .getHero()
      .then((data) => setSlides(data.slides))
      .catch(() => toast.error("No se pudo cargar el carrusel"))
      .finally(() => setLoading(false));
    categoryService.list({ page_size: 100, sort: "name_asc" }).then((r) => setCategories(r.items)).catch(() => {});
    productService.list({ page_size: 100 }).then((r) => setProducts(r.items)).catch(() => {});
  }, []);

  function patchSlide(index: number, patch: Partial<HeroSlide>) {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSlide() {
    setSlides((prev) => [...prev, emptySlide()]);
  }

  function removeSlide(index: number) {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSlide(index: number, dir: -1 | 1) {
    setSlides((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    const missing = slides.find((s) => !s.image_desktop);
    if (missing) {
      toast.error("Todos los slides necesitan una imagen de escritorio");
      return;
    }
    setSaving(true);
    try {
      const data = await contentService.updateHero(slides);
      setSlides(data.slides);
      toast.success("Carrusel actualizado");
    } catch {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      {/* Barra de acción mobile sticky — patrón universal en páginas admin:
          fija justo debajo del topbar, por fuera del padding de la página. */}
      {section === "hero" && (
        <div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3 flex items-center gap-3">
          <button
            onClick={addSlide}
            className="px-4 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white hover:bg-[#F9F8F5] transition-colors rounded-lg shrink-0"
          >
            + Slide
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}

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
        {section === "hero" && (
          <HeroCarouselSettings
            slides={slides}
            loading={loading}
            saving={saving}
            categories={categories}
            products={products}
            onAddSlide={addSlide}
            onSave={handleSave}
            onPatchSlide={patchSlide}
            onRemoveSlide={removeSlide}
            onMoveSlide={moveSlide}
          />
        )}
      </div>
    </AdminLayout>
  );
}
