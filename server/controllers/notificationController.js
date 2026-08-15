const { getDB } = require('../config/db');
const { generateId, paginate } = require('../utils/helpers');

// GET /api/notifications
const getAll = (req, res, next) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, unread_only } = req.query;
    const { offset, limit: lim } = paginate(page, limit);

    let conditions = ['1=1'];
    let params = [];
    if (unread_only === 'true') { conditions.push(`is_read = 0`); }

    const where = conditions.join(' AND ');
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM notifications WHERE ${where}`).get(...params);
    const unreadCount = db.prepare(`SELECT COUNT(*) as count FROM notifications WHERE is_read = 0`).get();
    const notifications = db.prepare(`SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, lim, offset);

    res.json({ success: true, data: notifications, unreadCount: unreadCount.count, pagination: { page: parseInt(page), limit: lim, total: countRow.total, pages: Math.ceil(countRow.total / lim) } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
const markRead = (req, res, next) => {
  try {
    const db = getDB();
    db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ?`).run(req.params.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all
const markAllRead = (req, res, next) => {
  try {
    const db = getDB();
    db.prepare(`UPDATE notifications SET is_read = 1`).run();
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notifications/:id
const remove = (req, res, next) => {
  try {
    const db = getDB();
    db.prepare(`DELETE FROM notifications WHERE id = ?`).run(req.params.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notifications (clear all read)
const clearRead = (req, res, next) => {
  try {
    const db = getDB();
    db.prepare(`DELETE FROM notifications WHERE is_read = 1`).run();
    res.json({ success: true, message: 'Read notifications cleared' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, markRead, markAllRead, remove, clearRead };
