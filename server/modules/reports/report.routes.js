const express = require('express');
const router = express.Router();
const { exportDepartmentReport, getPracticeAnalytics } = require('./report.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');

router.get('/export', protect, authorize('admin'), exportDepartmentReport);
router.get('/practice-analytics', protect, authorize('admin'), getPracticeAnalytics);

module.exports = router;
