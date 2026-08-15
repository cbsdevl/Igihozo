require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';

// Only enforce presence of sensitive secrets in production. In development
// provide reasonable defaults to avoid hard crashes during local testing.
const requiredInProd = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
if (NODE_ENV === 'production') {
  const missing = requiredInProd.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables (production): ${missing.join(', ')}`);
    process.exit(1);
  }
} else {
  // Development defaults (do NOT use these in production)
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'dev_jwt_secret_change_me';
  if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'dev_refresh_secret_change_me';
}

module.exports = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  // CLIENT_URL — set this to your Vercel/production frontend URL in production
  CLIENT_URL: process.env.CLIENT_URL || (NODE_ENV === 'production' ? null : 'http://localhost:5173'),
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  // Ensure DB_PATH defaults to the server's `database` folder (works on Render)
  DB_PATH: process.env.DB_PATH || './database/gihozo.db',
  APP_NAME: process.env.APP_NAME || 'Gihozo Pharmacy',
  APP_VERSION: process.env.APP_VERSION || '1.0.0',
  // Render injects this automatically — used by cronJobs.js for keep-alive pings
  RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL || null,
};
