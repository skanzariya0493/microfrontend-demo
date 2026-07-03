const { handleAuthRoutes } = require('./authRoutes');
const { handleOrderRoutes } = require('./orderRoutes');
const { handleProductRoutes } = require('./productRoutes');
const { notFound, sendJson } = require('../utils/http');

async function handleApiRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = normalizePath(url.pathname);

  if (pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'microfrontend-demo-backend',
    });
    return;
  }

  if (await handleAuthRoutes(req, res, pathname)) {
    return;
  }

  if (await handleProductRoutes(req, res, pathname)) {
    return;
  }

  if (await handleOrderRoutes(req, res, pathname)) {
    return;
  }

  notFound(res);
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

module.exports = { handleApiRoutes };
