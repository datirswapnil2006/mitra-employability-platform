const express = require('express');
const router = express.Router();
const {
  getAssessments,
  getAssessmentById,
  submitAssessment,
  abandonAssessment,
  getAttemptById,
  getStudentAttempts,
  getAllAssessmentsAdmin,
  generateAIAssessment,
  generateQuestionsForReview,
  extractPdfQuestions,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getAllAttemptsAdmin,
  createPracticeTest,
  getDefaultTopicAssessment,
  getStudentSubmodulePracticeAnalytics
} = require('./assessment.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const { requireCompleteProfile } = require('../../middleware/profileMiddleware');

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB limit
});

const handlePdfUpload = (req, res, next) => {
  upload.single('pdfFile')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'The selected PDF file exceeds the 25MB limit. Please upload a smaller PDF file.'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error. Please select a valid PDF file.'
      });
    }
    next();
  });
};

// Student endpoints
router.get('/', protect, requireCompleteProfile, getAssessments);
router.get('/student/practice-history', protect, requireCompleteProfile, getStudentSubmodulePracticeAnalytics);
router.get('/topic-default/:topicId', protect, requireCompleteProfile, getDefaultTopicAssessment);
router.post('/practice-test', protect, requireCompleteProfile, createPracticeTest);
router.get('/take/:id', protect, requireCompleteProfile, getAssessmentById);
router.post('/submit', protect, requireCompleteProfile, submitAssessment);
router.post('/abandon', protect, requireCompleteProfile, abandonAssessment);
router.get('/attempt/:id', protect, requireCompleteProfile, getAttemptById);
router.get('/attempts', protect, requireCompleteProfile, getStudentAttempts);

// Admin endpoints
router.get('/admin/all', protect, authorize('admin'), getAllAssessmentsAdmin);
router.get('/admin/results', protect, authorize('admin'), getAllAttemptsAdmin);
router.post('/admin/generate-ai', protect, authorize('admin'), generateAIAssessment);
router.post('/admin/generate-questions', protect, authorize('admin'), generateQuestionsForReview);
router.post('/admin/extract-pdf', protect, authorize('admin'), handlePdfUpload, extractPdfQuestions);
router.post('/admin/create', protect, authorize('admin'), createAssessment);
router.put('/admin/:id', protect, authorize('admin'), updateAssessment);
router.delete('/admin/:id', protect, authorize('admin'), deleteAssessment);

module.exports = router;
