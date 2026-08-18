const { TrainingModule, Submodule, LearningContent } = require('./training.models');
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

// Training Modules CRUD
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

// Submodules CRUD
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

// Learning Content CRUD
exports.getContentList = async (req, res) => {
  try {
    const { module: moduleName, category, submoduleId, department, topic, difficulty, resourceType } = req.query;
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
    if (department && department !== 'All') {
      filter.$or = [{ department }, { departments: department }, { departments: 'All' }];
    }
    if (topic) filter.topic = { $regex: topic, $options: 'i' };
    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
    if (resourceType && resourceType !== 'All') filter.resourceType = resourceType;

    if (req.user && req.user.role === 'student') {
      filter.status = 'published';
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
    const url = data.videoUrl || data.resourceUrl;

    if (!url) {
      return res.status(400).json({ success: false, message: 'Video URL or Resource URL is required.' });
    }

    data.resourceUrl = url;
    data.videoUrl = url;

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
    if (data.videoUrl && !data.resourceUrl) data.resourceUrl = data.videoUrl;

    const content = await LearningContent.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteContent = async (req, res) => {
  try {
    await LearningContent.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Content item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
