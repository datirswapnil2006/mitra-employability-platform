const mongoose = require('mongoose');
const Question = require('./question.model');
const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');
const { Category, Topic } = require('../training/training.models');
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
      if (/^[0-9a-fA-F]{24}$/.test(category)) {
        // If an ObjectId was passed directly as category
        const catDoc = await Category.findById(category).lean();
        if (catDoc) {
          const escapedTitle = catDoc.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          andConditions.push({
            $or: [
              { categoryId: catDoc._id },
              { category: { $regex: new RegExp(`^${escapedTitle}$`, 'i') } }
            ]
          });
        } else {
          andConditions.push({ categoryId: new mongoose.Types.ObjectId(category) });
        }
      } else {
        let catPattern;
        if (/Reasoning/i.test(category)) {
          catPattern = '(?:Logical\\s+)?Reasoning';
        } else if (/Quantitative|Quant/i.test(category)) {
          catPattern = 'Quantitative(?:\\s+Aptitude)?';
        } else if (/Verbal/i.test(category)) {
          catPattern = 'Verbal(?:\\s+Ability)?';
        } else {
          const cleanCat = category.replace(/ Aptitude| Reasoning| Ability/i, '').trim();
          catPattern = cleanCat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        const catConditions = [
          { category: { $regex: new RegExp(catPattern, 'i') } }
        ];
        if (categoryId && categoryId !== 'All' && /^[0-9a-fA-F]{24}$/.test(categoryId)) {
          catConditions.push({ categoryId: new mongoose.Types.ObjectId(categoryId) });
        }
        andConditions.push({ $or: catConditions });
      }
    } else if (categoryId && categoryId !== 'All' && /^[0-9a-fA-F]{24}$/.test(categoryId)) {
      andConditions.push({ categoryId: new mongoose.Types.ObjectId(categoryId) });
    }

    if (department && department !== 'All') {
      andConditions.push({
        $or: [{ department }, { category: department }]
      });
    }

    if (topicId && topicId !== 'All' && topic && topic !== 'All') {
      const escapedTopic = topic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const topicOr = [{ topic: { $regex: new RegExp(`^${escapedTopic}$`, 'i') } }];
      if (/^[0-9a-fA-F]{24}$/.test(topicId)) {
        topicOr.push({ topicId: new mongoose.Types.ObjectId(topicId) });
      }
      andConditions.push({ $or: topicOr });
    } else if (topicId && topicId !== 'All') {
      if (/^[0-9a-fA-F]{24}$/.test(topicId)) {
        const topDoc = await Topic.findById(topicId).lean();
        if (topDoc) {
          const escapedTitle = topDoc.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          andConditions.push({
            $or: [
              { topicId: topDoc._id },
              { topic: { $regex: new RegExp(`^${escapedTitle}$`, 'i') } }
            ]
          });
        } else {
          andConditions.push({ topicId: new mongoose.Types.ObjectId(topicId) });
        }
      } else {
        const escapedTopic = String(topicId).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        andConditions.push({ topic: { $regex: new RegExp(`^${escapedTopic}$`, 'i') } });
      }
    } else if (topic && topic !== 'All') {
      const escapedTopic = topic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      andConditions.push({ topic: { $regex: new RegExp(`^${escapedTopic}$`, 'i') } });
    }

    if (difficulty && difficulty !== 'All') {
      andConditions.push({ difficulty });
    }

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

    let total = await Question.countDocuments(filter);
    let [easy, medium, hard] = await Promise.all([
      Question.countDocuments({ ...filter, difficulty: { $in: ['Easy', 'Beginner'] } }),
      Question.countDocuments({ ...filter, difficulty: { $in: ['Medium', 'Intermediate', 'Mixed', 'mixed'] } }),
      Question.countDocuments({ ...filter, difficulty: { $in: ['Hard', 'Advanced'] } })
    ]);

    if (total === 0 && topic) {
      const aliasMap = {
        'Simplification': ['Number System', 'HCF and LCM', 'Average'],
        'Ratio & Proportion': ['Allegation and Proportion'],
        'Number & Letter Series': ['Number Series'],
        'Number/Alphabet Series': ['Number Series'],
        'Sentence Correction': ['Articles'],
        'Vocabulary & Idioms': ['Articles'],
        'Reading Comprehension': ['Articles']
      };
      const aliases = aliasMap[topic];
      if (aliases && aliases.length > 0) {
        const aliasFilter = { topic: { $in: aliases } };
        total = await Question.countDocuments(aliasFilter);
        [easy, medium, hard] = await Promise.all([
          Question.countDocuments({ ...aliasFilter, difficulty: { $in: ['Easy', 'Beginner'] } }),
          Question.countDocuments({ ...aliasFilter, difficulty: { $in: ['Medium', 'Intermediate', 'Mixed', 'mixed'] } }),
          Question.countDocuments({ ...aliasFilter, difficulty: { $in: ['Hard', 'Advanced'] } })
        ]);
      }
    }

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

// Helper to normalize question payload (options, difficulty, correctAnswer, IDs, department)
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

  // Sanitize department: null if 'All', 'General', or not in OFFICIAL_DEPARTMENTS
  let dept = q.department;
  if (!dept || dept === 'All' || dept === 'General' || !OFFICIAL_DEPARTMENTS.includes(dept)) {
    dept = null;
  }

  // Sanitize ObjectIds: null if not a valid 24-hex string
  const sanitizeId = (id) => (id && /^[0-9a-fA-F]{24}$/.test(String(id)) ? id : null);

  // Normalize module
  let mod = q.module || 'Aptitude';
  if (mod === 'Domain Knowledge') mod = 'Domain';

  return {
    ...q,
    module: mod,
    department: dept,
    categoryId: sanitizeId(q.categoryId),
    topicId: sanitizeId(q.topicId),
    moduleId: sanitizeId(q.moduleId),
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

    // Auto-resolve category / categoryId
    if (!data.categoryId && data.category) {
      const escapedCat = data.category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const catQuery = { title: new RegExp(`^${escapedCat}$`, 'i') };
      if (data.module) catQuery.module = { $in: [data.module, data.module === 'Domain' ? 'Domain Knowledge' : data.module] };
      const catDoc = await Category.findOne(catQuery).lean();
      if (catDoc) data.categoryId = catDoc._id;
    } else if (data.categoryId && !data.category) {
      const catDoc = await Category.findById(data.categoryId).lean();
      if (catDoc) data.category = catDoc.title;
    }

    // Auto-resolve topic / topicId
    if (!data.topicId && data.topic) {
      const escapedTopic = data.topic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const topQuery = { title: new RegExp(`^${escapedTopic}$`, 'i') };
      if (data.categoryId) topQuery.categoryId = data.categoryId;
      const topDoc = await Topic.findOne(topQuery).lean();
      if (topDoc) data.topicId = topDoc._id;
    } else if (data.topicId && !data.topic) {
      const topDoc = await Topic.findById(data.topicId).lean();
      if (topDoc) data.topic = topDoc.title;
    }

    const question = await Question.create(data);
    res.status(201).json({ success: true, question });
  } catch (err) {
    console.error('Error creating question:', err);
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

// Bulk Delete Questions (by ID array or by topic filter)
exports.bulkDeleteQuestions = async (req, res) => {
  try {
    const { ids, topic, topicId, module: moduleName, category } = req.body;

    let query = {};
    if (Array.isArray(ids) && ids.length > 0) {
      query._id = { $in: ids };
    } else if (topic || topicId) {
      const topicConditions = [];
      if (topicId && topicId !== 'All') {
        topicConditions.push({ topicId: topicId });
        if (mongoose.Types.ObjectId.isValid(topicId)) {
          topicConditions.push({ topicId: new mongoose.Types.ObjectId(topicId) });
        }
      }
      if (topic && topic !== 'All') {
        const escapedTopic = topic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        topicConditions.push({ topic: { $regex: new RegExp(`^${escapedTopic}$`, 'i') } });
      }

      if (topicConditions.length > 0) {
        query.$or = topicConditions;
      }

      if (moduleName && moduleName !== 'All') {
        if (moduleName === 'Domain' || moduleName === 'Domain Knowledge') {
          query.module = { $in: ['Domain', 'Domain Knowledge'] };
        } else {
          query.module = moduleName;
        }
      }

      if (category && category !== 'All') {
        let catPattern;
        if (/Reasoning/i.test(category)) {
          catPattern = '(?:Logical\\s+)?Reasoning';
        } else if (/Quantitative|Quant/i.test(category)) {
          catPattern = 'Quantitative(?:\\s+Aptitude)?';
        } else if (/Verbal/i.test(category)) {
          catPattern = 'Verbal(?:\\s+Ability)?';
        } else {
          const cleanCat = category.replace(/ Aptitude| Reasoning| Ability/i, '').trim();
          catPattern = cleanCat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        query.category = { $regex: new RegExp(catPattern, 'i') };
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Must provide either an array of question IDs or a topic to delete.'
      });
    }

    const result = await Question.deleteMany(query);
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} question(s).`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Generate AI Questions (Google Gemini)
exports.generateAI = async (req, res) => {
  try {
    const { module: moduleName, category, department, topic, difficulty, count } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Topic name is required for AI generation.' });
    }

    const generated = await generateQuestionsAI({
      provider: 'gemini',
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
      provider: generated[0]?.aiProvider || 'gemini',
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

    const sanitizeId = (id) => (id && /^[0-9a-fA-F]{24}$/.test(String(id)) ? id : null);
    const cleanDept = (d) => (!d || d === 'All' || d === 'General' || !OFFICIAL_DEPARTMENTS.includes(d)) ? null : d;

    const fallbackCatId = sanitizeId(categoryId);
    const fallbackTopicId = sanitizeId(topicId);
    const fallbackModuleId = sanitizeId(moduleId);
    const fallbackDept = cleanDept(department);
    const fallbackModule = moduleName === 'Domain Knowledge' ? 'Domain' : (moduleName || 'Aptitude');

    const docs = questions.map((q) => {
      const normalized = normalizeQuestionPayload(q);
      return {
        ...normalized,
        module: normalized.module || fallbackModule,
        category: normalized.category || category || 'Quantitative',
        department: normalized.department !== undefined && normalized.department !== null ? normalized.department : fallbackDept,
        topic: normalized.topic || topic || '',
        topicId: normalized.topicId || fallbackTopicId,
        categoryId: normalized.categoryId || fallbackCatId,
        moduleId: normalized.moduleId || fallbackModuleId,
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
    console.error('Error in bulkSaveQuestions:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
