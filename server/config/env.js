require('dotenv').config();

const required = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 5000,
  // CLIENT_URL — set this to your Render frontend URL in production
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  DB_PATH: process.env.DB_PATH || '../../database/gihozo.db',
  APP_NAME: process.env.APP_NAME || 'Gihozo Pharmacy',
  APP_VERSION: process.env.APP_VERSION || '1.0.0',
  // Render injects this automatically — used by cronJobs.js for keep-alive pings
  RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL || null,
};
