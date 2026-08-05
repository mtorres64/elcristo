import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { ProductsCarousel } from "../components/home/ProductsCarousel";
import { productService } from "../services/product.service";
import { useCategories } from "../hooks/useCategories";
import { useCart } from "../hooks/useCart";
import type { ProductSummary } from "../types/product";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const PAGE_SIZE = 16;

const BG_COLORS = [
  "from-[#D4DFD0] to-[#B8CAB2]",
  "from-[#C8D8C0] to-[#A8BCA0]",
  "from-[#CCE0C0] to-[#9AB890]",
  "from-[#D8D0E8] to-[#B0A8C8]",
  "from-[#D8D8C0] to-[#B0B090]",
  "from-[#D0D8C8] to-[#A8B8A0]",
  "from-[#C0D8C0] to-[#90B890]",
];

function resolveUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function formatPrice(centavos: number, currency = "ARS"): string {
  const amount = centavos / 100;
  if (currency === "USD")
    return `USD ${amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  return `$${amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get("q") ?? "";
  const categorySlug = searchParams.get("category") ?? "";
  const sortParam = searchParams.get("sort") ?? "featured";
  const pageParam = Number(searchParams.get("page") ?? "1");

  const { categories, loading: catsLoading } = useCategories(100);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(qParam);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync input when qParam changes from outside (e.g. header search)
  useEffect(() => { setSearchInput(qParam); }, [qParam]);

  const activeCat = categories.find((c) => c.slug === categorySlug);
  const categoryId = activeCat?.category_id;

  useEffect(() => {
    // Wait for categories to resolve when filtering by slug
    if (categorySlug && catsLoading) return;

    setLoading(true);
    productService
      .list({
        q: qParam || undefined,
        category_id: categoryId,
        sort: sortParam,
        page: pageParam,
        page_size: PAGE_SIZE,
        status: "active",
      })
      .then((data) => {
        setProducts(data.items);
        setTotal(data.total);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, [qParam, categoryId, sortParam, pageParam, categorySlug, catsLoading]);

  let pageTitle = "Todas las Plantas";
  if (qParam) pageTitle = `Resultados para "${qParam}"`;
  else if (activeCat) pageTitle = activeCat.name;

  function setSort(v: string) {
    setSearchParams((prev) => {
      prev.set("sort", v);
      prev.delete("page");
      return prev;
    });
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      prev.set("page", String(p));
      return prev;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitSearch(e: React.FormEvent | React.KeyboardEvent) {
    e.preventDefault();
    const q = searchInput.trim();
    setSearchParams((prev) => {
      if (q) prev.set("q", q);
      else prev.delete("q");
      prev.delete("page");
      return prev;
    });
  }

  function clearSearch() {
    setSearchInput("");
    setSearchParams((prev) => {
      prev.delete("q");
      prev.delete("page");
      return prev;
    });
    searchRef.current?.focus();
  }

  function setCategoryFilter(slug: string) {
    setSearchParams((prev) => {
      if (slug) prev.set("category", slug);
      else prev.delete("category");
      prev.delete("page");
      return prev;
    });
  }

  const isLoading = loading || (!!categorySlug && catsLoading);

  return (
    <Layout>
      <div className="bg-cream min-h-screen">
        <div className="max-w-screen-xl mx-auto px-6 py-10">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            {/* Title */}
            <div className="sm:w-52 shrink-0">
              <h1 className="font-serif text-3xl text-[#1A2B1C] leading-tight">{pageTitle}</h1>
              {!isLoading && (
                <p className="text-sm text-[#8A8A8A] mt-1">
                  {total} {total === 1 ? "producto" : "productos"}
                </p>
              )}
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB] pointer-events-none"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitSearch(e); }}
                placeholder="Buscar plantas, macetas, accesorios..."
                className="w-full pl-9 pr-9 py-2.5 border border-[#E8E2D8] rounded-lg text-sm text-[#1A1A1A] placeholder-[#ABABAB] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#1A1A1A] transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative shrink-0">
              <select
                value={sortParam}
                onChange={(e) => setSort(e.target.value)}
                className="border border-[#E8E2D8] rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] bg-white appearance-none pr-8 focus:outline-none focus:border-[#1A2B1C] transition-colors cursor-pointer"
              >
                <option value="featured">Destacados</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="newest">Más nuevos</option>
              </select>
              <ChevronIcon />
            </div>
          </div>

          <div className="flex gap-8">
            {/* Sidebar — desktop */}
            <aside className="hidden lg:block w-52 shrink-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-4">
                Categorías
              </p>
              <ul className="flex flex-col gap-0.5">
                <li>
                  <button
                    onClick={() => setCategoryFilter("")}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      !categorySlug
                        ? "bg-[#1A2B1C] text-white font-medium"
                        : "text-[#4A4A4A] hover:bg-[#F0EDE8]"
                    }`}
                  >
                    Todas
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.category_id}>
                    <button
                      onClick={() => setCategoryFilter(cat.slug)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        categorySlug === cat.slug
                          ? "bg-[#1A2B1C] text-white font-medium"
                          : "text-[#4A4A4A] hover:bg-[#F0EDE8]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Category pills — mobile */}
              {categories.length > 0 && (
                <div className="flex lg:hidden gap-2 overflow-x-auto pb-3 mb-5">
                  <button
                    onClick={() => setCategoryFilter("")}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      !categorySlug
                        ? "bg-[#1A2B1C] text-white border-[#1A2B1C]"
                        : "border-[#E8E2D8] text-[#4A4A4A]"
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.category_id}
                      onClick={() => setCategoryFilter(cat.slug)}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        categorySlug === cat.slug
                          ? "bg-[#1A2B1C] text-white border-[#1A2B1C]"
                          : "border-[#E8E2D8] text-[#4A4A4A]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Skeleton */}
              {isLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-[#E8E2D8] rounded-lg mb-3" />
                      <div className="h-4 bg-[#E8E2D8] rounded mb-2 w-3/4" />
                      <div className="h-5 bg-[#E8E2D8] rounded w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoading && products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <PlantEmptyIcon />
                  <p className="font-serif text-xl text-[#6B6B6B] mb-2 mt-4">Sin resultados</p>
                  <p className="text-sm text-[#ABABAB]">
                    {qParam
                      ? `No encontramos productos para "${qParam}".`
                      : "No hay productos en esta categoría."}
                  </p>
                  {(qParam || categorySlug) && (
                    <button
                      onClick={() => setSearchParams({})}
                      className="mt-5 text-sm text-[#3D6040] underline underline-offset-2"
                    >
                      Ver todos los productos
                    </button>
                  )}
                </div>
              )}

              {/* Grid */}
              {!isLoading && products.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map((p, i) => (
                      <ProductCard key={p.product_id} product={p} colorIndex={i} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pages > 1 && (
                    <div className="flex justify-center gap-1.5 mt-10">
                      <PaginationBtn
                        onClick={() => setPage(pageParam - 1)}
                        disabled={pageParam <= 1}
                      >
                        ‹
                      </PaginationBtn>
                      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                        <PaginationBtn
                          key={p}
                          onClick={() => setPage(p)}
                          active={p === pageParam}
                        >
                          {p}
                        </PaginationBtn>
                      ))}
                      <PaginationBtn
                        onClick={() => setPage(pageParam + 1)}
                        disabled={pageParam >= pages}
                      >
                        ›
                      </PaginationBtn>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <ProductsCarousel />
    </Layout>
  );
}

/* ─── ProductCard ─────────────────────────────────────────────── */

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
  }

  return (
    <Link to={`/products/${product.product_id}`} className="group block">
      <div
        className={`w-full aspect-square bg-gradient-to-br ${bg} mb-3 relative overflow-hidden rounded-lg`}
      >
        {product.image_url ? (
          <img
            src={resolveUrl(product.image_url)}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <PlantCardIcon />
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-1 group-hover:text-forest-deep transition-colors leading-tight line-clamp-2">
          {product.title}
        </p>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-base font-bold text-[#1A1A1A]">
              {formatPrice(product.price, product.currency)}
            </p>
            {product.compare_at_price != null && product.compare_at_price > product.price && (
              <p className="text-xs text-[#ABABAB] line-through">
                {formatPrice(product.compare_at_price, product.currency)}
              </p>
            )}
            <p className="text-[10px] text-[#8A8A8A] mt-0.5">Envío a todo el país</p>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-9 h-9 border border-[#C8C0B4] text-[#5A5A5A] flex items-center justify-center hover:border-forest-deep hover:text-forest-deep hover:bg-white transition-colors shrink-0 rounded-lg"
            aria-label={`Agregar ${product.title} al carrito`}
          >
            <svg
              width="15"
              height="15"
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

/* ─── Small components ────────────────────────────────────────── */

function PaginationBtn({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 border rounded-lg text-sm transition-colors ${
        active
          ? "bg-[#1A2B1C] text-white border-[#1A2B1C]"
          : "border-[#E8E2D8] text-[#4A4A4A] hover:border-[#1A2B1C] disabled:opacity-30 disabled:cursor-not-allowed"
      }`}
    >
      {children}
    </button>
  );
}

function ChevronIcon() {
  return (
    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A8A]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

function PlantCardIcon() {
  return (
    <svg className="w-16 h-16 text-white opacity-30" viewBox="0 0 64 64" fill="currentColor">
      <path d="M32 56 C28 44 22 32 32 12 C42 32 36 44 32 56Z" />
      <path d="M32 56 C24 46 14 36 12 22 C22 32 30 44 32 56Z" opacity="0.7" />
      <path d="M32 56 C40 46 50 36 52 22 C42 32 34 44 32 56Z" opacity="0.7" />
    </svg>
  );
}

function PlantEmptyIcon() {
  return (
    <svg className="w-16 h-16 text-[#D0C8C0]" viewBox="0 0 64 64" fill="currentColor">
      <path d="M32 56 C28 44 22 32 32 12 C42 32 36 44 32 56Z" />
      <path d="M32 56 C24 46 14 36 12 22 C22 32 30 44 32 56Z" opacity="0.5" />
      <path d="M32 56 C40 46 50 36 52 22 C42 32 34 44 32 56Z" opacity="0.5" />
    </svg>
  );
}
