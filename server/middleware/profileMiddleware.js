const { StudentProfile } = require('../modules/students/student.model');
const { SystemSettings } = require('../modules/settings/settings.model');

/**
 * Middleware to enforce platform access rules & profile completion for student accounts.
 * Prevents access to Training, Assessments, AI generation, and protected resources until profile is verified.
 */
const requireCompleteProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    // Admins bypass student profile completion requirement and maintenance mode
    if (req.user.role === 'admin') {
      return next();
    }

    // Check system maintenance mode
    const settings = await SystemSettings.findOne();
    if (settings?.system?.maintenanceMode) {
      return res.status(503).json({
        success: false,
        maintenanceMode: true,
        message: settings.system.maintenanceMessage || 'Platform is temporarily under maintenance. Please check back shortly.'
      });
    }

    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(403).json({
        success: false,
        requiresProfileCompletion: true,
        profileCompletion: 0,
        message: 'Student profile not found. Please complete your profile to access this module.'
      });
    }

    const threshold = settings?.profileGating?.minimumCompletionPercentage || 100;
    const completion = (profile.profileCompletionPercentage !== undefined && profile.profileCompletionPercentage !== null)
      ? profile.profileCompletionPercentage
      : profile.calculateCompletion(req.user);

    if (completion < threshold) {
      return res.status(403).json({
        success: false,
        requiresProfileCompletion: true,
        profileCompletion: completion,
        minimumRequired: threshold,
        message: `Profile completion is currently at ${completion}%. You must complete all required profile fields to at least ${threshold}% to access training modules and assessments.`
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during profile verification: ' + err.message });
  }
};

module.exports = { requireCompleteProfile };
