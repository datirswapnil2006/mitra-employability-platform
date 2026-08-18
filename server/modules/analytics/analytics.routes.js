const express = require('express');
const router = express.Router();
const { getAdminAnalytics, getStudentAnalytics } = require('./analytics.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');

router.get('/admin', protect, authorize('admin'), getAdminAnalytics);
router.get('/student', protect, getStudentAnalytics);

module.exports = router;
