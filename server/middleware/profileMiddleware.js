const { StudentProfile } = require('../modules/students/student.model');

/**
 * Middleware to enforce 100% profile completion for student accounts.
 * Prevents access to Training, Assessments, AI generation, and protected resources until profile is 100% verified.
 */
const requireCompleteProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    // Admins bypass student profile completion requirement
    if (req.user.role === 'admin') {
      return next();
    }

    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(403).json({
        success: false,
        requiresProfileCompletion: true,
        profileCompletion: 0,
        message: 'Student profile not found. Please complete your profile to 100% to access this module.'
      });
    }

    const completion = profile.profileCompletionPercentage || profile.calculateCompletion();
    if (completion < 100) {
      return res.status(403).json({
        success: false,
        requiresProfileCompletion: true,
        profileCompletion: completion,
        message: `Profile completion is currently at ${completion}%. You must complete all required profile fields to 100% to access training modules and assessments.`
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during profile verification: ' + err.message });
  }
};

module.exports = { requireCompleteProfile };
