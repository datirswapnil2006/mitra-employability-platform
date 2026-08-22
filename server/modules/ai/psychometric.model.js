const mongoose = require('mongoose');

const psychometricQuestionItemSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
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
  competency: {
    type: String,
    enum: [
      'Communication',
      'Teamwork',
      'Leadership',
      'Adaptability',
      'Emotional Intelligence',
      'Problem Solving',
      'Initiative',
      'Time Management',
      'Resilience',
      'Professionalism'
    ],
    required: true
  },
  trait: { type: String, default: '' },
  scenario: { type: String, default: '' },
  options: [{
    text: { type: String, required: true },
    value: { type: String, default: '' },
    score: { type: Number, default: 0 },
    statementA: { type: String, default: '' },
    statementB: { type: String, default: '' }
  }],
  reverseScored: { type: Boolean, default: false },
  weight: { type: Number, default: 1 },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' }
}, { _id: false });

const psychometricTestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: [
      'Personality Traits',
      'Cognitive Ability',
      'Emotional Intelligence',
      'Aptitude Profiling',
      'Behavioral Assessment',
      'Employability Skills'
    ],
    default: 'Behavioral Assessment'
  },
  durationMinutes: { type: Number, default: 20 },
  questionCount: { type: Number, min: 1, max: 50, default: 50 },
  questionsCount: { type: Number, min: 1, max: 50, default: 50 },
  competencies: [{
    type: String,
    default: [
      'Communication',
      'Teamwork',
      'Leadership',
      'Adaptability',
      'Emotional Intelligence',
      'Problem Solving',
      'Initiative',
      'Time Management',
      'Resilience',
      'Professionalism'
    ]
  }],
  questions: [psychometricQuestionItemSchema],
  status: {
    type: String,
    enum: ['published', 'draft', 'archived'],
    default: 'published'
  },
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
  isAIGenerated: { type: Boolean, default: true },
  attemptsCount: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const psychometricProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employabilityIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  personalityTraits: {
    openness: { type: Number, default: 75 },
    conscientiousness: { type: Number, default: 80 },
    extraversion: { type: Number, default: 70 },
    agreeableness: { type: Number, default: 85 },
    emotionalStability: { type: Number, default: 78 }
  },
  behavioralFit: {
    leadership: { type: Number, default: 72 },
    teamwork: { type: Number, default: 88 },
    problemSolving: { type: Number, default: 82 },
    adaptability: { type: Number, default: 85 },
    communication: { type: Number, default: 79 }
  },
  strengths: [{
    type: String
  }],
  growthAreas: [{
    type: String
  }],
  careerFit: [{
    type: String
  }],
  actionPlan: [{
    type: String
  }],
  aiSummary: {
    type: String,
    default: ''
  },
  aiProvider: {
    type: String,
    enum: ['gemini', 'groq', 'huggingface', 'fallback'],
    default: 'gemini'
  },
  responses: [{
    questionId: String,
    questionText: String,
    dimension: String,
    rating: Number
  }],
  evaluatedAt: {
    type: Date,
    default: Date.now
  }
});

const PsychometricProfile = mongoose.model('PsychometricProfile', psychometricProfileSchema);
const PsychometricTest = mongoose.model('PsychometricTest', psychometricTestSchema);

// Backward compatible export (can be used as `const PsychometricProfile = require(...)` or `const { PsychometricTest, PsychometricProfile } = require(...)`)
module.exports = PsychometricProfile;
module.exports.PsychometricProfile = PsychometricProfile;
module.exports.PsychometricTest = PsychometricTest;
