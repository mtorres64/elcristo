import type { HelpTopicMap } from "./types";

export const dashboardOrdersHelp: HelpTopicMap = {
  "/seller": {
    title: "Dashboard",
    summary:
      "La pantalla principal al entrar al panel: un resumen rápido de cómo viene la tienda hoy, con las ventas del día, pedidos pendientes, stock bajo, clientes nuevos y un gráfico de ventas de los últimos días.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "Arriba de todo te saluda con tu nombre y un resumen de cómo viene la tienda hoy. Debajo hay cuatro tarjetas con los números más importantes del día:",
          },
          {
            type: "ul",
            items: [
              "Ventas de hoy: el total vendido hoy, con el porcentaje de variación respecto a ayer (verde si subió, naranja si bajó) y un mini gráfico de las ventas de los últimos 14 días.",
              "Pedidos pendientes: cuántos pedidos están pagados y esperando que los prepares. Si hacés clic, te lleva directo a la lista de Pedidos.",
              "Stock bajo: cuántos productos tenés con poco stock. Te lleva a la sección de Productos si hacés clic.",
              "Clientes nuevos: cuántos compradores se registraron en los últimos 30 días. Te lleva a la sección de Clientes.",
            ],
          },
          {
            type: "p",
            text: "Mientras se cargan los datos vas a ver un guion («—») en lugar de los números; es normal, esperá unos segundos.",
          },
        ],
      },
      {
        heading: "Accesos rápidos",
        blocks: [
          {
            type: "p",
            text: "Debajo de las tarjetas hay una fila de accesos directos a las tareas más comunes:",
          },
          {
            type: "ul",
            items: [
              "Nuevo producto: te lleva al formulario para cargar una planta nueva al catálogo.",
              "Pedidos: te lleva a la lista de pedidos. Muestra un numerito con la cantidad de pedidos pendientes.",
              "Clientes: te lleva al listado de compradores de la tienda.",
              "Categorías: te lleva a la pantalla donde organizás el catálogo por categorías.",
              "Descuentos: te lleva a la pantalla para crear una promoción.",
              "Reportes: te lleva a la pantalla para exportar datos de ventas.",
            ],
          },
        ],
      },
      {
        heading: "Cómo leer el gráfico de ventas",
        blocks: [
          {
            type: "p",
            text: "En la parte de abajo de la pantalla tenés el detalle de ventas por día. Arriba del gráfico aparece el total vendido y el promedio por día del período que estés mirando.",
          },
          {
            type: "ol",
            items: [
              "Elegí el período con los botones «30 días» o «60 días».",
              "Elegí cómo ver los datos con los dos íconos de la derecha: el de barras muestra un gráfico, el de cuadrícula muestra una tabla.",
              "En el gráfico de barras, pasá el mouse (o el foco con el teclado) sobre cualquier barra para ver la fecha exacta, el total vendido ese día y la cantidad de pedidos.",
              "La barra de hoy aparece marcada con la etiqueta «Hoy» arriba.",
            ],
          },
          {
            type: "p",
            text: "Si elegís la vista de tabla, vas a ver una lista con fecha, cantidad de pedidos y total vendido, ordenada del día más reciente al más viejo. Podés scrollear la tabla si hay muchos días.",
          },
        ],
      },
      {
        heading: "Tips",
        blocks: [
          {
            type: "ul",
            items: [
              "Si el dashboard tarda en mostrar los números, revisá tu conexión: los datos se traen todos juntos al entrar a la pantalla.",
              "El color naranja en la variación de «Ventas de hoy» no significa un error, solo indica que vendiste menos que ayer.",
              "Usá las tarjetas de «Pedidos pendientes» y «Stock bajo» como tu lista de tareas del día: son las dos cosas que más urgen atender.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/orders": {
    title: "Pedidos",
    summary:
      "El listado completo de pedidos de la tienda, tanto los hechos por la web como las ventas registradas en el local. Desde aquí buscás, filtrás, abrís el detalle de cada pedido y registrás ventas presenciales nuevas.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "La tabla de pedidos muestra, para cada uno: número de pedido, cliente (con su email, y una etiqueta «Venta en el local» si fue una venta de mostrador), cantidad de ítems, total, estado y fecha. Al lado de cada fila hay un enlace «Ver» para abrir el detalle completo.",
          },
          {
            type: "p",
            text: "En celular, cada pedido se muestra como una tarjeta que podés desplegar tocándola, para ver ítems, fecha y un botón «Ver pedido».",
          },
          {
            type: "p",
            text: "Arriba del todo, junto al título, se muestra cuántos pedidos hay en total (o «Cargando...» mientras se traen los datos).",
          },
        ],
      },
      {
        heading: "Qué significa cada estado",
        blocks: [
          {
            type: "ul",
            items: [
              "Pendiente de pago: el cliente generó el pedido pero todavía no se acreditó el pago.",
              "Pagado: el pago ya se acreditó y el pedido está esperando que lo prepares.",
              "Preparando: estás armando el pedido para despacharlo o para que lo retiren.",
              "Enviado: el pedido ya salió hacia el cliente.",
              "Entregado: el pedido ya llegó a manos del cliente.",
              "Cancelado: el pedido se anuló.",
              "Reembolsado: el pedido se canceló y además se le devolvió el dinero al cliente.",
            ],
          },
        ],
      },
      {
        heading: "Cómo buscar y filtrar pedidos",
        blocks: [
          {
            type: "ol",
            items: [
              "Escribí en el buscador el número de pedido o el nombre del cliente; los resultados se actualizan solos después de un instante de dejar de tipear.",
              "Usá el selector «Todos los estados» para quedarte solo con los pedidos de un estado puntual.",
              "Usá el selector de orden para ver primero los más recientes o los más antiguos.",
              "En celular, los filtros están escondidos detrás del botón «Filtros» (arriba de la tabla); un numerito indica cuántos filtros tenés activos.",
              "Si aplicaste algún filtro, va a aparecer un enlace «Limpiar filtros» para volver a ver todos los pedidos.",
            ],
          },
          {
            type: "p",
            text: "Si no hay pedidos que coincidan con la búsqueda o los filtros, vas a ver el mensaje «No se encontraron pedidos con esos filtros.» junto con el enlace para limpiarlos. Si todavía no se registró ningún pedido, el mensaje es «Todavía no hay pedidos.».",
          },
        ],
      },
      {
        heading: "Cómo registrar una venta del local (POS)",
        blocks: [
          {
            type: "p",
            text: "El botón «Nueva venta», arriba a la derecha, abre un formulario para registrar una venta hecha en el local (el cobro se hace en persona, no por la app).",
          },
          {
            type: "ol",
            items: [
              "Buscá los productos con el buscador y agregalos a la venta; podés editar la cantidad y el precio de cada línea, o quitar una línea con la «×».",
              "Si corresponde, elegí un descuento: monto fijo o porcentaje.",
              "Agregá una nota opcional si hace falta aclarar algo del pedido.",
              "Elegí el cliente: «Cliente registrado» (buscalo por nombre o email) o «Cliente ocasional» (completá nombre y teléfono).",
              "Elegí la entrega: «Retiro en el local» o «Envío» (si elegís envío, seleccioná la zona y completá o confirmá la dirección).",
              "Completá el pago: podés dividirlo en varios métodos (efectivo, débito, crédito, transferencia u otro); la suma de los montos tiene que coincidir exactamente con el total de la venta.",
              "Hacé clic en «Confirmar venta». El botón queda deshabilitado hasta que todos los datos obligatorios estén completos y el pago cuadre con el total.",
            ],
          },
          {
            type: "p",
            text: "Cuando la venta se registra correctamente aparece un aviso con el número de pedido generado, se cierra el formulario y la lista se actualiza sola con la nueva venta.",
          },
        ],
      },
      {
        heading: "Paginación y cantidad de resultados",
        blocks: [
          {
            type: "p",
            text: "Al pie de la tabla podés moverte entre páginas con los números o las flechas, y elegir cuántos pedidos ver por página (10, 20, 50 o 100) con el selector «Mostrar ... por página». Esa preferencia se guarda en tu navegador y se mantiene la próxima vez que entres.",
          },
        ],
      },
      {
        heading: "Errores comunes y tips",
        blocks: [
          {
            type: "ul",
            items: [
              "Si la tabla no carga, vas a ver el mensaje «No se pudieron cargar los pedidos. Intentá de nuevo.»: revisá tu conexión y volvé a entrar a la pantalla.",
              "En «Nueva venta», si el botón «Confirmar venta» no se activa, revisá que el pago sume exactamente el total y que completaste cliente y entrega.",
              "Cambiar cualquier filtro o la cantidad de resultados por página te vuelve automáticamente a la primera página.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/orders/:orderId": {
    title: "Detalle del pedido",
    summary:
      "La ficha completa de un pedido puntual: qué compró el cliente, cómo y dónde se entrega, cómo se pagó, y desde aquí también cambiás el estado del pedido y manejás cancelaciones con devolución de dinero.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "Arriba se muestra el número de pedido, una etiqueta con el canal (Web o Venta en el local) y la fecha y hora en que se creó. El botón «Imprimir recibo» abre, en una pestaña nueva, el recibo listo para imprimir o guardar como PDF.",
          },
          {
            type: "ul",
            items: [
              "Productos: la lista de ítems del pedido con imagen (o un ícono si no tiene foto), título, cantidad y subtotal de cada línea, y al pie el Subtotal, el Envío (o «Gratis» si no se cobró), el Descuento si lo hubo, y el Total.",
              "Entrega: la dirección completa del cliente (calle, localidad, provincia, código postal, piso/depto si corresponde) con un mapa y un enlace a Google Maps cuando el pedido tiene ubicación guardada; si el pedido es para retirar en el local, directamente dice «Retira en el local».",
              "Pago: para ventas del local con pago dividido, se listan los métodos usados (efectivo, débito, crédito, transferencia, otro) con sus montos y cuotas si corresponde. Para pedidos online se muestra la marca y los últimos 4 dígitos de la tarjeta cuando están disponibles, el estado del pago y el proveedor.",
              "Notas del comprador: si el cliente dejó alguna aclaración al hacer el pedido, aparece en esta tarjeta.",
              "Comprador: nombre y email del cliente, o «Cliente ocasional» con el teléfono si la venta se hizo sin cuenta.",
            ],
          },
        ],
      },
      {
        heading: "Cómo cambiar el estado de un pedido",
        blocks: [
          {
            type: "ol",
            items: [
              "En la tarjeta «Estado del pedido» (columna derecha), elegí el nuevo estado en el selector «Cambiar a».",
              "Si corresponde, completá el «Nº de seguimiento» del envío (es opcional).",
              "Hacé clic en «Actualizar pedido». El botón muestra «Actualizando...» mientras se procesa.",
              "Si todo salió bien vas a ver un aviso de «Pedido actualizado».",
            ],
          },
          {
            type: "p",
            text: "Si el cambio falla (por ejemplo, por un problema de conexión o una validación del servidor), va a aparecer un aviso con el motivo del error.",
          },
        ],
      },
      {
        heading: "Cancelar un pedido pagado con tarjeta (devolución de dinero)",
        blocks: [
          {
            type: "p",
            text: "Si el pedido ya está pagado con tarjeta a través de Getnet y lo pasás a «Cancelado», el sistema no cancela directo: te muestra un cuadro de confirmación porque esa acción dispara una devolución real del dinero al cliente.",
          },
          {
            type: "ol",
            items: [
              "Al elegir «Cancelado» y hacer clic en «Actualizar pedido», se abre el cuadro de confirmación explicando cuánto se va a devolver y a qué tarjeta.",
              "Hacé clic en «Cancelar y devolver» para confirmar, o en «Volver» para no hacer nada.",
              "Mientras se procesa vas a ver «Devolviendo...».",
              "Al terminar, el cuadro muestra el resultado de la devolución.",
            ],
          },
          {
            type: "ul",
            items: [
              "Devolución realizada: el dinero se devolvió sin problemas y el pedido queda como Reembolsado.",
              "Pedido cancelado: se canceló sin necesidad de devolver dinero (no se había cobrado nada realmente).",
              "Pedido cancelado sin devolución: el pedido se canceló pero, por algún motivo, no se devolvió el dinero automáticamente; revisá el mensaje para saber qué hacer.",
              "No se pudo devolver el pago: la devolución falló. El pedido queda en su estado anterior (no se cancela) y el stock no se repone. Podés usar el botón «Reintentar».",
              "Resultado de la devolución incierto: se perdió la conexión mientras se procesaba y no se sabe con certeza si la devolución se hizo. Recargá la página para revisar el estado real antes de reintentar.",
            ],
          },
          {
            type: "p",
            text: "Esta acción de cancelar y devolver no se puede deshacer, así que confirmala solo cuando estés seguro.",
          },
        ],
      },
      {
        heading: "Tips y errores comunes",
        blocks: [
          {
            type: "ul",
            items: [
              "Si cambiás el estado por error, podés volver a seleccionar el estado anterior y actualizar de nuevo (salvo que ya se haya disparado una devolución, que no se puede deshacer).",
              "El número de seguimiento es útil cuando pasás el pedido a «Enviado», pero no es obligatorio para poder actualizar el pedido.",
              "Si el pedido no tiene dirección de envío, es porque es para retirar en el local; no hace falta pedirle la dirección al cliente.",
              "Si la pantalla muestra «No se encontró el pedido.», es probable que el enlace esté roto o el pedido ya no exista: volvé al listado de Pedidos y buscalo de nuevo.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/orders/:orderId/receipt": {
    title: "Recibo del pedido",
    summary:
      "Una versión imprimible del pedido, pensada para entregarle un comprobante al cliente o guardarlo como PDF. Se abre en una pestaña aparte, sin el menú del panel.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "Es una página simple con el logo de Vivero El Cristo, los datos del pedido (número, fecha y hora, estado y canal), los datos del cliente, la dirección de entrega (o «Retira en el local»), el detalle de productos con cantidades y precios, los totales, la forma de pago y, si existen, las notas del pedido.",
          },
          {
            type: "p",
            text: "Arriba de todo hay dos accesos: «← Volver al pedido» para regresar al detalle, y el botón «Imprimir / Guardar como PDF».",
          },
        ],
      },
      {
        heading: "Cómo imprimir o guardar el recibo como PDF",
        blocks: [
          {
            type: "ol",
            items: [
              "Hacé clic en «Imprimir / Guardar como PDF».",
              "Se abre el cuadro de impresión del navegador.",
              "Si querés un PDF, elegí la opción «Guardar como PDF» (o similar, según tu navegador) en lugar de una impresora física.",
              "Si querés imprimirlo en papel, elegí la impresora correspondiente y confirmá.",
            ],
          },
          {
            type: "p",
            text: "Al imprimir o generar el PDF, los botones de navegación y el fondo de color desaparecen automáticamente: solo se imprime el comprobante en sí, con un diseño más limpio pensado para papel.",
          },
        ],
      },
      {
        heading: "Tips",
        blocks: [
          {
            type: "ul",
            items: [
              "Este recibo es el mismo para pedidos online y para ventas del local; en ventas del local vas a ver el o los métodos de pago usados.",
              "Si el pedido no tiene descuento o no tiene costo de envío, esas filas de totales simplemente no se muestran o aparecen como «Gratis».",
              "Si ves «No se encontró el pedido.», revisá que el enlace al recibo no esté roto o que el pedido no haya sido eliminado.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/alerts": {
    title: "Alertas",
    summary:
      "Un resumen de los dos avisos que necesitan tu atención: productos con poco stock y pedidos que todavía no se pagaron. Se accede también desde la campanita en la parte superior del panel.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "La pantalla se divide en dos columnas (una abajo de la otra en celular):",
          },
          {
            type: "ul",
            items: [
              "Stock bajo: productos a los que se les está acabando el stock. Cada fila muestra la foto del producto, su título, la categoría (si tiene) y una etiqueta con el stock restante.",
              "Pedidos pendientes de pago: pedidos que un cliente generó pero todavía no pagó. Cada fila muestra el número de pedido, el nombre del comprador, el total y la fecha.",
            ],
          },
          {
            type: "p",
            text: "Arriba del todo se indica cuántas alertas activas hay en total (la suma de productos con stock bajo más pedidos pendientes de pago).",
          },
        ],
      },
      {
        heading: "Qué significa cada etiqueta de stock",
        blocks: [
          {
            type: "ul",
            items: [
              "Etiqueta roja «0 en stock»: el producto está agotado.",
              "Etiqueta amarilla con un número: el producto tiene esa cantidad de unidades, por debajo del mínimo recomendado.",
            ],
          },
        ],
      },
      {
        heading: "Cómo actuar sobre una alerta",
        blocks: [
          {
            type: "ol",
            items: [
              "Para un producto con stock bajo, hacé clic en la fila para ir directo a la pantalla de edición de ese producto y actualizar su stock.",
              "Para un pedido pendiente de pago, hacé clic en la fila para ir al detalle de ese pedido y revisar o actualizar su estado.",
            ],
          },
          {
            type: "p",
            text: "Si alguna de las dos listas tiene más resultados de los que se muestran, vas a ver un texto «+N más» al pie de esa columna, indicando que hay más alertas de ese tipo de las que se listan en pantalla.",
          },
        ],
      },
      {
        heading: "Errores comunes y tips",
        blocks: [
          {
            type: "ul",
            items: [
              "Si no hay productos con stock bajo, vas a ver el mensaje «No hay productos con stock bajo.».",
              "Si no hay pedidos pendientes de pago, vas a ver el mensaje «No hay pedidos pendientes de pago.».",
              "Si la pantalla no puede cargar los datos, va a aparecer «No se pudieron cargar las alertas. Intentá de nuevo.»: revisá tu conexión y volvé a entrar.",
              "El número que aparece junto a la campanita en la parte superior del panel es el mismo total de alertas activas de esta pantalla.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/mailbox": {
    title: "Correos",
    summary:
      "La bandeja de entrada y enviados de la casilla de correo configurada en Integraciones, para leer y responder mensajes de clientes sin salir del panel.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "La pantalla se divide en dos paneles: a la izquierda la lista de correos, a la derecha el contenido del correo seleccionado. Arriba hay dos pestañas, «Recibidos» y «Enviados», para cambiar de carpeta.",
          },
          {
            type: "ul",
            items: [
              "En cada fila de la lista se ve el remitente (o el destinatario, si estás en «Enviados»), la fecha u hora, el asunto y un adelanto del contenido.",
              "Los correos no leídos se muestran en negrita con un punto al lado.",
              "La lista se actualiza sola cada minuto, así que los correos nuevos van a aparecer sin que tengas que recargar la página.",
            ],
          },
        ],
      },
      {
        heading: "Cómo leer un correo",
        blocks: [
          {
            type: "ol",
            items: [
              "Hacé clic en la fila del correo que querés leer.",
              "El contenido se muestra en el panel de la derecha, con el asunto, el remitente o destinatario, la fecha y el cuerpo del mensaje.",
              "Al abrirlo, el correo se marca automáticamente como leído.",
            ],
          },
          {
            type: "p",
            text: "En celular, al elegir un correo la lista se oculta y se muestra solo el contenido; usá el enlace «← Volver a la lista» para regresar.",
          },
        ],
      },
      {
        heading: "Cómo redactar un correo nuevo",
        blocks: [
          {
            type: "ol",
            items: [
              "Hacé clic en el botón «Redactar», arriba a la derecha.",
              "Completá el destinatario, el asunto y el mensaje.",
              "Hacé clic en «Enviar».",
            ],
          },
          {
            type: "p",
            text: "Si falta completar el destinatario, el asunto o el mensaje, no se envía y aparece un aviso pidiendo que completes esos campos. Si el envío falla, se muestra un aviso con el motivo. Si se envía bien, el formulario se cierra y la bandeja se actualiza sola.",
          },
        ],
      },
      {
        heading: "Ajustar el ancho de la lista",
        blocks: [
          {
            type: "p",
            text: "En pantallas grandes, podés arrastrar la línea divisoria entre la lista de correos y el panel de lectura para hacer una más ancha que la otra. Esa preferencia se guarda en tu navegador para la próxima vez que entres.",
          },
        ],
      },
      {
        heading: "Tips y errores comunes",
        blocks: [
          {
            type: "ul",
            items: [
              "Si todavía no llegó ni se envió ningún correo desde esta casilla, vas a ver el mensaje «No hay correos todavía.» en la carpeta correspondiente.",
              "Si la bandeja no carga, va a aparecer un aviso «No se pudo cargar la bandeja de entrada»: revisá tu conexión e intentá de nuevo.",
              "El correo que usa esta bandeja es el que esté configurado en la sección de Integraciones; si no ves los correos esperados, confirmá que esa configuración sea la correcta.",
              "El contenido de los correos recibidos se muestra de forma segura: si un correo trae HTML, se filtra automáticamente para que no pueda ejecutar scripts ni mostrar contenido embebido.",
            ],
          },
        ],
      },
    ],
  },
};
