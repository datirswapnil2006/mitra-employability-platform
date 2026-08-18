const express = require('express');
const router = express.Router();
const {
  getAssessments,
  getAssessmentById,
  submitAssessment,
  getAttemptById,
  getStudentAttempts,
  getAllAssessmentsAdmin,
  generateAIAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getAllAttemptsAdmin
} = require('./assessment.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const { requireCompleteProfile } = require('../../middleware/profileMiddleware');

// Student endpoints
router.get('/', protect, requireCompleteProfile, getAssessments);
router.get('/take/:id', protect, requireCompleteProfile, getAssessmentById);
router.post('/submit', protect, requireCompleteProfile, submitAssessment);
router.get('/attempt/:id', protect, requireCompleteProfile, getAttemptById);
router.get('/attempts', protect, requireCompleteProfile, getStudentAttempts);

// Admin endpoints
router.get('/admin/all', protect, authorize('admin'), getAllAssessmentsAdmin);
router.get('/admin/results', protect, authorize('admin'), getAllAttemptsAdmin);
router.post('/admin/generate-ai', protect, authorize('admin'), generateAIAssessment);
router.post('/admin/create', protect, authorize('admin'), createAssessment);
router.put('/admin/:id', protect, authorize('admin'), updateAssessment);
router.delete('/admin/:id', protect, authorize('admin'), deleteAssessment);

module.exports = router;
