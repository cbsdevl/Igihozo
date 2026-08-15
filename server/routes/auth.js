const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, logout, profile, refresh, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, login);

router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, profile);
router.put('/change-password', authenticate, [
  body('current_password').notEmpty().withMessage('Current password required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], validate, changePassword);

module.exports = router;
