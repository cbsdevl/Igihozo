const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

router.use(authenticate, requireAdmin);
router.get('/', ctrl.getAll);
router.put('/', ctrl.updateSettings);
router.post('/backup', ctrl.backup);
router.get('/backups', ctrl.listBackups);

module.exports = router;
