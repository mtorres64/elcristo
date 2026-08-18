# Contratos de API

> **Regla contract-first:** Este archivo se escribe ANTES de implementar el endpoint.
> El endpoint debe reflejar exactamente lo que aquí se documenta.

Base URL: `http://localhost:8000` (dev) | `https://api.tienda.com` (prod)

Todos los endpoints con `Auth: JWT` requieren header:
```
Authorization: Bearer <access_token>
```

Los endpoints per-tenant (de seller) requieren además:
```
X-Tenant-ID: <slug-de-la-tienda>
```

---

## Auth

### POST /auth/register
Registro de nuevo usuario (buyer o seller).

**Auth:** ninguna

**Body:**
```json
{
  "email": "string",
  "password": "string (min 8 chars)",
  "name": "string",
  "role": "buyer | seller"
}
```

**Response 201:**
```json
{
  "user_id": "string",
  "email": "string",
  "name": "string",
  "role": "string"
}
```

**Errores:** `400` email ya registrado | `422` validación

---

### POST /auth/login
Login y emisión de tokens.

**Auth:** ninguna

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Errores:** `401` credenciales incorrectas

---

### POST /auth/refresh
Renovar access token usando refresh token.

**Auth:** ninguna

**Body:**
```json
{ "refresh_token": "string" }
```

**Response 200:**
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Errores:** `401` refresh token inválido o expirado

---

### GET /auth/me
Perfil del usuario autenticado.

**Auth:** JWT

**Response 200:**
```json
{
  "user_id": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "avatar_url": "string | null",
  "tenant_id": "string | null"
}
```

---

## Tenants (Tiendas)

### POST /tenants
Crear una tienda (solo sellers).

**Auth:** JWT (role: seller)

**Body:**
```json
{
  "name": "string",
  "slug": "string (URL-safe, único)",
  "description": "string | null",
  "categories": ["string"]
}
```

**Response 201:**
```json
{
  "tenant_id": "string",
  "slug": "string",
  "name": "string",
  "status": "pending_setup"
}
```

**Errores:** `400` slug ya en uso | `403` usuario ya tiene una tienda

---

### GET /tenants/{slug}
Perfil público de una tienda.

**Auth:** ninguna

**Response 200:**
```json
{
  "slug": "string",
  "name": "string",
  "description": "string | null",
  "logo_url": "string | null",
  "banner_url": "string | null",
  "categories": ["string"],
  "rating_avg": "float | null"
}
```

**Errores:** `404`

---

### PATCH /tenants/me
Actualizar datos de la tienda propia.

**Auth:** JWT (role: seller) + X-Tenant-ID

**Body:** (todos opcionales)
```json
{
  "name": "string",
  "description": "string",
  "categories": ["string"],
  "contact_email": "string",
  "contact_phone": "string"
}
```

**Response 200:** mismo shape que GET /tenants/{slug} (versión completa con campos privados)

---

## Productos

### GET /products
Listar productos. Sin X-Tenant-ID = cross-tenant (búsqueda global). Con X-Tenant-ID = solo de esa tienda.

**Auth:** ninguna

**Query params:**
- `q`: búsqueda full-text
- `category_id`: filtrar por categoría
- `min_price`: centavos
- `max_price`: centavos
- `status`: `active` (default para público)
- `page`: número de página (default 1)
- `page_size`: items por página (default 20, max 100)
- `sort`: `price_asc` | `price_desc` | `newest` | `best_selling`

**Response 200:**
```json
{
  "items": [
    {
      "product_id": "string",
      "tenant_id": "string",
      "tenant_name": "string",
      "title": "string",
      "price": "int (centavos)",
      "compare_at_price": "int | null",
      "image_url": "string | null",
      "rating_avg": "float | null",
      "rating_count": "int",
      "status": "string"
    }
  ],
  "total": "int",
  "page": "int",
  "page_size": "int",
  "pages": "int"
}
```

---

### GET /products/{product_id}
Detalle de un producto.

**Auth:** ninguna

**Response 200:**
```json
{
  "product_id": "string",
  "tenant_id": "string",
  "tenant_name": "string",
  "title": "string",
  "description": "string | null",
  "price": "int",
  "compare_at_price": "int | null",
  "images": ["string"],
  "stock": "int",
  "status": "string",
  "variants": [...],
  "category_id": "string | null",
  "category_name": "string | null",
  "rating_avg": "float | null",
  "rating_count": "int",
  "sold_count": "int",
  "created_at": "datetime"
}
```

**Errores:** `404`

---

### POST /products
Crear producto (seller de la tienda).

**Auth:** JWT (role: seller) + X-Tenant-ID

**Body:**
```json
{
  "title": "string (max 150)",
  "description": "string | null",
  "price": "int (centavos)",
  "compare_at_price": "int | null",
  "category_id": "string | null",
  "stock": "int",
  "sku": "string | null",
  "tags": ["string"],
  "weight_grams": "int | null"
}
```

**Response 201:** shape completo del producto

---

### PATCH /products/{product_id}
Actualizar producto.

**Auth:** JWT (role: seller) + X-Tenant-ID

**Body:** todos los campos de POST son opcionales

**Response 200:** shape completo del producto

**Errores:** `403` no es owner | `404`

---

### DELETE /products/{product_id}
Soft delete del producto.

**Auth:** JWT (role: seller) + X-Tenant-ID

**Response 204:** sin body

---

### POST /products/{product_id}/images
Subir imágenes del producto.

**Auth:** JWT (role: seller) + X-Tenant-ID

**Body:** `multipart/form-data`, campo `files` (múltiples)

**Response 200:**
```json
{ "image_urls": ["string"] }
```

---

## Carrito

### GET /cart
Obtener carrito del usuario o sesión.

**Auth:** opcional (si no hay JWT, usar header `X-Session-ID`)

**Response 200:**
```json
{
  "items": [
    {
      "product_id": "string",
      "tenant_id": "string",
      "tenant_name": "string",
      "title": "string",
      "price_snapshot": "int",
      "quantity": "int",
      "variant": "object | null",
      "image_url": "string | null",
      "subtotal": "int"
    }
  ],
  "total": "int",
  "item_count": "int"
}
```

---

### POST /cart/items
Agregar item al carrito.

**Auth:** opcional

**Body:**
```json
{
  "product_id": "string",
  "quantity": "int",
  "variant": { "key": "string", "value": "string" }
}
```

**Response 200:** shape completo del carrito

**Errores:** `400` stock insuficiente | `404` producto no encontrado

---

### PATCH /cart/items/{product_id}
Actualizar cantidad.

**Auth:** opcional

**Body:**
```json
{ "quantity": "int (0 = eliminar)" }
```

**Response 200:** shape completo del carrito

---

### DELETE /cart/items/{product_id}
Quitar item del carrito.

**Auth:** opcional

**Response 200:** shape completo del carrito

---

## Direcciones

Direcciones guardadas del comprador, para elegir en el checkout sin recargarlas
cada vez (ver `addresses` en `database-schemas.md`).

### GET /addresses
Listar direcciones del usuario autenticado (default primero, luego más recientes).

**Auth:** JWT

**Response 200:** `AddressResponse[]`

---

### POST /addresses
Crear una dirección.

**Auth:** JWT

**Body:**
```json
{
  "full_name": "string",
  "phone_country_code": "string (default +54)",
  "phone": "string",
  "street": "string",
  "no_number": "bool (default false)",
  "province": "string",
  "locality": "string",
  "zip": "string | null",
  "zip_unknown": "bool (default false)",
  "department": "string | null",
  "is_default": "bool (default false)"
}
```

**Response 201:** `AddressResponse` — si `is_default: true` o es la primera
dirección del usuario, desmarca las demás.

---

### PATCH /addresses/{address_id}
Actualizar una dirección propia. Body: mismos campos, todos opcionales.

**Auth:** JWT

**Response 200:** `AddressResponse`

**Errores:** `404` no existe o no es del usuario

---

### PATCH /addresses/{address_id}/default
Marcar como predeterminada (desmarca las demás).

**Auth:** JWT

**Response 200:** `AddressResponse`

---

### DELETE /addresses/{address_id}
Soft delete.

**Auth:** JWT

**Response 204:** sin body

---

## Métodos de pago

Tarjetas guardadas del comprador. **Nunca se recibe ni persiste el número
completo ni el CVV** — sólo se usan para derivar `brand`/`last4` en el momento
de la request y se descartan. Hoy no hay cobro real (ver nota de `payment` en
`database-schemas.md`).

### GET /payment-methods
Listar tarjetas guardadas del usuario autenticado.

**Auth:** JWT

**Response 200:** `PaymentMethodResponse[]`

---

### POST /payment-methods
Guardar una tarjeta (sólo se llama cuando el comprador acepta guardarla).

**Auth:** JWT

**Body:**
```json
{
  "card_number": "string (sólo se usa para derivar brand/last4, no se guarda)",
  "holder_name": "string",
  "exp_month": "int (1-12)",
  "exp_year": "int",
  "is_default": "bool (default false)"
}
```

**Response 201:** `PaymentMethodResponse` (`brand`, `last4`, `holder_name`, `exp_month`, `exp_year`, `is_default`)

**Errores:** `400` número de tarjeta inválido (Luhn)

---

### PATCH /payment-methods/{payment_method_id}/default
Marcar como predeterminada (desmarca las demás).

**Auth:** JWT

**Response 200:** `PaymentMethodResponse`

---

### DELETE /payment-methods/{payment_method_id}
Soft delete.

**Auth:** JWT

**Response 204:** sin body

---

## Órdenes

### POST /orders
Crear orden desde el checkout. El carrito es client-side (no hay `carts`
server-side implementado todavía), así que los items viajan en el body como
snapshot tomado del `CartContext` del frontend.

**Auth:** JWT

**Body:**
```json
{
  "items": [
    {
      "product_id": "string",
      "title": "string",
      "price": "int (centavos, snapshot)",
      "quantity": "int",
      "image_url": "string | null"
    }
  ],
  "address_id": "string | null (una de /addresses del usuario)",
  "shipping_address": "{ ...igual a POST /addresses } | null (alternativa inline, se guarda como nueva dirección)",
  "payment_method_id": "string | null (una de /payment-methods del usuario)",
  "payment_card": "{ card_number, holder_name, exp_month, exp_year } | null (alternativa inline, no se persiste el PAN)",
  "save_card": "bool (default false) — si viene payment_card y es true, se guarda en payment_methods",
  "notes": "string | null"
}
```
Debe venir `address_id` **o** `shipping_address`, y `payment_method_id` **o**
`payment_card`.

**Response 201:**
```json
{
  "order_id": "string",
  "order_number": "string",
  "status": "pending_payment",
  "total": "int"
}
```
Sin `payment_url`: como no hay pasarela real conectada todavía, la orden queda
`pending_payment` y el seller la marca `paid` manualmente desde el panel (ver
`PATCH /orders/{id}/status`). Cuando se integre Mercado Pago este endpoint
vuelve a devolver `payment_url`.

**Errores:** `400` carrito vacío | `400` stock insuficiente | `400` productos de tiendas distintas en el mismo pedido | `400` falta dirección o método de pago

---

### GET /orders
Historial de órdenes. Sin `X-Tenant-ID` (o con role `buyer`) devuelve las
órdenes propias (`buyer_id`); con `X-Tenant-ID` y role `seller`/`platform_admin`
devuelve las de esa tienda.

**Auth:** JWT

**Query params:**
- `status`: filtrar por estado
- `q`: nº de orden o nombre/email del comprador (sólo vista seller)
- `page`, `page_size`, `sort` (`newest` | `oldest`)

**Response 200:** paginado con items del shape de orden

---

### GET /orders/{order_id}
Detalle de una orden.

**Auth:** JWT (buyer owner o seller de la tienda)

**Response 200:** shape completo de la orden

---

### PATCH /orders/{order_id}/status
Actualizar estado de la orden (seller).

**Auth:** JWT (role: seller) + X-Tenant-ID

**Body:**
```json
{
  "status": "string",
  "tracking_number": "string | null"
}
```

Al pasar a `"paid"` por primera vez descuenta stock de cada item; si desde
`"paid"` (o posterior) se pasa a `"cancelled"`/`"refunded"` lo restaura.

**Response 200:** orden actualizada

**Errores:** `400` transición de estado inválida | `403`

---

### POST /orders/webhook/mercadopago
Webhook de MercadoPago para notificaciones de pago.

**Auth:** validación de firma HMAC (header `x-signature`)

**Body:** payload de MercadoPago

**Response 200:** `{ "ok": true }`

---

## Categorías

### GET /categories
Árbol completo de categorías.

**Auth:** ninguna

**Response 200:**
```json
[
  {
    "category_id": "string",
    "name": "string",
    "slug": "string",
    "icon_url": "string | null",
    "children": [...]
  }
]
```

---

## Reviews

### POST /products/{product_id}/reviews
Publicar una review (solo compradores con orden entregada).

**Auth:** JWT (role: buyer)

**Body:**
```json
{
  "order_id": "string",
  "rating": "int (1-5)",
  "title": "string | null",
  "body": "string | null"
}
```

**Response 201:** shape de la review

**Errores:** `400` orden no entregada | `400` ya existe review para esta orden | `403`

---

### GET /products/{product_id}/reviews
Listar reviews de un producto.

**Auth:** ninguna

**Query params:** `page`, `page_size`, `sort` (`newest` | `highest` | `lowest`)

**Response 200:** paginado con reviews

---

## Búsqueda

### GET /search
Búsqueda global de productos cross-tenant.

**Auth:** ninguna

**Query params:**
- `q`: texto libre (requerido)
- `category_id`, `min_price`, `max_price`, `tenant_id` (filtrar a una tienda)
- `page`, `page_size`, `sort`

**Response 200:** mismo shape que GET /products

---

## Admin (platform_admin)

### GET /admin/tenants
Listar todas las tiendas.

**Auth:** JWT (role: platform_admin)

**Response 200:** lista paginada de tenants con todos los campos

---

### PATCH /admin/tenants/{slug}/status
Cambiar estado de una tienda.

**Auth:** JWT (role: platform_admin)

**Body:**
```json
{ "status": "active | suspended | deleted" }
```

**Response 200:** tenant actualizado

---

## Errores comunes

| Código | Significado |
|---|---|
| 400 | Bad request — error de negocio (body explica el motivo) |
| 401 | No autenticado — falta o es inválido el JWT |
| 403 | Sin permisos — autenticado pero no autorizado |
| 404 | Recurso no encontrado |
| 422 | Error de validación — body detalla los campos |
| 429 | Rate limit superado |
| 500 | Error interno del servidor |

Forma del body de error:
```json
{
  "detail": "string o array de ValidationError"
}
```
