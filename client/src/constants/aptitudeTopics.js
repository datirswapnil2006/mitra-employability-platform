/**
 * MITRA Employability Platform - Aptitude Assessment Constants
 */

export const APTITUDE_CATEGORIES = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Mix Assessment'
];

export const APTITUDE_TOPICS = {
  'Quantitative Aptitude': [
    'Percentage',
    'Profit & Loss',
    'Ratio & Proportion',
    'Average',
    'Time & Work',
    'Speed, Time & Distance',
    'Simple Interest',
    'Compound Interest',
    'Probability',
    'Number System',
    'Permutation & Combination',
    'Ages',
    'Mixtures & Alligations',
    'Data Interpretation'
  ],
  'Logical Reasoning': [
    'Blood Relations',
    'Coding-Decoding',
    'Number Series',
    'Alphabet Series',
    'Syllogism',
    'Direction Sense',
    'Seating Arrangement',
    'Analogy',
    'Classification',
    'Puzzles',
    'Clock & Calendar',
    'Statement & Assumptions',
    'Order & Ranking'
  ],
  'Verbal Ability': [
    'Grammar',
    'Tenses',
    'Articles',
    'Prepositions',
    'Synonyms & Antonyms',
    'Sentence Correction',
    'Reading Comprehension',
    'Vocabulary',
    'One Word Substitution',
    'Idioms & Phrases',
    'Para Jumbles',
    'Spotting Errors',
    'Active & Passive Voice'
  ],
  'Mix Assessment': [
    'All Topics (Quantitative + Logical + Verbal)',
    'Quantitative + Logical Reasoning Mix',
    'Quantitative + Verbal Ability Mix',
    'Logical Reasoning + Verbal Ability Mix',
    'Full Aptitude Placement Mock Test (All Topics)',
    'High-Yield Campus Drive Aptitude Mix'
  ]
};

export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50, 60];
export const TIME_LIMIT_OPTIONS = [10, 15, 20, 30, 45, 60, 90];
export const PASS_PERCENTAGE_OPTIONS = [40, 50, 60, 70, 80];
export const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard', 'Mixed'];
