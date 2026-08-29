/**
 * MITRA Employability Portal - Official Training Taxonomy
 * Single reusable source of truth for the 5 Master Training Modules and their sub-categories.
 */

import { OFFICIAL_DEPARTMENTS } from './departments';

export const TRAINING_MODULES = [
  { id: 'Aptitude', label: 'Aptitude' },
  { id: 'Domain', label: 'Domain Knowledge' },
  { id: 'Communication', label: 'Communication' },
  { id: 'Resume', label: 'Resume' },
  { id: 'Interview', label: 'Interview Preparation' }
];

export const MODULE_CATEGORIES = {
  Aptitude: [
    { id: 'Quantitative', label: 'Quantitative Aptitude' },
    { id: 'Reasoning', label: 'Logical Reasoning' },
    { id: 'Verbal', label: 'Verbal Ability' },
    { id: 'Mix Assessment', label: 'Mix Assessment' }
  ],
  Domain: OFFICIAL_DEPARTMENTS.map((dept) => ({ id: dept, label: dept })),
  'Domain Knowledge': OFFICIAL_DEPARTMENTS.map((dept) => ({ id: dept, label: dept })),
  Communication: [
    { id: 'Grammar', label: 'Grammar' },
    { id: 'Vocabulary', label: 'Vocabulary' },
    { id: 'Speaking', label: 'Speaking' },
    { id: 'Listening', label: 'Listening' },
    { id: 'Business Communication', label: 'Business Communication' }
  ],
  Resume: [
    { id: 'Resume Building', label: 'Resume Building' },
    { id: 'ATS Resume', label: 'ATS Resume' },
    { id: 'Projects', label: 'Projects' },
    { id: 'Resume Examples', label: 'Resume Examples' }
  ],
  Interview: [
    { id: 'HR Interview', label: 'HR Interview' },
    { id: 'Technical Interview', label: 'Technical Interview' },
    { id: 'Behavioral Questions', label: 'Behavioral Questions' },
    { id: 'Company Preparation', label: 'Company Preparation' },
    { id: 'Mock Interview', label: 'Mock Interview' }
  ],
  'Interview Preparation': [
    { id: 'HR Interview', label: 'HR Interview' },
    { id: 'Technical Interview', label: 'Technical Interview' },
    { id: 'Behavioral Questions', label: 'Behavioral Questions' },
    { id: 'Company Preparation', label: 'Company Preparation' },
    { id: 'Mock Interview', label: 'Mock Interview' }
  ]
};

export const normalizeModuleName = (moduleKey) => {
  if (!moduleKey) return 'Aptitude';
  const key = moduleKey.trim();
  if (key === 'Domain' || key === 'Domain Knowledge') return 'Domain Knowledge';
  if (key === 'Interview' || key === 'Interview Preparation') return 'Interview Preparation';
  return key;
};
