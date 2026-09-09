const Question = require('./question.model');
const { generateQuestionsAI } = require('../../utils/aiQuestionGenerator');

// Get Questions with filtering & search
exports.getQuestions = async (req, res) => {
  try {
    const {
      module: moduleName,
      category,
      categoryId,
      department,
      topic,
      topicId,
      difficulty,
      search,
      page = 1,
      limit = 50
    } = req.query;
    const filter = {};

    const andConditions = [];

    if (moduleName && moduleName !== 'All') {
      if (moduleName === 'Domain' || moduleName === 'Domain Knowledge') {
        filter.module = { $in: ['Domain', 'Domain Knowledge'] };
      } else {
        filter.module = moduleName;
      }
    }
    if (category && category !== 'All') {
      const cleanCat = category.replace(/ Aptitude| Reasoning| Ability/i, '').trim();
      const escapedCat = cleanCat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.category = { $regex: new RegExp(`^${escapedCat}`, 'i') };
    }
    if (categoryId && categoryId !== 'All') filter.categoryId = categoryId;

    if (department && department !== 'All') {
      andConditions.push({
        $or: [{ department }, { category: department }]
      });
    }

    if (topicId && topicId !== 'All' && topic && topic !== 'All') {
      const escapedTopic = topic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      andConditions.push({
        $or: [
          { topicId: topicId },
          { topic: { $regex: new RegExp(`^${escapedTopic}$`, 'i') } }
        ]
      });
    } else if (topicId && topicId !== 'All') {
      filter.topicId = topicId;
    } else if (topic && topic !== 'All') {
      const escapedTopic = topic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.topic = { $regex: new RegExp(`^${escapedTopic}$`, 'i') };
    }

    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;

    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      andConditions.push({
        $or: [
          { questionText: { $regex: escapedSearch, $options: 'i' } },
          { topic: { $regex: escapedSearch, $options: 'i' } },
          { category: { $regex: escapedSearch, $options: 'i' } }
        ]
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
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

// Get Question statistics for a specific topic
exports.getTopicQuestionStats = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { topic } = req.query;

    const filter = {};
    if (topicId && topicId !== 'undefined' && topicId !== 'null') {
      filter.$or = [{ topicId }, { topic }];
    } else if (topic) {
      filter.topic = topic;
    }

    const total = await Question.countDocuments(filter);
    const [easy, medium, hard] = await Promise.all([
      Question.countDocuments({ ...filter, difficulty: { $in: ['Easy', 'Beginner'] } }),
      Question.countDocuments({ ...filter, difficulty: { $in: ['Medium', 'Intermediate', 'Mixed', 'mixed'] } }),
      Question.countDocuments({ ...filter, difficulty: { $in: ['Hard', 'Advanced'] } })
    ]);

    res.json({
      success: true,
      stats: {
        total,
        easy,
        medium,
        hard
      }
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

// Helper to normalize question payload (options, difficulty, correctAnswer)
const normalizeQuestionPayload = (q) => {
  const rawOptions = Array.isArray(q.options) ? q.options : [];
  let correctAnswer = q.correctAnswer;

  const normalizedOptions = rawOptions.map((opt, i) => {
    if (typeof opt === 'object' && opt !== null) {
      if (opt.isCorrect && (!correctAnswer || correctAnswer === 'A' || correctAnswer === 'Option A')) {
        correctAnswer = opt.text || String.fromCharCode(65 + i);
      }
      return opt.text !== undefined ? String(opt.text).trim() : (opt.title !== undefined ? String(opt.title).trim() : JSON.stringify(opt));
    }
    return String(opt).trim();
  }).filter(Boolean);

  while (normalizedOptions.length < 4) {
    normalizedOptions.push(`Option ${String.fromCharCode(65 + normalizedOptions.length)}`);
  }

  let finalAns = typeof correctAnswer === 'object' && correctAnswer !== null
    ? (correctAnswer.text || String(correctAnswer))
    : String(correctAnswer || normalizedOptions[0] || 'A').trim();

  let diff = q.difficulty ? String(q.difficulty).trim() : 'Medium';
  diff = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
  if (!['Easy', 'Medium', 'Hard', 'Beginner', 'Intermediate', 'Advanced', 'Mixed'].includes(diff)) {
    diff = 'Medium';
  }

  return {
    ...q,
    options: normalizedOptions,
    correctAnswer: finalAns,
    difficulty: diff
  };
};

// Create single Question manually
exports.createQuestion = async (req, res) => {
  try {
    const data = normalizeQuestionPayload({ ...req.body });
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
    const data = normalizeQuestionPayload({ ...req.body });
    data.updatedAt = Date.now();
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      data,
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

// Bulk Save Questions (from AI, manual batch, or PDF extraction)
exports.bulkSaveQuestions = async (req, res) => {
  try {
    const { questions, topicId, categoryId, moduleId, module: moduleName, category, department, topic } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Questions array is required.' });
    }

    const docs = questions.map((q) => {
      const normalized = normalizeQuestionPayload(q);
      return {
        ...normalized,
        module: normalized.module || moduleName || 'Aptitude',
        category: normalized.category || category || 'Quantitative',
        department: normalized.department !== undefined ? normalized.department : (department || null),
        topic: normalized.topic || topic || '',
        topicId: normalized.topicId || topicId || null,
        categoryId: normalized.categoryId || categoryId || null,
        moduleId: normalized.moduleId || moduleId || null,
        createdBy: req.user ? req.user._id : undefined
      };
    });

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
