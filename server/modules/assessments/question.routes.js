const express = require('express');
const router = express.Router();
const questionController = require('./question.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');

// Question Bank Routes (Protected for Admin)
router.get('/', protect, questionController.getQuestions);
router.get('/:id', protect, questionController.getQuestionById);

// Admin-only Question management and AI generator
router.post('/generate-ai', protect, authorize('admin'), questionController.generateAI);
router.post('/bulk-save', protect, authorize('admin'), questionController.bulkSaveQuestions);
router.post('/', protect, authorize('admin'), questionController.createQuestion);
router.put('/:id', protect, authorize('admin'), questionController.updateQuestion);
router.delete('/:id', protect, authorize('admin'), questionController.deleteQuestion);

module.exports = router;
