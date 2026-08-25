import { InfoPage } from "../../components/info/InfoPage";

export function Shipping() {
  return (
    <InfoPage
      title="Envíos"
      sections={[
        {
          title: "Envíos a todo el país",
          text: "Despachamos pedidos a todas las provincias de Argentina a través de transporte y correo. En Tucumán capital y alrededores ofrecemos envío propio, ideal para plantas grandes o macetas que requieren un traslado más cuidadoso.",
        },
        {
          title: "Plazos de entrega",
          text: "Área metropolitana: 24 a 48 horas hábiles.\nInterior del país: entre 3 y 7 días hábiles, según la localidad y el transporte disponible.\nLos plazos pueden variar en fechas de alta demanda (Día de la Madre, Navidad y Primavera).",
        },
        {
          title: "Costo de envío",
          text: "El costo se calcula automáticamente en el checkout según el código postal de destino y el volumen del pedido. Podés ver el valor exacto antes de confirmar la compra.",
        },
        {
          title: "Cuidado de las plantas en el viaje",
          text: "Cada planta se prepara y embala especialmente para el transporte: sustrato humedecido, protección de hojas y ramas, y maceta fijada para evitar movimientos. Aun así, recomendamos revisar el pedido apenas llega y regarlo si el sustrato está seco.",
        },
        {
          title: "Seguimiento del pedido",
          text: "Una vez despachado tu pedido vas a recibir un email con el número de seguimiento. También podés consultar el estado desde tu cuenta, en la sección \"Mis pedidos\".",
        },
      ]}
    />
  );
}
