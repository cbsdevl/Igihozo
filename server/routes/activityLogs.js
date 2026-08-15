const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

router.use(authenticate, requireAdmin);
router.get('/', ctrl.getAll);
router.get('/modules', ctrl.getModules);

module.exports = router;
