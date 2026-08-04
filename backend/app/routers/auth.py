from fastapi import APIRouter, HTTPException, Request

from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
)

router = APIRouter()


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(body: RegisterRequest):
    # TODO: implementar en Fase 1
    raise HTTPException(501, "No implementado aún")


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    # TODO: implementar en Fase 1
    raise HTTPException(501, "No implementado aún")


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(body: RefreshRequest):
    # TODO: implementar en Fase 1
    raise HTTPException(501, "No implementado aún")


@router.get("/me", response_model=MeResponse)
async def me(request: Request):
    if not request.state.current_user:
        raise HTTPException(401, "No autenticado")
    # TODO: completar en Fase 1
    raise HTTPException(501, "No implementado aún")
