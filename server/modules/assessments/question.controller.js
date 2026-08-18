const Question = require('./question.model');
const { generateQuestionsAI } = require('../../utils/aiQuestionGenerator');

// Get Questions with filtering & search
exports.getQuestions = async (req, res) => {
  try {
    const { module: moduleName, category, department, difficulty, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (moduleName && moduleName !== 'All') filter.module = moduleName;
    if (category && category !== 'All') filter.category = category;
    if (department && department !== 'All') {
      filter.$or = [{ department }, { category: department }];
    }
    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;

    if (search && search.trim()) {
      filter.$or = [
        { questionText: { $regex: search.trim(), $options: 'i' } },
        { topic: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Question.countDocuments(filter);
    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      count: questions.length,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / limit),
      questions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single question
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create single Question manually
exports.createQuestion = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.user) data.createdBy = req.user._id;

    const question = await Question.create(data);
    res.status(201).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Question
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Question
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Generate AI Questions (Gemini, Groq, Hugging Face)
exports.generateAI = async (req, res) => {
  try {
    const { provider, module: moduleName, category, department, topic, difficulty, count } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Topic name is required for AI generation.' });
    }

    const generated = await generateQuestionsAI({
      provider: provider || 'gemini',
      module: moduleName || 'Aptitude',
      category: category || 'Quantitative',
      department: department || null,
      topic: topic.trim(),
      difficulty: difficulty || 'Medium',
      count: Math.min(Math.max(parseInt(count, 10) || 3, 1), 10)
    });

    res.json({
      success: true,
      count: generated.length,
      provider: generated[0]?.aiProvider || provider,
      questions: generated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Bulk Save AI-Generated Questions
exports.bulkSaveQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Questions array is required.' });
    }

    const docs = questions.map((q) => ({
      ...q,
      createdBy: req.user ? req.user._id : undefined
    }));

    const saved = await Question.insertMany(docs);
    res.status(201).json({
      success: true,
      count: saved.length,
      questions: saved
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
