/**
 * MITRA Employability Portal - Frontend Constants
 * Single reusable configuration source for official departments throughout the application.
 */

export const OFFICIAL_DEPARTMENTS = [
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

export const DEPARTMENT_DETAILS = [
  {
    id: 'EXTC',
    code: 'EXTC',
    name: 'Electronics & Telecommunication Engineering',
    shortName: 'Electronics & Telecom',
    description: 'Embedded systems, microcontrollers, communication protocols, and signal engineering.',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    accentColor: '#D97706'
  },
  {
    id: 'IT',
    code: 'IT',
    name: 'Information Technology',
    shortName: 'Information Tech',
    description: 'Database architectures, full-stack engineering, networking, cloud systems, and placement DSA.',
    badgeColor: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    accentColor: '#2563EB'
  },
  {
    id: 'CSE',
    code: 'CSE',
    name: 'Computer Science & Engineering',
    shortName: 'Computer Science',
    description: 'Core software design, data structures, operating systems, compiler principles, and system design.',
    badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
    accentColor: '#4F46E5'
  },
  {
    id: 'Civil',
    code: 'Civil',
    name: 'Civil Engineering',
    shortName: 'Civil Engg',
    description: 'Structural analysis, geotechnical surveying, CAD drafting, concrete design, and core project management.',
    badgeColor: 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
    accentColor: '#EA580C'
  },
  {
    id: 'Mechanical',
    code: 'Mechanical',
    name: 'Mechanical Engineering',
    shortName: 'Mechanical Engg',
    description: 'Thermodynamics, fluid mechanics, CAD/CAM machining, production robotics, and thermal design.',
    badgeColor: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60',
    accentColor: '#DC2626'
  },
  {
    id: 'CSE (IOT)',
    code: 'CSE (IoT)',
    dbKey: 'CSE (IOT)',
    name: 'Computer Science & Engineering (Internet of Things)',
    shortName: 'CSE — IoT',
    description: 'Sensor networks, embedded IoT development, edge cloud computing, and smart systems.',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    accentColor: '#059669'
  },
  {
    id: 'AIDS',
    code: 'AIDS',
    name: 'Artificial Intelligence & Data Science',
    shortName: 'AI & Data Science',
    description: 'Statistical modeling, deep learning architectures, Python analytics, NLP, and LLM foundations.',
    badgeColor: 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    accentColor: '#9333EA'
  },
  {
    id: 'MCA',
    code: 'MCA',
    name: 'Master of Computer Applications',
    shortName: 'MCA',
    description: 'Advanced enterprise software engineering, database systems, web stacks, and tech interview prep.',
    badgeColor: 'text-cyan-700 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60',
    accentColor: '#0891B2'
  },
  {
    id: 'MBA',
    code: 'MBA',
    name: 'Master of Business Administration',
    shortName: 'MBA',
    description: 'Strategic marketing, corporate finance, operations management, HR cases, and leadership preparation.',
    badgeColor: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    accentColor: '#E11D48'
  }
];

export const DEPARTMENT_ALIASES = {
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

export const canonicalizeDepartment = (deptCode) => {
  if (!deptCode) return 'CSE';
  const clean = String(deptCode).trim().toUpperCase();
  for (const [canonical, aliases] of Object.entries(DEPARTMENT_ALIASES)) {
    if (canonical.toUpperCase() === clean || aliases.map((a) => a.toUpperCase()).includes(clean)) {
      return canonical;
    }
  }
  return deptCode;
};

export const getDepartmentAliases = (deptCode) => {
  if (!deptCode) return [];
  const canonical = canonicalizeDepartment(deptCode);
  return DEPARTMENT_ALIASES[canonical] || [canonical, deptCode];
};

export const getDepartmentDetails = (deptCode) => {
  if (!deptCode) return null;
  const canonical = canonicalizeDepartment(deptCode);
  const clean = String(deptCode).trim().toUpperCase();
  return (
    DEPARTMENT_DETAILS.find((d) => d.id === canonical || d.code === canonical) ||
    DEPARTMENT_DETAILS.find(
      (d) =>
        d.id.toUpperCase() === clean ||
        d.code.toUpperCase() === clean ||
        (d.dbKey && d.dbKey.toUpperCase() === clean)
    ) || {
      id: deptCode,
      code: deptCode,
      name: `${deptCode} Department`,
      shortName: deptCode,
      description: 'Departmental curriculum and placement training.',
      badgeColor: 'text-slate-700 bg-slate-100 border-slate-200',
      accentColor: '#64748B'
    }
  );
};

export const normalizeDepartmentCode = (deptCode) => {
  return canonicalizeDepartment(deptCode);
};

export const ACADEMIC_YEARS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Final Year'
];

export const GENDERS = [
  'Male',
  'Female',
  'Other',
  'Prefer not to say'
];

export const SECTIONS = ['A', 'B', 'C', 'D', 'General'];

