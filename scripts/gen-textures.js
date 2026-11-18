'use strict';

// Genera las texturas PNG del mod (pixel art) sin dependencias externas.
// Uso: node scripts/gen-textures.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const TABLA_CRC = (() => {
  const tabla = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tabla[n] = c;
  }
  return tabla;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    c = TABLA_CRC[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length, 0);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo), 0);
  return Buffer.concat([largo, cuerpo, crc]);
}

function png(ancho, alto, pixeles) {
  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(ancho, 0);
  cabecera.writeUInt32BE(alto, 4);
  cabecera[8] = 8; // bits por canal
  cabecera[9] = 6; // RGBA
  const filas = [];
  for (let y = 0; y < alto; y++) {
    const fila = Buffer.alloc(1 + ancho * 4);
    fila[0] = 0; // sin filtro
    for (let x = 0; x < ancho; x++) {
      const i = (y * ancho + x) * 4;
      fila[1 + x * 4] = pixeles[i];
      fila[2 + x * 4] = pixeles[i + 1];
      fila[3 + x * 4] = pixeles[i + 2];
      fila[4 + x * 4] = pixeles[i + 3];
    }
    filas.push(fila);
  }
  const datos = zlib.deflateSync(Buffer.concat(filas), { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', cabecera),
    chunk('IDAT', datos),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Paleta del pixel art
const COLORES = {
  '.': [0, 0, 0, 0],
  R: [214, 32, 78, 255],
  D: [138, 16, 54, 255],
  H: [255, 150, 190, 255],
  G: [242, 197, 102, 255],
  F: [30, 26, 25, 255]
};

const CORAZON = [
  '................',
  '................',
  '..DDD.....DDD...',
  '.DRRRD...DRRRD..',
  '.DRHRRD.DRRRRD..',
  '.DRHRRRDRRRRRD..',
  '.DRRRRRRRRRRRD..',
  '.DRRRRRRRRRRRD..',
  '..DRRRRRRRRRD...',
  '..DRRRRRRRRRD...',
  '...DRRRRRRRD....',
  '....DRRRRRD.....',
  '.....DRRRD......',
  '......DRD.......',
  '.......D........',
  '................'
];

function dibujar(escala, fondo) {
  const lado = 16 * escala;
  const pixeles = new Uint8Array(lado * lado * 4);
  if (fondo) {
    for (let i = 0; i < lado * lado; i++) {
      pixeles[i * 4] = fondo[0];
      pixeles[i * 4 + 1] = fondo[1];
      pixeles[i * 4 + 2] = fondo[2];
      pixeles[i * 4 + 3] = 255;
    }
  }
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const color = COLORES[CORAZON[y][x]] || COLORES['.'];
      if (color[3] === 0) {
        continue;
      }
      for (let dy = 0; dy < escala; dy++) {
        for (let dx = 0; dx < escala; dx++) {
          const px = x * escala + dx;
          const py = y * escala + dy;
          const i = (py * lado + px) * 4;
          pixeles[i] = color[0];
          pixeles[i + 1] = color[1];
          pixeles[i + 2] = color[2];
          pixeles[i + 3] = color[3];
        }
      }
    }
  }
  return { lado, pixeles };
}

const raiz = path.join(__dirname, '..');
const itemDir = path.join(raiz, 'mod/src/main/resources/assets/elylang/textures/item');
const assetsDir = path.join(raiz, 'mod/src/main/resources/assets/elylang');
fs.mkdirSync(itemDir, { recursive: true });

const item = dibujar(1, null);
fs.writeFileSync(path.join(itemDir, 'amuleto_corazon.png'), png(item.lado, item.lado, item.pixeles));

const icono = dibujar(8, COLORES.F);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), png(icono.lado, icono.lado, icono.pixeles));

console.log('Texturas generadas: textures/item/amuleto_corazon.png (16x16) e icon.png (128x128)');
