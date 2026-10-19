---
name: admin-help-sync
description: Keep the admin panel's in-app help (the "?" modal on each /seller screen) in sync whenever a screen under frontend/src/pages/admin or its shared components changes. Use after adding, removing, or changing fields, buttons, filters, validations, bulk actions, tabs, or workflows on any admin panel screen — before considering that change done.
---

# Mantener sincronizada la ayuda del panel de administración

El panel de administración (`/seller/...`) tiene un botón de ayuda (ícono "?") en el header, al lado del botón de hamburguesa, implementado en `frontend/src/components/admin/AdminLayout.tsx`. Al hacer clic abre `frontend/src/components/admin/HelpModal.tsx` con el contenido de ayuda de la pantalla actual, resuelto automáticamente por ruta a través de `frontend/src/content/adminHelp/index.ts` → `getHelpTopic(pathname)`.

El contenido de cada pantalla vive en `frontend/src/content/adminHelp/` repartido en varios archivos temáticos:

| Archivo | Rutas que cubre |
|---|---|
| `dashboardOrders.ts` | `/seller`, `/seller/orders`, `/seller/orders/:orderId`, `/seller/orders/:orderId/receipt`, `/seller/alerts`, `/seller/mailbox` |
| `productsCombos.ts` | `/seller/products`, `/seller/products/new`, `/seller/products/:productId/edit`, `/seller/combos`, `/seller/combos/new`, `/seller/combos/:productId/edit` |
| `purchasesCategories.ts` | `/seller/purchases`, `/seller/purchases/new`, `/seller/purchases/:purchaseId`, `/seller/categories`, `/seller/categories/new`, `/seller/categories/:id/edit` |
| `peopleUsers.ts` | `/seller/clients`, `/seller/users`, `/seller/users/new`, `/seller/users/:userId/edit` |
| `settingsHelp.ts` | `/seller/settings` (todas las sub-pestañas de Configuración, como secciones dentro del mismo topic) |
| `otherHelp.ts` | `/seller/content`, `/seller/reports`, `/seller/integrations` |

Cada archivo exporta un `HelpTopicMap` (definido en `types.ts`) y `index.ts` los combina con spread en `ADMIN_HELP_TOPICS`. Las claves del mapa son EXACTAMENTE los `path` de las rutas declaradas en `frontend/src/App.tsx` (incluyendo los `:param`), y se resuelven contra la URL actual con `matchPath` de react-router. Si agregás una ruta nueva al panel de administración, tenés que:

1. Agregar la ruta en `App.tsx` como siempre.
2. Agregar una entrada nueva con esa misma clave de ruta en el archivo temático que corresponda (o crear uno nuevo si no encaja en ninguno, e importarlo/spreadearlo en `index.ts`).

## Cuándo usar esta skill

Activala cada vez que termines un cambio en una pantalla del panel de administración que modifique lo que el usuario ve o puede hacer: nuevos campos, botones, filtros, pestañas, validaciones, confirmaciones, acciones en lote, cambios de flujo (pasos para crear/editar algo), textos de estado/badges, o una pantalla nueva. Cambios puramente visuales/de estilo sin impacto funcional no requieren tocar la ayuda.

No hace falta activarla para cambios fuera de `frontend/src/pages/admin/**` y `frontend/src/components/admin/**` (p. ej. la tienda pública, el backend).

## Cómo actualizar la ayuda

1. Identificá qué ruta(s) de `/seller/...` cambiaron y en qué archivo de `adminHelp/` están esas rutas (ver tabla arriba, o grep la ruta en `index.ts`/los archivos temáticos si no estás seguro).
2. Leé el `HelpTopic` actual de esa ruta y comparalo con el comportamiento nuevo de la pantalla.
3. Editá el `HelpTopic` para que vuelva a reflejar la realidad: agregá/quitá pasos de las listas numeradas (`type: "ol"`), agregá/quitá ítems de las listas con viñetas (`type: "ul"`), y ajustá los párrafos (`type: "p"`) y el `summary`. Seguí el mismo tono: español argentino con voseo, claro y detallado, pensado para un empleado nuevo del vivero sin conocimientos técnicos.
4. No inventes funcionalidad que no existe en el código — si tenés dudas sobre el comportamiento real, leé el componente de la pantalla (`frontend/src/pages/admin/*.tsx` y los componentes que usa en `frontend/src/components/admin/*.tsx`) antes de escribir.
5. Mantené la forma exacta del tipo `HelpTopic` (`title`, `summary`, `sections: { heading, blocks: { type, text?, items? }[] }[]`), definida en `frontend/src/content/adminHelp/types.ts`.
6. Si agregaste una pantalla nueva sin topic de ayuda, el botón "?" del header simplemente no aparece en esa pantalla (ver `helpTopic &&` en `AdminLayout.tsx`) — agregá su entrada para que el botón aparezca ahí también.
7. Después de editar, verificá que el archivo compile: `cd frontend && npx tsc --noEmit` (o el build del proyecto) para detectar errores de sintaxis en el objeto.

No hace falta tocar `HelpModal.tsx` ni `AdminLayout.tsx` para esto — solo el contenido en `adminHelp/`, salvo que el cambio sea estructural (p. ej. un nuevo tipo de bloque de ayuda), en cuyo caso también actualizá `types.ts` y el renderer en `HelpModal.tsx`.
