const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.patch('/read-all', ctrl.markAllRead);
router.delete('/clear-read', ctrl.clearRead);
router.patch('/:id/read', ctrl.markRead);
router.delete('/:id', ctrl.remove);

module.exports = router;
