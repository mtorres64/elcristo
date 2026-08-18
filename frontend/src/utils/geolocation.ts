import { ARGENTINE_PROVINCES } from "../types/address";

export interface GeocodedAddress {
  street: string;
  locality: string;
  province: string | null;
  zip: string;
  hasNumber: boolean;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áàâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[íìîï]/g, "i")
    .replace(/[óòôö]/g, "o")
    .replace(/[úùûü]/g, "u")
    .replace(/ñ/g, "n");
}

function matchProvince(raw: string | undefined): string | null {
  if (!raw) return null;
  const n = normalize(raw);
  const found = ARGENTINE_PROVINCES.find((p) => normalize(p).includes(n) || n.includes(normalize(p)));
  if (found) return found;
  // Nominatim suele devolver "Ciudad Autónoma de Buenos Aires" como "Buenos Aires" a secas
  // cuando la localidad ya es CABA — no hay mucho más que hacer sin geodata propia.
  return null;
}

/** Geolocalización del navegador + reverse geocoding gratuito (Nominatim / OpenStreetMap, sin API key). */
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
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=es`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo obtener la dirección");
  const data = await res.json();
  const addr = data.address ?? {};

  const street = addr.road || addr.pedestrian || addr.residential || "";
  if (!street) throw new Error("No se pudo determinar la calle de tu ubicación");

  return {
    street,
    locality: addr.suburb || addr.neighbourhood || addr.city || addr.town || addr.village || "",
    province: matchProvince(addr.state),
    zip: addr.postcode || "",
    hasNumber: !!addr.house_number,
  };
}
