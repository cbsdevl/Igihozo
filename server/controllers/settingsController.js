const { getDB } = require('../config/db');
const { logActivity } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');

// GET /api/settings
const getAll = (req, res, next) => {
  try {
    const db = getDB();
    const settings = db.prepare(`SELECT key, value, label FROM settings ORDER BY key`).all();
    const map = Object.fromEntries(settings.map(s => [s.key, { value: s.value, label: s.label }]));
    res.json({ success: true, data: map });
  } catch (err) {
    next(err);
  }
};

// PUT /api/settings
const updateSettings = (req, res, next) => {
  try {
    const db = getDB();
    const updates = req.body; // { key: value, key2: value2 }

    const stmt = db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?,?,datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`);

    const updateMany = db.transaction(() => {
      for (const [key, value] of Object.entries(updates)) {
        stmt.run(key, String(value));
      }
    });
    updateMany();

    logActivity({ user_id: req.user.id, username: req.user.username, action: 'UPDATE_SETTINGS', module: 'settings', description: 'System settings updated', new_value: updates, ip_address: req.ip });
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/settings/backup
const backup = (req, res, next) => {
  try {
    const db = getDB();
    const { generateId } = require('../utils/helpers');

    const dbPath = path.resolve(__dirname, '../../database/gihozo.db');
    const backupsDir = path.resolve(__dirname, '../../database/backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `gihozo_backup_${timestamp}.db`;
    const destPath = path.join(backupsDir, filename);

    fs.copyFileSync(dbPath, destPath);
    const stats = fs.statSync(destPath);

    const backupId = generateId();
    db.prepare(`INSERT INTO backups (id, filename, file_path, file_size, created_by) VALUES (?,?,?,?,?)`).run(backupId, filename, destPath, stats.size, req.user.id);
    db.prepare(`INSERT INTO notifications (id, type, title, message, severity) VALUES (?,?,?,?,?)`).run(generateId(), 'backup', 'Backup Completed', `Database backup created: ${filename}`, 'success');

    logActivity({ user_id: req.user.id, username: req.user.username, action: 'BACKUP_DB', module: 'settings', description: `Database backup: ${filename}`, ip_address: req.ip });
    res.json({ success: true, message: 'Backup created successfully', data: { filename, size: stats.size } });
  } catch (err) {
    next(err);
  }
};

// GET /api/settings/backups
const listBackups = (req, res, next) => {
  try {
    const db = getDB();
    const backups = db.prepare(`SELECT b.*, u.full_name as created_by_name FROM backups b LEFT JOIN users u ON b.created_by = u.id ORDER BY b.created_at DESC`).all();
    res.json({ success: true, data: backups });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, updateSettings, backup, listBackups };
