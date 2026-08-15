"""
Abstracción de almacenamiento de imágenes.
En desarrollo: disco local (UPLOAD_DIR).
En producción: Cloudinary (swap a otro backend cambiando solo este archivo).
"""
import asyncio
import uuid
from io import BytesIO
from pathlib import Path

from app.config import settings

# Ninguna imagen se aloja más grande que esto (se mantiene la proporción,
# nunca se agranda una imagen más chica).
MAX_IMAGE_DIMENSION = 800


def _resize_image(file_content: bytes) -> bytes:
    """Redimensiona a un máximo de MAX_IMAGE_DIMENSION x MAX_IMAGE_DIMENSION.
    Si el archivo no es una imagen que Pillow pueda abrir (ej. SVG), lo deja
    pasar sin tocar en vez de romper la subida."""
    from PIL import Image, ImageOps, UnidentifiedImageError

    try:
        with Image.open(BytesIO(file_content)) as img:
            if img.width <= MAX_IMAGE_DIMENSION and img.height <= MAX_IMAGE_DIMENSION:
                return file_content  # ya entra, no hace falta reprocesar

            original_format = img.format or "JPEG"
            img = ImageOps.exif_transpose(img)  # corrige rotación de fotos de celular
            img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.LANCZOS)

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


async def save_image(file_content: bytes, filename: str) -> str:
    """Punto de entrada único para guardar imágenes."""
    file_content = await asyncio.to_thread(_resize_image, file_content)
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
