const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } = require('../config/env');
const { generateId } = require('../utils/helpers');
const { logActivity } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const generateTokens = (user) => {
  const payload = { id: user.id, username: user.username, role: user.role_name };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

const getUserData = (db, id) => db.prepare(`
  SELECT u.id, u.username, u.full_name, u.email, u.phone, u.avatar, u.is_active, u.last_login, u.created_at,
         r.name as role_name, r.id as role_id
  FROM users u JOIN roles r ON u.role_id = r.id
  WHERE u.id = ?
`).get(id);

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const db = getDB();

    const user = db.prepare(`
      SELECT u.*, r.name as role_name FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = ?
    `).get(username);

    if (!user) {
      logActivity({ action: 'LOGIN_FAILED', module: 'auth', description: `Failed login for: ${username}`, ip_address: req.ip, status: 'failed' });
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      logActivity({ user_id: user.id, username: user.username, action: 'LOGIN_FAILED', module: 'auth', description: 'Wrong password', ip_address: req.ip, status: 'failed' });
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Update last_login
    db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(user.id);

    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token in DB (future: token table; for now include in response)
    logActivity({ user_id: user.id, username: user.username, action: 'LOGIN', module: 'auth', description: 'Successful login', ip_address: req.ip, user_agent: req.get('user-agent') });

    // Notify admin of worker login
    if (user.role_name === 'worker') {
      db.prepare(`INSERT INTO notifications (id, type, title, message, severity) VALUES (?,?,?,?,?)`).run(
        generateId(), 'worker_login', 'Worker Login', `${user.full_name} logged in at ${new Date().toLocaleTimeString()}`, 'info'
      );
    }

    const userData = getUserData(db, user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userData, accessToken, refreshToken },
    });
  } catch (err) {
    // Log error and return a helpful response in non-production for debugging
    logger.error({ message: err.message, stack: err.stack, path: req.path, method: req.method });
    try { console.error(err.stack || err); } catch (e) { /* ignore */ }
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
      ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack }),
    });
  }
};

// POST /api/auth/refresh
const refresh = (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const db = getDB();
    const user = db.prepare(`SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`).get(decoded.id);

    if (!user || !user.is_active) return res.status(401).json({ success: false, message: 'Invalid token' });

    const { accessToken, refreshToken: newRefresh } = generateTokens(user);
    res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  logActivity({ user_id: req.user?.id, username: req.user?.username, action: 'LOGOUT', module: 'auth', description: 'User logged out', ip_address: req.ip });
  res.json({ success: true, message: 'Logged out successfully' });
};

// GET /api/auth/profile
const profile = (req, res, next) => {
  try {
    const db = getDB();
    const user = getUserData(db, req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const db = getDB();
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 12);
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(hash, user.id);

    logActivity({ user_id: user.id, username: user.username, action: 'CHANGE_PASSWORD', module: 'auth', description: 'Password changed', ip_address: req.ip });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refresh, logout, profile, changePassword };
