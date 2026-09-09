const StudentGamification = require('./gamification.model');

// Activity XP definitions
const XP_VALUES = {
  LECTURE_COMPLETE: 15,
  NOTE_READ: 10,
  TOPIC_COMPLETE: 50,
  DEFAULT_ASSESSMENT_PASS: 40,
  PRACTICE_TEST_COMPLETE: 20,
  HIGH_SCORE_BONUS: 15 // Bonus for >= 80% on any test
};

/**
 * Get or initialize Gamification state for a student
 */
const getOrCreateGamification = async (userId) => {
  let record = await StudentGamification.findOne({ user: userId });
  if (!record) {
    record = await StudentGamification.create({
      user: userId,
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      level: 1,
      activities: []
    });
  }
  return record;
};

/**
 * Update daily streak calculation based on activity date (YYYY-MM-DD)
 */
const updateStreak = (record, todayStr) => {
  if (!record.lastActiveDate) {
    record.currentStreak = 1;
    record.longestStreak = Math.max(record.longestStreak || 0, 1);
    record.lastActiveDate = todayStr;
    return;
  }

  if (record.lastActiveDate === todayStr) {
    // Already active today, streak remains unchanged
    return;
  }

  const lastDate = new Date(record.lastActiveDate + 'T00:00:00Z');
  const todayDate = new Date(todayStr + 'T00:00:00Z');
  const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day
    record.currentStreak = (record.currentStreak || 0) + 1;
  } else {
    // Streak broken, reset to 1
    record.currentStreak = 1;
  }

  record.longestStreak = Math.max(record.longestStreak || 0, record.currentStreak);
  record.lastActiveDate = todayStr;
};

/**
 * Award XP and update streak for an activity safely and idempotently
 */
const awardActivityXP = async (userId, rawActivityType, refId, title = '') => {
  try {
    if (!userId || !rawActivityType || !refId) return null;
    const activityType = String(rawActivityType).toUpperCase();

    const record = await getOrCreateGamification(userId);
    const refIdStr = String(refId);

    // Idempotency check:
    // LECTURE_COMPLETE, NOTE_READ, TOPIC_COMPLETE, DEFAULT_ASSESSMENT_PASS are one-time per item.
    const isOneTime = [
      'LECTURE_COMPLETE',
      'NOTE_READ',
      'TOPIC_COMPLETE',
      'DEFAULT_ASSESSMENT_PASS'
    ].includes(activityType);

    if (isOneTime) {
      const alreadyAwarded = record.activities.some(
        (a) => a.activityType === activityType && String(a.refId) === refIdStr
      );
      if (alreadyAwarded) {
        return record; // Return without adding duplicate XP
      }
    }

    const xp = XP_VALUES[activityType] || 10;
    const todayStr = new Date().toISOString().split('T')[0];

    // Update streak
    updateStreak(record, todayStr);

    // Award XP
    record.totalXP = (record.totalXP || 0) + xp;
    record.calculateLevel();

    record.activities.push({
      activityType,
      refId: refIdStr,
      xpAwarded: xp,
      title: title || activityType,
      createdAt: new Date()
    });

    record.updatedAt = new Date();
    await record.save();
    return record;
  } catch (err) {
    console.error('[Gamification Service Error]:', err.message);
    return null; // Never throw to caller
  }
};

/**
 * Get gamification summary for student dashboard
 */
const getStudentGamificationStats = async (userId) => {
  const record = await getOrCreateGamification(userId);
  const todayStr = new Date().toISOString().split('T')[0];

  // If last active was before yesterday, streak has lapsed
  let effectiveStreak = record.currentStreak || 0;
  if (record.lastActiveDate) {
    const lastDate = new Date(record.lastActiveDate + 'T00:00:00Z');
    const todayDate = new Date(todayStr + 'T00:00:00Z');
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) {
      effectiveStreak = 0;
    }
  }

  const totalXP = record.totalXP || 0;
  const level = record.level || Math.max(1, Math.floor(totalXP / 100) + 1);
  const nextLevelXP = level * 100;
  const currentLevelBaseXP = (level - 1) * 100;
  const progressToNextLevel = Math.min(100, Math.max(0, Math.round(((totalXP - currentLevelBaseXP) / 100) * 100)));

  return {
    totalXP,
    currentStreak: effectiveStreak,
    streak: effectiveStreak,
    longestStreak: Math.max(record.longestStreak || 0, effectiveStreak),
    level,
    nextLevelXP,
    progressToNextLevel,
    lastActiveDate: record.lastActiveDate,
    recentActivities: (record.activities || []).slice(-10).reverse()
  };
};

module.exports = {
  XP_VALUES,
  awardActivityXP,
  getStudentGamificationStats,
  getOrCreateGamification
};
