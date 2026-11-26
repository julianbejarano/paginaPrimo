// Toggle: muestra/oculta el formulario de registro
document.getElementById('btn-toggle-registro').addEventListener('click', () => {
  const formRegistro = document.getElementById('form-registro-admin');
  const btn = document.getElementById('btn-toggle-registro');
  const visible = !formRegistro.hidden;
  formRegistro.hidden = visible;
  btn.textContent = visible ? 'No tengo cuenta — Registrarme' : 'Ya tengo cuenta — Volver al login';
});

document.getElementById('form-registro-admin').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;

  const { data, error } = await db.auth.signUp({
    email: form.elements['admin-registro-correo'].value,
    password: form.elements['admin-registro-password'].value,
  });

  if (error) {
    document.getElementById('estado-sesion-admin').innerText = 'Error al registrar: ' + error.message;
    return;
  }

  const { error: errorPerfil } = await db.from('admins').insert([{
    id: data.user.id,
    nombre: form.elements['admin-registro-nombre'].value.trim(),
    correo: form.elements['admin-registro-correo'].value.trim(),
  }]);

  if (errorPerfil) {
    document.getElementById('estado-sesion-admin').innerText = 'Cuenta creada, pero falló el perfil: ' + errorPerfil.message;
    return;
  }

  document.getElementById('estado-sesion-admin').innerText = 'Cuenta de administrador creada. Ya puedes iniciar sesión.';
  form.reset();
});

document.getElementById('form-login-admin').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;

  const { error } = await db.auth.signInWithPassword({
    email: form.elements['admin-login-correo'].value,
    password: form.elements['admin-login-password'].value,
  });

  if (error) {
    document.getElementById('estado-sesion-admin').innerText = 'Error al iniciar sesión: ' + error.message;
    return;
  }

  mostrarEstadoSesionAdmin();
});

async function mostrarEstadoSesionAdmin() {
  const { data } = await db.auth.getUser();
  const estado = document.getElementById('estado-sesion-admin');
  const zonaAcceso = document.getElementById('zona-acceso-admin');
  const panelAdmin = document.getElementById('panel-admin');

  if (!data.user) {
    estado.innerText = 'No has iniciado sesión.';
    zonaAcceso.hidden = false;
    panelAdmin.hidden = true;
    return;
  }

  const { data: perfil } = await db.from('admins').select('nombre').eq('id', data.user.id).single();

  if (perfil) {
    zonaAcceso.hidden = true;
    panelAdmin.hidden = false;
    document.getElementById('admin-bienvenida').textContent = 'Sesión iniciada como ' + perfil.nombre;
  } else {
    estado.innerText = 'Sesión iniciada, pero sin perfil de administrador.';
    zonaAcceso.hidden = false;
    panelAdmin.hidden = true;
  }
}

document.getElementById('btn-logout-admin').addEventListener('click', async () => {
  await db.auth.signOut();
  mostrarEstadoSesionAdmin();
});

mostrarEstadoSesionAdmin();


// ---------- TEMPLATE: copia los campos a ambos formularios ----------
const plantillaCampos = document.getElementById('tpl-campos-producto');
document.querySelectorAll('#form-producto .campos, #form-editar .campos').forEach(contenedor => {
  contenedor.appendChild(plantillaCampos.content.cloneNode(true));
});

function leerFormulario(form) {
  return {
    nombre: form.nombre.value.trim(),
    descripcion: form.descripcion.value.trim(),
    precio: Number(form.precio.value),
    unidades: parseInt(form.unidades.value, 10),
    descuento: Number(form.descuento.value),
    disponible: form.disponible.checked,
    categorias: form.categorias.value
      .split(',')
      .map(c => c.trim())
      .filter(c => c !== ''),
    img_url: form.image_url.value.trim()
  };
}

function rellenarFormulario(form, producto) {
  form.nombre.value = producto.nombre ?? '';
  form.descripcion.value = producto.descripcion ?? '';
  form.precio.value = producto.precio ?? 0;
  form.unidades.value = producto.unidades ?? 0;
  form.descuento.value = producto.descuento ?? 0;
  form.disponible.checked = Boolean(producto.disponible);
  form.categorias.value = Array.isArray(producto.categorias) ? producto.categorias.join(', ') : '';
  form.image_url.value = producto.img_url ?? '';
}


document.getElementById('btn-traer').addEventListener('click', async () => {

  // "async" convierte esta función (el listener del clic) en una función
  // ASÍNCRONA: una función que PUEDE usar "await" adentro para esperar
  // algo que tarda, sin congelar el resto de la página mientras espera.
  //
  // Diferencia clave con localStorage (semana 7): localStorage.getItem()
  // y localStorage.setItem() son operaciones SINCRÓNICAS — ocurren al
  // instante, en tu propio computador, sin viajar a ningún lado. Por eso
  // nunca necesitaste "async"/"await" para leer o escribir en
  // localStorage. Una consulta a Supabase, en cambio, viaja por internet
  // hasta el servidor de Supabase y la respuesta tiene que volver — eso
  // toma un tiempo real (aunque sea poco), y JavaScript necesita una
  // forma explícita de decir "espera aquí a que llegue la respuesta".

  // "await" pausa la ejecución DE ESTA FUNCIÓN (no de toda la página)
  // hasta que la consulta a Supabase responda. Mientras tanto, el resto
  // de tu página sigue funcionando con normalidad — solo esta función
  // en particular se detiene en esta línea hasta tener respuesta real.
  const { data, error } = await db.from('productos_practica').select('*');

  // Sin "await" en la línea de arriba, "data" y "error" NO tendrían el
  // resultado todavía — tendrías una "Promise" (promesa) sin resolver,
  // no los datos reales. Eso es justo lo que "await" evita: te obliga
  // a esperar antes de seguir usando el resultado.
  console.log(data, error);


     if (error) {
    // Revisamos "error" ANTES de tocar "data": si la consulta falló,
    // "data" llega como null, y usar null más adelante (ej. null.map())
    // rompería el script. Mismo patrón de "validar antes de operar"
    // que ya usaste en el CRUD de la semana 7.
    document.getElementById('resultado').textContent = 'Error: ' + error.message;
    return;
  }

  const nombres = data.map(producto => producto.nombre);
  console.log(nombres);

  document.getElementById('resultado2').innerHTML =
    '<ul>' + nombres.map(n => `<li>${n}</li>`).join('') + '</ul>';

  const precios = data.map( elemento => elemento.precio);
  console.log(precios);

  document.getElementById('resultado3').innerHTML =
    '<ul>' + precios.map(n => `<li>${n}</li>`).join('') + '</ul>';

});
//Metodos Crud.....


// AHORA (Supabase):
async function agregarProducto(datos) {

  const { data, error } = await db
    .from('productos_practica')  // la tabla
    .insert([datos])             // insert() siempre recibe un ARRAY de objetos,
                                  // aunque insertes uno solo
    .select();                    // .select() le pide a Supabase que te
                                   // devuelva la fila ya creada (con su id
                                   // nuevo) — sin esto, insert() no te
                                   // devuelve nada útil

  if (error) {
    console.log("Error al agregar:", error);
    return null;
  }

  return data[0];   // data siempre es un array — tomamos el primer
                     // elemento, que es la fila recién creada
}


const productoNuevo ={
  nombre: 'mouse inalambrico',
  descripcion: 'Este es un producto de prueba',
  precio: 200.000,
  unidades:  10,
  descuento : 0.1,
  disponible : true,
  categorias : ["tecnologia", "accesorios"],
  img_url: "https://www.exito.com/silla-gamer-fdw-ergonomica-soporte-lumbar-asiento-transpirable-ajustable-105004824-mp/p" 

}
//método Create (agregar)
document.getElementById('btn-agregar-obj').addEventListener('click', async () => {
const respuesta =  await agregarProducto(productoNuevo);
  if (respuesta) {
    document.getElementById('notificacion').innerText = 'Producto agregado con ID: ' + respuesta.id;
  } else {
    document.getElementById('notificacion').innerText = 'Error al agregar producto.';
  }
});

// Formulario: arma el mismo tipo de objeto que productoNuevo, pero con
// los valores que escribe el usuario, y lo manda a agregarProducto().
document.getElementById('form-producto').addEventListener('submit', async (event) => {
  event.preventDefault();   // evita que el navegador recargue la página

  const form = event.target;

  const producto = {
    nombre: form.nombre.value.trim(),
    descripcion: form.descripcion.value.trim(),
    precio: Number(form.precio.value),            // los inputs siempre dan texto
    descuento: Number(form.descuento.value),
    disponible: form.disponible.checked,          // checkbox -> true / false
    categorias: form.categorias.value
      .split(',')                                 // "a, b" -> ["a", " b"]
      .map(c => c.trim())
      .filter(c => c !== ''),
    img_url: form.image_url.value.trim()
  };

  const respuesta = await agregarProducto(producto);
  if (respuesta) {
    document.getElementById('notificacion').innerText = 'Producto agregado con ID: ' + respuesta.id;
    form.reset();
  } else {
    document.getElementById('notificacion').innerText = 'Error al agregar producto.';
  }
});

//método Read (leer)
async function obtenerProductos() {

  const { data, error } = await db
    .from('productos_practica')
    .select('*');

  if (error) {
    console.log("Error al obtener:", error);
    return null;
  }

  return data;   // array con todas las filas de la tabla
}

// Arma una card (un <article>) con los datos de un producto.
// Se usa textContent y no innerHTML para que lo que viene de la base de
// datos se muestre como texto y nunca se ejecute como HTML.
function crearCardProducto(producto) {
  const card = document.createElement('article');
  card.className = 'card-producto';

  // Imagen: si no hay URL, o la URL no carga, se muestra un recuadro de color
  const mostrarSinImagen = () => {
    const vacia = document.createElement('div');
    vacia.className = 'card-img card-img-vacia';
    vacia.textContent = 'Sin imagen';
    card.prepend(vacia);
  };

  if (producto.img_url) {
    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = producto.img_url;
    img.alt = producto.nombre;
    img.addEventListener('error', () => {
      img.remove();
      mostrarSinImagen();
    });
    card.append(img);
  } else {
    mostrarSinImagen();
  }

  const titulo = document.createElement('h3');
  titulo.textContent = producto.nombre;

  const descripcion = document.createElement('p');
  descripcion.className = 'card-descripcion';
  descripcion.textContent = producto.descripcion ?? '';

  const precio = document.createElement('p');
  precio.className = 'card-precio';
  const precioFinal = producto.precio * (1 - (producto.descuento || 0));
  precio.textContent = '$ ' + precioFinal.toLocaleString('es-CO');
  if (producto.descuento > 0) {
    const etiqueta = document.createElement('span');
    etiqueta.className = 'card-descuento';
    etiqueta.textContent = '-' + Math.round(producto.descuento * 100) + '%';
    precio.append(' ', etiqueta);
  }

  const estado = document.createElement('p');
  estado.className = 'card-estado' + (producto.disponible ? '' : ' agotado');
  estado.textContent = (producto.disponible ? 'Disponible' : 'No disponible')
    + (producto.unidades != null ? ' · ' + producto.unidades + ' uds.' : '');

  const idEl = document.createElement('p');
  idEl.className = 'card-id';
  idEl.textContent = 'ID ' + producto.id;

  card.append(titulo, descripcion, precio, estado, idEl);

  const categorias = producto.categorias ?? [];
  if (categorias.length > 0) {
    const lista = document.createElement('ul');
    lista.className = 'card-categorias';
    categorias.forEach(c => {
      const item = document.createElement('li');
      item.textContent = c;
      lista.append(item);
    });
    card.append(lista);
  }

  const acciones = document.createElement('div');
  acciones.className = 'card-acciones';

  const btnEditar = document.createElement('button');
  btnEditar.type = 'button';
  btnEditar.className = 'card-editar';
  btnEditar.textContent = 'Editar';
  btnEditar.addEventListener('click', () => abrirEdicion(producto));

  const btnEliminar = document.createElement('button');
  btnEliminar.type = 'button';
  btnEliminar.className = 'card-eliminar';
  btnEliminar.textContent = 'Eliminar';
  btnEliminar.addEventListener('click', () => abrirEliminacion(producto));

  acciones.append(btnEditar, btnEliminar);
  card.append(acciones);

  return card;
}

document.getElementById('btn-ver-todos').addEventListener('click', async () => {
  const contenedor = document.getElementById('lista-productos');
  contenedor.textContent = 'Cargando productos...';

  const productos = await obtenerProductos();

  if (productos === null) {
    contenedor.textContent = 'Error al cargar los productos.';
    return;
  }

  if (productos.length === 0) {
    contenedor.textContent = 'Todavía no hay productos.';
    return;
  }

  contenedor.replaceChildren(...productos.map(crearCardProducto));
});


// ---------- MODAL EDITAR ----------

let productoEnEdicion = null;

function abrirEdicion(producto) {
  productoEnEdicion = producto;
  const dlg = document.getElementById('dlg-editar');
  const form = document.getElementById('form-editar');
  document.getElementById('titulo-editar').textContent = 'Modificar: ' + producto.nombre;
  document.getElementById('error-editar').textContent = '';
  rellenarFormulario(form, producto);
  dlg.showModal();
}

document.getElementById('form-editar').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!productoEnEdicion) return;

  const boton = document.getElementById('btn-guardar-editar');
  boton.disabled = true;

  const respuesta = await modificarProducto(productoEnEdicion.id, leerFormulario(evento.target));
  boton.disabled = false;

  if (respuesta) {
    document.getElementById('dlg-editar').close();
    document.getElementById('notificacion').innerText = 'Producto ' + respuesta.id + ' modificado.';
    document.getElementById('btn-ver-todos').click();
  } else {
    document.getElementById('error-editar').textContent = 'Error al guardar los cambios.';
  }
});

document.getElementById('btn-cancelar-editar').addEventListener('click', () => {
  document.getElementById('dlg-editar').close();
});


// ---------- MODAL ELIMINAR ----------

let productoAEliminar = null;

function abrirEliminacion(producto) {
  productoAEliminar = producto;
  document.getElementById('texto-eliminar').textContent =
    '¿Eliminar "' + producto.nombre + '" (ID ' + producto.id + ')? Esta acción no se puede deshacer.';
  document.getElementById('error-eliminar').textContent = '';
  document.getElementById('dlg-eliminar').showModal();
}

document.getElementById('btn-confirmar-eliminar').addEventListener('click', async () => {
  if (!productoAEliminar) return;

  const boton = document.getElementById('btn-confirmar-eliminar');
  boton.disabled = true;

  const ok = await eliminarProducto(productoAEliminar.id);
  boton.disabled = false;

  if (ok) {
    document.getElementById('dlg-eliminar').close();
    document.getElementById('notificacion').innerText = 'Producto ' + productoAEliminar.id + ' eliminado.';
    document.getElementById('btn-ver-todos').click();
  } else {
    document.getElementById('error-eliminar').textContent = 'No se pudo eliminar el producto.';
  }
});

document.getElementById('btn-cancelar-eliminar').addEventListener('click', () => {
  document.getElementById('dlg-eliminar').close();
});


// AHORA:
async function buscarProductoPorId(id) {
  const { data, error } = await db
    .from('productos_practica')
    .select('*')
    .eq('id', id)    // eq = "equal" (igual a) — equivalente a find(p => p.id === id)
    .single();         // single() = "espero exactamente una fila, dámela
                        // como objeto, no como array de un elemento"

  if (error) return null;
  return data;
}

async function buscarProductosPorNombre(texto) {
  const { data, error } = await db
    .from('productos_practica')
    .select('*')
    .ilike('nombre', `%${texto}%`);
    // ilike = "like" insensible a mayúsculas/minúsculas.
    // los símbolos % significan "cualquier texto antes/después" —
    // equivalente a .toLowerCase().includes(texto)

  if (error) return [];
  return data;
}


// AHORA (Supabase resuelve "encontrar y actualizar" en una sola instrucción):
async function modificarProducto(id, cambios) {

  const { data, error } = await db
    .from('productos_practica')
    .update(cambios)   // solo actualiza las propiedades que vengan en "cambios"
    .eq('id', id)        // ...de la fila donde el id coincida
    .select();

  if (error) return null;
  return data[0];
}

// AHORA:
async function eliminarProducto(id) {

  const { error } = await db
    .from('productos_practica')
    .delete()
    .eq('id', id);

  return !error;   // true si NO hubo error (se borró bien), false si falló
}