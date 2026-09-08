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

// Calculate profile completion percentage based on weighted sections:
// 1. Profile Photo: 15%
// 2. Section 1 (Academic & Institutional Identity): 25% (Name 3, Email 3, ERP 7, Department 3, Gender 3, Year 2, Section 2, Batch 2)
// 3. Section 2 (Academic Qualifications & Performance): 25% (10th 8, 12th/Diploma 8, CGPA 9)
// 4. Section 3 (Contact Details & Identity): 20% (Phone 7, Aadhaar 7, Hometown 6)
// 5. Section 4 (Career & Portfolio Profiles): 15% (Resume 10, LinkedIn/GitHub 5)
// Total: 100%
studentProfileSchema.methods.calculateCompletion = function (userObj = null) {
  let score = 0;
  
  // --- Profile Photo (15%) ---
  const photo = (this.profilePhoto || userObj?.profilePhoto || '').trim();
  const isInvalidPhoto = !photo || photo === 'null' || photo === 'undefined' || photo.includes('placeholder') || photo.includes('default-avatar');
  if (photo && !isInvalidPhoto) {
    score += 15;
  }

  // --- Section 1: Academic & Institutional Identity (25%) ---
  const userName = (userObj?.name || (this.user && typeof this.user === 'object' ? this.user.name : '') || '').trim();
  if (userName) score += 3;

  const email = (userObj?.email || (this.user && typeof this.user === 'object' ? this.user.email : '') || '').trim();
  if (email) score += 3;

  const erp = (this.erpNumber || this.rollNo || '').trim();
  if (erp) score += 7;

  const dept = (this.department || userObj?.department || '').trim();
  if (dept) score += 3;

  const gender = (this.gender || '').trim();
  if (gender) score += 3;

  const year = (this.year || '').trim();
  if (year) score += 2;

  const section = (this.section || '').trim();
  if (section) score += 2;

  const batch = (this.batch || '').trim();
  if (batch) score += 2;

  // --- Section 2: Academic Qualifications & Performance (25%) ---
  const tenth = this.tenthPercentage;
  if (tenth !== null && tenth !== undefined && !isNaN(tenth) && Number(tenth) > 0) {
    score += 8;
  }

  const twelfth = this.twelfthPercentage;
  const diploma = this.diplomaPercentage;
  const hasTwelfth = twelfth !== null && twelfth !== undefined && !isNaN(twelfth) && Number(twelfth) > 0;
  const hasDiploma = diploma !== null && diploma !== undefined && !isNaN(diploma) && Number(diploma) > 0;
  if (hasTwelfth || hasDiploma) {
    score += 8;
  }

  const cgpa = this.cgpa;
  if (cgpa !== null && cgpa !== undefined && !isNaN(cgpa) && Number(cgpa) > 0) {
    score += 9;
  }

  // --- Section 3: Contact Details & Identity (20%) ---
  const phone = (this.phone || '').trim();
  if (phone) score += 7;

  const aadhaar = (this.aadhaarNumber || '').trim();
  if (aadhaar) score += 7;

  const hometown = (this.hometown || '').trim();
  if (hometown) score += 6;

  // --- Section 4: Career & Portfolio Profiles (15%) ---
  const resume = (this.resumeUrl || '').trim();
  if (resume) score += 15;

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
