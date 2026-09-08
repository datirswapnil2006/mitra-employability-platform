/**
 * Centralized Profile Completion Calculator
 * 
 * Standardized Section Weights:
 * - Profile Photo: 15%
 * - Section 1 (Academic & Institutional Identity): 25% (Name 3%, Email 3%, ERP 7%, Department 3%, Gender 3%, Year 2%, Section 2%, Batch 2%)
 * - Section 2 (Academic Qualifications & Performance): 25% (10th 8%, 12th/Diploma 8%, CGPA 9%)
 * - Section 3 (Contact Details & Identity): 20% (Phone 7%, Aadhaar 7%, Hometown 6%)
 * - Section 4 (Career & Portfolio Profiles): 15% (Resume 10%, LinkedIn/GitHub 5%)
 * Total: 100%
 */

export const PROFILE_SECTION_WEIGHTS = {
  photo: 15,
  identity: 25,
  qualifications: 25,
  contact: 20,
  career: 15
};

export const PROFILE_FIELD_WEIGHTS = {
  // Photo (15%)
  profilePhoto: 15,

  // Section 1: Identity (25%)
  name: 3,
  email: 3,
  erpNumber: 7,
  department: 3,
  gender: 3,
  academicYear: 2,
  section: 2,
  graduationBatch: 2,

  // Section 2: Qualifications (25%)
  tenthPercentage: 8,
  twelfthOrDiploma: 8,
  cgpa: 9,

  // Section 3: Contact Details (20%)
  phone: 7,
  aadhaarNumber: 7,
  hometown: 6,

  // Section 4: Career & Portfolio (15%)
  resumeUrl: 10,
  portfolioLinks: 5
};

export const calculateProfileCompletion = (profileData = {}, user = {}) => {
  let score = 0;

  // --- 1. Profile Photo (15%) ---
  const photo = (profileData?.profilePhoto || user?.profilePhoto || '').trim();
  const isPlaceholder =
    !photo ||
    photo === 'null' ||
    photo === 'undefined' ||
    photo.includes('placeholder') ||
    photo.includes('default-avatar');
  if (photo && !isPlaceholder) {
    score += PROFILE_FIELD_WEIGHTS.profilePhoto;
  }

  // --- 2. Section 1: Academic & Institutional Identity (25%) ---
  const name = (user?.name || profileData?.name || '').trim();
  if (name) score += PROFILE_FIELD_WEIGHTS.name;

  const email = (user?.email || profileData?.email || '').trim();
  if (email) score += PROFILE_FIELD_WEIGHTS.email;

  const erp = (profileData?.erpNumber || profileData?.rollNo || user?.erpNumber || '').trim();
  if (erp) score += PROFILE_FIELD_WEIGHTS.erpNumber;

  const dept = (profileData?.department || user?.department || '').trim();
  if (dept) score += PROFILE_FIELD_WEIGHTS.department;

  const gender = (profileData?.gender || user?.gender || '').trim();
  if (gender) score += PROFILE_FIELD_WEIGHTS.gender;

  const year = (profileData?.year || profileData?.academicYear || user?.year || '').trim();
  if (year) score += PROFILE_FIELD_WEIGHTS.academicYear;

  const section = (profileData?.section || user?.section || '').trim();
  if (section) score += PROFILE_FIELD_WEIGHTS.section;

  const batch = (profileData?.batch || profileData?.graduationBatch || user?.batch || '').trim();
  if (batch) score += PROFILE_FIELD_WEIGHTS.graduationBatch;

  // --- 3. Section 2: Academic Qualifications & Performance (25%) ---
  const tenth = profileData?.tenthPercentage;
  if (tenth !== null && tenth !== undefined && tenth !== '' && !isNaN(tenth) && Number(tenth) > 0) {
    score += PROFILE_FIELD_WEIGHTS.tenthPercentage;
  }

  const twelfth = profileData?.twelfthPercentage;
  const diploma = profileData?.diplomaPercentage;
  const hasTwelfth = twelfth !== null && twelfth !== undefined && twelfth !== '' && !isNaN(twelfth) && Number(twelfth) > 0;
  const hasDiploma = diploma !== null && diploma !== undefined && diploma !== '' && !isNaN(diploma) && Number(diploma) > 0;
  if (hasTwelfth || hasDiploma) {
    score += PROFILE_FIELD_WEIGHTS.twelfthOrDiploma;
  }

  const cgpa = profileData?.cgpa;
  if (cgpa !== null && cgpa !== undefined && cgpa !== '' && !isNaN(cgpa) && Number(cgpa) > 0) {
    score += PROFILE_FIELD_WEIGHTS.cgpa;
  }

  // --- 4. Section 3: Contact Details & Identity (20%) ---
  const phone = (profileData?.phone || user?.phone || '').trim();
  if (phone) score += PROFILE_FIELD_WEIGHTS.phone;

  const aadhaar = (profileData?.aadhaarNumber || '').trim();
  if (aadhaar) score += PROFILE_FIELD_WEIGHTS.aadhaarNumber;

  const hometown = (profileData?.hometown || '').trim();
  if (hometown) score += PROFILE_FIELD_WEIGHTS.hometown;

  // --- 5. Section 4: Career & Portfolio Profiles (15%) ---
  const resume = (profileData?.resumeUrl || '').trim();
  if (resume) score += PROFILE_FIELD_WEIGHTS.resumeUrl;

  const linkedin = (profileData?.linkedinUrl || '').trim();
  const github = (profileData?.githubUrl || '').trim();
  if (linkedin || github) score += PROFILE_FIELD_WEIGHTS.portfolioLinks;

  return Math.min(100, Math.max(0, score));
};

export default calculateProfileCompletion;

