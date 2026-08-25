import { Reveal } from "../common/Reveal";

export function InspirationIntro({ title, text }: { title: string; text: string }) {
  return (
    <section className="bg-cream pt-16 md:pt-20 pb-4">
      <div className="max-w-screen-xl mx-auto px-6">
        <Reveal className="max-w-2xl mx-auto text-center">
          <p className="section-label mb-3 justify-center flex">Nuestros trabajos</p>
          <h2 className="section-title text-3xl md:text-4xl mb-5">{title}</h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">{text}</p>
        </Reveal>
      </div>
    </section>
  );
}
