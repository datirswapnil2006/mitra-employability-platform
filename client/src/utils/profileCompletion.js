/**
 * Centralized Profile Completion Calculator
 * 
 * Standardized Weights:
 * - name: 10%
 * - erpNumber: 15%
 * - department: 10%
 * - gender: 10%
 * - academicYear: 10%
 * - section: 10%
 * - graduationBatch: 10%
 * - email: 10%
 * - profilePhoto: 15%
 * Total: 100%
 */

export const PROFILE_FIELD_WEIGHTS = {
  name: 10,
  erpNumber: 15,
  department: 10,
  gender: 10,
  academicYear: 10,
  section: 10,
  graduationBatch: 10,
  email: 10,
  profilePhoto: 15
};

export const calculateProfileCompletion = (profileData = {}, user = {}) => {
  let score = 0;

  // 1. Name (10%)
  const name = (user?.name || profileData?.name || '').trim();
  if (name) score += PROFILE_FIELD_WEIGHTS.name;

  // 2. ERP / Roll Number (15%)
  const erp = (profileData?.erpNumber || profileData?.rollNo || user?.erpNumber || '').trim();
  if (erp) score += PROFILE_FIELD_WEIGHTS.erpNumber;

  // 3. Department (10%)
  const dept = (profileData?.department || user?.department || '').trim();
  if (dept) score += PROFILE_FIELD_WEIGHTS.department;

  // 4. Gender (10%)
  const gender = (profileData?.gender || user?.gender || '').trim();
  if (gender) score += PROFILE_FIELD_WEIGHTS.gender;

  // 5. Academic Year (10%)
  const year = (profileData?.year || profileData?.academicYear || user?.year || '').trim();
  if (year) score += PROFILE_FIELD_WEIGHTS.academicYear;

  // 6. Section (10%)
  const section = (profileData?.section || user?.section || '').trim();
  if (section) score += PROFILE_FIELD_WEIGHTS.section;

  // 7. Graduation Batch (10%)
  const batch = (profileData?.batch || profileData?.graduationBatch || user?.batch || '').trim();
  if (batch) score += PROFILE_FIELD_WEIGHTS.graduationBatch;

  // 8. Email (10%)
  const email = (user?.email || profileData?.email || '').trim();
  if (email) score += PROFILE_FIELD_WEIGHTS.email;

  // 9. Profile Photo (15%)
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

  return Math.min(100, Math.max(0, score));
};

export default calculateProfileCompletion;
