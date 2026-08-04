import { useState } from "react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <section className="bg-[#111810]">
      <div className="max-w-screen-xl mx-auto px-6 py-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Text */}
          <div className="md:max-w-sm">
            <p className="text-[9px] uppercase tracking-widest text-[#5A7A5C] font-semibold mb-2">
              Comunidad Verde
            </p>
            <h3 className="font-serif text-2xl text-white font-normal leading-snug mb-2">
              Sumate a Nuestra Comunidad Verde
            </h3>
            <p className="text-[12px] text-[#6B7A6C] leading-relaxed">
              Recibí tips de cuidado, inspiración y novedades exclusivas.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex w-full md:max-w-md gap-0">
            {submitted ? (
              <p className="text-[#7AAB7C] text-sm font-medium py-3">
                ¡Gracias! Te enviamos novedades pronto.
              </p>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu correo electrónico"
                  required
                  className="flex-1 bg-[#1C2A1C] border border-[#2A3A2B] text-white text-sm px-4 py-3 placeholder:text-[#4A5A4B] focus:outline-none focus:border-[#5A7A5C] transition-colors rounded-l-[8px]"
                />
                <button
                  type="submit"
                  className="bg-[#5A7A5C] hover:bg-[#6A8A6C] text-white text-[10px] uppercase tracking-widest font-bold px-6 py-3 transition-colors whitespace-nowrap rounded-r-[8px]"
                >
                  Suscribirme
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
