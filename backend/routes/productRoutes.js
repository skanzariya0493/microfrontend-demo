const {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} = require('../controllers/productController');
const { requireAuth } = require('../middleware/auth');

async function handleProductRoutes(req, res, pathname) {
  const productId = getResourceId(pathname, '/api/products');

  if (pathname === '/api/products' && req.method === 'GET') {
    getProducts(req, res);
    return true;
  }

  if (productId && req.method === 'GET') {
    getProductById(req, res, productId);
    return true;
  }

  if (pathname === '/api/products' && req.method === 'POST') {
    requireAuth(req);
    await createProduct(req, res);
    return true;
  }

  if (productId && ['PUT', 'PATCH'].includes(req.method)) {
    requireAuth(req);
    await updateProduct(req, res, productId);
    return true;
  }

  if (productId && req.method === 'DELETE') {
    requireAuth(req);
    deleteProduct(req, res, productId);
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

module.exports = { handleProductRoutes };
