const { generateQuestionsWithGemini } = require('./geminiClient');
const { validateQuestionBatch, validateQuestion } = require('./questionValidator');
const { checkIsDuplicate, filterUniqueQuestions } = require('./questionDeduplicator');
const { generateGroundedQuestionsBatch } = require('./groundedQuestionFallback');

/**
 * Enhanced AI Question Generator for MITRA Assessment & Question Bank
 * - Uses Gemini structured output JSON schema with Zod validation
 * - Configurable chunked batches of 5-10 questions
 * - Near-duplicate detection and deterministic answer validation
 * - Bounded retries and grounded academic fallback
 */

const isDuplicate = (newText, existingList) => {
  const check = checkIsDuplicate(newText, existingList, 0.75);
  return check.isDuplicate;
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
7. Return ONLY a valid JSON array complying with the requested response schema.`;
};

/**
 * Main AI Generation Handler with Chunked Batching (5–10 questions per call),
 * Zod validation, near-duplicate detection, and exact count guarantee.
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
  let resolvedProvider = 'gemini';

  while (remaining > 0) {
    const currentChunkSize = Math.min(actualBatchSize, remaining);
    let chunkQuestions = [];

    // 1. Try Gemini generation with structured output
    try {
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

      const geminiResult = await generateQuestionsWithGemini({
        prompt: promptText,
        jobId: `gen_ai_${Date.now()}`
      });

      if (geminiResult && Array.isArray(geminiResult.questions) && geminiResult.questions.length > 0) {
        resolvedProvider = 'gemini';
        chunkQuestions = geminiResult.questions;
      }
    } catch (err) {
      console.warn(`[AI Question Generator]: Gemini generation failed (${err.message}). Using verified academic fallback...`);
      resolvedProvider = 'fallback';
    }

    // 2. Validate questions with Zod schema and deterministic checks
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

    // 4. If deficit remains in this chunk, top up with grounded verified questions
    if (uniqueChunk.length < currentChunkSize) {
      const deficit = currentChunkSize - uniqueChunk.length;
      const fallbackList = generateGroundedQuestionsBatch({
        count: deficit,
        module,
        category,
        department,
        topic,
        difficulty,
        seedOffset: allAccepted.length + offset + 10
      });

      const { accepted: validFallback } = validateQuestionBatch(fallbackList, {
        module,
        category,
        department,
        topic,
        difficulty,
        marks: 1
      });

      const { accepted: uniqueFallback } = filterUniqueQuestions(
        validFallback,
        [...accumulatedPool, ...uniqueChunk],
        0.8
      );

      uniqueChunk.push(...uniqueFallback);
    }

    // 5. Add accepted questions up to target
    for (const q of uniqueChunk) {
      if (allAccepted.length >= targetCount) break;
      const formatted = {
        ...q,
        module,
        category,
        department: module === 'Domain' ? (department || category) : null,
        topic: topic || 'General',
        difficulty: q.difficulty || difficulty,
        marks: q.marks || 1,
        aiGenerated: true,
        aiProvider: resolvedProvider
      };
      allAccepted.push(formatted);
      accumulatedPool.push(formatted);
    }

    offset += currentChunkSize;
    remaining = targetCount - allAccepted.length;

    // Safety guard
    if (uniqueChunk.length === 0) {
      break;
    }
  }

  // 6. Guarantee exact targetCount with grounded questions if any deficit remains
  if (allAccepted.length < targetCount) {
    const deficit = targetCount - allAccepted.length;
    const topUp = generateGroundedQuestionsBatch({
      count: deficit,
      module,
      category,
      department,
      topic,
      difficulty,
      seedOffset: allAccepted.length + 100
    });

    for (const q of topUp) {
      allAccepted.push({
        ...q,
        module,
        category,
        department: module === 'Domain' ? (department || category) : null,
        topic: topic || 'General',
        difficulty,
        marks: 1,
        aiGenerated: true,
        aiProvider: 'fallback'
      });
    }
  }

  return allAccepted.slice(0, targetCount);
};

module.exports = {
  generateQuestionsAI,
  isDuplicate,
  buildGenerationPrompt
};
