const { getDB } = require('../config/db');
const { paginate } = require('../utils/helpers');

// GET /api/activity-logs
const getAll = (req, res, next) => {
  try {
    const db = getDB();
    const { page = 1, limit = 30, user_id, module, action, date_from, date_to, status } = req.query;
    const { offset, limit: lim } = paginate(page, limit);

    let conditions = ['1=1'];
    let params = [];
    if (user_id) { conditions.push(`a.user_id = ?`); params.push(user_id); }
    if (module) { conditions.push(`a.module = ?`); params.push(module); }
    if (action) { conditions.push(`a.action LIKE ?`); params.push(`%${action}%`); }
    if (status) { conditions.push(`a.status = ?`); params.push(status); }
    if (date_from) { conditions.push(`a.created_at >= ?`); params.push(date_from); }
    if (date_to) { conditions.push(`a.created_at <= ?`); params.push(date_to + ' 23:59:59'); }

    const where = conditions.join(' AND ');
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM activity_logs a WHERE ${where}`).get(...params);
    const logs = db.prepare(`SELECT a.* FROM activity_logs a WHERE ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`).all(...params, lim, offset);

    res.json({ success: true, data: logs, pagination: { page: parseInt(page), limit: lim, total: countRow.total, pages: Math.ceil(countRow.total / lim) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/activity-logs/modules
const getModules = (req, res, next) => {
  try {
    const db = getDB();
    const modules = db.prepare(`SELECT DISTINCT module FROM activity_logs ORDER BY module`).all();
    res.json({ success: true, data: modules.map(m => m.module) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getModules };
