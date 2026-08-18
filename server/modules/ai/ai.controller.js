const { GoogleGenAI } = require('@google/genai');
const { Submodule, LearningContent } = require('../training/training.models');
const { Assessment } = require('../assessments/assessment.models');
const PsychometricProfile = require('./psychometric.model');
const PsychometricQuestion = require('./psychometricQuestion.model');
const StudentProgress = require('../progress/progress.model');
const User = require('../auth/user.model');
const {
  PSYCHOMETRIC_QUESTIONS,
  calculateDimensionScores,
  synthesizePsychometricProfileAI
} = require('../../utils/aiPsychometricAnalyzer');

// 1. Get Psychometric Inventory Questions (Default + Custom Admin Created)
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

// 1b. Create Custom Psychometric Test Question (Admin)
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

// 1c. AI Generate Psychometric Questions (Admin)
exports.generateAIPsychometricQuestions = async (req, res) => {
  try {
    const { dimension = 'problemSolving', roleTarget = 'Software Engineer', count = 2 } = req.body;
    
    const promptText = `
You are a psychometrician and industrial talent psychologist. Generate ${count} situational judgment psychometric evaluation inventory statements for evaluating "${dimension}" in candidates targeting "${roleTarget}".
Each statement must be a clear first-person professional statement (e.g., "I systematically decompose complex problems...").
Return ONLY a valid JSON array of objects with keys: "dimension", "category", "prompt".
dimension must be one of: openness, conscientiousness, extraversion, agreeableness, emotionalStability, leadership, teamwork, problemSolving, adaptability, communication.
`;

    let generated = [];
    const apiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;

    if (apiKey && apiKey !== 'dummy_gemini_key_for_testing') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: promptText
        });
        const textOutput = (response.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
        generated = JSON.parse(textOutput);
      } catch (geminiErr) {
        console.warn('[Gemini Psychometric Generator]:', geminiErr.message);
      }
    }

    if (!Array.isArray(generated) || generated.length === 0) {
      generated = [
        {
          dimension,
          category: 'Behavioral Aptitude',
          prompt: `I naturally apply structured root-cause methodology when tackling challenging ${roleTarget} problems.`
        }
      ];
    }

    const saved = [];
    for (const item of generated) {
      const q = await PsychometricQuestion.create({
        id: 'PQ_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        dimension: item.dimension || dimension,
        category: item.category || 'Behavioral Competency',
        prompt: item.prompt,
        createdBy: req.user.id
      });
      saved.push(q);
    }

    res.status(201).json({
      success: true,
      count: saved.length,
      questions: saved,
      message: `Successfully generated ${saved.length} psychometric questions.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 1d. Delete Custom Psychometric Question (Admin)
exports.deletePsychometricQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    await PsychometricQuestion.findByIdAndDelete(id);
    res.json({ success: true, message: 'Psychometric question deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Evaluate Student Psychometric Responses
exports.evaluatePsychometric = async (req, res) => {
  try {
    const { responses } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ success: false, message: 'Assessment responses are required.' });
    }

    const studentUser = await User.findById(userId);
    const studentName = studentUser ? studentUser.name : 'Student';
    const department = studentUser ? studentUser.department : 'Engineering';

    // Calculate baseline scores
    const { personalityTraits, behavioralFit, employabilityIndex } = calculateDimensionScores(responses);

    // Synthesize AI Psychometric Report (Gemini / Groq / Fallback)
    const aiAnalysis = await synthesizePsychometricProfileAI({
      studentName,
      department,
      personalityTraits,
      behavioralFit,
      employabilityIndex
    });

    // Save profile to database
    const profile = await PsychometricProfile.create({
      user: userId,
      employabilityIndex,
      personalityTraits,
      behavioralFit,
      strengths: aiAnalysis.strengths || [],
      growthAreas: aiAnalysis.growthAreas || [],
      careerFit: aiAnalysis.careerFit || [],
      actionPlan: aiAnalysis.actionPlan || [],
      aiSummary: aiAnalysis.aiSummary || '',
      aiProvider: aiAnalysis.aiProvider || 'gemini',
      responses,
      evaluatedAt: Date.now()
    });

    res.status(201).json({
      success: true,
      profile
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Get Student's Latest Psychometric Profile
exports.getStudentPsychometricProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await PsychometricProfile.findOne({ user: userId })
      .sort({ evaluatedAt: -1 })
      .populate('user', 'name email department year erpNumber');

    res.json({
      success: true,
      hasProfile: Boolean(profile),
      profile
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Admin Psychometric Summary Analytics
exports.getPsychometricAdminSummary = async (req, res) => {
  try {
    const profiles = await PsychometricProfile.find()
      .populate('user', 'name email department year erpNumber')
      .sort({ evaluatedAt: -1 });

    const totalEvaluated = profiles.length;
    const avgReadiness = totalEvaluated > 0
      ? Math.round(profiles.reduce((acc, p) => acc + p.employabilityIndex, 0) / totalEvaluated)
      : 0;

    // Group by department
    const departmentScores = {};
    profiles.forEach((p) => {
      const dept = p.user?.department || 'Other';
      if (!departmentScores[dept]) departmentScores[dept] = { total: 0, count: 0 };
      departmentScores[dept].total += p.employabilityIndex;
      departmentScores[dept].count += 1;
    });

    const departmentReadiness = Object.keys(departmentScores).map((dept) => ({
      department: dept,
      avgScore: Math.round(departmentScores[dept].total / departmentScores[dept].count),
      candidates: departmentScores[dept].count
    }));

    res.json({
      success: true,
      totalEvaluated,
      avgReadiness,
      departmentReadiness,
      profiles
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Generate AI Assessment for Submodule
exports.generateAIAssessment = async (req, res) => {
  try {
    const { submoduleId, questionCount = 5, difficulty = 'Medium' } = req.body;
    const userId = req.user.id;

    const submodule = await Submodule.findById(submoduleId).populate('moduleId');
    if (!submodule) {
      return res.status(404).json({ success: false, message: 'Submodule not found' });
    }

    if (req.user.role === 'student') {
      const progress = await StudentProgress.findOne({ user: userId, submoduleId });
      const isUnlocked = progress ? (progress.isCompleted || progress.submoduleProgressPercentage >= 100) : false;
      if (!isUnlocked) {
        return res.status(403).json({
          success: false,
          message: '🔒 AI Assessment is locked until submodule training is 100% completed.'
        });
      }
    }

    const contents = await LearningContent.find({ submoduleId, status: 'published' });
    const contentContext = contents.map(c => `- ${c.title}: ${c.description} (${c.technology})`).join('\n');

    const promptText = `
You are an expert technical interviewer for an employability platform.
Generate a high-quality, structured test for the topic: "${submodule.title}".
Category: ${submodule.moduleId ? submodule.moduleId.category : 'General'}.
Context/Topics Covered:
${contentContext || 'Standard core concepts of ' + submodule.title}

Difficulty: ${difficulty}
Target Question Count: ${questionCount}

Respond ONLY with a valid JSON array of question objects. Do not include markdown code block formatting.
Each object must have fields: questionText, type, options, correctAnswer, explanation, marks.
`;

    let generatedQuestions = [];
    const apiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;

    if (apiKey && apiKey !== 'dummy_gemini_key_for_testing') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptText
        });

        const textOutput = response.text || '';
        const cleanedText = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
        generatedQuestions = JSON.parse(cleanedText);
      } catch (geminiErr) {
        console.warn('[Gemini API Fallback]:', geminiErr.message);
      }
    }

    if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
      generatedQuestions = [
        {
          questionText: `What is the core foundational principle behind ${submodule.title}?`,
          type: 'mcq',
          options: ['Modular Abstraction & Standard Architecture', 'Random Estimation', 'Memory Leakage', 'None of the above'],
          correctAnswer: 'Modular Abstraction & Standard Architecture',
          explanation: `${submodule.title} builds upon modular design principles.`,
          marks: 5
        }
      ];
    }

    const assessment = await Assessment.create({
      title: `AI Adaptive Assessment — ${submodule.title}`,
      description: `Grounded AI-generated assessment evaluating ${submodule.title} concepts.`,
      moduleId: submodule.moduleId ? submodule.moduleId._id : submodule._id,
      submoduleId: submodule._id,
      questions: generatedQuestions,
      passingScorePercentage: 70,
      timeLimitMinutes: Math.max(10, questionCount * 3),
      totalMarks: generatedQuestions.reduce((acc, q) => acc + (q.marks || 5), 0),
      isAIGenerated: true,
      status: 'published'
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
