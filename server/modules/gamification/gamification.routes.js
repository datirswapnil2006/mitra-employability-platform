const express = require('express');
const router = express.Router();
const gamificationController = require('./gamification.controller');
const { protect } = require('../../middleware/authMiddleware');
const { requireCompleteProfile } = require('../../middleware/profileMiddleware');

router.get('/stats', protect, requireCompleteProfile, gamificationController.getGamificationStats);

module.exports = router;
