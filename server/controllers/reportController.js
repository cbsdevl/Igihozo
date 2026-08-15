const { getDB } = require('../config/db');
const { paginate, startOfToday, startOfWeek, startOfMonth, startOfYear } = require('../utils/helpers');

// GET /api/reports/dashboard
const dashboard = (req, res, next) => {
  try {
    const db = getDB();

    // KPI cards
    const todaySales = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM sales WHERE date(created_at)=date('now') AND status='completed'`).get();
    const weeklySales = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM sales WHERE created_at>=datetime('now','-7 days') AND status='completed'`).get();
    const monthlySales = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM sales WHERE strftime('%Y-%m',created_at)=strftime('%Y-%m','now') AND status='completed'`).get();

    // Profit (revenue - cost)
    const todayProfit = db.prepare(`
      SELECT COALESCE(SUM(si.profit),0) as profit
      FROM sale_items si JOIN sales s ON si.sale_id=s.id
      WHERE date(s.created_at)=date('now') AND s.status='completed'
    `).get();
    const monthlyProfit = db.prepare(`
      SELECT COALESCE(SUM(si.profit),0) as profit
      FROM sale_items si JOIN sales s ON si.sale_id=s.id
      WHERE strftime('%Y-%m',s.created_at)=strftime('%Y-%m','now') AND s.status='completed'
    `).get();

    // Medicine stats
    const totalMedicines = db.prepare(`SELECT COUNT(*) as count FROM medicines WHERE status='active'`).get();
    const lowStock = db.prepare(`SELECT COUNT(*) as count FROM medicines WHERE quantity <= min_stock AND status='active'`).get();
    const expired = db.prepare(`SELECT COUNT(*) as count FROM medicines WHERE expiry_date < date('now') AND status='active'`).get();
    const nearExpiry = db.prepare(`SELECT COUNT(*) as count FROM medicines WHERE expiry_date BETWEEN date('now') AND date('now','+30 days') AND status='active'`).get();

    // Workers online today (logged in today)
    const workersOnline = db.prepare(`SELECT COUNT(*) as count FROM users WHERE date(last_login)=date('now') AND is_active=1`).get();

    // Sales by month (last 12)
    const salesByMonth = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month,
             COALESCE(SUM(total),0) as revenue,
             COUNT(*) as count
      FROM sales WHERE status='completed' AND created_at>=date('now','-12 months')
      GROUP BY month ORDER BY month
    `).all();

    // Profit by month
    const profitByMonth = db.prepare(`
      SELECT strftime('%Y-%m', s.created_at) as month, COALESCE(SUM(si.profit),0) as profit
      FROM sale_items si JOIN sales s ON si.sale_id=s.id
      WHERE s.status='completed' AND s.created_at>=date('now','-12 months')
      GROUP BY month ORDER BY month
    `).all();

    // Category distribution
    const categoryStats = db.prepare(`
      SELECT c.name, COUNT(m.id) as count FROM categories c
      LEFT JOIN medicines m ON c.id=m.category_id AND m.status='active'
      GROUP BY c.id HAVING count > 0 ORDER BY count DESC
    `).all();

    // Top selling medicines (30 days)
    const topMedicines = db.prepare(`
      SELECT si.medicine_name, SUM(si.quantity) as qty, SUM(si.total) as revenue
      FROM sale_items si JOIN sales s ON si.sale_id=s.id
      WHERE s.status='completed' AND s.created_at>=date('now','-30 days')
      GROUP BY si.medicine_name ORDER BY qty DESC LIMIT 8
    `).all();

    // Recent sales
    const recentSales = db.prepare(`
      SELECT s.*, u.full_name as worker_name FROM sales s
      LEFT JOIN users u ON s.worker_id=u.id
      WHERE s.status='completed' ORDER BY s.created_at DESC LIMIT 10
    `).all();

    // Recent activity
    const recentActivity = db.prepare(`
      SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10
    `).all();

    res.json({
      success: true,
      data: {
        kpi: { todaySales, weeklySales, monthlySales, todayProfit, monthlyProfit, totalMedicines, lowStock, nearExpiry, expired, workersOnline },
        charts: { salesByMonth, profitByMonth, categoryStats, topMedicines },
        recentSales,
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/daily?date=2024-01-01
const daily = (req, res, next) => {
  try {
    const db = getDB();
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const sales = db.prepare(`SELECT s.*, u.full_name as worker_name FROM sales s LEFT JOIN users u ON s.worker_id=u.id WHERE date(s.created_at)=? AND s.status='completed' ORDER BY s.created_at DESC`).all(date);
    const summary = db.prepare(`SELECT COUNT(*) as total_transactions, COALESCE(SUM(total),0) as revenue, COALESCE(SUM(discount),0) as total_discounts FROM sales WHERE date(created_at)=? AND status='completed'`).get(date);
    const profit = db.prepare(`SELECT COALESCE(SUM(si.profit),0) as profit FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE date(s.created_at)=? AND s.status='completed'`).get(date);
    const workerPerf = db.prepare(`SELECT u.full_name, u.username, COUNT(s.id) as sales, COALESCE(SUM(s.total),0) as revenue FROM sales s JOIN users u ON s.worker_id=u.id WHERE date(s.created_at)=? AND s.status='completed' GROUP BY s.worker_id ORDER BY revenue DESC`).all(date);
    const topItems = db.prepare(`SELECT si.medicine_name, SUM(si.quantity) as qty, SUM(si.total) as revenue FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE date(s.created_at)=? AND s.status='completed' GROUP BY si.medicine_name ORDER BY qty DESC LIMIT 10`).all(date);

    res.json({ success: true, data: { date, summary: { ...summary, profit: profit.profit }, sales, workerPerformance: workerPerf, topItems } });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/weekly
const weekly = (req, res, next) => {
  try {
    const db = getDB();
    const summary = db.prepare(`SELECT COUNT(*) as transactions, COALESCE(SUM(total),0) as revenue FROM sales WHERE created_at>=date('now','-7 days') AND status='completed'`).get();
    const profit = db.prepare(`SELECT COALESCE(SUM(si.profit),0) as profit FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE s.created_at>=date('now','-7 days') AND s.status='completed'`).get();
    const dailyBreakdown = db.prepare(`SELECT date(created_at) as day, COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM sales WHERE created_at>=date('now','-7 days') AND status='completed' GROUP BY day ORDER BY day`).all();
    const topMeds = db.prepare(`SELECT si.medicine_name, SUM(si.quantity) as qty, SUM(si.total) as revenue FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE s.created_at>=date('now','-7 days') AND s.status='completed' GROUP BY si.medicine_name ORDER BY qty DESC LIMIT 10`).all();

    res.json({ success: true, data: { summary: { ...summary, profit: profit.profit }, dailyBreakdown, topMedicines: topMeds } });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/monthly?month=2024-01
const monthly = (req, res, next) => {
  try {
    const db = getDB();
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const summary = db.prepare(`SELECT COUNT(*) as transactions, COALESCE(SUM(total),0) as revenue FROM sales WHERE strftime('%Y-%m',created_at)=? AND status='completed'`).get(month);
    const profit = db.prepare(`SELECT COALESCE(SUM(si.profit),0) as profit FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE strftime('%Y-%m',s.created_at)=? AND s.status='completed'`).get(month);
    const dailyBreakdown = db.prepare(`SELECT date(created_at) as day, COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM sales WHERE strftime('%Y-%m',created_at)=? AND status='completed' GROUP BY day ORDER BY day`).all(month);
    const topMeds = db.prepare(`SELECT si.medicine_name, SUM(si.quantity) as qty, SUM(si.total) as revenue FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE strftime('%Y-%m',s.created_at)=? AND s.status='completed' GROUP BY si.medicine_name ORDER BY qty DESC LIMIT 10`).all(month);
    const workerPerf = db.prepare(`SELECT u.full_name, COUNT(s.id) as sales, COALESCE(SUM(s.total),0) as revenue FROM sales s JOIN users u ON s.worker_id=u.id WHERE strftime('%Y-%m',s.created_at)=? AND s.status='completed' GROUP BY s.worker_id ORDER BY revenue DESC`).all(month);

    res.json({ success: true, data: { month, summary: { ...summary, profit: profit.profit }, dailyBreakdown, topMedicines: topMeds, workerPerformance: workerPerf } });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/expired
const expiredReport = (req, res, next) => {
  try {
    const db = getDB();
    const expired = db.prepare(`SELECT m.*, c.name as category_name, s.name as supplier_name FROM medicines m LEFT JOIN categories c ON m.category_id=c.id LEFT JOIN suppliers s ON m.supplier_id=s.id WHERE m.expiry_date < date('now') AND m.status='active' ORDER BY m.expiry_date`).all();
    const near30 = db.prepare(`SELECT m.*, c.name as category_name FROM medicines m LEFT JOIN categories c ON m.category_id=c.id WHERE m.expiry_date BETWEEN date('now') AND date('now','+30 days') AND m.status='active' ORDER BY m.expiry_date`).all();
    const near60 = db.prepare(`SELECT m.*, c.name as category_name FROM medicines m LEFT JOIN categories c ON m.category_id=c.id WHERE m.expiry_date BETWEEN date('now','+30 days') AND date('now','+60 days') AND m.status='active' ORDER BY m.expiry_date`).all();

    const expiredLoss = expired.reduce((sum, m) => sum + (m.purchase_price * m.quantity), 0);
    res.json({ success: true, data: { expired, near30, near60, expiredLoss } });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/low-stock
const lowStockReport = (req, res, next) => {
  try {
    const db = getDB();
    const meds = db.prepare(`
      SELECT m.*, c.name as category_name, s.name as supplier_name, s.phone as supplier_phone
      FROM medicines m
      LEFT JOIN categories c ON m.category_id=c.id
      LEFT JOIN suppliers s ON m.supplier_id=s.id
      WHERE m.quantity <= m.min_stock AND m.status='active'
      ORDER BY (m.quantity * 1.0 / CASE WHEN m.min_stock=0 THEN 1 ELSE m.min_stock END) ASC
    `).all();

    res.json({ success: true, data: meds, total: meds.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/profit
const profitReport = (req, res, next) => {
  try {
    const db = getDB();
    const period = req.query.period || 'monthly';

    const today = db.prepare(`SELECT COALESCE(SUM(si.profit),0) as profit, COALESCE(SUM(s.total),0) as revenue FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE date(s.created_at)=date('now') AND s.status='completed'`).get();
    const week = db.prepare(`SELECT COALESCE(SUM(si.profit),0) as profit, COALESCE(SUM(s.total),0) as revenue FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE s.created_at>=date('now','-7 days') AND s.status='completed'`).get();
    const month = db.prepare(`SELECT COALESCE(SUM(si.profit),0) as profit, COALESCE(SUM(s.total),0) as revenue FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE strftime('%Y-%m',s.created_at)=strftime('%Y-%m','now') AND s.status='completed'`).get();
    const year = db.prepare(`SELECT COALESCE(SUM(si.profit),0) as profit, COALESCE(SUM(s.total),0) as revenue FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE strftime('%Y',s.created_at)=strftime('%Y','now') AND s.status='completed'`).get();

    const trend = db.prepare(`SELECT strftime('%Y-%m', s.created_at) as month, COALESCE(SUM(si.profit),0) as profit, COALESCE(SUM(s.total),0) as revenue FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE s.status='completed' AND s.created_at>=date('now','-12 months') GROUP BY month ORDER BY month`).all();

    res.json({ success: true, data: { today, week, month, year, trend } });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/inventory
const inventoryReport = (req, res, next) => {
  try {
    const db = getDB();
    const medicines = db.prepare(`SELECT m.*, c.name as category_name, s.name as supplier_name FROM medicines m LEFT JOIN categories c ON m.category_id=c.id LEFT JOIN suppliers s ON m.supplier_id=s.id WHERE m.status='active' ORDER BY m.name`).all();
    const summary = db.prepare(`SELECT COUNT(*) as total, SUM(quantity) as total_units, SUM(quantity*purchase_price) as total_value FROM medicines WHERE status='active'`).get();

    res.json({ success: true, data: { medicines, summary } });
  } catch (err) {
    next(err);
  }
};

module.exports = { dashboard, daily, weekly, monthly, expiredReport, lowStockReport, profitReport, inventoryReport };
