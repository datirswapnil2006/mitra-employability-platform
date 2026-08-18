const mongoose = require('mongoose');

const psychometricQuestionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  dimension: {
    type: String,
    enum: [
      'openness',
      'conscientiousness',
      'extraversion',
      'agreeableness',
      'emotionalStability',
      'leadership',
      'teamwork',
      'problemSolving',
      'adaptability',
      'communication'
    ],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  prompt: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    default: 'All'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PsychometricQuestion', psychometricQuestionSchema);
