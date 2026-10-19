import { useEffect } from "react";
import type { HelpBlock, HelpTopic } from "../../content/adminHelp/types";

interface Props {
  topic: HelpTopic;
  onClose: () => void;
}

function Block({ block, index }: { block: HelpBlock; index: number }) {
  if (block.type === "p") {
    return (
      <p key={index} className="text-sm leading-relaxed text-[#4A4A4A]">
        {block.text}
      </p>
    );
  }
  const items = block.items ?? [];
  if (block.type === "ol") {
    return (
      <ol key={index} className="list-decimal list-outside pl-5 space-y-1.5 text-sm leading-relaxed text-[#4A4A4A]">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    );
  }
  return (
    <ul key={index} className="list-disc list-outside pl-5 space-y-1.5 text-sm leading-relaxed text-[#4A4A4A]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function HelpModal({ topic, onClose }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ayuda: ${topic.title}`}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E2D8] flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[#5A7A5C] text-xs font-semibold uppercase tracking-wide mb-1">
              <HelpCircleIcon />
              Ayuda de la pantalla
            </div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">{topic.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar ayuda"
            className="text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors shrink-0 p-1"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex flex-col gap-6">
          <p className="text-sm leading-relaxed text-[#1A1A1A] bg-[#F5F5F3] rounded-lg px-4 py-3">
            {topic.summary}
          </p>

          {topic.sections.map((section, si) => (
            <div key={si} className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-[#1A2B1C]">{section.heading}</h3>
              <div className="flex flex-col gap-2.5">
                {section.blocks.map((block, bi) => (
                  <Block key={bi} block={block} index={bi} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E8E2D8] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#1A2B1C] text-white text-sm font-semibold px-4 py-2 hover:bg-[#243824] transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function HelpCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
