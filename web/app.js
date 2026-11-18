'use strict';

// Demo web del mod "elylang": reproduce el sistema de afinidad, el árbol de
// diálogo y las acciones que el mod implementa en Minecraft.
// Todo el contenido romántico es no explícito (fundido a negro).

const CLAVE_ALMACEN = 'elylang.demo.v1';
const MAX_AFINIDAD = 100;
const MAX_REGISTRO = 40;

const SABOR_ACCION = {
  picar: 'Ely levanta el hacha, golpea la base del tronco y la madera cae a tus pies. Se seca el sudor de la frente y te guiña un ojo: «¿Sigo?».',
  minar: 'Ely abre un túnel recto en la roca y va sacando menas una a una, dejándolas en fila a tus pies como un regalo.',
  proteger: 'Ely se planta delante de ti y abre los brazos: el aire huele a ozono y a flores. Los monstruos retroceden.',
  flor: 'Le entregas una flor del bosque. Ely se la guarda en el pelo sin decir nada, pero no deja de mirarte.',
  caricia: 'Le apartas un mechón de la cara. Ely se queda sin palabras y se apoya un segundo en tu mano.',
  intimidad: 'Ely te toma de la mano y apaga la antorcha. El bosque se queda en silencio; solo se oyen corazones y respiraciones. Al amanecer sigue a tu lado.'
};

// Paleta del skin pixel art de Ely. Cambia según el género elegido.
const SKIN = {
  femenino: { pelo: '#8a5a2b', pelo2: '#6d4520', ropa: '#4f8a5b', ropa2: '#3c6b46', melena: 'largo', lazo: '#ff5f9e' },
  masculino: { pelo: '#4a3323', pelo2: '#35241a', ropa: '#3f6f4a', ropa2: '#2f5538', melena: 'corto', lazo: '#ffcf6b' },
  neutro: { pelo: '#6a5a8a', pelo2: '#514470', ropa: '#5a6f8a', ropa2: '#455a73', melena: 'medio', lazo: '#7fd1ff' }
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

function renderRetrato() {
  const caja = $('#retrato');
  if (!caja) return;

  const genero = generoActual().id;
  const pal = SKIN[genero] || SKIN.neutro;
  const rubor = Math.min(0.9, 0.15 + estado.afinidad / 120);

  let melena = '';
  if (pal.melena === 'largo') {
    melena =
      '<rect x="26" y="42" width="9" height="30" fill="' + pal.pelo + '"/>' +
      '<rect x="61" y="42" width="9" height="30" fill="' + pal.pelo + '"/>' +
      '<rect x="30" y="24" width="36" height="10" fill="' + pal.pelo + '"/>';
  } else if (pal.melena === 'medio') {
    melena =
      '<rect x="28" y="42" width="6" height="20" fill="' + pal.pelo + '"/>' +
      '<rect x="62" y="42" width="6" height="20" fill="' + pal.pelo + '"/>' +
      '<rect x="30" y="24" width="36" height="10" fill="' + pal.pelo + '"/>';
  } else {
    melena = '<rect x="30" y="22" width="36" height="9" fill="' + pal.pelo + '"/>';
  }

  const flequillo =
    '<rect x="31" y="30" width="12" height="5" fill="' + pal.pelo2 + '"/>' +
    '<rect x="47" y="30" width="9" height="5" fill="' + pal.pelo2 + '"/>';

  caja.dataset.genero = genero;
  caja.innerHTML =
    '<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">' +
    '<defs><linearGradient id="cieloEly" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#3a1f30"/><stop offset="1" stop-color="#1a1018"/></linearGradient></defs>' +
    '<rect width="96" height="96" fill="url(#cieloEly)"/>' +
    '<rect x="0" y="74" width="96" height="22" fill="#241a22"/>' +
    '<rect x="8" y="70" width="6" height="6" fill="#3b2b3a"/>' +
    '<rect x="80" y="70" width="6" height="6" fill="#3b2b3a"/>' +
    '<rect x="28" y="62" width="40" height="28" fill="' + pal.ropa + '"/>' +
    '<rect x="28" y="76" width="40" height="14" fill="' + pal.ropa2 + '"/>' +
    '<rect x="24" y="62" width="7" height="20" fill="' + pal.ropa2 + '" class="brazo-izq"/>' +
    '<rect x="65" y="62" width="7" height="20" fill="' + pal.ropa2 + '" class="brazo-der"/>' +
    '<rect x="24" y="80" width="7" height="7" fill="#e8b98f" class="brazo-izq"/>' +
    '<rect x="65" y="80" width="7" height="7" fill="#e8b98f" class="brazo-der"/>' +
    melena +
    '<rect x="44" y="56" width="8" height="7" fill="#d9a97f"/>' +
    '<rect x="32" y="26" width="32" height="31" fill="#e8b98f"/>' +
    '<rect x="32" y="26" width="32" height="6" fill="#f2c9a4"/>' +
    flequillo +
    '<rect x="30" y="22" width="36" height="8" fill="' + pal.pelo + '"/>' +
    '<rect x="37" y="38" width="6" height="7" fill="#2b1d18" class="ojo"/>' +
    '<rect x="53" y="38" width="6" height="7" fill="#2b1d18" class="ojo"/>' +
    '<rect x="38" y="38" width="2" height="2" fill="#ffffff"/>' +
    '<rect x="54" y="38" width="2" height="2" fill="#ffffff"/>' +
    '<rect x="35" y="47" width="9" height="4" fill="#ff7fa8" class="rubor" opacity="' + rubor.toFixed(2) + '"/>' +
    '<rect x="52" y="47" width="9" height="4" fill="#ff7fa8" class="rubor" opacity="' + rubor.toFixed(2) + '"/>' +
    '<rect x="44" y="51" width="8" height="2" fill="#a33b4d"/>' +
    '<rect x="28" y="30" width="4" height="4" fill="' + pal.lazo + '"/>' +
    '</svg>';
}

function corazonesFlotantes(cantidad) {
  const caja = $('#retrato');
  if (!caja) return;
  const total = Math.max(1, Math.min(8, cantidad || 3));
  for (let i = 0; i < total; i++) {
    const corazon = document.createElement('span');
    corazon.className = 'corazon-flotante';
    corazon.textContent = '\u2665';
    corazon.style.left = 12 + Math.random() * 68 + '%';
    corazon.style.animationDelay = i * 260 + 'ms';
    caja.appendChild(corazon);
    window.setTimeout(() => corazon.remove(), 6500 + i * 260);
  }
}

function animarAccion(id, duracion) {
  const retrato = $('#retrato');
  if (!retrato) return;
  const clase = 'act-' + id;
  retrato.classList.remove('act-picar', 'act-minar', 'act-proteger', 'act-flor', 'act-caricia', 'act-intimidad');
  void retrato.offsetWidth;
  retrato.classList.add(clase);
  corazonesFlotantes(id === 'intimidad' ? 8 : 3);
  window.setTimeout(() => retrato.classList.remove(clase), duracion);
}

let bannerTimer = null;

function mostrarBanner(texto, duracion) {
  const banner = $('#banner');
  const etiqueta = $('#bannerTexto');
  const relleno = $('#bannerRelleno');
  if (!banner || !etiqueta || !relleno) return;

  etiqueta.textContent = texto;
  banner.hidden = false;
  banner.classList.add('activo');

  relleno.style.transition = 'none';
  relleno.style.width = '100%';
  void relleno.offsetWidth;
  relleno.style.transition = 'width ' + duracion + 'ms linear';
  relleno.style.width = '0%';

  window.clearTimeout(bannerTimer);
  bannerTimer = window.setTimeout(() => {
    banner.classList.remove('activo');
    banner.hidden = true;
  }, duracion);
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
  actualizarBotonNoche();
  renderRetrato();

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

function actualizarBotonNoche() {
  const boton = $('#btnNoche');
  if (!boton || !datos) return;
  const accion = datos.acciones.find((a) => a.id === 'intimidad');
  if (!accion) return;
  const motivo = motivoBloqueo(accion, Date.now());
  boton.disabled = Boolean(motivo);
  boton.textContent = motivo ? '💗 Pasar la noche con Ely · ' + motivo : '💗 Pasar la noche con Ely';
}

function motivoBloqueo(accion, ahora) {  if (estado.afinidad < (accion.requiere || 0)) {
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

  const duracion = Number(accion.duracion || 6000);
  const relato = SABOR_ACCION[id] || accion.descripcion;
  registrar(accion.nombre + ': ' + relato, 'ely');
  if (real) registrar('Afinidad ' + (real > 0 ? '+' : '') + real + ' ♥', 'sistema');

  mostrarBanner(relato + (real ? '  (+' + real + ' ♥)' : ''), duracion);
  animarAccion(id, duracion);

  if (accion.fundido) {
    fundir(duracion);
  }

  guardar();
  render();
}

function fundir(duracion) {
  const capa = $('#fundido');
  const texto = $('#fundidoTexto');
  const total = Math.max(6000, Number(duracion || 9000));
  texto.textContent =
    'Ely te abraza y el bosque se apaga. La escena se intuye en la oscuridad: respiraciones, ' +
    'corazones flotando y su voz diciendo tu nombre. El mod no muestra imágenes explícitas.';

  capa.classList.add('activo');
  window.setTimeout(() => {
    capa.classList.remove('activo');
    registrar('Amanece. Ely te mira como si fueras lo único importante del mundo.', 'sistema');
    mostrarBanner('Amanece a su lado. Ely te sonríe sin soltarte la mano.', 7000);
    render();
  }, total);
}

function conectarEventos() {
  const btnNoche = $('#btnNoche');
  if (btnNoche) {
    btnNoche.addEventListener('click', () => ejecutarAccion('intimidad'));
  }

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
  window.setInterval(() => {
    renderAcciones();
    actualizarBotonNoche();
  }, 1000);
}

iniciar().catch((err) => {
  const linea = $('#linea');
  if (linea) linea.textContent = 'No se pudo cargar la demo: ' + err.message;
});
