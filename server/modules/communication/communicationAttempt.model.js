const mongoose = require('mongoose');

const turnSchema = new mongoose.Schema(
  {
    turnIndex: {
      type: Number,
      required: true
    },
    scenarioRole: {
      type: String,
      default: 'Interviewer'
    },
    question: {
      type: String,
      required: true
    },
    studentResponse: {
      type: String,
      default: ''
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    interimFeedback: {
      type: String,
      default: ''
    }
  },
  { _id: true, timestamps: true }
);

const evaluationSchema = new mongoose.Schema(
  {
    grammar: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    fluency: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    vocabulary: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    relevance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    structure: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    clarity: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    confidenceIndicator: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    strengths: {
      type: [String],
      default: []
    },
    improvements: {
      type: [String],
      default: []
    },
    recommendations: {
      type: [String],
      default: []
    },
    detailedFeedback: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const communicationAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    assessmentType: {
      type: String,
      required: true,
      enum: [
        'HR Interview',
        'Self Introduction',
        'Workplace Communication',
        'Group Discussion',
        'Presentation Practice',
        'Customer/Client Communication'
      ]
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    responseMode: {
      type: String,
      required: true,
      enum: ['Voice Mode', 'Text Mode'],
      default: 'Text Mode'
    },
    scenarioContext: {
      type: String,
      default: ''
    },
    targetTurns: {
      type: Number,
      default: 3
    },
    questionCount: {
      type: Number,
      default: 3
    },
    dialogue: {
      type: [turnSchema],
      default: []
    },
    evaluation: {
      type: evaluationSchema,
      default: () => ({})
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
      index: true
    },
    completedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommunicationAssessmentAttempt', communicationAttemptSchema);
