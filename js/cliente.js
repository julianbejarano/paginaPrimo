async function registrarCliente(nombre, correo, contrasena, telefono, ciudad, direccion) {

  // db.auth.signUp() NO toca ninguna tabla tuya todavía — habla directo con
  // el sistema de autenticación interno de Supabase (algo así como una
  // tabla especial, auth.users, que tú no administras a mano). Le mandas
  // correo y contraseña, y Supabase por detrás: valida el formato del
  // correo, guarda la contraseña de forma segura (nunca en texto plano),
  // y crea un identificador único nuevo (un uuid) para esta persona.
  //
  // El resultado llega en dos partes, igual que en todas las llamadas a
  // Supabase que ya conoces (data / error):
  //   - data.user   → los datos del usuario recién creado. data.user.id
  //                   es el uuid real — EL MISMO que vamos a usar como id
  //                   en clientes_practica, dos líneas más abajo.
  //   - data.session → si tu proyecto exige confirmar el correo antes de
  //                   dejar entrar (ver guía, sección 7), esto llega en
  //                   null: el usuario ya existe, pero todavía no hay
  //                   sesión iniciada hasta que confirme.
  const { data, error } = await db.auth.signUp({
    email: correo,
    password: contrasena,
  });

  // Mismo patrón de "revisar error antes de seguir" que ya usaste en el
  // CRUD de productos — si signUp() falló (correo repetido, contraseña
  // muy corta, etc.), ni siquiera intentamos el segundo paso.
  if (error) {
    console.log('Error al registrar:', error);
    return null;
  }

  // Ahora sí tocamos una tabla tuya: clientes_practica. Este insert() es
  // igual al que ya usaste en agregarProducto() — la única diferencia es
  // que aquí SÍ mandamos el id a mano (data.user.id), en vez de dejar que
  // Supabase lo autogenere, porque este id tiene que coincidir exactamente
  // con el que Auth le acaba de asignar al usuario.
  const { data: cliente, error: errorCliente } = await db
    .from('clientes_prueba')
    .insert([{ id: data.user.id, nombre, correo, telefono, ciudad, direccion, rol: 'cliente' }])
    .select();

  if (errorCliente) {
    console.log('Error al crear el perfil:', errorCliente);
    return null;
  }

  return cliente[0];
}

// 'submit' es el evento que dispara un <form> cuando alguien hace clic en
// su botón de tipo submit (o presiona Enter dentro de un campo). Por
// defecto, ese evento hace que el navegador RECARGUE la página entera —
// comportamiento heredado de cuando los formularios mandaban sus datos a
// otra página de servidor, décadas atrás. Como aquí todo lo manejamos con
// JavaScript (sin recargar nada), hay que apagar ese comportamiento a
// propósito.
document.getElementById('form-registro').addEventListener('submit', async (event) => {

  // event.preventDefault() le dice al navegador "no hagas lo que harías
  // normalmente con este evento" — en este caso, no recargues la página.
  // Sin esta línea, la página se refrescaría apenas se hiciera clic en
  // "Crear cuenta", y perderías cualquier mensaje que fueras a mostrar.
  event.preventDefault();

  // event.target es el elemento que disparó el evento — en un 'submit',
  // siempre es el propio <form>. Lo guardamos en una variable para poder
  // usarlo más abajo (form.reset()) sin tener que volver a buscarlo.
  const form = event.target;

  const cliente = await registrarCliente(
    document.getElementById('registro-nombre').value.trim(),
    document.getElementById('registro-correo').value.trim(),
    document.getElementById('registro-password').value,
    document.getElementById('registro-telefono').value.trim(),
    document.getElementById('registro-ciudad').value.trim(),
    document.getElementById('registro-direccion').value.trim()
  );

  if (cliente) {
    document.getElementById('estado-sesion').textContent =
      'Cuenta creada. Ahora inicia sesión con ese correo y contraseña.';
    form.reset(); // vacía los 3 campos del formulario, para la próxima persona
  } else {
    document.getElementById('estado-sesion').textContent =
      'No se pudo crear la cuenta. Revisa la consola.';
  }
});



async function iniciarSesion(correo, contrasena) {

  // db.auth.signInWithPassword() es para alguien que YA se registró antes
  // (sección 4.1) — no crea ningún usuario nuevo, solo verifica que el
  // correo y la contraseña coincidan con uno que ya existe en Auth.
  //
  // Lo importante pasa "por detrás", sin que se vea en este código: si la
  // verificación sale bien, el cliente de Supabase (la variable db, la
  // misma de siempre) GUARDA la sesión internamente — normalmente en el
  // almacenamiento del navegador — y, desde este momento, la adjunta sola
  // a cada petición futura que hagas con db, sea a productos_practica, a
  // clientes_practica o a cualquier otra tabla. No hay que "pasarle" el
  // usuario a mano a ninguna otra función.
  const { data, error } = await db.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  if (error) {
    console.log('Error al iniciar sesión:', error);
    return null;
  }

  // Aquí data.user también trae el id real del usuario — el mismo valor
  // que auth.uid() va a devolver dentro de cualquier política de RLS
  // mientras esta sesión siga activa.
  return data.user;
}

// Mismo patrón explicado en el formulario de registro: 'submit' es el
// evento del <form>, y hay que apagar la recarga automática de página.
document.getElementById('form-login').addEventListener('submit', async (event) => {
  event.preventDefault(); // evita que el navegador recargue la página
  const form = event.target; // el propio <form>, guardado para usar después

  const usuario = await iniciarSesion(
    document.getElementById('login-correo').value.trim(),
    document.getElementById('login-password').value
  );

  if (usuario) {
    form.reset();
    mostrarEstadoSesion(); // definida en la sección 5
  } else {
    document.getElementById('estado-sesion').textContent =
      'Correo o contraseña incorrectos.';
  }
});


document.getElementById('btn-logout').addEventListener('click', async () => {
  await db.auth.signOut();
  mostrarEstadoSesion();
});


async function mostrarEstadoSesion() {
  const { data } = await db.auth.getUser();
  const estado = document.getElementById('estado-sesion');
  const zonaFormularios = document.getElementById('zona-formularios');
  const zonaPerfil = document.getElementById('zona-perfil');
  const navbar = document.getElementById('navbar');
  const tituloCuenta = document.getElementById('titulo-cuenta');

  if (data.user) {
    estado.textContent = `Sesión iniciada como ${data.user.email}`;
    navbar.style.display = 'flex';
    tituloCuenta.style.display = 'none';
    document.getElementById('zona-editar').style.display = 'none';

    // Consulta la tabla clientes_prueba para traer el perfil completo
    const { data: cliente, error } = await db
      .from('clientes_prueba')
      .select('nombre, correo, telefono, ciudad, direccion')
      .eq('id', data.user.id)
      .single();

    if (error) {
      console.log('Error al traer perfil:', error);
    }

    if (cliente) {
      document.getElementById('perfil-nombre').textContent = cliente.nombre || '—';
      document.getElementById('perfil-correo').textContent = cliente.correo || '—';
      document.getElementById('perfil-telefono').textContent = cliente.telefono || '—';
      document.getElementById('perfil-ciudad').textContent = cliente.ciudad || '—';
      document.getElementById('perfil-direccion').textContent = cliente.direccion || '—';
    }

    zonaFormularios.style.display = 'none';
    zonaPerfil.style.display = 'block';
  } else {
    estado.textContent = 'No has iniciado sesión.';
    navbar.style.display = 'none';
    tituloCuenta.style.display = 'block';
    zonaFormularios.style.display = 'block';
    zonaPerfil.style.display = 'none';
  }
}

// ============================================
// UPDATE — Actualizar datos del cliente
// ============================================

async function actualizarCliente(id, cambios) {
  const { data, error } = await db
    .from('clientes_prueba')
    .update(cambios)
    .eq('id', id)
    .select();

  if (error) {
    console.log('Error al actualizar cliente:', error);
    return null;
  }

  return data[0];
}

// Gear: abre el formulario de edición con los datos actuales
document.getElementById('btn-gear').addEventListener('click', async () => {
  const { data } = await db.auth.getUser();
  if (!data.user) return;

  const { data: cliente } = await db
    .from('clientes_prueba')
    .select('nombre, telefono, ciudad, direccion')
    .eq('id', data.user.id)
    .single();

  if (cliente) {
    document.getElementById('editar-nombre').value = cliente.nombre || '';
    document.getElementById('editar-telefono').value = cliente.telefono || '';
    document.getElementById('editar-ciudad').value = cliente.ciudad || '';
    document.getElementById('editar-direccion').value = cliente.direccion || '';
  }

  document.getElementById('zona-editar').style.display = 'block';
  document.getElementById('msg-editar').textContent = '';
});

// Cancelar edición
document.getElementById('btn-cancelar-editar').addEventListener('click', () => {
  document.getElementById('zona-editar').style.display = 'none';
});

// Submit: guarda los cambios con UPDATE
document.getElementById('form-editar').addEventListener('submit', async (event) => {
  event.preventDefault();

  const { data } = await db.auth.getUser();
  if (!data.user) return;

  const cambios = {
    nombre: document.getElementById('editar-nombre').value.trim(),
    telefono: document.getElementById('editar-telefono').value.trim(),
    ciudad: document.getElementById('editar-ciudad').value.trim(),
    direccion: document.getElementById('editar-direccion').value.trim(),
  };

  const msg = document.getElementById('msg-editar');
  const resultado = await actualizarCliente(data.user.id, cambios);

  if (resultado) {
    msg.textContent = 'Datos actualizados correctamente.';
    msg.className = 'msg-ok';
    document.getElementById('zona-editar').style.display = 'none';
    mostrarEstadoSesion();
  } else {
    msg.textContent = 'Error al actualizar. Revisa la consola.';
    msg.className = 'msg-err';
  }
});

// Al cargar la página, revisa si ya había una sesión activa
mostrarEstadoSesion();


// ============================================
// NAVEGACION POR TABS (Perfil / Productos)
// ============================================

function mostrarSeccion(nombre) {
  const panelCuenta = document.getElementById('panel-cuenta');
  const zonaPerfil = document.getElementById('zona-perfil');
  const zonaTienda = document.getElementById('zona-tienda');
  const btnGear = document.getElementById('btn-gear');
  const btnCarrito = document.getElementById('btn-carrito');

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('activo', tab.dataset.seccion === nombre);
  });

  if (nombre === 'perfil') {
    panelCuenta.style.display = '';
    zonaPerfil.style.display = 'block';
    zonaTienda.style.display = 'none';
    btnGear.style.display = '';
    btnCarrito.style.display = 'none';
  } else {
    panelCuenta.style.display = 'none';
    zonaTienda.style.display = 'block';
    btnGear.style.display = 'none';
    btnCarrito.style.display = 'flex';
    cargarProductosTienda();
  }
}

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => mostrarSeccion(tab.dataset.seccion));
});


// ============================================
// TIENDA: cargar y renderizar productos
// ============================================

let productosTienda = [];
const carrito = {};
let pedidoId = null;
const detalleIds = {};
const cantidadesSeleccionadas = {};

async function obtenerUsuario() {
  const { data } = await db.auth.getUser();
  return data.user;
}

async function buscarCarrito(usuario) {
  const { data, error } = await db
    .from('pedidos')
    .select('id')
    .eq('cliente_id', usuario.id)
    .eq('estado', 'carrito')
    .maybeSingle();

  if (error) {
    console.log('Error al buscar el carrito:', error);
    return null;
  }
  return data ? data.id : null;
}

async function obtenerOCrearCarrito(usuario) {
  if (pedidoId) return pedidoId;

  const encontrado = await buscarCarrito(usuario);
  if (encontrado) {
    pedidoId = encontrado;
    return pedidoId;
  }

  const { data, error } = await db
    .from('pedidos')
    .insert({ cliente_id: usuario.id })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      const reintento = await buscarCarrito(usuario);
      if (reintento) {
        pedidoId = reintento;
        return pedidoId;
      }
    }
    console.log('Error al crear el carrito:', error);
    return null;
  }

  pedidoId = data.id;
  return pedidoId;
}

function vaciarCarritoLocal() {
  for (const id in carrito) delete carrito[id];
  for (const id in detalleIds) delete detalleIds[id];
  pedidoId = null;
  actualizarCarrito();
}

function limpiarUrl(valor) {
  const coincidencia = String(valor || '').match(/https?:\/\/[^\s"']+/);
  return coincidencia ? coincidencia[0] : null;
}

function precioConDescuento(producto) {
  return producto.precio * (1 - (producto.descuento || 0));
}

async function cargarProductosTienda() {
  const contenedor = document.getElementById('galeria-tienda');
  const estado = document.getElementById('estado-carga-tienda');

  estado.style.display = '';
  estado.textContent = 'Cargando productos...';
  contenedor.replaceChildren();

  const { data, error } = await db.from('productos_practica').select('*');

  if (error) {
    estado.textContent = 'Error al cargar los productos.';
    return;
  }

  if (data.length === 0) {
    estado.textContent = 'No hay productos disponibles.';
    return;
  }

  productosTienda = data;
  productosTienda.forEach(p => {
    if (cantidadesSeleccionadas[p.id] == null) cantidadesSeleccionadas[p.id] = 1;
  });

  estado.style.display = 'none';
  contenedor.replaceChildren(...productosTienda.map(crearCardTienda));
}

function crearCardTienda(producto) {
  const card = document.createElement('div');
  card.className = 'card-tienda';

  const urlImg = limpiarUrl(producto.image_url || producto.img_url);
  if (urlImg) {
    const img = document.createElement('img');
    img.className = 'card-img';
    img.alt = producto.nombre;
    img.loading = 'lazy';
    img.addEventListener('error', () => {
      const vacia = document.createElement('div');
      vacia.className = 'card-img-vacia';
      vacia.textContent = 'Sin imagen';
      img.replaceWith(vacia);
    });
    img.src = urlImg;
    card.appendChild(img);
  } else {
    const vacia = document.createElement('div');
    vacia.className = 'card-img-vacia';
    vacia.textContent = 'Sin imagen';
    card.appendChild(vacia);
  }

  const body = document.createElement('div');
  body.className = 'card-body';

  const nombre = document.createElement('p');
  nombre.className = 'card-nombre';
  nombre.textContent = producto.nombre;

  const descripcion = document.createElement('p');
  descripcion.className = 'card-descripcion';
  descripcion.textContent = producto.descripcion || '';

  const precioFinal = precioConDescuento(producto);
  const precioEl = document.createElement('p');
  precioEl.className = 'card-precio';
  precioEl.textContent = '$' + precioFinal.toLocaleString('es-CO');

  if (producto.descuento > 0) {
    const original = document.createElement('span');
    original.className = 'card-precio-original';
    original.textContent = ' $' + producto.precio.toLocaleString('es-CO');

    const badge = document.createElement('span');
    badge.className = 'card-descuento';
    badge.textContent = '-' + Math.round(producto.descuento * 100) + '%';

    precioEl.append(original, ' ', badge);
  }

  const estado = document.createElement('p');
  estado.className = 'card-estado' + (producto.disponible ? '' : ' agotado');
  estado.textContent = producto.disponible
    ? 'Disponible' + (producto.unidades != null ? ' · ' + producto.unidades + ' uds.' : '')
    : 'No disponible';

  body.append(nombre, descripcion, precioEl, estado);
  card.appendChild(body);

  // Acciones: − cantidad + | Agregar
  const acciones = document.createElement('div');
  acciones.className = 'card-acciones';

  const btnRestar = document.createElement('button');
  btnRestar.type = 'button';
  btnRestar.className = 'btn-qty restar';
  btnRestar.textContent = '−';

  const cantDisplay = document.createElement('span');
  cantDisplay.className = 'cantidad-display';
  cantDisplay.textContent = cantidadesSeleccionadas[producto.id];

  const btnSumar = document.createElement('button');
  btnSumar.type = 'button';
  btnSumar.className = 'btn-qty sumar';
  btnSumar.textContent = '+';

  const btnAgregar = document.createElement('button');
  btnAgregar.type = 'button';
  btnAgregar.className = 'btn-agregar';
  btnAgregar.textContent = 'Agregar';

  if (!producto.disponible) {
    btnAgregar.disabled = true;
    btnAgregar.textContent = 'Agotado';
  }

  btnRestar.addEventListener('click', () => {
    if (cantidadesSeleccionadas[producto.id] > 1) {
      cantidadesSeleccionadas[producto.id]--;
      cantDisplay.textContent = cantidadesSeleccionadas[producto.id];
    }
  });

  btnSumar.addEventListener('click', () => {
    cantidadesSeleccionadas[producto.id]++;
    cantDisplay.textContent = cantidadesSeleccionadas[producto.id];
  });

  btnAgregar.addEventListener('click', () => {
    const cantidad = cantidadesSeleccionadas[producto.id];
    carrito[producto.id] = (carrito[producto.id] || 0) + cantidad;

    cantidadesSeleccionadas[producto.id] = 1;
    cantDisplay.textContent = 1;

    btnAgregar.textContent = 'Agregado';
    btnAgregar.style.background = '#4a7c59';
    setTimeout(() => {
      btnAgregar.textContent = 'Agregar';
      btnAgregar.style.background = '';
    }, 1200);

    actualizarCarrito();
  });

  acciones.append(btnRestar, cantDisplay, btnSumar, btnAgregar);
  card.appendChild(acciones);

  return card;
}


// ============================================
// CARRITO
// ============================================

function actualizarCarrito() {
  const lista = document.getElementById('lista-carrito');
  const badge = document.getElementById('contador-badge');
  const totalValor = document.getElementById('total-valor');

  let totalItems = 0;
  let totalPrecio = 0;

  const idsEnCarrito = Object.keys(carrito).filter(id => carrito[id] > 0);

  if (idsEnCarrito.length === 0) {
    lista.replaceChildren();
    const vacio = document.createElement('p');
    vacio.className = 'carrito-vacio';
    vacio.textContent = 'Tu carrito esta vacio';
    lista.appendChild(vacio);
    badge.textContent = '0';
    totalValor.textContent = '$0';
    return;
  }

  lista.replaceChildren();

  idsEnCarrito.forEach(id => {
    const producto = productosTienda.find(p => String(p.id) === String(id));
    if (!producto) return;

    const qty = carrito[id];
    const precioPorUnidad = precioConDescuento(producto);
    totalItems += qty;
    totalPrecio += precioPorUnidad * qty;

    const item = document.createElement('div');
    item.className = 'item-carrito';

    const urlImg = limpiarUrl(producto.image_url || producto.img_url);
    if (urlImg) {
      const img = document.createElement('img');
      img.src = urlImg;
      img.alt = producto.nombre;
      item.appendChild(img);
    }

    const info = document.createElement('div');
    info.className = 'item-info';

    const nombreEl = document.createElement('strong');
    nombreEl.textContent = producto.nombre;

    const detalle = document.createElement('span');
    detalle.textContent = '$' + precioPorUnidad.toLocaleString('es-CO') + ' x ' + qty;

    info.append(nombreEl, detalle);

    const subtotal = document.createElement('span');
    subtotal.className = 'item-subtotal';
    subtotal.textContent = '$' + (precioPorUnidad * qty).toLocaleString('es-CO');

    item.append(info, subtotal);
    lista.appendChild(item);
  });

  badge.textContent = totalItems;
  totalValor.textContent = '$' + totalPrecio.toLocaleString('es-CO');
}


// ============================================
// ABRIR / CERRAR PANEL CARRITO
// ============================================

const panelCarrito = document.getElementById('panel-carrito');
const overlayCarrito = document.getElementById('overlay-carrito');

document.getElementById('btn-carrito').addEventListener('click', () => {
  panelCarrito.classList.add('abierto');
  overlayCarrito.classList.add('activo');
});

document.getElementById('btn-cerrar-carrito').addEventListener('click', cerrarCarrito);
overlayCarrito.addEventListener('click', cerrarCarrito);

function cerrarCarrito() {
  panelCarrito.classList.remove('abierto');
  overlayCarrito.classList.remove('activo');
}