'use strict';

// Build de la demo web: valida la sintaxis del JS, comprueba que el árbol de
// diálogo no tenga enlaces rotos y copia web/ a dist/.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const webDir = path.join(root, 'web');
const distDir = path.join(root, 'dist');

function fail(msg) {
  console.error('BUILD FALLÓ: ' + msg);
  process.exit(1);
}

if (!fs.existsSync(webDir)) fail('no existe web/');

for (const file of fs.readdirSync(webDir)) {
  if (file.endsWith('.js')) {
    const full = path.join(webDir, file);
    try {
      execFileSync(process.execPath, ['--check', full], { stdio: 'pipe' });
    } catch (err) {
      fail('sintaxis inválida en ' + file + '\n' + (err.stderr ? err.stderr.toString() : err.message));
    }
  }
}

const dataPath = path.join(webDir, 'data', 'dialogos.json');
if (!fs.existsSync(dataPath)) fail('falta web/data/dialogos.json');
let data;
try {
  data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (err) {
  fail('dialogos.json no es JSON válido: ' + err.message);
}

const ids = Object.keys(data.nodos || {});
if (ids.length === 0) fail('el árbol de diálogo está vacío');
if (!Array.isArray(data.acciones) || data.acciones.length === 0) fail('no hay acciones definidas');

for (const [id, nodo] of Object.entries(data.nodos)) {
  if (!nodo.texto) fail('el nodo ' + id + ' no tiene texto');
  if (!Array.isArray(nodo.opciones) || nodo.opciones.length === 0) fail('el nodo ' + id + ' no tiene opciones');
  for (const op of nodo.opciones) {
    if (!op.texto) fail('una opción de ' + id + ' no tiene texto');
    if (op.ir && !data.nodos[op.ir]) fail('nodo destino inexistente: "' + op.ir + '" desde "' + id + '"');
    if (typeof op.afinidad !== 'number') fail('la opción "' + op.texto + '" de ' + id + ' no tiene afinidad numérica');
  }
}

if (!data.nodos[data.nodoInicial]) fail('nodoInicial no existe: ' + data.nodoInicial);

for (const accion of data.acciones) {
  if (!accion.id || !accion.nombre) fail('acción sin id o nombre');
  if (typeof accion.afinidad !== 'number') fail('la acción ' + accion.id + ' no tiene afinidad numérica');
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.cpSync(webDir, distDir, { recursive: true });

console.log(
  'Build OK · ' + ids.length + ' nodos, ' + data.acciones.length + ' acciones, nodo inicial "' + data.nodoInicial + '" → dist/'
);
