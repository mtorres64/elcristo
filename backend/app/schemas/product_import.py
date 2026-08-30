from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ImportJobRow(BaseModel):
    row: int
    name: str | None = None
    action: Literal["created", "updated", "warning", "error"]
    message: str | None = None


class ImportJobOut(BaseModel):
    job_id: str
    status: Literal["processing", "completed", "failed"]
    filename: str | None = None
    total: int = 0
    processed: int = 0
    created: int = 0
    updated: int = 0
    warnings: int = 0
    errors: int = 0
    rows: list[ImportJobRow] = []
    error: str | None = None
    created_at: datetime | None = None
    finished_at: datetime | None = None


class ImportStartResponse(BaseModel):
    job_id: str
