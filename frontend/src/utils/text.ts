/** Normaliza texto para comparar localidades/provincias sin depender de
 * mayúsculas, tildes ni la ñ (ej: "Yerba Buena" vs "yerba buena"). Usado
 * tanto para matchear la provincia devuelta por el geocoding como para
 * sugerir la zona de envío a partir de la localidad de la dirección. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[áàâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[íìîï]/g, "i")
    .replace(/[óòôö]/g, "o")
    .replace(/[úùûü]/g, "u")
    .replace(/ñ/g, "n");
}
