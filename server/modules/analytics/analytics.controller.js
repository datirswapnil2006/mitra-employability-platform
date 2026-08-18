const User = require('../auth/user.model');
const { StudentProfile } = require('../students/student.model');
const { TrainingModule } = require('../training/training.models');
const { Assessment, AssessmentAttempt } = require('../assessments/assessment.models');
const PsychometricProfile = require('../ai/psychometric.model');
const StudentProgress = require('../progress/progress.model');
const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');

// Get overall platform analytics for Admin
exports.getAdminAnalytics = async (req, res) => {
  try {
    const { department, batch } = req.query;

    const studentFilter = { role: 'student' };
    if (department && department !== 'All') studentFilter.department = department;

    const totalStudents = await User.countDocuments(studentFilter);
    const activeStudents = await User.countDocuments({ ...studentFilter, status: 'active' });
    const totalModules = await TrainingModule.countDocuments({ status: 'published' });
    const totalAssessments = await Assessment.countDocuments({ status: 'published' });

    // Aggregate Assessment Attempts
    const attempts = await AssessmentAttempt.find().populate('user', 'department name email');
    const filteredAttempts = attempts.filter((att) => {
      if (!att.user) return false;
      if (department && department !== 'All' && att.user.department !== department) return false;
      return true;
    });

    const totalAttemptsCount = filteredAttempts.length;
    const passedAttemptsCount = filteredAttempts.filter((a) => a.status === 'PASSED').length;
    const platformPassRate = totalAttemptsCount > 0
      ? Math.round((passedAttemptsCount / totalAttemptsCount) * 100)
      : 0;
    const platformAvgScore = totalAttemptsCount > 0
      ? Math.round(filteredAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / totalAttemptsCount)
      : 0;

    // Aggregate Student Profile Completions
    const profileFilter = {};
    if (department && department !== 'All') profileFilter.department = department;
    if (batch && batch !== 'All') profileFilter.batch = batch;

    const profiles = await StudentProfile.find(profileFilter);
    const avgProfileCompletion = profiles.length > 0
      ? Math.round(profiles.reduce((acc, p) => acc + (p.profileCompletionPercentage || 0), 0) / profiles.length)
      : 0;

    // Department Wise Performance Comparison across all 9 official departments
    const departments = OFFICIAL_DEPARTMENTS || [
      'EXTC', 'CSE', 'IT', 'AIDS', 'CSE (IOT)', 'Civil', 'Mechanical', 'MCA', 'MBA'
    ];

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const deptStudents = await User.countDocuments({ role: 'student', department: dept });
        const deptProfiles = await StudentProfile.find({ department: dept });
        const avgProfile = deptProfiles.length > 0
          ? Math.round(deptProfiles.reduce((acc, p) => acc + (p.profileCompletionPercentage || 0), 0) / deptProfiles.length)
          : 0;

        // Attempts by students in this dept
        const deptAttempts = attempts.filter((a) => a.user && a.user.department === dept);
        const deptAttemptsCount = deptAttempts.length;
        const deptPassedCount = deptAttempts.filter((a) => a.status === 'PASSED').length;
        const deptPassRate = deptAttemptsCount > 0
          ? Math.round((deptPassedCount / deptAttemptsCount) * 100)
          : 0;
        const avgScore = deptAttemptsCount > 0
          ? Math.round(deptAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / deptAttemptsCount)
          : 0;

        // Psychometric average for dept
        const psychoProfiles = await PsychometricProfile.find().populate('user', 'department');
        const deptPsycho = psychoProfiles.filter((p) => p.user && p.user.department === dept);
        const avgReadiness = deptPsycho.length > 0
          ? Math.round(deptPsycho.reduce((acc, p) => acc + (p.employabilityIndex || 0), 0) / deptPsycho.length)
          : 0;

        return {
          department: dept,
          studentCount: deptStudents,
          attemptsCount: deptAttemptsCount,
          avgProfileCompletion: avgProfile,
          avgAssessmentScore: avgScore,
          passRate: deptPassRate,
          avgReadiness
        };
      })
    );

    // Module-wise performance split
    const moduleTaxonomies = ['Aptitude', 'Domain Knowledge', 'Communication', 'Resume', 'Interview', 'Full Assessment'];
    const moduleStats = await Promise.all(
      moduleTaxonomies.map(async (mod) => {
        const tests = await Assessment.find({
          module: mod === 'Domain Knowledge' ? { $in: ['Domain', 'Domain Knowledge'] } : mod
        });
        const testIds = tests.map((t) => t._id.toString());
        const modAttempts = attempts.filter((a) => testIds.includes(a.assessmentId?.toString()));
        const modCount = modAttempts.length;
        const modPassed = modAttempts.filter((a) => a.status === 'PASSED').length;
        const modPassRate = modCount > 0 ? Math.round((modPassed / modCount) * 100) : 0;
        const modAvgScore = modCount > 0 ? Math.round(modAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / modCount) : 0;

        return {
          module: mod,
          publishedTests: tests.length,
          attemptsCount: modCount,
          avgScore: modAvgScore,
          passRate: modPassRate
        };
      })
    );

    // Leaderboard (Top 5 Students by Average Score with >= 1 attempt)
    const studentAttemptMap = {};
    attempts.forEach((a) => {
      if (!a.user) return;
      const uId = a.user._id.toString();
      if (!studentAttemptMap[uId]) {
        studentAttemptMap[uId] = {
          name: a.user.name,
          email: a.user.email,
          department: a.user.department,
          scores: [],
          passed: 0
        };
      }
      studentAttemptMap[uId].scores.push(a.percentage || 0);
      if (a.status === 'PASSED') studentAttemptMap[uId].passed += 1;
    });

    const leaderboard = Object.values(studentAttemptMap)
      .map((s) => ({
        name: s.name,
        email: s.email,
        department: s.department,
        testsAttempted: s.scores.length,
        testsPassed: s.passed,
        avgScore: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        totalModules,
        totalAssessments,
        totalAttempts: totalAttemptsCount,
        passRate: platformPassRate,
        avgAssessmentScore: platformAvgScore,
        avgProfileCompletion
      },
      departmentStats,
      moduleStats,
      leaderboard
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get personal analytics for Student
exports.getStudentAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await StudentProfile.findOne({ user: userId });
    const attempts = await AssessmentAttempt.find({ user: userId })
      .populate('assessmentId', 'title module category')
      .sort({ attemptedAt: -1 });

    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter((a) => a.status === 'PASSED').length;
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / totalAttempts)
      : 0;

    const psychoProfile = await PsychometricProfile.findOne({ user: userId }).sort({ evaluatedAt: -1 });

    res.json({
      success: true,
      profileCompletion: profile ? profile.profileCompletionPercentage : 0,
      totalAttempts,
      passedAttempts,
      avgScore,
      employabilityIndex: psychoProfile ? psychoProfile.employabilityIndex : 0,
      recentAttempts: attempts.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
