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
  resumeUrl: 15
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

  return Math.min(100, Math.max(0, score));
};

export const getProfileRequirements = (profileData = {}, user = {}) => {
  const photo = (profileData?.profilePhoto || user?.profilePhoto || '').trim();
  const hasPhoto =
    !!photo &&
    photo !== 'null' &&
    photo !== 'undefined' &&
    !photo.includes('placeholder') &&
    !photo.includes('default-avatar');

  const name = (user?.name || profileData?.name || '').trim();
  const email = (user?.email || profileData?.email || '').trim();
  const erp = (profileData?.erpNumber || profileData?.rollNo || user?.erpNumber || '').trim();
  const dept = (profileData?.department || user?.department || '').trim();
  const gender = (profileData?.gender || user?.gender || '').trim();
  const year = (profileData?.year || profileData?.academicYear || user?.year || '').trim();
  const section = (profileData?.section || user?.section || '').trim();
  const batch = (profileData?.batch || profileData?.graduationBatch || user?.batch || '').trim();

  const tenth = profileData?.tenthPercentage;
  const hasTenth = tenth !== null && tenth !== undefined && tenth !== '' && !isNaN(tenth) && Number(tenth) > 0;

  const twelfth = profileData?.twelfthPercentage;
  const diploma = profileData?.diplomaPercentage;
  const hasTwelfthOrDiploma =
    (twelfth !== null && twelfth !== undefined && twelfth !== '' && !isNaN(twelfth) && Number(twelfth) > 0) ||
    (diploma !== null && diploma !== undefined && diploma !== '' && !isNaN(diploma) && Number(diploma) > 0);

  const cgpa = profileData?.cgpa;
  const hasCgpa = cgpa !== null && cgpa !== undefined && cgpa !== '' && !isNaN(cgpa) && Number(cgpa) > 0;

  const phone = (profileData?.phone || user?.phone || '').trim();
  const aadhaar = (profileData?.aadhaarNumber || '').trim();
  const hometown = (profileData?.hometown || '').trim();

  const resume = (profileData?.resumeUrl || '').trim();

  return [
    { id: 'photo', label: 'Student Profile Photo', completed: hasPhoto, weight: 15, section: 'Photo', tip: 'Upload your profile photo' },
    { id: 'erpNumber', label: 'ERP / Roll Number', completed: !!erp, weight: 7, section: 'Identity', tip: 'Enter your assigned ERP number' },
    { id: 'department', label: 'Department', completed: !!dept, weight: 3, section: 'Identity', tip: 'Select your department' },
    { id: 'gender', label: 'Gender', completed: !!gender, weight: 3, section: 'Identity', tip: 'Select your gender' },
    { id: 'year', label: 'Academic Year', completed: !!year, weight: 2, section: 'Identity', tip: 'Select your academic year' },
    { id: 'section', label: 'Section / Division', completed: !!section, weight: 2, section: 'Identity', tip: 'Select your section' },
    { id: 'batch', label: 'Graduation Batch', completed: !!batch, weight: 2, section: 'Identity', tip: 'Enter your batch year' },
    { id: 'name', label: 'Student Name', completed: !!name, weight: 3, section: 'Identity', tip: 'Registered account name' },
    { id: 'email', label: 'Email Address', completed: !!email, weight: 3, section: 'Identity', tip: 'Registered account email' },
    { id: 'tenthPercentage', label: '10th Standard %', completed: hasTenth, weight: 8, section: 'Academics', tip: 'Enter SSC percentage > 0' },
    { id: 'twelfthOrDiploma', label: '12th Standard % or Diploma %', completed: hasTwelfthOrDiploma, weight: 8, section: 'Academics', tip: 'Enter 12th or Diploma percentage > 0' },
    { id: 'cgpa', label: 'Degree CGPA', completed: hasCgpa, weight: 9, section: 'Academics', tip: 'Enter cumulative CGPA > 0' },
    { id: 'phone', label: 'Contact Phone Number', completed: !!phone, weight: 7, section: 'Contact', tip: 'Enter 10-digit mobile number' },
    { id: 'aadhaarNumber', label: 'Aadhaar Card Number', completed: !!aadhaar, weight: 7, section: 'Contact', tip: 'Enter 12-digit Aadhaar number' },
    { id: 'hometown', label: 'Hometown / City', completed: !!hometown, weight: 6, section: 'Contact', tip: 'City and State of residence' },
    { id: 'resumeUrl', label: 'Resume Document URL', completed: !!resume, weight: 15, section: 'Career', tip: 'Link to updated PDF resume' }
  ];
};

export const getMissingProfileRequirements = (profileData = {}, user = {}) => {
  return getProfileRequirements(profileData, user).filter(item => !item.completed);
};

export default calculateProfileCompletion;

