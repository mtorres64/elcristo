import { api } from "../services/api";
import { ARGENTINE_PROVINCES } from "../types/address";
import { normalizeText } from "./text";

export interface GeocodedAddress {
  street: string;
  locality: string;
  province: string | null;
  zip: string;
  hasNumber: boolean;
}

function matchProvince(raw: string | undefined): string | null {
  if (!raw) return null;
  const n = normalizeText(raw);
  const found = ARGENTINE_PROVINCES.find((p) => normalizeText(p).includes(n) || n.includes(normalizeText(p)));
  if (found) return found;
  // Nominatim suele devolver "Ciudad Autónoma de Buenos Aires" como "Buenos Aires" a secas
  // cuando la localidad ya es CABA — no hay mucho más que hacer sin geodata propia.
  return null;
}

/** Geolocalización del navegador + reverse geocoding (Nominatim / OpenStreetMap).
 *
 * El reverse geocoding pasa por nuestro backend (`/geocode/reverse`) en vez de
 * pegarle a Nominatim directo desde acá: Nominatim exige un User-Agent
 * identificando la app y un `fetch` del navegador siempre manda el User-Agent
 * real (esa cabecera no se puede pisar desde JS), así que llamarlo directo
 * incumplía su política de uso y causaba fallos intermitentes. */
export async function geolocateAddress(): Promise<GeocodedAddress> {
  if (!("geolocation" in navigator)) {
    throw new Error("Tu navegador no soporta geolocalización");
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });

  const { latitude, longitude } = position.coords;
  const res = await api.get("/geocode/reverse", { params: { lat: latitude, lng: longitude } });
  const addr = res.data ?? {};

  // Fuera de las zonas más céntricas, OSM suele tener la calle sin nombre
  // cargado (way sin tag `name`) — Nominatim no puede inventarlo. En vez de
  // tirar todo el resultado, devolvemos lo que sí conseguimos (localidad,
  // provincia, CP) y dejamos la calle vacía para que el usuario la escriba;
  // sólo fallamos de verdad si no rescatamos ni un solo dato útil.
  const street = addr.road || addr.pedestrian || addr.residential || "";
  // Ciudad/pueblo antes que barrio: los envíos se configuran por localidad
  // (San Miguel de Tucumán, Yerba Buena...), no por barrio (Santillán, Villa
  // Luján...) — si priorizáramos el barrio, cada zona necesitaría listar
  // todos los barrios de cada localidad en vez de la localidad sola.
  const locality = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || "";
  if (!street && !locality && !addr.state && !addr.postcode) {
    throw new Error("No pudimos obtener datos de tu ubicación");
  }

  return {
    street,
    locality,
    province: matchProvince(addr.state),
    zip: addr.postcode || "",
    hasNumber: !!addr.house_number,
  };
}
