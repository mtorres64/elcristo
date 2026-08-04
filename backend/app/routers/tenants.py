from fastapi import APIRouter, HTTPException, Request

from app.schemas.tenant import TenantCreate, TenantCreateResponse, TenantPublicResponse, TenantUpdate

router = APIRouter()


@router.post("", response_model=TenantCreateResponse, status_code=201)
async def create_tenant(body: TenantCreate, request: Request):
    # TODO: implementar en Fase 1
    raise HTTPException(501, "No implementado aún")


@router.get("/{slug}", response_model=TenantPublicResponse)
async def get_tenant(slug: str):
    # TODO: implementar en Fase 1
    raise HTTPException(501, "No implementado aún")


@router.patch("/me", response_model=TenantPublicResponse)
async def update_tenant(body: TenantUpdate, request: Request):
    # TODO: implementar en Fase 1
    raise HTTPException(501, "No implementado aún")
