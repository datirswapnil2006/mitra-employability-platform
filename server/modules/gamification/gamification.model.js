const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  activityType: {
    type: String,
    enum: [
      'LECTURE_COMPLETE',
      'NOTE_READ',
      'TOPIC_COMPLETE',
      'DEFAULT_ASSESSMENT_PASS',
      'PRACTICE_TEST_COMPLETE',
      'HIGH_SCORE_BONUS'
    ],
    required: true
  },
  refId: { type: String, required: true }, // contentId, topicId, assessmentId, or attemptId
  xpAwarded: { type: Number, required: true },
  title: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const studentGamificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalXP: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: '' }, // ISO Date YYYY-MM-DD for reliable day boundary checks
  level: { type: Number, default: 1 },
  activities: [activitySchema],
  updatedAt: { type: Date, default: Date.now }
});

// Calculate user level dynamically based on XP thresholds (100 XP per level)
studentGamificationSchema.methods.calculateLevel = function () {
  this.level = Math.max(1, Math.floor(this.totalXP / 100) + 1);
  return this.level;
};

module.exports = mongoose.model('StudentGamification', studentGamificationSchema);
