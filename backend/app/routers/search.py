from fastapi import APIRouter, HTTPException, Query

router = APIRouter()


@router.get("")
async def search(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    # TODO: implementar en Fase 3
    raise HTTPException(501, "No implementado aún")
