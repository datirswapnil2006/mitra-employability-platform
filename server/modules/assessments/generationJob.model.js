const mongoose = require('mongoose');
const { questionSchema } = require('./assessment.models');

const batchRecordSchema = new mongoose.Schema({
  batchIndex: { type: Number, required: true },
  batchKey: { type: String, required: true },
  requestedCount: { type: Number, required: true },
  acceptedCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  error: { type: String, default: '' },
  attempts: { type: Number, default: 0 }
}, { _id: false });

const sectionProgressSchema = new mongoose.Schema({
  sectionId: { type: String, required: true },
  name: { type: String, required: true },
  topic: { type: String, default: '' },
  type: {
    type: String,
    enum: ['mcq', 'sql', 'coding', 'psychometric', 'output', 'conceptual'],
    default: 'mcq'
  },
  targetCount: { type: Number, required: true },
  acceptedCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  batches: [batchRecordSchema]
}, { _id: false });

const assessmentGenerationJobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true, index: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', index: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'partial', 'failed', 'paused'],
    default: 'pending',
    index: true
  },
  config: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    module: { type: String, default: 'Aptitude' },
    category: { type: String, default: 'General' },
    department: { type: String, default: null },
    topic: { type: String, default: '' },
    prompt: { type: String, default: '' },
    customPrompt: { type: String, default: '' },
    questionCount: { type: Number, default: 5 },
    difficulty: { type: String, default: 'Medium' },
    timeLimitMinutes: { type: Number, default: 20 },
    passingScorePercentage: { type: Number, default: 70 },
    scoringRules: {
      marksPerQuestion: { type: Number, default: 1 },
      negativeMarking: { type: Number, default: 0 },
      psychometricScoring: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    sections: [{
      sectionId: { type: String },
      name: { type: String },
      topic: { type: String },
      type: { type: String, default: 'mcq' },
      questionCount: { type: Number, required: true },
      difficulty: { type: String, default: 'Medium' },
      marks: { type: Number, default: 1 },
      department: { type: String, default: null },
      category: { type: String, default: '' },
      customPrompt: { type: String, default: '' },
      competencies: [{ type: String }]
    }],
    batchSize: { type: Number, default: 5 },
    provider: { type: String, default: 'gemini' }
  },
  requestedCount: { type: Number, required: true },
  acceptedCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  sectionsProgress: [sectionProgressSchema],
  acceptedQuestions: [questionSchema],
  errorDetails: [{
    timestamp: { type: Date, default: Date.now },
    section: { type: String, default: '' },
    batchIndex: { type: Number, default: 0 },
    error: { type: String, default: '' },
    code: { type: String, default: '' },
    isTransient: { type: Boolean, default: false }
  }],
  tokenUsage: {
    promptTokens: { type: Number, default: 0 },
    candidateTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCostUsd: { type: Number, default: 0 }
  },
  idempotencyKeys: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const AssessmentGenerationJob = mongoose.model('AssessmentGenerationJob', assessmentGenerationJobSchema);

module.exports = AssessmentGenerationJob;
