import { useEffect, useState } from "react";
import { productService } from "../../services/product.service";
import type { BulkImageSuggestionRow } from "../../types/product";
import { ImageCandidateTile } from "./ImageSuggestionModal";

interface RowState extends BulkImageSuggestionRow {
  selectedUrls: Set<string>;
  omitted: boolean;
  confirmStatus: "idle" | "ok" | "error";
  confirmMessage: string | null;
}

/** Revisión y confirmación masiva de sugerencias de fotos para varios
 * productos seleccionados. Una sola llamada trae las sugerencias de todos
 * (el fan-out a Wikimedia lo hace el backend), y una sola confirmación las
 * guarda todas — nada se sube a Cloudinary hasta ese click final. */
export function BulkImageSuggestionModal({
  productIds,
  onDone,
  onClose,
}: {
  productIds: string[];
  onDone: (succeededIds: string[]) => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    productService
      .suggestImagesBulk(productIds)
      .then((data) => {
        setRows(
          data.map((row) => ({
            ...row,
            selectedUrls: new Set(row.candidates[0] ? [row.candidates[0].full_url] : []),
            omitted: row.candidates.length === 0,
            confirmStatus: "idle",
            confirmMessage: null,
          }))
        );
      })
      .catch(() => setLoadError("No se pudieron obtener sugerencias de Wikimedia Commons"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleCandidate(productId: string, url: string) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.product_id !== productId) return row;
        const next = new Set(row.selectedUrls);
        if (next.has(url)) next.delete(url);
        else next.add(url);
        return { ...row, selectedUrls: next };
      })
    );
  }

  function toggleOmit(productId: string) {
    setRows((prev) =>
      prev.map((row) => (row.product_id === productId ? { ...row, omitted: !row.omitted } : row))
    );
  }

  const eligibleRows = rows.filter((r) => !r.omitted && r.selectedUrls.size > 0 && r.confirmStatus !== "ok");
  const confirmedCount = rows.filter((r) => r.confirmStatus === "ok").length;

  async function handleConfirm() {
    if (eligibleRows.length === 0) return;
    setConfirming(true);
    try {
      const res = await productService.confirmImageSuggestionsBulk(
        eligibleRows.map((r) => ({ product_id: r.product_id, image_urls: [...r.selectedUrls] }))
      );
      const resultByProduct = new Map(res.results.map((r) => [r.product_id, r]));
      setRows((prev) =>
        prev.map((row) => {
          const result = resultByProduct.get(row.product_id);
          if (!result) return row;
          return {
            ...row,
            confirmStatus: result.status,
            confirmMessage: result.message,
          };
        })
      );
      const succeeded = res.results.filter((r) => r.status === "ok").map((r) => r.product_id);
      if (succeeded.length > 0) onDone(succeeded);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E2D8]">
          <p className="text-sm font-semibold text-[#1A1A1A]">
            Sugerir fotos para {productIds.length} producto{productIds.length !== 1 ? "s" : ""}
          </p>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#1A1A1A] text-lg leading-none" aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-[#6B6B6B] text-center py-8">Buscando en Wikimedia Commons…</p>
          ) : loadError ? (
            <p className="text-sm text-[#DC2626] text-center py-8">{loadError}</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#E8E2D8]">
              {rows.map((row) => (
                <div key={row.product_id} className="py-4 first:pt-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[#1A1A1A]">{row.title || row.product_id}</p>
                    {row.confirmStatus === "ok" ? (
                      <span className="text-xs font-medium text-[#2D6A4F]">Guardado ✓</span>
                    ) : row.confirmStatus === "error" ? (
                      <span className="text-xs font-medium text-[#DC2626]">{row.confirmMessage || "Error"}</span>
                    ) : row.candidates.length > 0 ? (
                      <label className="flex items-center gap-1.5 text-xs text-[#6B6B6B] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!row.omitted}
                          onChange={() => toggleOmit(row.product_id)}
                        />
                        Incluir
                      </label>
                    ) : null}
                  </div>

                  {row.error ? (
                    <p className="text-xs text-[#DC2626]">{row.error}</p>
                  ) : row.candidates.length === 0 ? (
                    <p className="text-xs text-[#ABABAB]">Sin resultados para «{row.query}»</p>
                  ) : (
                    <div className={`grid grid-cols-4 sm:grid-cols-6 gap-2 ${row.omitted || row.confirmStatus === "ok" ? "opacity-40 pointer-events-none" : ""}`}>
                      {row.candidates.map((c) => (
                        <ImageCandidateTile
                          key={c.full_url}
                          candidate={c}
                          selected={row.selectedUrls.has(c.full_url)}
                          onToggle={() => toggleCandidate(row.product_id, c.full_url)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#E8E2D8]">
          {confirmedCount > 0 && (
            <span className="text-xs text-[#6B6B6B] mr-auto">
              {confirmedCount} de {rows.length} guardado{confirmedCount !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#D4E8D4] rounded-lg hover:bg-[#F7F5F2] transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleConfirm}
            disabled={eligibleRows.length === 0 || confirming}
            className="px-4 py-1.5 text-xs font-medium bg-[#1A2B1C] text-white rounded-lg hover:bg-[#0F1C10] transition-colors disabled:opacity-50"
          >
            {confirming ? "Guardando…" : `Confirmar (${eligibleRows.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
