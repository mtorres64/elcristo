import { api } from "../services/api";
import { ARGENTINE_PROVINCES } from "../types/address";
import { normalizeText } from "./text";

export interface GeocodedAddress {
  street: string;
  locality: string;
  province: string | null;
  zip: string;
  hasNumber: boolean;
  lat: number;
  lng: number;
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
  return reverseGeocode(latitude, longitude);
}

/** Arma un `GeocodedAddress` a partir del `address` que devuelve Nominatim
 * (reverse o search) — compartido entre los dos porque ambos cuelgan de los
 * mismos tags de OSM. No valida ni tira error: eso queda a cargo de quien
 * llama, que sabe qué hacer si el resultado viene incompleto. */
function parseNominatimAddress(addr: Record<string, string>, lat: number, lng: number): GeocodedAddress {
  // Fuera de las zonas más céntricas, OSM suele tener la calle sin nombre
  // cargado (way sin tag `name`) — Nominatim no puede inventarlo.
  const street = addr.road || addr.pedestrian || addr.residential || "";
  // Ciudad/pueblo antes que barrio: los envíos se configuran por localidad
  // (San Miguel de Tucumán, Yerba Buena...), no por barrio (Santillán, Villa
  // Luján...) — si priorizáramos el barrio, cada zona necesitaría listar
  // todos los barrios de cada localidad en vez de la localidad sola.
  const locality = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || "";
  return {
    street,
    locality,
    province: matchProvince(addr.state),
    zip: addr.postcode || "",
    hasNumber: !!addr.house_number,
    lat,
    lng,
  };
}

/** Reverse geocoding de unas coordenadas — lo usan tanto "Usar mi ubicación"
 * como el pin puesto a mano en el mapa. Devuelve también `lat`/`lng` para que
 * quien llama guarde exactamente el punto que se resolvió. */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodedAddress> {
  const res = await api.get("/geocode/reverse", { params: { lat: latitude, lng: longitude } });
  const addr = res.data ?? {};

  // La ubicación del navegador puede venir mal (sin GPS, cae a estimarla por
  // IP/red — muy impreciso en notebooks/PC de escritorio, o con VPN) y caer
  // directamente en otro país. `country_code` es la señal más confiable
  // (más que el nombre de provincia, que sólo detecta el desvío si el
  // estado/provincia extranjero no matchea ninguno argentino): sólo servimos
  // Argentina, así que si no da "ar" no tiene sentido completar nada — ni
  // siquiera la calle/CP, que quedarían siendo datos de otro país.
  if (addr.country_code && addr.country_code.toLowerCase() !== "ar") {
    throw new Error("Tu ubicación no parece estar en Argentina. Cargá la dirección a mano.");
  }

  const parsed = parseNominatimAddress(addr, latitude, longitude);
  // En vez de tirar todo el resultado cuando falta la calle, devolvemos lo
  // que sí conseguimos (localidad, provincia, CP); sólo fallamos de verdad
  // si no rescatamos ni un solo dato útil.
  if (!parsed.street && !parsed.locality && !addr.state && !addr.postcode) {
    throw new Error("No pudimos obtener datos de tu ubicación");
  }

  return parsed;
}

export interface AddressSearchResult {
  /** Texto completo para mostrar en la lista de sugerencias. */
  label: string;
  address: GeocodedAddress;
}

/** Autocompletar de direcciones para el buscador arriba del mapa (forward
 * geocoding vía Nominatim `search`, mismo proxy por backend que el reverse). */
export async function searchAddress(query: string): Promise<AddressSearchResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const res = await api.get("/geocode/search", { params: { q } });
  const results: Array<{ lat: string; lon: string; display_name: string; address?: Record<string, string> }> =
    res.data ?? [];

  return results
    .map((r): AddressSearchResult | null => {
      const addr = r.address ?? {};
      if (addr.country_code && addr.country_code.toLowerCase() !== "ar") return null;
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lon);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      return { label: r.display_name, address: parseNominatimAddress(addr, lat, lng) };
    })
    .filter((r): r is AddressSearchResult => r !== null);
}
