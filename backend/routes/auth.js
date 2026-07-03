const express = require('express');
const router = express.Router();
const { login, getMe, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/reset-password', protect, resetPassword);

module.exports = router;
