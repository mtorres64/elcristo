from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

IntegrationEnvironment = Literal["sandbox", "production"]


class TenantIntegrationEnvConfig(BaseModel):
    """Credenciales de un ambiente (sandbox o producción) para un proveedor.

    Sandbox y producción son comercios/credenciales completamente distintos
    del lado de Getnet — se guardan por separado para que cambiar el ambiente
    activo no pise las credenciales del otro.
    """

    seller_id: str | None = None
    client_id: str | None = None
    client_secret_encrypted: str | None = None
    last_verified_at: datetime | None = None
    last_verified_ok: bool | None = None
    last_verified_message: str | None = None


class TenantIntegrationDocument(BaseModel):
    """Config de una integración de pago por tenant (ej. Getnet).

    `client_secret_encrypted` nunca se decodifica más que para llamar a la API
    del proveedor (ver `utils/getnet_client.py`) — el endpoint GET del panel
    jamás lo devuelve, sólo informa si está seteado (`client_secret_set`).
    """

    id: str | None = Field(None, alias="_id")
    tenant_id: str
    provider: Literal["getnet", "email"] = "getnet"
    enabled: bool = False
    # Cuál de los dos juegos de credenciales usa el checkout ahora mismo.
    active_environment: IntegrationEnvironment = "sandbox"
    sandbox: TenantIntegrationEnvConfig = Field(default_factory=TenantIntegrationEnvConfig)
    production: TenantIntegrationEnvConfig = Field(default_factory=TenantIntegrationEnvConfig)
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"populate_by_name": True}


class TenantEmailIntegrationDocument(BaseModel):
    """Config SMTP por tenant (`provider: "email"`, misma colección
    `tenant_integrations`). A diferencia de Getnet no tiene ambientes: es un
    único juego de credenciales.

    `password_encrypted` sólo se descifra para enviar (ver `utils/email.py`);
    el endpoint GET del panel nunca lo devuelve, sólo informa `password_set`.
    """

    id: str | None = Field(None, alias="_id")
    tenant_id: str
    provider: Literal["email"] = "email"
    enabled: bool = False
    host: str | None = None
    port: int = 587
    username: str | None = None
    password_encrypted: str | None = None
    from_email: str | None = None
    use_tls: bool = True
    last_verified_at: datetime | None = None
    last_verified_ok: bool | None = None
    last_verified_message: str | None = None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"populate_by_name": True}
