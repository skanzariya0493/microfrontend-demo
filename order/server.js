// Zero-dependency static file server for the built Angular app.
// Serves dist/order, adds permissive CORS (required so the shell host can load
// this remote's remoteEntry.js cross-origin), and falls back to index.html.
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist', 'order');
const PORT = process.env.PORT || 4202;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function send(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  fs.createReadStream(filePath)
    .on('error', () => {
      res.writeHead(404);
      res.end('Not found');
    })
    .pipe(res);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(DIST, urlPath);

  // Block path traversal outside DIST
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      return send(filePath, res);
    }
    // SPA fallback for Angular routes
    return send(path.join(DIST, 'index.html'), res);
  });
});

server.listen(PORT, () => console.log(`order served on ${PORT}`));
