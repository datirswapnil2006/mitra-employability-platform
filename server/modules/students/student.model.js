const mongoose = require('mongoose');
const { OFFICIAL_DEPARTMENTS, STUDENT_YEARS, GENDERS } = require('../../config/constants');

const studentProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  erpNumber: { type: String, default: '' },
  rollNo: { type: String, default: '' },
  gender: { type: String, enum: GENDERS, default: 'Male' },
  section: { type: String, default: 'A' },
  department: {
    type: String,
    enum: OFFICIAL_DEPARTMENTS,
    default: 'CSE'
  },
  year: { type: String, enum: STUDENT_YEARS, default: 'Third Year' },
  batch: { type: String, default: '2026' },
  phone: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  hometown: { type: String, default: '' },
  aadhaarNumber: { type: String, default: '' },
  educationGap: { type: String, default: 'No' },
  hasBacklogs: { type: String, default: 'No' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  resumeUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  targetRole: { type: String, default: 'Software Engineer' },
  tenthPercentage: { type: Number, default: null },
  twelfthPercentage: { type: Number, default: null },
  diplomaPercentage: { type: Number, default: null },
  cgpa: { type: Number, default: null },
  profileCompletionPercentage: { type: Number, default: 0 },
  passwordResetStatus: {
    type: String,
    enum: ['NO_REQUEST', 'PENDING', 'ENABLED', 'COMPLETED'],
    default: 'NO_REQUEST'
  },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  passwordResetRequestedAt: { type: Date, default: null },
  passwordResetApprovedAt: { type: Date, default: null },
  passwordResetCompletedAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now }
});

// Calculate profile completion percentage based on mandatory required profile fields
studentProfileSchema.methods.calculateCompletion = function (requiredFields = ['erpNumber', 'department', 'year', 'phone', 'hometown', 'aadhaarNumber', 'educationGap', 'hasBacklogs', 'resumeUrl']) {
  let filledCount = 0;
  const erp = this.erpNumber || this.rollNo;
  const activeRequiredFields = requiredFields.filter(f => f !== 'skills' && f !== 'targetRole' && f !== 'githubUrl');
  
  if (erp && erp.trim()) filledCount++;
  if (this.department && this.department.trim()) filledCount++;
  if (this.year && this.year.trim()) filledCount++;
  if (this.phone && this.phone.trim()) filledCount++;
  if (this.hometown && this.hometown.trim()) filledCount++;
  if (this.aadhaarNumber && this.aadhaarNumber.trim()) filledCount++;
  if (this.educationGap && this.educationGap.trim()) filledCount++;
  if (this.hasBacklogs && this.hasBacklogs.trim()) filledCount++;
  if (this.resumeUrl && this.resumeUrl.trim()) filledCount++;

  const total = activeRequiredFields.length || 1;
  this.profileCompletionPercentage = Math.min(100, Math.round((filledCount / total) * 100));
  return this.profileCompletionPercentage;
};

// Global Profile Configuration Schema (for admin-configured required fields)
const profileConfigSchema = new mongoose.Schema({
  requiredFields: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
const ProfileConfig = mongoose.model('ProfileConfig', profileConfigSchema);

module.exports = { StudentProfile, ProfileConfig };
