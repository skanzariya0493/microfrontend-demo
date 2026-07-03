const { login, profile } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

async function handleAuthRoutes(req, res, pathname) {
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    await login(req, res);
    return true;
  }

  if (pathname === '/api/auth/profile' && req.method === 'GET') {
    requireAuth(req);
    profile(req, res);
    return true;
  }

  return false;
}

module.exports = { handleAuthRoutes };
