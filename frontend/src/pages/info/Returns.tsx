import { InfoPage } from "../../components/info/InfoPage";

export function Returns() {
  return (
    <InfoPage
      title="Cambios y devoluciones"
      sections={[
        {
          title: "Plazo para solicitar un cambio",
          text: "Tenés hasta 5 días corridos desde que recibís tu pedido para solicitar un cambio o devolución, escribiéndonos por WhatsApp o email con tu número de pedido y una foto del producto.",
        },
        {
          title: "Plantas con problemas de salud",
          text: "Si una planta llega dañada o con signos de haber sufrido en el viaje, la cambiamos sin cargo. Pedimos que nos avises dentro de las 48 horas de recibida, con fotos del estado en que llegó.",
        },
        {
          title: "Macetas y accesorios",
          text: "Los productos que no sean plantas se pueden cambiar o devolver si no fueron usados y conservan su embalaje original. El costo del envío de devolución corre por cuenta del comprador, salvo que el producto haya llegado con una falla.",
        },
        {
          title: "Cómo se procesa el reembolso",
          text: "Una vez que recibimos y revisamos el producto devuelto, el reembolso se acredita por el mismo medio de pago utilizado en la compra. El tiempo de acreditación depende de cada entidad bancaria.",
        },
        {
          title: "Productos que no admiten devolución",
          text: "Por su naturaleza perecedera, los sustratos abiertos y las plantas ya trasplantadas no admiten devolución, salvo problema de salud de la planta detectado a tiempo.",
        },
      ]}
    />
  );
}
