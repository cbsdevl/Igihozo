const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/supplierController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', requireAdmin, [body('name').trim().notEmpty()], validate, ctrl.create);
router.put('/:id', requireAdmin, ctrl.update);
router.delete('/:id', requireAdmin, ctrl.remove);

module.exports = router;
