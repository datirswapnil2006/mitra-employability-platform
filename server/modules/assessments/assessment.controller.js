const { Assessment, AssessmentAttempt } = require('./assessment.models');
const Question = require('./question.model');
const { Topic } = require('../training/training.models');
const { StudentProfile } = require('../students/student.model');
const StudentProgress = require('../progress/progress.model');
const { awardActivityXP } = require('../gamification/gamification.service');
const { evaluateSqlQuery } = require('../../utils/sqlEvaluator');
const { generateQuestionsAI } = require('../../utils/aiQuestionGenerator');
const { extractQuestionsFromPdfText } = require('../../utils/pdfQuestionExtractor');
const { extractQuestionsWithPatterns } = require('../../utils/patternPdfParser');
const { cleanMathExpression } = require('../../utils/mathCleaner');

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
      filter.isPracticeTest = { $ne: true };
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

    // Check 24-hour retake cooldown for students (institutional assessments only, NOT self practice tests)
    if (user && user.role === 'student' && !assessment.isPracticeTest) {
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

// Record Abandoned / Terminated Assessment Attempt (locks for 24 hours)
exports.abandonAssessment = async (req, res) => {
  try {
    const {
      assessmentId,
      violationsCount = 1,
      proctoringLogs = [],
      submissionReason = '',
      timeSpentSeconds = 0,
      answers = []
    } = req.body;
    const userId = req.user.id || req.user._id;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const totalQuestions = assessment.questions?.length || 1;
    const vCount = parseInt(violationsCount, 10) || 1;

    let finalReason = submissionReason;
    if (!finalReason) {
      finalReason = vCount >= 3
        ? 'Auto-Terminated: 3 Proctoring Strikes Reached'
        : 'Candidate abandoned assessment before submission';
    }

    const incomingLogs = Array.isArray(proctoringLogs) ? proctoringLogs : [];
    let logs = incomingLogs.length > 0 ? incomingLogs : [
      {
        type: 'TEST_ABANDONED',
        timestamp: new Date(),
        details: `${finalReason}. 24-hour retake cooldown enforced.`
      }
    ];

    const finalViolationsCount = Math.max(vCount, incomingLogs.length > 0 ? incomingLogs.length : vCount);

    const attempt = await AssessmentAttempt.create({
      user: userId,
      assessmentId,
      moduleId: assessment.moduleId,
      submoduleId: assessment.submoduleId,
      topicId: assessment.topicId,
      score: 0,
      totalMarks: assessment.totalMarks || totalQuestions,
      percentage: 0,
      status: 'FAILED',
      isAbandoned: true,
      submissionReason: finalReason,
      timeSpentSeconds: parseInt(timeSpentSeconds, 10) || 0,
      answers: Array.isArray(answers) ? answers : [],
      categoryBreakdown: { mcq: '0/0', sql: '0/0', conceptual: '0/0', output: '0/0', coding: '0/0' },
      violationsCount: finalViolationsCount,
      proctoringLogs: logs
    });

    const unlockTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    res.json({
      success: true,
      message: 'Assessment marked as abandoned/terminated. You can retake this assessment in 24 hours.',
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
    const {
      assessmentId,
      timeSpentSeconds,
      answers,
      violationsCount = 0,
      proctoringLogs = [],
      submissionReason = 'Submitted Normally by Candidate'
    } = req.body;
    const userId = req.user.id || req.user._id;

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
      topicId: assessment.topicId,
      score: totalScore,
      totalMarks: maxScore,
      percentage,
      status,
      attemptNumber,
      submissionReason: submissionReason || 'Submitted Normally by Candidate',
      timeSpentSeconds: timeSpentSeconds || 0,
      answers: gradedAnswers,
      categoryBreakdown,
      violationsCount: Math.max(parseInt(violationsCount, 10) || 0, Array.isArray(proctoringLogs) ? proctoringLogs.length : 0),
      proctoringLogs: Array.isArray(proctoringLogs) ? proctoringLogs : []
    });

    // Trigger lightweight gamification XP and streak (fail-safe)
    try {
      if (assessment.isPracticeTest) {
        await awardActivityXP(userId, 'PRACTICE_TEST_COMPLETE', attempt._id.toString(), assessment.title);
      } else if (status === 'PASSED') {
        await awardActivityXP(userId, 'DEFAULT_ASSESSMENT_PASS', assessment._id.toString(), assessment.title);
      }
      if (percentage >= 80) {
        await awardActivityXP(userId, 'HIGH_SCORE_BONUS', attempt._id.toString(), `High Score on ${assessment.title}`);
      }
    } catch (xpErr) {
      console.error('[Gamification Assessment Error]:', xpErr.message);
    }

    res.json({
      success: true,
      result: attempt,
      attempt,
      attemptId: attempt._id,
      score: totalScore,
      totalMarks: maxScore,
      percentage,
      status,
      passed: status === 'PASSED'
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

    const count = Math.min(Math.max(parseInt(questionCount, 10) || 5, 1), 30);

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

// Extract Questions from PDF using offline pattern recognition (Zero LLM calls)
exports.extractPdfQuestions = async (req, res) => {
  try {
    const {
      pdfText,
      category = 'Quantitative Aptitude',
      topic = 'General',
      difficulty = 'Medium',
      questionCount
    } = req.body;

    const pdfBuffer = req.file ? req.file.buffer : null;

    if (!pdfBuffer && (!pdfText || !pdfText.trim())) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file or text provided. Please select a valid PDF document.'
      });
    }

    // Admin Question Bank extraction returns ALL questions from PDF (e.g. 26, 203, etc.)
    // A specific limit is only applied if a positive count is explicitly provided
    const rawCount = questionCount !== undefined && questionCount !== 'all' ? parseInt(questionCount, 10) : 0;
    const count = Number.isInteger(rawCount) && rawCount > 0 ? rawCount : 0;

    const extractionResult = await extractQuestionsWithPatterns({
      pdfBuffer,
      pdfText,
      category,
      topic,
      difficulty,
      count
    });

    res.json({
      success: true,
      count: extractionResult.questions.length,
      totalDetected: extractionResult.totalDetected,
      pageCount: extractionResult.pageCount,
      questions: extractionResult.questions,
      category: extractionResult.category,
      topic: extractionResult.topic,
      difficulty: extractionResult.difficulty
    });
  } catch (err) {
    console.error('[PDF Pattern Extractor Error]:', err);
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to extract questions from PDF. Please check that the PDF contains readable text and numbered questions.'
    });
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

    const finalQuestionCount = Math.min(Math.max(parseInt(questionCount, 10) || 5, 1), 30);

    const generatedQuestions = await generateQuestionsAI({
      provider,
      module: moduleName,
      category,
      department: moduleName === 'Domain' ? (department || category) : null,
      topic: topic.trim(),
      difficulty,
      count: finalQuestionCount
    });

    const cappedQuestions = (generatedQuestions || []).slice(0, 30);
    const totalMarks = cappedQuestions.reduce((acc, q) => acc + (q.marks || 1), 0);

    const assessment = await Assessment.create({
      title: title || `${moduleName} Assessment — ${topic.trim()}`,
      description: description || `AI-generated assessment covering ${topic.trim()} (${category}) concepts.`,
      module: moduleName,
      category,
      department: moduleName === 'Domain' ? (department || category) : null,
      topic: topic.trim(),
      difficulty,
      questions: cappedQuestions,
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
      if (data.questions.length > 30) {
        data.questions = data.questions.slice(0, 30);
      }
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
      if (data.questions.length > 30) {
        data.questions = data.questions.slice(0, 30);
      }
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

// ==========================================
// Student Self Practice Test (Zero AI, Question Bank, Max 30 Questions)
// ==========================================
exports.createPracticeTest = async (req, res) => {
  try {
    const { topicId, topic, questionCount = 10, difficulty = 'All' } = req.body;
    const userId = req.user._id || req.user.id;

    // Hard cap at 30 questions system-wide
    const finalCount = Math.min(Math.max(parseInt(questionCount, 10) || 10, 1), 30);

    let topicDoc = null;
    if (topicId && topicId !== 'undefined') {
      topicDoc = await Topic.findById(topicId);
    }
    if (!topicDoc && topic) {
      topicDoc = await Topic.findOne({ title: topic.trim() });
    }

    const topicTitle = topicDoc ? topicDoc.title : (topic || 'General');
    const topicModule = topicDoc ? topicDoc.module : 'Aptitude';
    const topicCategory = topicDoc ? topicDoc.category : 'Quantitative';
    const topicDept = topicDoc ? topicDoc.department : null;

    // Build question query
    const qFilter = {};
    if (topicDoc) {
      qFilter.$or = [
        { topicId: topicDoc._id },
        { topic: topicDoc.title }
      ];
    } else {
      qFilter.topic = topicTitle;
    }

    if (difficulty && difficulty !== 'All') {
      qFilter.difficulty = difficulty;
    }

    let candidateQuestions = await Question.find({ ...qFilter, status: 'active' });

    // If candidate questions are empty with a strict difficulty filter, fallback to all difficulties for this topic
    if (candidateQuestions.length === 0 && difficulty && difficulty !== 'All') {
      const relaxedFilter = topicDoc
        ? { $or: [{ topicId: topicDoc._id }, { topic: topicDoc.title }], status: 'active' }
        : { topic: topicTitle, status: 'active' };
      candidateQuestions = await Question.find(relaxedFilter);
    }

    // Fallback if no questions in Question collection yet:
    // Extract questions from any published assessments for this topic
    if (candidateQuestions.length === 0) {
      const existingAssessments = await Assessment.find({
        $or: [{ topicId: topicDoc?._id }, { topic: topicTitle }]
      });
      const extracted = [];
      existingAssessments.forEach(a => {
        if (a.questions && Array.isArray(a.questions)) {
          a.questions.forEach(q => {
            extracted.push({
              questionText: q.questionText,
              codeSnippet: q.codeSnippet || '',
              type: q.type || 'mcq',
              options: q.options || [],
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || '',
              difficulty: q.difficulty || 'Medium',
              marks: q.marks || 1
            });
          });
        }
      });
      candidateQuestions = extracted;
    }

    if (candidateQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No questions available in the question bank for "${topicTitle}". Please contact instructor or check back later.`
      });
    }

    // Deduplicate candidate pool by normalized question text so candidates are strictly unique
    const normalizeQ = (text) => (text || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const seenCandidateTexts = new Set();
    const uniqueCandidates = [];
    for (const q of candidateQuestions) {
      const key = normalizeQ(q.questionText);
      if (key && !seenCandidateTexts.has(key)) {
        seenCandidateTexts.add(key);
        uniqueCandidates.push(q);
      }
    }

    // -------------------------------------------------------------
    // Comprehensive student attempt & serve history tracking
    // Repetition is allowed ONLY when unattempted questions are exhausted!
    // -------------------------------------------------------------
    const topicAssessmentIds = await Assessment.find({
      $or: [
        { topicId: topicDoc?._id },
        { topic: topicTitle },
        { createdBy: userId, isPracticeTest: true }
      ]
    }).distinct('_id');

    // 1. Gather all student attempts across this topic (no limit, full history!)
    const userAttempts = await AssessmentAttempt.find({
      user: userId,
      $or: [
        { topicId: topicDoc?._id },
        { assessmentId: { $in: topicAssessmentIds } }
      ]
    }).sort({ attemptedAt: -1 });

    const questionHistory = new Map();

    userAttempts.forEach(att => {
      if (att.answers && Array.isArray(att.answers)) {
        att.answers.forEach(ans => {
          if (ans.questionText) {
            const key = normalizeQ(ans.questionText);
            const prev = questionHistory.get(key) || { count: 0, lastDate: att.attemptedAt || new Date(0) };
            questionHistory.set(key, {
              count: prev.count + 1,
              lastDate: att.attemptedAt && att.attemptedAt > prev.lastDate ? att.attemptedAt : prev.lastDate
            });
          }
        });
      }
    });

    // 2. Also track questions from recent practice tests created by this student (past 48 hours)
    const recentPracticeTests = await Assessment.find({
      createdBy: userId,
      isPracticeTest: true,
      $or: [
        { topicId: topicDoc?._id },
        { topic: topicTitle }
      ],
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
    });

    recentPracticeTests.forEach(test => {
      if (test.questions && Array.isArray(test.questions)) {
        test.questions.forEach(q => {
          if (q.questionText) {
            const key = normalizeQ(q.questionText);
            if (!questionHistory.has(key)) {
              questionHistory.set(key, { count: 1, lastDate: test.createdAt });
            }
          }
        });
      }
    });

    // 3. Partition candidate questions into unseen vs seen
    const unseenQuestions = [];
    const seenQuestions = [];

    uniqueCandidates.forEach(q => {
      const key = normalizeQ(q.questionText);
      const hist = questionHistory.get(key);
      if (!hist || hist.count === 0) {
        unseenQuestions.push(q);
      } else {
        seenQuestions.push({
          question: q,
          count: hist.count,
          lastDate: hist.lastDate ? new Date(hist.lastDate).getTime() : 0
        });
      }
    });

    // Sort seen questions: lowest attempt count first, then oldest attempt date first, with random tie-breaker
    seenQuestions.sort((a, b) => {
      if (a.count !== b.count) return a.count - b.count;
      if (a.lastDate !== b.lastDate) return a.lastDate - b.lastDate;
      return 0.5 - Math.random();
    });

    const shuffle = arr => [...arr].sort(() => 0.5 - Math.random());
    const targetCount = Math.min(finalCount, uniqueCandidates.length);

    let selectedQuestions = [];

    if (unseenQuestions.length >= targetCount) {
      // Plenty of unattempted questions in the question bank -> Zero repetition!
      selectedQuestions = shuffle(unseenQuestions).slice(0, targetCount);
    } else if (unseenQuestions.length > 0) {
      // Partial unattempted questions remaining -> Exhaust ALL unseen questions first, fill remainder with least-seen questions
      const needed = targetCount - unseenQuestions.length;
      const repeats = seenQuestions.slice(0, needed).map(x => x.question);
      selectedQuestions = shuffle([...unseenQuestions, ...repeats]);
    } else {
      // All questions in the question bank have been attempted -> Repetition is allowed, cycling through least-frequently seen
      selectedQuestions = shuffle(seenQuestions.slice(0, targetCount).map(x => x.question));
    }

    // Hard limit safety check
    selectedQuestions = selectedQuestions.slice(0, 30);

    const timeLimit = Math.max(1, selectedQuestions.length);
    const totalMarks = selectedQuestions.reduce((acc, q) => acc + (q.marks || 1), 0);

    // Reuse existing Assessment module for test taking
    const assessment = await Assessment.create({
      title: `${topicTitle} — Self Practice Test (${selectedQuestions.length} Questions)`,
      description: `Student self-practice evaluation covering ${topicTitle}. Questions selected from database Question Bank.`,
      module: topicModule,
      category: topicCategory,
      department: topicDept,
      topic: topicTitle,
      topicId: topicDoc?._id || null,
      difficulty: difficulty === 'All' ? 'Mixed' : difficulty,
      isPracticeTest: true,
      isDefaultTopicAssessment: false,
      isAIGenerated: false,
      aiProvider: 'manual',
      creationMethod: 'MANUAL',
      assessmentMode: 'NORMAL',
      questions: selectedQuestions.map(q => ({
        questionText: cleanMathExpression(q.questionText),
        codeSnippet: q.codeSnippet || '',
        type: q.type || 'mcq',
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: cleanMathExpression(q.explanation || ''),
        marks: q.marks || 1,
        difficulty: q.difficulty || 'Medium'
      })),
      totalMarks,
      passingScorePercentage: 70,
      timeLimitMinutes: timeLimit,
      proctoringSettings: {
        camera: false,
        screenShare: false,
        fullScreen: false,
        tabSwitch: false,
        copyPaste: false,
        secondPerson: false,
        mobileDetection: false
      },
      status: 'published',
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      assessmentId: assessment._id,
      assessment
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// Default Topic Assessment (Auto-Provisioned, Zero AI at runtime, <= 30 Questions)
// ==========================================
exports.getDefaultTopicAssessment = async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user?._id || req.user?.id;

    let topicDoc = null;
    if (topicId && topicId !== 'undefined' && topicId !== 'null') {
      topicDoc = await Topic.findById(topicId);
    }
    if (!topicDoc) {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }

    // 1. Check if an assessment is already linked as default or has topicId & isDefaultTopicAssessment
    let assessment = await Assessment.findOne({
      $or: [
        { _id: topicDoc.defaultAssessmentId },
        { topicId: topicDoc._id, isDefaultTopicAssessment: true },
        { topic: topicDoc.title, isDefaultTopicAssessment: true },
        { topic: topicDoc.title, isPracticeTest: false, status: 'published' }
      ]
    }).sort({ isDefaultTopicAssessment: -1, createdAt: 1 });

    // 2. If no assessment exists yet, check if Question Bank has questions to auto-provision one
    if (!assessment) {
      const qPool = await Question.find({
        $or: [{ topicId: topicDoc._id }, { topic: topicDoc.title }],
        status: 'active'
      });

      if (qPool.length >= 5) {
        // Auto-provision default assessment with up to 15 questions (hard capped at 30)
        const qCount = Math.min(qPool.length, 15);
        const shuffled = [...qPool].sort(() => 0.5 - Math.random()).slice(0, qCount);
        const totalMarks = shuffled.reduce((acc, q) => acc + (q.marks || 1), 0);

        assessment = await Assessment.create({
          title: `${topicDoc.title} — Official Assessment`,
          description: `Comprehensive default topic assessment testing core proficiency in ${topicDoc.title}.`,
          module: topicDoc.module || 'Aptitude',
          category: topicDoc.category || 'Quantitative',
          department: topicDoc.department || null,
          topic: topicDoc.title,
          topicId: topicDoc._id,
          difficulty: 'Medium',
          isDefaultTopicAssessment: true,
          isPracticeTest: false,
          isAIGenerated: false,
          aiProvider: 'manual',
          creationMethod: 'MANUAL',
          assessmentMode: 'NORMAL',
          questions: shuffled.map(q => ({
            questionText: q.questionText,
            codeSnippet: q.codeSnippet || '',
            type: q.type || 'mcq',
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            marks: q.marks || 1,
            difficulty: q.difficulty || 'Medium'
          })),
          totalMarks,
          passingScorePercentage: 70,
          timeLimitMinutes: Math.max(15, Math.round(qCount * 1.5)),
          status: 'published'
        });

        // Link on topic
        topicDoc.defaultAssessmentId = assessment._id;
        await topicDoc.save();
      }
    }

    if (!assessment) {
      return res.json({
        success: true,
        assessment: null,
        message: 'No default assessment created yet for this topic.'
      });
    }

    // Check user's latest attempt for this assessment if student
    let userAttempt = null;
    if (userId) {
      userAttempt = await AssessmentAttempt.findOne({
        user: userId,
        assessmentId: assessment._id
      }).sort({ attemptedAt: -1 });
    }

    // Prepare response (hide answers if student)
    const aObj = assessment.toObject();
    if (req.user && req.user.role === 'student') {
      aObj.questions = (aObj.questions || []).map(q => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
      });
    }

    res.json({
      success: true,
      assessment: aObj,
      userAttempt
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
