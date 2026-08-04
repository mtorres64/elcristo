# Esquemas de Base de Datos — MongoDB

> **Regla:** Este archivo se actualiza ANTES de tocar el código.
> Primero definir el esquema aquí, luego implementar el modelo Pydantic.

Base de datos: `tienda_db`

---

## Decisiones globales de diseño

- `_id`: ObjectId generado por MongoDB (excepto donde se indica)
- `tenant_id`: string (slug de la tienda). Presente en todas las colecciones per-tenant.
- `deleted_at`: datetime | null. Soft delete en todos los documentos. Queries siempre filtran `deleted_at: null` via `BaseRepository`.
- Dinero: siempre entero en centavos (ej. $1.500 ARS = `150000`).
- Timestamps: `created_at` y `updated_at` en UTC, tipo `datetime`.

---

## Colecciones globales (sin tenant_id)

### `users`

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `_id` | ObjectId | sí | auto |
| `email` | string | sí | único, índice |
| `hashed_password` | string | sí | bcrypt |
| `name` | string | sí | nombre completo |
| `role` | string | sí | `"buyer"` \| `"seller"` \| `"platform_admin"` |
| `phone` | string | no | |
| `avatar_url` | string | no | |
| `is_active` | bool | sí | default: true |
| `email_verified` | bool | sí | default: false |
| `created_at` | datetime | sí | UTC |
| `updated_at` | datetime | sí | UTC |
| `deleted_at` | datetime | no | null = activo |

Índices:
```
{ email: 1 }  unique: true
{ role: 1, is_active: 1 }
```

---

### `tenants`

El documento de la tienda (un seller puede tener una tienda).

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `_id` | ObjectId | sí | auto |
| `slug` | string | sí | único, inmutable, URL-safe |
| `owner_id` | ObjectId | sí | ref a users._id |
| `name` | string | sí | nombre visible de la tienda |
| `description` | string | no | descripción pública |
| `logo_url` | string | no | |
| `banner_url` | string | no | |
| `status` | string | sí | `"pending_setup"` \| `"active"` \| `"suspended"` \| `"deleted"` |
| `categories` | string[] | no | rubros principales de la tienda |
| `contact_email` | string | no | email público de la tienda |
| `contact_phone` | string | no | |
| `address` | object | no | `{ street, city, province, zip, country }` |
| `plan` | string | sí | `"basic"` \| `"pro"` \| `"enterprise"` — default: `"basic"` |
| `created_at` | datetime | sí | UTC |
| `updated_at` | datetime | sí | UTC |
| `deleted_at` | datetime | no | null = activo |

Índices:
```
{ slug: 1 }         unique: true
{ owner_id: 1 }
{ status: 1 }
```

---

### `categories`

Árbol de categorías de la plataforma (no por tenant).

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `_id` | ObjectId | sí | auto |
| `name` | string | sí | ej. "Electrónica" |
| `slug` | string | sí | único |
| `parent_id` | ObjectId | no | null = categoría raíz |
| `icon_url` | string | no | |
| `order` | int | sí | orden de display, default 0 |
| `is_active` | bool | sí | default: true |
| `created_at` | datetime | sí | UTC |
| `updated_at` | datetime | sí | UTC |

Índices:
```
{ slug: 1 }         unique: true
{ parent_id: 1, order: 1 }
```

---

### `carts`

Carrito por usuario (los items embed el tenant_id por producto).

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `_id` | ObjectId | sí | auto |
| `user_id` | ObjectId | no | null = carrito guest (por sesión) |
| `session_id` | string | no | para carritos guest |
| `items` | CartItem[] | sí | array embebido |
| `created_at` | datetime | sí | UTC |
| `updated_at` | datetime | sí | UTC |

**CartItem (embebido):**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `product_id` | ObjectId | sí | ref a products._id |
| `tenant_id` | string | sí | slug de la tienda del producto |
| `title` | string | sí | snapshot del título al agregar |
| `price_snapshot` | int | sí | centavos, snapshot al agregar |
| `quantity` | int | sí | >= 1 |
| `variant` | object | no | `{ key: "color", value: "rojo" }` |
| `image_url` | string | no | snapshot |

Índices:
```
{ user_id: 1 }
{ session_id: 1 }
```

---

## Colecciones per-tenant (llevan tenant_id)

### `products`

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `_id` | ObjectId | sí | auto |
| `tenant_id` | string | sí | slug de la tienda |
| `title` | string | sí | max 150 chars |
| `description` | string | no | markdown permitido |
| `price` | int | sí | centavos |
| `compare_at_price` | int | no | centavos, precio tachado |
| `category_id` | ObjectId | no | ref a categories._id |
| `images` | string[] | sí | URLs de imágenes, primera = principal |
| `stock` | int | sí | unidades disponibles, >= 0 |
| `sku` | string | no | código interno del seller |
| `status` | string | sí | `"draft"` \| `"active"` \| `"paused"` \| `"out_of_stock"` |
| `variants` | Variant[] | no | array embebido |
| `tags` | string[] | no | para búsqueda y filtros |
| `weight_grams` | int | no | para cálculo de envío |
| `rating_avg` | float | no | calculado, default null |
| `rating_count` | int | no | calculado, default 0 |
| `sold_count` | int | sí | default 0 |
| `created_at` | datetime | sí | UTC |
| `updated_at` | datetime | sí | UTC |
| `deleted_at` | datetime | no | null = activo |

**Variant (embebido):**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `key` | string | sí | ej. "talla", "color" |
| `value` | string | sí | ej. "XL", "rojo" |
| `stock` | int | sí | stock específico de esta variante |
| `price_override` | int | no | centavos, si difiere del precio base |
| `sku_override` | string | no | |

Índices:
```
{ tenant_id: 1, status: 1, created_at: -1 }   ← seller dashboard, listado
{ tenant_id: 1, category_id: 1, price: 1 }     ← filtrado por categoría + precio
{ tenant_id: 1, status: 1, sold_count: -1 }     ← más vendidos de una tienda
{ title: "text", description: "text" }           ← búsqueda full-text cross-tenant
{ tenant_id: 1, deleted_at: 1 }
```

---

### `orders`

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `_id` | ObjectId | sí | auto |
| `tenant_id` | string | sí | slug de la tienda vendedora |
| `buyer_id` | ObjectId | sí | ref a users._id |
| `order_number` | string | sí | único, legible: `ORD-{year}-{seq}` |
| `status` | string | sí | ver estados abajo |
| `items` | OrderItem[] | sí | array embebido |
| `subtotal` | int | sí | centavos (suma de items) |
| `shipping_cost` | int | sí | centavos |
| `discount` | int | sí | centavos, default 0 |
| `total` | int | sí | centavos = subtotal + shipping - discount |
| `shipping_address` | Address | sí | embebido |
| `payment` | Payment | no | embebido, se llena al pagar |
| `tracking_number` | string | no | número de seguimiento del envío |
| `notes` | string | no | notas del comprador |
| `created_at` | datetime | sí | UTC |
| `updated_at` | datetime | sí | UTC |
| `deleted_at` | datetime | no | null = activo |

**Estados de la orden:**
`"pending_payment"` → `"paid"` → `"preparing"` → `"shipped"` → `"delivered"`
Con ramas: `"cancelled"`, `"refunded"`, `"disputed"`

**OrderItem (embebido):**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `product_id` | ObjectId | sí | ref a products._id |
| `title` | string | sí | snapshot |
| `price` | int | sí | centavos, snapshot al momento de compra |
| `quantity` | int | sí | |
| `variant` | object | no | snapshot |
| `image_url` | string | no | snapshot |

**Payment (embebido):**

| Campo | Tipo | Notas |
|---|---|---|
| `provider` | string | `"mercadopago"` |
| `payment_id` | string | ID del pago en MercadoPago |
| `preference_id` | string | ID de la preferencia de checkout |
| `status` | string | `"pending"` \| `"approved"` \| `"rejected"` \| `"refunded"` |
| `paid_at` | datetime | UTC |
| `payment_method` | string | ej. `"credit_card"`, `"debit_card"` |

**Address (embebido):**

| Campo | Tipo |
|---|---|
| `full_name` | string |
| `street` | string |
| `number` | string |
| `floor_apt` | string |
| `city` | string |
| `province` | string |
| `zip` | string |
| `country` | string |
| `phone` | string |

Índices:
```
{ tenant_id: 1, status: 1, created_at: -1 }    ← seller: gestión de órdenes
{ tenant_id: 1, created_at: -1 }                ← seller: historial
{ buyer_id: 1, created_at: -1 }                 ← buyer: mis compras
{ order_number: 1 }   unique: true
{ "payment.payment_id": 1 }                     ← lookup desde webhook MercadoPago
```

---

### `reviews`

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `_id` | ObjectId | sí | auto |
| `tenant_id` | string | sí | slug de la tienda |
| `product_id` | ObjectId | sí | ref a products._id |
| `order_id` | ObjectId | sí | ref a orders._id (debe estar "delivered") |
| `buyer_id` | ObjectId | sí | ref a users._id |
| `rating` | int | sí | 1-5 |
| `title` | string | no | max 80 chars |
| `body` | string | no | max 2000 chars |
| `is_verified_purchase` | bool | sí | default: true (sólo se crean desde órdenes entregadas) |
| `created_at` | datetime | sí | UTC |
| `updated_at` | datetime | sí | UTC |
| `deleted_at` | datetime | no | null = activo |

Índices:
```
{ tenant_id: 1, product_id: 1, created_at: -1 }
{ buyer_id: 1 }
{ order_id: 1, buyer_id: 1 }   unique: true   ← una review por orden por comprador
```

---

### `store_settings`

Configuración extendida de la tienda (separada de `tenants` para no hinchar el doc principal).

| Campo | Tipo | Notas |
|---|---|---|
| `_id` | ObjectId | auto |
| `tenant_id` | string | único |
| `payment_enabled` | bool | default: false hasta conectar MercadoPago |
| `mp_user_id` | string | ID de usuario MercadoPago del seller |
| `shipping_modes` | string[] | `"self"` \| `"correo_argentino"` \| `"oca"` |
| `free_shipping_threshold` | int | centavos — monto mínimo para envío gratis |
| `return_policy` | string | texto libre |
| `custom_css` | string | CSS personalizado (plan Pro+) |
| `updated_at` | datetime | UTC |

Índices:
```
{ tenant_id: 1 }   unique: true
```
