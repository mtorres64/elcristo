"""Cifrado simétrico para secretos de integraciones (ej. client_secret de Getnet).

Usa Fernet (AES-128-CBC + HMAC, con IV) sobre una clave separada de `SECRET_KEY`
(que firma JWTs) — distinto blast radius y ciclo de rotación, nunca se reusan.
"""

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


class CryptoConfigError(Exception):
    """La clave de cifrado no está configurada o es inválida."""


def _fernet() -> Fernet:
    key = settings.integrations_encryption_key
    if not key:
        raise CryptoConfigError(
            "INTEGRATIONS_ENCRYPTION_KEY no está configurada. "
            "Generá una con: python -c \"from cryptography.fernet import Fernet; "
            'print(Fernet.generate_key().decode())"'
        )
    try:
        return Fernet(key.encode())
    except ValueError as exc:
        raise CryptoConfigError(
            "INTEGRATIONS_ENCRYPTION_KEY no es una clave Fernet válida"
        ) from exc


def encrypt_secret(plain: str) -> str:
    return _fernet().encrypt(plain.encode()).decode()


def decrypt_secret(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken as exc:
        raise CryptoConfigError(
            "No se pudo descifrar el secreto (token inválido o clave rotada)"
        ) from exc
