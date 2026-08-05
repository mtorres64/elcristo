import { Layout } from "../components/layout/Layout";
import { CategoryCard } from "../components/categories/CategoryCard";
import { ProductsCarousel } from "../components/home/ProductsCarousel";
import { useCategories } from "../hooks/useCategories";

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
              Explorá nuestra colección completa y encontrá la planta perfecta para vos.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
              : categories.map((cat, i) => (
                  <CategoryCard key={cat.category_id} category={cat} index={i} />
                ))}
          </div>
        </div>
      </section>

      <ProductsCarousel />
    </Layout>
  );
}
