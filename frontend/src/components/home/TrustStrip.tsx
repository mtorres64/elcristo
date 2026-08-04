const ITEMS = [
  {
    icon: <TruckIcon />,
    title: "Envíos a todo el país",
    desc: "Llegamos a donde estés.",
  },
  {
    icon: <CuotasIcon />,
    title: "3 y 6 cuotas sin interés",
    desc: "Con tarjetas seleccionadas.",
  },
  {
    icon: <PackageIcon />,
    title: "Packaging seguro",
    desc: "Enviamos tus plantas protegidas y cuidadas.",
  },
  {
    icon: <GuaranteeIcon />,
    title: "Garantía Verde",
    desc: "Si tu planta no llega bien, te la reemplazamos.",
  },
];

export function TrustStrip() {
  return (
    <section className="bg-cream border-t border-[#E8E0D4] py-12">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:divide-x lg:divide-[#E8E0D4]">
          {ITEMS.map((item) => (
            <div key={item.title} className="flex items-start gap-4 lg:px-8 first:lg:pl-0 last:lg:pr-0">
              <span className="text-[#5A7A5C] shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A] leading-tight mb-1">{item.title}</p>
                <p className="text-[11px] text-[#8A8A8A] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TruckIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
}
function CuotasIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /><line x1="6" y1="15" x2="10" y2="15" /><line x1="14" y1="15" x2="18" y2="15" /></svg>;
}
function PackageIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>;
}
function GuaranteeIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>;
}
