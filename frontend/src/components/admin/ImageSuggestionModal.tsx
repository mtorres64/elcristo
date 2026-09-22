import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { productService } from "../../services/product.service";
import type { ImageSuggestionCandidate } from "../../types/product";

/** Miniatura seleccionable de un candidato de Wikimedia Commons, compartida
 * entre el modal individual y el masivo. */
export function ImageCandidateTile({
  candidate,
  selected,
  onToggle,
}: {
  candidate: ImageSuggestionCandidate;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative text-left rounded-lg border-2 overflow-hidden transition-colors ${
        selected ? "border-[#1A2B1C]" : "border-transparent hover:border-[#D0C8C0]"
      }`}
    >
      <div className="aspect-square bg-[#F0EDE8]">
        <img src={candidate.thumbnail_url} alt={candidate.title} className="w-full h-full object-cover" />
      </div>
      {selected && (
        <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#1A2B1C] text-white text-[11px] flex items-center justify-center">
          ✓
        </span>
      )}
      {candidate.attribution && (
        <p className="text-[9px] text-[#6B6B6B] px-1 py-0.5 truncate" title={candidate.attribution}>
          {candidate.attribution}
        </p>
      )}
    </button>
  );
}

/** Modal de sugerencia de fotos para un producto individual. Las imágenes
 * nunca se suben a Cloudinary: `confirmImageSuggestions` (al tocar
 * "Confirmar") guarda directo el link al thumbnail que sirve Wikimedia
 * como imagen del producto. */
export function ImageSuggestionModal({
  productId,
  onConfirm,
  onClose,
}: {
  productId: string;
  onConfirm: (urls: string[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [candidates, setCandidates] = useState<ImageSuggestionCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load(q?: string) {
    setLoading(true);
    setError(null);
    productService
      .suggestImages(productId, q)
      .then((res) => {
        setQuery(res.query);
        setQueryInput(res.query);
        setCandidates(res.candidates);
        setSelected(new Set());
      })
      .catch(() => setError("No se pudieron obtener sugerencias de Wikimedia Commons"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function toggle(url: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  async function handleConfirm() {
    if (selected.size === 0) return;
    setConfirming(true);
    try {
      const res = await productService.confirmImageSuggestions(productId, [...selected]);
      onConfirm(res.urls);
      onClose();
    } catch {
      toast.error("No se pudieron guardar las imágenes elegidas");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E2D8]">
          <p className="text-sm font-semibold text-[#1A1A1A]">Sugerir fotos (Wikimedia Commons)</p>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#1A1A1A] text-lg leading-none" aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="px-5 py-3 border-b border-[#E8E2D8] flex gap-2">
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(queryInput)}
            className="flex-1 border border-[#D0C8C0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1A2B1C]"
            placeholder="Buscar en Wikimedia Commons…"
          />
          <button
            onClick={() => load(queryInput)}
            className="px-3 py-1.5 text-xs font-medium border border-[#D0C8C0] rounded-lg hover:bg-[#F7F5F2] transition-colors"
          >
            Buscar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-[#6B6B6B] text-center py-8">Buscando en Wikimedia Commons…</p>
          ) : error ? (
            <p className="text-sm text-[#DC2626] text-center py-8">{error}</p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-[#6B6B6B] text-center py-8">Sin resultados para «{query}»</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {candidates.map((c) => (
                <ImageCandidateTile
                  key={c.thumbnail_url}
                  candidate={c}
                  selected={selected.has(c.thumbnail_url)}
                  onToggle={() => toggle(c.thumbnail_url)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#E8E2D8]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#D4E8D4] rounded-lg hover:bg-[#F7F5F2] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0 || confirming}
            className="px-4 py-1.5 text-xs font-medium bg-[#1A2B1C] text-white rounded-lg hover:bg-[#0F1C10] transition-colors disabled:opacity-50"
          >
            {confirming ? "Guardando…" : `Confirmar (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
