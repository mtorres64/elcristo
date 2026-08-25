import { Link } from "react-router-dom";
import { Reveal } from "../common/Reveal";

export function InspirationCTA() {
  return (
    <section className="bg-[#111810]">
      <div className="max-w-screen-xl mx-auto px-6 py-16 md:py-20 text-center">
        <Reveal className="max-w-xl mx-auto flex flex-col items-center gap-6">
          <h2 className="font-serif text-3xl md:text-4xl text-white font-normal leading-tight">
            ¿Soñás con un espacio así?
          </h2>
          <p className="text-sm text-[#8AAB8C] leading-relaxed">
            Contanos tu proyecto y lo diseñamos juntos, desde el primer boceto hasta la
            última planta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/diseno" className="btn-primary">
              Diseño & Paisajismo
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
