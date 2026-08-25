import { InfoPage } from "../../components/info/InfoPage";

export function Terms() {
  return (
    <InfoPage
      title="Términos y condiciones"
      sections={[
        {
          title: "Aceptación de los términos",
          text: "El uso de este sitio y la compra de productos implica la aceptación de estos términos y condiciones. Te recomendamos leerlos antes de realizar un pedido.",
        },
        {
          title: "Productos y disponibilidad",
          text: "Trabajamos con stock vivo, por lo que la disponibilidad de plantas puede variar según la temporada. Si un producto no está disponible luego de confirmada la compra, te contactamos para ofrecerte un reemplazo o el reembolso correspondiente.",
        },
        {
          title: "Precios",
          text: "Los precios publicados están expresados en pesos argentinos e incluyen los impuestos correspondientes. Nos reservamos el derecho de modificar precios sin previo aviso, aunque respetamos siempre el valor vigente al momento de confirmar tu compra.",
        },
        {
          title: "Cuentas de usuario",
          text: "Sos responsable de mantener la confidencialidad de tu usuario y contraseña, y de toda actividad realizada desde tu cuenta.",
        },
        {
          title: "Propiedad intelectual",
          text: "Las imágenes, textos y contenido de este sitio son propiedad de Vivero El Cristo y no pueden reproducirse sin autorización previa.",
        },
        {
          title: "Modificaciones",
          text: "Estos términos pueden actualizarse en cualquier momento. Los cambios entran en vigencia desde su publicación en esta misma página.",
        },
        {
          title: "Contacto",
          text: "Ante cualquier consulta sobre estos términos podés escribirnos a viveroelcristo@gmail.com.",
        },
      ]}
    />
  );
}
