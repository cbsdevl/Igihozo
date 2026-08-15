require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const { PORT, CLIENT_URL, NODE_ENV } = require('./config/env');
const logger = require('./utils/logger');
const { startCronJobs } = require('./utils/cronJobs');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// ── Trust Render's reverse proxy (required for rate-limit + secure cookies) ──
app.set('trust proxy', 1);

// ── Security ───────────────────────────────────────────────────────
app.use(helmet());

// Build CORS origin list: always include localhost + whatever CLIENT_URL is set to
const corsOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Performance ────────────────────────────────────────────────────
app.use(compression());

// ── Parsing ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ────────────────────────────────────────────────────────
if (NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: msg => logger.info(msg.trim()) },
  }));
}

// ── Static ─────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Rate Limit ─────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/activity-logs', require('./routes/activityLogs'));

// ── Health check ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Gihozo PMS', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ── 404 ────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 Gihozo PMS Server running on http://localhost:${PORT}`);
  logger.info(`🌍 Environment: ${NODE_ENV}`);
  logger.info(`📡 Client URL: ${CLIENT_URL}`);

  // ── Cron Jobs ──────────────────────────────────────────────────────
  startCronJobs();
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

module.exports = app;
