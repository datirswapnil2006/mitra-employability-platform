const { generateQuestionsWithGemini } = require('./geminiClient');
const Question = require('../modules/assessments/question.model');
const { validateQuestionBatch, validateQuestion } = require('./questionValidator');
const { checkIsDuplicate, filterUniqueQuestions } = require('./questionDeduplicator');
const { normalizeCurrencySymbols } = require('./mathCleaner');

/**
 * Enhanced AI Question Generator for MITRA Assessment Module
 * - Uses Google Gemini structured output with Zod validation
 * - Configurable chunked batches of 5-10 questions
 * - Near-duplicate detection and deterministic answer validation
 * - Question Bank fallback: when Gemini fails or produces insufficient questions,
 *   retrieves eligible questions from the existing Assessment Question Bank submodule.
 */

const isDuplicate = (newText, existingList) => {
  const check = checkIsDuplicate(newText, existingList, 0.75);
  return check.isDuplicate;
};

/**
 * Cleans user prompt or topic string by removing prompt boilerplate
 */
const cleanTopicString = (rawTopic = '', rawPrompt = '') => {
  let text = (rawTopic || rawPrompt || '').trim();
  if (!text) return '';
  text = text
    .replace(/^(?:generate|create|write|give|make|produce|extract)\s+(?:me\s+)?(?:some\s+)?(?:mcq|questions|assessment|test|evaluation|problems)?\s*(?:focusing\s+on|based\s+on|covering|about|on|for|in|related\s+to|regarding)?\s*/i, '')
    .replace(/^(?:test|assessment|questions)\s+on\s+/i, '')
    .replace(/\b(?:questions|mcqs|test|problems|assessment)\b/gi, '')
    .replace(/[,;:.!?]+$/, '').trim();
  return text;
};

/**
 * Retrieves eligible fallback questions from the existing Question Bank (Question model)
 * strictly matching the selected topic without altering Question Bank logic or creating new storage.
 * Only questions matching the selected topic are returned; unrelated topics are never injected.
 */
const retrieveQuestionBankFallback = async ({
  count = 1,
  module: moduleName = 'Aptitude',
  category = '',
  department = null,
  topic = '',
  prompt = '',
  difficulty = 'Medium',
  type = 'mcq',
  existingQuestions = []
}) => {
  if (count <= 0) return [];

  const cleanModule = (moduleName || 'Aptitude').trim();
  const cleanCategory = (category || '').trim();
  const cleanDept = (department || '').trim();

  // Deduplication check set
  const alreadySelectedTexts = new Set(
    (existingQuestions || []).map((q) => (typeof q === 'string' ? q : q.questionText || '').trim().toLowerCase())
  );

  let targetTopic = cleanTopicString(topic, prompt);

  // Match targetTopic against known topics in the Question Bank
  try {
    const knownTopics = await Question.distinct('topic', { status: { $ne: 'inactive' } });
    const fullText = `${topic} ${prompt}`.toLowerCase();
    const matchedKnown = knownTopics.find((kt) => kt && fullText.includes(kt.toLowerCase()));
    if (matchedKnown) {
      targetTopic = matchedKnown;
    }
  } catch (err) {
    // Non-fatal, use cleaned targetTopic
  }

  let candidates = [];

  // Query 1: Strict Topic Match in existing Question Bank
  if (targetTopic && targetTopic !== 'General' && targetTopic !== 'All') {
    const escaped = targetTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const topicRegex = new RegExp(escaped, 'i');
    const filter = {
      status: { $ne: 'inactive' },
      topic: { $regex: topicRegex }
    };

    if (cleanModule && cleanModule !== 'All') {
      if (cleanModule === 'Domain' || cleanModule === 'Domain Knowledge') {
        filter.module = { $in: ['Domain', 'Domain Knowledge'] };
      } else {
        filter.module = cleanModule;
      }
    }
    if (cleanDept && cleanDept !== 'All') {
      filter.$and = [{ $or: [{ department: cleanDept }, { department: 'All' }, { department: null }] }];
    }

    try {
      candidates = await Question.find(filter).lean();
    } catch (err) {
      candidates = [];
    }

    // Query 2: If no candidate matched by topic name, search for topic keyword in questionText within the same category
    if (candidates.length === 0) {
      const textFilter = {
        status: { $ne: 'inactive' },
        questionText: { $regex: topicRegex }
      };
      if (cleanCategory && cleanCategory !== 'General' && cleanCategory !== 'All') {
        const catClean = cleanCategory.replace(/ Aptitude| Reasoning| Ability/i, '').trim();
        textFilter.category = new RegExp(catClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      }
      try {
        candidates = await Question.find(textFilter).lean();
      } catch (err) {
        // Non-fatal
      }
    }
  }

  // Filter candidates against existing questions in this assessment
  const eligible = [];
  for (const c of candidates) {
    if (!c || !c.questionText) continue;
    const normText = c.questionText.trim().toLowerCase();
    if (alreadySelectedTexts.has(normText)) continue;

    // Validate options and correctAnswer with currency normalization
    const cleanQText = normalizeCurrencySymbols(c.questionText.trim());
    const opts = (Array.isArray(c.options) && c.options.length >= 4
      ? c.options.slice(0, 4).map((o) => normalizeCurrencySymbols(String(o || '').trim()))
      : ['Option A', 'Option B', 'Option C', 'Option D']).map((o) => normalizeCurrencySymbols(o));
    while (opts.length < 4) opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);

    let corr = normalizeCurrencySymbols(String(c.correctAnswer || opts[0]).trim());
    if (!opts.includes(corr)) opts[0] = corr;

    eligible.push({
      questionText: cleanQText,
      codeSnippet: c.codeSnippet || '',
      type: c.type || type || 'mcq',
      options: opts,
      correctAnswer: corr,
      explanation: normalizeCurrencySymbols(c.explanation || 'Verified question retrieved from Question Bank.'),
      difficulty: c.difficulty || difficulty || 'Medium',
      marks: c.marks || 1,
      topic: c.topic || cleanTopic || 'General',
      category: c.category || cleanCategory || 'General',
      department: c.department || cleanDept || null,
      module: c.module || cleanModule || 'Aptitude',
      isAiGenerated: false,
      aiProvider: 'question_bank_fallback'
    });
  }

  // Deduplicate against existing assessment pool using token distance
  const { accepted: uniqueEligible } = filterUniqueQuestions(
    eligible,
    existingQuestions,
    0.75
  );

  // Fisher-Yates shuffle to ensure natural variety without predictable patterns
  for (let i = uniqueEligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniqueEligible[i], uniqueEligible[j]] = [uniqueEligible[j], uniqueEligible[i]];
  }

  // Return strictly up to needed deficit count without duplication
  return uniqueEligible.slice(0, count);
};

const buildGenerationPrompt = ({
  module = 'Aptitude',
  category = 'Quantitative',
  department = null,
  topic = 'General',
  prompt = '',
  customPrompt = '',
  difficulty = 'Medium',
  count = 5,
  existingQuestions = []
}) => {
  const effectivePrompt = customPrompt || prompt || '';
  const domainContext = department ? `Department: ${department}` : '';

  const existingDeduplicationSection = Array.isArray(existingQuestions) && existingQuestions.length > 0
    ? `\nCRITICAL DEDUPLICATION DIRECTIVE:\nThe following questions have ALREADY been generated in earlier batches. You MUST NOT repeat any of them or produce trivial variations:\n${existingQuestions.slice(-20).map((q, idx) => `${idx + 1}. "${typeof q === 'string' ? q : (q.questionText || '')}"`).join('\n')}\nGenerate completely distinct, original questions.`
    : '';

  return `You are a premier technical assessment architect and recruitment exam creator.
Generate exactly ${count} high-quality, academic and industry-level multiple choice questions (MCQs) for the following specifications:

Domain / Module: "${module}"
Category: "${category}"
${domainContext}
Topic / Focus: "${topic || effectivePrompt.slice(0, 50) || 'General'}"
Difficulty Level: "${difficulty}" (Easy / Medium / Hard)
${effectivePrompt ? `Custom Syllabus Directives: "${effectivePrompt}"` : ''}
${existingDeduplicationSection}

CRITICAL SPECIFICATION RULES:
1. Every question must have exactly 4 plausible, distinct options.
2. The correctAnswer must match EXACTLY one of the 4 strings in the options array.
3. Every option must be unique (no duplicate choices like ["4", "4", "5", "6"]).
4. Provide a step-by-step verified explanation explaining the exact rationale.
5. If technical/coding, provide a clean, formatted code snippet.
6. If SQL/database, provide schemaSql and referenceQuery.
7. Return ONLY a valid JSON array complying with the requested response schema.
8. Every question MUST strictly evaluate concepts from the specified Topic / Syllabus ("${topic || effectivePrompt.slice(0, 50) || 'General'}"). Do NOT drift into unrelated topics.
9. Distribute correct answers across varying option positions rather than always picking the first option.`;
};

/**
 * Main AI Generation Handler with Chunked Batching (5–10 questions per call),
 * Zod validation, near-duplicate detection, and Question Bank fallback.
 * Uses Google Gemini as the sole AI provider.
 */
const generateQuestionsAI = async ({
  provider = 'gemini',
  module = 'Aptitude',
  category = 'Quantitative',
  department = null,
  topic = 'General',
  prompt = '',
  customPrompt = '',
  difficulty = 'Medium',
  count = 5,
  batchSize = 5,
  existingQuestions = []
}) => {
  const targetCount = Math.max(1, parseInt(count, 10) || 5);
  const actualBatchSize = Math.max(5, Math.min(10, parseInt(batchSize, 10) || Math.min(targetCount, 10)));

  const allAccepted = [];
  const accumulatedPool = Array.isArray(existingQuestions)
    ? [...existingQuestions].map((q) => (typeof q === 'string' ? { questionText: q } : q))
    : [];

  let remaining = targetCount;
  let offset = 0;

  while (remaining > 0) {
    const currentChunkSize = Math.min(actualBatchSize, remaining);
    let chunkQuestions = [];

    const promptText = buildGenerationPrompt({
      module,
      category,
      department,
      topic,
      prompt,
      customPrompt,
      difficulty,
      count: currentChunkSize,
      existingQuestions: accumulatedPool.map((q) => q.questionText)
    });

    // 1. Generate with Google Gemini
    try {
      const geminiResult = await generateQuestionsWithGemini({
        prompt: promptText,
        jobId: `gen_ai_${Date.now()}`
      });

      if (geminiResult && Array.isArray(geminiResult.questions) && geminiResult.questions.length > 0) {
        chunkQuestions = geminiResult.questions;
      }
    } catch (err) {
      console.warn(`[AI Question Generator]: Gemini generation failed (${err.message}). Retrieving fallback questions from Question Bank...`);
    }

    // 2. Validate Gemini questions with Zod schema and deterministic checks
    const { accepted: validChunk } = validateQuestionBatch(chunkQuestions, {
      module,
      category,
      department,
      topic,
      difficulty,
      marks: 1
    });

    // 3. Filter duplicates against accumulated pool
    const { accepted: uniqueChunk } = filterUniqueQuestions(
      validChunk,
      accumulatedPool,
      0.75
    );

    // 4. If deficit remains (Gemini failed or returned insufficient valid questions),
    // retrieve eligible questions from the existing Assessment Question Bank submodule
    if (uniqueChunk.length < currentChunkSize) {
      const deficit = currentChunkSize - uniqueChunk.length;
      try {
        const qbFallback = await retrieveQuestionBankFallback({
          count: deficit,
          module,
          category,
          department,
          topic,
          prompt: prompt || promptText,
          difficulty,
          type: 'mcq',
          existingQuestions: [...accumulatedPool, ...uniqueChunk]
        });

        if (Array.isArray(qbFallback) && qbFallback.length > 0) {
          uniqueChunk.push(...qbFallback);
        }
      } catch (qbErr) {
        console.warn(`[AI Question Generator]: Question Bank fallback error (${qbErr.message}).`);
      }
    }

    // 5. Add accepted questions up to target
    for (const q of uniqueChunk) {
      if (allAccepted.length >= targetCount) break;
      const formatted = {
        ...q,
        module,
        category,
        department: module === 'Domain' ? (department || category) : null,
        topic: q.topic || topic || 'General',
        difficulty: q.difficulty || difficulty,
        marks: q.marks || 1,
        aiGenerated: q.isAiGenerated !== false,
        aiProvider: q.aiProvider || 'gemini'
      };
      allAccepted.push(formatted);
      accumulatedPool.push(formatted);
    }

    offset += currentChunkSize;
    remaining = targetCount - allAccepted.length;

    // Safety guard: if neither Gemini nor Question Bank could produce any new unique questions, stop rather than looping infinitely
    if (uniqueChunk.length === 0) {
      break;
    }
  }

  // 6. If Question Bank and Gemini combined have fewer questions than requested,
  // report the shortfall accurately without repeating questions or inserting duplicates
  return allAccepted.slice(0, targetCount);
};

module.exports = {
  generateQuestionsAI,
  retrieveQuestionBankFallback,
  isDuplicate,
  buildGenerationPrompt
};
