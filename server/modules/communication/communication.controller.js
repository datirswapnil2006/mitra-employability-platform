const CommunicationAssessmentAttempt = require('./communicationAttempt.model');
const {
  generateScenarioAndFirstQuestion,
  generateFollowUpQuestion,
  evaluateFullCommunicationAttempt
} = require('../../utils/aiCommunicationEngine');

/**
 * 1. Start a New AI Communication Assessment Session
 * POST /api/communication/start
 */
exports.startAssessment = async (req, res) => {
  try {
    const { assessmentType, difficulty = 'Medium', responseMode = 'Text Mode' } = req.body;
    const rawCount = req.body.questionCount || req.body.targetTurns || 3;
    const parsedCount = parseInt(rawCount, 10);
    // Validate question count: clamped between 1 and 25 questions (default 3)
    const validQuestionCount = (!isNaN(parsedCount) && parsedCount >= 1 && parsedCount <= 25) ? parsedCount : 3;

    if (!assessmentType) {
      return res.status(400).json({ success: false, message: 'Assessment type is required' });
    }

    // Generate dynamic scenario context and first question via AI
    const scenarioData = await generateScenarioAndFirstQuestion({
      assessmentType,
      difficulty
    });

    const initialTurn = {
      turnIndex: 1,
      scenarioRole: scenarioData.scenarioRole || 'Interviewer',
      question: scenarioData.firstQuestion,
      studentResponse: '',
      durationSeconds: 0
    };

    const attempt = await CommunicationAssessmentAttempt.create({
      student: req.user._id,
      assessmentType,
      difficulty,
      responseMode,
      scenarioContext: scenarioData.scenarioContext,
      targetTurns: validQuestionCount,
      questionCount: validQuestionCount,
      dialogue: [initialTurn],
      status: 'in-progress'
    });

    return res.status(201).json({
      success: true,
      message: 'AI Communication Assessment started',
      attempt: {
        _id: attempt._id,
        assessmentType: attempt.assessmentType,
        difficulty: attempt.difficulty,
        responseMode: attempt.responseMode,
        scenarioContext: attempt.scenarioContext,
        targetTurns: validQuestionCount,
        questionCount: validQuestionCount,
        currentTurn: 1,
        question: initialTurn.question,
        scenarioRole: initialTurn.scenarioRole,
        dialogue: attempt.dialogue
      }
    });
  } catch (error) {
    console.error('[CommunicationController] startAssessment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize communication assessment session',
      error: error.message
    });
  }
};

/**
 * 2. Submit Response to Current Scenario & Generate Next Dynamic Question
 * POST /api/communication/respond
 */
exports.respondToQuestion = async (req, res) => {
  try {
    const { attemptId, studentResponse, durationSeconds = 0 } = req.body;

    if (!attemptId) {
      return res.status(400).json({ success: false, message: 'Attempt ID is required' });
    }

    const attempt = await CommunicationAssessmentAttempt.findOne({
      _id: attemptId,
      student: req.user._id
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Assessment attempt not found' });
    }

    if (attempt.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Assessment has already been completed' });
    }

    const currentTurnIdx = attempt.dialogue.length - 1;
    if (currentTurnIdx < 0) {
      return res.status(400).json({ success: false, message: 'Invalid dialogue state' });
    }

    // Save response for current turn
    attempt.dialogue[currentTurnIdx].studentResponse = (studentResponse || '').trim();
    attempt.dialogue[currentTurnIdx].durationSeconds = Number(durationSeconds) || 0;

    const totalAllowedQuestions = attempt.questionCount || attempt.targetTurns || 3;
    const currentTurnNumber = attempt.dialogue.length;
    const isLastTurn = currentTurnNumber >= totalAllowedQuestions;

    let nextQuestionData = null;

    if (!isLastTurn) {
      // Generate dynamic follow-up question via AI
      nextQuestionData = await generateFollowUpQuestion({
        assessmentType: attempt.assessmentType,
        difficulty: attempt.difficulty,
        scenarioContext: attempt.scenarioContext,
        scenarioRole: attempt.dialogue[currentTurnIdx].scenarioRole,
        dialogueHistory: attempt.dialogue,
        currentTurn: currentTurnNumber + 1,
        maxTurns: totalAllowedQuestions
      });

      const nextTurn = {
        turnIndex: currentTurnNumber + 1,
        scenarioRole: attempt.dialogue[0].scenarioRole || 'Interviewer',
        question: nextQuestionData.followUpQuestion,
        studentResponse: '',
        durationSeconds: 0,
        interimFeedback: nextQuestionData.interimFeedback || ''
      };

      attempt.dialogue.push(nextTurn);
    }

    await attempt.save();

    return res.json({
      success: true,
      isCompleted: isLastTurn,
      currentTurnNumber: attempt.dialogue.length,
      targetTurns: totalAllowedQuestions,
      questionCount: totalAllowedQuestions,
      dialogue: attempt.dialogue,
      nextTurn: isLastTurn
        ? null
        : {
            turnIndex: attempt.dialogue.length,
            question: attempt.dialogue[attempt.dialogue.length - 1].question,
            scenarioRole: attempt.dialogue[attempt.dialogue.length - 1].scenarioRole,
            interimFeedback: attempt.dialogue[attempt.dialogue.length - 1].interimFeedback
          }
    });
  } catch (error) {
    console.error('[CommunicationController] respondToQuestion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record response and generate follow-up',
      error: error.message
    });
  }
};

/**
 * 3. Finalize & Evaluate AI Communication Assessment
 * POST /api/communication/evaluate
 */
exports.evaluateAssessment = async (req, res) => {
  try {
    const { attemptId } = req.body;

    if (!attemptId) {
      return res.status(400).json({ success: false, message: 'Attempt ID is required' });
    }

    const attempt = await CommunicationAssessmentAttempt.findOne({
      _id: attemptId,
      student: req.user._id
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Assessment attempt not found' });
    }

    // Run comprehensive AI multi-rubric evaluation
    const evaluationResults = await evaluateFullCommunicationAttempt({
      assessmentType: attempt.assessmentType,
      difficulty: attempt.difficulty,
      dialogue: attempt.dialogue
    });

    attempt.evaluation = {
      grammar: evaluationResults.grammar || 75,
      fluency: evaluationResults.fluency || 75,
      vocabulary: evaluationResults.vocabulary || 75,
      relevance: evaluationResults.relevance || 80,
      structure: evaluationResults.structure || 75,
      clarity: evaluationResults.clarity || 75,
      confidenceIndicator: evaluationResults.confidenceIndicator || 75,
      overallScore: evaluationResults.overallScore || 76,
      strengths: evaluationResults.strengths || [],
      improvements: evaluationResults.improvements || [],
      recommendations: evaluationResults.recommendations || [],
      detailedFeedback: evaluationResults.detailedFeedback || ''
    };

    attempt.status = 'completed';
    attempt.completedAt = new Date();
    await attempt.save();

    return res.json({
      success: true,
      message: 'AI Communication Assessment evaluated successfully',
      attempt: {
        _id: attempt._id,
        assessmentType: attempt.assessmentType,
        difficulty: attempt.difficulty,
        responseMode: attempt.responseMode,
        scenarioContext: attempt.scenarioContext,
        dialogue: attempt.dialogue,
        evaluation: attempt.evaluation,
        status: attempt.status,
        completedAt: attempt.completedAt,
        createdAt: attempt.createdAt
      }
    });
  } catch (error) {
    console.error('[CommunicationController] evaluateAssessment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to evaluate communication assessment',
      error: error.message
    });
  }
};

/**
 * 4. Get Student Communication Assessment History & Progress Analytics
 * GET /api/communication/history
 */
exports.getAssessmentHistory = async (req, res) => {
  try {
    const attempts = await CommunicationAssessmentAttempt.find({
      student: req.user._id,
      status: 'completed'
    })
      .sort({ createdAt: 1 })
      .select('-__v');

    const totalAttempts = attempts.length;
    let averageScore = 0;
    let bestScore = 0;
    let recentScores = [];

    if (totalAttempts > 0) {
      const sum = attempts.reduce((acc, curr) => acc + (curr.evaluation?.overallScore || 0), 0);
      averageScore = Math.round(sum / totalAttempts);
      bestScore = Math.max(...attempts.map((a) => a.evaluation?.overallScore || 0));
      recentScores = attempts.map((a, idx) => ({
        attemptNumber: idx + 1,
        id: a._id,
        assessmentType: a.assessmentType,
        difficulty: a.difficulty,
        score: a.evaluation?.overallScore || 0,
        grammar: a.evaluation?.grammar || 0,
        fluency: a.evaluation?.fluency || 0,
        vocabulary: a.evaluation?.vocabulary || 0,
        relevance: a.evaluation?.relevance || 0,
        structure: a.evaluation?.structure || 0,
        clarity: a.evaluation?.clarity || 0,
        confidenceIndicator: a.evaluation?.confidenceIndicator || 0,
        date: a.completedAt || a.createdAt
      }));
    }

    return res.json({
      success: true,
      stats: {
        totalAttempts,
        averageScore,
        bestScore,
        trajectory: recentScores
      },
      attempts: [...attempts].reverse() // Newest first for list view
    });
  } catch (error) {
    console.error('[CommunicationController] getAssessmentHistory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve communication assessment history',
      error: error.message
    });
  }
};

/**
 * 5. Get Specific Communication Attempt by ID
 * GET /api/communication/attempt/:id
 */
exports.getAssessmentAttemptById = async (req, res) => {
  try {
    const { id } = req.params;
    const attempt = await CommunicationAssessmentAttempt.findOne({
      _id: id,
      student: req.user._id
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Assessment attempt not found' });
    }

    return res.json({
      success: true,
      attempt
    });
  } catch (error) {
    console.error('[CommunicationController] getAssessmentAttemptById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve assessment attempt',
      error: error.message
    });
  }
};
