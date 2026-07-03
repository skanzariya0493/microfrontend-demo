const {
  createOrder,
  deleteOrder,
  getOrderById,
  getOrders,
  updateOrder,
} = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

async function handleOrderRoutes(req, res, pathname) {
  const orderId = getResourceId(pathname, '/api/orders');

  if (pathname === '/api/orders' && req.method === 'GET') {
    requireAuth(req);
    getOrders(req, res);
    return true;
  }

  if (orderId && req.method === 'GET') {
    requireAuth(req);
    getOrderById(req, res, orderId);
    return true;
  }

  if (pathname === '/api/orders' && req.method === 'POST') {
    requireAuth(req);
    await createOrder(req, res);
    return true;
  }

  if (orderId && ['PUT', 'PATCH'].includes(req.method)) {
    requireAuth(req);
    await updateOrder(req, res, orderId);
    return true;
  }

  if (orderId && req.method === 'DELETE') {
    requireAuth(req);
    deleteOrder(req, res, orderId);
    return true;
  }

  return false;
}

function getResourceId(pathname, basePath) {
  if (!pathname.startsWith(`${basePath}/`)) {
    return '';
  }

  return decodeURIComponent(pathname.slice(basePath.length + 1));
}

module.exports = { handleOrderRoutes };
