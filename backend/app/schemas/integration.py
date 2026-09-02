from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr

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


class EmailIntegrationOut(BaseModel):
    """Estado de la integración SMTP para el panel. Nunca incluye la
    contraseña: sólo informa si hay una guardada (`password_set`)."""

    enabled: bool = False
    host: str | None = None
    port: int = 587
    username: str | None = None
    from_email: str | None = None
    use_tls: bool = True
    password_set: bool = False
    last_verified_at: datetime | None = None
    last_verified_ok: bool | None = None
    last_verified_message: str | None = None
    updated_at: datetime | None = None


class EmailIntegrationUpdate(BaseModel):
    enabled: bool
    host: str
    port: int = 587
    username: str = ""
    from_email: str
    use_tls: bool = True
    # None = mantener la contraseña ya guardada (no se reenvía en cada save).
    password: str | None = None


class EmailTestRequest(BaseModel):
    to: EmailStr


class IntegrationTestResult(BaseModel):
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
