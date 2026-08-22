const { GoogleGenAI } = require('@google/genai');
const { Submodule, LearningContent } = require('../training/training.models');
const { Assessment } = require('../assessments/assessment.models');
const PsychometricProfile = require('./psychometric.model');
const { PsychometricTest } = require('./psychometric.model');
const PsychometricQuestion = require('./psychometricQuestion.model');
const PsychometricAttempt = require('./psychometricAttempt.model');
const StudentProgress = require('../progress/progress.model');
const User = require('../auth/user.model');
const {
  PSYCHOMETRIC_QUESTIONS,
  calculateDimensionScores,
  synthesizePsychometricProfileAI
} = require('../../utils/aiPsychometricAnalyzer');
const {
  COMPETENCIES,
  QUESTION_TYPES,
  FORMAT_RATIOS,
  CALIBRATED_50_QUESTIONS,
  computeQuestionTypeDistribution,
  computeCompetencyDistribution,
  validateQuestionBlueprint,
  generateDynamicAIQuestions,
  generate50QuestionsAI,
  calculateAttemptScoring,
  synthesizeAITalentReport
} = require('../../utils/aiTalentIntelligenceEngine');

// ==========================================
// 1. PSYCHOMETRIC TEST CRUD & AI BUILDER (ADMIN)
// ==========================================

// 1a. List All Psychometric Tests
exports.getPsychometricTests = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const query = {};

    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $trim: true, $options: 'i' } },
        { description: { $regex: search, $trim: true, $options: 'i' } }
      ];
    }

    // If student, only show published/active tests
    if (req.user && req.user.role !== 'admin') {
      query.status = 'published';
      query.isActive = true;
    }

    const tests = await PsychometricTest.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tests.length,
      tests
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 1b. Get Single Psychometric Test by ID (With questions)
exports.getPsychometricTestById = async (req, res) => {
  try {
    const { id } = req.params;
    let test = null;

    if (id === 'default' || id === 'active') {
      test = await PsychometricTest.findOne({ status: 'published', isActive: true }).sort({ createdAt: -1 });
    } else {
      test = await PsychometricTest.findById(id);
    }

    if (!test) {
      if (id === 'default' || id === 'active') {
        // Fallback default test when student needs active assessment
        test = await PsychometricTest.create({
          title: 'Master AI Talent & Psychometric Assessment',
          description: 'Comprehensive 50-question behavioral inventory evaluating 10 workplace competencies for career acceleration and placement readiness.',
          category: 'Behavioral Assessment',
          durationMinutes: 20,
          questionCount: 50,
          questionsCount: 50,
          competencies: COMPETENCIES,
          questions: CALIBRATED_50_QUESTIONS,
          status: 'published',
          isActive: true,
          version: 1
        });
      } else {
        return res.status(404).json({ success: false, message: 'Assessment not found.' });
      }
    }

    // For students: sanitize internal scoring metadata (weights, reverse-scoring tags)
    let sanitizedQuestions = test.questions;
    if (req.user && req.user.role !== 'admin') {
      sanitizedQuestions = test.questions.map((q) => ({
        questionId: q.questionId,
        questionText: q.questionText,
        questionType: q.questionType,
        competency: q.competency,
        trait: q.trait,
        scenario: q.scenario,
        options: (q.options || []).map((o) => ({
          text: typeof o === 'string' ? o : o.text,
          value: o.value || (typeof o === 'string' ? o : o.text),
          statementA: o.statementA,
          statementB: o.statementB
        }))
      }));
    }

    res.json({
      success: true,
      test: {
        ...test.toObject(),
        questions: sanitizedQuestions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 1c. Create Psychometric Test
exports.createPsychometricTest = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      durationMinutes = 20,
      questionCount,
      questionsCount,
      competencies = COMPETENCIES,
      questions = [],
      status = 'published'
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Assessment title is required.' });
    }

    // Dynamic questionCount validation:
    // Minimum: 1, Maximum: 50, Integer only
    const rawCount = questionCount !== undefined ? questionCount : (questionsCount !== undefined ? questionsCount : (questions.length || 50));
    
    // Validate integer
    if (typeof rawCount === 'number' && !Number.isInteger(rawCount)) {
      return res.status(400).json({
        success: false,
        message: 'Question count must be an integer (decimal values are not allowed).'
      });
    }

    const parsedCount = parseInt(rawCount, 10);
    if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 50 || String(rawCount).includes('.')) {
      return res.status(400).json({
        success: false,
        message: 'Number of questions must be an integer between 1 and 50.'
      });
    }

    // If publishing with questions, validate count matches
    if (questions.length > 0 && questions.length !== parsedCount && status === 'published') {
      return res.status(400).json({
        success: false,
        message: `Assessment requires exactly ${parsedCount} questions, but ${questions.length} were provided.`
      });
    }

    let finalQuestions = questions;
    if (finalQuestions.length === 0) {
      const generated = await generateDynamicAIQuestions({
        title: title.trim(),
        category,
        questionCount: parsedCount,
        competencies
      });
      finalQuestions = generated.questions;
    }

    const test = await PsychometricTest.create({
      title: title.trim(),
      description: description || '',
      category: category || 'Behavioral Assessment',
      durationMinutes: parseInt(durationMinutes, 10) || 20,
      questionCount: parsedCount,
      questionsCount: parsedCount,
      competencies: Array.isArray(competencies) && competencies.length > 0 ? competencies : COMPETENCIES,
      questions: finalQuestions,
      status,
      isActive: status === 'published',
      version: 1,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      test,
      message: 'Psychometric assessment created successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 1d. Update Psychometric Test
exports.updatePsychometricTest = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await PsychometricTest.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const {
      title,
      description,
      category,
      durationMinutes,
      questionCount,
      questionsCount,
      competencies,
      questions,
      status,
      isActive
    } = req.body;

    if (title) test.title = title.trim();
    if (description !== undefined) test.description = description;
    if (category) test.category = category;
    if (durationMinutes) test.durationMinutes = parseInt(durationMinutes, 10);
    if (competencies) test.competencies = competencies;

    const rawCount = questionCount !== undefined ? questionCount : questionsCount;
    if (rawCount !== undefined) {
      if (typeof rawCount === 'number' && !Number.isInteger(rawCount)) {
        return res.status(400).json({
          success: false,
          message: 'Question count must be an integer (decimals not allowed).'
        });
      }
      const parsed = parseInt(rawCount, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 50 || String(rawCount).includes('.')) {
        return res.status(400).json({
          success: false,
          message: 'Number of questions must be an integer between 1 and 50.'
        });
      }
      test.questionCount = parsed;
      test.questionsCount = parsed;
    }

    if (questions) {
      test.questions = questions;
      test.questionCount = questions.length;
      test.questionsCount = questions.length;
      test.version += 1;
    }
    if (status) test.status = status;
    if (isActive !== undefined) test.isActive = isActive;

    await test.save();

    res.json({
      success: true,
      test,
      message: 'Assessment updated successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 1e. Toggle Psychometric Test Active/Published Status
exports.togglePsychometricTestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await PsychometricTest.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    test.isActive = !test.isActive;
    test.status = test.isActive ? 'published' : 'draft';
    await test.save();

    res.json({
      success: true,
      test,
      message: `Assessment is now ${test.status}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 1f. Delete Psychometric Test
exports.deletePsychometricTest = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PsychometricTest.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }
    res.json({
      success: true,
      message: 'Psychometric assessment deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 1g. Dynamic AI Blueprint Preview Calculator
exports.getBlueprintPreview = async (req, res) => {
  try {
    const { questionCount = 50, competencies = COMPETENCIES } = req.body;
    const parsed = parseInt(questionCount, 10);
    const count = (!isNaN(parsed) && parsed >= 1 && parsed <= 50) ? parsed : 50;

    const typeDistribution = computeQuestionTypeDistribution(count);
    const compDistribution = computeCompetencyDistribution(count, competencies);

    res.json({
      success: true,
      questionCount: count,
      typeDistribution,
      compDistribution
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 1h. AI Generate Dynamic Question Assessment Blueprint (1 to 50 questions)
exports.generateDynamicAIQuestions = async (req, res) => {
  try {
    const {
      title = 'AI Talent & Psychometric Assessment',
      category = 'Behavioral Assessment',
      targetRole = 'Software Engineer',
      questionCount = 50,
      competencies = COMPETENCIES
    } = req.body;

    const rawCount = questionCount;
    if (typeof rawCount === 'number' && !Number.isInteger(rawCount)) {
      return res.status(400).json({
        success: false,
        message: 'Question count must be an integer (decimals not allowed).'
      });
    }

    const parsedCount = parseInt(rawCount, 10);
    if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 50 || String(rawCount).includes('.')) {
      return res.status(400).json({
        success: false,
        message: 'Number of questions must be an integer between 1 and 50.'
      });
    }

    const result = await generateDynamicAIQuestions({
      title,
      category,
      targetRole,
      questionCount: parsedCount,
      competencies
    });

    const validation = validateQuestionBlueprint(result.questions, parsedCount);

    res.json({
      success: true,
      count: result.questions.length,
      requestedCount: parsedCount,
      questions: result.questions,
      source: result.source,
      validation,
      message: `Successfully generated ${result.questions.length} balanced psychometric questions.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 1i. Backward-compatible alias for 50-Question generator
exports.generate50AIQuestions = exports.generateDynamicAIQuestions;

// 1j. Generate Missing Questions to Reach Target Count
exports.generateMissingQuestions = async (req, res) => {
  try {
    const {
      title = 'AI Talent Assessment',
      category = 'Behavioral Assessment',
      targetRole = 'Software Engineer',
      currentQuestions = [],
      targetCount = 50,
      competencies = COMPETENCIES
    } = req.body;

    const parsedTarget = parseInt(targetCount, 10);
    if (isNaN(parsedTarget) || parsedTarget < 1 || parsedTarget > 50) {
      return res.status(400).json({ success: false, message: 'Target count must be between 1 and 50.' });
    }

    const currentLen = Array.isArray(currentQuestions) ? currentQuestions.length : 0;
    const missingCount = parsedTarget - currentLen;

    if (missingCount <= 0) {
      return res.json({
        success: true,
        message: 'No missing questions. The assessment already meets the target count.',
        questions: currentQuestions.slice(0, parsedTarget),
        count: parsedTarget,
        validation: validateQuestionBlueprint(currentQuestions.slice(0, parsedTarget), parsedTarget)
      });
    }

    const result = await generateDynamicAIQuestions({
      title,
      category,
      targetRole,
      questionCount: missingCount,
      competencies,
      startIndex: currentLen
    });

    const combinedQuestions = [...currentQuestions, ...result.questions];
    const validation = validateQuestionBlueprint(combinedQuestions, parsedTarget);

    res.json({
      success: true,
      addedCount: result.questions.length,
      newQuestions: result.questions,
      questions: combinedQuestions,
      count: combinedQuestions.length,
      validation,
      message: `Successfully generated ${result.questions.length} missing questions.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 2. STUDENT ATTEMPT SUBMISSION & SCORING
// ==========================================

// 2a. Submit Psychometric Attempt (POST /api/psychometric/:id/attempt or /api/psychometric/attempt)
exports.submitPsychometricAttempt = async (req, res) => {
  try {
    const testId = req.params.id || req.body.testId;
    const { responses = [], timeSpentSeconds = 0 } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ success: false, message: 'Assessment responses are required.' });
    }

    // 0. Enforce 24-hour assessment retake cooldown for students
    if (req.user?.role !== 'admin') {
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
      const lastAttempt = await PsychometricAttempt.findOne({ user: userId }).sort({ submittedAt: -1 });
      if (lastAttempt) {
        const lastSubmittedTime = new Date(lastAttempt.submittedAt || lastAttempt.createdAt).getTime();
        const elapsed = Date.now() - lastSubmittedTime;
        if (elapsed < TWENTY_FOUR_HOURS_MS) {
          const remainingMs = TWENTY_FOUR_HOURS_MS - elapsed;
          const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
          const remainingMinutes = Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
          return res.status(429).json({
            success: false,
            message: `Psychometric assessments can only be retaken once every 24 hours. Please wait ${remainingHours}h ${remainingMinutes}m before retaking.`,
            nextRetakeAvailableAt: new Date(lastSubmittedTime + TWENTY_FOUR_HOURS_MS),
            remainingHours,
            remainingMinutes
          });
        }
      }
    }

    // Load active test definition
    let test = null;
    if (testId && testId !== 'default' && testId !== 'active') {
      test = await PsychometricTest.findById(testId);
    }
    if (!test) {
      test = await PsychometricTest.findOne({ status: 'published', isActive: true }).sort({ createdAt: -1 });
    }
    if (!test) {
      // Fallback create default test
      test = await PsychometricTest.create({
        title: 'Master AI Talent & Psychometric Assessment',
        description: 'Comprehensive 50-question behavioral inventory evaluating 10 workplace competencies.',
        category: 'Behavioral Assessment',
        durationMinutes: 20,
        questionsCount: 50,
        competencies: COMPETENCIES,
        questions: CALIBRATED_50_QUESTIONS,
        status: 'published',
        isActive: true,
        version: 1
      });
    }

    // Load student user info
    const studentUser = await User.findById(userId);
    const studentName = studentUser?.name || 'Student Candidate';
    const department = studentUser?.department || 'Engineering';
    const batch = studentUser?.batch || '2026';
    const erpNumber = studentUser?.erpNumber || studentUser?.rollNo || 'N/A';

    // 1. Calculate Question Scores, Trait Percentages, and Overall Readiness
    const {
      traitScores,
      overallScore,
      overallReadiness,
      detailedResponses
    } = calculateAttemptScoring(test.questions || CALIBRATED_50_QUESTIONS, responses);

    // 2. Synthesize Non-Diagnostic AI Talent Intelligence Report
    const aiAnalysis = await synthesizeAITalentReport({
      studentName,
      department,
      traitScores,
      overallScore,
      overallReadiness
    });

    // 3. Save to dedicated PsychometricAttempt model
    const attempt = await PsychometricAttempt.create({
      user: userId,
      studentName,
      department,
      batch,
      erpNumber,
      psychometricTest: test._id,
      testTitle: test.title,
      assessmentVersion: test.version || 1,
      responses: detailedResponses,
      traitScores,
      overallScore,
      overallReadiness,
      strengths: aiAnalysis.strengths,
      developmentAreas: aiAnalysis.developmentAreas,
      recommendations: aiAnalysis.recommendations,
      aiAnalysis: {
        aiSummary: aiAnalysis.aiSummary,
        provider: aiAnalysis.provider,
        generatedAt: new Date()
      },
      suggestedWorkEnvironment: aiAnalysis.suggestedWorkEnvironment,
      timeSpentSeconds,
      startedAt: new Date(Date.now() - (timeSpentSeconds * 1000 || 60000)),
      submittedAt: new Date(),
      completed: true
    });

    // 4. Update student profile psychometric status
    await StudentProfile.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          'psychometricStatus.completed': true,
          'psychometricStatus.overallScore': overallScore,
          'psychometricStatus.lastEvaluatedAt': new Date(),
          'psychometricStatus.attemptId': attempt._id
        }
      }
    );

    // 5. Update / Synchronize legacy PsychometricProfile for analytics & master report compatibility
    const legacyScores = {};
    Object.keys(traitScores).forEach((k) => {
      legacyScores[k] = traitScores[k].score;
    });

    await PsychometricProfile.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        scores: legacyScores,
        traitScores,
        employabilityIndex: overallScore,
        strengths: aiAnalysis.strengths,
        developmentAreas: aiAnalysis.developmentAreas,
        recommendations: aiAnalysis.recommendations,
        aiAnalysis: {
          executiveSummary: aiAnalysis.aiSummary,
          suggestedWorkEnvironment: aiAnalysis.suggestedWorkEnvironment,
          growthMindsetScore: traitScores.adaptability?.score || 75
        },
        evaluatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Psychometric assessment evaluated successfully.',
      attempt,
      profile: attempt
    });
  } catch (err) {
    console.error('Psychometric submission error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2b. Get Student's Latest Talent Profile & History with 24h Cooldown Tracking
exports.getStudentPsychometricProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    // First check PsychometricAttempt
    const attempt = await PsychometricAttempt.findOne({ user: userId })
      .sort({ submittedAt: -1 })
      .populate('user', 'name email department year batch erpNumber');

    if (attempt) {
      const lastSubmittedTime = new Date(attempt.submittedAt || attempt.createdAt).getTime();
      const elapsed = Date.now() - lastSubmittedTime;
      const canRetake = req.user.role === 'admin' || elapsed >= TWENTY_FOUR_HOURS_MS;
      const remainingMs = Math.max(0, TWENTY_FOUR_HOURS_MS - elapsed);
      const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
      const remainingMinutes = Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

      return res.json({
        success: true,
        hasProfile: true,
        profile: attempt,
        attempt,
        cooldown: {
          canRetake,
          lastAttemptAt: attempt.submittedAt || attempt.createdAt,
          nextRetakeAvailableAt: new Date(lastSubmittedTime + TWENTY_FOUR_HOURS_MS),
          remainingHours,
          remainingMinutes
        }
      });
    }

    // Fallback check legacy PsychometricProfile
    const legacy = await PsychometricProfile.findOne({ user: userId })
      .sort({ evaluatedAt: -1 })
      .populate('user', 'name email department year batch erpNumber');

    let canRetake = true;
    let cooldown = { canRetake: true };
    if (legacy) {
      const lastSubmittedTime = new Date(legacy.evaluatedAt || legacy.createdAt).getTime();
      const elapsed = Date.now() - lastSubmittedTime;
      canRetake = req.user.role === 'admin' || elapsed >= TWENTY_FOUR_HOURS_MS;
      const remainingMs = Math.max(0, TWENTY_FOUR_HOURS_MS - elapsed);
      cooldown = {
        canRetake,
        lastAttemptAt: legacy.evaluatedAt || legacy.createdAt,
        nextRetakeAvailableAt: new Date(lastSubmittedTime + TWENTY_FOUR_HOURS_MS),
        remainingHours: Math.floor(remainingMs / (60 * 60 * 1000)),
        remainingMinutes: Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
      };
    }

    res.json({
      success: true,
      hasProfile: Boolean(legacy),
      profile: legacy,
      cooldown
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2c. Get Student Attempt History
exports.getStudentAttempts = async (req, res) => {
  try {
    const userId = req.user.id;
    const attempts = await PsychometricAttempt.find({ user: userId })
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: attempts.length,
      attempts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2d. Get Single Attempt by ID
exports.getPsychometricAttemptById = async (req, res) => {
  try {
    const { id } = req.params;
    const attempt = await PsychometricAttempt.findById(id)
      .populate('user', 'name email department year batch erpNumber')
      .populate('psychometricTest', 'title category durationMinutes');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Psychometric attempt not found.' });
    }

    // Security check: student can only view their own attempt
    if (req.user.role !== 'admin' && String(attempt.user._id || attempt.user) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to student talent report.' });
    }

    res.json({
      success: true,
      attempt
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 3. ADMIN STUDENT TALENT INSIGHTS & ANALYTICS
// ==========================================

// 3a. Admin Summary & Candidate Attempts
exports.getPsychometricAdminSummary = async (req, res) => {
  try {
    const { department, batch, scoreRange, search } = req.query;

    const query = {};
    if (department && department !== 'All') query.department = department;
    if (batch && batch !== 'All') query.batch = batch;

    if (scoreRange) {
      if (scoreRange === '85+') query.overallScore = { $gte: 85 };
      else if (scoreRange === '70-84') query.overallScore = { $gte: 70, $lt: 85 };
      else if (scoreRange === '55-69') query.overallScore = { $gte: 55, $lt: 70 };
      else if (scoreRange === '<55') query.overallScore = { $lt: 55 };
    }

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { erpNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const attempts = await PsychometricAttempt.find(query)
      .populate('user', 'name email department year batch erpNumber')
      .sort({ submittedAt: -1 });

    const totalEvaluated = attempts.length;
    const avgReadiness = totalEvaluated > 0
      ? Math.round(attempts.reduce((acc, a) => acc + a.overallScore, 0) / totalEvaluated)
      : 0;

    // Departmental score breakdown
    const departmentScores = {};
    attempts.forEach((a) => {
      const dept = a.department || a.user?.department || 'Other';
      if (!departmentScores[dept]) departmentScores[dept] = { total: 0, count: 0 };
      departmentScores[dept].total += a.overallScore;
      departmentScores[dept].count += 1;
    });

    const departmentReadiness = Object.keys(departmentScores).map((dept) => ({
      department: dept,
      avgScore: Math.round(departmentScores[dept].total / departmentScores[dept].count),
      candidates: departmentScores[dept].count
    }));

    // Competency averages across all attempts
    const competencyTotals = {};
    COMPETENCIES.forEach(c => {
      const key = c === 'Emotional Intelligence' ? 'emotionalIntelligence' : c === 'Problem Solving' ? 'problemSolving' : c === 'Time Management' ? 'timeManagement' : c.toLowerCase();
      competencyTotals[key] = { total: 0, count: 0, name: c };
    });

    attempts.forEach((a) => {
      if (a.traitScores) {
        Object.keys(competencyTotals).forEach((key) => {
          if (a.traitScores[key]?.score) {
            competencyTotals[key].total += a.traitScores[key].score;
            competencyTotals[key].count += 1;
          }
        });
      }
    });

    const competencyAverages = Object.keys(competencyTotals).map((key) => ({
      key,
      name: competencyTotals[key].name,
      avgScore: competencyTotals[key].count > 0 ? Math.round(competencyTotals[key].total / competencyTotals[key].count) : 75
    })).sort((a, b) => b.avgScore - a.avgScore);

    res.json({
      success: true,
      totalEvaluated,
      avgReadiness,
      departmentReadiness,
      competencyAverages,
      attempts,
      profiles: attempts // backward compatible
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 4. LEGACY SUPPORT (QUESTIONS & EVALUATE)
// ==========================================

exports.getPsychometricQuestions = async (req, res) => {
  try {
    const customQuestions = await PsychometricQuestion.find().sort({ createdAt: 1 });
    const formattedCustom = customQuestions.map(q => ({
      id: q.id,
      dimension: q.dimension,
      category: q.category,
      prompt: q.prompt,
      department: q.department,
      isCustom: true,
      _id: q._id
    }));

    const allQuestions = [...PSYCHOMETRIC_QUESTIONS, ...formattedCustom];

    res.json({
      success: true,
      count: allQuestions.length,
      questions: allQuestions,
      customCount: customQuestions.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPsychometricQuestion = async (req, res) => {
  try {
    const { dimension, category, prompt, department } = req.body;
    if (!dimension || !prompt || !category) {
      return res.status(400).json({ success: false, message: 'Dimension, category, and statement prompt are required.' });
    }

    const questionId = 'PQ_' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const newQuestion = await PsychometricQuestion.create({
      id: questionId,
      dimension,
      category: category.trim(),
      prompt: prompt.trim(),
      department: department || 'All',
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      question: newQuestion,
      message: 'Psychometric test question created successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.generateAIPsychometricQuestions = async (req, res) => {
  try {
    const { dimension = 'problemSolving', roleTarget = 'Software Engineer', count = 2 } = req.body;
    const q = await PsychometricQuestion.create({
      id: 'PQ_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      dimension,
      category: 'Behavioral Aptitude',
      prompt: `I naturally apply structured root-cause methodology when tackling challenging ${roleTarget} problems.`,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      count: 1,
      questions: [q],
      message: 'Successfully generated psychometric question.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePsychometricQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    await PsychometricQuestion.findByIdAndDelete(id);
    res.json({ success: true, message: 'Psychometric question deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.evaluatePsychometric = exports.submitPsychometricAttempt;

exports.generateAIAssessment = async (req, res) => {
  try {
    const { submoduleId } = req.body;
    const questions = [
      {
        questionText: 'Which algorithm is most optimal for searching in a balanced binary search tree?',
        type: 'mcq',
        options: ['O(N)', 'O(log N)', 'O(1)', 'O(N^2)'],
        correctAnswer: 'O(log N)',
        marks: 2,
        difficulty: 'Medium'
      }
    ];
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
