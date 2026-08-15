const { getDB } = require('../config/db');
const { generateId, paginate } = require('../utils/helpers');
const { logActivity } = require('../middleware/errorHandler');

// GET /api/suppliers
const getAll = (req, res, next) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, search = '' } = req.query;
    const { offset, limit: lim } = paginate(page, limit);

    let conditions = ['1=1'];
    let params = [];
    if (search) { conditions.push(`(name LIKE ? OR email LIKE ? OR phone LIKE ?)`); const s = `%${search}%`; params.push(s, s, s); }

    const where = conditions.join(' AND ');
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM suppliers WHERE ${where}`).get(...params);
    const suppliers = db.prepare(`
      SELECT s.*, (SELECT COUNT(*) FROM medicines WHERE supplier_id = s.id) as medicine_count
      FROM suppliers s WHERE ${where} ORDER BY name LIMIT ? OFFSET ?
    `).all(...params, lim, offset);

    res.json({ success: true, data: suppliers, pagination: { page: parseInt(page), limit: lim, total: countRow.total, pages: Math.ceil(countRow.total / lim) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/suppliers/:id
const getOne = (req, res, next) => {
  try {
    const db = getDB();
    const sup = db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(req.params.id);
    if (!sup) return res.status(404).json({ success: false, message: 'Supplier not found' });
    const medicines = db.prepare(`SELECT id, name, quantity, selling_price FROM medicines WHERE supplier_id = ? AND status='active'`).all(req.params.id);
    res.json({ success: true, data: { ...sup, medicines } });
  } catch (err) {
    next(err);
  }
};

// POST /api/suppliers
const create = (req, res, next) => {
  try {
    const db = getDB();
    const { name, contact_person, phone, email, address, city, notes } = req.body;
    const id = generateId();
    db.prepare(`INSERT INTO suppliers (id, name, contact_person, phone, email, address, city, notes) VALUES (?,?,?,?,?,?,?,?)`).run(id, name, contact_person, phone, email, address, city, notes);

    const db2 = getDB();
    db2.prepare(`INSERT INTO notifications (id, type, title, message, severity) VALUES (?,?,?,?,?)`).run(generateId(), 'supplier_added', 'New Supplier Added', `${name} has been added as a supplier`, 'info');
    logActivity({ user_id: req.user.id, username: req.user.username, action: 'CREATE_SUPPLIER', module: 'suppliers', description: `Added supplier: ${name}`, ip_address: req.ip });

    const supplier = db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(id);
    res.status(201).json({ success: true, message: 'Supplier created', data: supplier });
  } catch (err) {
    next(err);
  }
};

// PUT /api/suppliers/:id
const update = (req, res, next) => {
  try {
    const db = getDB();
    const sup = db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(req.params.id);
    if (!sup) return res.status(404).json({ success: false, message: 'Supplier not found' });
    const { name, contact_person, phone, email, address, city, notes, is_active, outstanding_balance } = req.body;

    db.prepare(`UPDATE suppliers SET name=?, contact_person=?, phone=?, email=?, address=?, city=?, notes=?, is_active=?, outstanding_balance=?, updated_at=datetime('now') WHERE id=?`).run(
      name || sup.name, contact_person, phone, email, address, city, notes,
      is_active !== undefined ? (is_active ? 1 : 0) : sup.is_active,
      outstanding_balance !== undefined ? outstanding_balance : sup.outstanding_balance,
      req.params.id
    );

    logActivity({ user_id: req.user.id, username: req.user.username, action: 'UPDATE_SUPPLIER', module: 'suppliers', description: `Updated supplier: ${sup.name}`, ip_address: req.ip });
    const updated = db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(req.params.id);
    res.json({ success: true, message: 'Supplier updated', data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/suppliers/:id
const remove = (req, res, next) => {
  try {
    const db = getDB();
    const sup = db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(req.params.id);
    if (!sup) return res.status(404).json({ success: false, message: 'Supplier not found' });
    db.prepare(`DELETE FROM suppliers WHERE id = ?`).run(req.params.id);
    logActivity({ user_id: req.user.id, username: req.user.username, action: 'DELETE_SUPPLIER', module: 'suppliers', description: `Deleted supplier: ${sup.name}`, ip_address: req.ip });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, remove };
