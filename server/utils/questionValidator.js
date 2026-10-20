const { z } = require('zod');

/**
 * Question Validation & Deterministic Verification Engine
 * Strictly validates fields, option counts, option uniqueness, valid answer references,
 * code snippets, SQL schemas, and psychometric scoring rules.
 * Rejects uncertain/malformed questions instead of silently inventing corrections.
 */

const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Beginner', 'Intermediate', 'Advanced', 'Mixed'];
const VALID_QUESTION_TYPES = ['mcq', 'sql', 'coding', 'psychometric', 'output', 'conceptual'];

// 1. Zod Base Schema
const baseQuestionZodSchema = z.object({
  questionText: z.string().trim().min(8, 'Question text must be at least 8 characters long'),
  codeSnippet: z.string().optional().default(''),
  type: z.enum(VALID_QUESTION_TYPES).default('mcq'),
  options: z.array(z.string().trim()).min(2, 'Question must have at least 2 options'),
  correctAnswer: z.string().trim().min(1, 'Correct answer is required'),
  explanation: z.string().trim().min(8, 'Explanation must be at least 8 characters long'),
  difficulty: z.string().optional().default('Medium'),
  marks: z.number().int().min(1).max(20).default(1),
  section: z.string().optional().default(''),
  department: z.string().nullable().optional().default(null),
  category: z.string().optional().default(''),
  topic: z.string().optional().default(''),
  // SQL specific
  schemaSql: z.string().optional().default(''),
  referenceQuery: z.string().optional().default(''),
  // Psychometric specific
  competency: z.string().optional().default(''),
  scoringRule: z.any().optional().default(null)
});

// Helper to normalize answer key reference
const resolveAnswerToOption = (correctAnswerRaw, options) => {
  if (!correctAnswerRaw || typeof correctAnswerRaw !== 'string') return null;
  const raw = correctAnswerRaw.trim();

  // 1. Exact string match (case-insensitive or exact)
  const exactIdx = options.findIndex((opt) => opt.toLowerCase() === raw.toLowerCase());
  if (exactIdx !== -1) {
    return options[exactIdx];
  }

  // 2. Letter/label match: "A", "Option A", "(A)", "1", "Option 1"
  const letterMatch = raw.match(/^(?:option\s+)?([A-D])(?:\)|\.)?$/i);
  if (letterMatch) {
    const letterIndex = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
    if (letterIndex >= 0 && letterIndex < options.length) {
      return options[letterIndex];
    }
  }

  const numberMatch = raw.match(/^(?:option\s+)?([1-5])(?:\)|\.)?$/i);
  if (numberMatch) {
    const numIndex = parseInt(numberMatch[1], 10) - 1;
    if (numIndex >= 0 && numIndex < options.length) {
      return options[numIndex];
    }
  }

  // 3. Option prefix match (e.g. "A) 42" matching "42")
  for (const opt of options) {
    const cleanOpt = opt.replace(/^[A-D1-5][\)\.\:\-]\s*/i, '').trim().toLowerCase();
    const cleanAns = raw.replace(/^[A-D1-5][\)\.\:\-]\s*/i, '').trim().toLowerCase();
    if (cleanOpt && cleanAns && cleanOpt === cleanAns) {
      return opt;
    }
  }

  return null;
};

/**
 * Validates a single question against strict schema and deterministic rules.
 * @param {Object} rawQ - Raw question object from AI or input
 * @param {Object} config - Validation configuration & expected section constraints
 * @returns {{ valid: boolean, question?: Object, errors?: string[] }}
 */
const validateQuestion = (rawQ, config = {}) => {
  const errors = [];
  if (!rawQ || typeof rawQ !== 'object') {
    return { valid: false, errors: ['Question must be a non-null object'] };
  }

  // 1. Zod schema validation
  const parsed = baseQuestionZodSchema.safeParse(rawQ);
  if (!parsed.success) {
    const zodMessages = parsed.error.issues.map((iss) => `${iss.path.join('.')}: ${iss.message}`);
    return { valid: false, errors: zodMessages };
  }

  const q = parsed.data;

  // 2. Normalize and check Options
  const rawOptions = (Array.isArray(q.options) ? q.options : [])
    .map((o) => (typeof o === 'string' ? o.trim() : String(o || '').trim()))
    .filter(Boolean);

  const expectedType = config.type || q.type || 'mcq';
  const isPsychometric = expectedType === 'psychometric' || config.isPsychometric;
  const expectedOptionCount = config.optionsCount || (isPsychometric ? 5 : 4);

  if (rawOptions.length !== expectedOptionCount) {
    errors.push(`Expected exactly ${expectedOptionCount} options, received ${rawOptions.length}`);
  }

  // 3. Check Unique Options (no duplicate choices)
  const optionSet = new Set(rawOptions.map((o) => o.toLowerCase()));
  if (optionSet.size !== rawOptions.length) {
    errors.push(`All options must be unique. Detected duplicate options: ${JSON.stringify(rawOptions)}`);
  }

  // Check that options are not placeholder texts like "Option A", "Option B"
  const placeholderCount = rawOptions.filter((o) => /^option\s+[A-D]$/i.test(o)).length;
  if (placeholderCount > 1 && !isPsychometric) {
    errors.push('Options contain placeholder text (e.g. "Option A", "Option B"). Rejected invalid generation.');
  }

  // 4. Deterministic Answer Verification
  const resolvedAnswer = resolveAnswerToOption(q.correctAnswer, rawOptions);
  if (!resolvedAnswer && !isPsychometric) {
    errors.push(
      `Correct answer "${q.correctAnswer}" does not match any of the provided options: [${rawOptions.join(', ')}]`
    );
  }

  // 5. Difficulty Verification
  let diff = q.difficulty ? String(q.difficulty).trim() : 'Medium';
  diff = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
  if (!VALID_DIFFICULTIES.includes(diff)) {
    diff = config.difficulty || 'Medium';
  }

  // 6. SQL Specific Deterministic Verification
  if (expectedType === 'sql') {
    const hasSchema = Boolean(q.schemaSql && q.schemaSql.trim().length > 10) ||
                      /(?:CREATE\s+TABLE|INSERT\s+INTO|TABLE\s+schema)/i.test(q.questionText);
    if (!hasSchema) {
      errors.push('SQL questions require a valid schema definition (schemaSql or CREATE TABLE in question text).');
    }

    const refQuery = q.referenceQuery || resolvedAnswer || '';
    if (!/(?:SELECT|WITH|UPDATE|DELETE|INSERT|ALTER|CREATE|SHOW)\b/i.test(refQuery) &&
        !/(?:SELECT|WITH|UPDATE|DELETE|INSERT|ALTER|CREATE|SHOW)\b/i.test(q.questionText)) {
      errors.push('SQL questions must test or reference a valid SQL query or clause.');
    }
  }

  // 7. Coding Specific Verification (C/C++/Java/Python)
  if (expectedType === 'coding' || expectedType === 'output') {
    const hasCode = Boolean(q.codeSnippet && q.codeSnippet.trim().length > 5) ||
                    /(?:class\s+|def\s+|void\s+|int\s+|function\s+|#include|public\s+|static\s+|System\.out|printf|print\()/i.test(q.questionText);
    if (!hasCode && !q.codeSnippet) {
      errors.push('Coding / Output questions must include code context or a codeSnippet.');
    }
  }

  // 8. Psychometric Specific Verification & Scoring Rules
  if (isPsychometric) {
    const competency = q.competency || config.competency || 'General Competency';
    // Provide default Likert scoring weights [1, 2, 3, 4, 5] if none specified
    let scoringRule = q.scoringRule;
    if (!scoringRule || !Array.isArray(scoringRule)) {
      scoringRule = rawOptions.map((_, idx) => idx + 1);
    }
    q.competency = competency;
    q.scoringRule = scoringRule;
  }

  // 9. Explanation Quality Check
  if (!q.explanation || q.explanation.trim().length < 8 || /^(n\/a|none|correct answer is [a-d])$/i.test(q.explanation.trim())) {
    errors.push('Explanation must provide a meaningful rationale explaining the correct solution.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Construct validated question
  const validated = {
    questionText: q.questionText,
    codeSnippet: q.codeSnippet || '',
    type: expectedType,
    options: rawOptions,
    correctAnswer: resolvedAnswer || rawOptions[0],
    explanation: q.explanation,
    difficulty: diff,
    marks: config.marks || q.marks || 1,
    section: config.section || q.section || '',
    department: config.department !== undefined ? config.department : q.department,
    category: config.category || q.category || 'General',
    topic: config.topic || q.topic || 'General',
    schemaSql: q.schemaSql || '',
    referenceQuery: q.referenceQuery || '',
    competency: q.competency || '',
    scoringRule: q.scoringRule || null,
    confidence: 'HIGH'
  };

  return { valid: true, question: validated };
};

/**
 * Validates a batch of questions and separates accepted from rejected.
 */
const validateQuestionBatch = (questionsArray, config = {}) => {
  if (!Array.isArray(questionsArray)) {
    return { accepted: [], rejected: [{ error: 'Expected an array of questions', raw: questionsArray }] };
  }

  const accepted = [];
  const rejected = [];

  for (let i = 0; i < questionsArray.length; i++) {
    const rawQ = questionsArray[i];
    const result = validateQuestion(rawQ, config);
    if (result.valid && result.question) {
      accepted.push(result.question);
    } else {
      rejected.push({
        index: i,
        rawQuestion: rawQ,
        errors: result.errors || ['Validation failed']
      });
    }
  }

  return { accepted, rejected };
};

module.exports = {
  validateQuestion,
  validateQuestionBatch,
  resolveAnswerToOption,
  baseQuestionZodSchema,
  VALID_DIFFICULTIES,
  VALID_QUESTION_TYPES
};
