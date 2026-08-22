const express = require('express');
const router = express.Router();
const {
  // Test CRUD & AI Builder
  getPsychometricTests,
  getPsychometricTestById,
  createPsychometricTest,
  updatePsychometricTest,
  togglePsychometricTestStatus,
  deletePsychometricTest,
  getBlueprintPreview,
  generateDynamicAIQuestions,
  generate50AIQuestions,
  generateMissingQuestions,

  // Student Attempt & Scoring
  submitPsychometricAttempt,
  getStudentPsychometricProfile,
  getStudentAttempts,
  getPsychometricAttemptById,

  // Admin Analytics & Insights
  getPsychometricAdminSummary,

  // Legacy compatibility
  getPsychometricQuestions,
  evaluatePsychometric,
  createPsychometricQuestion,
  generateAIPsychometricQuestions,
  deletePsychometricQuestion,
  generateAIAssessment
} = require('./ai.controller');

const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const { requireCompleteProfile } = require('../../middleware/profileMiddleware');

// ==========================================
// Psychometric Test Management (Admin & Student)
// ==========================================
// List published tests for students, or all tests for admin
router.get(['/', '/tests', '/psychometric', '/psychometric/tests'], protect, getPsychometricTests);
router.get(['/tests/:id', '/psychometric/tests/:id'], protect, getPsychometricTestById);

// Admin Test CRUD & Dynamic Question Blueprint Generator (1 to 50 questions)
router.post(['/', '/psychometric'], protect, authorize('admin'), createPsychometricTest);
router.post(['/admin/generate', '/admin/generate-ai', '/psychometric/admin/generate', '/psychometric/admin/generate-ai'], protect, authorize('admin'), generateDynamicAIQuestions);
router.post(['/admin/generate-50', '/psychometric/admin/generate-50'], protect, authorize('admin'), generate50AIQuestions);
router.post(['/admin/generate-missing', '/psychometric/admin/generate-missing'], protect, authorize('admin'), generateMissingQuestions);
router.post(['/admin/blueprint-preview', '/psychometric/admin/blueprint-preview'], protect, authorize('admin'), getBlueprintPreview);

// Admin Psychometric Intelligence & Cohort Reports (must precede /:id)
router.get(['/admin/summary', '/psychometric/admin/summary'], protect, authorize('admin'), getPsychometricAdminSummary);
router.get(['/admin/questions', '/psychometric/admin/questions'], protect, authorize('admin'), getPsychometricQuestions);
router.post(['/admin/create-question', '/psychometric/admin/create-question'], protect, authorize('admin'), createPsychometricQuestion);
router.post(['/admin/generate-ai-questions', '/psychometric/admin/generate-ai-questions'], protect, authorize('admin'), generateAIPsychometricQuestions);
router.delete(['/admin/question/:id', '/psychometric/admin/question/:id'], protect, authorize('admin'), deletePsychometricQuestion);

// Student Assessment & Attempt Execution (must precede /:id)
router.post(['/attempt', '/:id/attempt', '/psychometric/attempt', '/psychometric/:id/attempt'], protect, requireCompleteProfile, submitPsychometricAttempt);
router.get(['/profile', '/psychometric/profile'], protect, requireCompleteProfile, getStudentPsychometricProfile);
router.get(['/attempts/my', '/psychometric/attempts/my'], protect, requireCompleteProfile, getStudentAttempts);
router.get(['/attempts/:id', '/psychometric/attempts/:id'], protect, getPsychometricAttemptById);

// Questions & evaluation
router.get(['/questions', '/psychometric/questions'], protect, requireCompleteProfile, getPsychometricQuestions);
router.post(['/evaluate', '/psychometric/evaluate'], protect, requireCompleteProfile, evaluatePsychometric);

// Adaptive AI Submodule Assessment
router.post(['/generate-assessment', '/ai/generate-assessment'], protect, generateAIAssessment);

// Test modification & single test lookup
router.put(['/:id', '/psychometric/:id'], protect, authorize('admin'), updatePsychometricTest);
router.patch(['/:id/toggle', '/psychometric/:id/toggle'], protect, authorize('admin'), togglePsychometricTestStatus);
router.delete(['/:id', '/psychometric/:id'], protect, authorize('admin'), deletePsychometricTest);
router.get(['/:id', '/psychometric/:id'], protect, getPsychometricTestById);

module.exports = router;
