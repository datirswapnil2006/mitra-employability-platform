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

// Calculate profile completion percentage based on weighted core profile fields
// Weights: name (10), erpNumber (15), department (10), gender (10), academicYear (10), section (10), graduationBatch (10), email (10), profilePhoto (15) = 100%
studentProfileSchema.methods.calculateCompletion = function (userObj = null) {
  let score = 0;
  
  // 1. Name: 10%
  const userName = (userObj?.name || (this.user && typeof this.user === 'object' ? this.user.name : '') || '').trim();
  if (userName) score += 10;
  
  // 2. ERP / Roll Number: 15%
  const erp = (this.erpNumber || this.rollNo || '').trim();
  if (erp) score += 15;
  
  // 3. Department: 10%
  const dept = (this.department || userObj?.department || '').trim();
  if (dept) score += 10;
  
  // 4. Gender: 10%
  const gender = (this.gender || '').trim();
  if (gender) score += 10;
  
  // 5. Academic Year: 10%
  const year = (this.year || '').trim();
  if (year) score += 10;
  
  // 6. Section: 10%
  const section = (this.section || '').trim();
  if (section) score += 10;
  
  // 7. Graduation Batch: 10%
  const batch = (this.batch || '').trim();
  if (batch) score += 10;
  
  // 8. Email: 10%
  const email = (userObj?.email || (this.user && typeof this.user === 'object' ? this.user.email : '') || '').trim();
  if (email) score += 10;
  
  // 9. Profile Photo: 15% (must be a valid non-empty photo URL/path, excluding placeholders)
  const photo = (this.profilePhoto || userObj?.profilePhoto || '').trim();
  const isInvalidPhoto = !photo || photo === 'null' || photo === 'undefined' || photo.includes('placeholder') || photo.includes('default-avatar');
  if (photo && !isInvalidPhoto) {
    score += 15;
  }

  this.profileCompletionPercentage = Math.min(100, Math.max(0, score));
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
