import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useCart } from "../../hooks/useCart";
import { productService } from "../../services/product.service";
import type { ProductSummary } from "../../types/product";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function resolveUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

const BG_COLORS = [
  "from-[#D4DFD0] to-[#B8CAB2]",
  "from-[#C8D8C0] to-[#A8BCA0]",
  "from-[#CCE0C0] to-[#9AB890]",
  "from-[#D8D0E8] to-[#B0A8C8]",
  "from-[#D8D8C0] to-[#B0B090]",
  "from-[#D0D8C8] to-[#A8B8A0]",
  "from-[#C0D8C0] to-[#90B890]",
];

const CARD_WIDTH = 236;
const VISIBLE = 5;

export function ProductsCarousel() {
  // Scroll nativo del navegador en vez de un transform manejado por estado:
  // con `snap-x` el swipe tiene la física natural del dedo (momentum,
  // rubber-band) y siempre termina encajado en una tarjeta completa —
  // matemática de touch a mano no puede garantizar eso en cualquier ancho
  // de pantalla, el scroll nativo sí.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["products", "home"],
    queryFn: () => productService.list({ page_size: 20, sort: "featured" }),
  });

  const products = data?.items ?? [];

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    updateScrollState();
  }, [products.length]);

  function scrollByCards(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * (CARD_WIDTH + 16), behavior: "smooth" });
  }

  if (isLoading) {
    return (
      <section className="bg-cream py-14">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">Elegidas para Vos</h2>
          </div>
          <div className="flex gap-4">
            {Array.from({ length: VISIBLE }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[220px]">
                <div className="w-full aspect-square bg-[#E8E2D8] animate-pulse mb-3 rounded-[5px]" />
                <div className="h-4 bg-[#E8E2D8] animate-pulse mb-2 rounded" />
                <div className="h-5 bg-[#E8E2D8] animate-pulse w-2/3 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-cream py-14">
      <div className="max-w-screen-xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Elegidas para Vos</h2>
          <Link
            to={{ pathname: "/products", search: "" }}
            className="link-arrow"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Ver Todas las Plantas
            <ArrowRight />
          </Link>
        </div>

        {/* Carousel wrapper */}
        <div className="relative">
          {/* Prev button — centrado en la imagen (220px), no en toda la tarjeta */}
          <button
            onClick={() => scrollByCards(-1)}
            disabled={!canPrev}
            className="absolute -left-5 top-[110px] -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#DDD6CC] shadow-sm flex items-center justify-center text-[#1A2B1C] hover:border-[#1A2B1C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>

          {/* Cards viewport — scroll nativo con snap: el swipe siempre deja
              una tarjeta completa encajada, en cualquier ancho de pantalla. */}
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
          >
            {products.map((product, i) => (
              <ProductCard key={product.product_id} product={product} colorIndex={i} />
            ))}
          </div>

          {/* Next button — centrado en la imagen (220px), no en toda la tarjeta */}
          <button
            onClick={() => scrollByCards(1)}
            disabled={!canNext}
            className="absolute -right-5 top-[110px] -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#DDD6CC] shadow-sm flex items-center justify-center text-[#1A2B1C] hover:border-[#1A2B1C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Siguiente"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, colorIndex }: { product: ProductSummary; colorIndex: number }) {
  const { addItem } = useCart();
  const bg = BG_COLORS[colorIndex % BG_COLORS.length];

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      product_id: product.product_id,
      tenant_id: product.tenant_id,
      title: product.title,
      price_snapshot: product.price,
      image_url: product.image_url,
    });
    toast.success("Agregado al carrito");
  }

  return (
    <Link
      to={`/products/${product.product_id}`}
      className="flex-shrink-0 w-[220px] group block snap-start"
    >
      {/* Imagen o placeholder */}
      <div className={`w-full aspect-square bg-gradient-to-br ${bg} mb-3 relative overflow-hidden rounded-[5px]`}>
        {product.image_url ? (
          <img
            src={resolveUrl(product.image_url)}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <PlantPlaceholder />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Info */}
      <div>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-1 group-hover:text-forest-deep transition-colors leading-tight">
          {product.title}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-[#1A1A1A]">{formatPrice(product.price, product.currency)}</p>
            <p className="text-[10px] text-[#8A8A8A] mt-0.5">Envío a todo el país</p>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-8 h-8 border border-[#C8C0B4] text-[#5A5A5A] flex items-center justify-center hover:border-forest-deep hover:text-forest-deep hover:bg-white transition-colors shrink-0 rounded-[8px]"
            aria-label={`Agregar ${product.title} al carrito`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  return <img src="/images/trans.png" alt="" className="w-20 h-auto opacity-60" />;
}

function formatPrice(centavos: number, currency = "ARS"): string {
  const amount = centavos / 100;
  if (currency === "USD") {
    return `USD ${amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  }
  return `$${amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
