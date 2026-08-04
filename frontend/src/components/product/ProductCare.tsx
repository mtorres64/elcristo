import { useState } from "react";

const LABEL_MAP: Record<string, string> = {
  luz: "Luz",
  light: "Luz",
  riego: "Riego",
  agua: "Agua",
  water: "Riego",
  ambiente: "Ambiente",
  environment: "Ambiente",
  temperatura: "Temperatura",
  temperature: "Temperatura",
  dificultad: "Dificultad",
  difficulty: "Dificultad",
  humedad: "Humedad",
  humidity: "Humedad",
  fertilizante: "Fertilizante",
  fertilizer: "Fertilizante",
};

const ICON_MAP: Record<string, React.ReactNode> = {
  luz: <SunIcon />,
  light: <SunIcon />,
  riego: <WaterIcon />,
  agua: <WaterIcon />,
  water: <WaterIcon />,
  ambiente: <EnvironmentIcon />,
  temperatura: <EnvironmentIcon />,
  environment: <EnvironmentIcon />,
  dificultad: <DifficultyIcon />,
  difficulty: <DifficultyIcon />,
};

const ACCORDION_ITEMS = [
  {
    id: "beneficios",
    label: "Beneficios",
    content:
      "Purifica el aire del ambiente, aporta elegancia a cualquier espacio y es resistente a condiciones de interior. Su follaje exuberante reduce el estrés y mejora la concentración.",
  },
  {
    id: "incluye",
    label: "Incluye",
    content:
      "La planta viene en maceta plástica de cultivo lista para trasplantar. Incluye instructivo de cuidados y garantía verde por 7 días.",
  },
  {
    id: "envios",
    label: "Envíos y devoluciones",
    content:
      "Enviamos a todo el país con packaging especializado para plantas. El tiempo de entrega es de 3 a 7 días hábiles. Si la planta no llega en perfecto estado, la reemplazamos sin costo.",
  },
];

export function ProductCare({
  care,
  description,
}: {
  care: Record<string, string>;
  description?: string | null;
}) {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const careEntries = Object.entries(care);

  function toggleAccordion(id: string) {
    setOpenAccordion((curr) => (curr === id ? null : id));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Left — Care */}
      <div className="bg-white border border-[#E8E2D8] rounded-lg p-8">
        <h2 className="section-title mb-6">Cuidados</h2>
        <div className="flex flex-col gap-5">
          {careEntries.length > 0 ? (
            careEntries.map(([key, value]) => (
              <div key={key} className="flex items-start gap-3">
                <span className="text-[#5A7A5C] shrink-0 mt-0.5">
                  {ICON_MAP[key.toLowerCase()] ?? <DifficultyIcon />}
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-0.5">
                    {LABEL_MAP[key.toLowerCase()] ?? key}
                  </p>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{value}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#8A8A8A]">Sin información de cuidados.</p>
          )}
        </div>
        {careEntries.length > 0 && (
          <button className="mt-6 btn-outline text-xs py-2.5 px-5">
            Ver más cuidados
          </button>
        )}
      </div>

      {/* Right — Description + Accordion */}
      <div>
        <h2 className="section-title mb-4">Descripción</h2>
        {description && (
          <p className="text-sm text-[#6B6B6B] leading-relaxed mb-8">{description}</p>
        )}

        <div className="divide-y divide-[#E8E2D8]">
          {ACCORDION_ITEMS.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => toggleAccordion(item.id)}
                className="w-full flex items-center justify-between py-4 text-left group"
                aria-expanded={openAccordion === item.id}
              >
                <span className="text-sm font-semibold text-[#1A1A1A] group-hover:text-forest-accent transition-colors">
                  {item.label}
                </span>
                <ChevronIcon open={openAccordion === item.id} />
              </button>
              {openAccordion === item.id && (
                <div className="pb-4">
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">
                    {item.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`text-[#8A8A8A] shrink-0 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function WaterIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function EnvironmentIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DifficultyIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
