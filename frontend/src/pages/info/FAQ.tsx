import { InfoPage } from "../../components/info/InfoPage";

export function FAQ() {
  return (
    <InfoPage
      title="Preguntas frecuentes"
      sections={[
        {
          title: "¿Cómo sé qué planta elegir para mi espacio?",
          text: "En cada ficha de producto vas a encontrar los cuidados recomendados: luz, riego y tamaño adulto. Si tenés dudas, escribinos por WhatsApp y te asesoramos según la luz y el ambiente que tenés disponible.",
        },
        {
          title: "¿Las plantas vienen con maceta?",
          text: "Depende del producto: algunas plantas se venden solo con la maceta de vivero (de plástico, para trasplantar) y otras incluyen maceta decorativa. Esto figura siempre en la descripción de cada producto, y en varios casos podés elegir la maceta al momento de comprar.",
        },
        {
          title: "¿Hacen envíos a todo el país?",
          text: "Sí, enviamos a todas las provincias. Podés ver los plazos y costos en la sección de Envíos.",
        },
        {
          title: "¿Puedo retirar mi pedido en el vivero?",
          text: "Sí, podés elegir la opción de retiro en el checkout y coordinamos un horario para que pases a buscarlo sin costo de envío.",
        },
        {
          title: "¿Ofrecen servicio de diseño de jardines?",
          text: "Sí, contamos con un equipo de paisajistas para proyectos de diseño y paisajismo integral, desde un balcón hasta un jardín completo. Podés conocer más en la sección Diseño & Paisajismo.",
        },
        {
          title: "¿Qué pasa si mi planta llega con problemas?",
          text: "La cambiamos sin cargo. Más detalles en la sección Cambios y devoluciones.",
        },
      ]}
    />
  );
}
