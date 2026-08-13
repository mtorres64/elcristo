export type HeroTextPosition = "left" | "center" | "right";

/** "split": mitad imagen / mitad panel de texto. "full": imagen a lo ancho
 * completo, con el texto (si hay) superpuesto según text_position. */
export type HeroLayout = "split" | "full";

export interface HeroSlide {
  id: string;
  image_desktop: string;
  image_mobile: string | null;
  html: string;
  layout: HeroLayout;
  text_position: HeroTextPosition;
  /** Color del texto (hex), aplicado vía la variable CSS --hero-text. */
  text_color: string;
  /** Color de fondo del panel de texto (hex). */
  bg_color: string;
  /** Opacidad del fondo del panel, 0-100. */
  bg_opacity: number;
  link_url: string | null;
  active: boolean;
  alt: string;
}

export interface HeroSettings {
  slides: HeroSlide[];
}
