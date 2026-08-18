const express = require('express');
const router = express.Router();
const {
  getStudentProfile,
  updateStudentProfile,
  getAllStudentsAdmin,
  adminResetStudentPassword
} = require('./student.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');

router.get('/profile', protect, getStudentProfile);
router.put('/profile', protect, updateStudentProfile);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllStudentsAdmin);
router.post('/admin/reset-password/:userId', protect, authorize('admin'), adminResetStudentPassword);

module.exports = router;
