import { DynamicInfoPage } from "../../components/info/DynamicInfoPage";
import { ShippingRatesCard } from "../../components/info/ShippingRatesCard";

export function Shipping() {
  return (
    <DynamicInfoPage slug="envios" fallbackTitle="Envíos">
      <ShippingRatesCard />
    </DynamicInfoPage>
  );
}
