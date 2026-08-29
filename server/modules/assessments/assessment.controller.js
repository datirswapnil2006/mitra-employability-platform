const { Assessment, AssessmentAttempt } = require('./assessment.models');
const { StudentProfile } = require('../students/student.model');
const StudentProgress = require('../progress/progress.model');
const { evaluateSqlQuery } = require('../../utils/sqlEvaluator');
const { generateQuestionsAI } = require('../../utils/aiQuestionGenerator');
const { extractQuestionsFromPdfText } = require('../../utils/pdfQuestionExtractor');

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

    if (category && category !== 'All') {
      const escaped = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.category = { $regex: new RegExp(escaped.replace(/ Aptitude| Reasoning| Ability/i, ''), 'i') };
    }
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

    if (req.user && req.user.role === 'student') {
      const recentAttempts = await AssessmentAttempt.find({
        user: req.user._id,
        attemptedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      const attemptMap = {};
      recentAttempts.forEach((att) => {
        const attId = att.assessmentId.toString();
        if (!attemptMap[attId] || new Date(att.attemptedAt) > new Date(attemptMap[attId].attemptedAt)) {
          attemptMap[attId] = att;
        }
      });

      const enriched = assessments.map((a) => {
        const obj = a.toObject();
        const recent = attemptMap[a._id.toString()];
        if (recent) {
          const unlockTime = new Date(new Date(recent.attemptedAt).getTime() + 24 * 60 * 60 * 1000);
          const remainingMs = unlockTime.getTime() - Date.now();
          if (remainingMs > 0) {
            obj.isLocked = true;
            obj.lockedUntil = unlockTime;
            obj.remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
            obj.remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
            obj.isAbandoned = recent.isAbandoned;
          }
        }
        return obj;
      });

      return res.json({ success: true, count: enriched.length, assessments: enriched });
    }

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

    // Check 24-hour retake cooldown for students
    if (user && user.role === 'student') {
      const lastAttempt = await AssessmentAttempt.findOne({
        user: user._id || user.id,
        assessmentId: id,
        attemptedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).sort({ attemptedAt: -1 });

      if (lastAttempt) {
        const unlockTime = new Date(new Date(lastAttempt.attemptedAt).getTime() + 24 * 60 * 60 * 1000);
        const remainingMs = unlockTime.getTime() - Date.now();
        if (remainingMs > 0) {
          const hours = Math.floor(remainingMs / (60 * 60 * 1000));
          const mins = Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
          return res.status(403).json({
            success: false,
            isLocked: true,
            message: `Assessment is locked. You can retake this assessment in ${hours > 0 ? `${hours}h ` : ''}${mins}m.`,
            lockedUntil: unlockTime,
            remainingMinutes: Math.ceil(remainingMs / (60 * 1000)),
            isAbandoned: lastAttempt.isAbandoned
          });
        }
      }
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

// Record Abandoned Assessment Attempt (locks for 24 hours)
exports.abandonAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const userId = req.user.id || req.user._id;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const totalQuestions = assessment.questions?.length || 1;

    const attempt = await AssessmentAttempt.create({
      user: userId,
      assessmentId,
      moduleId: assessment.moduleId,
      submoduleId: assessment.submoduleId,
      score: 0,
      totalMarks: assessment.totalMarks || totalQuestions,
      percentage: 0,
      status: 'FAILED',
      isAbandoned: true,
      timeSpentSeconds: 0,
      answers: [],
      categoryBreakdown: { mcq: '0/0', sql: '0/0', conceptual: '0/0', output: '0/0', coding: '0/0' },
      violationsCount: 1,
      proctoringLogs: [
        {
          type: 'TEST_ABANDONED',
          timestamp: new Date(),
          details: 'Candidate abandoned assessment before submission. 24-hour retake cooldown enforced.'
        }
      ]
    });

    const unlockTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    res.json({
      success: true,
      message: 'Assessment marked as abandoned. You can retake this assessment in 24 hours.',
      lockedUntil: unlockTime,
      attempt
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Submit assessment answers & auto-grade attempt
exports.submitAssessment = async (req, res) => {
  try {
    const { assessmentId, timeSpentSeconds, answers, violationsCount = 0, proctoringLogs = [] } = req.body;
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
      categoryBreakdown,
      violationsCount: parseInt(violationsCount, 10) || 0,
      proctoringLogs: Array.isArray(proctoringLogs) ? proctoringLogs : []
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
    const userId = req.user._id || req.user.id;
    const attempts = await AssessmentAttempt.find({ user: userId })
      .populate('assessmentId', 'title passingScorePercentage module category topic assessmentMode timeLimitMinutes difficulty totalMarks')
      .sort({ attemptedAt: -1 });

    res.json({ success: true, count: attempts.length, attempts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Generate Questions for Review (AI)
exports.generateQuestionsForReview = async (req, res) => {
  try {
    const {
      provider = 'gemini',
      module: moduleName = 'Aptitude',
      category = 'Quantitative Aptitude',
      department = null,
      topic,
      difficulty = 'Medium',
      questionCount = 5
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Topic name is required.' });
    }

    const count = Math.min(Math.max(parseInt(questionCount, 10) || 5, 1), 50);

    const questions = await generateQuestionsAI({
      provider,
      module: moduleName,
      category,
      department: moduleName === 'Domain' ? (department || category) : null,
      topic: topic.trim(),
      difficulty,
      count
    });

    res.json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Extract Questions from PDF Text
exports.extractPdfQuestions = async (req, res) => {
  try {
    const {
      pdfText,
      category = 'Quantitative Aptitude',
      topic = 'General',
      difficulty = 'Medium',
      questionCount = 10
    } = req.body;

    if (!pdfText || !pdfText.trim()) {
      return res.status(400).json({ success: false, message: 'No text or content found in uploaded PDF.' });
    }

    const count = Math.min(Math.max(parseInt(questionCount, 10) || 10, 1), 50);

    const questions = await extractQuestionsFromPdfText({
      pdfText,
      category,
      topic,
      difficulty,
      count
    });

    res.json({
      success: true,
      count: questions.length,
      questions
    });
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
      assessmentMode = 'NORMAL',
      creationMethod = 'AI_GENERATED',
      proctoringSettings,
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
      count: Math.min(Math.max(parseInt(questionCount, 10) || 5, 1), 50)
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
      assessmentMode: assessmentMode || 'NORMAL',
      creationMethod: creationMethod || 'AI_GENERATED',
      proctoringSettings: proctoringSettings || {
        camera: true,
        screenShare: true,
        fullScreen: true,
        tabSwitch: true,
        copyPaste: true,
        secondPerson: true,
        mobileDetection: true
      },
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
    const { module: moduleName, department, batch, status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    const attempts = await AssessmentAttempt.find(filter)
      .populate('user', 'name email department year phone')
      .populate('assessmentId', 'title module category topic passingScorePercentage timeLimitMinutes difficulty assessmentMode')
      .sort({ attemptedAt: -1 });

    const userIds = attempts.map((a) => a.user?._id).filter(Boolean);
    const studentProfiles = await StudentProfile.find({ user: { $in: userIds } });
    const profileMap = new Map(studentProfiles.map((p) => [p.user.toString(), p]));

    // Client-side populated filters & profile enrichment
    const enrichedAttempts = attempts.map((att) => {
      const obj = att.toObject();
      const prof = att.user ? profileMap.get(att.user._id.toString()) : null;
      if (obj.user) {
        obj.user.erpNumber = prof?.erpNumber || prof?.rollNo || '';
        obj.user.batch = prof?.batch || '';
        obj.user.year = prof?.year || obj.user.year || 'FE';
        obj.user.phone = prof?.phone || obj.user.phone || '';
      }
      return obj;
    });

    const filtered = enrichedAttempts.filter((att) => {
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

      // Batch filter
      if (batch && batch !== 'All') {
        if (att.user.batch !== batch) {
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
