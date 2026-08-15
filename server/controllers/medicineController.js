const { getDB } = require('../config/db');
const { generateId, calculateMargin, paginate } = require('../utils/helpers');
const { logActivity } = require('../middleware/errorHandler');

const createNotification = (db, type, title, message, severity = 'info', referenceId = null) => {
  db.prepare(`INSERT INTO notifications (id, type, title, message, severity, reference_id) VALUES (?,?,?,?,?,?)`).run(generateId(), type, title, message, severity, referenceId);
};

// GET /api/medicines
const getAll = (req, res, next) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, search = '', category, supplier, status, expired, low_stock, sort = 'name', order = 'ASC' } = req.query;
    const { offset, limit: lim } = paginate(page, limit);

    const allowedSorts = ['name', 'created_at', 'expiry_date', 'quantity', 'selling_price'];
    const safeSort = allowedSorts.includes(sort) ? `m.${sort}` : 'm.name';
    const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let conditions = ['1=1'];
    let params = [];

    if (search) { conditions.push(`(m.name LIKE ? OR m.generic_name LIKE ? OR m.barcode LIKE ? OR m.brand LIKE ?)`); const s = `%${search}%`; params.push(s, s, s, s); }
    if (category) { conditions.push(`m.category_id = ?`); params.push(category); }
    if (supplier) { conditions.push(`m.supplier_id = ?`); params.push(supplier); }
    if (status) { conditions.push(`m.status = ?`); params.push(status); }
    if (expired === 'true') { conditions.push(`m.expiry_date < date('now')`); }
    if (expired === 'near') { conditions.push(`m.expiry_date BETWEEN date('now') AND date('now', '+30 days')`); }
    if (low_stock === 'true') { conditions.push(`m.quantity <= m.min_stock`); }

    const where = conditions.join(' AND ');
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM medicines m WHERE ${where}`).get(...params);
    const medicines = db.prepare(`
      SELECT m.*, c.name as category_name, s.name as supplier_name, u.full_name as created_by_name
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE ${where}
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `).all(...params, lim, offset);

    res.json({
      success: true,
      data: medicines,
      pagination: { page: parseInt(page), limit: lim, total: countRow.total, pages: Math.ceil(countRow.total / lim) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/medicines/:id
const getOne = (req, res, next) => {
  try {
    const db = getDB();
    const med = db.prepare(`
      SELECT m.*, c.name as category_name, s.name as supplier_name, u.full_name as created_by_name
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.id = ?
    `).get(req.params.id);
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });
    res.json({ success: true, data: med });
  } catch (err) {
    next(err);
  }
};

// POST /api/medicines
const create = (req, res, next) => {
  try {
    const db = getDB();
    const id = generateId();
    const {
      barcode, name, generic_name, brand, category_id, description, supplier_id,
      purchase_price, selling_price, quantity = 0, min_stock = 10,
      batch_number, manufacturing_date, expiry_date, storage_location, prescription_required = 0,
    } = req.body;

    const existing = db.prepare(`SELECT id FROM medicines WHERE barcode = ? AND barcode IS NOT NULL AND barcode != ''`).get(barcode || '');
    if (barcode && existing) return res.status(409).json({ success: false, message: 'Barcode already exists' });

    db.prepare(`
      INSERT INTO medicines (id, barcode, name, generic_name, brand, category_id, description, supplier_id,
        purchase_price, selling_price, quantity, min_stock, batch_number, manufacturing_date, expiry_date,
        storage_location, prescription_required, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(id, barcode || null, name, generic_name, brand, category_id, description, supplier_id,
      purchase_price, selling_price, quantity, min_stock, batch_number, manufacturing_date, expiry_date,
      storage_location, prescription_required ? 1 : 0, req.user.id);

    // Inventory log
    if (quantity > 0) {
      db.prepare(`INSERT INTO inventory_logs (id, medicine_id, medicine_name, action, quantity_change, quantity_before, quantity_after, worker_id, notes)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(generateId(), id, name, 'purchase', quantity, 0, quantity, req.user.id, 'Initial stock entry');
    }

    createNotification(db, 'medicine_added', 'New Medicine Added', `${name} has been added to inventory`, 'info', id);
    logActivity({ user_id: req.user.id, username: req.user.username, action: 'CREATE_MEDICINE', module: 'medicines', description: `Added medicine: ${name}`, new_value: { name, quantity }, ip_address: req.ip });

    // Low stock check
    if (quantity <= min_stock) {
      createNotification(db, 'low_stock', 'Low Stock Alert', `${name} is below minimum stock level (${quantity}/${min_stock})`, 'warning', id);
    }

    const med = db.prepare(`SELECT m.*, c.name as category_name FROM medicines m LEFT JOIN categories c ON m.category_id = c.id WHERE m.id = ?`).get(id);
    res.status(201).json({ success: true, message: 'Medicine created successfully', data: med });
  } catch (err) {
    next(err);
  }
};

// PUT /api/medicines/:id
const update = (req, res, next) => {
  try {
    const db = getDB();
    const existing = db.prepare(`SELECT * FROM medicines WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Medicine not found' });

    const {
      barcode, name, generic_name, brand, category_id, description, supplier_id,
      purchase_price, selling_price, min_stock, batch_number, manufacturing_date,
      expiry_date, storage_location, prescription_required, status,
    } = req.body;

    db.prepare(`
      UPDATE medicines SET barcode=?, name=?, generic_name=?, brand=?, category_id=?, description=?,
        supplier_id=?, purchase_price=?, selling_price=?, min_stock=?, batch_number=?,
        manufacturing_date=?, expiry_date=?, storage_location=?, prescription_required=?, status=?
      WHERE id=?
    `).run(
      barcode || null, name || existing.name, generic_name, brand, category_id, description, supplier_id,
      purchase_price ?? existing.purchase_price, selling_price ?? existing.selling_price,
      min_stock ?? existing.min_stock, batch_number, manufacturing_date, expiry_date,
      storage_location, prescription_required !== undefined ? (prescription_required ? 1 : 0) : existing.prescription_required,
      status || existing.status, req.params.id
    );

    createNotification(db, 'medicine_updated', 'Medicine Updated', `${name || existing.name} has been updated`, 'info', req.params.id);
    logActivity({ user_id: req.user.id, username: req.user.username, action: 'UPDATE_MEDICINE', module: 'medicines', description: `Updated medicine: ${existing.name}`, old_value: existing, new_value: req.body, ip_address: req.ip });

    const updated = db.prepare(`SELECT m.*, c.name as category_name, s.name as supplier_name FROM medicines m LEFT JOIN categories c ON m.category_id = c.id LEFT JOIN suppliers s ON m.supplier_id = s.id WHERE m.id = ?`).get(req.params.id);
    res.json({ success: true, message: 'Medicine updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/medicines/:id (Admin only)
const remove = (req, res, next) => {
  try {
    const db = getDB();
    const med = db.prepare(`SELECT * FROM medicines WHERE id = ?`).get(req.params.id);
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });

    db.prepare(`DELETE FROM medicines WHERE id = ?`).run(req.params.id);
    createNotification(db, 'medicine_deleted', 'Medicine Deleted', `${med.name} has been removed from inventory`, 'warning');
    logActivity({ user_id: req.user.id, username: req.user.username, action: 'DELETE_MEDICINE', module: 'medicines', description: `Deleted medicine: ${med.name}`, old_value: med, ip_address: req.ip });
    res.json({ success: true, message: 'Medicine deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/medicines/:id/quantity
const adjustQuantity = (req, res, next) => {
  try {
    const db = getDB();
    const med = db.prepare(`SELECT * FROM medicines WHERE id = ?`).get(req.params.id);
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });

    const { adjustment, action = 'adjustment', notes } = req.body;
    const newQty = med.quantity + parseInt(adjustment);
    if (newQty < 0) return res.status(400).json({ success: false, message: 'Insufficient stock' });

    db.prepare(`UPDATE medicines SET quantity = ?, updated_at = datetime('now') WHERE id = ?`).run(newQty, med.id);
    db.prepare(`INSERT INTO inventory_logs (id, medicine_id, medicine_name, action, quantity_change, quantity_before, quantity_after, worker_id, notes)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(generateId(), med.id, med.name, action, adjustment, med.quantity, newQty, req.user.id, notes);

    if (newQty <= med.min_stock) {
      createNotification(db, 'low_stock', 'Low Stock Alert', `${med.name} is below minimum stock level (${newQty}/${med.min_stock})`, 'warning', med.id);
    }

    logActivity({ user_id: req.user.id, username: req.user.username, action: 'ADJUST_QUANTITY', module: 'inventory', description: `Adjusted ${med.name} by ${adjustment} (${med.quantity} → ${newQty})`, ip_address: req.ip });
    res.json({ success: true, message: 'Stock adjusted successfully', data: { ...med, quantity: newQty } });
  } catch (err) {
    next(err);
  }
};

// GET /api/medicines/search
const search = (req, res, next) => {
  try {
    const db = getDB();
    const { q = '', limit = 10 } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const meds = db.prepare(`
      SELECT m.id, m.name, m.generic_name, m.brand, m.barcode, m.selling_price, m.purchase_price, m.quantity, m.prescription_required,
             c.name as category_name
      FROM medicines m LEFT JOIN categories c ON m.category_id = c.id
      WHERE (m.name LIKE ? OR m.generic_name LIKE ? OR m.barcode = ? OR m.brand LIKE ?)
        AND m.status = 'active' AND m.quantity > 0
      LIMIT ?
    `).all(`%${q}%`, `%${q}%`, q, `%${q}%`, parseInt(limit));

    res.json({ success: true, data: meds });
  } catch (err) {
    next(err);
  }
};

// GET /api/medicines/categories
const getCategories = (req, res, next) => {
  try {
    const db = getDB();
    const cats = db.prepare(`SELECT c.*, COUNT(m.id) as medicine_count FROM categories c LEFT JOIN medicines m ON c.id = m.category_id GROUP BY c.id ORDER BY c.name`).all();
    res.json({ success: true, data: cats });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, remove, adjustQuantity, search, getCategories };
