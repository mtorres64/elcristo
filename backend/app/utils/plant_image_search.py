"""Búsqueda de fotos de plantas en Wikimedia Commons.

Se usa Commons (en vez de una búsqueda de imágenes web genérica) porque
las licencias son claras (CC / dominio público) y la API es pública, sin
necesidad de API key. El admin siempre confirma visualmente antes de que
una foto sugerida termine subida a Cloudinary (ver `save_image` en
`app/utils/upload.py`) — este módulo solo devuelve candidatos, nunca
sube nada.
"""
import re
from urllib.parse import urlparse

import httpx

_COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php"
_USER_AGENT = "ViveroElCristoTienda/1.0 (+https://viveroelcristo.com)"
_TIMEOUT = httpx.Timeout(8.0, connect=4.0)
_MAX_IMAGE_BYTES = 5 * 1024 * 1024

_HTML_TAG_RE = re.compile(r"<[^>]+>")

# Los títulos de este vivero terminan en un código de tamaño de maceta
# ("WESTRINGIA E.10", "SEDUM GRIS GRUESO M13/15") que nunca va a aparecer
# en Wikimedia Commons — hay que sacarlo antes de buscar.
_SIZE_CODE_RE = re.compile(r"\s+[A-Za-z]{1,3}\.?\d{1,3}(?:/\d{1,3})?$")


class WikimediaUnavailableError(Exception):
    """El servicio de Wikimedia Commons no respondió correctamente."""


def _strip_html(text: str) -> str:
    """`extmetadata.Artist`/`Credit` suelen traer un <a> con el nombre del
    autor. Se limpia para mostrar texto plano en el admin (nunca se debe
    renderizar como HTML en el frontend)."""
    return _HTML_TAG_RE.sub("", text).strip()


def build_query(title: str) -> str:
    """Solo se usa el título (sin el código de tamaño): Commons indexa por
    nombre de la planta, no por atributos de catálogo del vivero — probado
    a mano contra la API real, agregar el tipo de planta (`attributes.
    plant_type`, ej. "Arbusto de hoja perenne") a la búsqueda hacía que
    Commons devolviera cero resultados en la mayoría de los productos."""
    return _SIZE_CODE_RE.sub("", title).strip()


async def search_plant_images(query: str, limit: int = 8) -> list[dict]:
    """Busca imágenes en el namespace File: de Commons y devuelve, en una
    sola llamada (gracias a iiurlwidth), thumbnail + full-res + atribución
    por candidato."""
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap|drawing {query}",
        "gsrnamespace": 6,
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime",
        "iiurlwidth": 400,
    }

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            res = await client.get(
                _COMMONS_API_URL, params=params, headers={"User-Agent": _USER_AGENT}
            )
    except httpx.HTTPError:
        raise WikimediaUnavailableError("No se pudo contactar Wikimedia Commons") from None

    if res.status_code != 200:
        raise WikimediaUnavailableError("Wikimedia Commons devolvió un error")

    pages = res.json().get("query", {}).get("pages", {})

    candidates = []
    for page in pages.values():
        imageinfo = (page.get("imageinfo") or [None])[0]
        if not imageinfo or not imageinfo.get("url"):
            continue

        # No mostrar candidatos que después van a fallar al confirmar: se
        # sube el original (`full_url`), no el thumbnail, así que el límite
        # de tamaño se chequea acá contra el tamaño real del archivo.
        size = imageinfo.get("size")
        if size is not None and size > _MAX_IMAGE_BYTES:
            continue

        extmetadata = imageinfo.get("extmetadata", {})

        def meta(key: str) -> str:
            return extmetadata.get(key, {}).get("value", "")

        attribution = _strip_html(meta("Artist")) or _strip_html(meta("Credit"))

        candidates.append(
            {
                "title": page.get("title", ""),
                "thumbnail_url": imageinfo.get("thumburl") or imageinfo["url"],
                "full_url": imageinfo["url"],
                "source_url": imageinfo.get("descriptionurl", ""),
                "license": meta("LicenseShortName") or None,
                "attribution": attribution or None,
            }
        )

    return candidates


async def search_with_fallback(query: str, limit: int = 8) -> tuple[str, list[dict]]:
    """Busca probando primero el texto completo y, si no hay resultados, va
    sacando la última palabra de a una. Los nombres de planta suelen ser
    "Género especie variedad/color" — alcanza con género/especie para
    encontrar coincidencias en Commons, mientras que palabras descriptivas
    al final (color, textura) casi siempre dan cero resultados si se
    buscan literalmente (confirmado a mano contra la API real)."""
    words = query.split()
    if not words:
        return query, []

    for n in range(len(words), 0, -1):
        candidate_query = " ".join(words[:n])
        candidates = await search_plant_images(candidate_query, limit)
        if candidates:
            return candidate_query, candidates

    return query, []


def _is_wikimedia_host(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    return host == "wikimedia.org" or host.endswith(".wikimedia.org")


async def fetch_wikimedia_image(url: str) -> bytes:
    """Descarga una imagen que el admin eligió entre las sugerencias.
    Valida que la URL sea realmente de Wikimedia antes de pedirla — este
    endpoint no debe convertirse en un proxy para bajar cualquier URL."""
    if not _is_wikimedia_host(url):
        raise ValueError("La URL no pertenece a Wikimedia")

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            res = await client.get(url, headers={"User-Agent": _USER_AGENT})
    except httpx.HTTPError:
        raise WikimediaUnavailableError("No se pudo descargar la imagen") from None

    if res.status_code != 200:
        raise WikimediaUnavailableError("No se pudo descargar la imagen")

    if len(res.content) > _MAX_IMAGE_BYTES:
        raise ValueError("La imagen supera el tamaño máximo permitido (5MB)")

    return res.content
