const { TrainingModule, Submodule, Topic, LearningContent } = require('./training.models');
const { extractUrlMetadata } = require('../../utils/externalMetadata');

// Get URL metadata preview for Admin (SSRF Safe)
exports.previewMetadata = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'Please provide a video URL.' });
    }
    const meta = await extractUrlMetadata(url);
    res.json({ success: true, metadata: meta });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Unable to fetch video information. Please verify the video URL.'
    });
  }
};

// ==========================================
// TOPICS CRUD (Topic-Based Aptitude & Training)
// ==========================================
exports.getTopics = async (req, res) => {
  try {
    const { module: moduleName, category, status, search } = req.query;
    const filter = {};

    if (moduleName) {
      if (moduleName === 'Domain' || moduleName === 'Domain Knowledge') {
        filter.module = { $in: ['Domain', 'Domain Knowledge'] };
      } else {
        filter.module = moduleName;
      }
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    if (req.user && req.user.role === 'student') {
      filter.status = 'published';
    } else if (status && status !== 'All') {
      filter.status = status;
    }

    const topics = await Topic.find(filter).sort({ order: 1, createdAt: 1 });

    // Aggregate counts for published and total videos & notes per topic
    const topicIds = topics.map(t => t._id);
    const contentCounts = await LearningContent.aggregate([
      { $match: { topicId: { $in: topicIds } } },
      {
        $group: {
          _id: { topicId: '$topicId', resourceType: '$resourceType', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    const topicsWithStats = topics.map(t => {
      const tObj = t.toObject();
      const relevant = contentCounts.filter(c => c._id.topicId && c._id.topicId.toString() === t._id.toString());
      
      const videoCount = relevant.filter(c => c._id.resourceType !== 'note').reduce((acc, curr) => acc + curr.count, 0);
      const notesCount = relevant.filter(c => c._id.resourceType === 'note').reduce((acc, curr) => acc + curr.count, 0);
      const publishedVideos = relevant.filter(c => c._id.resourceType !== 'note' && c._id.status === 'published').reduce((acc, curr) => acc + curr.count, 0);
      const publishedNotes = relevant.filter(c => c._id.resourceType === 'note' && c._id.status === 'published').reduce((acc, curr) => acc + curr.count, 0);

      tObj.videoCount = videoCount;
      tObj.notesCount = notesCount;
      tObj.publishedVideos = publishedVideos;
      tObj.publishedNotes = publishedNotes;
      return tObj;
    });

    res.json({ success: true, count: topicsWithStats.length, topics: topicsWithStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }
    if (req.user && req.user.role === 'student' && topic.status !== 'published') {
      return res.status(403).json({ success: false, message: 'Access denied to unpublished topic' });
    }
    res.json({ success: true, topic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTopic = async (req, res) => {
  try {
    const { module: moduleName = 'Aptitude', category, title, description, order, status } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Topic title is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const topic = await Topic.create({
      module: moduleName,
      category: category.trim(),
      title: title.trim(),
      description: description ? description.trim() : '',
      order: order !== undefined ? Number(order) : 0,
      status: status || 'published',
      createdBy: req.user?._id
    });

    res.status(201).json({ success: true, topic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTopic = async (req, res) => {
  try {
    const { title, description, order, status, category, module: moduleName } = req.body;
    const updateData = { updatedAt: Date.now() };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (order !== undefined) updateData.order = Number(order);
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category.trim();
    if (moduleName !== undefined) updateData.module = moduleName;

    const topic = await Topic.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    // Also update topic name string in associated learning contents if title changed
    if (title !== undefined) {
      await LearningContent.updateMany({ topicId: topic._id }, { topic: topic.title });
    }

    res.json({ success: true, topic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }
    await LearningContent.deleteMany({ topicId: req.params.id });
    res.json({ success: true, message: 'Topic and all associated learning contents deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// Training Modules CRUD
// ==========================================
exports.getModules = async (req, res) => {
  try {
    const { module: moduleName, category, department } = req.query;
    const filter = {};

    if (moduleName) {
      if (moduleName === 'Domain' || moduleName === 'Domain Knowledge') {
        filter.module = { $in: ['Domain', 'Domain Knowledge'] };
      } else {
        filter.module = moduleName;
      }
    }
    if (category) filter.category = category;
    if (department && department !== 'All') {
      filter.$or = [{ departments: 'All' }, { departments: department }, { department: department }];
    }
    if (req.user && req.user.role === 'student') {
      filter.status = 'published';
    }

    const modules = await TrainingModule.find(filter).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, count: modules.length, modules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createModule = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.user) data.createdBy = req.user._id;
    const moduleItem = await TrainingModule.create(data);
    res.status(201).json({ success: true, module: moduleItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const moduleItem = await TrainingModule.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    res.json({ success: true, module: moduleItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    await TrainingModule.findByIdAndDelete(req.params.id);
    await Submodule.deleteMany({ moduleId: req.params.id });
    await LearningContent.deleteMany({ moduleId: req.params.id });
    res.json({ success: true, message: 'Module and associated submodules deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// Submodules CRUD
// ==========================================
exports.getSubmodules = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const filter = { moduleId };
    if (req.user && req.user.role === 'student') {
      filter.status = 'published';
    }
    const submodules = await Submodule.find(filter).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, count: submodules.length, submodules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSubmodule = async (req, res) => {
  try {
    const submodule = await Submodule.create(req.body);
    res.status(201).json({ success: true, submodule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSubmodule = async (req, res) => {
  try {
    const submodule = await Submodule.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    res.json({ success: true, submodule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSubmodule = async (req, res) => {
  try {
    await Submodule.findByIdAndDelete(req.params.id);
    await LearningContent.deleteMany({ submoduleId: req.params.id });
    res.json({ success: true, message: 'Submodule and contents deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// Learning Content (Videos & Notes) CRUD
// ==========================================
exports.getContentList = async (req, res) => {
  try {
    const { module: moduleName, category, submoduleId, topicId, department, topic, difficulty, resourceType, status } = req.query;
    const filter = {};

    if (moduleName) {
      if (moduleName === 'Domain' || moduleName === 'Domain Knowledge') {
        filter.module = { $in: ['Domain', 'Domain Knowledge'] };
      } else {
        filter.module = moduleName;
      }
    }
    if (category && category !== 'All') filter.category = category;
    if (submoduleId) filter.submoduleId = submoduleId;
    if (topicId) {
      filter.$or = [{ topicId }, { submoduleId: topicId }];
    }
    if (department && department !== 'All') {
      filter.$or = [{ department }, { departments: department }, { departments: 'All' }];
    }
    if (topic) filter.topic = { $regex: topic, $options: 'i' };
    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
    
    if (resourceType && resourceType !== 'All') {
      if (resourceType === 'video') {
        filter.resourceType = { $in: ['video', null] };
      } else {
        filter.resourceType = resourceType;
      }
    }

    if (req.user && req.user.role === 'student') {
      filter.status = 'published';
    } else if (status && status !== 'All') {
      filter.status = status;
    }

    const contents = await LearningContent.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, count: contents.length, contents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createContent = async (req, res) => {
  try {
    const data = { ...req.body };
    const isNote = data.resourceType === 'note';

    if (!data.title || !data.title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    if (isNote) {
      data.resourceType = 'note';
      data.contentType = 'note';
      const pdf = data.pdfUrl || data.resourceUrl;

      if (!pdf) {
        return res.status(400).json({ success: false, message: 'PDF document is required for study notes.' });
      }

      // Check base64 size if uploaded as data URI (5MB limit = 5,242,880 bytes)
      if (typeof pdf === 'string' && pdf.startsWith('data:')) {
        if (!pdf.includes('application/pdf')) {
          return res.status(400).json({ success: false, message: 'Only PDF files (.pdf) are allowed for study notes.' });
        }
        // Base64 string length to approximate byte size: (len * 3) / 4
        const estimatedBytes = Math.round((pdf.length * 3) / 4);
        if (estimatedBytes > 5 * 1024 * 1024) {
          return res.status(400).json({ success: false, message: 'PDF size exceeds the 5MB limit. Please upload a PDF file up to 5MB.' });
        }
      }

      data.pdfUrl = pdf;
      data.resourceUrl = pdf;
      data.videoUrl = '';
    } else {
      // Video resource
      const url = data.videoUrl || data.resourceUrl;
      if (!url) {
        return res.status(400).json({ success: false, message: 'Video URL or Resource URL is required.' });
      }

      data.resourceUrl = url;
      data.videoUrl = url;
      data.resourceType = 'video';
      data.contentType = 'video';

      // Fetch and sync thumbnail/metadata if not supplied
      if (!data.thumbnailUrl && url) {
        try {
          const meta = await extractUrlMetadata(url);
          data.thumbnailUrl = meta.thumbnailUrl;
          data.videoProvider = meta.provider;
          data.provider = meta.provider;
          if (!data.title && meta.title) data.title = meta.title;
          if (!data.description && meta.description) data.description = meta.description;
        } catch (e) {
          // Continue with user-entered values
        }
      }
    }

    // Attach topic string if topicId is provided
    if (data.topicId && !data.topic) {
      const parentTopic = await Topic.findById(data.topicId);
      if (parentTopic) {
        data.topic = parentTopic.title;
        if (!data.category) data.category = parentTopic.category;
      }
    }

    if (req.user) data.createdBy = req.user._id;

    const content = await LearningContent.create(data);
    res.status(201).json({ success: true, content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: Date.now() };

    if (data.resourceType === 'note') {
      const pdf = data.pdfUrl || data.resourceUrl;
      if (pdf) {
        if (typeof pdf === 'string' && pdf.startsWith('data:')) {
          if (!pdf.includes('application/pdf')) {
            return res.status(400).json({ success: false, message: 'Only PDF files (.pdf) are allowed for study notes.' });
          }
          const estimatedBytes = Math.round((pdf.length * 3) / 4);
          if (estimatedBytes > 5 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: 'PDF size exceeds the 5MB limit. Please upload a PDF file up to 5MB.' });
          }
        }
        data.pdfUrl = pdf;
        data.resourceUrl = pdf;
      }
    } else if (data.resourceType === 'video' || (!data.resourceType && data.videoUrl)) {
      if (data.videoUrl && !data.resourceUrl) data.resourceUrl = data.videoUrl;
      if (data.resourceUrl && !data.videoUrl) data.videoUrl = data.resourceUrl;
    }

    if (data.topicId && !data.topic) {
      const parentTopic = await Topic.findById(data.topicId);
      if (parentTopic) {
        data.topic = parentTopic.title;
      }
    }

    const content = await LearningContent.findByIdAndUpdate(req.params.id, data, { returnDocument: 'after' });
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteContent = async (req, res) => {
  try {
    const content = await LearningContent.findByIdAndDelete(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    res.json({ success: true, message: 'Content item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

