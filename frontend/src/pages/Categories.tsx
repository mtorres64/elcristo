import { Layout } from "../components/layout/Layout";
import { CategoryCard } from "../components/categories/CategoryCard";
import { ProductsCarousel } from "../components/home/ProductsCarousel";
import { useCategories } from "../hooks/useCategories";
import { CATEGORY_GROUPS } from "../types/category";

function SkeletonCard() {
  return (
    <div className="animate-pulse aspect-[2/3] rounded-[8px] bg-gradient-to-br from-[#D4DDD2] to-[#C0CCB8]" />
  );
}

export function Categories() {
  const { categories, loading } = useCategories(100);

  return (
    <Layout>
      <section className="bg-cream py-14">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="mb-10">
            <h1 className="font-serif text-4xl text-[#1A2B1C] mb-2">Todas las Categorías</h1>
            <p className="text-[#6B6B6B] text-sm">
              Explorá nuestra colección completa y encontrá lo que tu jardín necesita.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {CATEGORY_GROUPS.map((g) => {
                const items = categories.filter((c) => c.group === g.value);
                if (items.length === 0) return null;
                return (
                  <div key={g.value}>
                    <h2 className="font-serif text-2xl text-[#1A2B1C] mb-5">{g.label}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {items.map((cat, i) => (
                        <CategoryCard key={cat.category_id} category={cat} index={i} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ProductsCarousel />
    </Layout>
  );
}
