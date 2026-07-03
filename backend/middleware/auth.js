const { users } = require('../models/dataStore');
const { verifyJwt } = require('../utils/jwt');

function requireAuth(req) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    const error = new Error('Unauthorized. Login first and send Bearer token.');
    error.statusCode = 401;
    throw error;
  }

  const payload = verifyJwt(token);
  const user = users.find((item) => item.id === payload.sub);

  if (!user) {
    const error = new Error('Unauthorized. User no longer exists.');
    error.statusCode = 401;
    throw error;
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  req.token = payload;
}

module.exports = { requireAuth };
