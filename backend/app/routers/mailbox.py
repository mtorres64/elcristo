"""Bandeja de entrada del correo del tenant (lectura vía IMAP, sincronizada
en segundo plano cada 5 minutos por `utils/mailbox_sync.py`) + envío de
correos sueltos reusando el SMTP ya configurado en Integraciones.
"""
import asyncio

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Query, Request

from app.database import get_db
from app.schemas.mailbox import (
    MailboxEmailDetailOut,
    MailboxEmailListOut,
    MailboxEmailOut,
    MailboxSendRequest,
    MailboxSendResult,
    MailboxUnreadCountOut,
)
from app.utils.auth_deps import require_user
from app.utils.email import EmailError, deliver_email, resolve_smtp_config

router = APIRouter()


def _require_seller_or_admin(request: Request) -> dict:
    user = require_user(request)
    if user.get("role") not in ("seller", "platform_admin"):
        raise HTTPException(403, "No tenés permisos para administrar el correo")
    return user


def _tenant_id(request: Request) -> str:
    return getattr(request.state, "tenant_id", None) or "default"


def _to_out(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "folder": doc.get("folder", "inbox"),
        "from_name": doc.get("from_name"),
        "from_addr": doc.get("from_addr"),
        "to_addr": doc.get("to_addr"),
        "subject": doc.get("subject") or "(sin asunto)",
        "snippet": doc.get("snippet") or "",
        "date": doc.get("date"),
        "is_read": doc.get("is_read", False),
    }


def _to_detail(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "folder": doc.get("folder", "inbox"),
        "from_name": doc.get("from_name"),
        "from_addr": doc.get("from_addr"),
        "to_addr": doc.get("to_addr"),
        "subject": doc.get("subject") or "(sin asunto)",
        "date": doc.get("date"),
        "body_text": doc.get("body_text"),
        "body_html": doc.get("body_html"),
        "is_read": doc.get("is_read", False),
    }


def _folder_filter(tid: str, folder: str) -> dict:
    # Los correos sincronizados antes de que existiera la carpeta "Enviados"
    # no tienen el campo `folder` guardado — todos eran de INBOX, así que
    # para "inbox" también matcheamos los que no lo tienen.
    if folder == "inbox":
        return {"tenant_id": tid, "$or": [{"folder": "inbox"}, {"folder": {"$exists": False}}]}
    return {"tenant_id": tid, "folder": folder}


@router.get("/emails", response_model=MailboxEmailListOut)
async def list_emails(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    folder: str = Query("inbox", pattern="^(inbox|sent)$"),
):
    _require_seller_or_admin(request)
    db = get_db()
    tid = _tenant_id(request)
    filt = _folder_filter(tid, folder)

    total = await db.inbox_emails.count_documents(filt)
    unread_count = await db.inbox_emails.count_documents(
        {**_folder_filter(tid, "inbox"), "is_read": False}
    )
    cursor = (
        db.inbox_emails.find(filt)
        .sort("date", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items = [_to_out(doc) async for doc in cursor]
    return {"items": items, "total": total, "unread_count": unread_count}


@router.get("/unread-count", response_model=MailboxUnreadCountOut)
async def unread_count(request: Request):
    _require_seller_or_admin(request)
    db = get_db()
    count = await db.inbox_emails.count_documents(
        {**_folder_filter(_tenant_id(request), "inbox"), "is_read": False}
    )
    return {"count": count}


@router.get("/emails/{email_id}", response_model=MailboxEmailDetailOut)
async def get_email(email_id: str, request: Request):
    _require_seller_or_admin(request)
    db = get_db()
    try:
        oid = ObjectId(email_id)
    except InvalidId:
        raise HTTPException(404, "Correo no encontrado")

    doc = await db.inbox_emails.find_one({"_id": oid, "tenant_id": _tenant_id(request)})
    if not doc:
        raise HTTPException(404, "Correo no encontrado")

    if not doc.get("is_read"):
        await db.inbox_emails.update_one({"_id": oid}, {"$set": {"is_read": True}})
        doc["is_read"] = True
    return _to_detail(doc)


@router.post("/send", response_model=MailboxSendResult)
async def send_email_endpoint(body: MailboxSendRequest, request: Request):
    _require_seller_or_admin(request)
    config = await resolve_smtp_config(_tenant_id(request))
    if config is None:
        raise HTTPException(400, "Configurá el correo (SMTP) en Integraciones antes de enviar")

    html_body = "".join(
        f"<p>{line}</p>" for line in body.body.splitlines() if line.strip()
    ) or "<p></p>"
    try:
        await asyncio.to_thread(deliver_email, body.to, body.subject, html_body, config, body.body)
    except EmailError as exc:
        raise HTTPException(400, str(exc)) from exc
    return {"ok": True, "message": f"Correo enviado a {body.to}"}
