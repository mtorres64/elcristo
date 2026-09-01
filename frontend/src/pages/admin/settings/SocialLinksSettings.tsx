import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { contentService } from "../../../services/content.service";
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_OPTIONS, SocialIcon } from "../../../components/social/socialPlatforms";
import type { SocialLink, SocialPlatform } from "../../../types/content";

function emptyLink(): SocialLink {
  return { id: crypto.randomUUID(), platform: "instagram", url: "" };
}

/** Normaliza lo que el vendedor pega: si no arranca con un esquema conocido
 * le antepone https:// para que el link del footer funcione. */
function normalizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return "";
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}

/** Editor autónomo de las redes sociales del footer: se trae su documento,
 * maneja estado, carga y guardado, y su propia barra sticky mobile —
 * mismo patrón que las páginas de texto de /seller/content. */
export function SocialLinksSettings() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    contentService
      .getSocial()
      .then((d) => {
        if (alive) setLinks(d.links);
      })
      .catch(() => toast.error("No se pudieron cargar las redes sociales"))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function patchLink(index: number, patch: Partial<SocialLink>) {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLink() {
    setLinks((prev) => [...prev, emptyLink()]);
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function moveLink(index: number, dir: -1 | 1) {
    setLinks((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    const cleaned = links
      .map((l) => ({ ...l, url: normalizeUrl(l.url) }))
      .filter((l) => l.url);
    if (cleaned.length !== links.length) {
      toast.error("Completá la URL de todas las redes (o eliminá las vacías)");
      return;
    }
    setSaving(true);
    try {
      const data = await contentService.updateSocial(cleaned);
      setLinks(data.links);
      toast.success("Redes sociales actualizadas");
    } catch {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-lg p-12 text-center">
        <p className="font-serif text-lg text-[#8A8A8A]">Cargando…</p>
      </div>
    );
  }

  return (
    <>
      {/* Barra de acción mobile sticky — sacada del padding de la página */}
      <div className="sm:hidden sticky top-0 z-10 -mx-4 -mt-6 mb-6 bg-white border-b border-[#E8E2D8] px-4 py-3 flex items-center gap-3">
        <button
          onClick={addLink}
          className="px-4 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white hover:bg-[#F9F8F5] transition-colors rounded-lg shrink-0"
        >
          + Red
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <div className="flex flex-col gap-4 max-w-2xl">
        {/* Barra de acciones desktop */}
        <div className="hidden sm:flex items-center justify-between bg-white border border-[#E8E2D8] rounded-lg px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Redes sociales</p>
            <p className="text-xs text-[#8A8A8A] mt-0.5">
              Se muestran como íconos en el footer, en este orden
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addLink}
              className="px-4 py-2 border border-[#C8C0B4] rounded-lg text-sm text-[#1A2B1C] font-medium bg-white hover:bg-[#F5F5F3] transition-colors"
            >
              + Agregar red
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E8E2D8] rounded-lg p-5">
          {links.length === 0 && (
            <p className="text-sm text-[#6B6B6B] py-6 text-center">
              Todavía no hay redes sociales cargadas.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {links.map((link, index) => (
              <div
                key={link.id}
                className="flex items-center gap-2 border border-[#E8E2D8] rounded-lg p-3"
              >
                <span className="w-8 h-8 rounded-full border border-[#E8E2D8] flex items-center justify-center text-[#5A7A5C] shrink-0">
                  <SocialIcon platform={link.platform} size={15} />
                </span>

                <select
                  value={link.platform}
                  onChange={(e) =>
                    patchLink(index, { platform: e.target.value as SocialPlatform })
                  }
                  className={`${INPUT} w-[140px] shrink-0`}
                >
                  {SOCIAL_PLATFORM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <input
                  value={link.url}
                  onChange={(e) => patchLink(index, { url: e.target.value })}
                  onBlur={(e) => patchLink(index, { url: normalizeUrl(e.target.value) })}
                  className={`${INPUT} flex-1 min-w-0`}
                  placeholder={SOCIAL_PLATFORMS[link.platform].placeholder}
                />

                <div className="flex items-center gap-1 shrink-0">
                  <IconButton title="Subir" disabled={index === 0} onClick={() => moveLink(index, -1)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </IconButton>
                  <IconButton
                    title="Bajar"
                    disabled={index === links.length - 1}
                    onClick={() => moveLink(index, 1)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </IconButton>
                  <IconButton title="Eliminar red" danger onClick={() => removeLink(index)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Shared helpers ─────────────────────────────────────────── */

const INPUT =
  "border border-[#E8E2D8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";

function IconButton({
  title,
  danger,
  disabled,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-lg border border-transparent transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        danger
          ? "text-[#8A8A8A] hover:text-[#DC2626] hover:bg-[#FEF2F2]"
          : "text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F5F3]"
      }`}
    >
      {children}
    </button>
  );
}
