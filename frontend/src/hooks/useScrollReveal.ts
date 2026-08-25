import { useEffect, useRef, useState } from "react";

/** Detecta cuándo un elemento entra en el viewport para animarlo al hacer
 * scroll (fade-in + slide-up). Se dispara una sola vez: al hacerse visible
 * deja de observar, así el elemento no vuelve a ocultarse si el usuario
 * sube y baja la página. */
export function useScrollReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Si el navegador no soporta IntersectionObserver, mostrar directamente.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}
