import type { HelpTopicMap } from "./types";

export const productsCombosHelp: HelpTopicMap = {
  "/seller/products": {
    title: "Productos",
    summary:
      "Listado completo de los productos simples de tu tienda: buscá, filtrá, importá desde Excel, sugerí fotos automáticamente y editá o eliminá productos de a uno o en lote.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "Esta es la lista de todos los productos simples que tenés cargados (no incluye combos, que tienen su propia pantalla). Arriba a la derecha tenés los botones «Importar» y «+ Nuevo producto». Cada fila de la tabla muestra:",
          },
          {
            type: "ul",
            items: [
              "Una casilla para seleccionar el producto (para acciones en lote).",
              "La foto del producto, o un ícono genérico si todavía no tiene foto cargada.",
              "El nombre, una estrella dorada si está marcado como «Destacado», la descripción corta, hasta 3 etiquetas y los íconos de cuidados (luz, riego, ambiente, temperatura) si los completaste.",
              "La categoría asignada (o un guión si no tiene).",
              "El stock, en una etiqueta de color: roja si es 0, naranja si es 5 o menos, verde si hay más.",
              "El estado: Activo (verde), Borrador (amarillo) o Inactivo (gris).",
              "El precio, el precio sin descuento tachado si corresponde, y el margen (%) si el producto tiene precio de costo cargado.",
              "Los botones de Editar (lápiz) y Eliminar (tacho) de esa fila.",
            ],
          },
          {
            type: "p",
            text: "En celulares, cada producto se muestra como una tarjeta: tocá sobre el nombre para expandirla y ver categoría, estado, precio y cuidados completos.",
          },
        ],
      },
      {
        heading: "Cómo buscar y filtrar",
        blocks: [
          {
            type: "p",
            text: "Arriba de la tabla hay una barra de filtros (en celular está oculta detrás del botón «Filtros», que muestra un numerito con la cantidad de filtros activos). Los filtros disponibles son:",
          },
          {
            type: "ul",
            items: [
              "Buscar por nombre: escribí y esperá un instante, la búsqueda se aplica sola.",
              "Categoría: todas las categorías agrupadas por tipo (Plantas, Macetas y accesorios, Productos químicos).",
              "Estado: Todos, Activo, Borrador o Inactivo. Por defecto la pantalla arranca mostrando solo los Activos.",
              "Con/sin foto: para encontrar rápido los productos a los que les falta cargar una imagen.",
              "Con/sin stock: para ver qué productos están agotados o cuáles todavía tienen unidades.",
              "Orden: Más recientes, Precio de menor a mayor, Precio de mayor a menor, o Nombre A → Z.",
            ],
          },
          {
            type: "p",
            text: "Si tenés algún filtro aplicado (distinto del estado «Activo» por defecto) aparece el link «Limpiar filtros» para volver todo a los valores iniciales.",
          },
        ],
      },
      {
        heading: "Selección y acciones en lote",
        blocks: [
          {
            type: "p",
            text: "Tildá la casilla de una o más filas, o la casilla del encabezado para seleccionar todos los productos de la página actual. Al seleccionar al menos uno aparece una barra con estas opciones:",
          },
          {
            type: "ul",
            items: [
              "Sugerir fotos: abre un buscador automático de imágenes para todos los productos seleccionados (ver sección siguiente).",
              "Eliminar seleccionados: te pide confirmación («¿Eliminar X productos?») antes de borrar todos de una.",
              "Cancelar selección: deselecciona todo sin hacer nada.",
            ],
          },
          {
            type: "p",
            text: "La selección se limpia sola si cambiás de página, cambiás algún filtro, o si eliminás algún producto.",
          },
        ],
      },
      {
        heading: "Importar productos desde una planilla Excel",
        blocks: [
          {
            type: "p",
            text: "El botón «Importar» abre un asistente para cargar o actualizar muchos productos de una sola vez desde un archivo .xlsx. Los pasos son:",
          },
          {
            type: "ol",
            items: [
              "Elegí el tipo de producto que vas a importar: Plantas, Macetas y accesorios, o Productos químicos. Cada tipo tiene su propia plantilla, con columnas distintas.",
              "Hacé clic en «Descargar plantilla .xlsx» para bajar el archivo con las columnas correctas para ese tipo.",
              "Completá una fila por producto en la planilla (para plantas, los valores corresponden a la medida mediana; para macetas con varios colores, repetí una fila por color con el mismo nombre o SKU).",
              "Arrastrá el archivo completado al recuadro punteado, o hacé clic para elegirlo desde tu computadora. Solo se aceptan archivos .xlsx o .xlsm.",
              "Tocá «Importar». Si un producto ya existe (mismo SKU o mismo nombre) se actualiza en lugar de duplicarse.",
            ],
          },
          {
            type: "p",
            text: "La importación corre en segundo plano: podés cerrar el modal o incluso navegar a otra pantalla y vas a ver una etiqueta «Importando… X/Y» arriba de la lista mientras termina. Al finalizar te avisa cuántos productos se crearon, cuántos se actualizaron, y si hubo filas con aviso o con error (se listan fila por fila, con el motivo).",
          },
        ],
      },
      {
        heading: "Sugerir fotos automáticamente (en lote)",
        blocks: [
          {
            type: "p",
            text: "Si seleccionaste productos y tocás «Sugerir fotos», el sistema busca automáticamente imágenes en Wikimedia Commons para cada uno (usando el nombre del producto como búsqueda). Por cada producto vas a ver una grilla de fotos candidatas:",
          },
          {
            type: "ul",
            items: [
              "Tocá una o varias fotos para seleccionarlas (se marcan con un tilde).",
              "Si un producto no tiene buenas opciones, destildá «Incluir» para excluirlo de la confirmación.",
              "Si un producto no tuvo resultados, se muestra el aviso «Sin resultados» y no se puede hacer nada con él en ese momento.",
              "Al tocar «Confirmar», se guardan las fotos elegidas como imágenes del producto (no se sube ningún archivo, se usa directamente el link de Wikimedia). Cada producto confirmado muestra «Guardado ✓».",
            ],
          },
        ],
      },
      {
        heading: "Editar o eliminar un producto",
        blocks: [
          {
            type: "ol",
            items: [
              "Para editar, tocá el lápiz de la fila (o la tarjeta, en celular) y te lleva a la pantalla de edición del producto.",
              "Para eliminar uno solo, tocá el tacho de esa fila: te va a pedir confirmación («¿Eliminar?») con botones Sí/No antes de borrarlo definitivamente.",
              "La eliminación no se puede deshacer.",
            ],
          },
        ],
      },
      {
        heading: "Tips y errores comunes",
        blocks: [
          {
            type: "ul",
            items: [
              "Si no encontrás un producto, revisá primero el filtro de Estado: por defecto solo se muestran los Activos, así que un producto en Borrador puede no aparecer hasta que cambies ese filtro.",
              "Si falla la carga de la lista aparece un mensaje de error con un link «Reintentar».",
              "Si no tenés ningún producto todavía, vas a ver un cartel invitándote a crear el primero con «+ Nuevo producto».",
              "Podés cambiar cuántos productos se muestran por página con el selector «Mostrar X por página», al pie de la tabla.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/products/new": {
    title: "Nuevo producto",
    summary:
      "Formulario para crear un producto simple (planta, maceta o accesorio) desde cero: datos generales, precio y stock por tamaño, imágenes y vista previa, con opción de guardar como borrador o publicar directamente.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "El formulario está organizado en solapas: Información general, Variantes, Imágenes y SEO y visibilidad. En pantallas grandes, las solapas de Imágenes y SEO se muestran siempre visibles en una columna a la derecha (no hace falta cambiar de solapa); en celular, en cambio, son solapas normales.",
          },
          {
            type: "p",
            text: "Arriba de todo tenés tres botones: Cancelar (vuelve al listado sin guardar), Guardar borrador y Publicar producto.",
          },
        ],
      },
      {
        heading: "Información general",
        blocks: [
          {
            type: "p",
            text: "En esta solapa completás los datos básicos del producto:",
          },
          {
            type: "ul",
            items: [
              "Nombre del producto (obligatorio, hasta 120 caracteres) y SKU (obligatorio, el código interno del producto).",
              "Categoría: en esta pantalla las opciones son fijas (Plantas de interior, Plantas de exterior, Cactus y suculentas, Árboles ornamentales).",
              "Etiquetas: escribí una palabra y presioná Enter o coma para agregarla; con Backspace sobre el campo vacío borrás la última etiqueta.",
              "Destacado: un interruptor para que el producto aparezca marcado con una estrella en los listados.",
              "Descripción corta (hasta 160 caracteres, aparece en los listados) y Descripción completa (hasta 3000 caracteres).",
              "Cuidados: cuatro tarjetas (Luz, Riego, Ambiente, Temperatura) con opciones predefinidas para elegir con un clic, o un campo de texto libre para escribir uno personalizado.",
              "Dimensiones y características: diámetro de maceta, altura con maceta, tipo de planta y velocidad de crecimiento (Lento, Medio, Rápido).",
            ],
          },
        ],
      },
      {
        heading: "Precio, stock y tamaños (variantes)",
        blocks: [
          {
            type: "p",
            text: "La solapa Variantes te deja cargar precio y stock por tres tamaños: Planta chica, Planta mediana (la medida principal, con precio y stock obligatorios) y Planta grande. Para cada tamaño podés definir:",
          },
          {
            type: "ul",
            items: [
              "Precio y Precio sin descuento (el precio «de lista» que se muestra tachado si el actual es una promoción).",
              "Stock, con botones para sumar o restar de a una unidad.",
              "Peso (kg) y Altura (cm).",
              "Un interruptor Activo/Inactivo para habilitar o no esa medida en la tienda.",
              "Un buscador de macetas recomendadas para ese tamaño (elegí macetas existentes para sugerírselas al cliente junto con la planta).",
            ],
          },
        ],
      },
      {
        heading: "Imágenes del producto",
        blocks: [
          {
            type: "ol",
            items: [
              "Arrastrá imágenes al recuadro punteado, o hacé clic para elegirlas desde tu computadora. En el celular, un clic te pregunta si querés subir desde la galería o sacar una foto nueva con la cámara.",
              "Las imágenes elegidas quedan pendientes (todavía no se suben) hasta que guardes el producto.",
              "Tocá una miniatura para marcarla como «Portada»: esa es la foto principal que se va a mostrar primero.",
              "Usá la cruz de cada miniatura para quitarla de la lista antes de guardar.",
            ],
          },
          {
            type: "ul",
            items: [
              "Formato recomendado: cuadrado (1:1) o 4:5. Tamaño máximo por archivo: 20MB.",
              "Las imágenes recién se suben al servidor cuando guardás o publicás el producto; si falla la subida de alguna, te avisa con el nombre del archivo.",
            ],
          },
        ],
      },
      {
        heading: "Vista previa en tienda",
        blocks: [
          {
            type: "p",
            text: "A la derecha (o en la solapa SEO y visibilidad, en celular) hay una tarjeta que muestra cómo se va a ver el producto en la tienda: la foto de portada, el nombre, el precio (con el precio tachado si cargaste uno sin descuento) y los primeros datos de cuidados, con un botón de «Agregar al carrito» de referencia. Se actualiza en vivo mientras completás el formulario.",
          },
        ],
      },
      {
        heading: "Cómo guardar o publicar",
        blocks: [
          {
            type: "ol",
            items: [
              "Completá al menos el Nombre y el Precio de la medida mediana — son obligatorios.",
              "Tocá «Guardar borrador» si todavía no querés que se vea en la tienda: el producto queda creado pero no visible.",
              "Tocá «Publicar producto» para crearlo y dejarlo activo (visible en la tienda) de una sola vez.",
              "En cualquiera de los dos casos, al terminar te lleva automáticamente a la pantalla de edición de ese producto, donde podés seguir completando datos.",
            ],
          },
        ],
      },
      {
        heading: "Errores comunes y validaciones",
        blocks: [
          {
            type: "ul",
            items: [
              "Si dejás el nombre vacío, no te deja guardar: «El nombre del producto es obligatorio».",
              "Si el precio de la medida mediana es 0 o está vacío, tampoco te deja guardar: «El precio debe ser mayor a 0».",
              "Mientras se está guardando, los botones se deshabilitan y muestran «Guardando…» para evitar que hagas doble clic.",
              "Si falla la creación del producto, aparece un aviso «No se pudo crear el producto» y podés volver a intentarlo sin perder lo que completaste.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/products/:productId/edit": {
    title: "Editar producto",
    summary:
      "Pantalla completa para modificar un producto ya creado: tipo de producto (planta, maceta o químico), precio y markup, variantes por tamaño o color, imágenes con sugerencias automáticas, y estado de publicación.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "Es la misma estructura de solapas que «Nuevo producto» (Información general, Variantes, Imágenes, SEO y visibilidad), pero cargada con los datos reales del producto. Mientras se cargan los datos ves el mensaje «Cargando producto…».",
          },
          {
            type: "p",
            text: "Arriba tenés Cerrar, Guardar borrador y Guardar cambios (este último se llama «Publicar producto» solo si el producto todavía no existe; al editar uno existente, Guardar cambios respeta el estado actual: si estaba activo, lo mantiene activo). A la derecha hay una tarjeta con el ID del producto y su estado actual.",
          },
        ],
      },
      {
        heading: "Tipo de producto: plantas, macetas o productos químicos",
        blocks: [
          {
            type: "p",
            text: "Arriba de todo en Información general elegís el Tipo de producto, que cambia qué secciones del formulario aplican (al cambiar de tipo se vacía la categoría elegida, porque seguramente correspondía al tipo anterior):",
          },
          {
            type: "ul",
            items: [
              "Plantas: muestra Cuidados (luz, riego, ambiente, temperatura), Tipo de planta y Crecimiento, y variantes por tamaño (chica, mediana, grande) con su propio precio, costo y maceta recomendada.",
              "Macetas y accesorios: no muestra cuidados ni tipo de planta/crecimiento; en vez de tamaños, el stock se maneja por color (ver más abajo) y el precio es único.",
              "Productos químicos: es el más simple — sin cuidados, sin dimensiones, con un único precio, costo y stock.",
            ],
          },
          {
            type: "p",
            text: "Al editar un producto existente, el tipo se infiere automáticamente según la categoría que ya tenía asignada. Si todavía no hay categorías creadas para el tipo elegido, aparece un aviso para ir a crear una en la sección Categorías.",
          },
        ],
      },
      {
        heading: "Precio, costo y markup",
        blocks: [
          {
            type: "p",
            text: "Además de Precio y Precio sin descuento, en Editar podés cargar el Precio de costo de cada medida. Con eso el sistema calcula y muestra el «Markup actual» (el margen entre costo y precio de venta).",
          },
          {
            type: "ul",
            items: [
              "Hay un campo Markup objetivo (%) general para el producto: si lo dejás vacío, se usa el markup por defecto configurado en Configuración de la tienda.",
              "Si cargaste un costo, aparece el botón «Sugerir precio (X%)» que calcula automáticamente el precio de venta a partir del costo y el markup objetivo.",
            ],
          },
        ],
      },
      {
        heading: "Variantes por tamaño o por color",
        blocks: [
          {
            type: "ul",
            items: [
              "Plantas: tres filas (chica, mediana, grande), cada una con precio, costo, precio sin descuento, stock, peso, altura, un interruptor Activo/Inactivo y un buscador de macetas recomendadas para esa medida.",
              "Macetas y accesorios: una sola fila de precio/costo/stock (el campo Stock queda de solo lectura, con la leyenda «Stock (suma de colores)»), más una lista de colores donde activás los que tenés disponibles y cargás el stock de cada uno. El stock total del producto se recalcula solo, sumando el stock de los colores activos.",
              "Productos químicos: una sola fila de precio, costo y stock, sin interruptor Activo/Inactivo y sin buscador de macetas (no aplican).",
            ],
          },
        ],
      },
      {
        heading: "Imágenes: subir y sugerir fotos automáticamente",
        blocks: [
          {
            type: "ol",
            items: [
              "Arrastrá o seleccioná imágenes: a diferencia de «Nuevo producto», acá se suben al instante (el producto ya existe), no quedan pendientes.",
              "Tocá «Sugerir fotos» para abrir el buscador de imágenes de Wikimedia Commons: podés buscar por el nombre o por la descripción del producto, escribir tu propia búsqueda, y elegir una o varias fotos candidatas antes de confirmar.",
              "Tocá una miniatura para marcarla como portada.",
              "Si una foto no es cuadrada, aparece el botón «Ajustar» para mostrarla completa (sin recortar) dentro del marco cuadrado, en vez de recortada.",
              "Usá la cruz de cada foto para eliminarla.",
            ],
          },
          {
            type: "p",
            text: "Hay además un link «Ver página» en la vista previa que abre la página pública del producto en una pestaña nueva, tal como la ve un cliente.",
          },
        ],
      },
      {
        heading: "Guardar cambios, borrador y estado",
        blocks: [
          {
            type: "ul",
            items: [
              "Guardar borrador fuerza el estado a Borrador (no visible en la tienda), sin importar el estado anterior.",
              "Guardar cambios guarda todos los datos sin cambiar el estado: si el producto estaba activo, sigue activo; si estaba en borrador, sigue en borrador.",
              "La categoría es obligatoria para guardar (tanto al crear como al editar); si no elegiste ninguna, te avisa «Elegí una categoría».",
              "Cerrar te lleva de vuelta al listado de productos sin guardar los cambios pendientes.",
            ],
          },
        ],
      },
      {
        heading: "Tips y errores comunes",
        blocks: [
          {
            type: "ul",
            items: [
              "Si cambiás el Tipo de producto, revisá la categoría: se vacía automáticamente porque la anterior puede no corresponder al nuevo tipo.",
              "El campo Stock de Macetas y accesorios no se edita directamente: cargá el stock por color más abajo.",
              "Si falla la subida de alguna imagen, el aviso te dice el nombre del archivo que no se pudo subir, pero el resto se sube igual.",
              "Si falla el guardado, aparece «Error al guardar los cambios» y podés reintentar sin perder lo que escribiste.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/combos": {
    title: "Combos",
    summary:
      "Listado de combos y promociones armados a partir de productos existentes: buscá, filtrá por estado, revisá stock disponible y precio, y editá o eliminá combos.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "Lista de todos los combos y promociones de la tienda (productos compuestos por otros productos, con un precio propio). Cada fila muestra:",
          },
          {
            type: "ul",
            items: [
              "La foto del combo (o un ícono de caja si no tiene).",
              "El nombre, la estrella si está marcado como destacado, y la descripción corta.",
              "El Stock disponible, en una etiqueta de color: roja si es 0, naranja si es 3 o menos, verde si hay más (este número se calcula a partir del stock de los productos que forman el combo).",
              "El Estado: Activo, Borrador o Pausado.",
              "El Precio del combo, con el precio de comparación tachado si corresponde.",
              "Los botones de Editar y Eliminar.",
            ],
          },
          {
            type: "p",
            text: "En celular cada combo se muestra como una tarjeta con la misma información. A diferencia del listado de productos, acá no hay selección en lote ni importación.",
          },
        ],
      },
      {
        heading: "Cómo buscar y filtrar",
        blocks: [
          {
            type: "ul",
            items: [
              "Buscar combo por nombre: escribí y la búsqueda se aplica sola después de un instante.",
              "Estado: Todos los estados, Activo, Borrador o Pausado.",
            ],
          },
          {
            type: "p",
            text: "Si no hay combos que coincidan con la búsqueda o el filtro aplicado, aparece el mensaje «No se encontraron combos con esos filtros.». Si todavía no creaste ningún combo, aparece una invitación a crear el primero.",
          },
        ],
      },
      {
        heading: "Editar o eliminar un combo",
        blocks: [
          {
            type: "ol",
            items: [
              "Tocá el lápiz de la fila para ir a la pantalla de edición de ese combo.",
              "Tocá el tacho para eliminarlo: te pide confirmación («¿Eliminar?») con botones Sí/No antes de borrarlo.",
              "La eliminación no se puede deshacer.",
            ],
          },
        ],
      },
      {
        heading: "Tips",
        blocks: [
          {
            type: "ul",
            items: [
              "El Stock disponible de un combo no se edita acá: depende del stock de los productos que lo componen, y se recalcula solo. Para cambiarlo, ajustá el stock de esos productos o las cantidades del combo desde la pantalla de edición.",
              "Podés cambiar cuántos combos se muestran por página con el selector al pie de la tabla.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/combos/new": {
    title: "Nuevo combo",
    summary:
      "Formulario para armar un combo o promoción nuevo combinando productos que ya existen en tu tienda, con precio propio, imágenes y cálculo automático del ahorro para el cliente.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "El formulario tiene los datos generales del combo a la izquierda, el buscador de productos para armarlo debajo, y a la derecha la carga de imágenes y (una vez que agregaste productos) un resumen de precio. Arriba tenés Cancelar, Guardar borrador y Publicar combo.",
          },
        ],
      },
      {
        heading: "Datos generales del combo",
        blocks: [
          {
            type: "ul",
            items: [
              "Nombre del combo (obligatorio, hasta 150 caracteres).",
              "Categoría: opcional, elegible entre todas las categorías de la tienda.",
              "Descripción corta (hasta 160 caracteres) y Descripción completa (hasta 3000 caracteres).",
              "Combo destacado: un interruptor para resaltarlo con una estrella en los listados.",
            ],
          },
        ],
      },
      {
        heading: "Cómo armar el combo con productos existentes",
        blocks: [
          {
            type: "p",
            text: "La sección «Productos del combo» es un buscador: escribí el nombre de un producto ya cargado en la tienda para encontrarlo y agregarlo.",
          },
          {
            type: "ol",
            items: [
              "Escribí en el buscador el nombre del producto que querés incluir.",
              "Tocá «+ Agregar» sobre el resultado que quieras sumar al combo.",
              "Una vez agregado, usá los botones − y + (o escribí el número directamente) para definir cuántas unidades de ese producto incluye el combo.",
              "Repetí el proceso hasta agregar todos los productos que formen el combo. Un combo necesita al menos 2 productos distintos — con uno solo no se puede guardar.",
              "Para sacar un producto del combo, tocá la cruz de su fila.",
            ],
          },
          {
            type: "p",
            text: "Por cada producto agregado se muestra su precio y el stock disponible. Con 2 o más productos agregados, el sistema calcula cuántos combos se pueden vender hoy con el stock actual (el mínimo entre stock disponible dividido cantidad, de todos los productos incluidos), y lo muestra en un aviso verde (si hay stock) o rojo (si no alcanza).",
          },
        ],
      },
      {
        heading: "Precio del combo y ahorro para el cliente",
        blocks: [
          {
            type: "ul",
            items: [
              "Precio del combo: el precio final que va a pagar el cliente (obligatorio, mayor a 0).",
              "Precio de comparación (tachado): opcional, para mostrar un precio «de lista» tachado junto al precio del combo.",
              "En ambos campos, si la suma de los productos agregados da un valor distinto al que escribiste, aparece un atajo «Sugerido: $X (suma de los productos) · usar» para completarlo con un clic.",
              "Una vez que agregaste productos, aparece la tarjeta «Resumen de precio» con la suma de los productos sueltos, el precio del combo, y el Ahorro del cliente (en verde si el combo sale más barato que comprar todo por separado, en rojo si sale más caro).",
            ],
          },
        ],
      },
      {
        heading: "Imágenes del combo",
        blocks: [
          {
            type: "ul",
            items: [
              "Arrastrá imágenes al recuadro punteado, o hacé clic para elegirlas. Mientras el combo todavía no se guardó, las imágenes quedan pendientes y se suben recién al guardar.",
              "Tamaño máximo 20MB por imagen; se redimensionan automáticamente.",
              "Podés quitar una imagen pendiente con la cruz de su miniatura antes de guardar.",
            ],
          },
        ],
      },
      {
        heading: "Cómo guardar o publicar",
        blocks: [
          {
            type: "ol",
            items: [
              "Completá el nombre, el precio y agregá al menos 2 productos al combo.",
              "Tocá «Guardar borrador» para crearlo sin que se vea todavía en la tienda.",
              "Tocá «Publicar combo» para crearlo y dejarlo activo (visible en la tienda) directamente.",
              "Al guardar se suben las imágenes pendientes y te lleva de vuelta al listado de combos.",
            ],
          },
        ],
      },
      {
        heading: "Errores comunes y validaciones",
        blocks: [
          {
            type: "ul",
            items: [
              "«El nombre del combo es obligatorio»: si dejás el nombre vacío.",
              "«El precio del combo debe ser mayor a 0»: si no cargaste un precio válido.",
              "«Un combo debe incluir al menos 2 productos»: si agregaste uno solo o ninguno.",
              "Si falla el guardado aparece «No se pudo guardar el combo»; podés corregir y volver a intentar.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/combos/:productId/edit": {
    title: "Editar combo",
    summary:
      "Pantalla para modificar un combo ya creado: cambiar sus productos y cantidades, ajustar precio e imágenes, y guardarlo como borrador o publicado.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "Es el mismo formulario que «Nuevo combo», pero cargado con los datos del combo existente (mientras se cargan ves el mensaje «Cargando combo…»). Arriba tenés Cancelar, Guardar borrador y Publicar combo.",
          },
        ],
      },
      {
        heading: "Modificar los datos del combo",
        blocks: [
          {
            type: "ul",
            items: [
              "Podés cambiar el Nombre, la Categoría, la Descripción corta y completa, y el interruptor de Combo destacado igual que al crearlo.",
              "Los cambios no se guardan solos: hace falta tocar «Guardar borrador» o «Publicar combo» para que se apliquen.",
            ],
          },
        ],
      },
      {
        heading: "Agregar, quitar o cambiar cantidades de productos",
        blocks: [
          {
            type: "ol",
            items: [
              "Usá el buscador «Productos del combo» para encontrar y agregar productos nuevos al combo, igual que al crearlo.",
              "Para quitar un producto ya incluido, tocá la cruz de su fila.",
              "Para cambiar cuántas unidades de un producto incluye el combo, usá los botones − y + o escribí el número directamente.",
              "El combo necesita mantener al menos 2 productos distintos — si te quedás con uno solo, no vas a poder guardar hasta agregar otro.",
            ],
          },
          {
            type: "p",
            text: "El aviso de cuántos combos se pueden vender hoy (según el stock de los productos incluidos) se recalcula automáticamente cada vez que cambiás productos o cantidades.",
          },
        ],
      },
      {
        heading: "Precio y ahorro del cliente",
        blocks: [
          {
            type: "ul",
            items: [
              "Precio del combo y Precio de comparación (tachado) se editan igual que al crear el combo, con el mismo atajo «Sugerido» basado en la suma de los productos.",
              "La tarjeta «Resumen de precio» se actualiza en vivo con la suma de productos sueltos, el precio del combo y el ahorro del cliente (verde si conviene, rojo si no).",
            ],
          },
        ],
      },
      {
        heading: "Imágenes del combo",
        blocks: [
          {
            type: "ul",
            items: [
              "A diferencia de «Nuevo combo», acá las imágenes que arrastrás o seleccionás se suben al instante (el combo ya existe).",
              "Podés eliminar una imagen ya guardada con la cruz de su miniatura; se quita apenas la tocás.",
              "Tamaño máximo 20MB por imagen.",
            ],
          },
        ],
      },
      {
        heading: "Guardar los cambios",
        blocks: [
          {
            type: "ol",
            items: [
              "Tocá «Guardar borrador» para pasar el combo a estado Borrador (no visible en la tienda).",
              "Tocá «Publicar combo» para dejarlo activo (visible en la tienda).",
              "Tocá «Cancelar» para volver al listado de combos sin guardar los cambios.",
            ],
          },
        ],
      },
      {
        heading: "Tips y errores comunes",
        blocks: [
          {
            type: "ul",
            items: [
              "Si el combo tiene menos de 2 productos al guardar, el sistema avisa «Un combo debe incluir al menos 2 productos» y no deja continuar.",
              "Si el precio quedó vacío o en 0, avisa «El precio del combo debe ser mayor a 0».",
              "Si falla la subida de alguna imagen, el aviso indica el nombre del archivo; el resto de la operación continúa igual.",
              "Si falla el guardado general, aparece «No se pudo guardar el combo» y podés corregir y reintentar sin perder lo que ya escribiste.",
            ],
          },
        ],
      },
    ],
  },
};
