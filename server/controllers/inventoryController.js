const { getDB } = require('../config/db');
const { generateId, paginate } = require('../utils/helpers');

// GET /api/inventory
const getAll = (req, res, next) => {
  try {
    const db = getDB();
    const { page = 1, limit = 30, medicine_id, action, date_from, date_to } = req.query;
    const { offset, limit: lim } = paginate(page, limit);

    let conditions = ['1=1'];
    let params = [];
    if (medicine_id) { conditions.push(`il.medicine_id = ?`); params.push(medicine_id); }
    if (action) { conditions.push(`il.action = ?`); params.push(action); }
    if (date_from) { conditions.push(`il.created_at >= ?`); params.push(date_from); }
    if (date_to) { conditions.push(`il.created_at <= ?`); params.push(date_to + ' 23:59:59'); }

    const where = conditions.join(' AND ');
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM inventory_logs il WHERE ${where}`).get(...params);
    const logs = db.prepare(`
      SELECT il.*, u.full_name as worker_name
      FROM inventory_logs il LEFT JOIN users u ON il.worker_id = u.id
      WHERE ${where} ORDER BY il.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, lim, offset);

    res.json({ success: true, data: logs, pagination: { page: parseInt(page), limit: lim, total: countRow.total, pages: Math.ceil(countRow.total / lim) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/inventory/overview
const overview = (req, res, next) => {
  try {
    const db = getDB();
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_medicines,
        SUM(quantity) as total_units,
        SUM(quantity * purchase_price) as total_purchase_value,
        SUM(quantity * selling_price) as total_retail_value,
        SUM(CASE WHEN quantity <= min_stock THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN expiry_date < date('now') THEN 1 ELSE 0 END) as expired_count,
        SUM(CASE WHEN expiry_date BETWEEN date('now') AND date('now','+30 days') THEN 1 ELSE 0 END) as near_expiry_count
      FROM medicines WHERE status='active'
    `).get();

    const recentMovements = db.prepare(`
      SELECT il.*, u.full_name as worker_name FROM inventory_logs il
      LEFT JOIN users u ON il.worker_id = u.id
      ORDER BY il.created_at DESC LIMIT 20
    `).all();

    res.json({ success: true, data: { stats, recentMovements } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, overview };
