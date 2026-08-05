import { Link } from "react-router-dom";
import { useCategories } from "../../hooks/useCategories";
import { CategoryCard } from "../categories/CategoryCard";

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
  const { categories, loading } = useCategories(5);

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

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : categories.map((cat, i) => (
                <CategoryCard key={cat.category_id} category={cat} index={i} />
              ))}
        </div>
      </div>
    </section>
  );
}
