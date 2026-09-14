import axios from "axios";

// API pública de Georef (datos.gob.ar) — CORS abierto, sin API key, pensada
// justo para esto (combos de provincia/localidad en formularios). Se usa
// una instancia de axios aparte (no la de `api.ts`) porque no lleva ni
// token ni tenant: es un servicio externo sin relación con el backend propio.
const georefApi = axios.create({ baseURL: "https://apis.datos.gob.ar/georef/api" });

export const georefService = {
  /** Localidades (nivel municipio) de una provincia argentina, para el combo
   * de "Localidad" del checkout. Devuelve [] si la provincia está vacía o
   * si la API no responde — quien llama debe caer a texto libre en ese caso. */
  async getMunicipios(province: string): Promise<string[]> {
    if (!province.trim()) return [];
    const res = await georefApi.get("/municipios", {
      params: { provincia: province, campos: "nombre", max: 500, orden: "nombre" },
    });
    return (res.data?.municipios ?? []).map((m: { nombre: string }) => m.nombre);
  },
};
