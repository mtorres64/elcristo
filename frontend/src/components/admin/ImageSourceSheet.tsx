import { useEffect, useState } from "react";

function detectTouch(): boolean {
  if (typeof window === "undefined") return false;
  // `pointer: coarse` solo mira el puntero principal: algunos navegadores
  // móviles (modo "sitio de escritorio", WebViews) lo reportan como fine, así
  // que se suman any-pointer, puntos táctiles y user agent móvil.
  return (
    window.matchMedia?.("(pointer: coarse)").matches ||
    window.matchMedia?.("(any-pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  ) ?? false;
}

/** true en dispositivos táctiles (celulares/tablets): ahí tiene sentido
 * preguntar si la foto viene de la galería o de la cámara. En desktop el
 * selector de archivos normal ya alcanza. */
export function useIsTouchDevice(): boolean {
  const [touch, setTouch] = useState(detectTouch);
  useEffect(() => {
    const mqs = [window.matchMedia?.("(pointer: coarse)"), window.matchMedia?.("(any-pointer: coarse)")];
    const onChange = () => setTouch(detectTouch());
    mqs.forEach((mq) => mq?.addEventListener("change", onChange));
    return () => mqs.forEach((mq) => mq?.removeEventListener("change", onChange));
  }, []);
  return touch;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onGallery: () => void;
  onCamera: () => void;
}

/** Hoja inferior para elegir el origen de la foto: galería o cámara. */
export function ImageSourceSheet({ open, onClose, onGallery, onCamera }: Props) {
  if (!open) return null;
  const item =
    "w-full text-left px-4 py-3.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#F4F8F4] transition-colors";
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl p-2 pb-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Agregar foto"
      >
        <p className="px-4 pt-2 pb-1 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Agregar foto</p>
        <button type="button" className={item} onClick={onGallery}>
          Subir desde el teléfono
        </button>
        <button type="button" className={item} onClick={onCamera}>
          Sacar una foto con la cámara
        </button>
        <button type="button" className={`${item} text-[#6B6B6B]`} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
