const rateLimit = require('express-rate-limit');

/**
 * Strict limiter for auth endpoints — 10 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

/**
 * General API limiter — 300 requests per minute
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

module.exports = { authLimiter, apiLimiter };
