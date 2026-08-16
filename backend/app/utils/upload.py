"""
Abstracción de almacenamiento de imágenes.
En desarrollo: disco local (UPLOAD_DIR).
En producción: Cloudinary (swap a otro backend cambiando solo este archivo).
"""
import asyncio
import logging
import uuid
from io import BytesIO
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)

# Límite por defecto (productos, categorías, etc). El carrusel del hero no
# redimensiona (ver HERO_MAX_IMAGE_DIMENSION = None en content.py) porque
# ocupa todo el ancho de pantalla y necesita la resolución original.
DEFAULT_MAX_IMAGE_DIMENSION = 800


def _resize_image(file_content: bytes, max_dimension: int | None) -> bytes:
    """Redimensiona a un máximo de max_dimension x max_dimension (ancho y
    alto, se mantiene la proporción). max_dimension=None desactiva el
    redimensionado (se sube tal cual). Si el archivo no es una imagen que
    Pillow pueda abrir (ej. SVG), lo deja pasar sin tocar en vez de romper
    la subida."""
    if max_dimension is None:
        return file_content

    from PIL import Image, ImageOps, UnidentifiedImageError

    try:
        with Image.open(BytesIO(file_content)) as img:
            if img.width <= max_dimension and img.height <= max_dimension:
                return file_content  # ya entra, no hace falta reprocesar

            original_format = img.format or "JPEG"
            img = ImageOps.exif_transpose(img)  # corrige rotación de fotos de celular
            img.thumbnail((max_dimension, max_dimension), Image.LANCZOS)

            # JPEG no soporta transparencia
            if original_format.upper() in ("JPEG", "JPG") and img.mode in ("RGBA", "P", "LA"):
                img = img.convert("RGB")

            buf = BytesIO()
            img.save(buf, format=original_format)
            return buf.getvalue()
    except UnidentifiedImageError:
        return file_content


def save_image_locally(file_content: bytes, filename: str) -> str:
    upload_path = Path(settings.upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    ext = Path(filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = upload_path / unique_name
    dest.write_bytes(file_content)
    return f"/uploads/{unique_name}"


async def save_image(
    file_content: bytes, filename: str, max_dimension: int | None = DEFAULT_MAX_IMAGE_DIMENSION
) -> str:
    """Punto de entrada único para guardar imágenes."""
    file_content = await asyncio.to_thread(_resize_image, file_content, max_dimension)
    if settings.cloudinary_cloud_name and not settings.is_development:
        return await _save_to_cloudinary(file_content, filename)
    return save_image_locally(file_content, filename)


def _upload_to_cloudinary_sync(file_content: bytes, filename: str) -> str:
    """El SDK de Cloudinary es sincrónico/bloqueante — se corre en un thread
    aparte (ver _save_to_cloudinary) para no trabar el event loop de FastAPI."""
    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )

    ext = Path(filename).suffix.lower()
    public_id = uuid.uuid4().hex

    result = cloudinary.uploader.upload(
        file_content,
        public_id=public_id,
        folder="tienda",
        format=ext.lstrip(".") or None,
        overwrite=False,
        unique_filename=False,
    )
    return result["secure_url"]


async def _save_to_cloudinary(file_content: bytes, filename: str) -> str:
    return await asyncio.to_thread(_upload_to_cloudinary_sync, file_content, filename)


def _cloudinary_public_id_from_url(url: str) -> str | None:
    """Extrae el public_id (ej. "tienda/ab12cd34") de una URL como
    https://res.cloudinary.com/<cloud>/image/upload/v123456/tienda/ab12cd34.jpg
    Devuelve None si la URL no tiene la forma esperada."""
    marker = "/upload/"
    if "res.cloudinary.com" not in url or marker not in url:
        return None
    tail = url.split(marker, 1)[1]  # "v123456/tienda/ab12cd34.jpg"
    # el primer segmento es la versión (v123456); el resto es el public_id con extensión
    _, _, path_with_ext = tail.partition("/")
    if not path_with_ext:
        return None
    return path_with_ext.rsplit(".", 1)[0]


def _destroy_cloudinary_sync(url: str) -> None:
    import cloudinary
    import cloudinary.uploader

    public_id = _cloudinary_public_id_from_url(url)
    if not public_id:
        return

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )
    cloudinary.uploader.destroy(public_id)


def delete_image_locally(url: str) -> None:
    filename = url.removeprefix("/uploads/")
    path = Path(settings.upload_dir) / filename
    path.unlink(missing_ok=True)


async def delete_image(url: str | None) -> None:
    """Borra una imagen de donde esté alojada (disco local o Cloudinary).
    No-op para URLs que no reconoce (ej. assets estáticos del frontend en
    /images/*, que nunca hay que tocar). No propaga errores: si el borrado
    falla, se loguea pero no se aborta la operación que lo disparó."""
    if not url:
        return
    try:
        if url.startswith("/uploads/"):
            await asyncio.to_thread(delete_image_locally, url)
        elif "res.cloudinary.com" in url:
            await asyncio.to_thread(_destroy_cloudinary_sync, url)
    except Exception:
        logger.warning("No se pudo borrar la imagen %s", url, exc_info=True)
