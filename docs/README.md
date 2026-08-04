# Documentación del Proyecto — Tienda Multitenant

Este directorio es la **fuente de verdad** del proyecto. Toda decisión de arquitectura,
esquema de base de datos, contrato de API o lineamiento de diseño vive aquí.

## Regla fundamental

> Todo PR que cambia comportamiento debe incluir al menos una línea de cambio en el doc
> correspondiente. Sin esa actualización, el PR no puede mergearse sin justificación escrita.

---

## Índice

| Documento | Contenido |
|---|---|
| [architecture.md](architecture.md) | Diagrama de componentes, flujo de datos, integraciones, env vars |
| [database-schemas.md](database-schemas.md) | Colecciones MongoDB, campos, tipos, índices |
| [api-contracts.md](api-contracts.md) | Endpoints REST: método, path, auth, body, response, errores |
| [multi-tenancy.md](multi-tenancy.md) | Estrategia de aislamiento, ciclo de vida del tenant |
| [auth.md](auth.md) | JWT, refresh tokens, roles, matriz de permisos |
| [ui-ux-guidelines.md](ui-ux-guidelines.md) | Paleta, tipografía, componentes, accesibilidad |
| [roadmap.md](roadmap.md) | Fases del MVP al marketplace completo |
| [dev-conventions.md](dev-conventions.md) | Branching, commits, PR checklist, estándares de código |
| [adr/](adr/) | Architecture Decision Records (inmutables) |

---

## Tabla de actualización obligatoria

| Cuando trabajás en... | Consultá y actualizá |
|---|---|
| Nuevo endpoint o cambio en uno existente | `api-contracts.md` |
| Nueva colección, campo o índice en MongoDB | `database-schemas.md` |
| Cambio en flujo de auth, roles o permisos | `auth.md` |
| Nueva integración externa o variable de entorno | `architecture.md` |
| Feature completada o nueva feature planificada | `roadmap.md` |
| Nuevo componente UI, token de diseño, patrón visual | `ui-ux-guidelines.md` |
| Nueva herramienta, convención o regla de código | `dev-conventions.md` |
| Cambio en cómo se resuelve o filtra el tenant | `multi-tenancy.md` |
| Decisión arquitectónica significativa | nuevo `adr/NNN-nombre.md` |

---

## ADR actuales

| ID | Decisión |
|---|---|
| [001](adr/001-mongodb-tenancy-model.md) | Shared DB con tenant_id (no DB separada por tenant) |
| [002](adr/002-auth-jwt-strategy.md) | JWT stateless con refresh token (no sesiones) |
| [003](adr/003-frontend-state-management.md) | React Query + Context (no Redux) |
