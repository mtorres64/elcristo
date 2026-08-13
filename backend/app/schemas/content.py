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
