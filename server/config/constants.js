/**
 * MITRA Employability Portal - Global Constants
 * Single source of truth for official departments and system configuration.
 */

const OFFICIAL_DEPARTMENTS = [
  'EXTC',
  'CSE',
  'IT',
  'AIDS',
  'CSE (IOT)',
  'Civil',
  'Mechanical',
  'MCA',
  'MBA'
];

const STUDENT_YEARS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Final Year',
];

const GENDERS = [
  'Male',
  'Female',
  'Other',
  'Prefer not to say'
];

const TRAINING_MODULES = [
  'Aptitude',
  'Domain Knowledge',
  'Domain',
  'Communication',
  'Resume',
  'Interview Preparation',
  'Interview'
];

const MODULE_CATEGORIES = {
  Aptitude: ['Quantitative', 'Reasoning', 'Verbal'],
  Domain: OFFICIAL_DEPARTMENTS,
  'Domain Knowledge': OFFICIAL_DEPARTMENTS,
  Communication: ['Grammar', 'Vocabulary', 'Speaking', 'Listening', 'Business Communication'],
  Resume: ['Resume Building', 'ATS Resume', 'Projects', 'Resume Examples'],
  Interview: ['HR Interview', 'Technical Interview', 'Behavioral Questions', 'Company Preparation', 'Mock Interview'],
  'Interview Preparation': ['HR Interview', 'Technical Interview', 'Behavioral Questions', 'Company Preparation', 'Mock Interview']
};

module.exports = {
  OFFICIAL_DEPARTMENTS,
  STUDENT_YEARS,
  GENDERS,
  TRAINING_MODULES,
  MODULE_CATEGORIES
};
