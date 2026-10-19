import type { HelpTopicMap } from "./types";

export const otherHelp: HelpTopicMap = {
  "/seller/content": {
    title: "Contenido",
    summary:
      "Administrá los textos, fotos y proyectos de las páginas institucionales del sitio: Sobre Nosotros, Inspiración, Diseño & Paisajismo, Testimonios y las páginas de Información del pie de página.",
    sections: [
      {
        heading: "Qué administra esta pantalla",
        blocks: [
          {
            type: "p",
            text: "Arriba de todo hay una botonera con todas las secciones de contenido disponibles. Al tocar un botón se abre el editor de esa sección, sin cambiar de pantalla. Ojo: el carrusel de imágenes grandes que aparece en la portada del home (el hero) NO se edita acá, vive en «Configuración» (/seller/settings) porque es apariencia de la tienda, no una página de contenido.",
          },
          {
            type: "ul",
            items: [
              "Sobre Nosotros — historia y fotos de la sección /nosotros",
              "Inspiración — proyectos de paisajismo que se muestran en /inspiracion",
              "Diseño & Paisajismo — trabajos realizados que se muestran en /diseno",
              "Testimonios — reseñas de clientes que aparecen en un carrusel del home",
              "Envíos — página de texto de /envios",
              "Medios de pago — página de texto de /medios-de-pago",
              "Cambios y devoluciones — página de texto de /cambios-y-devoluciones",
              "Preguntas frecuentes — página de texto de /preguntas-frecuentes",
              "Términos y condiciones — página de texto de /terminos-y-condiciones",
            ],
          },
        ],
      },
      {
        heading: "Cómo editar la página «Sobre Nosotros»",
        blocks: [
          {
            type: "p",
            text: "Esta página tiene cuatro bloques: Portada, Descripción, Historia y Galería de fotos.",
          },
          {
            type: "ol",
            items: [
              "En «Portada» subí la imagen de fondo (hacé clic en el recuadro punteado o arrastrá una foto) y escribí el título grande que aparece sobre ella.",
              "En «Descripción» completá el título de la sección y el texto introductorio.",
              "En «Historia» armá los capítulos del relato: cada capítulo tiene una foto, una etiqueta corta, un título y un texto. Se muestran en el sitio en el orden de la lista, alternando foto y texto.",
              "Usá «+ Agregar capítulo» para sumar uno nuevo, las flechas para subirlo o bajarlo de orden, y el ícono de tacho para eliminarlo.",
              "En «Galería de fotos» agregá imágenes sueltas con el tile «+ Agregar foto»; en el sitio aparecen progresivamente a medida que el visitante hace scroll. Podés reordenarlas con las flechas o quitarlas con la cruz que aparece al pasar el mouse.",
              "Tocá «Guardar cambios» para que los cambios se publiquen en /nosotros.",
            ],
          },
        ],
      },
      {
        heading: "Cómo editar «Inspiración» y «Diseño & Paisajismo»",
        blocks: [
          {
            type: "p",
            text: "Estas dos páginas funcionan igual entre sí: una portada, una descripción y una lista de proyectos (en «Diseño & Paisajismo» se llaman «Trabajos realizados»). Cada proyecto se muestra a ancho completo en el sitio con su foto y su ficha.",
          },
          {
            type: "ol",
            items: [
              "Cargá la imagen y el título de la portada.",
              "Completá el título y el texto de la sección de descripción.",
              "Para cada proyecto o trabajo, subí una foto panorámica y completá título, ubicación o rubro, y una descripción breve.",
              "Usá «+ Agregar proyecto» (o «+ Agregar trabajo») para sumar uno nuevo, las flechas para reordenarlos y el tacho para eliminarlos. El orden de la lista es el orden en que se muestran en el sitio.",
              "Tocá «Guardar cambios» para publicar.",
            ],
          },
        ],
      },
      {
        heading: "Cómo editar los Testimonios",
        blocks: [
          {
            type: "p",
            text: "Acá se administran las reseñas de clientes que se muestran en el carrusel «Lo que dicen nuestros clientes» del inicio. Si no hay ningún testimonio cargado, esa sección directamente no aparece en el home.",
          },
          {
            type: "ol",
            items: [
              "Tocá «+ Agregar testimonio» para crear una reseña nueva.",
              "Completá el texto del testimonio, el nombre de la persona y su ubicación (por ejemplo «María B.» y «Córdoba»).",
              "La foto es opcional; se muestra en un círculo. Subila haciendo clic en el recuadro punteado o arrastrando una imagen.",
              "Reordená los testimonios con las flechas de subir/bajar, o eliminá uno con el ícono de tacho.",
              "Tocá «Guardar cambios». El sistema no deja guardar si falta el nombre o el texto de algún testimonio: avisa cuál es el número de la reseña incompleta.",
            ],
          },
        ],
      },
      {
        heading: "Cómo editar las páginas de Información",
        blocks: [
          {
            type: "p",
            text: "Envíos, Medios de pago, Cambios y devoluciones, Preguntas frecuentes y Términos y condiciones son páginas de solo texto del pie de página. Las cinco se editan con el mismo formato.",
          },
          {
            type: "ol",
            items: [
              "Editá el título de la página: es lo que se muestra como encabezado y en las migas de pan (breadcrumb) de esa sección del sitio.",
              "Agregá secciones de contenido con «+ Agregar sección»: cada una tiene un subtítulo y un párrafo de texto. Los saltos de línea que escribas se respetan en el sitio.",
              "Reordená las secciones con las flechas o eliminalas con el tacho. Se muestran en ese mismo orden en la página pública.",
              "Tocá «Guardar cambios» para publicar.",
            ],
          },
        ],
      },
      {
        heading: "Guardar cambios y avisos",
        blocks: [
          {
            type: "p",
            text: "Cada sección (Sobre Nosotros, Inspiración, Diseño & Paisajismo, Testimonios y cada página de Información) se guarda por separado: cambiar una no afecta a las demás hasta que la guardes. En computadora el botón «Guardar cambios» aparece arriba a la derecha del bloque; en el celular aparece fijo (sticky) justo debajo de la barra superior para que siempre esté a mano. Mientras se está guardando, el botón muestra «Guardando…» y queda deshabilitado. Al terminar aparece un aviso de confirmación o de error en la esquina de la pantalla.",
          },
        ],
      },
      {
        heading: "Tips y errores comunes",
        blocks: [
          {
            type: "ul",
            items: [
              "Si buscás el carrusel grande de fotos del home, no está acá: se edita en «Configuración» (/seller/settings).",
              "Para subir una foto podés hacer clic en el recuadro punteado o directamente arrastrarla desde el explorador de archivos.",
              "Si ves «Cargando página…» y no cambia, revisá tu conexión; si falla la carga aparece un aviso de error y la sección queda vacía.",
              "En Testimonios, guardar falla si falta el nombre o el texto de alguna reseña: completá esos campos antes de reintentar.",
              "El orden en que acomodás capítulos, proyectos, fotos, testimonios o secciones con las flechas es exactamente el orden en que se van a ver en el sitio público.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/reports": {
    title: "Reportes",
    summary:
      "Mirá de un vistazo las ventas, las compras a proveedores y el margen de ganancia de tu vivero en el período que elijas, con gráficos, tablas por producto y exportación a CSV.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "Arriba está el selector de período y el botón «Exportar CSV». Debajo hay tres bloques: «Ventas», «Compras» y «Márgenes», cada uno con sus números clave, un gráfico de barras diario y, en Ventas y Márgenes, una tabla con el detalle.",
          },
        ],
      },
      {
        heading: "Cómo elegir el período a revisar",
        blocks: [
          {
            type: "ol",
            items: [
              "Elegí uno de los botones de rango: «7 días», «30 días», «90 días» o «Este mes».",
              "«Este mes» muestra desde el día 1 del mes actual hasta hoy; los demás muestran los últimos N días incluyendo el día de hoy.",
              "Al cambiar el rango, todos los bloques (Ventas, Compras, Márgenes) se recalculan automáticamente para ese período. Por defecto la pantalla abre mostrando los últimos 30 días.",
              "El rango de fechas elegido se muestra como subtítulo, junto al título «Reportes».",
            ],
          },
        ],
      },
      {
        heading: "Qué muestra el bloque Ventas",
        blocks: [
          {
            type: "p",
            text: "Incluye los pedidos pagados, en preparación, enviados y entregados del período.",
          },
          {
            type: "ul",
            items: [
              "Ingresos: total facturado en el período.",
              "Pedidos: cantidad de pedidos.",
              "Unidades vendidas: cantidad total de productos vendidos.",
              "Ticket promedio: ingresos divididos por cantidad de pedidos.",
              "Gráfico de barras con los ingresos de cada día del período; al pasar el mouse por una barra se muestra el monto exacto de ese día.",
              "Tabla «por estado»: cuántos pedidos y qué monto corresponde a cada estado (Pago pendiente, Pagado, En preparación, Enviado, Entregado, Cancelado, Reembolsado).",
            ],
          },
        ],
      },
      {
        heading: "Qué muestra el bloque Compras",
        blocks: [
          {
            type: "p",
            text: "Refleja la reposición de stock que le registraste a tus proveedores en el período.",
          },
          {
            type: "ul",
            items: [
              "Costo total: lo que se pagó en compras a proveedores.",
              "Compras: cantidad de compras registradas.",
              "Unidades compradas: cantidad total de unidades repuestas.",
              "Gráfico de barras con el costo de compras de cada día del período.",
            ],
          },
        ],
      },
      {
        heading: "Qué muestra el bloque Márgenes",
        blocks: [
          {
            type: "p",
            text: "Calcula la ganancia bruta estimada usando el costo actual cargado en la ficha de cada producto (no el costo histórico al momento de la venta).",
          },
          {
            type: "ul",
            items: [
              "Ingresos: lo mismo que en el bloque Ventas.",
              "Costo de ventas: costo estimado de los productos vendidos.",
              "Ganancia bruta: ingresos menos costo de ventas.",
              "Margen: porcentaje de ganancia sobre los ingresos.",
              "Tabla por producto: unidades vendidas, ingresos, costo, ganancia y margen de cada producto; el margen se muestra en rojo si es negativo y en verde si es positivo.",
            ],
          },
          {
            type: "p",
            text: "Si hay líneas de venta de productos sin costo cargado, aparece un aviso en color ámbar avisando cuántas son esas líneas: no se descuentan del margen, así que el cálculo queda subestimado para esos casos. Para afinarlo, cargá el costo en la ficha de cada producto.",
          },
        ],
      },
      {
        heading: "Cómo exportar el reporte a CSV",
        blocks: [
          {
            type: "ol",
            items: [
              "Elegí primero el período que querés exportar con los botones de rango.",
              "Tocá «Exportar CSV» (está deshabilitado mientras se están cargando los datos).",
              "Se descarga un archivo llamado reporte_<fecha desde>_<fecha hasta>.csv con una fila por día: Fecha, Ventas, Pedidos, Unidades vendidas y Compras (costo).",
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
              "Si no hubo movimientos en el período elegido, el gráfico correspondiente muestra «Sin movimientos en este período.» en vez de barras vacías.",
              "Si no hubo ventas en el período, la tabla de márgenes por producto muestra «Sin ventas en este período.».",
              "Si los datos no cargan, aparece el mensaje «No se pudieron cargar los reportes. Intentá de nuevo.»: revisá tu conexión y volvé a elegir el período.",
              "El margen usa el costo actual del producto, así que si cambiaste el costo de un producto hace poco, el margen de ventas viejas puede no reflejar el costo real que tenías en ese momento.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/integrations": {
    title: "Integraciones",
    summary:
      "Conectá servicios externos a tu tienda: la pasarela de pagos Getnet para cobrar con tarjeta en el checkout, y el correo (SMTP/IMAP) para enviar avisos y leer los emails que te llegan.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "Arriba hay dos botones de sección: «Getnet» y «Correo». Cada una tiene su propio formulario y su propio botón «Guardar cambios», son independientes entre sí. En Getnet, el botón de guardar aparece arriba a la derecha en computadora y fijo (sticky) debajo de la barra superior en el celular.",
          },
        ],
      },
      {
        heading: "Cómo configurar Getnet (cobros con tarjeta)",
        blocks: [
          {
            type: "p",
            text: "Getnet permite tokenizar la tarjeta directo en el checkout, sin que el cliente salga de la tienda.",
          },
          {
            type: "ol",
            items: [
              "Activá la integración con el interruptor «Activa / Inactiva» de arriba a la derecha de la tarjeta.",
              "Elegí la pestaña del ambiente que vas a configurar: «Sandbox (pruebas)» o «Producción». Cada ambiente guarda sus propias credenciales, son independientes.",
              "Completá Seller ID (el uuid del comercio en Getnet) y Client ID.",
              "Completá el Client secret. Una vez guardado, el campo se oculta y muestra «•••••••• configurado»; tocá «Cambiar» si necesitás reemplazarlo.",
              "Completá el usuario y la contraseña del webhook. Tienen que ser exactamente los mismos que cargues en el Getnet Portal, en Productos Digitales > Checkout > Notificaciones. La contraseña también se oculta una vez guardada y se cambia con el botón «Cambiar».",
              "Tocá «Guardar cambios». Si falta algún dato obligatorio del ambiente que estás activando, aparece un aviso indicando qué falta completar.",
            ],
          },
        ],
      },
      {
        heading: "Ambientes Sandbox y Producción",
        blocks: [
          {
            type: "p",
            text: "Sandbox es el ambiente de pruebas (no cobra de verdad); Producción es el que efectivamente cobra a los clientes. El checkout de la tienda siempre cobra usando el ambiente marcado como activo, sin importar qué pestaña estés mirando en esta pantalla.",
          },
          {
            type: "ul",
            items: [
              "La pestaña que está en uso tiene una etiqueta «en uso» junto a su nombre.",
              "Si estás viendo la pestaña que no está activa, aparece el botón «Usar Sandbox/Producción para cobrar en el checkout» para cambiar cuál se usa.",
              "Cuando la integración está activa, se muestra un aviso verde confirmando con qué ambiente está cobrando el checkout en este momento; si es Producción, aclara que los pedidos se cobran de verdad.",
              "Si cambiás el ambiente activo pero todavía no guardaste, aparece un aviso amarillo recordando que el cambio no se aplicó hasta tocar «Guardar cambios».",
            ],
          },
        ],
      },
      {
        heading: "Cómo probar la conexión de Getnet",
        blocks: [
          {
            type: "ol",
            items: [
              "Pará en la pestaña del ambiente que querés probar (Sandbox o Producción).",
              "Tocá «Probar conexión (Sandbox)» o «Probar conexión (Producción)», según corresponda.",
              "El resultado aparece como una etiqueta: un tilde verde si la conexión funcionó, o una cruz roja con el motivo del error si falló.",
            ],
          },
          {
            type: "p",
            text: "La prueba usa las credenciales ya guardadas, así que si acabás de cambiar algo, guardá los cambios antes de probar.",
          },
        ],
      },
      {
        heading: "Cómo configurar el Correo (envío de emails)",
        blocks: [
          {
            type: "p",
            text: "Esta parte se usa para la confirmación de cuenta y otros avisos automáticos de la tienda. Si está inactiva, esos correos no se envían de verdad: solo quedan registrados en el log del servidor.",
          },
          {
            type: "ol",
            items: [
              "Activá el envío con el interruptor «Activa / Inactiva» de la tarjeta «Correo — Envío de emails (SMTP)».",
              "Completá el host SMTP (por ejemplo smtp.gmail.com) y el puerto (587 por defecto).",
              "Completá el usuario (la casilla de correo) y la contraseña (o app password). La contraseña se oculta una vez guardada; tocá «Cambiar» para reemplazarla.",
              "Completá el remitente (From), el nombre y dirección que van a ver los clientes al recibir el correo.",
              "Dejá tildado «Usar STARTTLS» si usás el puerto 587 (es lo recomendado).",
              "Tocá «Guardar cambios».",
            ],
          },
        ],
      },
      {
        heading: "Lectura de correos (IMAP)",
        blocks: [
          {
            type: "p",
            text: "Esta sección, dentro de la misma tarjeta de Correo, permite que la sección «Correos» del panel muestre los mensajes que lleguen a esa casilla. Usa el mismo usuario y contraseña configurados en la parte de SMTP de arriba.",
          },
          {
            type: "ol",
            items: [
              "Activá la lectura con el interruptor «Activa / Inactiva» de «Lectura de correos (IMAP)».",
              "Completá el host IMAP (por ejemplo imap.gmail.com) y el puerto (993 por defecto).",
              "Dejá tildado «Usar SSL/TLS» si usás el puerto 993 (es lo recomendado).",
              "Guardá los cambios antes de probar: el botón «Probar conexión IMAP» usa la configuración ya guardada.",
              "Tocá «Probar conexión IMAP» para verificar; el resultado aparece como tilde verde o cruz roja con el motivo.",
            ],
          },
          {
            type: "p",
            text: "Una vez activa, la casilla se sincroniza sola cada 5 minutos, no hace falta volver a esta pantalla para traer los correos nuevos.",
          },
        ],
      },
      {
        heading: "Enviar un correo de prueba y errores comunes",
        blocks: [
          {
            type: "ol",
            items: [
              "Guardá primero los cambios del bloque SMTP.",
              "Escribí un correo de destino en el campo «Enviar un correo de prueba».",
              "Tocá «Enviar prueba». El resultado aparece como tilde verde o cruz roja con el motivo del error.",
            ],
          },
          {
            type: "ul",
            items: [
              "No se puede activar el envío de correo sin completar el host y el remitente.",
              "No se puede activar el envío de correo sin contraseña SMTP cargada (ni guardar sin ella la primera vez).",
              "No se puede activar IMAP sin completar el host IMAP.",
              "IMAP usa la misma contraseña que SMTP: si falta esa contraseña, tampoco se puede activar IMAP.",
              "Tanto en Getnet como en Correo, las pruebas de conexión siempre usan la configuración ya guardada, no lo que esté tipeado sin guardar.",
            ],
          },
        ],
      },
    ],
  },
};
