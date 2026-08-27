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

const DEPARTMENT_ALIASES = {
  EXTC: [
    'EXTC',
    'Electronics',
    'ELECTRONICS',
    'Electronics & Telecommunication',
    'ELECTRONICS & TELECOMMUNICATION',
    'Electronics & Telecommunication Engineering',
    'ELECTRONICS & TELECOMMUNICATION ENGINEERING',
    'Electronics and Telecommunication',
    'ELECTRONICS AND TELECOMMUNICATION',
    'Electronics and Telecommunication Engineering',
    'ELECTRONICS AND TELECOMMUNICATION ENGINEERING',
    'ECE',
    'ETC',
    'E&TC',
    'Electronics Engineering',
    'ELECTRONICS ENGINEERING',
    'Telecommunication',
    'TELECOMMUNICATION'
  ],
  IT: [
    'IT',
    'Information Technology',
    'INFORMATION TECHNOLOGY',
    'Info Tech',
    'INFO TECH'
  ],
  CSE: [
    'CSE',
    'Computer Science',
    'COMPUTER SCIENCE',
    'Computer Science & Engineering',
    'COMPUTER SCIENCE & ENGINEERING',
    'Computer Science and Engineering',
    'COMPUTER SCIENCE AND ENGINEERING',
    'Computer Engineering',
    'COMPUTER ENGINEERING',
    'CS'
  ],
  Civil: [
    'Civil',
    'CIVIL',
    'Civil Engineering',
    'CIVIL ENGINEERING',
    'Civil Engg',
    'CIVIL ENGG',
    'CE'
  ],
  Mechanical: [
    'Mechanical',
    'MECHANICAL',
    'Mechanical Engineering',
    'MECHANICAL ENGINEERING',
    'Mechanical Engg',
    'MECHANICAL ENGG',
    'Mech',
    'MECH',
    'ME'
  ],
  'CSE (IOT)': [
    'CSE (IOT)',
    'CSE(IOT)',
    'CSE (IoT)',
    'CSE - IOT',
    'CSE-IOT',
    'CSE (Internet of Things)',
    'CSE (INTERNET OF THINGS)',
    'IoT',
    'IOT',
    'Internet of Things',
    'INTERNET OF THINGS'
  ],
  AIDS: [
    'AIDS',
    'AI&DS',
    'AI & DS',
    'AI AND DS',
    'Artificial Intelligence & Data Science',
    'ARTIFICIAL INTELLIGENCE & DATA SCIENCE',
    'Artificial Intelligence and Data Science',
    'ARTIFICIAL INTELLIGENCE AND DATA SCIENCE',
    'AI',
    'Data Science',
    'DATA SCIENCE'
  ],
  MCA: [
    'MCA',
    'Master of Computer Applications',
    'MASTER OF COMPUTER APPLICATIONS',
    'Masters of Computer Applications',
    'MASTERS OF COMPUTER APPLICATIONS'
  ],
  MBA: [
    'MBA',
    'Master of Business Administration',
    'MASTER OF BUSINESS ADMINISTRATION',
    'Masters of Business Administration',
    'MASTERS OF BUSINESS ADMINISTRATION',
    'Management',
    'MANAGEMENT'
  ]
};

const canonicalizeDepartment = (deptCode) => {
  if (!deptCode) return 'CSE';
  const clean = String(deptCode).trim().toUpperCase();
  for (const [canonical, aliases] of Object.entries(DEPARTMENT_ALIASES)) {
    if (canonical.toUpperCase() === clean || aliases.map(a => a.toUpperCase()).includes(clean)) {
      return canonical;
    }
  }
  return deptCode;
};

const getDepartmentAliases = (deptCode) => {
  if (!deptCode) return [];
  const canonical = canonicalizeDepartment(deptCode);
  return DEPARTMENT_ALIASES[canonical] || [canonical, deptCode];
};

module.exports = {
  OFFICIAL_DEPARTMENTS,
  STUDENT_YEARS,
  GENDERS,
  TRAINING_MODULES,
  MODULE_CATEGORIES,
  DEPARTMENT_ALIASES,
  canonicalizeDepartment,
  getDepartmentAliases
};

