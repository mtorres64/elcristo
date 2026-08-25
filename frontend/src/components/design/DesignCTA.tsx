import { Link } from "react-router-dom";
import { Reveal } from "../common/Reveal";

export function DesignCTA() {
  return (
    <section className="bg-[#111810]">
      <div className="max-w-screen-xl mx-auto px-6 py-16 md:py-20 text-center">
        <Reveal className="max-w-xl mx-auto flex flex-col items-center gap-6">
          <h2 className="font-serif text-3xl md:text-4xl text-white font-normal leading-tight">
            Diseñemos tu próximo proyecto
          </h2>
          <p className="text-sm text-[#8AAB8C] leading-relaxed">
            Contanos cómo es tu espacio y qué imaginás para él — nuestro equipo de
            paisajistas te acompaña de principio a fin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/inspiracion" className="btn-primary">
              Ver Inspiración
            </Link>
            <Link to="/products" className="btn-outline !border-white !text-white hover:!bg-white hover:!text-[#111810]">
              Ver Plantas
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
