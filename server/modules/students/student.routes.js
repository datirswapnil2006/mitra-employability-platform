const express = require('express');
const router = express.Router();
const {
  getStudentProfile,
  updateStudentProfile,
  uploadProfilePhoto,
  getAllStudentsAdmin,
  adminResetStudentPassword,
  getDistinctBatches
} = require('./student.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');

router.get('/batches', protect, getDistinctBatches);
router.get('/profile', protect, getStudentProfile);
router.put('/profile', protect, updateStudentProfile);
router.post('/profile/photo', protect, uploadProfilePhoto);
router.post('/upload-photo', protect, uploadProfilePhoto);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllStudentsAdmin);
router.post('/admin/reset-password/:userId', protect, authorize('admin'), adminResetStudentPassword);

module.exports = router;
