#!/usr/bin/env node
// Comprobación funcional de la demo web (sin framework de tests).
// Arranca server.js en un puerto libre, recorre el flujo del jugador y sale con
// código 1 si algo no se cumple. Uso: node scripts/e2e-demo.mjs
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CANDIDATOS_PLAYWRIGHT = [
  process.env.PLAYWRIGHT_PATH,
  '/opt/appjet/browser/node_modules/playwright/index.js',
  'playwright',
].filter(Boolean);

const CANDIDATOS_CHROMIUM = [
  process.env.CHROMIUM_PATH,
  '/opt/appjet/browser-binaries/chromium-1234/chrome-linux64/chrome',
  '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
].filter(Boolean);

const PUERTO = Number(process.env.E2E_PORT || 3311);
const BASE = `http://127.0.0.1:${PUERTO}`;
const fallos = [];

function comprobar(condicion, mensaje) {
  if (condicion) {
    console.log('  ok    ' + mensaje);
  } else {
    fallos.push(mensaje);
    console.log('  FALLO ' + mensaje);
  }
}

function cargarPlaywright() {
  for (const candidato of CANDIDATOS_PLAYWRIGHT) {
    try {
      return require(candidato);
    } catch {
      /* siguiente candidato */
    }
  }
  throw new Error('No se encontró Playwright: define PLAYWRIGHT_PATH.');
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const servidor = spawn('node', ['server.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PUERTO) },
  stdio: 'ignore',
});

let navegador;
try {
  const { chromium } = cargarPlaywright();
  const ejecutable = CANDIDATOS_CHROMIUM.find((ruta) => existsSync(ruta));

  // Esperar a que el servidor responda.
  for (let intento = 0; intento < 40; intento++) {
    try {
      const respuesta = await fetch(BASE + '/');
      if (respuesta.ok) break;
    } catch {
      /* aún arrancando */
    }
    await esperar(250);
  }

  navegador = await chromium.launch({
    ...(ejecutable ? { executablePath: ejecutable } : {}),
    args: ['--no-sandbox'],
  });
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
  const erroresPagina = [];
  pagina.on('pageerror', (error) => erroresPagina.push(String(error)));

  await pagina.goto(BASE + '/', { waitUntil: 'networkidle' });

  // 1. El skin se ve y depende del género elegido.
  await pagina.waitForSelector('#retrato svg', { timeout: 5000 });
  comprobar((await pagina.locator('#retrato .ojo').count()) >= 2, 'el retrato muestra ojos del skin');
  comprobar(
    (await pagina.getAttribute('#retrato', 'data-genero')) === 'femenino',
    'el skin inicial corresponde al género femenino'
  );
  await pagina.click('#generos .boton:nth-child(2)');
  comprobar(
    (await pagina.getAttribute('#retrato', 'data-genero')) === 'masculino',
    'el skin cambia al elegir el género masculino'
  );
  await pagina.click('#generos .boton:nth-child(1)');

  // 2. La acción no es un destello: panel visible y corazones sobre el personaje.
  await pagina.click('[data-accion="picar"]');
  await pagina.waitForSelector('#banner.activo', { timeout: 4000 });
  const relato = await pagina.locator('#bannerTexto').innerText();
  comprobar(relato.includes('hacha'), 'el panel describe lo que hace Ely al picar');
  comprobar((await pagina.locator('.corazon-flotante').count()) >= 1, 'aparecen corazones sobre el personaje');
  await esperar(2000);
  comprobar((await pagina.locator('#banner.activo').count()) === 1, 'el panel sigue visible pasados 2 segundos');

  // 3. El acto se lanza con un botón, sin escribir comandos.
  await pagina.evaluate(() => {
    const clave = 'elylang.demo.v1';
    const estado = JSON.parse(localStorage.getItem(clave) || '{}');
    estado.afinidad = 85;
    estado.adulto = true;
    estado.noche = true;
    estado.genero = 'femenino';
    localStorage.setItem(clave, JSON.stringify(estado));
  });
  await pagina.reload({ waitUntil: 'networkidle' });
  await pagina.waitForSelector('#btnNoche:not([disabled])', { timeout: 5000 });
  comprobar(true, 'el botón de la noche se habilita con afinidad, noche y mayoría de edad');
  await pagina.click('#btnNoche');
  await pagina.waitForSelector('#fundido.activo', { timeout: 5000 });
  const fundido = await pagina.locator('#fundidoTexto').innerText();
  comprobar(fundido.length > 40, 'la escena se desarrolla en pantalla tras el clic');

  comprobar(erroresPagina.length === 0, 'sin errores de JavaScript en la página');
} catch (error) {
  fallos.push(String(error && error.message ? error.message : error));
  console.error(error);
} finally {
  if (navegador) await navegador.close();
  servidor.kill();
}

if (fallos.length) {
  console.error(`\n${fallos.length} comprobación(es) fallida(s):`);
  for (const fallo of fallos) console.error(' - ' + fallo);
  process.exit(1);
}
console.log('\nDemo verificada: skin por género, acciones duraderas y noche sin comandos.');
