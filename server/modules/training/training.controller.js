const { TrainingModule, Submodule, Category, Topic, Company, LearningContent, Playlist } = require('./training.models');
const { extractUrlMetadata, extractPlaylistId } = require('../../utils/externalMetadata');
const { OFFICIAL_DEPARTMENTS, getDepartmentAliases, canonicalizeDepartment } = require('../../config/constants');

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
// COMPANIES CRUD (Data-Driven Company Preparation)
// ==========================================
exports.getCompanies = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (req.user && req.user.role === 'student') {
      filter.status = 'published';
    } else if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const companies = await Company.find(filter).sort({ order: 1, createdAt: 1 });
    const companyIds = companies.map(c => c._id);

    // Aggregate topic counts and content counts per company
    const [topicCounts, contentCounts] = await Promise.all([
      Topic.aggregate([
        { $match: { companyId: { $in: companyIds } } },
        {
          $group: {
            _id: { companyId: '$companyId', status: '$status' },
            count: { $sum: 1 }
          }
        }
      ]),
      LearningContent.aggregate([
        { $match: { companyId: { $in: companyIds } } },
        {
          $group: {
            _id: { companyId: '$companyId', resourceType: '$resourceType', status: '$status' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const companiesWithStats = companies.map(comp => {
      const cObj = comp.toObject();
      const relevantTopics = topicCounts.filter(t => t._id.companyId && t._id.companyId.toString() === comp._id.toString());
      const relevantContent = contentCounts.filter(c => c._id.companyId && c._id.companyId.toString() === comp._id.toString());

      cObj.topicCount = relevantTopics.reduce((acc, curr) => acc + curr.count, 0);
      cObj.publishedTopicCount = relevantTopics.filter(t => t._id.status === 'published').reduce((acc, curr) => acc + curr.count, 0);

      cObj.videoCount = relevantContent.filter(c => c._id.resourceType !== 'note').reduce((acc, curr) => acc + curr.count, 0);
      cObj.notesCount = relevantContent.filter(c => c._id.resourceType === 'note').reduce((acc, curr) => acc + curr.count, 0);
      cObj.publishedVideos = relevantContent.filter(c => c._id.resourceType !== 'note' && c._id.status === 'published').reduce((acc, curr) => acc + curr.count, 0);
      cObj.publishedNotes = relevantContent.filter(c => c._id.resourceType === 'note' && c._id.status === 'published').reduce((acc, curr) => acc + curr.count, 0);

      return cObj;
    });

    res.json({ success: true, count: companiesWithStats.length, companies: companiesWithStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    if (req.user && req.user.role === 'student' && company.status !== 'published') {
      return res.status(403).json({ success: false, message: 'Access denied to unpublished company' });
    }
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCompany = async (req, res) => {
  try {
    const { name, description, logoUrl, order, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const company = await Company.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      logoUrl: logoUrl || '',
      order: order !== undefined ? Number(order) : 0,
      status: status || 'published',
      createdBy: req.user?._id
    });

    res.status(201).json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { name, description, logoUrl, order, status } = req.body;
    const updateData = { updatedAt: Date.now() };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (order !== undefined) updateData.order = Number(order);
    if (status !== undefined) updateData.status = status;

    const company = await Company.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (name !== undefined) {
      await Topic.updateMany({ companyId: company._id }, { company: company.name });
      await LearningContent.updateMany({ companyId: company._id }, { company: company.name });
    }

    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    await LearningContent.deleteMany({ companyId: req.params.id });
    await Topic.deleteMany({ companyId: req.params.id });

    res.json({ success: true, message: 'Company and all associated topics and content deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// CATEGORIES CRUD (Department & Module Categories)
// ==========================================
exports.getCategories = async (req, res) => {
  try {
    const { module: moduleName, department, status, search } = req.query;
    const filter = {};

    if (moduleName) {
      if (moduleName === 'Domain' || moduleName === 'Domain Knowledge') {
        filter.module = { $in: ['Domain', 'Domain Knowledge'] };
      } else {
        filter.module = moduleName;
      }
    }

    if (req.user && req.user.role === 'student') {
      filter.status = 'published';
      if (department && department !== 'All') {
        const aliases = getDepartmentAliases(department);
        filter.department = { $in: aliases };
      }
    } else {
      if (department && department !== 'All') {
        const aliases = getDepartmentAliases(department);
        filter.department = { $in: aliases };
      }
      if (status && status !== 'All') {
        filter.status = status;
      }
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const categories = await Category.find(filter).sort({ order: 1, createdAt: 1 });
    const categoryIds = categories.map(c => c._id);


    // Aggregate topic count, content count, and playlist count per category
    const [topicCounts, contentCounts, playlistCounts] = await Promise.all([
      Topic.aggregate([
        { $match: { categoryId: { $in: categoryIds } } },
        {
          $group: {
            _id: { categoryId: '$categoryId', status: '$status' },
            count: { $sum: 1 }
          }
        }
      ]),
      LearningContent.aggregate([
        { $match: { categoryId: { $in: categoryIds } } },
        {
          $group: {
            _id: { categoryId: '$categoryId', resourceType: '$resourceType', status: '$status' },
            count: { $sum: 1 }
          }
        }
      ]),
      Playlist.aggregate([
        { $match: { categoryId: { $in: categoryIds } } },
        {
          $group: {
            _id: { categoryId: '$categoryId', status: '$status' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const categoriesWithStats = categories.map(cat => {
      const cObj = cat.toObject();
      const relevantTopics = topicCounts.filter(t => t._id.categoryId && t._id.categoryId.toString() === cat._id.toString());
      const relevantContent = contentCounts.filter(c => c._id.categoryId && c._id.categoryId.toString() === cat._id.toString());
      const relevantPlaylists = playlistCounts.filter(p => p._id.categoryId && p._id.categoryId.toString() === cat._id.toString());

      cObj.topicCount = relevantTopics.reduce((acc, curr) => acc + curr.count, 0);
      cObj.publishedTopicCount = relevantTopics.filter(t => t._id.status === 'published').reduce((acc, curr) => acc + curr.count, 0);

      cObj.videoCount = relevantContent.filter(c => c._id.resourceType !== 'note').reduce((acc, curr) => acc + curr.count, 0);
      cObj.notesCount = relevantContent.filter(c => c._id.resourceType === 'note').reduce((acc, curr) => acc + curr.count, 0);
      cObj.publishedVideos = relevantContent.filter(c => c._id.resourceType !== 'note' && c._id.status === 'published').reduce((acc, curr) => acc + curr.count, 0);
      cObj.publishedNotes = relevantContent.filter(c => c._id.resourceType === 'note' && c._id.status === 'published').reduce((acc, curr) => acc + curr.count, 0);

      cObj.playlistCount = relevantPlaylists.reduce((acc, curr) => acc + curr.count, 0);
      cObj.publishedPlaylistCount = relevantPlaylists.filter(p => p._id.status === 'published').reduce((acc, curr) => acc + curr.count, 0);

      return cObj;
    });

    res.json({ success: true, count: categoriesWithStats.length, categories: categoriesWithStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    if (req.user && req.user.role === 'student') {
      if (category.status !== 'published') {
        return res.status(403).json({ success: false, message: 'Access denied to unpublished category' });
      }
    }
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { module: moduleName = 'Domain', department, departmentId, title, description, order, status } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Category title is required' });
    }
    if ((moduleName === 'Domain' || moduleName === 'Domain Knowledge') && !department) {
      return res.status(400).json({ success: false, message: 'Department is required for Domain categories' });
    }

    const category = await Category.create({
      module: moduleName === 'Domain Knowledge' ? 'Domain' : moduleName,
      department: department ? department.trim() : null,
      departmentId: departmentId || department,
      title: title.trim(),
      description: description ? description.trim() : '',
      order: order !== undefined ? Number(order) : 0,
      status: status || 'published',
      createdBy: req.user?._id
    });

    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { title, description, order, status, department, departmentId, module: moduleName } = req.body;
    const updateData = { updatedAt: Date.now() };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (order !== undefined) updateData.order = Number(order);
    if (status !== undefined) updateData.status = status;
    if (department !== undefined) updateData.department = department ? department.trim() : null;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (moduleName !== undefined) updateData.module = moduleName;

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Also cascade category title to linked Topics, LearningContents, and Playlists if title changed
    if (title !== undefined) {
      await Topic.updateMany({ categoryId: category._id }, { category: category.title });
      await LearningContent.updateMany({ categoryId: category._id }, { category: category.title });
      await Playlist.updateMany({ categoryId: category._id }, { category: category.title });
    }

    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Cascade delete topics, learning contents, and playlists under this category
    const topics = await Topic.find({ categoryId: req.params.id });
    const topicIds = topics.map(t => t._id);

    await LearningContent.deleteMany({
      $or: [
        { categoryId: req.params.id },
        { topicId: { $in: topicIds } }
      ]
    });
    await Topic.deleteMany({ categoryId: req.params.id });
    await Playlist.deleteMany({ categoryId: req.params.id });

    res.json({ success: true, message: 'Category, associated topics, learning contents, and playlists deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// TOPICS CRUD (Topic-Based Aptitude & Domain)
// ==========================================
exports.getTopics = async (req, res) => {
  try {
    const { module: moduleName, category, categoryId, company, companyId, department, status, search } = req.query;
    const filter = {};

    if (moduleName && moduleName !== 'All') {
      if (moduleName === 'Domain' || moduleName === 'Domain Knowledge') {
        filter.module = { $in: ['Domain', 'Domain Knowledge'] };
      } else if (moduleName === 'Interview' || moduleName === 'Interview Preparation') {
        filter.module = { $in: ['Interview', 'Interview Preparation'] };
      } else {
        filter.module = moduleName;
      }
    }

    if (companyId) {
      filter.companyId = companyId;
    } else if (company && company !== 'All') {
      filter.company = company;
    }

    if (categoryId && categoryId !== 'All') {
      if (/^[0-9a-fA-F]{24}$/.test(categoryId)) {
        filter.categoryId = categoryId;
      }
    } else if (category && category !== 'All') {
      if (/^[0-9a-fA-F]{24}$/.test(category)) {
        filter.categoryId = category;
      } else {
        const cleanCat = category.replace(/ Aptitude| Reasoning| Ability/i, '').trim();
        const escapedCat = cleanCat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.category = { $regex: new RegExp(`^${escapedCat}`, 'i') };
      }
    }

    const isDomainFilter = !moduleName || moduleName === 'All' || moduleName === 'Domain' || moduleName === 'Domain Knowledge';

    if (department && department !== 'All' && isDomainFilter) {
      const aliases = getDepartmentAliases(department);
      if (!moduleName || moduleName === 'All') {
        filter.$or = [
          { department: { $in: aliases } },
          { department: null },
          { department: { $exists: false } }
        ];
      } else {
        filter.department = { $in: aliases };
      }
    }

    if (req.user && req.user.role === 'student') {
      filter.status = 'published';
    } else if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
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
    if (req.user && req.user.role === 'student') {
      if (topic.status !== 'published') {
        return res.status(403).json({ success: false, message: 'Access denied to unpublished topic' });
      }
    }
    res.json({ success: true, topic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTopic = async (req, res) => {
  try {
    const { module: moduleName = 'Aptitude', category, categoryId, company, companyId, department, departmentId, title, description, order, status } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Topic title is required' });
    }

    let finalCategory = category ? category.trim() : '';
    let finalDepartment = department ? department.trim() : null;
    let finalCompany = company ? company.trim() : '';

    if (categoryId) {
      const parentCat = await Category.findById(categoryId);
      if (parentCat) {
        if (!finalCategory) finalCategory = parentCat.title;
        if (!finalDepartment) finalDepartment = parentCat.department;
      }
    }

    if (companyId) {
      const parentComp = await Company.findById(companyId);
      if (parentComp) {
        if (!finalCompany) finalCompany = parentComp.name;
      }
    }

    if (!finalCategory && !finalCompany) {
      return res.status(400).json({ success: false, message: 'Category or Company is required' });
    }

    const topic = await Topic.create({
      module: moduleName === 'Domain Knowledge' ? 'Domain' : moduleName,
      category: finalCategory || 'Company Preparation',
      categoryId: categoryId || null,
      companyId: companyId || null,
      company: finalCompany,
      department: finalDepartment,
      departmentId: departmentId || finalDepartment,
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
    const { title, description, order, status, category, categoryId, company, companyId, department, departmentId, module: moduleName } = req.body;
    const updateData = { updatedAt: Date.now() };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (order !== undefined) updateData.order = Number(order);
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category.trim();
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (company !== undefined) updateData.company = company.trim();
    if (companyId !== undefined) updateData.companyId = companyId;
    if (department !== undefined) updateData.department = department ? department.trim() : null;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
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
    const { module: moduleName, category, categoryId, company, companyId, submoduleId, topicId, department, topic, difficulty, resourceType, status } = req.query;
    const filter = {};

    if (moduleName) {
      if (moduleName === 'Domain' || moduleName === 'Domain Knowledge') {
        filter.module = { $in: ['Domain', 'Domain Knowledge'] };
      } else {
        filter.module = moduleName;
      }
    }

    if (companyId) filter.companyId = companyId;
    else if (company && company !== 'All') filter.company = company;

    if (categoryId) filter.categoryId = categoryId;
    else if (category && category !== 'All') filter.category = category;

    const andConditions = [];

    if (submoduleId) filter.submoduleId = submoduleId;
    if (topicId) {
      andConditions.push({ $or: [{ topicId }, { submoduleId: topicId }] });
    }

    if (req.user && req.user.role === 'student') {
      filter.status = 'published';
      if (department && department !== 'All') {
        const aliases = getDepartmentAliases(department);
        andConditions.push({
          $or: [
            { department: { $in: aliases } },
            { departments: { $in: [...aliases, 'All'] } }
          ]
        });
      }
    } else {
      if (department && department !== 'All') {
        const aliases = getDepartmentAliases(department);
        andConditions.push({
          $or: [
            { department: { $in: aliases } },
            { departments: { $in: [...aliases, 'All'] } }
          ]
        });
      }
      if (status && status !== 'All') {
        filter.status = status;
      }
    }

    if (andConditions.length === 1) {
      Object.assign(filter, andConditions[0]);
    } else if (andConditions.length > 1) {
      filter.$and = andConditions;
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

    const contents = await LearningContent.find(filter).sort({ order: 1, createdAt: 1 });
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

    // Attach topic, category, company, and department if topicId is provided
    if (data.topicId) {
      const parentTopic = await Topic.findById(data.topicId);
      if (parentTopic) {
        if (!data.topic) data.topic = parentTopic.title;
        if (!data.category) data.category = parentTopic.category;
        if (!data.categoryId) data.categoryId = parentTopic.categoryId;
        if (!data.company && parentTopic.company) data.company = parentTopic.company;
        if (!data.companyId && parentTopic.companyId) data.companyId = parentTopic.companyId;
        if (!data.department && parentTopic.department) data.department = parentTopic.department;
        if (!data.departmentId && parentTopic.departmentId) data.departmentId = parentTopic.departmentId;
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

    if (data.topicId) {
      const parentTopic = await Topic.findById(data.topicId);
      if (parentTopic) {
        if (!data.topic) data.topic = parentTopic.title;
        if (!data.category) data.category = parentTopic.category;
        if (!data.categoryId) data.categoryId = parentTopic.categoryId;
        if (!data.company && parentTopic.company) data.company = parentTopic.company;
        if (!data.companyId && parentTopic.companyId) data.companyId = parentTopic.companyId;
        if (!data.department && parentTopic.department) data.department = parentTopic.department;
        if (!data.departmentId && parentTopic.departmentId) data.departmentId = parentTopic.departmentId;
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

// ==========================================
// PLAYLISTS CRUD (Direct YouTube Playlist Management)
// ==========================================
exports.getPlaylists = async (req, res) => {
  try {
    const { categoryId, category, department, status, search } = req.query;
    const filter = {};

    if (categoryId) {
      filter.categoryId = categoryId;
    } else if (category) {
      filter.category = category;
    }

    if (department && department !== 'All') {
      const aliases = getDepartmentAliases(department);
      filter.department = { $in: aliases };
    }

    if (req.user && req.user.role === 'student') {
      filter.status = 'published';
    } else if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const playlists = await Playlist.find(filter).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, count: playlists.length, playlists });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }
    if (req.user && req.user.role === 'student' && playlist.status !== 'published') {
      return res.status(403).json({ success: false, message: 'Access denied to unpublished playlist' });
    }
    res.json({ success: true, playlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPlaylist = async (req, res) => {
  try {
    const {
      title,
      description,
      playlistUrl,
      thumbnailUrl,
      categoryId,
      category: categoryName,
      department: deptName,
      departmentId,
      order,
      status,
      videoCount,
      channelTitle,
      videos
    } = req.body;

    if (!playlistUrl || !playlistUrl.trim()) {
      return res.status(400).json({ success: false, message: 'YouTube playlist URL is required.' });
    }

    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Category ID is required.' });
    }

    const categoryDoc = await Category.findById(categoryId);
    if (!categoryDoc) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const extractedPlaylistId = extractPlaylistId(playlistUrl);
    let extractedVideoId = null;
    if (!extractedPlaylistId) {
      const ytMatch = playlistUrl.trim().match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/|.+\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch && ytMatch[1]) {
        extractedVideoId = ytMatch[1];
      }
    }

    if (!extractedPlaylistId && !extractedVideoId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL. Please provide a valid YouTube video (watch?v=...) or playlist (list=...) URL.'
      });
    }

    const effectivePlaylistId = extractedPlaylistId || extractedVideoId;

    // Try fetching YouTube metadata (title, thumbnail, lecture list) if not already fully supplied
    let meta = null;
    try {
      meta = await extractUrlMetadata(playlistUrl);
    } catch (e) {
      // Graceful fallback
    }

    const finalTitle = (title && title.trim()) || (meta && meta.title) || (extractedVideoId ? 'YouTube Video' : 'YouTube Playlist');
    const finalThumbnail = thumbnailUrl || (meta && meta.thumbnailUrl) || (extractedVideoId ? `https://img.youtube.com/vi/${extractedVideoId}/hqdefault.jpg` : '');
    const finalDescription = (description !== undefined ? description : (meta && meta.description)) || '';
    const finalChannel = channelTitle || (meta && meta.channelTitle) || '';
    let finalVideos = (videos && Array.isArray(videos) && videos.length > 0 ? videos : (meta && meta.videos)) || [];
    if (finalVideos.length === 0 && extractedVideoId) {
      finalVideos = [{
        videoId: extractedVideoId,
        title: finalTitle,
        thumbnailUrl: finalThumbnail,
        watchUrl: `https://www.youtube.com/watch?v=${extractedVideoId}`
      }];
    }

    const finalVideoCount = videoCount !== undefined && Number(videoCount) > 0
      ? Number(videoCount)
      : (meta && meta.videoCount ? meta.videoCount : (finalVideos.length > 0 ? finalVideos.length : 1));

    const playlist = await Playlist.create({
      title: finalTitle,
      description: finalDescription,
      playlistUrl: playlistUrl.trim(),
      playlistId: effectivePlaylistId,
      thumbnailUrl: finalThumbnail,
      videoCount: finalVideoCount,
      channelTitle: finalChannel,
      videos: finalVideos,
      categoryId: categoryDoc._id,
      category: categoryDoc.title,
      department: categoryDoc.department || deptName || null,
      departmentId: categoryDoc.departmentId || departmentId || null,
      order: order !== undefined ? Number(order) : 0,
      status: status || 'published',
      createdBy: req.user?._id
    });

    res.status(201).json({ success: true, playlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePlaylist = async (req, res) => {
  try {
    const {
      title,
      description,
      playlistUrl,
      thumbnailUrl,
      order,
      status,
      videoCount,
      channelTitle,
      videos
    } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    const updateData = { updatedAt: Date.now() };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (order !== undefined) updateData.order = Number(order);
    if (status !== undefined) updateData.status = status;
    if (videoCount !== undefined) updateData.videoCount = Number(videoCount);
    if (channelTitle !== undefined) updateData.channelTitle = channelTitle;
    if (videos !== undefined && Array.isArray(videos)) updateData.videos = videos;

    if (playlistUrl && playlistUrl.trim() !== playlist.playlistUrl) {
      const extractedPlaylistId = extractPlaylistId(playlistUrl);
      let extractedVideoId = null;
      if (!extractedPlaylistId) {
        const ytMatch = playlistUrl.trim().match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/|.+\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch && ytMatch[1]) {
          extractedVideoId = ytMatch[1];
        }
      }

      if (!extractedPlaylistId && !extractedVideoId) {
        return res.status(400).json({ success: false, message: 'Invalid YouTube video or playlist URL.' });
      }

      updateData.playlistUrl = playlistUrl.trim();
      updateData.playlistId = extractedPlaylistId || extractedVideoId;

      try {
        const meta = await extractUrlMetadata(playlistUrl);
        if (meta) {
          if (!title) updateData.title = meta.title;
          if (!thumbnailUrl && meta.thumbnailUrl) updateData.thumbnailUrl = meta.thumbnailUrl;
          if (meta.videos) updateData.videos = meta.videos;
          if (meta.videoCount) updateData.videoCount = meta.videoCount;
          if (meta.channelTitle) updateData.channelTitle = meta.channelTitle;
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    const updated = await Playlist.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    res.json({ success: true, playlist: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }
    res.json({ success: true, message: 'Playlist deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// DEPARTMENT OVERVIEW STATS (Dynamic across all 9 departments)
// ==========================================
exports.getDepartmentOverviewStats = async (req, res) => {
  try {
    const stats = {};
    const isStudent = req.user && req.user.role === 'student';

    // 1. Fetch domain categories
    const catFilter = { module: { $in: ['Domain', 'Domain Knowledge'] } };
    if (isStudent) catFilter.status = 'published';
    const allCategories = await Category.find(catFilter).lean();

    // 2. Fetch domain topics
    const topicFilter = { module: { $in: ['Domain', 'Domain Knowledge'] } };
    if (isStudent) topicFilter.status = 'published';
    const allTopics = await Topic.find(topicFilter).lean();

    // 3. Fetch playlists
    const playlistFilter = {};
    if (isStudent) playlistFilter.status = 'published';
    const allPlaylists = await Playlist.find(playlistFilter).lean();

    // 4. Fetch learning content
    const contentFilter = { module: { $in: ['Domain', 'Domain Knowledge'] } };
    if (isStudent) contentFilter.status = 'published';
    const allContent = await LearningContent.find(contentFilter).lean();

    for (const dept of OFFICIAL_DEPARTMENTS) {
      const aliases = getDepartmentAliases(dept);
      const aliasSet = new Set(aliases.map(a => a.toUpperCase()));

      // Categories for this department
      const deptCats = allCategories.filter(c => c.department && aliasSet.has(c.department.toUpperCase()));
      const catIdSet = new Set(deptCats.map(c => c._id.toString()));

      // Topics: match by department alias OR categoryId
      const deptTopics = allTopics.filter(t => {
        if (t.department && aliasSet.has(t.department.toUpperCase())) return true;
        if (t.categoryId && catIdSet.has(t.categoryId.toString())) return true;
        return false;
      });

      // Playlists: match by department alias OR categoryId
      const deptPlaylists = allPlaylists.filter(p => {
        if (p.department && aliasSet.has(p.department.toUpperCase())) return true;
        if (p.categoryId && catIdSet.has(p.categoryId.toString())) return true;
        return false;
      });

      // LearningContent (videos & notes)
      const topicIdSet = new Set(deptTopics.map(t => t._id.toString()));
      const deptContent = allContent.filter(c => {
        if (c.department && aliasSet.has(c.department.toUpperCase())) return true;
        if (c.categoryId && catIdSet.has(c.categoryId.toString())) return true;
        if (c.topicId && topicIdSet.has(c.topicId.toString())) return true;
        return false;
      });

      const videoContentCount = deptContent.filter(c => c.resourceType !== 'note').length;
      const playlistVideoCount = deptPlaylists.reduce((acc, p) => acc + (p.videoCount || (p.videos ? p.videos.length : 0)), 0);
      const totalVideos = videoContentCount + playlistVideoCount;
      const notesCount = deptContent.filter(c => c.resourceType === 'note').length;

      const deptStat = {
        categoryCount: deptCats.length,
        topicCount: deptTopics.length,
        publishedTopicCount: deptTopics.filter(t => t.status === 'published').length,
        playlistCount: deptPlaylists.length,
        publishedPlaylistCount: deptPlaylists.filter(p => p.status === 'published').length,
        videoCount: totalVideos,
        notesCount
      };

      stats[dept] = deptStat;
      stats[dept.toUpperCase()] = deptStat;
      stats[canonicalizeDepartment(dept)] = deptStat;
    }

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};




