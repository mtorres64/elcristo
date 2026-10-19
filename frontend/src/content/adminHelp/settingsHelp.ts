import type { HelpTopicMap } from "./types";

export const settingsHelp: HelpTopicMap = {
  "/seller/settings": {
    title: "Configuración",
    summary:
      "Administrá la apariencia y las reglas comerciales de tu tienda online: el carrusel de la home, el margen con el que se sugieren precios, las redes sociales del pie de página y todo lo referido a envíos.",
    sections: [
      {
        heading: "Qué vas a encontrar en Configuración",
        blocks: [
          {
            type: "p",
            text: "Esta pantalla se organiza en una botonera de cuatro secciones, arriba de todo. Hacé clic en cada botón para pasar de una a otra; el contenido de abajo cambia según la que tengas seleccionada. Estas son las cuatro:",
          },
          {
            type: "ul",
            items: [
              "Carrusel principal: las imágenes y textos grandes que rotan en la portada de la página de inicio del sitio.",
              "Precios y márgenes: el margen (markup) que se usa para sugerir el precio de venta cuando registrás una compra de mercadería.",
              "Redes sociales: los links a Instagram, WhatsApp, Facebook, etc. que se muestran como íconos en el pie de página del sitio.",
              "Envíos: la ubicación del local en el mapa, las zonas con costo de envío fijo, el descuento por retirar en el local, el texto de cuotas y los avisos que ve el cliente en el checkout y en la ficha de producto.",
            ],
          },
          {
            type: "p",
            text: "Las páginas de texto largo de la tienda (Sobre Nosotros, Diseño & Paisajismo, Inspiración) no viven acá: se editan desde la sección Contenido del panel, no desde Configuración.",
          },
        ],
      },
      {
        heading: "Carrusel principal",
        blocks: [
          {
            type: "p",
            text: "Acá armás los slides (diapositivas) grandes que ven los visitantes apenas entran a la página de inicio de la tienda. Cada slide es una tarjeta independiente con su propia imagen, texto y configuración, y se muestran en el orden en que aparecen en la lista.",
          },
          {
            type: "p",
            text: "Arriba de la lista de slides tenés una barra con el botón «+ Agregar slide» y el botón «Guardar cambios». En el celular, esta misma barra queda fija pegada abajo de todo para que siempre la tengas a mano mientras editás. Ningún cambio en el carrusel se guarda en la tienda hasta que apretás «Guardar cambios»; si falta la imagen de escritorio de algún slide, el sistema te avisa y no deja guardar.",
          },
          {
            type: "p",
            text: "Cada tarjeta de slide tiene, en su encabezado:",
          },
          {
            type: "ul",
            items: [
              "Un número que indica su posición en el orden del carrusel.",
              "Una llave (toggle) «Activo / Oculto» para mostrar u ocultar ese slide sin tener que borrarlo.",
              "Flechas para subir o bajar el slide y cambiar su orden.",
              "Un botón para eliminar el slide definitivamente (se borra de la lista; recordá guardar después).",
            ],
          },
          {
            type: "p",
            text: "Del lado izquierdo de cada tarjeta configurás la imagen y los datos del slide:",
          },
          {
            type: "ul",
            items: [
              "Imagen de escritorio (obligatoria): se sube arrastrando un archivo o haciendo clic para elegirlo; tiene un recorte panorámico (16:9), pensado para pantallas grandes.",
              "Imagen mobile (opcional): un recorte vertical y angosto (9:16) para cuando se ve desde el celular. Si no la cargás, en mobile se usa también la de escritorio.",
              "Alt de la imagen: una descripción corta de lo que muestra la foto.",
              "Destino del click: a dónde lleva el slide si el visitante hace clic sobre él. Podés elegir entre páginas fijas del sitio (Inicio, Todos los productos, Categorías, Diseño & Paisajismo, Inspiración, Sobre Nosotros), una categoría puntual, un producto puntual, o escribir una URL personalizada o externa. También podés dejarlo «Sin destino» para que no sea clickeable.",
              "Diseño del slide: «Imagen completa» (el texto, si lo hay, se superpone arriba de la foto) o «Mitad y mitad» (la imagen ocupa un lado y el texto el otro).",
              "Posición del texto: izquierda, centro o derecha. La opción «centro» solo está disponible con el diseño «Imagen completa».",
              "Color de fondo del panel de texto y su opacidad (de 0% a 100%, con un control deslizante), para que el texto se lea bien sobre la foto.",
            ],
          },
          {
            type: "p",
            text: "Del lado derecho tenés el editor de contenido del slide, donde escribís el texto directamente sobre una vista previa de cómo se va a ver. Si lo dejás vacío, el slide queda sin texto (se muestra solo la foto, sin ningún velo oscuro encima). La barra de herramientas de ese editor te deja:",
          },
          {
            type: "ul",
            items: [
              "Elegir el tipo de bloque: Párrafo, Título grande o Etiqueta chica (la etiqueta pequeña que suele ir arriba del título).",
              "Elegir el tipo y el tamaño de letra entre un set acotado de opciones (automática, chica, normal, grande, muy grande, enorme; fuente serif elegante o sans moderna).",
              "Poner negrita o cursiva al texto seleccionado.",
              "Cambiar el color del texto seleccionado (o quitarle el color propio para que vuelva a usar el color general del slide).",
              "Crear un link o un botón: elegís el texto, el destino (una ruta interna como /products o una URL completa), y el estilo —Normal, Botón sólido o Botón outline— con su propio color. También podés quitar un link ya creado.",
              "Deshacer y rehacer los últimos cambios de texto.",
            ],
          },
          {
            type: "p",
            text: "Este carrusel se ve en la página de inicio pública de la tienda, apenas entra cualquier visitante.",
          },
          {
            type: "ol",
            items: [
              "Para cambiar las imágenes del carrusel principal, entrá a Configuración y quedate en la pestaña «Carrusel principal» (es la que abre por defecto).",
              "Elegí el slide que querés cambiar (o apretá «+ Agregar slide» si querés sumar uno nuevo).",
              "Hacé clic sobre el recuadro de «Imagen de escritorio» (y opcionalmente el de «Imagen mobile») y seleccioná o arrastrá el archivo nuevo.",
              "Completá o revisá el alt, el destino del click, el diseño, la posición del texto y los colores de fondo.",
              "Si el slide lleva texto, escribilo con el editor de la derecha, usando la barra de herramientas para darle formato.",
              "Repetí los pasos anteriores para cada slide que quieras agregar o modificar, y usá las flechas para ordenarlos como quieras.",
              "Apretá «Guardar cambios» para que los visitantes empiecen a ver la nueva versión del carrusel.",
            ],
          },
        ],
      },
      {
        heading: "Precios y márgenes",
        blocks: [
          {
            type: "p",
            text: "Acá definís el «Markup por defecto», un porcentaje que el sistema usa para sugerirte un precio de venta cada vez que registrás la compra de mercadería a un proveedor. La cuenta que hace es: precio = costo × (1 + markup / 100).",
          },
          {
            type: "p",
            text: "Debajo del campo aparece un ejemplo en vivo: con un costo de $6.000, te muestra a qué precio sugerido equivale el markup que acabás de escribir, para que puedas chequear que el número tiene sentido antes de guardar.",
          },
          {
            type: "p",
            text: "Este markup es solo el valor por defecto de toda la tienda: un producto puntual puede tener su propio markup objetivo cargado, que pisa a este general únicamente para ese producto.",
          },
          {
            type: "ol",
            items: [
              "Entrá a Configuración y hacé clic en la pestaña «Precios y márgenes».",
              "Escribí el nuevo porcentaje de markup en el campo (solo números, admite decimales).",
              "Revisá el precio de ejemplo que aparece debajo para confirmar que el cálculo es el esperado.",
              "Apretá «Guardar cambios». Si el valor no es válido (vacío, negativo o no numérico), el sistema te va a avisar y no va a guardar nada.",
            ],
          },
        ],
      },
      {
        heading: "Redes sociales",
        blocks: [
          {
            type: "p",
            text: "Acá cargás los links a las redes sociales y canales de contacto del vivero (Instagram, Facebook, WhatsApp, etc.). Se muestran como íconos clickeables en el pie de página (footer) de todas las páginas públicas del sitio, en el mismo orden en que los tenés ordenados en esta lista.",
          },
          {
            type: "p",
            text: "Cada fila de la lista tiene un ícono según la red elegida, un desplegable para elegir la plataforma, un campo de texto para la URL (o el número, según la red), y botones para subir, bajar o eliminar esa red.",
          },
          {
            type: "p",
            text: "No hace falta que escribas la URL completa: si pegás solo el nombre de usuario o el dominio sin «https://», el sistema le agrega el protocolo automáticamente al salir del campo. Para guardar, todas las redes de la lista tienen que tener la URL completa; si dejás alguna vacía, el sistema te pide que la completes o la elimines antes de guardar.",
          },
          {
            type: "ol",
            items: [
              "Entrá a Configuración y hacé clic en la pestaña «Redes sociales».",
              "Apretá «+ Agregar red» para sumar una fila nueva.",
              "Elegí la plataforma en el desplegable (Instagram, WhatsApp, Facebook, etc.).",
              "Escribí la URL, el usuario o el número correspondiente a esa red en el campo de texto.",
              "Usá las flechas de cada fila para ordenar en qué orden van a aparecer los íconos en el pie de página.",
              "Apretá «Guardar cambios» para actualizar el footer del sitio.",
            ],
          },
        ],
      },
      {
        heading: "Envíos: ubicación del local",
        blocks: [
          {
            type: "p",
            text: "En esta tarjeta marcás en un mapa dónde está ubicado el local físico del vivero. Esa ubicación se usa para mostrar el mapa en la página de contacto del sitio y como punto de referencia para calcular los envíos.",
          },
          {
            type: "p",
            text: "Para marcar el lugar, hacé clic sobre el punto exacto del mapa; aparece un pin que también podés arrastrar para ajustarlo. Debajo del mapa se muestran las coordenadas exactas (latitud y longitud) del pin una vez ubicado.",
          },
          {
            type: "p",
            text: "Además del pin, hay un campo de texto para la dirección, que se muestra tal cual la escribís (por ejemplo: «Av. Aconquija 1200, San Miguel de Tucumán, Tucumán»).",
          },
        ],
      },
      {
        heading: "Envíos: zonas con envío a costo fijo",
        blocks: [
          {
            type: "p",
            text: "Acá agrupás las localidades a las que les cobrás un envío fijo, armando una o varias «zonas» (por ejemplo, una zona que junte Yerba Buena y San Miguel de Tucumán, porque a ambas les cobrás lo mismo). A las localidades que no entran en ninguna zona configurada se les muestra, en cambio, el cartel de «Otras localidades» que se explica más abajo.",
          },
          {
            type: "p",
            text: "Cada zona tiene estos campos:",
          },
          {
            type: "ul",
            items: [
              "Nombre de la zona (obligatorio para poder guardar), por ejemplo «Yerba Buena y San Miguel de Tucumán».",
              "Costo del envío en esa zona, en pesos.",
              "Un casillero «Gratis a partir de» que, si lo marcás, te deja poner un monto de compra a partir del cual el envío en esa zona pasa a ser gratuito.",
              "Localidades que incluye esa zona: se escriben separadas por coma, usando los mismos nombres que el cliente va a ver en el combo de «Localidad» del checkout (no hace falta poner barrios). Esta lista solo sirve para que el sistema sugiera la zona correcta; no cambia el costo por sí sola.",
            ],
          },
          {
            type: "p",
            text: "Podés agregar tantas zonas como necesites con el botón «+ Agregar zona», y eliminar cualquiera con el botón de tacho de esa fila. Al guardar, todas las zonas tienen que tener un nombre; si alguna está vacía, el sistema te pide completarla o eliminarla.",
          },
        ],
      },
      {
        heading: "Envíos: retiro en el local",
        blocks: [
          {
            type: "p",
            text: "Acá definís el porcentaje de descuento que se le aplica automáticamente al cliente cuando elige retirar su compra en el local en vez de pedir que se la envíen.",
          },
        ],
      },
      {
        heading: "Envíos: cuotas",
        blocks: [
          {
            type: "p",
            text: "Este campo controla el texto informativo sobre cuotas que se muestra en la página de inicio y en la ficha de cada producto (por ejemplo, «Hasta 3 cuotas»). Solo define el número que aparece en ese cartel: la cantidad real de cuotas que efectivamente ofrece la tarjeta de crédito se configura en otro lugar, en el Getnet Portal, no desde este panel.",
          },
        ],
      },
      {
        heading: "Envíos: otras localidades",
        blocks: [
          {
            type: "p",
            text: "Este texto se muestra al cliente cuando, en el checkout, elige una localidad que no está incluida en ninguna de las zonas de envío a costo fijo configuradas más arriba. Junto a este texto aparece también un botón de WhatsApp para que el cliente pueda consultar directamente.",
          },
          {
            type: "p",
            text: "Además del texto, hay un campo para el número de WhatsApp al que se va a dirigir ese botón, específico para consultas de envío. Tiene que escribirse con código de país y de área, sin espacios ni el signo «+» (por ejemplo: 5493811234567). Si dejás este número vacío, el sistema usa en su lugar el WhatsApp que hayas cargado en la sección de Redes sociales.",
          },
        ],
      },
      {
        heading: "Envíos: aviso de stock por mayor",
        blocks: [
          {
            type: "p",
            text: "Este texto se muestra en la ficha de cada producto y en el carrito, como aviso para compras de cantidades grandes (por ejemplo, para avisar que no siempre hay el 100% del stock cargado en la web y conviene consultar antes de comprar en volumen). Si dejás este campo vacío, no se muestra ningún aviso.",
          },
        ],
      },
      {
        heading: "Cómo guardar los cambios de Envíos",
        blocks: [
          {
            type: "p",
            text: "Todas las tarjetas de la sección «Envíos» (ubicación, zonas, retiro en el local, cuotas, otras localidades y aviso de stock) comparten un único botón «Guardar cambios», ubicado arriba de todo (y también fijo abajo en la vista mobile). Al entrar por primera vez a esta sección, si todavía no habías cargado ninguna zona ni los textos de abajo, el sistema te puede mostrar valores de ejemplo precargados con un aviso de que son sugeridos: revisalos y ajustalos a tu caso real antes de guardar.",
          },
          {
            type: "ol",
            items: [
              "Entrá a Configuración y hacé clic en la pestaña «Envíos».",
              "Marcá o ajustá el pin de ubicación del local en el mapa y completá la dirección.",
              "Revisá, agregá o editá las zonas de envío a costo fijo con su nombre, costo, envío gratis desde un monto (si aplica) y localidades.",
              "Completá el porcentaje de descuento por retiro en el local.",
              "Completá la cantidad de cuotas que querés mostrar en el cartel.",
              "Escribí el texto y el WhatsApp para «Otras localidades».",
              "Escribí (o dejá vacío) el aviso de stock por mayor.",
              "Apretá «Guardar cambios» una sola vez al final para guardar todo junto.",
            ],
          },
        ],
      },
    ],
  },
};
