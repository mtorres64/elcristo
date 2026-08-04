import math
from typing import Any, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int
    pages: int


def paginate(total: int, page: int, page_size: int) -> dict[str, int]:
    pages = math.ceil(total / page_size) if page_size > 0 else 0
    return {"total": total, "page": page, "page_size": page_size, "pages": pages}


def get_skip(page: int, page_size: int) -> int:
    return (page - 1) * page_size
