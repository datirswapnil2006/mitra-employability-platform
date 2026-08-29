/**
 * MITRA Employability Portal - Question Bank Taxonomy & AI Config
 */

import { OFFICIAL_DEPARTMENTS } from './departments';

export const QUESTION_MODULES = [
  { id: 'Aptitude', label: 'Aptitude' },
  { id: 'Technical', label: 'Technical / Coding' },
  { id: 'Domain', label: 'Domain Knowledge' }
];

export const QUESTION_CATEGORIES = {
  Aptitude: [
    { id: 'Quantitative', label: 'Quantitative Aptitude' },
    { id: 'Reasoning', label: 'Logical Reasoning' },
    { id: 'Verbal', label: 'Verbal Ability' },
    { id: 'Mix Assessment', label: 'Mix Assessment' }
  ],
  Technical: [
    { id: 'Data Structures', label: 'Data Structures' },
    { id: 'Algorithms', label: 'Algorithms' },
    { id: 'DBMS / SQL', label: 'DBMS / SQL' },
    { id: 'OOPs', label: 'OOPs Concepts' },
    { id: 'Web Development', label: 'Web Development' },
    { id: 'Core CS', label: 'Core CS (OS / Networks)' }
  ],
  Domain: OFFICIAL_DEPARTMENTS.map((dept) => ({ id: dept, label: dept }))
};

export const AI_PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', model: 'Gemini 3.6 Flash', badge: 'Google AI' },
  { id: 'groq', name: 'Groq Cloud', model: 'Qwen / Llama 3', badge: 'Ultra-Fast Groq' },
  { id: 'huggingface', name: 'Hugging Face', model: 'DeepSeek / Mistral', badge: 'Open Source HF' }
];

export const QUESTION_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
