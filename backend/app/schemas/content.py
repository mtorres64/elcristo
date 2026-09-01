from typing import Literal

from pydantic import BaseModel, Field

HeroTextPosition = Literal["left", "center", "right"]
# "split": mitad imagen / mitad panel de texto. "full": imagen a lo ancho
# completo, con el texto (si hay) superpuesto según text_position.
HeroLayout = Literal["split", "full"]


class HeroSlide(BaseModel):
    id: str
    image_desktop: str
    image_mobile: str | None = None
    html: str = ""
    layout: HeroLayout = "split"
    text_position: HeroTextPosition = "left"
    text_color: str = "#1A1A1A"
    bg_color: str = "#F5F5F3"
    bg_opacity: int = Field(100, ge=0, le=100)
    link_url: str | None = None
    active: bool = True
    alt: str = ""


class HeroSlideInput(BaseModel):
    id: str | None = None
    image_desktop: str
    image_mobile: str | None = None
    html: str = ""
    layout: HeroLayout = "split"
    text_position: HeroTextPosition = "left"
    text_color: str = "#1A1A1A"
    bg_color: str = "#F5F5F3"
    bg_opacity: int = Field(100, ge=0, le=100)
    link_url: str | None = None
    active: bool = True
    alt: str = ""


class HeroSettings(BaseModel):
    slides: list[HeroSlide]


class HeroSettingsUpdate(BaseModel):
    slides: list[HeroSlideInput] = Field(default_factory=list)


class AboutChapter(BaseModel):
    id: str
    eyebrow: str = ""
    title: str = ""
    text: str = ""
    image: str = ""


class AboutChapterInput(BaseModel):
    id: str | None = None
    eyebrow: str = ""
    title: str = ""
    text: str = ""
    image: str = ""


class AboutSettings(BaseModel):
    hero_image: str = ""
    hero_title: str = ""
    intro_title: str = ""
    intro_text: str = ""
    chapters: list[AboutChapter] = Field(default_factory=list)
    gallery: list[str] = Field(default_factory=list)


class AboutSettingsUpdate(BaseModel):
    hero_image: str = ""
    hero_title: str = ""
    intro_title: str = ""
    intro_text: str = ""
    chapters: list[AboutChapterInput] = Field(default_factory=list)
    gallery: list[str] = Field(default_factory=list)


class InspirationProject(BaseModel):
    id: str
    title: str = ""
    description: str = ""
    location: str = ""
    image: str = ""


class InspirationProjectInput(BaseModel):
    id: str | None = None
    title: str = ""
    description: str = ""
    location: str = ""
    image: str = ""


class InspirationSettings(BaseModel):
    hero_image: str = ""
    hero_title: str = ""
    intro_title: str = ""
    intro_text: str = ""
    projects: list[InspirationProject] = Field(default_factory=list)


class InspirationSettingsUpdate(BaseModel):
    hero_image: str = ""
    hero_title: str = ""
    intro_title: str = ""
    intro_text: str = ""
    projects: list[InspirationProjectInput] = Field(default_factory=list)


class DesignProject(BaseModel):
    id: str
    title: str = ""
    description: str = ""
    location: str = ""
    image: str = ""


class DesignProjectInput(BaseModel):
    id: str | None = None
    title: str = ""
    description: str = ""
    location: str = ""
    image: str = ""


class DesignSettings(BaseModel):
    hero_image: str = ""
    hero_title: str = ""
    intro_title: str = ""
    intro_text: str = ""
    projects: list[DesignProject] = Field(default_factory=list)


class DesignSettingsUpdate(BaseModel):
    hero_image: str = ""
    hero_title: str = ""
    intro_title: str = ""
    intro_text: str = ""
    projects: list[DesignProjectInput] = Field(default_factory=list)


# Páginas de solo texto del footer (Envíos, Medios de pago, Cambios y
# devoluciones, Preguntas frecuentes, Términos y condiciones): un título de
# página y una lista de secciones cortas (subtítulo + párrafo).
class InfoPageSection(BaseModel):
    id: str
    title: str = ""
    text: str = ""


class InfoPageSectionInput(BaseModel):
    id: str | None = None
    title: str = ""
    text: str = ""


class InfoPageSettings(BaseModel):
    title: str = ""
    sections: list[InfoPageSection] = Field(default_factory=list)


class InfoPageSettingsUpdate(BaseModel):
    title: str = ""
    sections: list[InfoPageSectionInput] = Field(default_factory=list)


# Links a redes sociales que se muestran en el footer. El vendedor elige la
# red (define el ícono) y pega la URL.
SocialPlatform = Literal[
    "instagram",
    "facebook",
    "pinterest",
    "x",
    "youtube",
    "tiktok",
    "linkedin",
    "threads",
    "whatsapp",
]


class SocialLink(BaseModel):
    id: str
    platform: SocialPlatform
    url: str = ""


class SocialLinkInput(BaseModel):
    id: str | None = None
    platform: SocialPlatform
    url: str = ""


class SocialSettings(BaseModel):
    links: list[SocialLink] = Field(default_factory=list)


class SocialSettingsUpdate(BaseModel):
    links: list[SocialLinkInput] = Field(default_factory=list)
