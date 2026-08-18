const mongoose = require('mongoose');

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

module.exports = PsychometricProfile;
