const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/overview', ctrl.overview);
router.get('/', ctrl.getAll);

module.exports = router;
