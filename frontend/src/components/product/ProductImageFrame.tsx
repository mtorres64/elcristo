/**
 * Renderiza una imagen de producto dentro de su contenedor (normalmente un
 * cuadro 1:1). Dos modos:
 *  - "cover" (default, comportamiento actual): recorta la imagen para llenar
 *    el contenedor.
 *  - "contain" ("ajustar"): muestra la imagen completa, sin recortar, con una
 *    copia de la misma imagen de fondo —recortada y oscurecida con blur—
 *    para rellenar el resto del cuadro. Sirve para fotos verticales u
 *    horizontales que no son 1:1.
 * El modo "contain" no depende de la orientación de la imagen: object-cover
 * en el fondo y object-contain al frente resuelven vertical y horizontal con
 * el mismo markup.
 */
export function ProductImageFrame({
  src,
  alt,
  fit,
  className = "",
  onLoadDims,
}: {
  src: string;
  alt: string;
  fit?: "contain" | string;
  className?: string;
  onLoadDims?: (dims: { width: number; height: number }) => void;
}) {
  const handleLoad = onLoadDims
    ? (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        if (img.naturalWidth && img.naturalHeight) {
          onLoadDims({ width: img.naturalWidth, height: img.naturalHeight });
        }
      }
    : undefined;

  if (fit !== "contain") {
    return <img src={src} alt={alt} className={`${className} object-cover`} onLoad={handleLoad} />;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-[3px] brightness-[0.7]"
      />
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-contain"
        onLoad={handleLoad}
      />
    </div>
  );
}
