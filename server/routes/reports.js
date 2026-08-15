const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

router.use(authenticate);

router.get('/dashboard', ctrl.dashboard);
router.get('/daily', ctrl.daily);
router.get('/weekly', ctrl.weekly);
router.get('/monthly', ctrl.monthly);
router.get('/expired', ctrl.expiredReport);
router.get('/low-stock', ctrl.lowStockReport);
router.get('/profit', requireAdmin, ctrl.profitReport);
router.get('/inventory', ctrl.inventoryReport);

module.exports = router;
