from pydantic import field_validator
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

    # CORS — acepta JSON ["url1","url2"] o lista separada por comas url1,url2
    cors_origins: list[str] = ["http://localhost:5173"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> list[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                import json
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v  # type: ignore[return-value]

    # MercadoPago (Fase 2)
    mercadopago_access_token: str = ""

    # S3 (Fase 2)
    s3_bucket: str = ""
    s3_endpoint: str = ""
    s3_key: str = ""
    s3_secret: str = ""

    # SMTP (Fase 2)
    smtp_host: str = "smtp.mailtrap.io"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


settings = Settings()  # type: ignore[call-arg]
