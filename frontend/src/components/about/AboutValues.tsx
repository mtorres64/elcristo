import { Reveal } from "../common/Reveal";

const VALUES = [
  {
    icon: <LeafIcon />,
    title: "Calidad ante todo",
    desc: "Seleccionamos y cuidamos cada planta como si fuera para nuestro propio jardín.",
  },
  {
    icon: <HeartIcon />,
    title: "Cercanía",
    desc: "Asesoramos con honestidad, sin apuro, para que elijas lo que realmente funciona en tu espacio.",
  },
  {
    icon: <SproutIcon />,
    title: "Sustentabilidad",
    desc: "Trabajamos con procesos responsables, desde el sustrato hasta el packaging de envío.",
  },
  {
    icon: <StarIcon />,
    title: "Pasión por el oficio",
    desc: "Más de veinte años aprendiendo de la tierra y compartiendo ese conocimiento con vos.",
  },
];

export function AboutValues() {
  return (
    <section className="bg-[#253824]">
      <div className="max-w-screen-xl mx-auto px-6 py-16 md:py-20">
        <Reveal className="max-w-xl mb-12">
          <p className="text-[10px] uppercase tracking-widest text-[#7A9B7C] font-semibold italic mb-3">
            Lo que nos guía
          </p>
          <h2 className="font-serif text-3xl md:text-4xl leading-tight text-white font-normal">
            Nuestros valores
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((v, i) => (
            <Reveal
              key={v.title}
              delay={i * 100}
              className="flex flex-col gap-3 p-6 border border-[#3A5A3C] hover:border-[#5A7A5C] transition-colors rounded-[8px]"
            >
              <span className="text-[#7AAB7C]">{v.icon}</span>
              <h3 className="text-white font-semibold text-sm tracking-wide">{v.title}</h3>
              <p className="text-[#7A9B7C] text-[12px] leading-relaxed">{v.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function LeafIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 20A7 7 0 0 1 4 13c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8" />
      <path d="M11 20V4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />
    </svg>
  );
}

function SproutIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 20h10" />
      <path d="M12 20v-8" />
      <path d="M12 12C7 12 5 9 5 5c4 0 7 2 7 7" />
      <path d="M12 9c0-4 3-6 7-6 0 3.5-2 6-7 6" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
