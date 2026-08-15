/**
 * cronJobs.js
 * -----------
 * Scheduled background tasks for the Gihozo PMS server.
 *
 * ── Local dev  → pings http://localhost:<PORT>/api/health
 * ── On Render  → pings https://<RENDER_EXTERNAL_URL>/api/health
 *
 * Render injects RENDER_EXTERNAL_URL automatically on every deploy,
 * so no manual env-var wiring is required for the keep-alive ping.
 */

const cron   = require('node-cron');
const http   = require('http');
const https  = require('https');
const logger = require('./logger');

// ── Resolve the correct ping URL ─────────────────────────────────────────────
function getPingUrl() {
  // Render sets this automatically; it looks like "gihozo-api.onrender.com"
  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  if (renderUrl) {
    // Render may provide with or without protocol — normalise it
    const base = renderUrl.startsWith('http') ? renderUrl : `https://${renderUrl}`;
    return `${base}/api/health`;
  }

  // Local development fallback
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}/api/health`;
}

// ── Ping helper ───────────────────────────────────────────────────────────────
function pingHealthCheck() {
  const url    = getPingUrl();
  const isHttps = url.startsWith('https');
  const client  = isHttps ? https : http;

  logger.info(`[CronJob] 🔔 Pinging → ${url}`);

  const req = client.get(url, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        logger.info(
          `[CronJob] ✅ Health-check OK — status: ${data.status} | ts: ${data.timestamp}`
        );
      } catch {
        logger.info(`[CronJob] ✅ Health-check OK — HTTP ${res.statusCode}`);
      }
    });
  });

  req.on('error', (err) => {
    logger.error(`[CronJob] ❌ Health-check FAILED — ${err.message}`);
  });

  // Allow up to 15 s for Render cold-starts (free tier can take ~10 s)
  req.setTimeout(15000, () => {
    logger.warn('[CronJob] ⚠️  Health-check timed out after 15 s');
    req.destroy();
  });
}

// ── Schedule ──────────────────────────────────────────────────────────────────

/**
 * Registers all cron jobs.
 * Call this once after the Express server starts listening.
 */
function startCronJobs() {
  const pingUrl = getPingUrl();

  // Every 10 minutes  →  keeps the Render free-tier service alive
  cron.schedule('*/10 * * * *', () => {
    logger.info('[CronJob] 🕐 Running 10-minute health-check ping…');
    pingHealthCheck();
  }, {
    scheduled: true,
    timezone: 'Africa/Kigali',
  });

  logger.info(`[CronJob] ✅ Registered — will ping every 10 min → ${pingUrl}`);
}

module.exports = { startCronJobs };
