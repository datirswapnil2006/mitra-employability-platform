const express = require('express');
const router = express.Router();
const { markContentComplete, getSubmoduleProgress, getStudentOverallProgress } = require('./progress.controller');
const { protect } = require('../../middleware/authMiddleware');
const { requireCompleteProfile } = require('../../middleware/profileMiddleware');

router.post('/complete', protect, requireCompleteProfile, markContentComplete);
router.get('/submodule/:submoduleId', protect, requireCompleteProfile, getSubmoduleProgress);
router.get('/overall', protect, getStudentOverallProgress);

module.exports = router;
