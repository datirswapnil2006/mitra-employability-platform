const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const supportController = require('./support.controller');

// Student Routes
router.post('/', protect, supportController.submitFeedback);
router.get('/my', protect, supportController.getMyFeedback);

// Admin Routes
router.get('/admin/all', protect, authorize('admin'), supportController.getAllFeedbackAdmin);
router.get('/admin/stats', protect, authorize('admin'), supportController.getSupportStats);
router.get('/admin/export', protect, authorize('admin'), supportController.exportSupportExcel);
router.patch('/admin/:id', protect, authorize('admin'), supportController.updateFeedbackAdmin);
router.delete('/admin/:id', protect, authorize('admin'), supportController.deleteFeedbackAdmin);

// Common / Specific ID Route
router.get('/:id', protect, supportController.getFeedbackById);

module.exports = router;
