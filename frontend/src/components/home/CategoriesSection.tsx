import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCategories } from "../../hooks/useCategories";
import { CATEGORY_GROUPS, CATEGORY_GROUP_LABEL, type CategoryGroup } from "../../types/category";
import { CategoryCard } from "../categories/CategoryCard";
import { productService } from "../../services/product.service";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function resolveImageUrl(src: string): string {
  return src.startsWith("/") ? `${API_BASE}${src}` : src;
}

/**
 * Ocupa el lugar de una 5ta categoría cuando la sección tiene menos de 5 —
 * en vez de dejar un hueco vacío en la grilla de lg:grid-cols-5, muestra un
 * producto destacado de esa sección. Si no hay ninguno destacado ahí, no
 * renderiza nada (deja el hueco como estaba, en vez de una tarjeta rota).
 */
function FeaturedGroupTile({ group }: { group: CategoryGroup }) {
  const { data } = useQuery({
    queryKey: ["products", "home-featured-tile", group],
    queryFn: () =>
      productService.list({
        category_group: group,
        featured: true,
        status: "active",
        product_type: "simple",
        page_size: 1,
        sort: "featured",
      }),
  });

  const product = data?.items[0];
  if (!product) return null;

  return (
    <Link
      to={`/products?group=${group}&sort=featured`}
      className="group relative overflow-hidden aspect-[2/3] rounded-[8px] block"
    >
      {product.image_url ? (
        <img
          src={resolveImageUrl(product.image_url)}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-forest-accent to-forest-deep" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-12 pb-4 px-4">
        <p className="text-[#D4A017] text-[10px] font-bold uppercase tracking-widest mb-1">
          ★ Destacado
        </p>
        <p className="text-white text-sm font-semibold leading-tight tracking-wide">
          {CATEGORY_GROUP_LABEL[group]} destacadas
        </p>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse aspect-[2/3] rounded-[8px] bg-gradient-to-br from-[#D4DDD2] to-[#C0CCB8]" />
  );
}

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function CategoriesSection() {
  const { categories, loading } = useCategories(100);

  if (!loading && categories.length === 0) return null;

  return (
    <section className="bg-cream py-14">
      <div className="max-w-screen-xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <h2 className="section-title">Nuestras Categorías</h2>
          <Link to="/categories" className="link-arrow">
            Ver Todas
            <ArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {CATEGORY_GROUPS.map((g) => {
              const items = categories.filter((c) => c.group === g.value);
              if (items.length === 0) return null;
              return (
                <div key={g.value}>
                  <Link
                    to={`/products?group=${g.value}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A2B1C] hover:text-forest-accent transition-colors mb-4"
                  >
                    {g.label}
                    <ArrowRight />
                  </Link>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {items.map((cat, i) => (
                      <CategoryCard key={cat.category_id} category={cat} index={i} />
                    ))}
                    {/* Menos de 5 categorías en esta sección: en vez de dejar
                        el hueco de lg:grid-cols-5 vacío, se aprovecha para
                        mostrar un producto destacado de la sección. */}
                    {items.length < 5 && <FeaturedGroupTile group={g.value} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
