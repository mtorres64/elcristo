from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("")
async def get_cart():
    # TODO: implementar en Fase 2
    raise HTTPException(501, "No implementado aún")


@router.post("/items")
async def add_item():
    # TODO: implementar en Fase 2
    raise HTTPException(501, "No implementado aún")
