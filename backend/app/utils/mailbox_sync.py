"""Sincronización periódica de la casilla (IMAP) hacia `inbox_emails`.

`sync_all_tenants` la llama el loop de fondo en `main.py` cada 5 minutos
(pedido del negocio); `sync_tenant_inbox` también la usa el botón "Probar
conexión IMAP" del panel para forzar una corrida inmediata.
"""
import asyncio
import logging
from datetime import UTC, datetime

from app.database import get_db
from app.utils import imap_client

logger = logging.getLogger(__name__)


async def _sync_folder(
    db, tenant_id: str, config: imap_client.ImapConfig, folder: str, folder_tag: str, doc: dict
) -> int:
    """Sincroniza una carpeta IMAP (`folder`, ej. "INBOX" o la de enviados)
    hacia `inbox_emails` con `folder: folder_tag` ("inbox"/"sent"). Devuelve
    la cantidad de correos nuevos."""
    uid_key = "imap_last_uid" if folder_tag == "inbox" else "imap_sent_last_uid"
    validity_key = "imap_uid_validity" if folder_tag == "inbox" else "imap_sent_uid_validity"
    last_uid = doc.get(uid_key, 0)
    uid_validity = doc.get(validity_key)

    result = await asyncio.to_thread(imap_client.sync, config, last_uid, uid_validity, folder)

    now = datetime.now(UTC)
    for m in result.messages:
        await db.inbox_emails.update_one(
            {"tenant_id": tenant_id, "folder": folder_tag, "uid": m.uid},
            {
                "$set": {
                    "tenant_id": tenant_id,
                    "folder": folder_tag,
                    "uid": m.uid,
                    "message_id": m.message_id,
                    "from_name": m.from_name,
                    "from_addr": m.from_addr,
                    "to_addr": m.to_addr,
                    "subject": m.subject,
                    "date": m.date,
                    "snippet": m.snippet,
                    "body_text": m.body_text,
                    "body_html": m.body_html,
                },
                "$setOnInsert": {"is_read": folder_tag != "inbox", "created_at": now},
            },
            upsert=True,
        )

    await db.tenant_integrations.update_one(
        {"tenant_id": tenant_id, "provider": "email"},
        {"$set": {uid_key: result.last_uid, validity_key: result.uid_validity}},
    )
    return len(result.messages)


async def sync_tenant_inbox(tenant_id: str) -> None:
    db = get_db()
    config = await imap_client.resolve_imap_config(tenant_id)
    if config is None:
        return

    doc = await db.tenant_integrations.find_one(
        {"tenant_id": tenant_id, "provider": "email", "deleted_at": None}
    ) or {}

    now = datetime.now(UTC)
    try:
        new_count = await _sync_folder(db, tenant_id, config, "INBOX", "inbox", doc)

        sent_folder = doc.get("imap_sent_folder")
        if not sent_folder:
            sent_folder = await asyncio.to_thread(imap_client.find_sent_folder, config)
            if sent_folder:
                await db.tenant_integrations.update_one(
                    {"tenant_id": tenant_id, "provider": "email"},
                    {"$set": {"imap_sent_folder": sent_folder}},
                )
        if sent_folder:
            doc = await db.tenant_integrations.find_one(
                {"tenant_id": tenant_id, "provider": "email", "deleted_at": None}
            ) or {}
            new_count += await _sync_folder(db, tenant_id, config, sent_folder, "sent", doc)
    except imap_client.ImapError as exc:
        await db.tenant_integrations.update_one(
            {"tenant_id": tenant_id, "provider": "email"},
            {"$set": {
                "imap_last_verified_ok": False,
                "imap_last_verified_message": str(exc),
                "imap_last_verified_at": now,
            }},
        )
        logger.warning("Falló la sincronización IMAP del tenant %s: %s", tenant_id, exc)
        return

    await db.tenant_integrations.update_one(
        {"tenant_id": tenant_id, "provider": "email"},
        {"$set": {
            "imap_last_synced_at": now,
            "imap_last_verified_ok": True,
            "imap_last_verified_message": f"Sincronizado — {new_count} correo(s) nuevo(s)",
            "imap_last_verified_at": now,
        }},
    )


async def sync_all_tenants() -> None:
    db = get_db()
    cursor = db.tenant_integrations.find(
        {"provider": "email", "imap_enabled": True, "deleted_at": None}, {"tenant_id": 1}
    )
    tenant_ids = [doc["tenant_id"] async for doc in cursor]
    for tenant_id in tenant_ids:
        try:
            await sync_tenant_inbox(tenant_id)
        except Exception:
            logger.exception("Error inesperado sincronizando la casilla del tenant %s", tenant_id)
