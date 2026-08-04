# Convenciones de Desarrollo

---

## Branching strategy

```
main         ← producción. Solo merges desde hotfix/* y release/*
develop      ← integración. Todos los features apuntan aquí
feature/*    ← nueva funcionalidad: feature/product-variants
bugfix/*     ← corrección de bug: bugfix/cart-quantity-overflow
hotfix/*     ← fix urgente desde main: hotfix/payment-webhook-500
release/*    ← preparación de release: release/1.0.0
```

Reglas:
- `main` y `develop` nunca reciben pushes directos.
- Feature branches se borran tras mergear.
- Naming: siempre en minúsculas, guiones, inglés.

---

## Convención de commits (Conventional Commits)

Formato: `<type>(<scope>): <descripción en inglés>`

**Tipos:**

| Tipo | Cuándo |
|---|---|
| `feat` | Nueva feature |
| `fix` | Corrección de bug |
| `docs` | Solo cambios en docs/*.md o comentarios |
| `refactor` | Refactor sin cambio de comportamiento |
| `test` | Agregar o corregir tests |
| `chore` | Dependencias, configuración, CI |
| `perf` | Mejora de performance |
| `style` | Formato de código (no afecta lógica) |

**Scopes válidos:** `auth`, `products`, `orders`, `cart`, `search`, `tenants`, `admin`, `ui`, `db`, `ci`, `docs`

Ejemplos:
```
feat(products): add multi-image upload with preview
fix(cart): restore quantity after failed payment webhook
docs(api): document POST /orders endpoint contract
test(tenants): add cross-tenant isolation test for products repo
chore(deps): upgrade motor to 3.4.0
refactor(auth): extract token generation to security utils
```

---

## Checklist de PR

Todo PR debe incluir:

- [ ] Descripción clara de qué hace y por qué
- [ ] **Actualización del doc correspondiente** en `docs/` (o justificación de por qué no aplica)
- [ ] Tests para la funcionalidad nueva o modificada
- [ ] Sin secretos ni `.env` commiteados
- [ ] Variables de entorno nuevas en `.env.example` y en `docs/architecture.md`
- [ ] Sin `console.log` ni `print` de debug en el código final
- [ ] El CI pasa (linting + tests)

---

## Python — Estándares

### Herramientas

- **Formatter + linter:** `ruff` (reemplaza flake8, isort, black)
- **Type checker:** `mypy` en modo estricto
- **Tests:** `pytest` + `httpx.AsyncClient` (async)
- **Configuración:** `pyproject.toml`

```toml
[tool.ruff]
line-length = 100
select = ["E", "F", "I", "UP", "B", "N"]

[tool.mypy]
strict = true
```

### Reglas

- Todo I/O con MongoDB es **async** (Motor). Sin llamadas sync en el path de request.
- Los **routers** solo manejan HTTP: parseo de request, call al service, retorno de response.
  Sin lógica de negocio. Sin queries a MongoDB.
- Los **services** contienen la lógica de negocio. Llaman a repositories. Retornan modelos Pydantic.
- Los **repositories** contienen toda la I/O de MongoDB. Sin lógica de negocio.
- No usar `os.environ[]` en routers ni services. Solo en `config.py` via pydantic-settings.
- No usar `dict` como tipo de retorno de services. Siempre Pydantic models.
- `HTTPException` se puede lanzar desde services (no solo routers).

### Organización de imports

Orden (ruff lo aplica automáticamente):
1. Standard library
2. Third-party (fastapi, motor, pydantic, etc.)
3. Internal (app.*)

### Nombrado

- Archivos y módulos: `snake_case`
- Clases: `PascalCase`
- Funciones y variables: `snake_case`
- Constantes: `UPPER_SNAKE_CASE`
- Colecciones MongoDB en código: `PRODUCTS_COLLECTION = "products"` (constante)

---

## TypeScript — Estándares

### Herramientas

- **Compiler:** TypeScript strict mode
- **Linter:** ESLint + typescript-eslint
- **Formatter:** Prettier
- **Tests:** Vitest + React Testing Library
- **Server state:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod

### Reglas

- `"strict": true` en tsconfig. Sin `any` sin comentario explicando por qué.
- Interfaces en `src/types/`, no inline en componentes.
- **Named exports** siempre (no default exports). Excepción: lazy-loaded pages.
- Todo server state via React Query. `useContext` solo para auth y carrito.
- Funciones de llamada a API en `src/services/*.service.ts`.
  Nunca `fetch()` o `axios` directamente en componentes o hooks de feature.
- Componentes: función con nombre + named export.
  ```tsx
  // Correcto
  export function ProductCard({ product }: ProductCardProps) { ... }
  // Incorrecto
  export default function({ product }) { ... }
  ```
- Props siempre tipadas con `interface`, nunca `type` para objetos (salvo uniones).

### Nombrado

- Componentes y tipos/interfaces: `PascalCase`
- Hooks: `camelCase` con prefijo `use` (`useAuth`, `useCart`)
- Services: `camelCase` con sufijo `Service` (`productService`)
- Constantes de módulo: `UPPER_SNAKE_CASE`
- Archivos de componentes: `PascalCase.tsx`
- Archivos de hooks/services: `camelCase.ts`

---

## Variables de entorno

- Backend: `SNAKE_CASE`, todas declaradas en `config.py`.
- Frontend: `VITE_` prefix (obligatorio Vite), declaradas en `frontend/src/env.d.ts`.
- Toda variable nueva va en `.env.example` con valor de ejemplo o placeholder.
- Toda variable nueva va en `docs/architecture.md` sección "Variables de entorno".
- Nunca hardcodear valores de configuración en código. Siempre via config.

---

## Testing

### Backend

- Tests en `backend/tests/`.
- `conftest.py`: fixture de cliente MongoDB de test + 2 tenants de prueba + 1 buyer.
- Cada módulo de negocio tiene su archivo de tests (`test_auth.py`, `test_products.py`, etc.).
- `tests/test_tenancy.py`: obligatorio. Verifica que el aislamiento de tenant funciona.
- Meta: 70% de coverage mínimo en `services/` y `repositories/`.
- Para tests de repos: MongoDB real (Docker) en CI, no mocks.

### Frontend

- Tests en `*.test.tsx` junto al componente, o en `src/__tests__/`.
- Probar comportamiento del usuario (clicks, inputs, mensajes de error), no implementación.
- No snapshot tests.
- Mock de API calls con `msw` (Mock Service Worker).

---

## Manejo de errores

### Backend

- Errores de negocio: `HTTPException(status_code=400, detail="mensaje legible")`.
- Errores de autorización: `HTTPException(403)`.
- Errores de not found: `HTTPException(404)`.
- Nunca exponer stack traces, mensajes de MongoDB ni información interna al cliente.
- Errores 500 se loggean con contexto completo (usar `logging` de Python, no `print`).

### Frontend

- Todos los errores de API se manejan en el interceptor de `api.ts` o en el `onError` de React Query.
- Al usuario se le muestra solo un mensaje genérico o el `detail` si es legible.
- Nunca mostrar mensajes de error técnicos o internos.
- Estado de error siempre explícito: componente `ErrorMessage` o toast de error.

---

## Estructura de archivos nuevos

Al crear un nuevo módulo en el backend:
```
backend/app/
  models/nuevo.py        ← shape del documento MongoDB
  schemas/nuevo.py       ← request/response schemas de API
  repositories/nuevo_repo.py  ← queries MongoDB
  services/nuevo_service.py   ← lógica de negocio
  routers/nuevo.py       ← endpoints HTTP
```

Registrar el router en `main.py` y documentar los endpoints en `docs/api-contracts.md`.

Al crear un nuevo feature en el frontend:
```
src/
  types/nuevo.ts              ← interfaces
  services/nuevo.service.ts   ← llamadas a API
  hooks/useNuevo.ts           ← lógica reutilizable
  components/nuevo/           ← componentes del feature
  pages/Nuevo.tsx             ← página
```

Agregar la ruta en `App.tsx`.

---

## Sistema de colores (Design Tokens)

Los tokens están definidos en `frontend/tailwind.config.ts` bajo `theme.extend.colors`.
Usar siempre el token Tailwind; nunca hardcodear el hex en componentes.

| Token | Valor | Uso |
|---|---|---|
| `cream` | `#F5F5F3` | Fondo base de todas las pantallas (`body`) |
| `forest.dark` | `#111810` | Top banner, footer, newsletter |
| `forest.mid` | `#253824` | Sección servicios |
| `forest.deep` | `#1A2B1C` | Botones primarios |
| `forest.accent` | `#3D6040` | Links y acentos |
| `forest.light` | `#E8EDE5` | Fondos verdes suaves |

Excepciones aceptadas (`bg-white`): secciones que por diseño requieren fondo blanco puro
(ej.: banda de trust badges en la página de producto, tarjetas con borde).

---

## Formateo de montos monetarios

En el frontend, nunca mostrar centavos directamente. Usar `src/utils/currency.ts`:

```ts
// 150000 centavos → "$ 1.500"
formatARS(150000)  // devuelve string formateado

// 150000 centavos → "USD 15.00"
formatUSD(150000)
```

Nunca hacer división y formateo ad-hoc en componentes.
