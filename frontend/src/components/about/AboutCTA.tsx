import { Link } from "react-router-dom";
import { Reveal } from "../common/Reveal";

export function AboutCTA() {
  return (
    <section className="bg-[#111810]">
      <div className="max-w-screen-xl mx-auto px-6 py-16 md:py-20 text-center">
        <Reveal className="max-w-xl mx-auto flex flex-col items-center gap-6">
          <h2 className="font-serif text-3xl md:text-4xl text-white font-normal leading-tight">
            ¿Listo para darle vida verde a tu espacio?
          </h2>
          <p className="text-sm text-[#8AAB8C] leading-relaxed">
            Descubrí nuestra selección de plantas o contanos tu proyecto para diseñar
            juntos el jardín que estás imaginando.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/products" className="btn-primary">
              Ver Plantas
            </Link>
            <Link to="/diseno" className="btn-outline !border-white !text-white hover:!bg-white hover:!text-[#111810]">
              Diseño & Paisajismo
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
