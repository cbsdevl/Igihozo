const bcrypt = require('bcrypt');
const { getDB } = require('../config/db');
const { generateId, paginate } = require('../utils/helpers');
const { logActivity } = require('../middleware/errorHandler');

// GET /api/workers
const getAll = (req, res, next) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, search = '', is_active } = req.query;
    const { offset, limit: lim } = paginate(page, limit);

    let conditions = [`r.name = 'worker'`];
    let params = [];
    if (search) { conditions.push(`(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)`); const s = `%${search}%`; params.push(s, s, s); }
    if (is_active !== undefined) { conditions.push(`u.is_active = ?`); params.push(is_active === 'true' ? 1 : 0); }

    const where = conditions.join(' AND ');
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM users u JOIN roles r ON u.role_id = r.id WHERE ${where}`).get(...params);
    const workers = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.email, u.phone, u.is_active, u.last_login, u.created_at, r.name as role_name,
             (SELECT COUNT(*) FROM sales WHERE worker_id = u.id) as total_sales
      FROM users u JOIN roles r ON u.role_id = r.id
      WHERE ${where} ORDER BY u.full_name LIMIT ? OFFSET ?
    `).all(...params, lim, offset);

    res.json({ success: true, data: workers, pagination: { page: parseInt(page), limit: lim, total: countRow.total, pages: Math.ceil(countRow.total / lim) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/workers/:id
const getOne = (req, res, next) => {
  try {
    const db = getDB();
    const worker = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.email, u.phone, u.is_active, u.last_login, u.created_at, r.name as role_name
      FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?
    `).get(req.params.id);

    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    const salesStats = db.prepare(`
      SELECT COUNT(*) as total_sales, COALESCE(SUM(total),0) as total_revenue
      FROM sales WHERE worker_id = ? AND status='completed'
    `).get(req.params.id);

    res.json({ success: true, data: { ...worker, ...salesStats } });
  } catch (err) {
    next(err);
  }
};

// POST /api/workers
const create = async (req, res, next) => {
  try {
    const db = getDB();
    const { username, full_name, email, phone, password, role = 'worker' } = req.body;

    const exists = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username);
    if (exists) return res.status(409).json({ success: false, message: 'Username already taken' });

    const role_row = db.prepare(`SELECT id FROM roles WHERE name = ?`).get(role);
    if (!role_row) return res.status(400).json({ success: false, message: 'Invalid role' });

    const hash = await bcrypt.hash(password, 12);
    const id = generateId();
    db.prepare(`INSERT INTO users (id, role_id, username, full_name, email, phone, password_hash) VALUES (?,?,?,?,?,?,?)`).run(id, role_row.id, username, full_name, email, phone, hash);

    logActivity({ user_id: req.user.id, username: req.user.username, action: 'CREATE_WORKER', module: 'workers', description: `Created worker: ${username}`, ip_address: req.ip });
    const worker = db.prepare(`SELECT u.id, u.username, u.full_name, u.email, u.phone, u.is_active, u.created_at, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`).get(id);
    res.status(201).json({ success: true, message: 'Worker created successfully', data: worker });
  } catch (err) {
    next(err);
  }
};

// PUT /api/workers/:id
const update = async (req, res, next) => {
  try {
    const db = getDB();
    const { full_name, email, phone, is_active, password } = req.body;
    const worker = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    if (password) {
      const hash = await bcrypt.hash(password, 12);
      db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, req.params.id);
    }

    db.prepare(`UPDATE users SET full_name=?, email=?, phone=?, is_active=? WHERE id=?`).run(
      full_name || worker.full_name, email || worker.email, phone || worker.phone,
      is_active !== undefined ? (is_active ? 1 : 0) : worker.is_active, req.params.id
    );

    logActivity({ user_id: req.user.id, username: req.user.username, action: 'UPDATE_WORKER', module: 'workers', description: `Updated worker: ${worker.username}`, ip_address: req.ip });
    const updated = db.prepare(`SELECT u.id, u.username, u.full_name, u.email, u.phone, u.is_active, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`).get(req.params.id);
    res.json({ success: true, message: 'Worker updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/workers/:id
const remove = (req, res, next) => {
  try {
    const db = getDB();
    const worker = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    if (worker.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot delete your own account' });

    db.prepare(`DELETE FROM users WHERE id = ?`).run(req.params.id);
    logActivity({ user_id: req.user.id, username: req.user.username, action: 'DELETE_WORKER', module: 'workers', description: `Deleted worker: ${worker.username}`, ip_address: req.ip });
    res.json({ success: true, message: 'Worker deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, remove };
