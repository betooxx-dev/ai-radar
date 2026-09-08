const crypto = require('node:crypto');

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  return sendJson(res, 405, { error: 'method_not_allowed' });
}

function getQuery(req, name, fallback = undefined) {
  if (req.query && req.query[name] !== undefined) {
    const value = req.query[name];
    return Array.isArray(value) ? value[0] : value;
  }
  const url = new URL(req.url || '/', 'http://localhost');
  return url.searchParams.get(name) || fallback;
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
  if (typeof raw !== 'string' || raw.trim() === '') throw new Error('El cuerpo debe ser JSON');
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('El cuerpo debe contener JSON válido');
  }
}

function bearerToken(req) {
  const value = typeof req.headers?.get === 'function'
    ? req.headers.get('authorization') || ''
    : req.headers?.authorization || req.headers?.Authorization || '';
  return value.startsWith('Bearer ') ? value.slice('Bearer '.length) : null;
}

function safeEqual(left, right) {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthorized(req, config) {
  const token = bearerToken(req);
  return safeEqual(token, config.cronSecret) || safeEqual(token, config.operatorApiToken);
}

function parseLimit(value, defaultValue = 20, max = 50) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    throw new Error(`limit debe ser un entero entre 1 y ${max}`);
  }
  return parsed;
}

module.exports = {
  getQuery,
  isAuthorized,
  methodNotAllowed,
  parseBody,
  parseLimit,
  sendJson,
};
