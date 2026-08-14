import { Link } from "react-router-dom";
import type { Category } from "../../types/category";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// Gradientes de fallback, uno por posición, para cuando no hay foto
const GRADIENT_FALLBACKS = [
  "from-[#7A9B7C] to-[#4A7050]",
  "from-[#6B9E6B] to-[#3D6540]",
  "from-[#8AAB7A] to-[#567050]",
  "from-[#A0A878] to-[#706B44]",
  "from-[#A09080] to-[#705A50]",
];

function resolveUrl(src: string): string {
  return src.startsWith("/") ? `${API_BASE}${src}` : src;
}

function PlantIcon() {
  return <img src="/images/trans.png" alt="" className="w-16 h-auto opacity-40" />;
}

interface CategoryCardProps {
  category: Category;
  index?: number;
  linkTo?: string;
  className?: string;
}

export function CategoryCard({ category, index = 0, linkTo, className = "" }: CategoryCardProps) {
  const gradient = GRADIENT_FALLBACKS[index % GRADIENT_FALLBACKS.length];
  const href = linkTo ?? `/products?category=${category.slug}`;

  return (
    <Link
      to={href}
      className={`group relative overflow-hidden aspect-[2/3] rounded-[8px] block ${className}`}
    >
      {category.image_url ? (
        <img
          src={resolveUrl(category.image_url)}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <>
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-105`}
          />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_#fff_0%,_transparent_60%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <PlantIcon />
          </div>
        </>
      )}

      {/* Label */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-12 pb-4 px-4">
        <p className="text-white text-sm font-semibold leading-tight tracking-wide">
          {category.name}
        </p>
      </div>
    </Link>
  );
}
