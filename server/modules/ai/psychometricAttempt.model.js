const mongoose = require('mongoose');

const responseItemSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionText: { type: String, default: '' },
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 5 },
  questionType: {
    type: String,
    enum: [
      'LIKERT',
      'FREQUENCY',
      'SITUATIONAL_JUDGMENT',
      'FORCED_CHOICE',
      'RANKING',
      'SELF_ASSESSMENT',
      'SCENARIO_BASED'
    ],
    default: 'LIKERT'
  },
  competency: { type: String, default: 'General' },
  trait: { type: String, default: '' },
  reverseScored: { type: Boolean, default: false }
}, { _id: false });

const competencyScoreSchema = new mongoose.Schema({
  score: { type: Number, default: 70, min: 0, max: 100 },
  rawScore: { type: Number, default: 0 },
  maxRawScore: { type: Number, default: 0 },
  level: {
    type: String,
    enum: ['Emerging', 'Developing', 'Strong', 'Excellent'],
    default: 'Developing'
  },
  explanation: { type: String, default: '' }
}, { _id: false });

const psychometricAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: { type: String, default: '' },
  department: { type: String, default: '' },
  batch: { type: String, default: '' },
  erpNumber: { type: String, default: '' },

  psychometricTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PsychometricTest'
  },
  testTitle: { type: String, default: 'AI Talent & Psychometric Assessment' },
  assessmentVersion: { type: Number, default: 1 },

  responses: [responseItemSchema],

  traitScores: {
    communication: { type: competencyScoreSchema, default: () => ({ score: 75, level: 'Strong', explanation: 'Demonstrates clear and structured articulation.' }) },
    teamwork: { type: competencyScoreSchema, default: () => ({ score: 80, level: 'Strong', explanation: 'Fosters positive synergy and cross-functional alignment.' }) },
    leadership: { type: competencyScoreSchema, default: () => ({ score: 72, level: 'Developing', explanation: 'Shows strong initiative with developing team guidance abilities.' }) },
    adaptability: { type: competencyScoreSchema, default: () => ({ score: 85, level: 'Excellent', explanation: 'Pivots effectively in rapidly evolving situations.' }) },
    emotionalIntelligence: { type: competencyScoreSchema, default: () => ({ score: 78, level: 'Strong', explanation: 'Regulates personal responses with empathetic awareness.' }) },
    problemSolving: { type: competencyScoreSchema, default: () => ({ score: 82, level: 'Excellent', explanation: 'Decomposes complex problems with logical rigor.' }) },
    initiative: { type: competencyScoreSchema, default: () => ({ score: 76, level: 'Strong', explanation: 'Proactively identifies opportunities for action.' }) },
    timeManagement: { type: competencyScoreSchema, default: () => ({ score: 74, level: 'Strong', explanation: 'Maintains consistent progress against key deadlines.' }) },
    resilience: { type: competencyScoreSchema, default: () => ({ score: 80, level: 'Strong', explanation: 'Maintains focus and composure under high pressure.' }) },
    professionalism: { type: competencyScoreSchema, default: () => ({ score: 84, level: 'Excellent', explanation: 'Exhibits strong workplace ethics and reliable execution.' }) }
  },

  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 75
  },
  overallReadiness: {
    type: String,
    enum: ['Emerging', 'Developing', 'Strong', 'Exceptional'],
    default: 'Strong'
  },

  strengths: [{
    competency: { type: String, required: true },
    score: { type: Number, default: 0 },
    explanation: { type: String, default: '' },
    workplaceRelevance: { type: String, default: '' }
  }],

  developmentAreas: [{
    area: { type: String, required: true },
    currentScore: { type: Number, default: 0 },
    whyItMatters: { type: String, default: '' },
    improvementSuggestion: { type: String, default: '' }
  }],

  recommendations: [{
    title: { type: String, required: true },
    description: { type: String, default: '' },
    moduleLink: { type: String, default: '/student/training' }
  }],

  aiAnalysis: {
    aiSummary: { type: String, default: '' },
    provider: { type: String, default: 'gemini' },
    generatedAt: { type: Date, default: Date.now }
  },

  suggestedWorkEnvironment: [{
    type: String
  }],

  timeSpentSeconds: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date, default: Date.now },
  completed: { type: Boolean, default: true }
}, {
  timestamps: true
});

const PsychometricAttempt = mongoose.model('PsychometricAttempt', psychometricAttemptSchema);

module.exports = PsychometricAttempt;
