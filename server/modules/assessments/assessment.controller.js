const { Assessment, AssessmentAttempt } = require('./assessment.models');
const StudentProgress = require('../progress/progress.model');
const { evaluateSqlQuery } = require('../../utils/sqlEvaluator');
const { generateQuestionsAI } = require('../../utils/aiQuestionGenerator');

// Get assessments list with module/department filtering
exports.getAssessments = async (req, res) => {
  try {
    const { module: moduleName, type, category, department, submoduleId, difficulty, status } = req.query;
    const filter = {};

    const targetModule = moduleName || type;
    if (targetModule && targetModule !== 'All') {
      if (targetModule === 'Domain' || targetModule === 'Domain Knowledge') {
        filter.module = { $in: ['Domain', 'Domain Knowledge'] };
      } else if (targetModule === 'Full' || targetModule === 'Full Assessment') {
        filter.module = { $in: ['Full', 'Full Assessment'] };
      } else {
        filter.module = targetModule;
      }
    }

    if (category && category !== 'All') filter.category = category;
    if (department && department !== 'All') {
      filter.$or = [{ department }, { category: department }];
    }
    if (submoduleId) filter.submoduleId = submoduleId;
    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;

    if (req.user && req.user.role === 'student') {
      filter.status = 'published';
    } else if (status && status !== 'All') {
      filter.status = status;
    }

    const assessments = await Assessment.find(filter)
      .populate('moduleId', 'title category')
      .populate('submoduleId', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: assessments.length, assessments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single assessment for taking test
exports.getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const assessment = await Assessment.findById(id).populate('submoduleId', 'title');
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Prepare response data (hide answers from students while test is active)
    const responseData = assessment.toObject();
    if (user && user.role === 'student') {
      responseData.questions = responseData.questions.map((q) => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
      });
    }

    res.json({ success: true, assessment: responseData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Submit assessment answers & auto-grade attempt
exports.submitAssessment = async (req, res) => {
  try {
    const { assessmentId, timeSpentSeconds, answers } = req.body;
    const userId = req.user.id;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    let totalScore = 0;
    let maxScore = 0;

    const breakdownStats = {
      mcq: { total: 0, correct: 0 },
      sql: { total: 0, correct: 0 },
      conceptual: { total: 0, correct: 0 },
      output: { total: 0, correct: 0 },
      coding: { total: 0, correct: 0 }
    };

    const gradedAnswers = assessment.questions.map((question) => {
      const qId = question._id.toString();
      const studentAnsObj = (answers || []).find((a) => a.questionId === qId);
      const studentVal = studentAnsObj ? String(studentAnsObj.studentAnswer || '').trim() : '';

      const qType = question.type || 'mcq';
      const marks = question.marks || 1;
      maxScore += marks;

      let isCorrect = false;
      let scoreAwarded = 0;

      if (!breakdownStats[qType]) breakdownStats[qType] = { total: 0, correct: 0 };
      breakdownStats[qType].total += 1;

      if (qType === 'sql') {
        const sqlResult = evaluateSqlQuery(studentVal, question.schemaSql, question.referenceQuery || question.correctAnswer);
        isCorrect = sqlResult.pass;
      } else {
        const expected = String(question.correctAnswer || '').trim().toLowerCase();
        const actual = studentVal.toLowerCase();
        isCorrect = expected === actual && actual.length > 0;
      }

      if (isCorrect) {
        scoreAwarded = marks;
        totalScore += marks;
        breakdownStats[qType].correct += 1;
      }

      return {
        questionId: qId,
        questionText: question.questionText,
        type: qType,
        studentAnswer: studentVal,
        correctAnswer: question.correctAnswer,
        isCorrect,
        marksAwarded: scoreAwarded,
        explanation: question.explanation
      };
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passingThreshold = assessment.passingScorePercentage || 70;
    const status = percentage >= passingThreshold ? 'PASSED' : 'FAILED';

    const existingAttempts = await AssessmentAttempt.countDocuments({ user: userId, assessmentId });
    const attemptNumber = existingAttempts + 1;

    const categoryBreakdown = {
      mcq: `${breakdownStats.mcq.correct}/${breakdownStats.mcq.total}`,
      sql: `${breakdownStats.sql.correct}/${breakdownStats.sql.total}`,
      conceptual: `${breakdownStats.conceptual.correct}/${breakdownStats.conceptual.total}`,
      output: `${breakdownStats.output.correct}/${breakdownStats.output.total}`,
      coding: `${breakdownStats.coding.correct}/${breakdownStats.coding.total}`
    };

    const attempt = await AssessmentAttempt.create({
      user: userId,
      assessmentId,
      moduleId: assessment.moduleId,
      submoduleId: assessment.submoduleId,
      score: totalScore,
      totalMarks: maxScore,
      percentage,
      status,
      attemptNumber,
      timeSpentSeconds: timeSpentSeconds || 0,
      answers: gradedAnswers,
      categoryBreakdown
    });

    res.json({
      success: true,
      result: attempt
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single attempt details
exports.getAttemptById = async (req, res) => {
  try {
    const { id } = req.params;
    const attempt = await AssessmentAttempt.findById(id)
      .populate('assessmentId', 'title description passingScorePercentage timeLimitMinutes module category topic')
      .populate('user', 'name email department');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt record not found' });
    }

    res.json({ success: true, attempt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get student test result attempts
exports.getStudentAttempts = async (req, res) => {
  try {
    const userId = req.user.id;
    const attempts = await AssessmentAttempt.find({ user: userId })
      .populate('assessmentId', 'title passingScorePercentage module category topic')
      .sort({ attemptedAt: -1 });

    res.json({ success: true, count: attempts.length, attempts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Generate Assessment via AI (Gemini, Groq, Hugging Face)
exports.generateAIAssessment = async (req, res) => {
  try {
    const {
      provider = 'gemini',
      title,
      description,
      module: moduleName = 'Aptitude',
      category = 'Quantitative',
      department = null,
      topic,
      difficulty = 'Medium',
      questionCount = 5,
      timeLimitMinutes = 20,
      passingScorePercentage = 70,
      status = 'published'
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Topic name is required.' });
    }

    const generatedQuestions = await generateQuestionsAI({
      provider,
      module: moduleName,
      category,
      department: moduleName === 'Domain' ? (department || category) : null,
      topic: topic.trim(),
      difficulty,
      count: Math.min(Math.max(parseInt(questionCount, 10) || 5, 1), 20)
    });

    const totalMarks = generatedQuestions.reduce((acc, q) => acc + (q.marks || 1), 0);

    const assessment = await Assessment.create({
      title: title || `${moduleName} Assessment — ${topic.trim()}`,
      description: description || `AI-generated assessment covering ${topic.trim()} (${category}) concepts.`,
      module: moduleName,
      category,
      department: moduleName === 'Domain' ? (department || category) : null,
      topic: topic.trim(),
      difficulty,
      questions: generatedQuestions,
      passingScorePercentage: parseInt(passingScorePercentage, 10) || 70,
      timeLimitMinutes: parseInt(timeLimitMinutes, 10) || 20,
      totalMarks,
      isAIGenerated: true,
      aiProvider: generatedQuestions[0]?.aiProvider || provider,
      status: status || 'published',
      createdBy: req.user ? req.user._id : undefined
    });

    res.status(201).json({
      success: true,
      assessment
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin CRUD
exports.getAllAssessmentsAdmin = async (req, res) => {
  try {
    const assessments = await Assessment.find()
      .populate('moduleId', 'title category')
      .populate('submoduleId', 'title')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: assessments.length, assessments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.user) data.createdBy = req.user._id;

    if (data.questions && Array.isArray(data.questions)) {
      data.totalMarks = data.questions.reduce((acc, q) => acc + (q.marks || 1), 0);
    }

    const assessment = await Assessment.create(data);
    res.status(201).json({ success: true, assessment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAssessment = async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: Date.now() };
    if (data.questions && Array.isArray(data.questions)) {
      data.totalMarks = data.questions.reduce((acc, q) => acc + (q.marks || 1), 0);
    }

    const assessment = await Assessment.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json({ success: true, assessment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAssessment = async (req, res) => {
  try {
    await Assessment.findByIdAndDelete(req.params.id);
    await AssessmentAttempt.deleteMany({ assessmentId: req.params.id });
    res.json({ success: true, message: 'Assessment and student attempts deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin Results & Performance Overview
exports.getAllAttemptsAdmin = async (req, res) => {
  try {
    const { module: moduleName, department, status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    const attempts = await AssessmentAttempt.find(filter)
      .populate('user', 'name email department year erpNumber phone')
      .populate('assessmentId', 'title module category topic passingScorePercentage timeLimitMinutes difficulty')
      .sort({ attemptedAt: -1 });

    // Client-side populated filters
    const filtered = attempts.filter((att) => {
      if (!att.user) return false;

      // Module filter
      if (moduleName && moduleName !== 'All') {
        const attMod = att.assessmentId?.module;
        if (moduleName === 'Domain' || moduleName === 'Domain Knowledge') {
          if (attMod !== 'Domain' && attMod !== 'Domain Knowledge') return false;
        } else if (attMod !== moduleName) {
          return false;
        }
      }

      // Department filter
      if (department && department !== 'All') {
        if (att.user.department !== department && att.assessmentId?.department !== department) {
          return false;
        }
      }

      // Search filter
      if (search && search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = att.user.name?.toLowerCase().includes(q);
        const emailMatch = att.user.email?.toLowerCase().includes(q);
        const erpMatch = att.user.erpNumber?.toLowerCase().includes(q);
        const titleMatch = att.assessmentId?.title?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !erpMatch && !titleMatch) return false;
      }

      return true;
    });

    const total = filtered.length;
    const passedCount = filtered.filter((a) => a.status === 'PASSED').length;
    const passRate = total > 0 ? Math.round((passedCount / total) * 100) : 0;
    const avgScore = total > 0 ? Math.round(filtered.reduce((acc, a) => acc + (a.percentage || 0), 0) / total) : 0;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const paginatedAttempts = filtered.slice(skip, skip + parseInt(limit, 10));

    res.json({
      success: true,
      total,
      passRate,
      avgScore,
      passedCount,
      failedCount: total - passedCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / limit),
      attempts: paginatedAttempts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
