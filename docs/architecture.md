# Arquitectura del Sistema

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Python 3.12 + FastAPI + Uvicorn |
| Base de datos | MongoDB 7 (Motor para async) |
| Autenticación | JWT (python-jose) + bcrypt |
| Almacenamiento de imágenes | Local (dev) → S3-compatible (prod) |
| Pagos | MercadoPago Checkout Pro |
| Email | SMTP (dev: Mailtrap, prod: SES o SendGrid) |
| Contenedores | Docker + Docker Compose |

---

## Diagrama de componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────────┬────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Nginx (reverse    │
              │   proxy / CDN)      │
              └─────┬──────────┬───┘
                    │          │
         ┌──────────▼──┐  ┌────▼──────────┐
         │  Frontend   │  │   Backend API  │
         │  React/Vite │  │   FastAPI :8000│
         │  :5173(dev) │  └────────┬───────┘
         └─────────────┘          │
                                  │
                    ┌─────────────▼─────────────┐
                    │      MongoDB :27017         │
                    │  (Motor async driver)       │
                    └─────────────────────────────┘
```

---

## Flujo de una request

```
Buyer/Seller browser
  → Nginx
    → FastAPI (middleware stack: CORS → Auth → Tenant → Router)
      → Service layer (lógica de negocio)
        → Repository layer (MongoDB queries, siempre con tenant_id)
          → MongoDB
```

**Orden de middlewares (crítico, no cambiar):**
1. `CORSMiddleware` — permite requests cross-origin del frontend
2. `AuthMiddleware` — decodifica JWT, inyecta `current_user` (o None si público)
3. `TenantMiddleware` — resuelve `tenant_id` del header/subdominio/JWT, inyecta en request state

---

## Integraciones externas

| Integración | Propósito | Env var clave |
|---|---|---|
| MercadoPago | Pagos (Checkout Pro + webhooks) | `MERCADOPAGO_ACCESS_TOKEN` |
| Getnet | Pagos con tarjeta (tokenización client-side + auth/captura inmediata) | `INTEGRATIONS_ENCRYPTION_KEY` (credenciales por tenant en Mongo, panel Integraciones) |
| S3 / MinIO | Almacenamiento de imágenes en producción | `S3_BUCKET`, `S3_ENDPOINT`, `S3_KEY`, `S3_SECRET` |
| SMTP | Emails transaccionales | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` |

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `MONGO_URL` | Connection string de MongoDB | `mongodb://localhost:27017` |
| `MONGO_DB_NAME` | Nombre de la base de datos | `tienda_db` |
| `SECRET_KEY` | Clave para firmar JWTs (mínimo 32 chars) | `supersecretkey...` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del access token | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Expiración del refresh token | `7` |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de MercadoPago | `APP_USR-...` |
| `INTEGRATIONS_ENCRYPTION_KEY` | Clave Fernet para cifrar `client_secret` de integraciones (ej. Getnet) en Mongo | `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `UPLOAD_DIR` | Directorio local para imágenes (dev) | `./uploads` |
| `S3_BUCKET` | Bucket S3 (producción) | `tienda-images` |
| `S3_ENDPOINT` | Endpoint S3-compatible | `https://s3.amazonaws.com` |
| `S3_KEY` | Access key S3 | — |
| `S3_SECRET` | Secret key S3 | — |
| `SMTP_HOST` | Host del servidor SMTP | `smtp.mailtrap.io` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | — |
| `SMTP_PASSWORD` | Password SMTP | — |
| `PLATFORM_DOMAIN` | Dominio base para subdominios | `tienda.com` |
| `ENVIRONMENT` | `development` \| `production` | `development` |

### Frontend (`frontend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_BASE_URL` | URL base del backend | `http://localhost:8000` |
| `VITE_PLATFORM_DOMAIN` | Dominio de la plataforma | `tienda.com` |

---

## Decisiones de arquitectura fijas

Estas decisiones no se cambian sin escribir un ADR nuevo que supersede al anterior:

- `tenant_id` es un `string` (el slug de la tienda), nunca ObjectId
- Dinero almacenado como entero en centavos (nunca float)
- Todos los documentos tienen `deleted_at: datetime | null` (soft delete)
- Imágenes abstraídas detrás de `utils/upload.py` (swap local → S3 sin tocar routers)
- Un usuario es plataforma-wide; el `tenant_id` vive en el documento `tenants`, no en `users`
