from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # MongoDB
    mongo_url: str = "mongodb://localhost:27017"
    mongo_db_name: str = "tienda_db"

    # JWT
    secret_key: str
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # App
    environment: str = "development"
    platform_domain: str = "tienda.com"
    upload_dir: str = "./uploads"

    # CORS — string separado por comas, se parsea en la property
    cors_origins_raw: str = "http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]

    # MercadoPago (Fase 2)
    mercadopago_access_token: str = ""

    # Getnet — clave simétrica para cifrar/descifrar el client_secret guardado
    # por tenant en `tenant_integrations` (Mongo). Las credenciales operativas
    # (client_id, client_secret, seller_id, ambiente, on/off) NO viven acá:
    # se configuran por tenant desde el panel Integraciones.
    integrations_encryption_key: str = ""

    # Cloudinary — almacenamiento de imágenes en producción
    # (con ENVIRONMENT=development se ignora y se usa disco local)
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    # SMTP (Fase 2)
    smtp_host: str = "smtp.mailtrap.io"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


settings = Settings()  # type: ignore[call-arg]
