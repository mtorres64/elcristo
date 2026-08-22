from datetime import datetime
from typing import Literal

from pydantic import BaseModel

Environment = Literal["sandbox", "production"]


class GetnetEnvCredentialsOut(BaseModel):
    seller_id: str | None = None
    client_id: str | None = None
    # No hay "últimos 4 dígitos" con sentido para un client_secret (no es una
    # tarjeta): sólo se informa si hay uno guardado, nunca se expone.
    client_secret_set: bool = False
    last_verified_at: datetime | None = None
    last_verified_ok: bool | None = None
    last_verified_message: str | None = None


class GetnetIntegrationOut(BaseModel):
    enabled: bool
    active_environment: Environment
    sandbox: GetnetEnvCredentialsOut
    production: GetnetEnvCredentialsOut
    updated_at: datetime | None = None


class GetnetEnvCredentialsUpdate(BaseModel):
    seller_id: str
    client_id: str
    # None = mantener el client_secret ya guardado para ESE ambiente (no se
    # reenvía en cada save; cada ambiente mantiene el suyo independiente).
    client_secret: str | None = None


class GetnetIntegrationUpdate(BaseModel):
    enabled: bool
    active_environment: Environment
    sandbox: GetnetEnvCredentialsUpdate
    production: GetnetEnvCredentialsUpdate


class GetnetTestConnectionResult(BaseModel):
    ok: bool
    message: str


class GetnetPublicConfig(BaseModel):
    """Lo mínimo que necesita el checkout para cobrar con Getnet.

    Nunca incluye client_id/client_secret. Si la integración está apagada,
    seller_id tampoco se expone. Refleja siempre el ambiente ACTIVO
    (`active_environment`), nunca el otro guardado pero no en uso.
    """

    enabled: bool
    environment: Environment
    seller_id: str | None = None
