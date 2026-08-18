const express = require('express');
const router = express.Router();
const {
  getPsychometricQuestions,
  evaluatePsychometric,
  getStudentPsychometricProfile,
  getPsychometricAdminSummary,
  generateAIAssessment,
  createPsychometricQuestion,
  generateAIPsychometricQuestions,
  deletePsychometricQuestion
} = require('./ai.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const { requireCompleteProfile } = require('../../middleware/profileMiddleware');

// Student Psychometric Endpoints
router.get('/psychometric/questions', protect, requireCompleteProfile, getPsychometricQuestions);
router.post('/psychometric/evaluate', protect, requireCompleteProfile, evaluatePsychometric);
router.get('/psychometric/profile', protect, requireCompleteProfile, getStudentPsychometricProfile);

// Admin Psychometric Summary & Question Management
router.get('/psychometric/admin/summary', protect, authorize('admin'), getPsychometricAdminSummary);
router.get('/psychometric/admin/questions', protect, authorize('admin'), getPsychometricQuestions);
router.post('/psychometric/admin/create-question', protect, authorize('admin'), createPsychometricQuestion);
router.post('/psychometric/admin/generate-ai-questions', protect, authorize('admin'), generateAIPsychometricQuestions);
router.delete('/psychometric/admin/question/:id', protect, authorize('admin'), deletePsychometricQuestion);

// Adaptive AI Submodule Assessment
router.post('/generate-assessment', protect, generateAIAssessment);

module.exports = router;
