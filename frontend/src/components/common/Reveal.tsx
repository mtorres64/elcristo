import { ReactNode } from "react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

/** Envuelve contenido y lo anima (fade-in + slide-up) cuando entra en el
 * viewport al hacer scroll. `delay` en ms para escalonar varios elementos
 * (galería, cards) sin que aparezcan todos a la vez. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
