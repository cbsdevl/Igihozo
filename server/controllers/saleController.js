const { getDB } = require('../config/db');
const { generateId, generateInvoiceNumber, calculateProfit, paginate } = require('../utils/helpers');
const { logActivity } = require('../middleware/errorHandler');

const createNotification = (db, type, title, message, severity = 'info', referenceId = null) => {
  db.prepare(`INSERT INTO notifications (id, type, title, message, severity, reference_id) VALUES (?,?,?,?,?,?)`).run(generateId(), type, title, message, severity, referenceId);
};

// POST /api/sales
const createSale = (req, res, next) => {
  try {
    const db = getDB();
    const {
      items, customer_id, customer_name, discount = 0, tax = 0,
      amount_paid, payment_method = 'cash', notes
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Sale items are required' });
    }

    // Validate stock and prices
    for (const item of items) {
      const med = db.prepare(`SELECT * FROM medicines WHERE id = ? AND status = 'active'`).get(item.medicine_id);
      if (!med) return res.status(400).json({ success: false, message: `Medicine not found: ${item.medicine_id}` });
      if (med.quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${med.name}. Available: ${med.quantity}` });
      }
    }

    const sale = db.transaction(() => {
      const saleId = generateId();
      const invoiceNumber = generateInvoiceNumber();

      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        const med = db.prepare(`SELECT * FROM medicines WHERE id = ?`).get(item.medicine_id);
        const unitPrice = item.unit_price || med.selling_price;
        const itemDiscount = item.discount || 0;
        const itemTotal = (unitPrice * item.quantity) - itemDiscount;
        subtotal += itemTotal;

        processedItems.push({
          id: generateId(),
          sale_id: saleId,
          medicine_id: med.id,
          medicine_name: med.name,
          quantity: item.quantity,
          unit_price: unitPrice,
          purchase_price: med.purchase_price,
          discount: itemDiscount,
          total: itemTotal,
        });
      }

      const total = subtotal - discount + tax;
      const balance = amount_paid - total;

      // Insert sale
      db.prepare(`
        INSERT INTO sales (id, invoice_number, worker_id, customer_id, customer_name, subtotal, discount, tax, total, amount_paid, payment_method, notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(saleId, invoiceNumber, req.user.id, customer_id || null, customer_name || null, subtotal, discount, tax, total, amount_paid, payment_method, notes);

      // Insert sale items and update inventory
      for (const si of processedItems) {
        db.prepare(`
          INSERT INTO sale_items (id, sale_id, medicine_id, medicine_name, quantity, unit_price, purchase_price, discount, total)
          VALUES (@id, @sale_id, @medicine_id, @medicine_name, @quantity, @unit_price, @purchase_price, @discount, @total)
        `).run(si);

        // Deduct inventory
        const med = db.prepare(`SELECT quantity, min_stock FROM medicines WHERE id = ?`).get(si.medicine_id);
        const newQty = med.quantity - si.quantity;
        db.prepare(`UPDATE medicines SET quantity = ?, updated_at = datetime('now') WHERE id = ?`).run(newQty, si.medicine_id);

        // Inventory log
        db.prepare(`INSERT INTO inventory_logs (id, medicine_id, medicine_name, action, quantity_change, quantity_before, quantity_after, reference_id, worker_id)
          VALUES (?,?,?,?,?,?,?,?,?)`).run(generateId(), si.medicine_id, si.medicine_name, 'sale', -si.quantity, med.quantity, newQty, saleId, req.user.id);

        // Low stock notification
        if (newQty <= med.min_stock) {
          createNotification(db, 'low_stock', 'Low Stock Alert', `${si.medicine_name} is running low (${newQty} remaining)`, 'warning', si.medicine_id);
        }
      }

      // Large sale notification (> 100,000 RWF)
      if (total > 100000) {
        createNotification(db, 'large_sale', 'Large Sale', `Sale of ${total.toLocaleString()} RWF recorded by ${req.user.username}`, 'info', saleId);
      }

      return db.prepare(`SELECT * FROM sales WHERE id = ?`).get(saleId);
    })();

    const saleWithItems = {
      ...sale,
      items: db.prepare(`SELECT * FROM sale_items WHERE sale_id = ?`).all(sale.id),
    };

    logActivity({ user_id: req.user.id, username: req.user.username, action: 'CREATE_SALE', module: 'sales', description: `Sale ${sale.invoice_number} - Total: ${sale.total}`, new_value: { invoice: sale.invoice_number, total: sale.total }, ip_address: req.ip });

    res.status(201).json({ success: true, message: 'Sale created successfully', data: saleWithItems });
  } catch (err) {
    next(err);
  }
};

// GET /api/sales
const getAll = (req, res, next) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, search = '', worker_id, payment_method, date_from, date_to, sort = 'created_at', order = 'DESC' } = req.query;
    const { offset, limit: lim } = paginate(page, limit);

    let conditions = ['1=1'];
    let params = [];

    // Workers only see their own sales
    if (req.user.role !== 'admin') { conditions.push(`s.worker_id = ?`); params.push(req.user.id); }
    else if (worker_id) { conditions.push(`s.worker_id = ?`); params.push(worker_id); }

    if (search) { conditions.push(`(s.invoice_number LIKE ? OR s.customer_name LIKE ?)`); const sr = `%${search}%`; params.push(sr, sr); }
    if (payment_method) { conditions.push(`s.payment_method = ?`); params.push(payment_method); }
    if (date_from) { conditions.push(`s.created_at >= ?`); params.push(date_from); }
    if (date_to) { conditions.push(`s.created_at <= ?`); params.push(date_to + ' 23:59:59'); }

    const allowedSorts = ['created_at', 'total', 'invoice_number'];
    const safeSort = allowedSorts.includes(sort) ? `s.${sort}` : 's.created_at';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const where = conditions.join(' AND ');
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM sales s WHERE ${where}`).get(...params);
    const sales = db.prepare(`
      SELECT s.*, u.full_name as worker_name
      FROM sales s LEFT JOIN users u ON s.worker_id = u.id
      WHERE ${where}
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `).all(...params, lim, offset);

    res.json({ success: true, data: sales, pagination: { page: parseInt(page), limit: lim, total: countRow.total, pages: Math.ceil(countRow.total / lim) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/sales/:id
const getOne = (req, res, next) => {
  try {
    const db = getDB();
    const sale = db.prepare(`
      SELECT s.*, u.full_name as worker_name, u.username as worker_username
      FROM sales s LEFT JOIN users u ON s.worker_id = u.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    if (req.user.role !== 'admin' && sale.worker_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const items = db.prepare(`SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id`).all(sale.id);
    const settings = db.prepare(`SELECT key, value FROM settings WHERE key IN ('pharmacy_name','pharmacy_address','pharmacy_phone','receipt_footer','currency')`).all();
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

    res.json({ success: true, data: { ...sale, items, pharmacy: settingsMap } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/sales/:id/cancel (Admin only)
const cancelSale = (req, res, next) => {
  try {
    const db = getDB();
    const sale = db.prepare(`SELECT * FROM sales WHERE id = ?`).get(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    if (sale.status !== 'completed') return res.status(400).json({ success: false, message: 'Sale cannot be cancelled' });

    db.transaction(() => {
      db.prepare(`UPDATE sales SET status = 'cancelled' WHERE id = ?`).run(sale.id);

      // Restore inventory
      const items = db.prepare(`SELECT * FROM sale_items WHERE sale_id = ?`).all(sale.id);
      for (const item of items) {
        const med = db.prepare(`SELECT quantity FROM medicines WHERE id = ?`).get(item.medicine_id);
        const newQty = (med?.quantity || 0) + item.quantity;
        db.prepare(`UPDATE medicines SET quantity = ? WHERE id = ?`).run(newQty, item.medicine_id);
        db.prepare(`INSERT INTO inventory_logs (id, medicine_id, medicine_name, action, quantity_change, quantity_before, quantity_after, reference_id, worker_id, notes)
          VALUES (?,?,?,?,?,?,?,?,?,?)`).run(generateId(), item.medicine_id, item.medicine_name, 'return', item.quantity, med?.quantity || 0, newQty, sale.id, req.user.id, 'Sale cancellation');
      }
    })();

    logActivity({ user_id: req.user.id, username: req.user.username, action: 'CANCEL_SALE', module: 'sales', description: `Cancelled sale ${sale.invoice_number}`, ip_address: req.ip });
    res.json({ success: true, message: 'Sale cancelled and inventory restored' });
  } catch (err) {
    next(err);
  }
};

// GET /api/sales/stats
const getStats = (req, res, next) => {
  try {
    const db = getDB();
    const today = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue, COALESCE(SUM(total - (SELECT COALESCE(SUM(si.purchase_price*si.quantity),0) FROM sale_items si WHERE si.sale_id=s.id)),0) as profit FROM sales s WHERE date(s.created_at)=date('now') AND s.status='completed'`).get();
    const week = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM sales WHERE created_at>=date('now','weekday 1','-7 days') AND status='completed'`).get();
    const month = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM sales WHERE strftime('%Y-%m',created_at)=strftime('%Y-%m','now') AND status='completed'`).get();

    const salesByMonth = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count, COALESCE(SUM(total),0) as revenue
      FROM sales WHERE status='completed' AND created_at >= date('now','-12 months')
      GROUP BY month ORDER BY month
    `).all();

    const topMedicines = db.prepare(`
      SELECT si.medicine_name, SUM(si.quantity) as total_qty, SUM(si.total) as total_revenue
      FROM sale_items si JOIN sales s ON si.sale_id = s.id
      WHERE s.status='completed' AND s.created_at >= date('now','-30 days')
      GROUP BY si.medicine_name ORDER BY total_qty DESC LIMIT 10
    `).all();

    res.json({ success: true, data: { today, week, month, salesByMonth, topMedicines } });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSale, getAll, getOne, cancelSale, getStats };
