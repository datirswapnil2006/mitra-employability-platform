const { getStudentGamificationStats } = require('./gamification.service');

exports.getGamificationStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const stats = await getStudentGamificationStats(userId);
    res.json({
      success: true,
      stats,
      data: stats
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
