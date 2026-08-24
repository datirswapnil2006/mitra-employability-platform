const mongoose = require('mongoose');

const supportFeedbackSchema = new mongoose.Schema({
  feedbackId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  erpNumber: {
    type: String,
    default: '',
    trim: true,
    index: true
  },
  department: {
    type: String,
    default: 'CSE',
    index: true
  },
  batch: {
    type: String,
    default: '2026',
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Suggestion / Improvement',
      'Technical Problem',
      'Feature Request',
      'Test/Assessment Issue',
      'Other'
    ],
    default: 'Suggestion / Improvement',
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  attachment: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['New', 'In Review', 'Resolved'],
    default: 'New',
    index: true
  },
  adminResponse: {
    type: String,
    default: '',
    trim: true
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Create counter or unique ID generator helper
supportFeedbackSchema.statics.generateNextFeedbackId = async function() {
  const count = await this.countDocuments();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sequence = String(count + 1).padStart(4, '0');
  const candidateId = `FB-${dateStr}-${sequence}`;
  
  // Verify uniqueness in case of concurrent creations
  const exists = await this.findOne({ feedbackId: candidateId });
  if (!exists) return candidateId;

  // Fallback with random hex
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `FB-${dateStr}-${randomSuffix}`;
};

module.exports = mongoose.model('SupportFeedback', supportFeedbackSchema);
