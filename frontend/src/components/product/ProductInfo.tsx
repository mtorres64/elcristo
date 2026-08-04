import { useState } from "react";
import { useCart } from "../../hooks/useCart";
import type { ProductDetail } from "../../types/product";

const SIZES = [
  { id: "pequeña" as const, label: "Pequeña", range: "60-80 cm" },
  { id: "mediana" as const, label: "Mediana", range: "80-120 cm" },
  { id: "grande" as const, label: "Grande", range: "120-160 cm" },
];

const POTS = [
  { id: null as null, label: "Sin maceta", extra: 0 },
  { id: "cemento", label: "Maceta Cemento Gris", extra: 850000 },
  { id: "terracota", label: "Maceta Terracota Clásica", extra: 620000 },
  { id: "ceramica", label: "Maceta Cerámica Blanca", extra: 980000 },
];

const INSTALLMENTS = 6;

type SizeId = "pequeña" | "mediana" | "grande";

export function ProductInfo({ product }: { product: ProductDetail }) {
  const [size, setSize] = useState<SizeId>("mediana");
  const [pot, setPot] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  const potExtra = POTS.find((p) => p.id === pot)?.extra ?? 0;
  const totalPrice = product.price + potExtra;
  const installmentAmount = Math.floor(totalPrice / INSTALLMENTS);
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : 0;

  function handleAddToCart() {
    const sizeLabel = SIZES.find((s) => s.id === size)?.label ?? size;
    for (let i = 0; i < qty; i++) {
      addItem({
        product_id: `${product.product_id}__${size}__${pot ?? "sin-maceta"}`,
        tenant_id: product.tenant_id,
        title: `${product.title} ${sizeLabel}`,
        price_snapshot: totalPrice,
        image_url: product.image_url,
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Name */}
      <div>
        <h1 className="font-serif text-4xl font-normal text-[#1A1A1A] leading-tight mb-1">
          {product.title}
        </h1>
        {product.short_description && (
          <p className="text-sm text-[#6B6B6B]">{product.short_description}</p>
        )}
      </div>

      {/* Price */}
      <div>
        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
          <span className="text-3xl font-bold text-[#1A1A1A]">
            {formatARS(totalPrice)}
          </span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <>
              <span className="text-base text-[#8A8A8A] line-through">
                {formatARS(product.compare_at_price)}
              </span>
              {discount > 0 && (
                <span className="bg-[#E8F0E8] text-[#3D6040] text-[11px] font-bold px-2 py-0.5 tracking-wide">
                  {discount}% OFF
                </span>
              )}
            </>
          )}
        </div>
        <p className="text-sm text-[#3D6040]">
          {INSTALLMENTS} cuotas sin interés de {formatARS(installmentAmount)}
        </p>
      </div>

      {/* Description */}
      {product.description && (
        <p className="text-sm text-[#6B6B6B] leading-relaxed">{product.description}</p>
      )}

      <hr className="border-[#E8E2D8]" />

      {/* Size selector */}
      <div>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-3">
          Tamaño de la planta
        </p>
        <div className="flex gap-2">
          {SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSize(s.id)}
              className={`flex-1 py-3 px-2 border text-center transition-colors ${
                size === s.id
                  ? "border-[#1A2B1C] bg-white"
                  : "border-[#E8E2D8] hover:border-[#C8C0B4]"
              }`}
            >
              <p className="text-xs font-semibold text-[#1A1A1A]">{s.label}</p>
              <p className="text-[10px] text-[#8A8A8A] mt-0.5">{s.range}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Pot selector */}
      <div>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-3">
          Elegí tu maceta{" "}
          <span className="font-normal text-[#8A8A8A]">(opcional)</span>
        </p>
        <div className="flex gap-2">
          {POTS.map((p) => (
            <button
              key={p.id ?? "none"}
              onClick={() => setPot(p.id)}
              className={`flex-1 py-3 px-2 border text-center transition-colors ${
                pot === p.id
                  ? "border-[#1A2B1C] bg-white"
                  : "border-[#E8E2D8] hover:border-[#C8C0B4]"
              }`}
            >
              <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                <PotIcon type={p.id} />
              </div>
              <p className="text-[10px] font-medium text-[#1A1A1A] leading-tight">
                {p.label}
              </p>
              {p.extra > 0 && (
                <p className="text-[10px] text-[#3D6040] mt-0.5">
                  +{formatARS(p.extra)}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <p className="text-sm font-semibold text-[#1A1A1A]">Cantidad</p>
        <div className="flex items-center border border-[#E8E2D8]">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F8F4EE] transition-colors"
            aria-label="Reducir cantidad"
          >
            <svg width="12" height="2" viewBox="0 0 12 2" fill="currentColor">
              <rect width="12" height="2" />
            </svg>
          </button>
          <span className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-[#1A1A1A] border-x border-[#E8E2D8]">
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-10 h-10 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F8F4EE] transition-colors"
            aria-label="Aumentar cantidad"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="5" y="0" width="2" height="12" />
              <rect x="0" y="5" width="12" height="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleAddToCart}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4"
        >
          <CartIcon />
          Agregar al carrito
        </button>
        <button className="btn-outline w-full py-4">Comprar ahora</button>
      </div>

      {/* Shipping */}
      <div className="flex items-center gap-3 pt-3 border-t border-[#E8E2D8]">
        <span className="text-[#5A7A5C] shrink-0">
          <TruckIcon />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">
            Envíos a todo el país
          </p>
          <p className="text-[11px] text-[#8A8A8A]">
            Calculá el costo y tiempo de envío en el checkout.
          </p>
        </div>
      </div>
    </div>
  );
}

function formatARS(centavos: number): string {
  const pesos = centavos / 100;
  return `$${pesos.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function PotIcon({ type }: { type: string | null }) {
  if (type === null) {
    return (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        stroke="#C8C0B4"
        strokeWidth="1.5"
      >
        <circle cx="16" cy="16" r="13" />
        <line x1="7" y1="7" x2="25" y2="25" />
      </svg>
    );
  }
  const colors: Record<string, { fill: string; stroke: string }> = {
    cemento: { fill: "#B8B8B0", stroke: "#9A9A90" },
    terracota: { fill: "#C4724A", stroke: "#A05A38" },
    ceramica: { fill: "#E8E4DC", stroke: "#C8C0B4" },
  };
  const c = colors[type] ?? { fill: "#C8C0B4", stroke: "#9A9090" };
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path
        d="M10 14 L11 26 Q16 28 21 26 L22 14 Z"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1"
      />
      <rect
        x="9"
        y="12"
        width="14"
        height="3"
        rx="1"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
