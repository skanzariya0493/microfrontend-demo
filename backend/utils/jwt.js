const crypto = require('crypto');
const { env } = require('../config/env');

function signJwt(payload, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = options.expiresInSeconds || env.jwtExpiresInSeconds;
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const signature = createSignature(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token) {
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throwAuthError('Invalid token format');
  }

  const expectedSignature = createSignature(`${encodedHeader}.${encodedPayload}`);
  if (!timingSafeEqual(signature, expectedSignature)) {
    throwAuthError('Invalid token signature');
  }

  const header = parseBase64UrlJson(encodedHeader);
  if (header.alg !== 'HS256' || header.typ !== 'JWT') {
    throwAuthError('Unsupported token type');
  }

  const payload = parseBase64UrlJson(encodedPayload);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throwAuthError('Token expired');
  }

  return payload;
}

function createSignature(value) {
  return crypto.createHmac('sha256', env.jwtSecret).update(value).digest('base64url');
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function parseBase64UrlJson(value) {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    throwAuthError('Invalid token payload');
  }
}

function timingSafeEqual(a, b) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function throwAuthError(message) {
  const error = new Error(message);
  error.statusCode = 401;
  throw error;
}

module.exports = {
  signJwt,
  verifyJwt,
};
