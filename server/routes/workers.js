const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/workerController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { validate } = require('../middleware/validate');

router.use(authenticate, requireAdmin);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);

router.post('/', [
  body('username').trim().notEmpty().isLength({ min: 3 }),
  body('full_name').trim().notEmpty(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, ctrl.create);

router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
