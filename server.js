'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const distDir = path.join(__dirname, 'dist');
const webDir = path.join(__dirname, 'web');
const ROOT = fs.existsSync(path.join(distDir, 'index.html')) ? distDir : webDir;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error leyendo el archivo');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300'
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const rawUrl = (req.url || '/').split('?')[0];
  let urlPath;
  try {
    urlPath = decodeURIComponent(rawUrl);
  } catch (e) {
    res.writeHead(400);
    res.end('Petición inválida');
    return;
  }

  if (urlPath === '/api/salud') {
    sendJson(res, 200, {
      ok: true,
      mod: 'elylang',
      nombre: 'Ely, compañera del alma',
      version: '1.0.0',
      minecraft: '1.21.1 (Fabric)',
      contenido: 'romance no explícito'
    });
    return;
  }

  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(ROOT, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Prohibido');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    // SPA fallback
    filePath = path.join(ROOT, 'index.html');
  }

  serveFile(res, filePath);
});

server.listen(PORT, HOST, () => {
  console.log(`Ely demo escuchando en http://${HOST}:${PORT} (sirviendo ${ROOT})`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
