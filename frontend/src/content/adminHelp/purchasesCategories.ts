import type { HelpTopicMap } from "./types";

export const purchasesCategoriesHelp: HelpTopicMap = {
  "/seller/purchases": {
    title: "Compras",
    summary:
      "Es el registro de todas las compras que le hiciste a tus proveedores para reponer stock. Desde aquí podés ver el historial completo y entrar a cualquier compra para ver su detalle.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text:
              "Esta pantalla lista todas las compras a proveedores que registraste, ordenadas de la más reciente a la más antigua. Arriba a la derecha (o en la barra fija de arriba si entrás desde el celular) tenés el botón «+ Registrar compra» para dar de alta una nueva.",
          },
          { type: "p", text: "Por cada compra, la tabla muestra:" },
          {
            type: "ul",
            items: [
              "Fecha: el día en que se registró la compra.",
              "Proveedor: el nombre que ingresaste al registrarla (si no pusiste nada, se muestra un guion).",
              "Referencia: el número de factura o remito que anotaste (también puede estar vacío).",
              "Ítems: cuántas líneas de producto distintas tiene la compra.",
              "Unidades: la cantidad total de unidades compradas, sumando todas las líneas.",
              "Costo total: lo que pagaste en total por esa compra.",
            ],
          },
          {
            type: "p",
            text:
              "Si entrás desde el celular, en lugar de la tabla vas a ver una lista de tarjetas con el proveedor, la referencia (o la fecha si no hay referencia), el costo total y las unidades.",
          },
        ],
      },
      {
        heading: "Cómo buscar una compra",
        blocks: [
          {
            type: "p",
            text:
              "Arriba de la lista hay un buscador que filtra por proveedor o por referencia (factura/remito). A medida que escribís, el sistema espera un instante antes de buscar (para no filtrar letra por letra) y actualiza la lista sola, sin que tengas que apretar ningún botón.",
          },
        ],
      },
      {
        heading: "Paginación",
        blocks: [
          {
            type: "p",
            text: "Si tenés muchas compras registradas, la lista se divide en páginas. Abajo de la tabla vas a encontrar:",
          },
          {
            type: "ul",
            items: [
              "Un selector para elegir cuántos resultados ver por página.",
              "El texto «Página X de Y» con el total de páginas.",
              "Las flechas ← y → para moverte entre páginas (se deshabilitan cuando ya estás en la primera o en la última).",
            ],
          },
        ],
      },
      {
        heading: "Cómo registrar una compra nueva",
        blocks: [
          {
            type: "ol",
            items: [
              "Hacé clic en «+ Registrar compra» (arriba a la derecha, o en la barra fija si estás desde el celular).",
              "Se abre la pantalla de registro, donde vas a cargar el proveedor, la referencia y los productos comprados.",
            ],
          },
          {
            type: "p",
            text:
              "Si todavía no registraste ninguna compra, en lugar de la tabla vas a ver un mensaje y un enlace para «Registrar la primera».",
          },
        ],
      },
      {
        heading: "Ver el detalle de una compra",
        blocks: [
          {
            type: "p",
            text:
              "Hacé clic en «Ver», al final de la fila (en la versión de escritorio), o tocá la tarjeta de la compra (en el celular) para abrir el detalle completo: cada producto comprado, su tamaño, cantidad, y cómo impactó en el costo y en el precio de venta.",
          },
        ],
      },
      {
        heading: "Tips",
        blocks: [
          {
            type: "ul",
            items: [
              "«Ítems» y «Unidades» no son lo mismo: una compra puede tener 2 ítems (2 productos distintos) y 50 unidades en total, si compraste por ejemplo 30 de uno y 20 de otro.",
              "Esta pantalla solo muestra compras a proveedores (las que usás para reponer stock). No es el lugar donde se ven los pedidos que te hacen tus clientes; eso está en otra sección del panel.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/purchases/new": {
    title: "Registrar compra",
    summary:
      "Desde aquí das de alta una compra a un proveedor: cargás qué productos compraste, en qué cantidad y a qué costo, y el sistema suma el stock y actualiza el costo y el precio de venta de cada producto automáticamente.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text:
              "Arriba de todo hay un aviso que resume lo que va a pasar al guardar: se suma el stock y se actualizan el costo y el precio de venta de cada producto que incluyas.",
          },
          {
            type: "p",
            text: "Más abajo tenés tres campos de cabecera, todos opcionales:",
          },
          {
            type: "ul",
            items: [
              "Proveedor: a quién le compraste.",
              "Referencia (factura / remito): el número del comprobante, si lo tenés.",
              "Nota: cualquier aclaración que quieras dejar sobre esta compra.",
            ],
          },
          {
            type: "p",
            text:
              "Debajo de la cabecera aparecen una o más «líneas» de compra: cada línea representa un producto que estás comprando.",
          },
        ],
      },
      {
        heading: "Cómo agregar un producto a la compra",
        blocks: [
          {
            type: "ol",
            items: [
              "En la línea, escribí el nombre del producto en el buscador («Buscar producto por nombre…»).",
              "Elegí el producto correcto de la lista de resultados que aparece debajo (se muestra el nombre y el precio actual de cada uno).",
              "Una vez elegido, la línea muestra el costo y el precio actuales de ese producto, como referencia.",
              "Completá el tamaño, la cantidad y el costo unitario de esta compra.",
            ],
          },
          {
            type: "p",
            text: "Si te equivocaste de producto, tocá «Cambiar» para volver a buscar otro.",
          },
        ],
      },
      {
        heading: "Datos de cada línea: tamaño, cantidad, costo y precio",
        blocks: [
          { type: "p", text: "Para cada producto que agregás, completás:" },
          {
            type: "ul",
            items: [
              "Tamaño: Chica, Mediana o Grande. Si el producto tiene un costo o precio distinto según el tamaño, al cambiarlo se actualizan el costo y el precio actuales que se muestran como referencia.",
              "Cantidad: cuántas unidades de ese producto y tamaño compraste (como mínimo, 1).",
              "Costo unitario: lo que pagaste por cada unidad en esta compra.",
              "Precio de venta: el precio al que vas a vender el producto a partir de ahora. El sistema te propone uno automáticamente, pero lo podés editar a mano.",
              "Markup: se calcula solo, y te muestra qué porcentaje de ganancia deja el precio de venta sobre el costo unitario que ingresaste.",
            ],
          },
        ],
      },
      {
        heading: "Cómo funciona el precio sugerido",
        blocks: [
          {
            type: "p",
            text:
              "Cada vez que cargás o cambiás el costo unitario de una línea (y todavía no tocaste el precio de venta a mano), el sistema te sugiere un precio de venta automáticamente, calculado con un porcentaje de markup (ganancia).",
          },
          {
            type: "ul",
            items: [
              "Si el producto tiene un markup objetivo propio configurado, se usa ese porcentaje.",
              "Si no tiene uno propio, se usa el markup general configurado para la tienda.",
            ],
          },
          {
            type: "p",
            text:
              "Debajo de cada línea vas a ver una aclaración con el porcentaje de markup usado y de dónde viene (si es el objetivo del producto o la configuración general de la tienda). En el momento en que edites el precio de venta a mano, el sistema deja de recalcularlo automáticamente para esa línea en particular.",
          },
        ],
      },
      {
        heading: "Agregar o quitar líneas",
        blocks: [
          {
            type: "p",
            text:
              "Usá «+ Agregar línea» para sumar más productos a la misma compra. Cada línea tiene una «×» para eliminarla, salvo que sea la única línea de la compra: siempre tiene que quedar, como mínimo, una.",
          },
        ],
      },
      {
        heading: "Totales y cómo guardar la compra",
        blocks: [
          {
            type: "p",
            text:
              "Abajo de todas las líneas vas a ver el total de unidades y el costo total de la compra, calculados en vivo a medida que completás los datos.",
          },
          {
            type: "ol",
            items: [
              "Revisá que todas las líneas tengan producto, cantidad y costo unitario cargados.",
              "Hacé clic en «Registrar compra» (arriba a la derecha, o en la barra fija si estás desde el celular).",
              "Si todo está en orden, vas a ver un aviso de que la compra se registró y que se actualizaron el stock y los precios, y el sistema te lleva directo al detalle de esa compra.",
            ],
          },
          {
            type: "p",
            text: "Si cancelás a mitad de camino, «Cancelar» te devuelve al listado de compras sin guardar nada.",
          },
        ],
      },
      {
        heading: "Errores comunes",
        blocks: [
          {
            type: "ul",
            items: [
              "Si no completaste ninguna línea con producto, cantidad y costo, el sistema te avisa que agregues al menos una antes de guardar.",
              "Las líneas sin producto elegido, sin cantidad o sin costo unitario simplemente no se incluyen en la compra al guardar.",
              "Si falla la carga de los datos de un producto buscado, vas a ver un aviso y podés intentar elegirlo de nuevo.",
              "Si falla el guardado de la compra, se te avisa y podés reintentar sin perder lo que ya cargaste.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/purchases/:purchaseId": {
    title: "Detalle de compra",
    summary:
      "Muestra el resumen completo de una compra ya registrada: qué productos se compraron, en qué cantidad, a qué costo, y cómo impactó cada línea en el costo y el precio de venta.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text:
              "Arriba se muestra el nombre del proveedor (o «Compra» si no se cargó ninguno), la fecha y hora en que se registró, y el número de referencia (factura o remito) si se ingresó uno.",
          },
          {
            type: "p",
            text: "Si la compra tiene una nota cargada, se muestra completa en un recuadro debajo del encabezado.",
          },
        ],
      },
      {
        heading: "La tabla de productos comprados",
        blocks: [
          { type: "p", text: "Cada fila de la tabla es un producto comprado, con estas columnas:" },
          {
            type: "ul",
            items: [
              "Producto: el nombre del producto, con un enlace directo a su ficha de edición.",
              "Tamaño: Chica, Mediana o Grande.",
              "Cant.: la cantidad de unidades compradas de esa línea.",
              "Costo unit.: lo que se pagó por cada unidad en esta compra.",
              "Costo → Nuevo: el costo que tenía el producto antes de esta compra y el costo nuevo que quedó cargado (que es el costo unitario de esta compra).",
              "Precio → Nuevo: el precio de venta anterior y el precio de venta nuevo que se dejó al registrar la compra.",
              "Markup: el porcentaje de ganancia entre el costo unitario y el precio nuevo de esa línea.",
            ],
          },
        ],
      },
      {
        heading: "Cómo leer los cambios de costo y precio",
        blocks: [
          {
            type: "p",
            text:
              "En las columnas «Costo → Nuevo» y «Precio → Nuevo» vas a ver un guion (—) en el lado izquierdo cuando el producto no tenía un costo o un precio previo registrado (por ejemplo, si es la primera compra que se le hace a ese producto desde que existe el sistema).",
          },
          {
            type: "p",
            text:
              "Si al momento de registrar la compra no se cargó un precio de venta nuevo para esa línea, en «Precio → Nuevo» el valor final también se muestra como guion.",
          },
        ],
      },
      {
        heading: "Totales de la compra",
        blocks: [
          {
            type: "p",
            text:
              "Al final de la pantalla se muestra el total de unidades compradas y el costo total de toda la compra, sumando todas las líneas.",
          },
        ],
      },
      {
        heading: "Ver o editar el producto comprado",
        blocks: [
          {
            type: "p",
            text:
              "Hacé clic en el nombre de un producto, dentro de la tabla, para ir directo a su ficha de edición y revisar o ajustar sus datos.",
          },
        ],
      },
      {
        heading: "Volver al listado",
        blocks: [
          {
            type: "p",
            text:
              "Usá el camino de navegación de arriba (Dashboard / Compras / Detalle) y hacé clic en «Compras» para volver al listado completo.",
          },
        ],
      },
    ],
  },

  "/seller/categories": {
    title: "Categorías",
    summary:
      "Acá administrás las categorías con las que organizás los productos de tu tienda: podés buscarlas, filtrarlas, crear nuevas, editarlas o eliminarlas (una por una o varias juntas).",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "La tabla de categorías muestra, por cada una:",
          },
          {
            type: "ul",
            items: [
              "Una casilla para seleccionarla.",
              "Una miniatura de su imagen (o un ícono de hoja si todavía no tiene imagen).",
              "Nombre y, debajo, el slug (la parte de la URL que la identifica).",
              "Descripción (recortada si es muy larga).",
              "Sección: a qué desplegable del menú de la tienda pertenece.",
              "Productos: cuántos productos tiene asignados (un guion si no tiene ninguno).",
              "Estado: una etiqueta «Activa» o «Inactiva».",
              "Acciones para editar (ícono de lápiz) o eliminar (ícono de tacho) esa categoría puntual.",
            ],
          },
          {
            type: "p",
            text:
              "En el celular, en lugar de la tabla vas a ver tarjetas que podés tocar para desplegar y ver la descripción, la sección, la cantidad de productos y los botones de Editar/Eliminar.",
          },
          {
            type: "p",
            text: "Arriba de todo, el encabezado te dice cuántas categorías tenés en total en la tienda.",
          },
        ],
      },
      {
        heading: "Cómo buscar y filtrar",
        blocks: [
          {
            type: "p",
            text: "La barra de filtros te deja combinar:",
          },
          {
            type: "ul",
            items: [
              "Búsqueda por nombre.",
              "Estado: Todos los estados, Activa o Inactiva.",
              "Sección: Todas las secciones, Plantas, Macetas & Accesorios o Productos Químicos.",
              "Orden: Más recientes, Nombre A → Z, o Por orden (el número de orden manual que le asignaste a cada categoría).",
            ],
          },
          {
            type: "p",
            text:
              "En el celular, los filtros están colapsados detrás de un botón «Filtros» que muestra un contador con la cantidad de filtros activos; en la versión de escritorio siempre están visibles.",
          },
          {
            type: "p",
            text:
              "Cuando tenés algún filtro, búsqueda u orden distinto del predeterminado, aparece el enlace «Limpiar filtros» para volver todo a su estado inicial de una sola vez.",
          },
        ],
      },
      {
        heading: "Selección múltiple y eliminación en lote",
        blocks: [
          {
            type: "ol",
            items: [
              "Marcá la casilla de una o más categorías, o la casilla del encabezado de la tabla para seleccionar todas las de la página actual.",
              "Aparece una barra con la cantidad de categorías seleccionadas y el botón «Eliminar seleccionadas».",
              "Al hacer clic, el sistema te pide confirmación («¿Eliminar X categorías?»); confirmá con «Confirmar» o volvé atrás con «Cancelar».",
              "Si alguna categoría no se pudo eliminar, el aviso final te indica cuántas se eliminaron bien y cuántas tuvieron error.",
            ],
          },
          {
            type: "p",
            text: "«Cancelar selección» limpia todo lo seleccionado sin eliminar nada.",
          },
        ],
      },
      {
        heading: "Editar o eliminar una categoría individual",
        blocks: [
          {
            type: "p",
            text:
              "El ícono de lápiz te lleva a la pantalla de edición de esa categoría. El ícono de tacho te pide una confirmación rápida («¿Eliminar?» con botones «Sí» y «No») antes de borrarla definitivamente.",
          },
          {
            type: "p",
            text:
              "En el celular, tocá la tarjeta de la categoría para desplegarla y vas a encontrar los botones «Editar» y «Eliminar» (este último también con su propia confirmación).",
          },
        ],
      },
      {
        heading: "Crear una categoría nueva",
        blocks: [
          {
            type: "p",
            text:
              "El botón «+ Nueva categoría» está disponible arriba a la derecha, en la barra fija del celular, y también como acceso directo cuando todavía no tenés ninguna categoría creada.",
          },
        ],
      },
      {
        heading: "Las secciones de la tienda",
        blocks: [
          {
            type: "p",
            text:
              "Cada categoría pertenece a una única sección: Plantas, Macetas & Accesorios o Productos Químicos. Esa sección define en qué desplegable del menú superior de la tienda va a aparecer la categoría para tus clientes.",
          },
        ],
      },
      {
        heading: "Paginación",
        blocks: [
          {
            type: "p",
            text: "Si tenés muchas categorías, la lista se divide en páginas. Abajo de la tabla vas a encontrar:",
          },
          {
            type: "ul",
            items: [
              "Un selector de cantidad de resultados por página.",
              "El texto «Página X de Y».",
              "Botones numerados y las flechas ← y → para moverte entre páginas.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/categories/new": {
    title: "Nueva categoría",
    summary:
      "Formulario para crear una categoría nueva con la que vas a poder organizar y agrupar productos en tu tienda.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text:
              "A la izquierda tenés el formulario con los datos de la categoría, y a la derecha una tarjeta para subir la imagen y otra con información adicional. Los botones «Cancelar» y «Guardar categoría» están arriba de todo (y también en la barra fija si estás desde el celular).",
          },
        ],
      },
      {
        heading: "Completar los datos básicos",
        blocks: [
          {
            type: "ul",
            items: [
              "Nombre (obligatorio, hasta 80 caracteres, con un contador que te muestra cuánto espacio te queda).",
              "Slug (URL): se genera automáticamente a partir del nombre, en minúsculas, sin acentos y separado por guiones. Lo podés editar a mano si querés uno distinto; solo acepta letras minúsculas, números y guiones.",
              "Descripción (opcional, hasta 500 caracteres, con contador).",
              "Sección (obligatoria): define en qué desplegable del menú superior de la tienda va a aparecer esta categoría (Plantas, Macetas & Accesorios o Productos Químicos).",
              "Estado: un interruptor para marcar la categoría como Activa o Inactiva.",
              "Orden: un número; cuanto más chico, antes aparece la categoría en los listados (viene con 0 por defecto).",
            ],
          },
        ],
      },
      {
        heading: "Cómo se genera el slug",
        blocks: [
          {
            type: "p",
            text:
              "Mientras no edites el slug a mano, se recalcula solo cada vez que cambiás el nombre. En el momento en que lo edites manualmente, queda fijo con lo que escribiste, aunque después sigas cambiando el nombre.",
          },
        ],
      },
      {
        heading: "Subir una imagen",
        blocks: [
          {
            type: "p",
            text:
              "En la tarjeta «Imagen de la categoría» podés arrastrar y soltar una imagen, o hacer clic para elegirla desde tu dispositivo. Se aceptan archivos JPG, PNG o WebP de hasta 5 MB.",
          },
          {
            type: "p",
            text:
              "Una vez elegida, vas a ver una vista previa con una «×» para quitarla y un enlace para «Cambiar imagen» por otra.",
          },
        ],
      },
      {
        heading: "Cómo guardar la categoría",
        blocks: [
          {
            type: "ol",
            items: [
              "Completá al menos el nombre (es el único campo realmente obligatorio, junto con la sección, que ya viene con un valor por defecto).",
              "Si querés, cargá una imagen: se sube automáticamente después de crear la categoría.",
              "Hacé clic en «Guardar categoría».",
              "Vas a ver un aviso de confirmación y el sistema te lleva de vuelta al listado de categorías.",
            ],
          },
        ],
      },
      {
        heading: "Errores comunes",
        blocks: [
          {
            type: "ul",
            items: [
              "Si el nombre queda vacío, el sistema no guarda nada y te avisa que es obligatorio.",
              "Si la categoría se crea pero falla la subida de la imagen, la categoría queda guardada igual y te avisa que la imagen no se pudo subir; podés agregarla después editándola.",
              "Si el servidor rechaza la creación por algún motivo (por ejemplo, datos inválidos), vas a ver un mensaje de error específico cuando el sistema lo informa, o uno genérico si no hay más detalle disponible.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/categories/:id/edit": {
    title: "Editar categoría",
    summary:
      "Permite modificar los datos de una categoría ya creada: nombre, slug, descripción, sección, estado, orden e imagen.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text:
              "Mientras se cargan los datos de la categoría vas a ver una animación de carga. Si no se pudo cargar, aparece un aviso con un enlace para volver al listado de categorías.",
          },
          {
            type: "p",
            text:
              "Una vez cargada, el encabezado muestra el nombre de la categoría y cuántos productos tiene asignados actualmente.",
          },
        ],
      },
      {
        heading: "Datos que podés editar",
        blocks: [
          {
            type: "p",
            text: "Son los mismos campos que al crear una categoría, pero ya vienen precargados con los valores actuales:",
          },
          {
            type: "ul",
            items: [
              "Nombre (obligatorio, hasta 80 caracteres).",
              "Slug (URL), editable a mano si querés cambiarlo.",
              "Descripción (hasta 500 caracteres).",
              "Sección: Plantas, Macetas & Accesorios o Productos Químicos.",
              "Estado: Activa o Inactiva, con el mismo interruptor.",
              "Orden: el número que define la posición de la categoría en los listados.",
            ],
          },
        ],
      },
      {
        heading: "Cambiar la imagen",
        blocks: [
          {
            type: "p",
            text:
              "Se muestra la imagen actual de la categoría (si tiene). Podés reemplazarla haciendo clic en «Cambiar imagen» o arrastrando una nueva; se aplican las mismas restricciones que al crear (JPG, PNG o WebP, hasta 5 MB).",
          },
          {
            type: "p",
            text:
              "Si elegís una imagen nueva pero todavía no guardaste, podés descartar esa selección con la «×» que aparece sobre la vista previa; eso no borra la imagen que ya estaba guardada, solo cancela el cambio pendiente.",
          },
        ],
      },
      {
        heading: "Información de la categoría",
        blocks: [
          {
            type: "p",
            text: "A la derecha, una tarjeta de solo lectura te muestra:",
          },
          {
            type: "ul",
            items: [
              "Productos: la cantidad de productos que tiene asignados esta categoría en este momento.",
              "Creada: la fecha en que se dio de alta.",
              "Modificada: la fecha de la última edición guardada.",
            ],
          },
        ],
      },
      {
        heading: "Cómo guardar los cambios",
        blocks: [
          {
            type: "ol",
            items: [
              "Modificá los campos que quieras actualizar.",
              "Si cambiaste la imagen, se sube automáticamente al guardar.",
              "Hacé clic en «Guardar cambios».",
              "Vas a ver un aviso de confirmación y el sistema te lleva de vuelta al listado de categorías.",
            ],
          },
        ],
      },
      {
        heading: "Errores comunes",
        blocks: [
          {
            type: "ul",
            items: [
              "Si el nombre queda vacío, no se guardan los cambios y el sistema te avisa que es obligatorio.",
              "Si no se pudo cargar la categoría al abrir la pantalla, vas a ver un aviso con un enlace para volver al listado en lugar del formulario.",
              "Si se guardan los datos pero falla la subida de la nueva imagen, los demás cambios quedan guardados igual y se te avisa que la imagen no se pudo actualizar.",
              "Si el servidor rechaza el guardado, vas a ver el mensaje de error específico cuando esté disponible, o uno genérico si no.",
            ],
          },
        ],
      },
    ],
  },
};
