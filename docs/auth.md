# Autenticación y Autorización

Documentado en [ADR-002](adr/002-auth-jwt-strategy.md).

---

## Estrategia: JWT stateless + Refresh Token

- **Access token**: JWT firmado con HS256, corta duración (30 min).
- **Refresh token**: string opaco (UUID v4) almacenado en DB, larga duración (7 días).
- **Sin sesiones**: el backend no guarda estado de sesión. El access token se valida
  solo con la clave secreta.
- **Sin cookies**: los tokens viajan en header `Authorization: Bearer <token>`.
  El frontend los guarda en memory (no localStorage) para mitigar XSS.

---

## Estructura del Access Token (JWT)

```json
{
  "sub": "64a1b2c3d4e5f6a7b8c9d0e1",  // user._id como string
  "email": "usuario@ejemplo.com",
  "role": "buyer | seller | platform_admin",
  "tenant_id": "zapateria-bonita | null", // null para buyers y platform_admin
  "exp": 1234567890,  // Unix timestamp de expiración
  "iat": 1234566000   // Unix timestamp de emisión
}
```

El campo `tenant_id` solo está presente para sellers, y contiene el slug de su tienda.

---

## Roles y permisos

### Roles del sistema

| Role | Descripción |
|---|---|
| `buyer` | Comprador. Puede browsear, agregar al carrito, comprar, dejar reviews. |
| `seller` | Vendedor. Tiene una tienda. Gestiona sus productos y órdenes. |
| `platform_admin` | Administrador de la plataforma. Acceso total. |

### Matriz de permisos por endpoint

| Endpoint | buyer | seller | platform_admin | anónimo |
|---|---|---|---|---|
| `GET /products` | ✓ | ✓ | ✓ | ✓ |
| `GET /products/{id}` | ✓ | ✓ | ✓ | ✓ |
| `POST /products` | ✗ | ✓ (propia tienda) | ✓ | ✗ |
| `PATCH /products/{id}` | ✗ | ✓ (propios) | ✓ | ✗ |
| `DELETE /products/{id}` | ✗ | ✓ (propios) | ✓ | ✗ |
| `POST /tenants` | ✗ | ✓ (una por seller) | ✓ | ✗ |
| `PATCH /tenants/me` | ✗ | ✓ (propia) | ✓ | ✗ |
| `GET /cart` | ✓ | ✓ | ✓ | ✓ (guest) |
| `POST /cart/items` | ✓ | ✓ | ✓ | ✓ (guest) |
| `POST /orders` | ✓ | ✗ | ✓ | ✗ |
| `GET /orders` | ✓ (propias) | ✓ (de su tienda) | ✓ | ✗ |
| `PATCH /orders/{id}/status` | ✗ | ✓ (de su tienda) | ✓ | ✗ |
| `POST /products/{id}/reviews` | ✓ (si compró) | ✗ | ✓ | ✗ |
| `GET /admin/*` | ✗ | ✗ | ✓ | ✗ |

---

## Flujo de autenticación

### Login

```
Cliente → POST /auth/login { email, password }
Backend:
  1. Busca user por email
  2. Verifica bcrypt(password, hashed_password)
  3. Genera access_token (JWT, 30 min)
  4. Genera refresh_token (UUID v4, guarda en DB con user_id y exp)
  5. Devuelve { access_token, refresh_token, expires_in: 1800 }
Cliente guarda ambos tokens en memory/context
```

### Request autenticada

```
Cliente → GET /endpoint
  Header: Authorization: Bearer <access_token>
Backend:
  1. AuthMiddleware decodifica el JWT (verifica firma y exp)
  2. Inyecta current_user en request.state
  3. Router accede a request.state.current_user
Si exp pasado → 401
Si firma inválida → 401
```

### Refresh

```
Cliente detecta 401 en cualquier request
  → POST /auth/refresh { refresh_token }
Backend:
  1. Busca refresh_token en DB
  2. Verifica que no esté expirado
  3. Genera nuevo access_token
  4. Devuelve { access_token, expires_in: 1800 }
  (el refresh_token no se rota en esta versión)
Si refresh_token expirado o inválido → 401 → cliente hace logout
```

### Logout

```
Cliente → elimina tokens de memory
(No hay endpoint de logout en la versión actual; el access token
expira solo. Si se necesita revocar antes, agregar el refresh_token
a una blacklist en DB o Redis.)
```

---

## Implementación en el backend

### Dependencias de FastAPI

```python
# backend/app/utils/security.py
async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserDocument:
    ...

async def require_seller(current_user = Depends(get_current_user)) -> UserDocument:
    if current_user.role != "seller":
        raise HTTPException(403)
    return current_user

async def require_admin(current_user = Depends(get_current_user)) -> UserDocument:
    if current_user.role != "platform_admin":
        raise HTTPException(403)
    return current_user
```

Uso en router:
```python
@router.post("/products")
async def create_product(
    data: ProductCreate,
    current_user: UserDocument = Depends(require_seller),
    tenant_id: str = Depends(get_tenant_id),   # del TenantMiddleware
):
    ...
```

### Tabla de refresh tokens en MongoDB

Colección: `refresh_tokens`

| Campo | Tipo | Notas |
|---|---|---|
| `token` | string | UUID v4, índice único |
| `user_id` | ObjectId | ref a users._id |
| `expires_at` | datetime | UTC |
| `created_at` | datetime | UTC |
| `revoked` | bool | default false |

Índices:
```
{ token: 1 }   unique: true
{ user_id: 1 }
{ expires_at: 1 }   (TTL index, MongoDB expira automáticamente)
```

---

## Seguridad

- Passwords: bcrypt con cost factor 12.
- `SECRET_KEY`: mínimo 32 caracteres, generado con `openssl rand -hex 32`.
  Nunca commiteado al repo; vive en `.env` (excluido en `.gitignore`).
- Rate limiting: máximo 5 intentos de login fallidos por IP en 15 minutos.
  (Implementado via middleware de rate limiting, pendiente en Fase 1.)
- El JWT no contiene datos sensibles (no hay hashed_password ni datos personales).
- Validación de email: se envía link de verificación al registrarse
  (implementado en Fase 2, por ahora se marca `email_verified: false`).
