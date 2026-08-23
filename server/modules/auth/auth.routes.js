const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, getEmailStatus, testEmailSend, updateThemePreferences } = require('./auth.controller');
const { protect } = require('../../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);
router.put('/theme', protect, updateThemePreferences);

// Email testing & diagnostic endpoints
router.get('/email-diagnostic', getEmailStatus);
router.get('/test-email', testEmailSend);
router.post('/test-email', testEmailSend);

module.exports = router;

