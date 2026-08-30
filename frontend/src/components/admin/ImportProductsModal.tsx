import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { productImportService } from "../../services/product.service";
import type { ImportJob } from "../../types/product";

interface Props {
  open: boolean;
  onClose: () => void;
  job: ImportJob | null;
  starting: boolean;
  onStart: (file: File) => void;
}

export function ImportProductsModal({ open, onClose, job, starting, onStart }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setFile(null);
  }, [open]);

  if (!open) return null;

  const running = job?.status === "processing";
  const finished = job?.status === "completed" || job?.status === "failed";
  const pct = job && job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;
  const issues = job?.rows.filter((r) => r.action === "warning" || r.action === "error") ?? [];

  async function handleDownload() {
    setDownloading(true);
    try {
      await productImportService.downloadTemplate();
    } catch {
      toast.error("No se pudo descargar la plantilla");
    } finally {
      setDownloading(false);
    }
  }

  function pickFile(f: File | null | undefined) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xlsx") && !f.name.toLowerCase().endsWith(".xlsm")) {
      toast.error("El archivo debe ser una planilla .xlsx");
      return;
    }
    setFile(f);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white border border-[#E8E2D8] shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E2D8]">
          <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">Importar productos</h2>
          <button
            onClick={onClose}
            className="text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Paso 1: plantilla */}
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A] mb-1">1. Descargá la plantilla</p>
            <p className="text-xs text-[#6B6B6B] mb-3">
              Completá una fila por producto. Las fotos y las macetas recomendadas no se
              importan. Todos los valores corresponden a la medida <strong>mediana</strong>;
              el precio de costo va en la columna <code>precio_costo</code>. Si un producto ya
              existe (mismo SKU o nombre) se actualiza.
            </p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1A2B1C] border border-[#1A2B1C] rounded-lg hover:bg-[#F4F8F4] transition-colors disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {downloading ? "Generando…" : "Descargar plantilla .xlsx"}
            </button>
          </div>

          {/* Paso 2: subir */}
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A] mb-2">2. Subí la planilla completada</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 cursor-pointer transition-colors ${
                dragOver ? "border-[#1A2B1C] bg-[#F4F8F4]" : "border-[#E8E2D8] hover:bg-[#F9F8F5]"
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-sm text-[#4A4A4A]">
                {file ? file.name : "Arrastrá el archivo o hacé clic para elegirlo"}
              </p>
              <p className="text-xs text-[#ABABAB]">Formato .xlsx</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xlsm"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
          </div>

          {/* Progreso / resultado */}
          {job && (
            <div className="rounded-lg bg-[#F9F8F5] border border-[#E8E2D8] p-4">
              {running && (
                <>
                  <div className="flex items-center justify-between text-xs text-[#4A4A4A] mb-2">
                    <span>Importando en segundo plano…</span>
                    <span>{job.processed}/{job.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E8E2D8] overflow-hidden">
                    <div
                      className="h-full bg-[#1A2B1C] transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </>
              )}
              {finished && (
                <p className="text-sm font-semibold text-[#1A1A1A] mb-2">
                  {job.status === "failed" ? "La importación falló" : "Importación finalizada"}
                </p>
              )}
              {job.error && <p className="text-xs text-[#DC2626] mb-2">{job.error}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#4A4A4A] mt-2">
                <span><strong className="text-[#1A2B1C]">{job.created}</strong> creados</span>
                <span><strong className="text-[#1A2B1C]">{job.updated}</strong> actualizados</span>
                <span><strong className="text-[#B8860B]">{job.warnings}</strong> con aviso</span>
                <span><strong className="text-[#DC2626]">{job.errors}</strong> con error</span>
              </div>
              {finished && issues.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto rounded-md border border-[#E8E2D8] bg-white divide-y divide-[#F0EDE6]">
                  {issues.map((r, i) => (
                    <div key={i} className="px-3 py-2 text-xs">
                      <span className={r.action === "error" ? "text-[#DC2626] font-medium" : "text-[#B8860B] font-medium"}>
                        Fila {r.row}
                      </span>
                      {r.name ? <span className="text-[#6B6B6B]"> · {r.name}</span> : null}
                      <span className="text-[#4A4A4A]"> — {r.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#E8E2D8]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#6B6B6B] border border-[#E8E2D8] rounded-lg hover:bg-[#F9F8F5] transition-colors"
          >
            {finished ? "Cerrar" : "Cerrar (sigue en segundo plano)"}
          </button>
          <button
            onClick={() => file && onStart(file)}
            disabled={!file || starting || running}
            className="btn-primary disabled:opacity-50"
          >
            {starting ? "Subiendo…" : running ? "Importando…" : "Importar"}
          </button>
        </div>
      </div>
    </div>
  );
}
