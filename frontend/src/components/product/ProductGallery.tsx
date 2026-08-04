import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function resolveUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

const FALLBACK_GRADIENTS = [
  "from-[#C8D8C0] to-[#A8BCA0]",
  "from-[#D4DFD0] to-[#B8CAB2]",
  "from-[#CCE0C0] to-[#9AB890]",
  "from-[#D0D8C8] to-[#A8B8A0]",
];

const THUMB_SIZE = 80;   // w-20
const THUMB_GAP  = 8;    // gap-2
const VISIBLE    = 5;

export function ProductGallery({ discount, images }: { discount: number; images: string[] }) {
  const [selected, setSelected]     = useState(0);
  const [carouselStart, setCarouselStart] = useState(0);

  const hasImages = images.length > 0;
  const thumbList = hasImages ? images : FALLBACK_GRADIENTS.map((_, i) => String(i));
  const canScroll = thumbList.length > VISIBLE;
  const maxStart  = Math.max(0, thumbList.length - VISIBLE);

  function select(i: number) {
    setSelected(i);
    // auto-slide window so the selected thumb is always visible
    if (i < carouselStart) setCarouselStart(i);
    else if (i >= carouselStart + VISIBLE) setCarouselStart(i - VISIBLE + 1);
  }

  function prev() {
    setCarouselStart((s) => Math.max(0, s - 1));
  }

  function next() {
    setCarouselStart((s) => Math.min(maxStart, s + 1));
  }

  const offset = -(carouselStart * (THUMB_SIZE + THUMB_GAP));

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative overflow-hidden rounded-lg">
        {discount > 0 && (
          <div className="absolute top-4 left-4 z-10 bg-[#1A2B1C] text-white text-xs font-semibold px-2.5 py-1">
            -{discount}%
          </div>
        )}
        {hasImages ? (
          <img
            src={resolveUrl(images[selected])}
            alt="Imagen del producto"
            className="w-full aspect-square object-cover"
          />
        ) : (
          <div
            className={`w-full aspect-square bg-gradient-to-br ${FALLBACK_GRADIENTS[0]} flex items-center justify-center`}
          >
            <PlantPlaceholder size={160} />
          </div>
        )}
      </div>

      {/* Thumbnail carousel */}
      <div className="flex items-center gap-2 w-full">
        {/* Prev button */}
        {canScroll && (
          <button
            onClick={prev}
            disabled={carouselStart === 0}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-[#E8E2D8] bg-white hover:bg-[#F5F0E8] disabled:opacity-30 disabled:cursor-default transition-colors"
            aria-label="Anteriores"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        {/* Sliding window */}
        <div className="flex-1 overflow-hidden">
          <div
            className="flex gap-2 transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(${offset}px)` }}
          >
            {hasImages
              ? images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => select(i)}
                    className={`w-20 h-20 flex-shrink-0 border-2 transition-colors overflow-hidden ${
                      selected === i
                        ? "border-[#1A2B1C]"
                        : "border-transparent hover:border-[#C8C0B4]"
                    }`}
                    aria-label={`Ver imagen ${i + 1}`}
                  >
                    <img
                      src={resolveUrl(url)}
                      alt={`Miniatura ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))
              : FALLBACK_GRADIENTS.map((bg, i) => (
                  <button
                    key={i}
                    onClick={() => select(i)}
                    className={`w-20 h-20 flex-shrink-0 bg-gradient-to-br ${bg} flex items-center justify-center border-2 transition-colors ${
                      selected === i
                        ? "border-[#1A2B1C]"
                        : "border-transparent hover:border-[#C8C0B4]"
                    }`}
                    aria-label={`Ver imagen ${i + 1}`}
                  >
                    <PlantPlaceholder size={32} />
                  </button>
                ))}
          </div>
        </div>

        {/* Next button */}
        {canScroll && (
          <button
            onClick={next}
            disabled={carouselStart >= maxStart}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-[#E8E2D8] bg-white hover:bg-[#F5F0E8] disabled:opacity-30 disabled:cursor-default transition-colors"
            aria-label="Siguientes"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function PlantPlaceholder({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      className="text-white opacity-30"
    >
      <path d="M32 56 C28 44 22 32 32 12 C42 32 36 44 32 56Z" />
      <path d="M32 56 C24 46 14 36 12 22 C22 32 30 44 32 56Z" opacity="0.7" />
      <path d="M32 56 C40 46 50 36 52 22 C42 32 34 44 32 56Z" opacity="0.7" />
      <rect x="30" y="50" width="4" height="10" rx="2" />
    </svg>
  );
}
