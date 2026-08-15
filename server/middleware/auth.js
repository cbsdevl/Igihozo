const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { getDB } = require('../config/db');

/**
 * Verify JWT token middleware
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists and is active
    const db = getDB();
    const user = db.prepare(`SELECT id, username, role_id, is_active FROM users WHERE id = ?`).get(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = { authenticate };
