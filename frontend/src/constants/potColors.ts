/** Colores posibles de una maceta/accesorio — mismos valores que el
 * desplegable de la planilla de importación y que espera el backend
 * (ver backend/app/routers/product_import.py POT_COLORS). El stock de un
 * producto de este tipo se trackea por color, no en un único número. */
export const POT_COLORS = ["TERRACOTA", "NEGRO", "BLANCO", "VERDE", "GRIS"] as const;

export type PotColor = (typeof POT_COLORS)[number];
