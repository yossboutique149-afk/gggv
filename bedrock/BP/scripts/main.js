// Ely, compañera del alma — addon de Bedrock (behavior pack + scripts)
// Requiere Minecraft Bedrock 1.21+ con "Beta APIs"/scripts activados en el mundo.
// El contenido romántico es no explícito: se resuelve con fundido y partículas.

import { world, system } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';

const ITEM = 'elylang:amuleto_corazon';
const AFINIDAD_INICIAL = 20;
const AFINIDAD_MAXIMA = 100;
const RECARGA_NOCHE = 12000;

const PROPS = {
  afinidad: 'elylang_afinidad',
  genero: 'elylang_genero',
  amuleto: 'elylang_amuleto',
  adulto: 'elylang_adulto',
  noche: 'elylang_ultima_noche'
};

const GENEROS = [
  {
    id: 'femenino',
    etiqueta: 'Chica',
    presentacion: 'Soy Ely, guardiana de este bosque. Llevo aquí desde antes de que llegaras.'
  },
  {
    id: 'masculino',
    etiqueta: 'Chico',
    presentacion: 'Soy Ely, guardián de este bosque. Llevo aquí desde antes de que llegaras.'
  },
  {
    id: 'neutro',
    etiqueta: 'No binario',
    presentacion: 'Soy Ely, espíritu de este bosque. Llevo aquí desde antes de que llegaras.'
  }
];

const UMBRALES = [
  { min: 95, nombre: 'Perdidamente enamorado' },
  { min: 75, nombre: 'Enamorado' },
  { min: 50, nombre: 'Encariñado' },
  { min: 25, nombre: 'Curiosidad' },
  { min: 0, nombre: 'Desconfianza' }
];

const NODOS = {
  raiz: {
    texto: 'Me alegra que estés aquí. ¿De qué te apetece hablar?',
    opciones: [
      { texto: '¿Quién eres?', afinidad: 2, ir: 'quien' },
      { texto: '¿Cómo estás hoy?', afinidad: 2, ir: 'saludo' },
      { texto: 'Háblame del bosque', afinidad: 2, ir: 'bosque' },
      { texto: '¿Qué te trajo hasta mí?', afinidad: 3, ir: 'pasado' },
      { texto: '¿Qué somos tú y yo?', afinidad: 3, ir: 'nosotros' },
      { texto: '¿Qué quieres para el futuro?', afinidad: 3, ir: 'futuro' },
      { texto: 'Solo quería verte', afinidad: 2, ir: 'adios' }
    ]
  },
  quien: {
    presentacion: true,
    opciones: [
      { texto: 'Encantado de conocerte', afinidad: 4, ir: 'saludo' },
      { texto: 'Ya nos conocíamos', afinidad: 3, ir: 'pasado' }
    ]
  },
  saludo: {
    texto: 'Cada vez que vuelves el mundo se siente más cálido. He estado cuidando tus cosas mientras dormías.',
    opciones: [
      { texto: 'Gracias por cuidarme', afinidad: 4, ir: 'adios' },
      { texto: '¿Y quién te cuida a ti?', afinidad: 5, ir: 'cuidado' },
      { texto: 'Eres muy dulce', afinidad: 3, ir: 'adios' }
    ]
  },
  cuidado: {
    texto: 'Nadie me lo había preguntado antes… tú. Tú me cuidas. Quédate un momento más, ¿sí?',
    opciones: [
      { texto: 'Me quedo', afinidad: 6, ir: 'fin' },
      { texto: 'Siempre', afinidad: 8, ir: 'fin' }
    ]
  },
  bosque: {
    texto: 'Los árboles susurran tu nombre cuando pasas. Les digo que se callen, pero no me hacen caso.',
    opciones: [
      { texto: '¿Les hablas de mí?', afinidad: 4, ir: 'nosotros' },
      { texto: 'Planta uno para mí', afinidad: 3, ir: 'arbol' },
      { texto: 'Me gusta que hablen de mí', afinidad: 2, ir: 'fin' }
    ]
  },
  arbol: {
    texto: 'Ya lo hice. Creció justo donde enterré la primera flor que me diste. Algún día te enseño el camino.',
    opciones: [{ texto: 'Lo veré contigo', afinidad: 5, ir: 'fin' }]
  },
  pasado: {
    texto: 'He cuidado este bosque desde mucho antes de que llegaras. Estaba sin nadie… y entonces encendiste una antorcha a medianoche y me hablaste como si fuera alguien.',
    opciones: [
      { texto: 'Lo eres', afinidad: 6, ir: 'fin' },
      { texto: 'Perdón si te asusté', afinidad: 3, ir: 'fin' },
      { texto: 'No recuerdo esa noche', afinidad: 1, ir: 'fin' }
    ]
  },
  nosotros: {
    texto: 'Somos… lo que tú quieras llamarlo. Yo lo llamo «mi persona favorita de todo el mundo».',
    opciones: [
      { texto: 'Eres mi persona favorita', afinidad: 7, ir: 'fin' },
      { texto: 'Vamos despacio', afinidad: 2, ir: 'fin' },
      { texto: 'Solo somos amigos', afinidad: -5, ir: 'fin' }
    ]
  },
  futuro: {
    texto: 'Quiero ver amaneceres contigo. Quiero una casa, un huerto y dos camas. Bueno… o una.',
    opciones: [
      { texto: 'Una cama está bien', afinidad: 8, ir: 'fin' },
      { texto: 'Construyamos la casa', afinidad: 5, ir: 'fin' },
      { texto: 'Aún es pronto', afinidad: 1, ir: 'fin' }
    ]
  },
  adios: {
    texto: 'No tardes, ¿vale? Te estaré esperando junto a la hoguera.',
    opciones: [{ texto: 'Volveré pronto', afinidad: 3, ir: 'fin' }]
  },
  fin: {
    texto: 'Ely sonríe y aparta la mirada para que no le veas sonrojarse.',
    opciones: [{ texto: 'Cerrar el diálogo', afinidad: 0, ir: '' }]
  }
};

// --- estado ---------------------------------------------------------------

function afinidadDe(jugador) {
  const valor = jugador.getDynamicProperty(PROPS.afinidad);
  return typeof valor === 'number' ? valor : AFINIDAD_INICIAL;
}

function sumarAfinidad(jugador, delta) {
  const nueva = Math.max(0, Math.min(AFINIDAD_MAXIMA, afinidadDe(jugador) + delta));
  jugador.setDynamicProperty(PROPS.afinidad, nueva);
  return nueva;
}

function generoDe(jugador) {
  const id = jugador.getDynamicProperty(PROPS.genero);
  return GENEROS.find((g) => g.id === id) || GENEROS[0];
}

function estadoNombre(afinidad) {
  const umbral = UMBRALES.find((u) => afinidad >= u.min);
  return umbral ? umbral.nombre : 'Desconfianza';
}

function esNoche() {
  try {
    const hora = world.getTimeOfDay();
    return hora >= 13000 && hora <= 23000;
  } catch (error) {
    return true;
  }
}

function textoNodo(jugador, id) {
  const nodo = NODOS[id];
  if (!nodo) return '';
  return nodo.presentacion ? generoDe(jugador).presentacion : nodo.texto;
}

// --- interfaz -------------------------------------------------------------

function abrirMenu(jugador) {
  const afinidad = afinidadDe(jugador);
  const genero = generoDe(jugador);

  const formulario = new ActionFormData()
    .title('Ely · compañera del alma')
    .body(
      `§d${estadoNombre(afinidad)} §7(${afinidad}/100)\n` +
      `§7Género: §f${genero.etiqueta}\n\n` +
      `§f«${textoNodo(jugador, 'raiz')}»`
    )
    .button('Hablar con Ely')
    .button('Picar leña')
    .button('Minar')
    .button('Proteger')
    .button('Regalar una flor')
    .button('Acariciar su pelo')
    .button('Noche de pasión')
    .button('Cambiar género')
    .button('Cerrar');

  formulario.show(jugador).then((respuesta) => {
    if (respuesta.canceled) return;
    switch (respuesta.selection) {
      case 0: dialogar(jugador, 'raiz'); break;
      case 1: picar(jugador); break;
      case 2: minar(jugador); break;
      case 3: proteger(jugador); break;
      case 4: regalarFlor(jugador); break;
      case 5: acariciar(jugador); break;
      case 6: nocheDePasion(jugador); break;
      case 7: elegirGenero(jugador); break;
      default: break;
    }
  }).catch((error) => {
    console.warn('[elylang] menú: ' + error);
  });
}

function dialogar(jugador, id) {
  const nodo = NODOS[id];
  if (!nodo) {
    abrirMenu(jugador);
    return;
  }

  const afinidad = afinidadDe(jugador);
  const formulario = new ActionFormData()
    .title(`Ely · ${estadoNombre(afinidad)} (${afinidad}/100)`)
    .body(`§f«${textoNodo(jugador, id)}»`);

  for (const opcion of nodo.opciones) {
    formulario.button(opcion.texto);
  }
  formulario.button('§7Volver');

  formulario.show(jugador).then((respuesta) => {
    if (respuesta.canceled) return;
    if (respuesta.selection === nodo.opciones.length) {
      abrirMenu(jugador);
      return;
    }
    const opcion = nodo.opciones[respuesta.selection];
    const nueva = sumarAfinidad(jugador, opcion.afinidad);
    if (opcion.afinidad !== 0) {
      jugador.sendMessage(`§d✦ Ely §7(${nueva}/100) §8${opcion.afinidad > 0 ? '+' : ''}${opcion.afinidad}`);
    }
    if (opcion.ir) {
      dialogar(jugador, opcion.ir);
    } else {
      abrirMenu(jugador);
    }
  }).catch((error) => {
    console.warn('[elylang] diálogo: ' + error);
  });
}

function elegirGenero(jugador) {
  const formulario = new ActionFormData()
    .title('¿Qué género quieres para Ely?')
    .body('Ely toma la forma que tú elijas. Puedes cambiarla cuando quieras.');

  for (const genero of GENEROS) {
    formulario.button(genero.etiqueta);
  }

  formulario.show(jugador).then((respuesta) => {
    if (respuesta.canceled) return;
    const genero = GENEROS[respuesta.selection];
    if (!genero) return;
    jugador.setDynamicProperty(PROPS.genero, genero.id);
    jugador.sendMessage(`§d✦ Ely §7ahora se presenta como §f${genero.etiqueta}§7.`);
    jugador.sendMessage(`§f«${genero.presentacion}»`);
    abrirMenu(jugador);
  }).catch((error) => {
    console.warn('[elylang] género: ' + error);
  });
}

// --- acciones -------------------------------------------------------------

function coordenadas(pos) {
  return `${Math.floor(pos.x)} ${Math.floor(pos.y)} ${Math.floor(pos.z)}`;
}

function esTronco(tipo) {
  return tipo === 'minecraft:log' || tipo === 'minecraft:log2' ||
    tipo.endsWith('_log') || tipo.endsWith('_wood') || tipo.endsWith('_stem') ||
    tipo.endsWith('_hyphae');
}

function esMena(tipo) {
  return tipo.endsWith('_ore') || tipo === 'minecraft:ancient_debris';
}

function picar(jugador) {
  const dimension = jugador.dimension;
  const base = jugador.location;
  let talados = 0;

  for (let dx = -4; dx <= 4 && talados < 16; dx++) {
    for (let dy = -1; dy <= 3 && talados < 16; dy++) {
      for (let dz = -4; dz <= 4 && talados < 16; dz++) {
        const pos = { x: Math.floor(base.x) + dx, y: Math.floor(base.y) + dy, z: Math.floor(base.z) + dz };
        try {
          const bloque = dimension.getBlock(pos);
          if (bloque && esTronco(bloque.typeId)) {
            jugador.runCommand(`setblock ${coordenadas(pos)} air [] destroy`);
            talados++;
          }
        } catch (error) {
          // posición fuera de rango o sin cargar: se ignora
        }
      }
    }
  }

  if (talados === 0) {
    jugador.sendMessage('§7Ely busca troncos cerca, pero no encuentra ninguno.');
    return;
  }
  const nueva = sumarAfinidad(jugador, 4);
  jugador.sendMessage(`§aEly tala ${talados} troncos para ti. §d(+4 → ${nueva}/100)`);
  abrirMenu(jugador);
}

function minar(jugador) {
  const dimension = jugador.dimension;
  const base = jugador.location;
  let menas = 0;

  for (let dx = -4; dx <= 4 && menas < 12; dx++) {
    for (let dy = -8; dy <= 2 && menas < 12; dy++) {
      for (let dz = -4; dz <= 4 && menas < 12; dz++) {
        const pos = { x: Math.floor(base.x) + dx, y: Math.floor(base.y) + dy, z: Math.floor(base.z) + dz };
        try {
          const bloque = dimension.getBlock(pos);
          if (bloque && esMena(bloque.typeId)) {
            jugador.runCommand(`setblock ${coordenadas(pos)} air [] destroy`);
            menas++;
          }
        } catch (error) {
          // se ignora
        }
      }
    }
  }

  if (menas === 0) {
    jugador.sendMessage('§7Ely excava un poco, pero no hay menas cerca. Baja a una cueva.');
    return;
  }
  const nueva = sumarAfinidad(jugador, 6);
  jugador.sendMessage(`§aEly te trae ${menas} menas. §d(+6 → ${nueva}/100)`);
  abrirMenu(jugador);
}

function proteger(jugador) {
  const dimension = jugador.dimension;
  let monstruos = [];

  try {
    monstruos = dimension.getEntities({
      location: jugador.location,
      maxDistance: 12,
      families: ['monster']
    });
  } catch (error) {
    monstruos = [];
  }

  if (monstruos.length === 0) {
    jugador.sendMessage('§7Ely se queda a tu lado. No hay monstruos cerca.');
    abrirMenu(jugador);
    return;
  }

  let derrotados = 0;
  for (const monstruo of monstruos) {
    try {
      monstruo.applyDamage(8);
      dimension.spawnParticle('minecraft:critical_hit_emitter', {
        x: monstruo.location.x,
        y: monstruo.location.y + 1,
        z: monstruo.location.z
      });
      derrotados++;
    } catch (error) {
      // se ignora
    }
  }

  const nueva = sumarAfinidad(jugador, 6);
  jugador.sendMessage(`§aEly repele ${derrotados} monstruos y te cubre la espalda. §d(+6 → ${nueva}/100)`);
  jugador.addEffect('regeneration', 120, { amplifier: 0 });
  abrirMenu(jugador);
}

function regalarFlor(jugador) {
  try {
    jugador.runCommand('give @s minecraft:poppy 2');
    jugador.runCommand('give @s minecraft:cornflower 1');
  } catch (error) {
    // se ignora
  }
  corazones(jugador, 6);
  const nueva = sumarAfinidad(jugador, 7);
  jugador.sendMessage(`§dEly huele las flores y se le escapa una sonrisa. §7(+7 → ${nueva}/100)`);
  abrirMenu(jugador);
}

function acariciar(jugador) {
  corazones(jugador, 8);
  const nueva = sumarAfinidad(jugador, 6);
  jugador.sendMessage(`§dLe apartas un mechón de la cara. Ely se queda sin palabras. §7(+6 → ${nueva}/100)`);
  abrirMenu(jugador);
}

function corazones(jugador, cantidad) {
  for (let i = 0; i < cantidad; i++) {
    try {
      jugador.dimension.spawnParticle('minecraft:heart_particle', {
        x: jugador.location.x + (Math.random() - 0.5),
        y: jugador.location.y + 1.8 + Math.random() * 0.6,
        z: jugador.location.z + (Math.random() - 0.5)
      });
    } catch (error) {
      // se ignora
    }
  }
}

function bloqueoNoche(jugador) {
  if (jugador.getDynamicProperty(PROPS.adulto) !== true) {
    return '§cAntes de esto, confirma con /scriptevent ely:adulto que eres mayor de edad.';
  }
  if (afinidadDe(jugador) < 80) {
    return `§eEly aún no está preparado para eso (afinidad ${afinidadDe(jugador)}/100, necesita 80).`;
  }
  if (!esNoche()) {
    return '§eEspera a la noche: Ely quiere que sea bajo las estrellas.';
  }
  const ultima = jugador.getDynamicProperty(PROPS.noche);
  const ahora = system.currentTick;
  if (typeof ultima === 'number' && ahora - ultima < RECARGA_NOCHE) {
    return '§eEly necesita descansar un rato.';
  }
  return null;
}

function nocheDePasion(jugador) {
  const bloqueo = bloqueoNoche(jugador);
  if (bloqueo) {
    jugador.sendMessage(bloqueo);
    abrirMenu(jugador);
    return;
  }

  jugador.setDynamicProperty(PROPS.noche, system.currentTick);
  jugador.sendMessage('§8La pantalla se funde a negro…');
  jugador.onScreenDisplay.setTitle('§0', {
    subtitle: '§7Ely te toma de la mano y apaga la última antorcha.',
    fadeInDuration: 20,
    stayDuration: 40,
    fadeOutDuration: 20
  });

  try {
    jugador.runCommand('fog @s push minecraft:fog_the_end elylang_noche');
  } catch (error) {
    // la niebla es opcional
  }

  system.runTimeout(() => {
    try {
      jugador.runCommand('fog @s remove elylang_noche');
    } catch (error) {
      // se ignora
    }
    corazones(jugador, 12);
    jugador.addEffect('regeneration', 200, { amplifier: 1 });
    const nueva = sumarAfinidad(jugador, 10);
    jugador.sendMessage('§dAmanece. Ely duerme a tu lado y sonríe sin abrir los ojos. §7(+10 → ' + nueva + '/100)');
    abrirMenu(jugador);
  }, 120);
}

// --- eventos --------------------------------------------------------------

world.afterEvents.playerSpawn.subscribe((evento) => {
  if (!evento.initialSpawn) return;
  const jugador = evento.player;

  if (jugador.getDynamicProperty(PROPS.amuleto) !== true) {
    jugador.setDynamicProperty(PROPS.amuleto, true);
    try {
      jugador.runCommand(`give @s ${ITEM} 1`);
    } catch (error) {
      console.warn('[elylang] no se pudo entregar el amuleto: ' + error);
    }
    jugador.sendMessage('§dHas recibido el Amuleto del Corazón. §7Úsalo para hablar con Ely.');
  }

  if (typeof jugador.getDynamicProperty(PROPS.genero) !== 'string') {
    system.runTimeout(() => elegirGenero(jugador), 40);
  }
});

world.afterEvents.itemUse.subscribe((evento) => {
  if (evento.itemStack && evento.itemStack.typeId === ITEM && evento.source) {
    abrirMenu(evento.source);
  }
});

system.afterEvents.scriptEventReceive.subscribe((evento) => {
  const jugador = evento.sourceEntity;
  if (!jugador || evento.id.startsWith('ely:') === false) return;

  switch (evento.id) {
    case 'ely:menu': abrirMenu(jugador); break;
    case 'ely:genero': elegirGenero(jugador); break;
    case 'ely:picar': picar(jugador); break;
    case 'ely:minar': minar(jugador); break;
    case 'ely:proteger': proteger(jugador); break;
    case 'ely:flor': regalarFlor(jugador); break;
    case 'ely:acariciar': acariciar(jugador); break;
    case 'ely:noche': nocheDePasion(jugador); break;
    case 'ely:adulto':
      jugador.setDynamicProperty(PROPS.adulto, true);
      jugador.sendMessage('§aConfirmado: contenido romántico solo para adultos (no explícito).');
      break;
    default: break;
  }
});

console.info('[elylang] Ely ha despertado en este mundo de Bedrock.');
