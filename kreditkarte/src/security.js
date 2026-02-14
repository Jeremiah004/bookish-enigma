// security.js
// -------------
// Central place for "Watchtower" style middleware:
// - CORS perimeter: only allow the configured frontend origin.
// - Rate limiting: slow down or block abuse of the payment endpoint.
// - Optional session header check: lightweight guardrail for research setups.

const cors = require('cors');
const rateLimit = require('express-rate-limit');

function createCorsMiddleware() {
  const origin = process.env.FRONTEND_ORIGIN;

  // If FRONTEND_ORIGIN is not set we fall back to a very permissive mode,
  // which is helpful in local development but should be avoided in production.
  const options = origin
    ? {
        origin,
        credentials: true,
      }
    : {
        origin: true,
        credentials: true,
      };

  return cors(options);
}

function createPaymentRateLimiter() {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
  const max = Number(process.env.RATE_LIMIT_MAX || 5);

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Too many payment attempts, please try again later.',
    },
  });
}

function createSessionHeaderGuard() {
  const enabled = String(process.env.REQUIRE_SESSION_HEADER || 'false').toLowerCase() === 'true';
  const headerName = process.env.SESSION_HEADER_NAME || 'x-session-id';

  if (!enabled) {
    // No-op middleware if not enabled.
    return (req, res, next) => next();
  }

  return (req, res, next) => {
    const value = req.header(headerName);
    if (!value) {
      return res.status(401).json({
        status: 'error',
        message: `Missing required session header: ${headerName}`,
      });
    }
    next();
  };
}

module.exports = {
  createCorsMiddleware,
  createPaymentRateLimiter,
  createSessionHeaderGuard,
};



