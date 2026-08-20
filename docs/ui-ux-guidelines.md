# Lineamientos de UI/UX

> Este archivo se consulta ANTES de cualquier trabajo de interfaz.
> Todo nuevo patrón visual, token de diseño o convención de componente se documenta aquí.
> **Referencia visual aprobada:** mockup "Vivero El Cristo" — imagen de diseño de Home aprobada 2026-07-31.

---

## Identidad visual del marketplace

El diseño base es un vivero/paisajismo de alta gama con estética **natural, minimalista y elegante**.
Este sistema de diseño aplica como base del tenant "Vivero El Cristo" y sirve como referencia
para el design system global de la plataforma. Los colores de marca son
intercambiables por tenant mediante CSS custom properties (Fase 4+).

---

## Principios de diseño

1. **Natural y sereno**: espacios de aire, tipografía serif, paleta de verdes y cremas.
2. **Mobile-first**: diseñar primero para 375px, luego escalar a desktop.
3. **Velocidad percibida**: skeleton loaders, imágenes lazy load, sin spinners de página completa.
4. **Accesibilidad WCAG AA**: contraste mínimo 4.5:1 para texto normal.
5. **Consistencia**: si un patrón existe, reutilizarlo. No reinventar para cada feature.

---

## Paleta de colores

### Colores principales (definidos en `tailwind.config.ts`)

| Token Tailwind | Hex | Uso |
|---|---|---|
| `bg-cream` | `#F2ECE2` | Fondo principal del sitio (cálido, no blanco puro) |
| `bg-forest-dark` | `#111810` | Top banner, footer, newsletter — el más oscuro |
| `bg-forest-mid` | `#253824` | Sección de servicios / diseño |
| `bg-forest-deep` | `#1A2B1C` | Botón primario, elementos de acción |
| `text-forest-accent` | `#3D6040` | Links, acentos hover |
| `bg-forest-light` | `#E8EDE5` | Fondos verdes muy suaves |

### Colores de texto

| Uso | Hex |
|---|---|
| Texto principal (body, títulos) | `#1A1A1A` |
| Texto secundario / muted | `#6B6B6B` |
| Placeholder, metadata | `#8A8A8A` |
| Texto sobre fondo oscuro | `#FFFFFF` |
| Texto muted sobre fondo oscuro | `#7A9B7C` (verde grisáceo) |

### Colores de bordes y separadores

| Uso | Hex |
|---|---|
| Borde principal | `#E8E2D8` |
| Borde más suave | `#EAE4DB` |
| Borde sobre fondo oscuro | `#2A3A2B` |
| Borde header (sticky) | `#E8E2D8` |

### Notas de uso de color

- **Nunca** usar `#FFFFFF` como fondo de página (siempre `#F2ECE2` cream).
- El fondo cream se interrumpe en las secciones oscuras (servicios, footer, newsletter).
- Las cards de productos y testimonios usan `#FFFFFF` sobre el fondo cream.
- La sección de categorías usa el mismo fondo cream con cards de imagen full-bleed.

---

## Tipografía

### Familias

| Token | Familia | Uso |
|---|---|---|
| `font-serif` | Playfair Display (Google Fonts) | Headlines h1, h2, nombre del sitio serif, testimonios |
| `font-sans` | Inter (Google Fonts) | Todo lo demás: cuerpo, nav, labels, botones |

**Cargar en `index.html`:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet" />
```

### Escala tipográfica

| Clase Tailwind | px | Uso |
|---|---|---|
| `text-[10px]` | 10px | Labels de nav, badges de estado, categorías de footer |
| `text-xs` (12px) | 12px | Metadata, precios pequeños, descripciones de servicios |
| `text-[11px]` | 11px | Trust badges, shipping info |
| `text-sm` (14px) | 14px | Body text, nombres de producto, reviews |
| `text-base` (16px) | 16px | Párrafos de contenido |
| `text-lg` / `text-xl` | 18–20px | Subtítulos, precios de producto |
| `text-2xl` | 24px | Section titles (section-title), newsletter headline |
| `text-4xl` / `text-5xl` | 36–48px | Hero secondary headlines |
| `text-5xl` → `text-7xl` | 48–72px | Hero H1 principal |

### Estilos especiales

- **Headline hero**: `font-serif text-5xl sm:text-6xl xl:text-7xl leading-[1.05] font-normal`
- **"inspiran"** (italic dentro del headline): `<em className="italic font-normal">inspiran</em>`
- **Section label** (clase utilitaria `section-label`): `text-xs uppercase tracking-widest text-[#7A7A7A] font-medium`
- **Section title** (clase utilitaria `section-title`): `font-serif text-2xl font-semibold text-[#1A1A1A] tracking-tight`
- **Nav links**: `text-[11px] uppercase tracking-widest font-medium`
- **Botones**: `text-xs uppercase tracking-widest font-semibold`

---

## Clases utilitarias globales (definidas en `index.css`)

```css
.section-label   → text-xs uppercase tracking-widest text-[#7A7A7A] font-medium
.section-title   → font-serif text-2xl font-semibold text-[#1A1A1A] tracking-tight
.link-arrow      → text-xs uppercase tracking-widest text-[#1A2B1C] font-semibold flex items-center gap-1
.btn-primary     → bg-forest-deep text-white px-8 py-3 text-xs uppercase tracking-widest font-semibold
.btn-outline     → border border-forest-deep text-forest-deep px-8 py-3 text-xs uppercase tracking-widest font-semibold
```

### Regla global de border-radius (crítica)

`@layer base` en `index.css` define:
```css
button, a.btn-primary, a.btn-outline {
  border-radius: 8px;   /* = rounded-lg en Tailwind */
}
```

**Consecuencias:**
- Todo `<button>` recibe `border-radius: 6px` automáticamente — no hace falta agregarlo en el className.
- Los links de acción (`<Link>` o `<a>`) **deben usar** `btn-primary` o `btn-outline` para recibir el radius. Si se usan clases inline personalizadas sobre un `<a>`, NO tendrán radius.
- `<input>` y `<select>` NO reciben radius por esta regla; si se desea redondear hay que agregar `rounded-md` explícitamente.

---

## Panel de administración (`/seller/*`)

> Implementado con `AdminLayout` (`src/components/admin/AdminLayout.tsx`).

### Paleta y fondo del admin

| Elemento | Valor |
|---|---|
| Fondo general de la app admin | `#F5F5F3` (casi blanco grisáceo) |
| Sidebar | `#111810` (igual que `forest-dark`) |
| Sidebar item activo | `#1A2B1C` (igual que `forest-deep`) |
| Topbar | `#FFFFFF`, borde inferior `#E8E2D8` |
| Cards de contenido | `#FFFFFF`, borde `#E8E2D8` |
| Separadores de tabla | `#F0EDE8` |
| Fondo de cabecera de tabla | `#F9F8F5` |

### Responsive del admin

El panel de administración es **completamente responsive** desde mobile (375px) hasta desktop.

**Sidebar:**
- Mobile (`< md`): drawer off-canvas fijo (`fixed`), se desliza desde la izquierda con `transform`. Al abrirse aparece un overlay semitransparente (`bg-black/50`). Se cierra al navegar o tocar el overlay.
- Desktop (`md+`): sidebar inline colapsable por ancho (`transition-[width]`), sin overlay.
- Estado inicial: abierto en desktop (`window.innerWidth >= 768`), cerrado en mobile.

**Padding de página:**
```tsx
// Mobile: px-4. Desktop: px-8.
<div className="px-4 sm:px-8 py-6 min-h-full">…</div>
```

**Barra de acción mobile sticky (patrón universal en páginas admin):**

Todas las páginas de formulario y listado con acciones primarias usan una barra sticky que aparece justo debajo del topbar en mobile y se oculta en desktop:
```tsx
{/* Solo visible en mobile */}
<div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3 flex items-center gap-3">
  <Link to="/seller/…" className="px-4 py-2 border border-[#E8E2D8] text-sm text-[#4A4A4A] bg-white hover:bg-[#F9F8F5] transition-colors rounded-lg">
    Cancelar
  </Link>
  <button onClick={handleSubmit} disabled={saving}
    className="flex-1 bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 hover:bg-[#253824] transition-colors disabled:opacity-50">
    {saving ? "Guardando…" : "Guardar cambios"}
  </button>
</div>

{/* En páginas de listado: solo el botón de creación, ancho completo */}
<div className="sm:hidden sticky top-0 z-10 bg-white border-b border-[#E8E2D8] px-4 py-3">
  <Link to="/seller/…/new" className="btn-primary w-full text-center block">
    + Nueva acción
  </Link>
</div>
```

**Ocultar botones del header en mobile:**

⚠️ **No usar `hidden` directamente sobre un `<Link className="btn-primary">`** — `btn-primary` tiene estilos de display que pisarían `hidden`. Envolver en un `div`:
```tsx
{/* ✅ Correcto */}
<div className="hidden sm:block shrink-0">
  <Link to="…" className="btn-primary">+ Nueva acción</Link>
</div>

{/* ❌ No funciona */}
<Link to="…" className="hidden sm:block btn-primary">…</Link>
```

**Layout de formularios 2 columnas:**
```tsx
{/* flex-col en mobile, flex-row en desktop. items-start SOLO en lg para que en mobile los paneles se estiren al 100% */}
<div className="flex flex-col lg:flex-row gap-6 lg:items-start">
  <div className="flex-1 min-w-0">…</div>                       {/* columna principal */}
  <div className="w-full lg:w-[300px] shrink-0">…</div>         {/* columna lateral */}
</div>
```

**Barra de filtros en listados (colapsable en mobile):**

Patrón obligatorio en toda página de listado admin con filtros (búsqueda + selects). En mobile la barra
arranca **colapsada** detrás de un botón "Filtros" con contador de filtros activos; en desktop (`sm:` en
adelante) siempre está visible, el botón toggle desaparece. Implementado igual en `ProductList.tsx`,
`OrderList.tsx`, `CategoryList.tsx`, `ClientList.tsx` y `UserList.tsx`:

```tsx
const [filtersOpen, setFiltersOpen] = useState(false);
const activeFilterCount = [q, statusFilter, sort !== "newest" ? sort : ""].filter(Boolean).length;

{/* Botón toggle — solo mobile */}
<button
  onClick={() => setFiltersOpen((o) => !o)}
  className="sm:hidden w-full flex items-center justify-between rounded-lg bg-white border border-[#E8E2D8] px-4 py-2.5 mb-4 text-sm text-[#1A1A1A]"
>
  <span className="flex items-center gap-2">
    <FilterIcon />
    Filtros
    {activeFilterCount > 0 && (
      <span className="bg-[#1A2B1C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
        {activeFilterCount}
      </span>
    )}
  </span>
  <svg className={`… transition-transform ${filtersOpen ? "rotate-180" : ""}`}>{/* chevron */}</svg>
</button>

{/* Panel de filtros: hidden/block por state en mobile, siempre block desde sm: */}
<div className={`rounded-lg bg-white border border-[#E8E2D8] p-4 mb-4 ${filtersOpen ? "block" : "hidden"} sm:block`}>
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
    <div className="relative w-full sm:flex-1 sm:min-w-[220px]">{/* search input */}</div>
    <div className="relative w-full sm:w-auto"><select className="… w-full sm:w-[160px]">…</select></div>
  </div>
</div>
```

**Listados: tabla en desktop, cards colapsables en mobile:**

Toda página de listado admin con tabla usa tabla en desktop y una lista de cards colapsables en mobile
(no la misma tabla con scroll horizontal — las columnas secundarias no caben ni son prioritarias en una
pantalla angosta). Mismo dataset, dos componentes de fila que renderizan condicionalmente por breakpoint:

```tsx
{/* Desktop: tabla completa con todas las columnas */}
<table className="w-full hidden sm:table">…</table>

{/* Mobile: una card por ítem — checkbox + thumb + campo principal siempre visibles;
    el resto de las columnas (categoría, precio, fecha, acciones…) vive detrás de un
    toggle de expandir/colapsar por card */}
<div className="sm:hidden divide-y divide-[#F0EDE8]">
  {items.map((item) => <ItemCardMobile key={item.id} item={item} … />)}
</div>
```

Cada `*CardMobile` (`ProductCardMobile`, `OrderCardMobile`, `CategoryCardMobile`, `ClientCardMobile`,
`UserCardMobile`) sigue la misma estructura interna: fila colapsada con checkbox (si aplica) + thumbnail/avatar
+ campo principal (nombre) + badge más importante (stock/estado) + flecha que rota (`rotate-180` cuando
`expanded`); al tocar la card o la flecha se expande un bloque `border-t border-[#F0EDE8] pt-3` con el resto
de los campos en filas `flex items-center justify-between text-xs` y, al final, los botones de acción
(editar/eliminar/etc.) en un `flex` con `flex-1` cada uno.

### Patrones de componentes admin

**Radio de esquinas: `rounded-lg` (8px) en todos los controles y contenedores.**

**Contenedores / cards:**
```tsx
<div className="rounded-lg bg-white border border-[#E8E2D8] p-5">…</div>
// Si contiene tabla usar overflow-hidden para clipear las esquinas:
<div className="rounded-lg bg-white border border-[#E8E2D8] overflow-hidden overflow-x-auto">…</div>
```

**Inputs y selects:**
```tsx
// Input
"rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white placeholder-[#ABABAB] focus:outline-none focus:border-[#1A2B1C] transition-colors"
// Select
"rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A2B1C] transition-colors appearance-none cursor-pointer pr-8"
```

**Botón primario de acción (link/button):**
```tsx
// <button> → recibe border-radius automáticamente por el CSS global
<button className="bg-[#1A2B1C] text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 hover:bg-[#253824] transition-colors">
// <Link> → usar btn-primary, envolver en div para control de visibilidad responsive
<div className="hidden sm:block shrink-0">
  <Link to="/seller/products/new" className="btn-primary">+ Nuevo producto</Link>
</div>
```

**Badges de estado:**
```tsx
// Siempre rounded-full
<span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#E6F4EA] text-[#2D6A4F]">Activo</span>
<span className="… rounded-full bg-[#FFF8E7] text-[#926D20]">Borrador</span>
<span className="… rounded-full bg-[#F2F2F2] text-[#6B6B6B]">Inactivo</span>
```

**Breadcrumb:**
```tsx
<nav className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
  <Link to="/seller" className="hover:text-[#1A2B1C] transition-colors">Dashboard</Link>
  <span>/</span>
  <span className="text-[#1A1A1A]">Sección actual</span>
</nav>
```

**Cabecera de página:**
```tsx
<div className="flex items-start justify-between gap-4 mb-6">
  <div>
    <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-tight">Título</h1>
    <p className="text-xs text-[#8A8A8A] mt-1">Descripción / contador</p>
  </div>
  {/* Botón solo en desktop; mobile usa la sticky action bar */}
  <div className="hidden sm:block shrink-0">
    <Link to="…/new" className="btn-primary">+ Nueva acción</Link>
  </div>
</div>
```

**Tabla de listado:**
- `thead`: `bg-[#F9F8F5]`, texto `text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider`
- `tbody`: filas `divide-y divide-[#F0EDE8]`, hover `hover:bg-[#F9F8F5]`
- Acciones de fila (editar, eliminar, toggle): **siempre visibles** (`flex items-center justify-end gap-1`), sin opacity condicional

**Skeleton loader:**
```tsx
<div className="animate-pulse divide-y divide-[#F0EDE8]">…</div>
```

---

## Espaciado

Escala de 4px de Tailwind. Padding de secciones:
- `py-12` a `py-16` para secciones menores
- `py-16` a `py-20` para secciones principales (servicios)
- `py-24` para el hero

Padding de contenedores:
- `px-6` para el contenedor principal en desktop
- Siempre usar `max-w-screen-xl mx-auto px-6` para el ancho de página

---

## Secciones del Home (referencia de implementación)

Las siguientes secciones están implementadas en `src/components/home/` y deben mantener el orden:

| Orden | Componente | Archivo | Fondo |
|---|---|---|---|
| 1 | Top Banner | `TopBanner.tsx` | `#111810` |
| 2 | Header / Nav | `Header.tsx` | `#FFFFFF` sticky |
| 3 | Hero | `HeroSection.tsx` | `cream` (izq) + imagen (der) |
| 4 | Trust badges home | (dentro de HeroSection) | `#FFFFFF` strip |
| 5 | Categorías | `CategoriesSection.tsx` | `cream` |
| 6 | Productos carousel | `ProductsCarousel.tsx` | `cream` |
| 7 | Servicios / Diseño | `ServicesSection.tsx` | `#253824` |
| 8 | Inspiración | `InspirationSection.tsx` | `cream` |
| 9 | Testimonios | `TestimonialsSection.tsx` | `cream` |
| 10 | Trust strip inferior | `TrustStrip.tsx` | `cream` |
| 11 | Newsletter | `NewsletterSection.tsx` | `#111810` |
| 12 | Footer | `Footer.tsx` | `#111810` |

---

## Componentes de layout

### TopBanner
- Fondo `#111810`, texto `#D5D9D4`
- 3 items con iconos: entrega, chat, teléfono
- Separados por divisores verticales `bg-[#3A4A3C]` (solo desktop)
- **Responsive**: en mobile los textos son versiones cortas (`mobileText` prop), fuente `text-[10px]`, gap `gap-3`. En desktop se muestran los textos completos con `text-xs`.

### Header (sticky)
- Fondo blanco, border-bottom `#E8E2D8`
- Logo: SVG lotus + texto "VIVERO / EL CRISTO" en dos líneas con tracking-widest
- Nav: 5 items en uppercase tracking-widest `text-[11px]`
- Íconos derecha: search, user, cart (con badge de cantidad)
- Hamburger visible en mobile

### Hero
- Layout: `42% texto | 58% imagen` en desktop, full-width imagen en mobile
- Fondo izquierdo: cream (solo desktop, `hidden lg:block`)
- **Mobile**: imagen cubre todo el ancho, bloque de texto encima con `bg-cream/80 backdrop-blur-sm` (semitransparente). El bloque de texto va de borde a borde (`px-0 lg:px-6` en el contenedor outer, `px-6 lg:px-0` en el bloque).
- Imagen derecha: placeholder verde-grisáceo, con card flotante bottom-right (solo desktop `hidden lg:block`)
- Trust badges: strip blanco debajo del hero con 4 items + divisores

### Categorías
- 5 columnas en desktop, 2-3 en mobile
- Cards `aspect-square` con `object-cover` de imagen
- Overlay gradiente `from-black/70 via-black/30 to-transparent`
- Nombre en blanco, `font-semibold text-sm`
- Scale suave en hover: `group-hover:scale-105`

### ProductCard (carousel)
- Ancho fijo: `220px`
- Imagen `aspect-square`
- Nombre `text-sm font-semibold`
- Precio `text-lg font-bold`
- Shipping `text-[10px] text-[#8A8A8A]`
- Botón carrito: `32px × 32px border` sin relleno

### Servicios (fondo oscuro)
- `bg-[#253824]` full width
- 2 columnas: texto izquierda, grid 2×2 de cards derecha
- Cards con `border border-[#3A5A3C]` y hover a `#5A7A5C`
- Íconos en stroke, texto en `#7A9B7C`

### Testimonios
- Cards blancas sobre cream
- Quote mark: `font-serif text-6xl text-[#E8E0D4]`
- Divisor `border-t border-[#EAE4DB]`
- Avatar: círculo con iniciales y color pastel

### Trust Strip inferior
- 4 items en grid con divisores verticales
- Íconos `28px` stroke `1.5`
- Título `text-sm font-semibold`, descripción `text-[11px] text-[#8A8A8A]`

### Newsletter
- `bg-[#111810]`
- Input: `bg-[#1C2A1C] border-[#2A3A2B]`
- Botón: `bg-[#5A7A5C]` (verde medio, distinto al botón primario)

### Footer
- `bg-[#111810]`
- 5 columnas: logo+tagline, tienda, información, nosotros, ayuda
- Links en `text-[#7A8A7B]` hover a `#A8B5A9`
- Redes sociales: círculos `32px` con `border-[#2A3A2B]`
- Bottom bar con copyright en `text-[#4A5A4B]`

---

## Logo

El logo de "Vivero El Cristo" / "Verde Diseño" es un SVG inline de lotus/flor con 5 pétalos:
- 1 pétalo central (más alto)
- 2 pétalos medios (ángulo 45°)
- 2 pétalos externos (opacity 0.65)

Implementado en `Header.tsx` y `Footer.tsx`. Viewbox: `0 0 48 48`.
En header: `text-[#1A2B1C]` (dark). En footer: `text-white`.

---

## Carruseles

### ProductsCarousel
- Offset por índice (state), `CARD_WIDTH = 236px`
- `VISIBLE = 5` cards visibles
- Botones prev/next: `36px` círculo blanco, borde, shadow-sm
- Transition: `transform duration-400 ease-out`

### TestimonialsSection
- Offset porcentual `translateX(-${offset * (100/VISIBLE)}%)`
- `VISIBLE = 3` en desktop
- Mismo estilo de botones

---

## Página de detalle de producto (`/products/:productId`)

Implementada en `src/pages/ProductDetail.tsx`. Compuesta por:

| Orden | Componente | Archivo | Notas |
|---|---|---|---|
| 1 | Breadcrumb | inline en ProductDetail | `text-xs text-[#8A8A8A]`, separador `ChevronRight` |
| 2 | Galería + Info | `ProductGallery` + `ProductInfo` | grid `lg:grid-cols-2 gap-10 lg:gap-16`, fondo cream |
| 3 | Trust badges producto | inline en ProductDetail | bg-white, 4 ítems centrados, `lg:divide-x` |
| 4 | Cuidados + Descripción | `ProductCare` | grid `lg:grid-cols-2`, accordion para Beneficios/Incluye/Envíos |
| 5 | Productos relacionados | `RelatedProducts` | carousel `VISIBLE=4`, mismo estilo que ProductsCarousel |
| 6 | Servicios | `ServicesSection` (reutilizado) | igual que home |
| 7 | Trust strip | `TrustStrip` (reutilizado) | igual que home |

### ProductGallery
- Imagen principal `aspect-square` con badge de descuento (`bg-[#1A2B1C] text-white`)
- 4 thumbnails `80×80px`, borde `border-2 border-[#1A2B1C]` cuando seleccionado

### ProductInfo
- Precio con 2 decimales (`minimumFractionDigits: 2`) usando `es-AR` locale
- Precios internamente en centavos; badge OFF: `bg-[#E8F0E8] text-[#3D6040]`
- Selector de tamaño: 3 botones `flex-1 border`, seleccionado `border-[#1A2B1C] bg-white`
- Selector de maceta: 4 botones con `PotIcon` SVG (null=sin maceta, cemento, terracota, ceramica)
- Stepper cantidad: 3 celdas `border border-[#E8E2D8]`, w-10 h-10 cada una
- Botones: `btn-primary` + `btn-outline`, ambos `w-full py-4`

### ProductCare
- Izquierda: card `bg-white border border-[#E8E2D8] p-8` con 4 ítems de cuidado
- Cada ítem: icono `text-[#5A7A5C]` + label uppercase + valor texto
- Derecha: descripción + accordion con `openAccordion` state, chevron con `rotate-180` cuando abierto

---

## Grid de productos (páginas de listado — pendiente Fase 1)

| Breakpoint | Columnas |
|---|---|
| mobile (< 640px) | 2 columnas |
| tablet (640–1024px) | 3 columnas |
| desktop (> 1024px) | 4 columnas |
| wide (> 1280px) | 5 columnas |

---

## Accesibilidad

- `aria-label` en todos los botones de íconos (carrito, search, prev/next carousel).
- Focus visible siempre (no `outline: none` sin reemplazo).
- Alt descriptivo en imágenes reales; `alt=""` en decorativas.
- Contraste mínimo 4.5:1 verificado para combinaciones de texto/fondo del sistema.

---

## Responsive breakpoints

| Prefijo | min-width | Uso en este sistema |
|---|---|---|
| (ninguno) | 0px | Mobile base |
| `sm:` | 640px | Grid 3 columnas, hamburger desaparece |
| `md:` | 768px | Layouts de 2 columnas |
| `lg:` | 1024px | Nav desktop aparece, layouts principales |
| `xl:` | 1280px | Tamaños tipográficos grandes (hero) |
| `2xl:` | 1536px | Raramente necesario |

---

## Convenciones de componentes

- Named exports siempre (no default exports en componentes).
- Props tipadas con `interface` o inline para componentes simples.
- Iconos SVG: inline en el componente que los usa, tamaño por `width`/`height` attr.
- No usar librerías de iconos externas (lucide-react reservado para paneles admin).
- Datos hardcodeados por ahora en el componente; cuando se conecte la API, extraer a un hook `useProducts`, `useCategories`, etc.
