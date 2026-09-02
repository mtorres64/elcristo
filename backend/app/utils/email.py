"""Envío de emails transaccionales por SMTP.

La config SMTP efectiva se resuelve por tenant (`resolve_smtp_config`):
primero la del panel de Integraciones (colección `tenant_integrations`,
`provider: "email"`), si no la de variables de entorno (`SMTP_*`), si no
`None` — en cuyo caso el email no se envía y sólo se escribe al log.

`send_email` es best-effort (nunca propaga: un problema de correo no debe
romper el flujo que lo invoca). `deliver_email` sí levanta `EmailError`
y lo usa el botón "Enviar correo de prueba" del panel para reportar el error.
"""
import logging
import smtplib
from email.message import EmailMessage

from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)


class SmtpConfig(BaseModel):
    host: str
    port: int = 587
    username: str = ""
    password: str = ""
    from_email: str
    use_tls: bool = True


class EmailError(Exception):
    """Falló la entrega del email (conexión, auth o envío SMTP)."""


def env_smtp_config() -> SmtpConfig | None:
    """Config SMTP tomada de variables de entorno, o None si no está completa."""
    if not settings.smtp_user or not settings.smtp_password:
        return None
    return SmtpConfig(
        host=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_password,
        from_email=settings.smtp_from,
        use_tls=True,
    )


async def resolve_smtp_config(tenant_id: str) -> SmtpConfig | None:
    """Config SMTP efectiva del tenant: panel de Integraciones > env > None."""
    # Imports diferidos: evitan ciclos en import time (database/crypto no
    # dependen de este módulo, pero sí al revés desde los routers).
    from app.database import get_db
    from app.utils.crypto import CryptoConfigError, decrypt_secret

    try:
        db = get_db()
    except RuntimeError:
        db = None

    if db is not None:
        doc = await db.tenant_integrations.find_one(
            {"tenant_id": tenant_id, "provider": "email", "deleted_at": None}
        )
        if doc and doc.get("enabled") and _doc_is_complete(doc):
            try:
                password = decrypt_secret(doc["password_encrypted"])
            except CryptoConfigError:
                logger.exception("No se pudo descifrar la contraseña SMTP del tenant %s", tenant_id)
                password = ""
            if password:
                return SmtpConfig(
                    host=doc["host"],
                    port=doc.get("port", 587),
                    username=doc.get("username", ""),
                    password=password,
                    from_email=doc["from_email"],
                    use_tls=doc.get("use_tls", True),
                )

    return env_smtp_config()


def _doc_is_complete(doc: dict) -> bool:
    return bool(doc.get("host") and doc.get("from_email") and doc.get("password_encrypted"))


def _build_message(to: str, subject: str, html_body: str, text_body: str | None, from_email: str):
    msg = EmailMessage()
    msg["From"] = from_email
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text_body or "Abrí este correo en un cliente que soporte HTML.")
    msg.add_alternative(html_body, subtype="html")
    return msg


def deliver_email(
    to: str, subject: str, html_body: str, config: SmtpConfig, text_body: str | None = None
) -> None:
    """Entrega el email o levanta EmailError con el motivo."""
    msg = _build_message(to, subject, html_body, text_body, config.from_email)
    try:
        with smtplib.SMTP(config.host, config.port, timeout=15) as server:
            if config.use_tls:
                server.starttls()
            if config.username:
                server.login(config.username, config.password)
            server.send_message(msg)
    except Exception as exc:
        raise EmailError(str(exc) or exc.__class__.__name__) from exc


def send_email(
    to: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
    config: SmtpConfig | None = None,
) -> None:
    """Best-effort: si no hay config lo loguea, si falla lo loguea. Nunca propaga."""
    if config is None:
        logger.warning(
            "SMTP sin configurar — email NO enviado a %s.\nAsunto: %s\n%s",
            to,
            subject,
            text_body or html_body,
        )
        return
    try:
        deliver_email(to, subject, html_body, config, text_body)
    except EmailError:
        logger.exception("Falló el envío de email a %s (asunto: %s)", to, subject)
