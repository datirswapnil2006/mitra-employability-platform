const express = require('express');
const router = express.Router();
const {
  startAssessment,
  respondToQuestion,
  evaluateAssessment,
  getAssessmentHistory,
  getAssessmentAttemptById
} = require('./communication.controller');
const { protect } = require('../../middleware/authMiddleware');
const { requireCompleteProfile } = require('../../middleware/profileMiddleware');

// All communication assessment endpoints are protected and require 100% profile completion
router.post('/start', protect, requireCompleteProfile, startAssessment);
router.post('/respond', protect, requireCompleteProfile, respondToQuestion);
router.post('/evaluate', protect, requireCompleteProfile, evaluateAssessment);
router.get('/history', protect, requireCompleteProfile, getAssessmentHistory);
router.get('/attempt/:id', protect, requireCompleteProfile, getAssessmentAttemptById);

module.exports = router;
