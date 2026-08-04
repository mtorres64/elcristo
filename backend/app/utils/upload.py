"""
Abstracción de almacenamiento de imágenes.
En desarrollo: disco local (UPLOAD_DIR).
En producción: swap a S3 cambiando solo este archivo.
"""
import uuid
from pathlib import Path

from app.config import settings


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
    if settings.s3_bucket and not settings.is_development:
        return await _save_to_s3(file_content, filename)
    return save_image_locally(file_content, filename)


async def _save_to_s3(file_content: bytes, filename: str) -> str:
    raise NotImplementedError("S3 upload se implementa en Fase 2")
