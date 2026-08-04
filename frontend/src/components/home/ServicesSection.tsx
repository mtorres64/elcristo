import { Link } from "react-router-dom";

const SERVICES = [
  {
    icon: <GardenIcon />,
    title: "Diseño de jardines",
    desc: "Proyectos personalizados para hogares y espacios comerciales.",
  },
  {
    icon: <LandscapeIcon />,
    title: "Paisajismo integral",
    desc: "Desde la planificación hasta la ejecución, nos ocupamos de todo.",
  },
  {
    icon: <MaintenanceIcon />,
    title: "Mantenimiento",
    desc: "Cuidamos tu jardín para que siempre luzca perfecto.",
  },
  {
    icon: <ConsultIcon />,
    title: "Asesoramiento",
    desc: "Te ayudamos a elegir las plantas ideales para tu espacio.",
  },
];

export function ServicesSection() {
  return (
    <section className="bg-[#253824]">
      <div className="max-w-screen-xl mx-auto px-6 py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          {/* Left — text */}
          <div className="lg:w-2/5 flex flex-col gap-6">
            <p className="text-[10px] uppercase tracking-widest text-[#7A9B7C] font-semibold italic">
              Diseño & Paisajismo
            </p>
            <h2 className="font-serif text-4xl xl:text-5xl leading-tight text-white font-normal">
              Creamos jardines que cuentan historias.
            </h2>
            <p className="text-sm text-[#8AAB8C] leading-relaxed">
              Combinamos diseño, funcionalidad y naturaleza para transformar espacios
              en experiencias únicas.
            </p>
            <Link
              to="/diseno"
              className="text-[11px] uppercase tracking-widest font-bold text-white flex items-center gap-2 hover:gap-3 transition-all group mt-2"
            >
              Conocé Nuestros Servicios
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Right — service cards grid */}
          <div className="lg:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title} className="flex flex-col gap-3 p-6 border border-[#3A5A3C] hover:border-[#5A7A5C] transition-colors group rounded-[8px]">
                <span className="text-[#7AAB7C] group-hover:text-[#A0CB9C] transition-colors">{s.icon}</span>
                <h3 className="text-white font-semibold text-sm tracking-wide">{s.title}</h3>
                <p className="text-[#7A9B7C] text-[12px] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function GardenIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22V12" />
      <path d="M5 12C5 8 8 5 12 5s7 3 7 7" />
      <path d="M2 17c0-3 2.5-5 5-5s5 2 5 5" />
      <path d="M12 17c0-3 2.5-5 5-5s5 2 5 5" />
    </svg>
  );
}

function LandscapeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="3 20 10 10 17 14 21 8 21 20 3 20" />
      <circle cx="7" cy="6" r="2" />
    </svg>
  );
}

function MaintenanceIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function ConsultIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="12" y1="7" x2="12" y2="13" />
    </svg>
  );
}
