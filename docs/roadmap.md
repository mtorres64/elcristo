# Roadmap de Features

Estado: `Planificado` | `En progreso` | `Completado`

---

## Fase 1 — Esqueleto MVP (Semanas 1–4)

**Objetivo:** Un seller puede registrarse, crear una tienda, agregar productos con fotos.
Un buyer puede browsear y ver el detalle. Sin pagos aún.

### Backend

| Feature | Estado |
|---|---|
| Scaffold FastAPI (app factory, config pydantic-settings, Motor) | Planificado |
| Docker Compose dev (backend + MongoDB) | Planificado |
| `scripts/create_indexes.py` | Planificado |
| `scripts/seed_db.py` (2 tenants, 1 buyer, 10 productos) | Planificado |
| Auth: register (buyer/seller), login, JWT access+refresh | Planificado |
| `GET /auth/me` | Planificado |
| TenantMiddleware (header + subdominio) | Planificado |
| BaseRepository con filtro automático de tenant_id y soft delete | Planificado |
| Tenant: crear tienda, completar perfil, cambio de estado a active | Planificado |
| `GET /tenants/{slug}` público | Planificado |
| Product CRUD (create, update, delete, get, list) | Planificado |
| Upload de imágenes (local, abstracción upload.py) | Planificado |
| Categorías: árbol plano, CRUD admin | Planificado |
| Tests de aislamiento multi-tenant | Planificado |

### Frontend

| Feature | Estado |
|---|---|
| Scaffold Vite + React 18 + TypeScript + Tailwind | Completado |
| Estructura de carpetas y convenciones | Completado |
| `api.ts`: Axios + interceptor JWT + refresh automático | Completado |
| AuthContext + useAuth hook | Completado |
| Tailwind config: paleta cream/forest, fuentes serif Playfair Display | Completado |
| TopBanner (3 features, fondo oscuro) | Completado |
| Header sticky (logo lotus SVG, nav, icons, hamburger mobile) | Completado |
| Footer (5 columnas, redes sociales, bottom bar) | Completado |
| Layout component (TopBanner + Header + children + Footer) | Completado |
| HeroSection (texto izquierda + imagen derecha + card flotante + trust strip) | Completado |
| CategoriesSection (5 cards con gradiente y overlay) | Completado |
| ProductsCarousel ("Elegidas para vos", prev/next, 7 productos seed) | Completado |
| ServicesSection (fondo verde oscuro, texto izquierda, grid 2×2 servicios) | Completado |
| InspirationSection (4 imágenes en grid) | Completado |
| TestimonialsSection (carousel con 4 testimonios, avatares iniciales) | Completado |
| TrustStrip inferior (4 badges: envíos, cuotas, packaging, garantía) | Completado |
| NewsletterSection (input email + suscribirse, fondo oscuro) | Completado |
| Home page completa ensamblada | Completado |
| Páginas: Login, Register (buyer vs seller) | Planificado |
| Componentes ui/: Button, Input, Badge, Modal, Spinner, Skeleton | Planificado |
| ProductCard component (conectado a API) | Planificado |
| Página listado de productos con paginación | Planificado |
| Página detalle de producto (imágenes, precio, info de tienda) | Planificado |
| Seller dashboard: listado de productos | Planificado |
| Seller: formulario crear/editar producto | Planificado |
| Página pública de tienda `/store/:slug` | Planificado |

---

## Fase 2 — Comercio Real (Semanas 5–8)

**Objetivo:** Flujo completo de compra. El dinero se mueve.

### Backend

| Feature | Estado |
|---|---|
| Cart: add/remove/update items, merge guest→auth al login | Planificado (carrito client-side vía `CartContext` implementado; server-side sync pendiente) |
| Direcciones guardadas del comprador (CRUD `/addresses`) | Completado |
| Métodos de pago guardados del comprador (CRUD `/payment-methods`, mock sin gateway real) | Completado |
| Checkout: crear orden desde carrito, validar stock | Completado |
| MercadoPago Checkout Pro: crear preference | Planificado |
| Webhook MercadoPago: actualizar estado de pago | Planificado |
| State machine de orden (pending_payment → paid → preparing → ...) | Completado (versión liviana, sin gateway real todavía) |
| Stock: descuento al confirmar pago, restauración al cancelar | Completado |
| Email: confirmación de orden al comprador | Planificado |
| Email: nueva orden al seller | Planificado |
| `PATCH /orders/{id}/status` (seller actualiza estado) | Completado |

### Frontend

| Feature | Estado |
|---|---|
| CartContext + CartDrawer (slide-over) | En progreso (CartContext con persistencia en localStorage; sin drawer, el carrito vive en `/cart`) |
| Agregar al carrito desde ProductDetail y ProductCard | Completado |
| Checkout: formulario dirección de envío | Completado (con alta de dirección nueva + geolocalización) |
| Checkout: selección de método de pago (tarjeta guardada o nueva) | Completado |
| Resumen de orden en checkout | Completado |
| Redirect a MercadoPago + manejo de retorno (success/failure/pending) | Planificado |
| Página confirmación de orden | Completado |
| Buyer: historial de órdenes (`/mis-compras`) | Planificado |
| Buyer: detalle de orden | Planificado |
| Seller dashboard: listado de órdenes con filtro de estado | Completado |
| Seller: detalle de orden + botón actualizar estado + tracking | Completado |

---

## Fase 3 — Descubrimiento y Confianza (Semanas 9–12)

**Objetivo:** Los compradores encuentran lo que buscan. Las tiendas tienen señales de confianza.

### Backend

| Feature | Estado |
|---|---|
| Búsqueda full-text cross-tenant (MongoDB $text) | Planificado |
| Filtros de búsqueda: categoría, rango de precio, rating | Planificado |
| `GET /search` con paginación y sort | Planificado |
| Reviews: crear (solo buyer con orden delivered), listar | Planificado |
| Cálculo de rating_avg y rating_count en products (on write) | Planificado |
| Variantes de producto (talla/color con stock y precio por variante) | Planificado |
| Promociones: descuento % o fijo, con fecha de expiración | Planificado |

### Frontend

| Feature | Estado |
|---|---|
| SearchBar con sugerencias en tiempo real | Planificado |
| Página de resultados de búsqueda | Planificado |
| FilterPanel (categoría, precio, rating) | Planificado |
| Sort dropdown (precio, más vendido, fecha, rating) | Planificado |
| Sección de reviews en ProductDetail | Planificado |
| Formulario para dejar review | Planificado |
| Selector de variante en ProductDetail (talla/color) | Planificado |
| Badge de descuento en ProductCard y ProductDetail | Planificado |
| Página pública de tienda mejorada (header, grid, about) | Planificado |

---

## Fase 4 — Crecimiento del Vendedor (Semanas 13–16)

**Objetivo:** Los sellers tienen datos para crecer. La plataforma es autosustentable.

### Backend

| Feature | Estado |
|---|---|
| Analytics: ventas por día/semana/mes, top productos, revenue | Planificado |
| Alerta de stock bajo (email cuando stock < threshold) | Planificado |
| Planes de suscripción: Basic / Pro / Enterprise (feature gating) | Planificado |
| Import masivo de productos (CSV upload + procesamiento async) | Planificado |
| Panel admin: listar/suspender/activar tiendas | Planificado |
| Panel admin: stats globales (total ventas, usuarios, tiendas activas) | Planificado |
| Envío: ingreso manual de tracking number, integración futura correo | Planificado |

### Frontend

| Feature | Estado |
|---|---|
| Seller analytics dashboard (gráficos de ventas, top productos) | Planificado |
| Tabla de inventario con edición inline de stock | Planificado |
| Alertas de stock bajo en dashboard | Planificado |
| Página de plan/upgrade para sellers | Planificado |
| Bulk import: selección de CSV, preview, confirm | Planificado |
| Panel admin de plataforma (solo platform_admin) | Planificado |
| Centro de notificaciones in-app (polling) | Planificado |

---

## Fase 5 — Escala y Pulido (post-semana 16)

| Feature | Estado |
|---|---|
| PWA: offline cart, manifest, service worker | Planificado |
| Internacionalización i18n (ES base, EN secundario) | Planificado |
| SEO: meta tags dinámicos, sitemap.xml, JSON-LD para productos | Planificado |
| Redis: cache de categorías, productos populares | Planificado |
| WebSockets: notificaciones en tiempo real (nueva orden) | Planificado |
| Playwright E2E: happy path register → compra | Planificado |
| Recomendaciones: "otros también compraron" | Planificado |
| Detección de fraude: velocity checks en órdenes | Planificado |
| Atlas Search (upgrade del $text nativo) | Planificado |
| CDN para imágenes | Planificado |
