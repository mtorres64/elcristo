# ADR-001: Modelo de Multi-Tenancy en MongoDB

**Fecha:** 2026-07-31
**Estado:** Aceptado

---

## Contexto

La plataforma necesita soportar múltiples tiendas independientes (tenants) en una sola
instancia. Cada tienda debe tener sus datos completamente aislados de las demás.
La plataforma también requiere búsqueda global cross-tenant (un comprador busca
"zapatillas" y ve resultados de todas las tiendas).

Se evaluaron tres modelos de aislamiento de datos en MongoDB.

---

## Decisión

**Shared Database, Shared Collections con campo `tenant_id` en cada documento.**

El `tenant_id` es el **slug** de la tienda (string URL-safe, inmutable).

---

## Alternativas consideradas

### Alternativa A: Base de datos separada por tenant

Una DB de MongoDB por tienda: `tienda_zapateria`, `tienda_tech_store`, etc.

**Ventajas:**
- Aislamiento total a nivel de DB
- Fácil de migrar o exportar datos de una tienda

**Desventajas:**
- A 1000 tiendas: 1000 connection pools. MongoDB tiene límites prácticos de conexiones.
- Búsqueda cross-tenant requiere queries a N bases de datos y merge manual.
- Schema migrations deben correrse N veces.
- Backups y monitoreo se complican linealmente con el número de tenants.
- MongoDB Atlas cobra por base de datos en algunos tiers.

**Veredicto:** Descartado. No escala al modelo de marketplace.

---

### Alternativa B: Colección separada por tenant

Una colección de productos por tienda: `products_zapateria`, `products_tech_store`.

**Ventajas:**
- Algo de aislamiento sin múltiples DBs
- Fácil de borrar todos los datos de un tenant (drop collection)

**Desventajas:**
- MongoDB recomienda no más de 5000-10000 colecciones por DB en producción.
- Los nombres de colección son strings dinámicos → no hay soporte en herramientas de query.
- Schema migrations deben correr N veces.
- Búsqueda cross-tenant sigue requiriendo múltiples queries.
- Los índices se deben crear N veces.

**Veredicto:** Descartado. No hay ventaja real sobre tenant_id con colecciones compartidas.

---

### Alternativa C (elegida): Shared collections con tenant_id

Todas las tiendas comparten las mismas colecciones. Cada documento tiene `tenant_id`.

**Ventajas:**
- Búsqueda cross-tenant: `db.products.find({ status: "active", $text: { $search: "zapatillas" } })`
- Schema migrations: corren una sola vez.
- Índices: se definen una sola vez, MongoDB los usa eficientemente.
- El índice compound `{ tenant_id: 1, ... }` garantiza que queries de una tienda no scaneen
  documentos de otras.
- Sharding natural en `tenant_id` cuando se necesite escalar.
- Operaciones de plataforma (analytics, moderación) son queries normales.

**Desventajas:**
- Requiere disciplina: todo código que accede a datos per-tenant DEBE incluir el filtro
  de tenant_id. Se mitiga concentrando todo el I/O en `BaseRepository`.
- Si un tenant tiene datos malformados (sin tenant_id), puede "contaminar" queries. Se mitiga
  con validación a nivel de Pydantic model y tests de aislamiento obligatorios.

---

## Consecuencias

1. `BaseRepository` es el guardián del aislamiento. Ningún repositorio per-tenant puede
   hacer queries sin pasar por `_tenant_filter()`.
2. `tenant_id` es el slug (string), no un ObjectId. Esto hace logs y URLs legibles
   y evita lookups extra al resolver el tenant.
3. El slug es inmutable. Si una tienda quiere cambiar su nombre visible, cambia `name`,
   no `slug`.
4. `tests/test_tenancy.py` es obligatorio en el proyecto desde el día 1.
5. Al shardear en el futuro, la shard key natural es `{ tenant_id: "hashed" }`.
