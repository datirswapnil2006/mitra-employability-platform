const mongoose = require('mongoose');
const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');

const trainingModuleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  module: {
    type: String,
    enum: ['Aptitude', 'Domain Knowledge', 'Communication', 'Resume', 'Interview Preparation', 'SQL', 'Technical Coding'],
    default: 'Aptitude'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    enum: [...OFFICIAL_DEPARTMENTS, 'All', null],
    default: null
  },
  description: { type: String, default: '' },
  icon: { type: String, default: 'BookOpen' },
  departments: [{
    type: String,
    enum: [...OFFICIAL_DEPARTMENTS, 'All']
  }],
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['published', 'draft'], default: 'published' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const submoduleSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingModule', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  topic: { type: String, default: '' },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['published', 'draft'], default: 'published' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const learningContentSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingModule' },
  submoduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submodule' },
  module: {
    type: String,
    enum: ['Aptitude', 'Domain Knowledge', 'Communication', 'Resume', 'Interview Preparation', 'General'],
    default: 'Aptitude'
  },
  category: { type: String, default: 'Quantitative' },
  department: {
    type: String,
    enum: [...OFFICIAL_DEPARTMENTS, null],
    default: null
  },
  subject: { type: String, default: '' },
  topic: { type: String, default: '' },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  resourceUrl: { type: String, required: true },
  videoProvider: { type: String, default: 'youtube' },
  provider: { type: String, default: 'youtube' },
  thumbnailUrl: { type: String, default: '' },
  resourceType: { type: String, enum: ['video', 'pdf', 'link', 'code'], default: 'video' },
  contentType: { type: String, default: 'video' },
  departments: [{ type: String }],
  technology: { type: String, default: 'Aptitude' },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  required: { type: Boolean, default: true },
  status: { type: String, enum: ['published', 'draft'], default: 'published' },
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TrainingModule = mongoose.model('TrainingModule', trainingModuleSchema);
const Submodule = mongoose.model('Submodule', submoduleSchema);
const LearningContent = mongoose.model('LearningContent', learningContentSchema);

module.exports = { TrainingModule, Submodule, LearningContent };
