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

/**
 * Admin authentication middleware
 * Protects admin endpoints with a simple API key/password
 * Set ADMIN_API_KEY environment variable to enable
 */
function createAdminAuthGuard() {
  const adminApiKey = process.env.ADMIN_API_KEY;
  
  if (!adminApiKey) {
    console.warn('[security] ADMIN_API_KEY not set - admin endpoints are unprotected!');
    // In production, you should require this
    return (req, res, next) => {
      console.warn('[security] Admin endpoint accessed without ADMIN_API_KEY configured');
      next();
    };
  }

  return (req, res, next) => {
    // Check for API key in header or query parameter
    const providedKey = req.header('x-admin-api-key') || req.query.apiKey;
    
    if (!providedKey) {
      return res.status(401).json({
        status: 'error',
        message: 'Admin access requires authentication. Provide x-admin-api-key header or apiKey query parameter.',
      });
    }

    if (providedKey !== adminApiKey) {
      return res.status(403).json({
        status: 'error',
        message: 'Invalid admin credentials.',
      });
    }

    next();
  };
}

module.exports = {
  createCorsMiddleware,
  createPaymentRateLimiter,
  createSessionHeaderGuard,
  createAdminAuthGuard,
};



