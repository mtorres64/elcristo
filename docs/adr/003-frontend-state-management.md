# ADR-003: Gestión de Estado en el Frontend

**Fecha:** 2026-07-31
**Estado:** Aceptado

---

## Contexto

El frontend necesita manejar dos tipos de estado:
1. **Server state**: datos que vienen del backend (productos, órdenes, perfil de usuario).
2. **Client state**: estado de UI local (carrito, usuario autenticado, notificaciones).

Se evaluó si usar Redux, Zustand, React Context o una librería de server state.

---

## Decisión

**TanStack Query (React Query) para server state + React Context para client state global.**

- `TanStack Query`: todo lo que viene del backend (productos, órdenes, categorías, etc.).
- `AuthContext`: tokens, usuario actual, funciones de login/logout.
- `CartContext`: items del carrito, total, funciones add/remove/update.
- `TenantContext`: tenant actual (para la vista de tienda pública).

---

## Alternativas consideradas

### Alternativa A: Redux Toolkit

**Desventajas:**
- Boilerplate significativo para operaciones CRUD estándar.
- Requiere manejar manualmente: loading states, error states, cache invalidation, background refresh.
- Overkill para una app donde la mayoría del estado es server state.

**Veredicto:** Descartado. React Query resuelve el server state mejor con menos código.

---

### Alternativa B: Zustand

**Ventajas:** Menos boilerplate que Redux, flexible.

**Desventajas:**
- Aún requiere gestionar manualmente loading/error/cache para server state.
- No trae las features de React Query (background refetch, stale-while-revalidate, pagination).

**Veredicto:** Podría usarse para client state, pero React Context es suficiente para los
2-3 stores globales que tenemos. Si el client state crece en complejidad, migrar a Zustand
sin cambiar React Query.

---

### Alternativa C (elegida): React Query + Context

**Ventajas:**
- React Query maneja automáticamente: loading, error, cache, background refetch,
  deduplicación de requests, pagination, optimistic updates.
- Los `useQuery` y `useMutation` son la API más ergonómica para CRUD con backend REST.
- Context para auth y carrito es simple y no necesita más que eso.
- Sin dependencias extra pesadas.

**Desventajas:**
- El Context re-renderiza todos los consumers cuando cambia. Para `AuthContext` y `CartContext`
  esto es aceptable (pocos consumers frecuentes). Si escala, splitear contextos o usar
  `useMemo` en el value.

---

## Consecuencias

1. **Nunca usar `useState` + `useEffect` + `fetch` para server state**. Siempre `useQuery` o `useMutation`.
2. El `queryClient` se configura en `App.tsx` con `staleTime: 1000 * 60 * 5` (5 min default).
3. Invalidar queries en `onSuccess` de mutations (no optimistic updates en MVP).
4. `AuthContext` es el único lugar donde se guarda el access token (en memoria).
5. `CartContext` sincroniza con el backend (debounce en updates frecuentes).
6. Si el client state crece significativamente (más de 5 stores), evaluar Zustand en ese momento.
