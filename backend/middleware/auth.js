const { verifyJwt } = require("../utils/jwt");
const { sendJson } = require("../utils/http");

function extractToken(req) {
  const authorization = req.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

function toUser(payload) {
  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    role: payload.role,
  };
}

// Rejects the request with 401 when there is no valid token.
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return sendJson(res, 401, { message: "Unauthorized. Please log in." });
  }
  try {
    const payload = verifyJwt(token);
    req.user = toUser(payload);
    req.token = payload;
    next();
  } catch (err) {
    return sendJson(res, 401, { message: "Session expired. Please log in again." });
  }
}

// Attaches req.user when a valid token is present, but never blocks the request.
function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = verifyJwt(token);
      req.user = toUser(payload);
      req.token = payload;
    } catch {
      // ignore invalid token — treat as guest
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
