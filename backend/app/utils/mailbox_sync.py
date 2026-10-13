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


async def sync_tenant_inbox(tenant_id: str) -> None:
    db = get_db()
    config = await imap_client.resolve_imap_config(tenant_id)
    if config is None:
        return

    doc = await db.tenant_integrations.find_one(
        {"tenant_id": tenant_id, "provider": "email", "deleted_at": None}
    )
    last_uid = (doc or {}).get("imap_last_uid", 0)
    uid_validity = (doc or {}).get("imap_uid_validity")

    now = datetime.now(UTC)
    try:
        result = await asyncio.to_thread(imap_client.sync, config, last_uid, uid_validity)
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

    for m in result.messages:
        await db.inbox_emails.update_one(
            {"tenant_id": tenant_id, "uid": m.uid},
            {
                "$set": {
                    "tenant_id": tenant_id,
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
                "$setOnInsert": {"is_read": False, "created_at": now},
            },
            upsert=True,
        )

    await db.tenant_integrations.update_one(
        {"tenant_id": tenant_id, "provider": "email"},
        {"$set": {
            "imap_last_uid": result.last_uid,
            "imap_uid_validity": result.uid_validity,
            "imap_last_synced_at": now,
            "imap_last_verified_ok": True,
            "imap_last_verified_message": f"Sincronizado — {len(result.messages)} correo(s) nuevo(s)",
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
