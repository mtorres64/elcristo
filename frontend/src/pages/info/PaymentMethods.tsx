import { InfoPage } from "../../components/info/InfoPage";

export function PaymentMethods() {
  return (
    <InfoPage
      title="Medios de pago"
      sections={[
        {
          title: "Tarjetas de crédito y débito",
          text: "Aceptamos las principales tarjetas de crédito y débito (Visa, Mastercard y American Express), procesadas de forma segura al finalizar la compra. Consultá promociones y cuotas sin interés disponibles según el banco emisor.",
        },
        {
          title: "Transferencia bancaria",
          text: "Podés abonar tu pedido por transferencia o depósito bancario. Al elegir esta opción en el checkout te vamos a enviar los datos de la cuenta y tu pedido queda reservado mientras se acredita el pago.",
        },
        {
          title: "Efectivo en puntos de pago",
          text: "También podés pagar en efectivo en las redes de cobranza habilitadas. El pedido se confirma automáticamente una vez acreditado el pago.",
        },
        {
          title: "Seguridad de tus datos",
          text: "Todos los pagos con tarjeta se procesan a través de una pasarela de pago certificada. No almacenamos los números de tarjeta en nuestros servidores.",
        },
      ]}
    />
  );
}
