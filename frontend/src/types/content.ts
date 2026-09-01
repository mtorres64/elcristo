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

export interface AboutChapter {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  image: string;
}

export interface AboutSettings {
  hero_image: string;
  hero_title: string;
  intro_title: string;
  intro_text: string;
  chapters: AboutChapter[];
  gallery: string[];
}

export interface InspirationProject {
  id: string;
  title: string;
  description: string;
  location: string;
  image: string;
}

export interface InspirationSettings {
  hero_image: string;
  hero_title: string;
  intro_title: string;
  intro_text: string;
  projects: InspirationProject[];
}

export interface DesignProject {
  id: string;
  title: string;
  description: string;
  location: string;
  image: string;
}

export interface DesignSettings {
  hero_image: string;
  hero_title: string;
  intro_title: string;
  intro_text: string;
  projects: DesignProject[];
}

/** Páginas de solo texto del footer: Envíos, Medios de pago, Cambios y
 * devoluciones, Preguntas frecuentes, Términos y condiciones. */
export type InfoPageSlug =
  | "envios"
  | "medios-de-pago"
  | "cambios-y-devoluciones"
  | "preguntas-frecuentes"
  | "terminos-y-condiciones";

export interface InfoPageSection {
  id: string;
  title: string;
  text: string;
}

export interface InfoPageSettings {
  title: string;
  sections: InfoPageSection[];
}

/** Redes sociales del footer. La `platform` define el ícono y el orden en
 * el que se listan es el orden en que se muestran. */
export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "pinterest"
  | "x"
  | "youtube"
  | "tiktok"
  | "linkedin"
  | "threads"
  | "whatsapp";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
}

export interface SocialSettings {
  links: SocialLink[];
}
