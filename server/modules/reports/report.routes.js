const express = require('express');
const router = express.Router();
const { exportDepartmentReport } = require('./report.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');

router.get('/export', protect, authorize('admin'), exportDepartmentReport);

module.exports = router;
