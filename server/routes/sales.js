const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/saleController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/stats', ctrl.getStats);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);

router.post('/', [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('amount_paid').isFloat({ min: 0 }).withMessage('Amount paid is required'),
], validate, ctrl.createSale);

router.patch('/:id/cancel', requireAdmin, ctrl.cancelSale);

module.exports = router;
