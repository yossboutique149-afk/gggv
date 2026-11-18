'use strict';

// Demo web del mod "elylang": reproduce el sistema de afinidad, el árbol de
// diálogo y las acciones que el mod implementa en Minecraft.
// Todo el contenido romántico es no explícito (fundido a negro).

const CLAVE_ALMACEN = 'elylang.demo.v1';
const MAX_AFINIDAD = 100;
const MAX_REGISTRO = 40;

const SABOR_ACCION = {
  picar: 'Ely golpea la base de los troncos y la madera cae a tus pies.',
  minar: 'Ely abre un túnel corto y te pasa un puñado de menas.',
  proteger: 'Ely se planta delante de ti: el aire huele a ozono y a flores.',
  flor: 'Le entregas una flor. Ely se la guarda en el pelo sin decir nada.',
  caricia: 'Le apartas un mechón de la cara. Ely se queda sin palabras.',
  intimidad: 'La pantalla se funde a negro. No se muestra nada explícito.'
};

let datos = null;
let estado = null;

function $(sel) {
  return document.querySelector(sel);
}

function estadoPorDefecto() {
  return {
    afinidad: 20,
    adulto: false,
    noche: false,
    nodo: null,
    genero: null,
    recargas: {},
    registro: []
  };
}

function limitar(valor, min, max) {
  return Math.max(min, Math.min(max, valor));
}

function leerEstado() {
  const base = estadoPorDefecto();
  let guardado = null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_ALMACEN);
    if (crudo) guardado = JSON.parse(crudo);
  } catch (err) {
    guardado = null;
  }
  if (!guardado || typeof guardado !== 'object') return base;

  return {
    afinidad: limitar(Number(guardado.afinidad) || 0, 0, MAX_AFINIDAD),
    adulto: Boolean(guardado.adulto),
    noche: Boolean(guardado.noche),
    nodo: typeof guardado.nodo === 'string' ? guardado.nodo : null,
    genero: typeof guardado.genero === 'string' ? guardado.genero : null,
    recargas: guardado.recargas && typeof guardado.recargas === 'object' ? guardado.recargas : {},
    registro: Array.isArray(guardado.registro) ? guardado.registro.slice(0, MAX_REGISTRO) : []
  };
}

function guardar() {
  try {
    window.localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(estado));
  } catch (err) {
    /* almacenamiento no disponible: la demo sigue funcionando en memoria */
  }
}

function umbralActual() {
  const umbrales = datos.umbrales;
  let actual = umbrales[0];
  for (const u of umbrales) {
    if (estado.afinidad >= u.min) actual = u;
  }
  return actual;
}

function registrar(texto, tipo) {
  estado.registro.unshift({ texto, tipo: tipo || 'sistema' });
  if (estado.registro.length > MAX_REGISTRO) estado.registro.length = MAX_REGISTRO;
  guardar();
}

function generoActual() {
  const lista = datos.generos || [];
  const elegido = lista.find((g) => g.id === estado.genero);
  if (elegido) return elegido;
  const porDefecto = lista.find((g) => g.id === datos.generoPorDefecto);
  return porDefecto || { id: 'neutro', etiqueta: 'No binario', presentacion: 'Soy Ely, espíritu de este bosque.' };
}

function textoNodo(nodo) {
  if (!nodo) return '';
  if (nodo.presentacion) return generoActual().presentacion;
  return nodo.texto;
}

function sumarAfinidad(delta) {
  const antes = estado.afinidad;
  estado.afinidad = limitar(estado.afinidad + delta, 0, MAX_AFINIDAD);
  const real = estado.afinidad - antes;
  if (real > 0) latir();
  return real;
}

function latir() {
  const retrato = $('#retrato');
  if (!retrato) return;
  retrato.classList.remove('latido');
  void retrato.offsetWidth;
  retrato.classList.add('latido');
}

function renderFicha() {
  const umbral = umbralActual();
  $('#estadoAfectivo').textContent = umbral.nombre;
  $('#estadoAfectivo').style.color = umbral.color;

  const relleno = $('#barraRelleno');
  relleno.style.width = estado.afinidad + '%';
  relleno.style.background = 'linear-gradient(90deg, #7fd1ff, ' + umbral.color + ')';

  const barra = $('#barra');
  barra.setAttribute('aria-valuenow', String(estado.afinidad));

  $('#etiquetaAfinidad').textContent = 'Afinidad ' + estado.afinidad + '/' + MAX_AFINIDAD;

  const llenos = Math.round(estado.afinidad / 10);
  let corazones = '';
  for (let i = 0; i < 10; i++) {
    corazones += i < llenos ? '\u2665' : '<span class="vacio">\u2665</span>';
  }
  $('#corazones').innerHTML = corazones;

  $('#btnHora').textContent = estado.noche ? '🌙 Es de noche' : '☀️ Es de día';
  $('#chkAdulto').checked = estado.adulto;

  const contenedorGeneros = $('#generos');
  if (contenedorGeneros) {
    const actual = generoActual();
    contenedorGeneros.innerHTML = '';
    (datos.generos || []).forEach((genero) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'boton genero' + (genero.id === actual.id ? ' activo' : '');
      boton.dataset.genero = genero.id;
      boton.textContent = genero.etiqueta;
      boton.setAttribute('aria-pressed', genero.id === actual.id ? 'true' : 'false');
      boton.addEventListener('click', () => {
        estado.genero = genero.id;
        registrar('Decides que Ely sea ' + genero.etiqueta.toLowerCase() + '. ' + genero.presentacion, 'sistema');
        guardar();
        render();
      });
      contenedorGeneros.appendChild(boton);
    });
  }
}

function renderDialogo() {
  const nodo = datos.nodos[estado.nodo] || datos.nodos[datos.nodoInicial];
  estado.nodo = estado.nodo in datos.nodos ? estado.nodo : datos.nodoInicial;

  $('#linea').textContent = '«' + textoNodo(nodo) + '»';

  const contenedor = $('#opciones');
  contenedor.innerHTML = '';
  nodo.opciones.forEach((opcion, indice) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'opcion';
    boton.dataset.indice = String(indice);

    const texto = document.createElement('span');
    texto.textContent = opcion.texto;
    boton.appendChild(texto);

    const delta = document.createElement('span');
    const valor = opcion.afinidad || 0;
    delta.className = 'delta' + (valor < 0 ? ' negativo' : '');
    delta.textContent = (valor > 0 ? '+' : '') + valor + ' ♥';
    boton.appendChild(delta);

    boton.addEventListener('click', () => elegir(indice));
    contenedor.appendChild(boton);
  });
}

function renderAcciones() {
  const contenedor = $('#acciones');
  contenedor.innerHTML = '';
  const ahora = Date.now();

  datos.acciones.forEach((accion) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'accion';
    boton.dataset.accion = accion.id;

    const titulo = document.createElement('span');
    titulo.className = 'titulo-accion';
    titulo.textContent = (accion.icono ? accion.icono + ' ' : '') + accion.nombre;
    boton.appendChild(titulo);

    const detalle = document.createElement('span');
    detalle.className = 'detalle';
    detalle.textContent = accion.descripcion;
    boton.appendChild(detalle);

    const motivo = motivoBloqueo(accion, ahora);
    if (motivo) {
      const aviso = document.createElement('span');
      aviso.className = 'requisito';
      aviso.textContent = motivo;
      boton.appendChild(aviso);
      boton.disabled = true;
    }

    boton.addEventListener('click', () => ejecutarAccion(accion.id));
    contenedor.appendChild(boton);
  });
}

function motivoBloqueo(accion, ahora) {
  if (estado.afinidad < (accion.requiere || 0)) {
    return 'Necesita afinidad ' + accion.requiere + ' (tienes ' + estado.afinidad + ')';
  }
  if (accion.requiereNoche && !estado.noche) {
    return 'Solo de noche: pulsa el botón de la hora';
  }
  if (accion.requiereAdulto && !estado.adulto) {
    return 'Marca la casilla de mayoría de edad';
  }
  const hasta = Number(estado.recargas[accion.id] || 0);
  if (ahora < hasta) {
    return 'Ely necesita ' + Math.ceil((hasta - ahora) / 1000) + ' s';
  }
  return '';
}

function renderRegistro() {
  const lista = $('#registro');
  lista.innerHTML = '';
  estado.registro.forEach((entrada) => {
    const li = document.createElement('li');
    li.className = entrada.tipo;
    li.textContent = entrada.texto;
    lista.appendChild(li);
  });
}

function render() {
  renderFicha();
  renderDialogo();
  renderAcciones();
  renderRegistro();
}

function elegir(indice) {
  const nodo = datos.nodos[estado.nodo];
  if (!nodo) return;
  const opcion = nodo.opciones[indice];
  if (!opcion) return;

  const real = sumarAfinidad(opcion.afinidad || 0);
  registrar('Tú: ' + opcion.texto + (real ? ' (' + (real > 0 ? '+' : '') + real + ' ♥)' : ''), 'jugador');

  if (opcion.ir === '') {
    estado.nodo = datos.nodoInicial;
    registrar('Cierras el diálogo. Ely sigue ahí, por si vuelves.', 'sistema');
  } else {
    estado.nodo = opcion.ir;
    const siguiente = datos.nodos[opcion.ir];
    if (siguiente) registrar('Ely: ' + textoNodo(siguiente), 'ely');
  }

  guardar();
  render();
}

function ejecutarAccion(id) {
  const accion = datos.acciones.find((a) => a.id === id);
  if (!accion) return;

  const motivo = motivoBloqueo(accion, Date.now());
  if (motivo) {
    registrar('No puedes: ' + motivo, 'aviso');
    render();
    return;
  }

  const real = sumarAfinidad(accion.afinidad || 0);
  estado.recargas[id] = Date.now() + (accion.recarga || 0) * 1000;
  registrar(accion.nombre + ': ' + (SABOR_ACCION[id] || accion.descripcion), 'ely');
  if (real) registrar('Afinidad ' + (real > 0 ? '+' : '') + real + ' ♥', 'sistema');

  if (accion.fundido) {
    fundir();
  }

  guardar();
  render();
}

function fundir() {
  const capa = $('#fundido');
  const texto = $('#fundidoTexto');
  texto.textContent =
    'La pantalla se funde a negro. Ely te abraza y el mundo se queda en silencio un rato. ' +
    'No se muestra nada explícito: el mod solo deja corazones flotando y una frase cariñosa al despertar.';

  capa.classList.add('activo');
  window.setTimeout(() => {
    capa.classList.remove('activo');
    registrar('Amanece. Ely te mira como si fueras lo único importante del mundo.', 'sistema');
    render();
  }, 4200);
}

function conectarEventos() {
  $('#btnHora').addEventListener('click', () => {
    estado.noche = !estado.noche;
    registrar(estado.noche ? 'Cae la noche sobre el bosque.' : 'Amanece sobre el bosque.', 'sistema');
    guardar();
    render();
  });

  $('#btnReiniciar').addEventListener('click', () => {
    estado = estadoPorDefecto();
    estado.nodo = datos.nodoInicial;
    registrar('Empiezas de cero. Ely vuelve a mirarte con desconfianza.', 'sistema');
    guardar();
    render();
  });

  $('#chkAdulto').addEventListener('change', (evento) => {
    estado.adulto = evento.target.checked;
    guardar();
    render();
  });
}

async function iniciar() {
  const respuesta = await fetch('data/dialogos.json', { cache: 'no-store' });
  datos = await respuesta.json();

  estado = leerEstado();
  if (!estado.nodo || !datos.nodos[estado.nodo]) estado.nodo = datos.nodoInicial;
  if (!estado.genero) estado.genero = datos.generoPorDefecto;

  conectarEventos();

  if (estado.registro.length === 0) {
    registrar(
      'Recibes el Amuleto del Corazón. ' + generoActual().presentacion + ' Te mira fijamente.',
      'sistema'
    );
  }

  render();
  window.setInterval(renderAcciones, 1000);
}

iniciar().catch((err) => {
  const linea = $('#linea');
  if (linea) linea.textContent = 'No se pudo cargar la demo: ' + err.message;
});
