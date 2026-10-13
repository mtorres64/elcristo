"""Lectura de la casilla por IMAP (sólo lectura, nunca modifica nada en el
servidor de correo — ni marca \\Seen ni borra).

La config efectiva (`resolve_imap_config`) vive en la misma colección
`tenant_integrations`/`provider: "email"` que el SMTP (ver `utils/email.py`):
es la misma casilla, así que reusa `username`/`password_encrypted`.

`sync` es la única función que habla con el server IMAP. Es bloqueante
(imaplib no tiene variante async) — quien la llame debe correrla con
`asyncio.to_thread`.
"""
import imaplib
import logging
import re
from datetime import UTC, datetime
from email import message_from_bytes
from email.header import decode_header
from email.message import Message
from email.utils import parseaddr, parsedate_to_datetime

from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Primer sync (o resync por UIDVALIDITY distinto): cuántos correos recientes
# traer como máximo, para no intentar bajar una casilla entera de golpe.
_INITIAL_SYNC_LIMIT = 50


class ImapConfig(BaseModel):
    host: str
    port: int = 993
    use_ssl: bool = True
    username: str
    password: str


class ImapError(Exception):
    """Falló la conexión, auth o lectura IMAP."""


class ParsedEmail(BaseModel):
    uid: int
    message_id: str | None
    from_name: str | None
    from_addr: str | None
    to_addr: str | None
    subject: str
    date: datetime | None
    snippet: str
    body_text: str | None
    body_html: str | None


class SyncResult(BaseModel):
    uid_validity: int | None
    last_uid: int
    messages: list[ParsedEmail]


async def resolve_imap_config(tenant_id: str) -> ImapConfig | None:
    """Config IMAP efectiva del tenant, o None si no está activa/completa."""
    from app.database import get_db
    from app.utils.crypto import CryptoConfigError, decrypt_secret

    try:
        db = get_db()
    except RuntimeError:
        return None

    doc = await db.tenant_integrations.find_one(
        {"tenant_id": tenant_id, "provider": "email", "deleted_at": None}
    )
    if not doc or not doc.get("imap_enabled") or not doc.get("imap_host") or not doc.get("password_encrypted"):
        return None

    try:
        password = decrypt_secret(doc["password_encrypted"])
    except CryptoConfigError:
        logger.exception("No se pudo descifrar la contraseña IMAP del tenant %s", tenant_id)
        return None
    if not password:
        return None

    return ImapConfig(
        host=doc["imap_host"],
        port=doc.get("imap_port", 993),
        use_ssl=doc.get("imap_use_ssl", True),
        username=doc.get("username") or "",
        password=password,
    )


def sync(config: ImapConfig, last_uid: int, uid_validity: int | None) -> SyncResult:
    """Trae los correos nuevos desde `last_uid` (exclusive). Si `uid_validity`
    cambió respecto al guardado, la casilla fue reindexada por el servidor y
    se hace un resync completo (acotado a los últimos `_INITIAL_SYNC_LIMIT`).
    """
    try:
        conn = _connect(config)
    except (OSError, imaplib.IMAP4.error) as exc:
        raise ImapError(str(exc) or exc.__class__.__name__) from exc

    try:
        try:
            conn.select("INBOX")
        except imaplib.IMAP4.error as exc:
            raise ImapError(str(exc) or "No se pudo abrir INBOX") from exc

        _typ, uv_data = conn.response("UIDVALIDITY")
        new_uid_validity = int(uv_data[0]) if uv_data and uv_data[0] else None

        reset = uid_validity is not None and new_uid_validity != uid_validity
        effective_last_uid = 0 if reset else last_uid

        if effective_last_uid == 0:
            uids = _search(conn, "ALL")
            uids = sorted(uids)[-_INITIAL_SYNC_LIMIT:]
        else:
            uids = _search(conn, f"UID {effective_last_uid + 1}:*")
            # Algunos servidores devuelven el UID más alto existente cuando el
            # rango pedido ("N:*") no tiene resultados, en vez de vacío.
            uids = sorted(u for u in uids if u > effective_last_uid)

        messages: list[ParsedEmail] = []
        for uid in uids:
            raw = _fetch_raw(conn, uid)
            if raw is None:
                continue
            try:
                messages.append(_parse_message(uid, message_from_bytes(raw)))
            except Exception:
                logger.exception("No se pudo parsear el correo UID %s", uid)

        new_last_uid = max(uids) if uids else effective_last_uid
        return SyncResult(uid_validity=new_uid_validity, last_uid=new_last_uid, messages=messages)
    finally:
        try:
            conn.logout()
        except Exception:
            pass


def _connect(config: ImapConfig) -> imaplib.IMAP4:
    if config.use_ssl:
        conn: imaplib.IMAP4 = imaplib.IMAP4_SSL(config.host, config.port, timeout=15)
    else:
        conn = imaplib.IMAP4(config.host, config.port, timeout=15)
        conn.starttls()
    conn.login(config.username, config.password)
    return conn


def _search(conn: imaplib.IMAP4, criteria: str) -> list[int]:
    typ, data = conn.uid("search", None, criteria)
    if typ != "OK" or not data or not data[0]:
        return []
    return [int(u) for u in data[0].split()]


def _fetch_raw(conn: imaplib.IMAP4, uid: int) -> bytes | None:
    typ, data = conn.uid("fetch", str(uid), "(RFC822)")
    if typ != "OK":
        return None
    for item in data:
        if isinstance(item, bytes):
            return item
        if isinstance(item, tuple) and len(item) >= 2 and isinstance(item[1], bytes):
            return item[1]
    return None


def _decode_header_value(value: str | None) -> str:
    if not value:
        return ""
    parts = decode_header(value)
    out = ""
    for text, charset in parts:
        if isinstance(text, bytes):
            out += text.decode(charset or "utf-8", errors="replace")
        else:
            out += text
    return out


def _decode_payload(part: Message) -> str:
    payload = part.get_payload(decode=True)
    if not payload:
        return ""
    charset = part.get_content_charset() or "utf-8"
    try:
        return payload.decode(charset, errors="replace")
    except LookupError:
        return payload.decode("utf-8", errors="replace")


def _extract_body(msg: Message) -> tuple[str | None, str | None]:
    text_body: str | None = None
    html_body: str | None = None
    if msg.is_multipart():
        for part in msg.walk():
            if "attachment" in str(part.get("Content-Disposition") or ""):
                continue
            ctype = part.get_content_type()
            if ctype == "text/plain" and text_body is None:
                text_body = _decode_payload(part)
            elif ctype == "text/html" and html_body is None:
                html_body = _decode_payload(part)
    elif msg.get_content_type() == "text/html":
        html_body = _decode_payload(msg)
    else:
        text_body = _decode_payload(msg)
    return text_body, html_body


def _strip_html(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", html)


def _parse_message(uid: int, msg: Message) -> ParsedEmail:
    subject = _decode_header_value(msg.get("Subject")) or "(sin asunto)"
    from_name_raw, from_addr = parseaddr(msg.get("From", ""))
    from_name = _decode_header_value(from_name_raw) or None
    to_addr = parseaddr(msg.get("To", ""))[1] or None
    message_id = msg.get("Message-ID")

    date: datetime | None = None
    date_header = msg.get("Date")
    if date_header:
        try:
            parsed = parsedate_to_datetime(date_header)
            date = parsed.astimezone(UTC) if parsed.tzinfo else parsed.replace(tzinfo=UTC)
        except (TypeError, ValueError):
            date = None

    text_body, html_body = _extract_body(msg)
    snippet_source = text_body or _strip_html(html_body or "")
    snippet = " ".join(snippet_source.split())[:160]

    return ParsedEmail(
        uid=uid,
        message_id=message_id,
        from_name=from_name,
        from_addr=from_addr or None,
        to_addr=to_addr,
        subject=subject,
        date=date,
        snippet=snippet,
        body_text=text_body,
        body_html=html_body,
    )
