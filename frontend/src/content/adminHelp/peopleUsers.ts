import type { HelpTopicMap } from "./types";

export const peopleUsersHelp: HelpTopicMap = {
  "/seller/clients": {
    title: "Clientes",
    summary:
      "Esta pantalla muestra a los compradores que se registraron en la tienda online. Acá podés buscarlos, ver su estado y activarlos o desactivarlos.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "El encabezado muestra el total de clientes registrados (o «Cargando...» mientras se obtienen los datos). Debajo aparece la barra de filtros y, más abajo, la lista de clientes en forma de tabla (en pantallas grandes) o de tarjetas (en el celular).",
          },
          {
            type: "p",
            text: "Importante: esta lista son los compradores finales de la tienda, no el personal que entra al panel. Las cuentas de personal (vendedores y administradores) se gestionan en la pantalla «Usuarios», que es una sección distinta.",
          },
          {
            type: "ul",
            items: [
              "Casillero de selección: para marcar uno o varios clientes de la página actual.",
              "Avatar: foto del cliente si inició sesión con Google, o un círculo con sus iniciales si no.",
              "Nombre y email del cliente.",
              "Columna «Auth»: muestra una etiqueta «Google» cuando el cliente se registró con su cuenta de Google. Si no tiene esa etiqueta, se registró con email y contraseña propios.",
              "Columna «Estado»: etiqueta verde «Activo» o gris «Inactivo».",
              "Columna «Registro»: fecha en que el cliente se creó la cuenta.",
              "Un botón con forma de interruptor, a la derecha de cada fila, para activar o desactivar al cliente.",
            ],
          },
          {
            type: "p",
            text: "En el celular, tocando sobre el nombre de un cliente se despliega una tarjeta con más detalle (etiqueta de Google si corresponde, fecha de registro y el botón para activar o desactivar).",
          },
        ],
      },
      {
        heading: "Cómo buscar y filtrar",
        blocks: [
          {
            type: "p",
            text: "En la barra de filtros (en el celular hay que tocar el botón «Filtros» para desplegarla) tenés tres controles:",
          },
          {
            type: "ul",
            items: [
              "Buscador por nombre o email: escribí y esperá un instante, la búsqueda se aplica sola (no hace falta apretar Enter).",
              "Filtro de estado: «Todos los estados», «Activo» o «Inactivo».",
              "Orden: «Más recientes», «Más antiguos» o «Nombre A → Z».",
            ],
          },
          {
            type: "p",
            text: "Cuando hay algún filtro aplicado (búsqueda, estado distinto de «Todos» u orden distinto de «Más recientes») aparece un enlace «Limpiar filtros» que los resetea todos de una vez. En el celular, el botón de filtros muestra además un numerito con la cantidad de filtros activos.",
          },
        ],
      },
      {
        heading: "Seleccionar clientes",
        blocks: [
          {
            type: "p",
            text: "Podés tildar el casillero de cada fila para seleccionar clientes, o usar el casillero del encabezado de la tabla para seleccionar o deseleccionar todos los de la página actual (si ya hay algunos seleccionados, el casillero se muestra en estado intermedio).",
          },
          {
            type: "p",
            text: "Al seleccionar al menos un cliente aparece una barra con la cantidad seleccionada y un botón «Cancelar selección» para deseleccionar todo. La selección se limpia automáticamente al cambiar de filtro, de orden o de página.",
          },
        ],
      },
      {
        heading: "Activar o desactivar un cliente",
        blocks: [
          {
            type: "ol",
            items: [
              "Ubicá al cliente en la lista (usá el buscador si hace falta).",
              "En la fila del cliente (o en la tarjeta desplegada, en el celular), hacé clic en el botón con forma de interruptor.",
              "El sistema confirma el cambio con un mensaje: «[nombre] activado» o «[nombre] desactivado».",
              "El badge de estado de ese cliente se actualiza al instante, sin necesidad de recargar la página.",
            ],
          },
          {
            type: "p",
            text: "Un cliente desactivado no puede iniciar sesión ni comprar en la tienda, pero su historial se conserva.",
          },
        ],
      },
      {
        heading: "Paginación",
        blocks: [
          {
            type: "p",
            text: "Al pie de la tabla podés moverte entre páginas con las flechas o tocando directamente el número de página, y también podés cambiar cuántos clientes se muestran por página con el selector de tamaño de página.",
          },
        ],
      },
      {
        heading: "Errores comunes y tips",
        blocks: [
          {
            type: "ul",
            items: [
              "Si la lista no carga, vas a ver un mensaje de error con un botón «Reintentar».",
              "Si no hay clientes que coincidan con los filtros aplicados, aparece un aviso y un enlace para limpiar los filtros.",
              "Si todavía no se registró ningún cliente en la tienda, vas a ver el mensaje «Todavía no hay clientes registrados».",
              "Esta pantalla no permite crear clientes manualmente ni editar sus datos: los clientes se registran ellos mismos desde la tienda. Desde acá solo podés consultarlos y activarlos o desactivarlos.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/users": {
    title: "Usuarios",
    summary:
      "Esta pantalla administra las cuentas de personal que pueden entrar al panel de administración (vendedores y administradores), a diferencia de «Clientes» que son los compradores de la tienda.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "El encabezado muestra el total de usuarios registrados y el botón «+ Nuevo usuario» (fijo arriba de todo en el celular, y a la derecha del título en pantallas grandes). Debajo está la barra de filtros y la lista de usuarios, en tabla o en tarjetas según el tamaño de pantalla.",
          },
          {
            type: "ul",
            items: [
              "Casillero de selección por fila, y uno en el encabezado para seleccionar todos los de la página.",
              "Avatar con foto o iniciales.",
              "Nombre y email del usuario.",
              "Columna «Rol»: una etiqueta de color — «Comprador» (azul), «Vendedor» (naranja) o «Admin» (violeta).",
              "Columna «Estado»: «Activo» (verde) o «Inactivo» (gris).",
              "Columna «Email»: un ícono que indica si el email está verificado o no (pasá el mouse para ver el detalle en pantallas grandes).",
              "Columna «Registro»: fecha de creación de la cuenta.",
              "Tres botones de acción por fila: editar (lápiz), activar/desactivar (interruptor) y eliminar (tacho de basura).",
            ],
          },
          {
            type: "p",
            text: "En el celular, tocando el nombre de un usuario se despliega una tarjeta con el detalle de si el email está verificado, la fecha de registro y los botones de Editar, Activar/Desactivar y Eliminar.",
          },
        ],
      },
      {
        heading: "Roles disponibles",
        blocks: [
          {
            type: "ul",
            items: [
              "Comprador: puede comprar productos en la tienda.",
              "Vendedor: puede gestionar su tienda y productos.",
              "Administrador (se muestra como «Admin» en la lista): acceso completo a la plataforma.",
            ],
          },
          {
            type: "p",
            text: "El filtro de rol de esta pantalla incluye las tres opciones (Comprador, Vendedor, Admin), así que si no aplicás ningún filtro podés ver también cuentas con rol Comprador mezcladas en la lista. Si solo querés ver al personal del panel, usá el filtro de rol para quedarte con Vendedor y Admin.",
          },
        ],
      },
      {
        heading: "Cómo buscar y filtrar",
        blocks: [
          {
            type: "p",
            text: "En la barra de filtros (desplegable con el botón «Filtros» en el celular) contás con:",
          },
          {
            type: "ul",
            items: [
              "Buscador por nombre o email, con búsqueda automática mientras escribís.",
              "Filtro de rol: «Todos los roles», «Comprador», «Vendedor» o «Admin».",
              "Filtro de estado: «Todos los estados», «Activo» o «Inactivo».",
              "Orden: «Más recientes», «Más antiguos» o «Nombre A → Z».",
            ],
          },
          {
            type: "p",
            text: "Si hay algún filtro activo aparece el enlace «Limpiar filtros». En el celular, el botón de filtros muestra un numerito con la cantidad de filtros aplicados.",
          },
        ],
      },
      {
        heading: "Cómo crear un usuario nuevo",
        blocks: [
          {
            type: "ol",
            items: [
              "Hacé clic en el botón «+ Nuevo usuario» (arriba a la derecha, o fijo en la parte superior en el celular).",
              "Se abre la pantalla «Nuevo usuario», donde completás nombre, email, contraseña, rol y estado.",
              "Al guardar, volvés automáticamente a esta lista y el usuario nuevo ya aparece en ella.",
            ],
          },
        ],
      },
      {
        heading: "Editar, activar/desactivar o eliminar un usuario",
        blocks: [
          {
            type: "ol",
            items: [
              "Para editar: hacé clic en el ícono de lápiz de la fila (o en el botón «Editar» de la tarjeta, en el celular). Te lleva a la pantalla de edición de ese usuario.",
              "Para activar o desactivar: hacé clic en el ícono con forma de interruptor. El cambio se aplica al instante y aparece un mensaje de confirmación.",
              "Para eliminar: hacé clic en el ícono de tacho de basura. La fila cambia y te pregunta «¿Eliminar?»; confirmá con «Sí» o cancelá con «No».",
              "Si confirmás, el usuario se elimina y desaparece de la lista; si falla, aparece un aviso de error y el usuario no se borra.",
            ],
          },
        ],
      },
      {
        heading: "Selección múltiple y eliminación en lote",
        blocks: [
          {
            type: "ol",
            items: [
              "Tildá el casillero de cada usuario que quieras eliminar, o usá el casillero del encabezado para seleccionar todos los de la página.",
              "Al seleccionar al menos uno aparece una barra con la cantidad seleccionada y el botón «Eliminar seleccionados».",
              "Al hacer clic en «Eliminar seleccionados», el sistema te pide confirmar con «¿Eliminar [cantidad] usuarios?»; confirmá con «Confirmar» o volvé atrás con «Cancelar».",
              "Mientras se procesa el borrado el botón muestra «Eliminando…». Al terminar, un mensaje indica cuántos se eliminaron correctamente y cuántos fallaron, si hubo algún error.",
              "También podés usar «Cancelar selección» en cualquier momento para deseleccionar todo sin eliminar nada.",
            ],
          },
          {
            type: "p",
            text: "La selección se limpia automáticamente al cambiar de filtro, de orden o de página.",
          },
        ],
      },
      {
        heading: "Errores comunes y tips",
        blocks: [
          {
            type: "ul",
            items: [
              "Si la lista no carga, vas a ver un mensaje de error con un botón «Reintentar».",
              "Si no hay usuarios que coincidan con los filtros, aparece un aviso para limpiar los filtros.",
              "El ícono de verificación de email solo indica si esa cuenta confirmó su correo; no se puede forzar la verificación desde esta pantalla.",
              "Eliminar un usuario es una acción permanente: una vez confirmada no se puede deshacer desde el panel.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/users/new": {
    title: "Nuevo usuario",
    summary:
      "Formulario para crear manualmente una cuenta de personal (comprador, vendedor o administrador) y definir su contraseña inicial, rol y estado.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "Arriba está la miga de pan («Usuarios › Nuevo usuario») y los botones «Cancelar» y «Guardar usuario» (fijos en la parte superior en el celular, y arriba a la derecha en pantallas grandes).",
          },
          {
            type: "ul",
            items: [
              "Nombre completo (obligatorio).",
              "Email (obligatorio, debe tener formato de email válido).",
              "Contraseña (obligatoria, mínimo 8 caracteres), con un botón de ojo para mostrar u ocultar el texto mientras la escribís.",
              "Rol: tres tarjetas para elegir entre Comprador, Vendedor o Administrador, cada una con una breve descripción de qué puede hacer ese rol.",
              "Estado: un interruptor para marcar la cuenta como Activo o Inactivo desde el momento de la creación.",
            ],
          },
          {
            type: "p",
            text: "A la derecha hay un panel «Información» que te recuerda que el email queda sin verificar por defecto, que la cuenta se crea recién al guardar, y que el usuario podrá cambiar esta contraseña desde su propio perfil una vez que inicie sesión.",
          },
        ],
      },
      {
        heading: "Cómo crear un usuario paso a paso",
        blocks: [
          {
            type: "ol",
            items: [
              "Completá el nombre completo de la persona.",
              "Completá su email (va a ser el que use para iniciar sesión).",
              "Definí una contraseña de al menos 8 caracteres. Usá el ícono de ojo si querés verificar lo que escribiste.",
              "Elegí el rol que le corresponde: Comprador, Vendedor o Administrador.",
              "Dejá el interruptor de Estado en Activo si la cuenta debe poder usarse de inmediato, o pasalo a Inactivo si todavía no.",
              "Hacé clic en «Guardar usuario».",
              "Si todo está correcto, vas a ver un mensaje de confirmación con el nombre de la persona y el sistema te lleva de vuelta al listado de usuarios.",
            ],
          },
        ],
      },
      {
        heading: "Roles disponibles",
        blocks: [
          {
            type: "ul",
            items: [
              "Comprador: puede comprar productos en la tienda.",
              "Vendedor: puede gestionar su tienda y productos.",
              "Administrador: acceso completo a la plataforma.",
            ],
          },
        ],
      },
      {
        heading: "Validaciones y errores comunes",
        blocks: [
          {
            type: "ul",
            items: [
              "«El nombre es obligatorio»: no se puede guardar con el campo Nombre vacío.",
              "«El email es obligatorio» o «Email inválido»: el campo no puede estar vacío y debe tener formato de email (algo@algo.algo).",
              "«La contraseña es obligatoria» o «Mínimo 8 caracteres»: la contraseña no puede quedar vacía y debe tener al menos 8 caracteres.",
              "Si ya existe otra cuenta con ese email, o si hay un problema de conexión, el sistema muestra un mensaje de error abajo a la derecha y no te saca de la pantalla, para que puedas corregir y reintentar.",
            ],
          },
          {
            type: "p",
            text: "Los errores de cada campo se muestran en rojo debajo del campo correspondiente, y se borran automáticamente en cuanto empezás a corregir ese campo.",
          },
        ],
      },
      {
        heading: "Tips",
        blocks: [
          {
            type: "ul",
            items: [
              "Si te equivocás o querés salir sin guardar, usá el botón «Cancelar» para volver al listado de usuarios sin crear nada.",
              "El email que ingreses acá queda sin verificar hasta que la persona confirme su cuenta; eso no impide que pueda usarla igual.",
            ],
          },
        ],
      },
    ],
  },

  "/seller/users/:userId/edit": {
    title: "Editar usuario",
    summary:
      "Pantalla para modificar los datos, el rol, el estado y, si hace falta, la contraseña de una cuenta de personal ya existente.",
    sections: [
      {
        heading: "Qué ves en esta pantalla",
        blocks: [
          {
            type: "p",
            text: "Mientras se cargan los datos del usuario, se muestra una animación de carga. Si no se pudo cargar el usuario, aparece un aviso «No se pudo cargar el usuario.» con un enlace para volver al listado.",
          },
          {
            type: "p",
            text: "Una vez cargados los datos, arriba ves la miga de pan («Usuarios › [nombre]»), el avatar del usuario junto a su nombre y email, y los botones «Cancelar» y «Guardar cambios» (fijos arriba en el celular, arriba a la derecha en pantallas grandes).",
          },
          {
            type: "ul",
            items: [
              "Nombre completo (obligatorio).",
              "Email (obligatorio, con formato válido).",
              "Rol: las mismas tres tarjetas que en «Nuevo usuario» — Comprador, Vendedor o Administrador — mostrando cuál tiene asignado actualmente.",
              "Estado: interruptor Activo / Inactivo.",
              "Sección aparte «Cambiar contraseña», con un campo opcional de nueva contraseña (y botón de ojo para mostrarla u ocultarla).",
            ],
          },
          {
            type: "p",
            text: "A la derecha hay un panel «Información» de solo lectura con: si el email está verificado (Sí/No), el ID interno de la cuenta y la fecha de registro.",
          },
        ],
      },
      {
        heading: "Cómo editar los datos de un usuario",
        blocks: [
          {
            type: "ol",
            items: [
              "Entrá a la edición desde el listado de usuarios (ícono de lápiz o botón «Editar»).",
              "Esperá a que se carguen los datos actuales del usuario (nombre, email, rol y estado aparecen precargados).",
              "Modificá el nombre, el email, el rol y/o el estado según lo que necesites cambiar.",
              "Hacé clic en «Guardar cambios».",
              "Si todo está correcto, vas a ver el mensaje «Usuario actualizado» y el sistema te lleva de vuelta al listado de usuarios.",
            ],
          },
        ],
      },
      {
        heading: "Cómo cambiar la contraseña",
        blocks: [
          {
            type: "ol",
            items: [
              "Bajá hasta la sección «Cambiar contraseña».",
              "Si querés mantener la contraseña actual, dejá el campo «Nueva contraseña» vacío: la pantalla indica explícitamente «Dejalo vacío para mantener la contraseña actual».",
              "Si querés cambiarla, escribí una nueva contraseña de al menos 8 caracteres (podés usar el ícono de ojo para verificarla).",
              "Guardá los cambios con «Guardar cambios» como en cualquier otra edición.",
            ],
          },
        ],
      },
      {
        heading: "Validaciones y errores comunes",
        blocks: [
          {
            type: "ul",
            items: [
              "«El nombre es obligatorio»: el campo Nombre no puede quedar vacío.",
              "«El email es obligatorio» o «Email inválido»: el campo Email no puede quedar vacío y debe tener formato válido.",
              "«Mínimo 8 caracteres»: solo se valida si escribiste algo en «Nueva contraseña» y tiene menos de 8 caracteres; si lo dejás vacío, no se valida ni se modifica la contraseña.",
              "Si falla el guardado (por ejemplo, por un problema de conexión o un email duplicado), aparece un mensaje de error y los cambios no se pierden, para que puedas corregir y reintentar.",
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
              "El ID que se muestra en el panel de información es el identificador interno de la cuenta; no se puede editar.",
              "Si el email aparece como no verificado, eso no bloquea que la persona pueda seguir usando la cuenta normalmente.",
              "Usá «Cancelar» si abriste la edición por error o no querés guardar ningún cambio.",
              "Para activar, desactivar o eliminar la cuenta de forma rápida sin entrar a editar, podés hacerlo directamente desde el listado de usuarios.",
            ],
          },
        ],
      },
    ],
  },
};
