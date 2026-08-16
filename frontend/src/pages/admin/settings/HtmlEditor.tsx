import { useEffect, useRef, useState } from "react";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import { FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";

/** Igual que el párrafo normal, pero acepta un atributo "class" propio —
 * lo usamos para marcar un párrafo como "eyebrow" (la etiqueta chica arriba
 * del título), sin exponer al usuario que por debajo sigue siendo HTML. */
const EyebrowParagraph = Paragraph.extend({
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("class"),
        renderHTML: (attributes: { class?: string | null }) =>
          attributes.class ? { class: attributes.class } : {},
      },
    };
  },
});

type BlockType = "paragraph" | "eyebrow" | "heading";
type LinkStyle = "normal" | "btn-primary" | "btn-outline";

const LINK_STYLES: { id: LinkStyle; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "btn-primary", label: "Botón sólido" },
  { id: "btn-outline", label: "Botón outline" },
];

// Tamaños y fuentes acotados a lo que el sitio ya sabe mostrar bien — no es
// un selector libre para no terminar con una mezcla inconsistente de letras.
const FONT_SIZES: { id: string; label: string }[] = [
  { id: "", label: "Tamaño automático" },
  { id: "0.75rem", label: "Chico" },
  { id: "1rem", label: "Normal" },
  { id: "1.5rem", label: "Grande" },
  { id: "2.5rem", label: "Muy grande" },
  { id: "4rem", label: "Enorme" },
];
const FONT_FAMILIES: { id: string; label: string }[] = [
  { id: "", label: "Fuente automática" },
  { id: "'Playfair Display', Georgia, serif", label: "Serif (elegante)" },
  { id: "'Inter', system-ui, sans-serif", label: "Sans (moderna)" },
];

/** Un editor "vacío" para Tiptap sigue siendo <p></p> — lo normalizamos a
 * "" para que coincida con el resto del modelo (slide sin texto). */
function getHtml(editor: Editor): string {
  return editor.isEmpty ? "" : editor.getHTML();
}

/** Editor visual (tipo Word) para el contenido de un slide del hero.
 * Guarda y lee HTML (compatible con lo que ya había en la base), pero el
 * que lo usa nunca escribe una etiqueta a mano: solo elige título/párrafo/
 * etiqueta chica, negrita, cursiva, tamaño/fuente, y links con estilo de
 * botón — el mismo conjunto que sabe pintar el CSS del sitio (.hero-copy). */
export function HtmlEditor({
  value,
  onChange,
  align = "left",
}: {
  value: string;
  onChange: (html: string) => void;
  /** Alineación del bloque de texto dentro del panel (coincide con la
   * posición elegida para el slide). */
  align?: "left" | "center" | "right";
}) {
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkStyle, setLinkStyle] = useState<LinkStyle>("normal");
  const linkPanelRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: { levels: [1] },
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        underline: false,
        strike: false,
        link: false,
      }),
      EyebrowParagraph,
      Link.configure({ openOnClick: false, autolink: false }),
      TextStyle,
      FontFamily,
      FontSize,
      Placeholder.configure({
        placeholder: "Escribí acá el texto del slide (dejalo vacío para un slide sin texto)…",
        emptyNodeClass: "is-empty",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(getHtml(editor)),
    editorProps: {
      attributes: { class: "hero-copy outline-none" },
    },
  });

  // Mantiene el editor sincronizado si el html cambia desde afuera (ej. al
  // recargar el carrusel), sin pisar lo que el usuario está escribiendo.
  useEffect(() => {
    if (!editor) return;
    if (value !== getHtml(editor)) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (linkPanelRef.current && !linkPanelRef.current.contains(e.target as Node)) {
        setLinkPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!editor) return null;

  const blockType: BlockType = editor.isActive("heading", { level: 1 })
    ? "heading"
    : editor.isActive("paragraph", { class: "eyebrow" })
    ? "eyebrow"
    : "paragraph";

  function setBlockType(type: BlockType) {
    if (!editor) return;
    if (type === "heading") {
      editor.chain().focus().setNode("heading", { level: 1 }).run();
    } else {
      editor
        .chain()
        .focus()
        .setParagraph()
        .updateAttributes("paragraph", { class: type === "eyebrow" ? "eyebrow" : null })
        .run();
    }
  }

  function setFontSize(size: string) {
    if (!editor) return;
    if (size) editor.chain().focus().setFontSize(size).run();
    else editor.chain().focus().unsetFontSize().run();
  }

  function setFontFamily(family: string) {
    if (!editor) return;
    if (family) editor.chain().focus().setFontFamily(family).run();
    else editor.chain().focus().unsetFontFamily().run();
  }

  // Sin texto seleccionado (ni parado sobre un link existente): el panel
  // deja escribir el texto del botón/link desde cero, en vez de exigir que
  // selecciones algo primero.
  const hasSelection = !editor.state.selection.empty;
  const editingExistingLink = editor.isActive("link");
  const needsNewText = !hasSelection && !editingExistingLink;

  function openLinkPanel() {
    if (!editor) return;
    const attrs = editor.getAttributes("link");
    setLinkText("");
    setLinkUrl(attrs.href ?? "");
    setLinkStyle(
      attrs.class === "btn-primary" ? "btn-primary" : attrs.class === "btn-outline" ? "btn-outline" : "normal"
    );
    setLinkPanelOpen(true);
  }

  function applyLink() {
    if (!editor || !linkUrl.trim()) return;
    const linkAttrs = { href: linkUrl.trim(), class: linkStyle === "normal" ? null : linkStyle };

    if (needsNewText) {
      if (!linkText.trim()) return;
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: linkText.trim(), marks: [{ type: "link", attrs: linkAttrs }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink(linkAttrs).run();
    }
    setLinkPanelOpen(false);
  }

  function removeLink() {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkPanelOpen(false);
  }

  return (
    <div>
      {/* Barra de herramientas — colores fijos (no depende del color de texto
          del slide) para que siempre se lea bien sobre cualquier fondo.
          Ojo: sin backdrop-blur acá — crea su propio stacking context y
          atrapa el z-index del panel de link por debajo del contenido. */}
      <div className="relative z-10 flex flex-wrap items-center gap-1 px-2 py-1.5 bg-white/90 border-b border-[#E8E2D8]">
        <select
          value={blockType}
          onChange={(e) => setBlockType(e.target.value as BlockType)}
          className="text-xs border border-black/15 rounded px-1.5 py-1 bg-white/95 text-[#1A1A1A] outline-none mr-1 cursor-pointer"
        >
          <option value="paragraph">Párrafo</option>
          <option value="heading">Título grande</option>
          <option value="eyebrow">Etiqueta chica</option>
        </select>

        <select
          value={editor.getAttributes("textStyle").fontFamily ?? ""}
          onChange={(e) => setFontFamily(e.target.value)}
          title="Tipo de letra"
          className="text-xs border border-black/15 rounded px-1.5 py-1 bg-white/95 text-[#1A1A1A] outline-none mr-1 cursor-pointer max-w-[110px]"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>

        <select
          value={editor.getAttributes("textStyle").fontSize ?? ""}
          onChange={(e) => setFontSize(e.target.value)}
          title="Tamaño de letra"
          className="text-xs border border-black/15 rounded px-1.5 py-1 bg-white/95 text-[#1A1A1A] outline-none mr-1 cursor-pointer"
        >
          {FONT_SIZES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        <ToolbarBtn active={editor.isActive("bold")} title="Negrita" onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("italic")} title="Cursiva" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </ToolbarBtn>

        <div className="relative" ref={linkPanelRef}>
          <ToolbarBtn active={editor.isActive("link")} title="Crear un link o botón" onClick={openLinkPanel}>
            <LinkIcon />
          </ToolbarBtn>
          {linkPanelOpen && (
            <div className="absolute z-20 top-full left-0 mt-1 w-64 bg-white border border-[#E8E2D8] rounded-lg shadow-lg p-3">
              <p className="text-[10px] text-[#8A8A8A] mb-2 leading-relaxed">
                {needsNewText
                  ? "Escribí el texto del botón, el destino, y elegí el estilo."
                  : "Elegí el destino y el estilo para el texto seleccionado."}
              </p>
              {needsNewText && (
                <input
                  autoFocus
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Texto del botón (ej. Ver más)"
                  className="w-full text-xs border border-[#E8E2D8] rounded px-2 py-1.5 mb-2 outline-none text-[#1A1A1A]"
                />
              )}
              <input
                autoFocus={!needsNewText}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/products o https://..."
                className="w-full text-xs border border-[#E8E2D8] rounded px-2 py-1.5 mb-2 outline-none text-[#1A1A1A]"
              />
              <div className="flex gap-1 mb-2">
                {LINK_STYLES.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLinkStyle(opt.id)}
                    className={`flex-1 text-[10px] px-1.5 py-1 border rounded transition-colors ${
                      linkStyle === opt.id
                        ? "border-[#3D6040] bg-[#3D6040] text-white"
                        : "border-[#E8E2D8] text-[#6B6B6B] hover:border-[#5A7A5C]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                {editingExistingLink ? (
                  <button type="button" onClick={removeLink} className="text-[10px] text-[#DC2626] font-medium">
                    Quitar link
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={applyLink}
                  disabled={!linkUrl.trim() || (needsNewText && !linkText.trim())}
                  className="text-[10px] bg-[#1A2B1C] text-white px-2.5 py-1.5 rounded font-medium disabled:opacity-40"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />
        <ToolbarBtn title="Deshacer" onClick={() => editor.chain().focus().undo().run()}>
          <UndoIcon />
        </ToolbarBtn>
        <ToolbarBtn title="Rehacer" onClick={() => editor.chain().focus().redo().run()}>
          <RedoIcon />
        </ToolbarBtn>
      </div>

      <div
        className={`flex p-4 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""}`}
        style={{ textAlign: align }}
      >
        <EditorContent editor={editor} className="cursor-text" onClick={() => editor.chain().focus().run()} />
      </div>
    </div>
  );
}

function ToolbarBtn({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // no perder la selección del texto
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? "bg-[#1A2B1C] text-white" : "text-[#4A4A4A] hover:bg-[#F5F5F3]"
      }`}
    >
      {children}
    </button>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 3-7" />
    </svg>
  );
}
function RedoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 7v6h-6" /><path d="M21 13a9 9 0 1 1-3-7" />
    </svg>
  );
}
