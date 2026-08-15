const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id,
  });

  // Also print to stdout/stderr so hosting providers (Render) capture the stack
  // in their real-time logs even when `NODE_ENV=production`.
  try {
    console.error('Unhandled error:', err.stack || err);
  } catch (e) {
    // ignore
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Activity logger helper
 */
const { getDB } = require('../config/db');
const { generateId } = require('../utils/helpers');

const logActivity = ({
  user_id, username, action, module, description,
  old_value, new_value, ip_address, user_agent, status = 'success'
}) => {
  try {
    const db = getDB();
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, username, action, module, description, old_value, new_value, ip_address, user_agent, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      generateId(), user_id, username, action, module, description,
      old_value ? JSON.stringify(old_value) : null,
      new_value ? JSON.stringify(new_value) : null,
      ip_address, user_agent, status
    );
  } catch (e) {
    logger.error('Failed to log activity: ' + e.message);
  }
};

module.exports = { errorHandler, logActivity };
