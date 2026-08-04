# ADR-002: Estrategia de Autenticación — JWT Stateless

**Fecha:** 2026-07-31
**Estado:** Aceptado

---

## Contexto

El sistema necesita autenticar usuarios (buyers, sellers, platform_admin) y autorizar
operaciones según rol y tenencia. Se evaluó si usar sesiones server-side o JWT stateless.

---

## Decisión

**JWT stateless con access token de corta vida (30 min) + refresh token opaco almacenado en DB (7 días).**

- Access token: JWT firmado con HS256.
- Refresh token: UUID v4, persistido en colección `refresh_tokens`.
- Sin cookies: los tokens viajan en `Authorization: Bearer`.

---

## Alternativas consideradas

### Alternativa A: Sesiones server-side (Redis o DB)

**Desventajas:**
- Requiere Redis o store de sesiones compartido entre instancias del backend.
- Cada request hace un lookup al store de sesiones.
- Escalar horizontalmente requiere sticky sessions o Redis replicado.

**Veredicto:** Añade infraestructura innecesaria para el MVP. Descartado.

---

### Alternativa B (elegida): JWT stateless + refresh token

**Ventajas:**
- El backend valida el access token sin I/O (solo verifica la firma criptográfica).
- Escala horizontalmente sin coordinación entre instancias.
- El refresh token en DB permite revocación explícita si es necesario.
- El JWT incluye `tenant_id` del seller → el TenantMiddleware puede resolver el tenant
  sin un lookup extra a MongoDB en el happy path.

**Desventajas:**
- El access token no se puede revocar antes de que expire (30 min de ventana).
  Para casos de compromiso de cuenta, se puede agregar una blacklist en Redis (Fase 4+).
- El JWT payload es visible (no encriptado, solo firmado). No poner datos sensibles.

---

## Consecuencias

1. El JWT incluye: `sub` (user_id), `email`, `role`, `tenant_id` (sellers), `exp`, `iat`.
2. Nunca incluir datos sensibles en el JWT (no hashed_password, no datos personales extensos).
3. `SECRET_KEY`: mínimo 32 chars, generado con `openssl rand -hex 32`. Solo en `.env`.
4. El frontend guarda los tokens en memoria (context/variable), no en localStorage.
   Esto mitiga XSS. Si el usuario cierra el tab, debe loguearse de nuevo
   (el refresh token persiste en una cookie HTTPOnly si se implementa en Fase 3+).
5. La revocación de acceso inmediata queda para Fase 4 (Redis blacklist).
6. Los refresh tokens tienen TTL index en MongoDB → se auto-expiran sin cleanup manual.
