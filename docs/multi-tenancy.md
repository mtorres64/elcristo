# Estrategia de Multi-Tenancy

## Modelo elegido: Shared Database, Shared Collections, `tenant_id` por documento

Documentado en [ADR-001](adr/001-mongodb-tenancy-model.md).

---

## Por qué este modelo

| Alternativa | Razón de descarte |
|---|---|
| DB separada por tenant | No escala a miles de tiendas; imposibilita búsqueda global; explosión de conexiones |
| Colección separada por tenant | Migraciones deben correr N veces; MongoDB limita a ~5000 colecciones por DB |
| Shared collection + tenant_id | Escala, permite búsqueda cross-tenant, índice compound es eficiente |

---

## Identificador del tenant

- `tenant_id` es el **slug** de la tienda: string URL-safe, todo minúsculas, guiones.
  - Ejemplo: `"zapateria-bonita"`, `"tech-store-mar-del-plata"`
- El slug es **inmutable** una vez creado. Si el seller quiere renombrarse, el slug no cambia (solo el `name`).
- Formato válido: `^[a-z0-9]+(-[a-z0-9]+)*$`, mínimo 3 chars, máximo 50.

---

## Cómo se resuelve el tenant en cada request

El `TenantMiddleware` evalúa en este orden:

1. **Header `X-Tenant-ID`**: para calls del seller dashboard.
   ```
   X-Tenant-ID: zapateria-bonita
   ```

2. **Subdominio**: para la tienda pública en producción.
   ```
   zapateria-bonita.tienda.com → tenant_id = "zapateria-bonita"
   ```

3. **Claim JWT `tenant_id`**: en endpoints autenticados del seller, el JWT incluye el slug.

4. **Sin tenant**: endpoints globales (búsqueda cross-tenant, categorías, registro).
   En este caso `request.state.tenant_id = None`.

El middleware **falla con 404** si el slug no existe en la colección `tenants` o si la tienda está `suspended` / `deleted`.

---

## Dónde se aplica el filtro (enforcement)

El aislamiento se aplica en **`BaseRepository`**, no en los routers.

```python
# backend/app/repositories/base.py (pseudocódigo)
class BaseRepository:
    def _tenant_filter(self, extra: dict = {}) -> dict:
        if self.tenant_id is None:
            raise RuntimeError("tenant_id requerido para esta operación")
        return { "tenant_id": self.tenant_id, "deleted_at": None, **extra }

    async def find_many(self, filter: dict, ...) -> list:
        return await self.collection.find(
            self._tenant_filter(filter), ...
        )
```

Reglas:
- **Nunca** pasar el filtro de tenant desde el router. El router no sabe de tenant_id.
- Métodos que operan cross-tenant (búsqueda global, analytics de plataforma) se nombran
  `cross_tenant_*` y están en repositorios especiales que requieren `role: platform_admin`.
- Los tests de aislamiento (`tests/test_tenancy.py`) verifican que un repo inicializado con
  `tenant_id: "tienda-a"` nunca retorne documentos de `"tienda-b"`.

---

## Colecciones que llevan tenant_id

| Colección | tenant_id | Notas |
|---|---|---|
| `products` | sí | Principal colección per-tenant |
| `orders` | sí | tenant = la tienda vendedora |
| `reviews` | sí | Scoped al producto de la tienda |
| `store_settings` | sí | Config extendida de la tienda |
| `users` | no | Plataforma-wide |
| `tenants` | no | La colección de tiendas en sí |
| `categories` | no | Árbol global de la plataforma |
| `carts` | no | Por buyer, los items contienen tenant_id |

---

## Ciclo de vida de un tenant

```
        [Seller se registra]
               │
               ▼
        PENDING_SETUP ─────► [Seller configura nombre, slug, descripción]
               │
               ▼
           ACTIVE ─────────► [Visible para compradores, puede vender]
               │
         ┌─────┴──────┐
         ▼            ▼
     SUSPENDED     DELETED (soft)
    [Admin action]  [Seller solicita
                    o admin elimina]
```

**Transiciones permitidas:**

| Desde | A | Actor |
|---|---|---|
| `pending_setup` | `active` | Sistema (cuando completa la configuración) |
| `active` | `suspended` | platform_admin |
| `suspended` | `active` | platform_admin |
| `active` | `deleted` | platform_admin o seller owner |
| `suspended` | `deleted` | platform_admin |

**Efectos de cada estado:**

- `pending_setup`: tienda invisible para compradores. Seller puede configurarla.
- `active`: tienda visible. Productos activos aparecen en búsquedas.
- `suspended`: tienda oculta. Productos no aparecen. Órdenes en curso se respetan.
- `deleted`: soft delete. `deleted_at` se setea. Datos retenidos 90 días luego eliminados.

---

## Tenant context en el JWT del seller

El access token de un seller incluye los siguientes claims:

```json
{
  "sub": "user_id",
  "role": "seller",
  "tenant_id": "zapateria-bonita",
  "exp": 1234567890
}
```

Un buyer no lleva `tenant_id` en el JWT. Un `platform_admin` tampoco (tiene acceso global).

---

## Onboarding de un seller

1. `POST /auth/register` con `role: "seller"` → crea user, sin tienda aún.
2. `POST /tenants` → crea la tienda con `status: "pending_setup"`.
3. `PATCH /tenants/me` → completa nombre, descripción, logo.
4. Sistema detecta que la configuración mínima está completa → cambia a `status: "active"`.
5. A partir de aquí el seller puede crear productos y recibir órdenes.

**Configuración mínima para activar:**
- `name` presente
- `slug` presente y único
- Al menos una categoría seleccionada
- `contact_email` presente

---

## Garantías de aislamiento

1. Un comprador que accede a `GET /products` con `X-Tenant-ID: tienda-a` **nunca** ve
   productos de `tienda-b`.
2. Un seller de `tienda-a` **nunca** puede modificar productos, órdenes o configuración
   de `tienda-b` (el repository valida el tenant_id antes de cualquier write).
3. La búsqueda global cross-tenant solo devuelve productos con `status: "active"` de tiendas
   con `status: "active"`.
4. Los tests de `tests/test_tenancy.py` deben verificar los tres puntos anteriores con
   datos reales en MongoDB de test.
