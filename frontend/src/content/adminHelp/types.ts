/**
 * Tipos para el contenido de ayuda contextual del panel de administración.
 *
 * Cada pantalla del panel (identificada por el patrón de ruta de React Router,
 * p. ej. "/seller/products/:productId/edit") tiene asociado un HelpTopic con
 * explicaciones detalladas de qué hace la pantalla y cómo usarla.
 */

export interface HelpBlock {
  /** "p" = párrafo de texto. "ul" = lista con viñetas. "ol" = lista numerada. */
  type: "p" | "ul" | "ol";
  /** Texto del párrafo (solo para type "p"). */
  text?: string;
  /** Ítems de la lista (solo para type "ul" | "ol"). */
  items?: string[];
}

export interface HelpSection {
  /** Título de la subsección, p. ej. "Filtros y búsqueda". */
  heading: string;
  blocks: HelpBlock[];
}

export interface HelpTopic {
  /** Título mostrado en el encabezado del modal, p. ej. "Productos". */
  title: string;
  /** Copete de 1-2 frases que resume para qué sirve la pantalla. */
  summary: string;
  sections: HelpSection[];
}

/** Mapa de patrón de ruta (formato de React Router) → contenido de ayuda. */
export type HelpTopicMap = Record<string, HelpTopic>;
