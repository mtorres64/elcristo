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
    # Credenciales del webhook de Web Checkout (HTTP Basic Auth) — Getnet
    # llama a nuestra URL con `Authorization: Basic {base64(user:pass)}`
    # usando lo que se configure acá y en el Getnet Portal (Checkout
    # Configurations > Webhook), por eso tienen que coincidir en los dos lados.
    webhook_username: str | None = None
    webhook_password_encrypted: str | None = None
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
    """Config SMTP + IMAP por tenant (`provider: "email"`, misma colección
    `tenant_integrations`). A diferencia de Getnet no tiene ambientes: es un
    único juego de credenciales, reusado para enviar (SMTP) y leer (IMAP) —
    es la misma casilla.

    `password_encrypted` sólo se descifra para enviar/leer (ver
    `utils/email.py` y `utils/imap_client.py`); el endpoint GET del panel
    nunca lo devuelve, sólo informa `password_set`.
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
    # IMAP (lectura de la casilla) — usa el mismo username/password que el SMTP.
    imap_enabled: bool = False
    imap_host: str | None = None
    imap_port: int = 993
    imap_use_ssl: bool = True
    # Cursor de sincronización: evita reprocesar correos ya traídos y detecta
    # si el servidor reindexó la casilla (UIDVALIDITY cambiado => resync).
    imap_last_uid: int = 0
    imap_uid_validity: int | None = None
    imap_last_synced_at: datetime | None = None
    imap_last_verified_at: datetime | None = None
    imap_last_verified_ok: bool | None = None
    imap_last_verified_message: str | None = None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"populate_by_name": True}


class InboxEmailDocument(BaseModel):
    """Un correo entrante sincronizado por IMAP (colección `inbox_emails`).

    `uid` es el UID de IMAP dentro de esa casilla (único junto con
    `tenant_id`, no globalmente) — se usa como cursor de sincronización,
    nunca como id público (ver `id`/`_id`, el ObjectId de Mongo).
    """

    id: str | None = Field(None, alias="_id")
    tenant_id: str
    uid: int
    message_id: str | None = None
    from_name: str | None = None
    from_addr: str | None = None
    to_addr: str | None = None
    subject: str
    date: datetime | None = None
    snippet: str = ""
    body_text: str | None = None
    body_html: str | None = None
    is_read: bool = False
    created_at: datetime

    model_config = {"populate_by_name": True}
