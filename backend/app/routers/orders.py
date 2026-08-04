from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("")
async def list_orders():
    # TODO: implementar en Fase 2
    raise HTTPException(501, "No implementado aún")


@router.post("", status_code=201)
async def create_order():
    # TODO: implementar en Fase 2
    raise HTTPException(501, "No implementado aún")


@router.post("/webhook/mercadopago")
async def mp_webhook():
    # TODO: implementar en Fase 2
    return {"ok": True}
