const mongoose = require('mongoose');
const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  codeSnippet: { type: String, default: '' },
  type: {
    type: String,
    enum: ['mcq', 'conceptual', 'output', 'sql', 'coding'],
    default: 'mcq'
  },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, default: '' },
  marks: { type: Number, default: 1 },
  difficulty: { type: String, default: 'Medium' },
  // SQL evaluation context
  schemaSql: { type: String, default: '' },
  referenceQuery: { type: String, default: '' },
  // Coding evaluation template
  codeTemplate: { type: String, default: '' }
});

const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  module: {
    type: String,
    enum: ['Aptitude', 'Domain Knowledge', 'Domain', 'Communication', 'Resume', 'Interview', 'Interview Preparation', 'Full Assessment', 'Full', 'Technical', 'General'],
    default: 'Aptitude'
  },
  category: { type: String, default: 'General' },
  department: {
    type: String,
    enum: [...OFFICIAL_DEPARTMENTS, null],
    default: null
  },
  topic: { type: String, default: '' },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Beginner', 'Intermediate', 'Advanced', 'Mixed', 'mixed'],
    default: 'Medium'
  },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingModule' },
  submoduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submodule' },
  questions: [questionSchema],
  passingScorePercentage: { type: Number, default: 70 },
  timeLimitMinutes: { type: Number, default: 20 },
  totalMarks: { type: Number, default: 100 },
  isAIGenerated: { type: Boolean, default: false },
  aiProvider: {
    type: String,
    enum: ['manual', 'gemini', 'groq', 'huggingface', 'fallback', 'pdf_extraction'],
    default: 'manual'
  },
  creationMethod: {
    type: String,
    enum: ['AI_GENERATED', 'PDF_EXTRACTION', 'MANUAL', 'ai_generated', 'pdf_extraction', 'manual'],
    default: 'AI_GENERATED'
  },
  assessmentMode: {
    type: String,
    enum: ['NORMAL', 'PROCTORED', 'Normal', 'Proctored'],
    default: 'NORMAL'
  },
  proctoringSettings: {
    camera: { type: Boolean, default: true },
    screenShare: { type: Boolean, default: true },
    fullScreen: { type: Boolean, default: true },
    tabSwitch: { type: Boolean, default: true },
    copyPaste: { type: Boolean, default: true },
    secondPerson: { type: Boolean, default: true },
    mobileDetection: { type: Boolean, default: true }
  },
  status: { type: String, enum: ['published', 'draft', 'archived'], default: 'published' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const assessmentAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingModule' },
  submoduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submodule' },
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  status: { type: String, enum: ['PASSED', 'FAILED'], required: true },
  attemptNumber: { type: Number, default: 1 },
  timeSpentSeconds: { type: Number, default: 0 },
  answers: [{
    questionId: { type: String },
    questionText: { type: String },
    type: { type: String, default: 'mcq' },
    studentAnswer: { type: String, default: '' },
    correctAnswer: { type: String, default: '' },
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
    explanation: { type: String, default: '' }
  }],
  categoryBreakdown: {
    mcq: { type: String, default: '0/0' },
    sql: { type: String, default: '0/0' },
    conceptual: { type: String, default: '0/0' },
    output: { type: String, default: '0/0' },
    coding: { type: String, default: '0/0' }
  },
  violationsCount: { type: Number, default: 0 },
  isAbandoned: { type: Boolean, default: false },
  proctoringLogs: [{
    type: { type: String },
    timestamp: { type: Date, default: Date.now },
    details: { type: String, default: '' }
  }],
  attemptedAt: { type: Date, default: Date.now }
});

const Assessment = mongoose.model('Assessment', assessmentSchema);
const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);

module.exports = { Assessment, AssessmentAttempt };
