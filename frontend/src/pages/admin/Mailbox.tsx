import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import toast from "react-hot-toast";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { mailboxService } from "../../services/mailbox.service";
import type { MailboxEmail, MailboxEmailDetail, MailboxFolder } from "../../types/mailbox";

const INPUT =
  "w-full rounded-lg border border-[#E8E2D8] px-3.5 py-2.5 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors";
const LABEL = "block text-xs font-medium text-[#4A4A4A] mb-1.5";

const LIST_WIDTH_KEY = "mailbox-list-width";
const MIN_LIST_WIDTH = 260;
const MAX_LIST_WIDTH = 640;
const DEFAULT_LIST_WIDTH = 360;

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function EmailRow({
  email,
  active,
  onClick,
}: {
  email: MailboxEmail;
  active: boolean;
  onClick: () => void;
}) {
  const isSent = email.folder === "sent";
  const correspondent = isSent
    ? email.to_addr || "Desconocido"
    : email.from_name || email.from_addr || "Desconocido";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-[#F0EDE8] transition-colors ${
        active ? "bg-[#F4F8F4]" : "hover:bg-[#F9F8F5]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className={`text-sm truncate ${!email.is_read ? "font-semibold text-[#1A1A1A]" : "text-[#4A4A4A]"}`}>
          {isSent ? `Para: ${correspondent}` : correspondent}
        </span>
        <span className="text-[11px] text-[#ABABAB] shrink-0">{formatDate(email.date)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {!email.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[#1A2B1C] shrink-0" />}
        <p className={`text-sm truncate ${!email.is_read ? "font-medium text-[#1A1A1A]" : "text-[#6B6B6B]"}`}>
          {email.subject}
        </p>
      </div>
      <p className="text-xs text-[#ABABAB] truncate mt-0.5">{email.snippet}</p>
    </button>
  );
}

function ComposeModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("Completá destinatario, asunto y mensaje");
      return;
    }
    setSending(true);
    try {
      const result = await mailboxService.send({ to: to.trim(), subject: subject.trim(), body });
      if (result.ok) {
        toast.success(result.message);
        onSent();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (err: unknown) {
      toast.error(errMsg(err, "No se pudo enviar el correo"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg w-full max-w-lg p-5 sm:p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">Redactar correo</h2>
        <div>
          <label className={LABEL}>Para</label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="destinatario@email.com"
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>Asunto</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Mensaje</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className={`${INPUT} resize-none`}
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors disabled:opacity-50"
          >
            {sending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Mailbox() {
  const [folder, setFolder] = useState<MailboxFolder>("inbox");
  const [emails, setEmails] = useState<MailboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MailboxEmailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [composing, setComposing] = useState(false);

  const panesRef = useRef<HTMLDivElement>(null);
  const [listWidth, setListWidth] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(LIST_WIDTH_KEY));
      return saved >= MIN_LIST_WIDTH && saved <= MAX_LIST_WIDTH ? saved : DEFAULT_LIST_WIDTH;
    } catch {
      return DEFAULT_LIST_WIDTH;
    }
  });
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    if (!resizing) return;

    function handleMouseMove(e: MouseEvent) {
      const left = panesRef.current?.getBoundingClientRect().left ?? 0;
      setListWidth(Math.min(MAX_LIST_WIDTH, Math.max(MIN_LIST_WIDTH, e.clientX - left)));
    }
    function handleMouseUp() {
      setResizing(false);
    }
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
    };
  }, [resizing]);

  useEffect(() => {
    try {
      localStorage.setItem(LIST_WIDTH_KEY, String(listWidth));
    } catch {
      // ignore — conveniencia por navegador, no crítico
    }
  }, [listWidth]);

  function loadList(f: MailboxFolder = folder) {
    setLoading(true);
    mailboxService
      .list(f)
      .then((data) => setEmails(data.items))
      .catch(() => toast.error("No se pudo cargar la bandeja de entrada"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadList(folder);
    const t = setInterval(() => loadList(folder), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  function handleFolderChange(f: MailboxFolder) {
    setFolder(f);
    setSelectedId(null);
    setDetail(null);
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setLoadingDetail(true);
    mailboxService
      .get(id)
      .then((d) => {
        setDetail(d);
        setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, is_read: true } : e)));
      })
      .catch(() => toast.error("No se pudo cargar el correo"))
      .finally(() => setLoadingDetail(false));
  }

  return (
    <AdminLayout>
      <div className="h-full flex flex-col">
        <div className="px-4 sm:px-8 py-5 border-b border-[#E8E2D8] flex items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">Correos</h1>
            <p className="text-xs text-[#8A8A8A] mt-1">Bandeja de la casilla configurada en Integraciones</p>
          </div>
          <button
            onClick={() => setComposing(true)}
            className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#253824] transition-colors shrink-0"
          >
            Redactar
          </button>
        </div>

        <div ref={panesRef} className="flex-1 flex overflow-hidden">
          {/* Lista */}
          <div
            style={{ "--list-width": `${listWidth}px` } as React.CSSProperties}
            className={`w-full sm:w-[var(--list-width)] border-r border-[#E8E2D8] overflow-y-auto shrink-0 ${
              selectedId ? "hidden sm:block" : "block"
            }`}
          >
            <div className="flex border-b border-[#E8E2D8] sticky top-0 bg-white z-10">
              <button
                onClick={() => handleFolderChange("inbox")}
                className={`flex-1 text-xs font-semibold uppercase tracking-widest py-3 transition-colors ${
                  folder === "inbox"
                    ? "text-[#1A2B1C] border-b-2 border-[#1A2B1C]"
                    : "text-[#ABABAB] hover:text-[#4A4A4A]"
                }`}
              >
                Recibidos
              </button>
              <button
                onClick={() => handleFolderChange("sent")}
                className={`flex-1 text-xs font-semibold uppercase tracking-widest py-3 transition-colors ${
                  folder === "sent"
                    ? "text-[#1A2B1C] border-b-2 border-[#1A2B1C]"
                    : "text-[#ABABAB] hover:text-[#4A4A4A]"
                }`}
              >
                Enviados
              </button>
            </div>
            {loading ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[#8A8A8A]">Cargando…</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[#8A8A8A]">No hay correos todavía.</p>
              </div>
            ) : (
              emails.map((email) => (
                <EmailRow
                  key={email.id}
                  email={email}
                  active={email.id === selectedId}
                  onClick={() => handleSelect(email.id)}
                />
              ))
            )}
          </div>

          {/* Separador arrastrable */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setResizing(true);
            }}
            className={`hidden sm:block w-1.5 shrink-0 cursor-col-resize hover:bg-[#1A2B1C]/20 transition-colors ${
              resizing ? "bg-[#1A2B1C]/30" : ""
            }`}
          />

          {/* Detalle */}
          <div className={`flex-1 overflow-y-auto ${selectedId ? "block" : "hidden sm:block"}`}>
            {!selectedId ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-[#8A8A8A]">Seleccioná un correo para verlo</p>
              </div>
            ) : loadingDetail || !detail ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[#8A8A8A]">Cargando…</p>
              </div>
            ) : (
              <div className="p-5 sm:p-8 max-w-2xl">
                <button
                  onClick={() => setSelectedId(null)}
                  className="sm:hidden mb-4 text-xs font-medium text-[#1A2B1C]"
                >
                  ← Volver a la lista
                </button>
                <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-2">{detail.subject}</h2>
                <div className="flex items-center justify-between gap-4 text-xs text-[#8A8A8A] pb-4 border-b border-[#F0EDE8] mb-4">
                  {detail.folder === "sent" ? (
                    <span>
                      Para: <strong className="text-[#4A4A4A]">{detail.to_addr}</strong>
                    </span>
                  ) : (
                    <span>
                      De: <strong className="text-[#4A4A4A]">{detail.from_name || detail.from_addr}</strong>{" "}
                      {detail.from_addr && detail.from_name ? `<${detail.from_addr}>` : ""}
                    </span>
                  )}
                  <span className="shrink-0">{formatDate(detail.date)}</span>
                </div>
                {detail.body_html ? (
                  <div
                    className="text-sm text-[#1A1A1A] prose-sm [&_a]:text-[#1A2B1C] [&_a]:underline"
                    // El HTML viene de un correo recibido (contenido no confiable): se
                    // sanea con DOMPurify antes de insertarlo, nunca se renderiza crudo.
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(detail.body_html, {
                        FORBID_TAGS: ["iframe", "object", "embed", "form", "style"],
                      }),
                    }}
                  />
                ) : (
                  <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{detail.body_text}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {composing && (
        <ComposeModal onClose={() => setComposing(false)} onSent={loadList} />
      )}
    </AdminLayout>
  );
}
