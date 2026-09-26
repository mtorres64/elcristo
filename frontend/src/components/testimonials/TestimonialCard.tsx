import type { Testimonial } from "../../types/content";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function imgSrc(url: string) {
  return url.startsWith("/uploads") ? `${API_BASE}${url}` : url;
}

// Color del avatar de iniciales (cuando el testimonio no tiene foto).
const AVATAR_COLORS = ["bg-[#8AAB80]", "bg-[#7A9B90]", "bg-[#9A8BAA]", "bg-[#AA9B7A]"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function TestimonialCard({
  testimonial,
  colorIndex,
  className = "",
}: {
  testimonial: Testimonial;
  colorIndex: number;
  className?: string;
}) {
  return (
    <div className={`bg-white p-7 rounded-[8px] ${className}`}>
      {/* Big quote mark */}
      <div className="font-serif text-6xl leading-none text-[#E8E0D4] mb-3 select-none">"</div>

      {/* Review text */}
      <p className="text-sm text-[#4A4A4A] leading-relaxed mb-6">
        {testimonial.text}
      </p>

      {/* Divider */}
      <div className="border-t border-[#EAE4DB] mb-5" />

      {/* Author */}
      <div className="flex items-center gap-3">
        {testimonial.image ? (
          <img
            src={imgSrc(testimonial.image)}
            alt={testimonial.name}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {initials(testimonial.name)}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A] leading-tight">{testimonial.name}</p>
          <p className="text-[11px] text-[#8A8A8A] mt-0.5">{testimonial.location}</p>
        </div>
      </div>
    </div>
  );
}
