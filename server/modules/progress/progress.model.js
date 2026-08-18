const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submoduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submodule', required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingModule', required: true },
  completedContents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LearningContent' }],
  submoduleProgressPercentage: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date }
});

studentProgressSchema.index({ user: 1, submoduleId: 1 }, { unique: true });

module.exports = mongoose.model('StudentProgress', studentProgressSchema);
