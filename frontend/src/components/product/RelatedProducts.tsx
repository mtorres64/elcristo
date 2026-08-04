import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";

const RELATED = [
  { id: "monstera-1", name: "Monstera Deliciosa", price: 2870000, bg: "from-[#CCE0C0] to-[#9AB890]" },
  { id: "sansevieria-1", name: "Sansevieria Laurentii", price: 1830000, bg: "from-[#C8D8C0] to-[#A8BCA0]" },
  { id: "zamioculca-1", name: "Zamioculca Zamifolia", price: 2190000, bg: "from-[#D4DFD0] to-[#B8CAB2]" },
  { id: "poto-1", name: "Poto Colgante", price: 1280000, bg: "from-[#C0D8D0] to-[#90B8B0]" },
  { id: "lavanda-1", name: "Lavanda", price: 990000, bg: "from-[#D8D0E8] to-[#B0A8C8]" },
];

const CARD_WIDTH = 236;
const VISIBLE = 4;

export function RelatedProducts() {
  const [offset, setOffset] = useState(0);
  const maxOffset = Math.max(0, RELATED.length - VISIBLE);

  return (
    <section className="bg-cream py-14">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">También te puede interesar</h2>
          <Link to="/products" className="link-arrow">
            Ver más plantas
            <ArrowRight />
          </Link>
        </div>

        <div className="relative">
          <button
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#DDD6CC] shadow-sm flex items-center justify-center text-[#1A2B1C] hover:border-[#1A2B1C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="overflow-hidden">
            <div
              className="flex gap-4 transition-transform duration-400 ease-out"
              style={{ transform: `translateX(-${offset * (CARD_WIDTH + 16)}px)` }}
            >
              {RELATED.map((product) => (
                <RelatedCard key={product.id} product={product} />
              ))}
            </div>
          </div>

          <button
            onClick={() => setOffset((o) => Math.min(maxOffset, o + 1))}
            disabled={offset >= maxOffset}
            className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#DDD6CC] shadow-sm flex items-center justify-center text-[#1A2B1C] hover:border-[#1A2B1C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Siguiente"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

function RelatedCard({ product }: { product: (typeof RELATED)[0] }) {
  const { addItem } = useCart();

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      product_id: product.id,
      tenant_id: "vivero-el-cristo",
      title: product.name,
      price_snapshot: product.price,
      image_url: null,
    });
  }

  return (
    <Link to={`/products/${product.id}`} className="flex-shrink-0 w-[220px] group block">
      <div
        className={`w-full aspect-square bg-gradient-to-br ${product.bg} mb-3 relative overflow-hidden`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <PlantPlaceholder />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-1 group-hover:text-forest-deep transition-colors leading-tight">
          {product.name}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-[#1A1A1A]">{formatPrice(product.price)}</p>
            <p className="text-[10px] text-[#8A8A8A] mt-0.5">6 cuotas sin interés</p>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-8 h-8 border border-[#C8C0B4] text-[#5A5A5A] flex items-center justify-center hover:border-forest-deep hover:text-forest-deep hover:bg-white transition-colors shrink-0"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}

function PlantPlaceholder() {
  return (
    <svg className="w-20 h-20 text-white opacity-30" viewBox="0 0 64 64" fill="currentColor">
      <path d="M32 56 C28 44 22 32 32 12 C42 32 36 44 32 56Z" />
      <path d="M32 56 C24 46 14 36 12 22 C22 32 30 44 32 56Z" opacity="0.7" />
      <path d="M32 56 C40 46 50 36 52 22 C42 32 34 44 32 56Z" opacity="0.7" />
      <rect x="30" y="50" width="4" height="10" rx="2" />
    </svg>
  );
}

function formatPrice(centavos: number): string {
  const pesos = centavos / 100;
  return `$${pesos.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
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
