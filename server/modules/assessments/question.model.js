const mongoose = require('mongoose');
const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');

const questionSchema = new mongoose.Schema({
  module: {
    type: String,
    enum: ['Aptitude', 'Technical', 'Domain', 'General'],
    required: true,
    default: 'Aptitude'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    enum: [...OFFICIAL_DEPARTMENTS, null],
    default: null
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  codeSnippet: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['mcq', 'conceptual', 'output', 'sql', 'coding'],
    default: 'mcq'
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: String,
    required: true,
    trim: true
  },
  explanation: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Beginner', 'Intermediate', 'Advanced'],
    default: 'Medium'
  },
  marks: {
    type: Number,
    default: 1
  },
  tags: [{
    type: String
  }],
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiProvider: {
    type: String,
    enum: ['manual', 'gemini', 'groq', 'huggingface', 'fallback'],
    default: 'manual'
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'draft'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
