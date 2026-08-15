const { getDB } = require('../config/db');
const { generateId, paginate } = require('../utils/helpers');

// GET /api/customers
const getAll = (req, res, next) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, search = '' } = req.query;
    const { offset, limit: lim } = paginate(page, limit);

    let conditions = ['1=1'];
    let params = [];
    if (search) { conditions.push(`(name LIKE ? OR phone LIKE ? OR email LIKE ?)`); const s = `%${search}%`; params.push(s, s, s); }

    const where = conditions.join(' AND ');
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM customers WHERE ${where}`).get(...params);
    const customers = db.prepare(`
      SELECT c.*, COUNT(s.id) as total_purchases, COALESCE(SUM(s.total),0) as total_spent
      FROM customers c LEFT JOIN sales s ON c.id = s.customer_id AND s.status='completed'
      WHERE ${where} GROUP BY c.id ORDER BY c.name LIMIT ? OFFSET ?
    `).all(...params, lim, offset);

    res.json({ success: true, data: customers, pagination: { page: parseInt(page), limit: lim, total: countRow.total, pages: Math.ceil(countRow.total / lim) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/customers/:id
const getOne = (req, res, next) => {
  try {
    const db = getDB();
    const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const purchases = db.prepare(`SELECT s.*, u.full_name as worker_name FROM sales s LEFT JOIN users u ON s.worker_id=u.id WHERE s.customer_id=? ORDER BY s.created_at DESC LIMIT 20`).all(req.params.id);
    res.json({ success: true, data: { ...customer, purchases } });
  } catch (err) {
    next(err);
  }
};

// POST /api/customers
const create = (req, res, next) => {
  try {
    const db = getDB();
    const { name, phone, email, address, notes } = req.body;
    const id = generateId();
    db.prepare(`INSERT INTO customers (id, name, phone, email, address, notes) VALUES (?,?,?,?,?,?)`).run(id, name, phone, email, address, notes);
    const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// PUT /api/customers/:id
const update = (req, res, next) => {
  try {
    const db = getDB();
    const cust = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
    if (!cust) return res.status(404).json({ success: false, message: 'Customer not found' });
    const { name, phone, email, address, notes } = req.body;
    db.prepare(`UPDATE customers SET name=?, phone=?, email=?, address=?, notes=?, updated_at=datetime('now') WHERE id=?`).run(name || cust.name, phone, email, address, notes, req.params.id);
    const updated = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update };
