import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Layout } from "../components/layout/Layout";
import { ProductsCarousel } from "../components/home/ProductsCarousel";
import { productService } from "../services/product.service";
import { useCategories } from "../hooks/useCategories";
import { useCart } from "../hooks/useCart";
import { CATEGORY_GROUPS, CATEGORY_GROUP_LABEL, type CategoryGroup } from "../types/category";
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
  const groupParam = searchParams.get("group") ?? "";
  const onSaleParam = searchParams.get("on_sale") === "true";
  const sortParam = searchParams.get("sort") ?? "featured";

  const validGroup: CategoryGroup | null =
    CATEGORY_GROUPS.find((g) => g.value === groupParam)?.value ?? null;

  const { categories, loading: catsLoading } = useCategories(100);
  const [searchInput, setSearchInput] = useState(qParam);
  const searchRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sync input when qParam changes from outside (e.g. header search)
  useEffect(() => { setSearchInput(qParam); }, [qParam]);

  const activeCat = categories.find((c) => c.slug === categorySlug);
  const categoryId = activeCat?.category_id;

  // Sección del nav en la que está parado el listado: la de la categoría activa
  // si hay una, si no la del ?group= de la URL. Null = vitrina completa (sin
  // sección), p. ej. /products a secas o una búsqueda global.
  const resolvedGroup: CategoryGroup | null = activeCat?.group ?? validGroup;

  // Categorías del rail lateral: acotadas a la sección si hay una, si no todas.
  const railCategories = resolvedGroup
    ? categories.filter((c) => c.group === resolvedGroup)
    : categories;

  // Filtro por sección para la query de productos: solo cuando no hay una
  // categoría puntual (esa es más específica) y el ?group= es válido.
  const categoryGroupFilter = !categoryId && validGroup ? validGroup : undefined;

  const listParams = {
    q: qParam || undefined,
    category_id: categoryId,
    category_group: categoryGroupFilter,
    on_sale: onSaleParam || undefined,
    sort: sortParam,
    page_size: PAGE_SIZE,
    status: "active",
  };

  const {
    data,
    isLoading: queryLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["products", listParams],
    queryFn: ({ pageParam }) => productService.list({ ...listParams, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
    // Wait for categories to resolve when filtering by slug
    enabled: !(categorySlug && catsLoading),
  });

  const products: ProductSummary[] = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // Infinite scroll: load the next page when the sentinel enters the viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "600px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, products.length]);

  let pageTitle = "Todos los productos";
  if (qParam) pageTitle = `Resultados para "${qParam}"`;
  else if (activeCat) pageTitle = activeCat.name;
  else if (onSaleParam) pageTitle = "Ofertas";
  else if (validGroup) pageTitle = CATEGORY_GROUP_LABEL[validGroup];

  function setSort(v: string) {
    setSearchParams((prev) => {
      prev.set("sort", v);
      return prev;
    });
  }

  function submitSearch(e: React.FormEvent | React.KeyboardEvent) {
    e.preventDefault();
    const q = searchInput.trim();
    setSearchParams((prev) => {
      if (q) prev.set("q", q);
      else prev.delete("q");
      return prev;
    });
  }

  function clearSearch() {
    setSearchInput("");
    setSearchParams((prev) => {
      prev.delete("q");
      return prev;
    });
    searchRef.current?.focus();
  }

  function setCategoryFilter(slug: string) {
    setSearchParams((prev) => {
      if (slug) {
        // Una categoría puntual implica su sección; el ?group= sobra.
        prev.set("category", slug);
        prev.delete("group");
      } else {
        // "Todas": vuelve a la sección actual (si la hay), no a la vitrina.
        prev.delete("category");
        if (resolvedGroup) prev.set("group", resolvedGroup);
        else prev.delete("group");
      }
      return prev;
    });
  }

  const isLoading = queryLoading || (!!categorySlug && catsLoading);

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
                {resolvedGroup ? CATEGORY_GROUP_LABEL[resolvedGroup] : "Categorías"}
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
                {railCategories.map((cat) => (
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
              {railCategories.length > 0 && (
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
                  {railCategories.map((cat) => (
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

                  {/* Infinite scroll sentinel + loader */}
                  <div ref={sentinelRef} className="h-px" />
                  {isFetchingNextPage && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="aspect-square bg-[#E8E2D8] rounded-lg mb-3" />
                          <div className="h-4 bg-[#E8E2D8] rounded mb-2 w-3/4" />
                          <div className="h-5 bg-[#E8E2D8] rounded w-1/2" />
                        </div>
                      ))}
                    </div>
                  )}
                  {!hasNextPage && (
                    <p className="text-center text-xs text-[#ABABAB] mt-10">
                      Viste los {total} {total === 1 ? "producto" : "productos"}
                    </p>
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
