const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/medicineController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/search', ctrl.search);
router.get('/categories', ctrl.getCategories);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Medicine name is required'),
  body('purchase_price').isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  body('selling_price').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
], validate, ctrl.create);

router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('selling_price').optional().isFloat({ min: 0 }),
], validate, ctrl.update);

router.patch('/:id/quantity', [
  body('adjustment').isInt().withMessage('Adjustment must be an integer'),
], validate, ctrl.adjustQuantity);

router.delete('/:id', requireAdmin, ctrl.remove);

module.exports = router;
