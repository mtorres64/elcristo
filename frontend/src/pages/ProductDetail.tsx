import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../components/layout/Layout";
import { ProductGallery } from "../components/product/ProductGallery";
import { ProductInfo } from "../components/product/ProductInfo";
import { ProductCare } from "../components/product/ProductCare";
import { RelatedProducts } from "../components/product/RelatedProducts";
import { ServicesSection } from "../components/home/ServicesSection";
import { TrustStrip } from "../components/home/TrustStrip";
import { productService } from "../services/product.service";

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productService.getById(productId!),
    enabled: !!productId,
  });

  const discount =
    product?.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : 0;

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-cream border-b border-[#E8E2D8]">
        <div className="max-w-screen-xl mx-auto px-6 py-3">
          <nav className="flex items-center gap-2 text-xs text-[#8A8A8A]" aria-label="Miga de pan">
            <Link to="/" className="hover:text-[#3D6040] transition-colors">
              Inicio
            </Link>
            <ChevronRight />
            <Link to="/products" className="hover:text-[#3D6040] transition-colors">
              Plantas
            </Link>
            {product?.category_name && (
              <>
                <ChevronRight />
                <Link
                  to={`/products?category=${product.category_id ?? ""}`}
                  className="hover:text-[#3D6040] transition-colors"
                >
                  {product.category_name}
                </Link>
              </>
            )}
            <ChevronRight />
            <span className="text-[#1A1A1A] font-medium">
              {product?.title ?? "Cargando…"}
            </span>
          </nav>
        </div>
      </div>

      {/* Main product section */}
      <section className="bg-cream">
        <div className="max-w-screen-xl mx-auto px-6 py-10 lg:py-14">
          {isLoading && (
            <div className="flex items-center justify-center py-24">
              <span className="text-[#8A8A8A] text-sm">Cargando producto…</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center py-24">
              <span className="text-[#C0392B] text-sm">
                No se pudo cargar el producto. Verificá la URL e intentá nuevamente.
              </span>
            </div>
          )}

          {product && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
              <ProductGallery discount={discount} images={product.images} />
              <ProductInfo product={product} />
            </div>
          )}
        </div>
      </section>

      {/* Product trust badges */}
      <div className="bg-white border-t border-b border-[#E8E2D8] py-8">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:divide-x lg:divide-[#E8E0D4]">
            <TrustBadge icon={<PersonIcon />} title="Asesoramiento personalizado" />
            <TrustBadge icon={<GuaranteeIcon />} title="Garantía verde" subtitle="7 días" />
            <TrustBadge
              icon={<PaymentIcon />}
              title="Pagos seguros"
              subtitle="100% protegidos"
            />
            <TrustBadge
              icon={<PackageIcon />}
              title="Embalaje seguro"
              subtitle="Plantas protegidas"
            />
          </div>
        </div>
      </div>

      {/* Care + Description */}
      <section className="bg-cream">
        <div className="max-w-screen-xl mx-auto px-6 py-12">
          <ProductCare care={product?.care ?? {}} description={product?.description} />
        </div>
      </section>

      <RelatedProducts />
      <ServicesSection />
      <TrustStrip />
    </Layout>
  );
}

function TrustBadge({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2 lg:px-8 first:lg:pl-0 last:lg:pr-0">
      <span className="text-[#5A7A5C]">{icon}</span>
      <div>
        <p className="text-[11px] font-semibold text-[#1A1A1A] leading-tight">{title}</p>
        {subtitle && <p className="text-[10px] text-[#8A8A8A]">{subtitle}</p>}
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-[#C8C0B4] shrink-0"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function GuaranteeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
