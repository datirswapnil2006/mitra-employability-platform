const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getSessions,
  revokeSession,
  getMe,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  getEmailStatus,
  testEmailSend,
  updateThemePreferences
} = require('./auth.controller');
const { protect } = require('../../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/logout-all', protect, logoutAll);
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:sessionId', protect, revokeSession);

router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/theme', protect, updateThemePreferences);

// Email testing & diagnostic endpoints
router.get('/email-diagnostic', getEmailStatus);
router.get('/test-email', testEmailSend);
router.post('/test-email', testEmailSend);

module.exports = router;
