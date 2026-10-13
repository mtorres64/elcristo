from datetime import datetime

from pydantic import BaseModel, EmailStr


class MailboxEmailOut(BaseModel):
    id: str
    from_name: str | None = None
    from_addr: str | None = None
    subject: str
    snippet: str = ""
    date: datetime | None = None
    is_read: bool = False


class MailboxEmailListOut(BaseModel):
    items: list[MailboxEmailOut]
    total: int
    unread_count: int


class MailboxEmailDetailOut(BaseModel):
    id: str
    from_name: str | None = None
    from_addr: str | None = None
    to_addr: str | None = None
    subject: str
    date: datetime | None = None
    body_text: str | None = None
    body_html: str | None = None
    is_read: bool = False


class MailboxUnreadCountOut(BaseModel):
    count: int


class MailboxSendRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str


class MailboxSendResult(BaseModel):
    ok: bool
    message: str
