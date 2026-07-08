const { users } = require('../models/dataStore');
const { readJsonBody, sendJson } = require('../utils/http');
const { signJwt } = require('../utils/jwt');

async function login(req, res) {
   console.log("Login route hit", req.body);
  const { email, password } = req.body;
  const user = users.find((item) => item.email === email && item.password === password);

  if (!user) {
    sendJson(res, 401, { message: 'Invalid email or password' });
    return;
  }

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = signJwt({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  sendJson(res, 200, {
    message: 'Login successful',
    token,
    user: sessionUser,
  });
}

function profile(req, res) {
  sendJson(res, 200, { user: req.user });
}

module.exports = {
  login,
  profile,
};
