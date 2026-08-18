const StudentProgress = require('./progress.model');
const { LearningContent } = require('../training/training.models');

// Mark a learning content item as completed
exports.markContentComplete = async (req, res) => {
  try {
    const { contentId } = req.body;
    const userId = req.user.id;

    const content = await LearningContent.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Learning content not found' });
    }

    let progress = await StudentProgress.findOne({ user: userId, submoduleId: content.submoduleId });
    if (!progress) {
      progress = new StudentProgress({
        user: userId,
        submoduleId: content.submoduleId,
        moduleId: content.moduleId,
        completedContents: []
      });
    }

    if (!progress.completedContents.includes(contentId)) {
      progress.completedContents.push(contentId);
    }

    // Calculate percentage based on published required contents for this submodule
    const requiredContents = await LearningContent.find({
      submoduleId: content.submoduleId,
      status: 'published',
      required: true
    });

    const totalRequired = requiredContents.length || 1;
    let completedRequiredCount = 0;

    requiredContents.forEach(item => {
      if (progress.completedContents.some(id => id.toString() === item._id.toString())) {
        completedRequiredCount++;
      }
    });

    const percentage = Math.min(100, Math.round((completedRequiredCount / totalRequired) * 100));
    progress.submoduleProgressPercentage = percentage;

    if (percentage >= 100 && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = Date.now();
    }

    await progress.save();

    res.json({
      success: true,
      progress,
      message: progress.isCompleted ? 'Submodule completed! Assessments are now unlocked.' : 'Content marked as complete'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get progress for specific submodule
exports.getSubmoduleProgress = async (req, res) => {
  try {
    const { submoduleId } = req.params;
    const userId = req.user.id;

    const progress = await StudentProgress.findOne({ user: userId, submoduleId });
    res.json({
      success: true,
      progress: progress || { submoduleProgressPercentage: 0, isCompleted: false, completedContents: [] }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get overall training progress summary for Student Dashboard
exports.getStudentOverallProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const allProgress = await StudentProgress.find({ user: userId }).populate('submoduleId', 'title moduleId');

    const totalSubmodules = await require('../training/training.models').Submodule.countDocuments({ status: 'published' });
    const completedCount = allProgress.filter(p => p.isCompleted).length;

    const overallPercentage = totalSubmodules > 0 ? Math.round((completedCount / totalSubmodules) * 100) : 0;

    // Find last accessed/in-progress submodule for "Continue Learning"
    let continueLearning = null;
    const inProgress = allProgress.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
    if (inProgress && inProgress.submoduleId) {
      continueLearning = {
        submoduleId: inProgress.submoduleId._id,
        title: inProgress.submoduleId.title,
        progress: inProgress.submoduleProgressPercentage
      };
    }

    res.json({
      success: true,
      overallPercentage,
      completedSubmodulesCount: completedCount,
      totalSubmodules,
      continueLearning,
      progressList: allProgress
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
