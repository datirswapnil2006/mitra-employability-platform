const express = require('express');
const router = express.Router();
const questionController = require('./question.controller');
const { extractPdfQuestions } = require('./assessment.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
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

// Question Bank Routes
router.get('/', protect, questionController.getQuestions);
router.get('/stats/:topicId', protect, questionController.getTopicQuestionStats);
router.get('/:id', protect, questionController.getQuestionById);

// Admin-only Question management and AI generator
router.post('/extract-pdf', protect, authorize('admin'), handlePdfUpload, extractPdfQuestions);
router.post('/generate-ai', protect, authorize('admin'), questionController.generateAI);
router.post('/bulk-save', protect, authorize('admin'), questionController.bulkSaveQuestions);
router.post('/', protect, authorize('admin'), questionController.createQuestion);
router.put('/:id', protect, authorize('admin'), questionController.updateQuestion);
router.delete('/:id', protect, authorize('admin'), questionController.deleteQuestion);

module.exports = router;
