const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

/**
 * Multi-LLM AI Question Generator for MITRA Question Bank
 * Supports: Google Gemini, Groq Cloud, Hugging Face, and grounded fallback.
 */

const generatePrompt = ({ module, category, department, topic, difficulty, count }) => {
  const domainContext = department ? `Department: ${department}` : '';
  const isAptitudeMix = module === 'Aptitude' && (
    category === 'Mix Assessment' ||
    String(category || '').toLowerCase().includes('mix') ||
    String(topic || '').toLowerCase().includes('mix') ||
    String(topic || '').toLowerCase().includes('all topics')
  );

  const mixedContext = isAptitudeMix
    ? `
SPECIAL MIXED APTITUDE INSTRUCTIONS:
This is a COMPREHENSIVE MIXED APTITUDE ASSESSMENT.
You MUST distribute the ${count} questions across ALL THREE primary Aptitude domains in balanced proportions:
1. Quantitative Aptitude (e.g., Time & Work, Percentage, Profit & Loss, Ratio, Speed & Distance, Probability, Simple/Compound Interest, Ages, Number System)
2. Logical Reasoning (e.g., Blood Relations, Coding-Decoding, Number/Alphabet Series, Syllogism, Direction Sense, Seating Arrangement, Puzzles, Clock & Calendar)
3. Verbal Ability (e.g., Sentence Correction, Synonyms/Antonyms, Reading Comprehension, Prepositions, Spotting Errors, Idioms & Phrases, Active/Passive Voice)
Ensure every question is unique and represents realistic placement/recruitment test problems.`
    : '';

  return `You are a premier technical assessment architect and recruitment exam creator for top engineering companies.
Generate exactly ${count} high-quality, academic and industry-level multiple choice questions (MCQs) for the following topic:

Domain / Module: "${module}"
Category: "${category}"
${domainContext}
Topic: "${topic}"
Difficulty Level: "${difficulty}" (Easy / Medium / Hard)
${mixedContext}

CRITICAL INSTRUCTIONS:
1. Every question must have exactly 4 plausible, unambiguous options.
2. The correctAnswer must match EXACTLY one of the 4 strings in the options array.
3. Provide a clear, step-by-step explanation explaining why the answer is correct and why other options are incorrect.
4. If technical/coding, optionally provide a clean, formatted code snippet.
5. Return ONLY a valid JSON array of question objects. Do NOT wrap in markdown \`\`\`json or add conversational text.

Required JSON Structure:
[
  {
    "questionText": "Question description...",
    "codeSnippet": "",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": "Option A text",
    "explanation": "Detailed explanation of why Option A is correct...",
    "difficulty": "${difficulty}",
    "type": "mcq",
    "marks": 1
  }
]`;
};

const sanitizeJsonString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\\([a-zA-Z]+|\d+)/g, (match, p1) => {
    if (['n', 'r', 't', 'b', 'f', '"', '\\', '/'].includes(p1) || p1.startsWith('u')) return match;
    return p1;
  });
};

const cleanAndParseJson = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  let stripped = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // 1. Try direct parse
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
    if (parsed && typeof parsed === 'object') return [parsed];
  } catch (e) {
    try {
      const sanitized = sanitizeJsonString(stripped);
      const parsed = JSON.parse(sanitized);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
    } catch (inner) {}
  }

  // 2. Extract substring between first [ and last ]
  const firstBracket = stripped.indexOf('[');
  const lastBracket = stripped.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const sub = stripped.substring(firstBracket, lastBracket + 1);
    try {
      const extracted = JSON.parse(sub);
      if (Array.isArray(extracted) && extracted.length > 0) return extracted;
    } catch (innerE) {
      try {
        const sanitized = sanitizeJsonString(sub);
        const extracted = JSON.parse(sanitized);
        if (Array.isArray(extracted) && extracted.length > 0) return extracted;
      } catch (innerE2) {}
    }
  }

  // 3. Fallback: Parse individual question objects
  const objMatches = stripped.match(/\{[^{}]*("questionText"|"options"|"correctAnswer")[^{}]*\}/g);
  if (objMatches && objMatches.length > 0) {
    const recovered = [];
    for (const objStr of objMatches) {
      try {
        const item = JSON.parse(objStr);
        if (item.questionText && Array.isArray(item.options)) {
          recovered.push(item);
        }
      } catch (err) {
        try {
          const item = JSON.parse(sanitizeJsonString(objStr));
          if (item.questionText && Array.isArray(item.options)) {
            recovered.push(item);
          }
        } catch (innerObjErr) {}
      }
    }
    if (recovered.length > 0) return recovered;
  }

  return null;
};

// 1. Google Gemini Provider
const generateWithGemini = async (prompt, apiKey) => {
  const ai = new GoogleGenAI({ apiKey });
  const modelsToTry = [
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash'
  ];
  let lastError = null;

  for (const modelName of modelsToTry) {
    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            maxOutputTokens: 4096,
            temperature: 0.2
          }
        });

        const parsed = cleanAndParseJson(response.text || '');
        if (parsed && parsed.length > 0) return parsed;
        break;
      } catch (err) {
        lastError = err;
        const msg = String(err.message || '');
        if ((msg.includes('503') || msg.includes('UNAVAILABLE')) && attempts < 2) {
          console.warn(`[Gemini Provider]: Model '${modelName}' experienced high demand (503). Retrying in 1s...`);
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          console.warn(`[Gemini Provider]: Model '${modelName}' unavailable (${err.message}). Trying backup model...`);
          break;
        }
      }
    }
  }
  throw lastError || new Error('Gemini question generation failed.');
};

// 2. Groq Cloud Provider
const generateWithGroq = async (prompt, apiKey, count = 10) => {
  const modelsToTry = [
    'openai/gpt-oss-120b',
    'groq/compound-mini',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b'
  ];
  const maxTokens = Math.min(Math.max(count * 250, 1000), 3000);
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: modelName,
          messages: [
            {
              role: 'system',
              content: 'You are an expert assessment generator. Always output strict JSON arrays only without any formatting or reasoning tags.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: maxTokens
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const rawContent = response.data?.choices?.[0]?.message?.content;
      if (!rawContent) continue;

      const parsed = cleanAndParseJson(rawContent);
      if (parsed && parsed.length > 0) return parsed;
    } catch (err) {
      lastError = err;
      console.warn(`[Groq Provider]: Model '${modelName}' error: ${err.response?.data?.error?.message || err.message}. Trying next Groq model...`);
    }
  }
  throw lastError || new Error('Groq question generation failed.');
};

// 3. Hugging Face Inference API Provider
const generateWithHuggingFace = async (prompt, apiKey) => {
  const modelsToTry = [
    'meta-llama/Llama-3.3-70B-Instruct-Turbo'
  ];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await axios.post(
        'https://router.huggingface.co/together/v1/chat/completions',
        {
          model: modelName,
          messages: [
            {
              role: 'system',
              content: 'You are an expert assessment generator. Always output strict JSON arrays only without any formatting or reasoning tags.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 3000
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 12000
        }
      );

      const rawContent = response.data?.choices?.[0]?.message?.content;
      if (!rawContent) continue;

      const parsed = cleanAndParseJson(rawContent);
      if (parsed && parsed.length > 0) return parsed;
    } catch (err) {
      lastError = err;
      console.warn(`[HuggingFace Provider]: Model '${modelName}' error: ${err.response?.data?.error || err.message}. Trying backup...`);
    }
  }
  throw lastError || new Error('Hugging Face question generation failed.');
};

// 4. Grounded Rule-Based Academic Fallback Generator
const generateAcademicFallback = ({ module, category, topic, difficulty, count }) => {
  const questions = [];
  const diff = difficulty || 'Medium';

  for (let i = 1; i <= count; i++) {
    if (module === 'Aptitude') {
      const isMix = category === 'Mix Assessment' || String(topic || '').toLowerCase().includes('mix');
      const sectionType = isMix ? (i % 3 === 1 ? 'Quantitative' : i % 3 === 2 ? 'Logical Reasoning' : 'Verbal Ability') : category;

      if (sectionType.includes('Quantitative') || (!isMix && sectionType.includes('Quantitative'))) {
        questions.push({
          questionText: `[Quantitative Aptitude] In the topic of ${topic}, what is the primary mathematical formula applied to solve proportional efficiency problems?`,
          codeSnippet: '',
          options: [
            `Rate of Work = Total Work / Total Time Elapsed`,
            `Rate of Work = Total Time * Total Distance`,
            `Rate of Work = Random Variance Factor`,
            `None of the above`
          ],
          correctAnswer: `Rate of Work = Total Work / Total Time Elapsed`,
          explanation: `Quantitative aptitude calculations for work and rate use the core identity: Rate = Work / Time.`,
          difficulty: diff,
          type: 'mcq',
          marks: 1
        });
      } else if (sectionType.includes('Logical') || (!isMix && sectionType.includes('Logical'))) {
        questions.push({
          questionText: `[Logical Reasoning] In ${topic} logic analysis, which deductive rule determines standard statement consistency?`,
          codeSnippet: '',
          options: [
            `Principle of non-contradiction and transitive inference`,
            `Arbitrary pattern inversion`,
            `Unverified speculative premise`,
            `Non-sequential deduction`
          ],
          correctAnswer: `Principle of non-contradiction and transitive inference`,
          explanation: `Logical reasoning problems rely on transitive deduction and non-contradictory validation.`,
          difficulty: diff,
          type: 'mcq',
          marks: 1
        });
      } else {
        questions.push({
          questionText: `[Verbal Ability] In ${topic} English proficiency, which principle governs grammatical correctness in standard recruitment tests?`,
          codeSnippet: '',
          options: [
            `Subject-verb agreement and tense parallelism`,
            `Arbitrary punctuation omission`,
            `Unstructured prepositional placement`,
            `Double negative usage`
          ],
          correctAnswer: `Subject-verb agreement and tense parallelism`,
          explanation: `Verbal ability evaluations check for subject-verb agreement and consistency in grammatical tense structure.`,
          difficulty: diff,
          type: 'mcq',
          marks: 1
        });
      }
    } else if (module === 'Technical') {
      questions.push({
        questionText: `When implementing solutions in ${topic} (${category}), what is the standard worst-case time complexity consideration?`,
        codeSnippet: `// Example context for ${topic}\nfunction optimizeTarget() {\n    // Core logic\n}`,
        options: [
          `O(log N) or O(N) using optimal traversal and memory indexing`,
          `O(N!) due to unbounded recursive expansion`,
          `O(1) regardless of data size without caching`,
          `O(2^N) for standard iterative passes`
        ],
        correctAnswer: `O(log N) or O(N) using optimal traversal and memory indexing`,
        explanation: `Modern technical interviews for ${topic} focus on eliminating exponential overhead down to logarithmic or linear time bounds.`,
        difficulty: diff,
        type: 'mcq',
        marks: 1
      });
    } else {
      questions.push({
        questionText: `In ${category} engineering fundamentals, how is ${topic} verified for optimal operational efficiency?`,
        codeSnippet: '',
        options: [
          `By adhering to ISO/IEEE domain standards and rigorous constraint validation`,
          `By bypassing safety tolerances during load execution`,
          `By ignoring impedance/bandwidth requirements`,
          `By avoiding modular component design`
        ],
        correctAnswer: `By adhering to ISO/IEEE domain standards and rigorous constraint validation`,
        explanation: `${topic} in ${category} requires standard compliance and validation against domain-specific tolerance limits.`,
        difficulty: diff,
        type: 'mcq',
        marks: 1
      });
    }
  }

  return questions;
};

// Helper: Single-batch question generator with provider fallback
const generateSingleBatch = async ({
  provider = 'gemini',
  module = 'Aptitude',
  category = 'Quantitative',
  department = null,
  topic = 'General',
  difficulty = 'Medium',
  count = 10
}) => {
  const prompt = generatePrompt({ module, category, department, topic, difficulty, count });
  let questions = [];
  let resolvedProvider = provider;

  const geminiKey = (process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY || '').trim();
  const groqKey = (process.env.GROQ_API_KEY || process.env.Groq_API_KEY || '').trim();
  const hfKey = (
    process.env.HF_API_KEY ||
    process.env.HUGGINGFACE_API_KEY ||
    process.env.HuggingFace_API_KEY ||
    ''
  ).trim();

  const tryOrder = [];
  if (provider === 'gemini') {
    tryOrder.push('gemini', 'groq', 'huggingface');
  } else if (provider === 'groq') {
    tryOrder.push('groq', 'gemini', 'huggingface');
  } else if (provider === 'huggingface') {
    tryOrder.push('huggingface', 'groq', 'gemini');
  } else {
    tryOrder.push('groq', 'gemini', 'huggingface');
  }

  let generatedSuccessfully = false;

  for (const prov of tryOrder) {
    try {
      if (prov === 'gemini' && geminiKey && geminiKey !== 'dummy_gemini_key_for_testing') {
        questions = await generateWithGemini(prompt, geminiKey);
        resolvedProvider = 'gemini';
        generatedSuccessfully = true;
        break;
      } else if (prov === 'groq' && groqKey) {
        questions = await generateWithGroq(prompt, groqKey, count);
        resolvedProvider = 'groq';
        generatedSuccessfully = true;
        break;
      } else if (prov === 'huggingface' && hfKey) {
        questions = await generateWithHuggingFace(prompt, hfKey);
        resolvedProvider = 'huggingface';
        generatedSuccessfully = true;
        break;
      }
    } catch (err) {
      console.warn(`[AI Question Generator]: Provider '${prov}' failed (${err.message}). Cascading to next available provider...`);
    }
  }

  if (!generatedSuccessfully || !Array.isArray(questions) || questions.length === 0) {
    questions = generateAcademicFallback({ module, category, topic, difficulty, count });
    resolvedProvider = 'fallback';
  }

  return { questions, resolvedProvider };
};

/**
 * Main AI Generation Handler with Automatic Chunked Batching for Large Tests (e.g. 30, 40, 50, 60 questions):
 */
const generateQuestionsAI = async ({
  provider = 'gemini',
  module = 'Aptitude',
  category = 'Quantitative',
  department = null,
  topic = 'General',
  difficulty = 'Medium',
  count = 3
}) => {
  const targetCount = parseInt(count, 10) || 5;
  const batchSize = 10;
  const allRawQuestions = [];
  let mainResolvedProvider = provider;

  // Split into manageable batches of at most 10 questions to prevent LLM token limits and rate limits
  const chunks = [];
  for (let i = 0; i < targetCount; i += batchSize) {
    chunks.push(Math.min(batchSize, targetCount - i));
  }

  for (const chunkSize of chunks) {
    const { questions: batchQuestions, resolvedProvider } = await generateSingleBatch({
      provider,
      module,
      category,
      department,
      topic,
      difficulty,
      count: chunkSize
    });
    mainResolvedProvider = resolvedProvider;
    allRawQuestions.push(...batchQuestions);
  }

  // If there's any remaining deficit, top up from academic fallback to guarantee EXACT targetCount
  if (allRawQuestions.length < targetCount) {
    const deficit = targetCount - allRawQuestions.length;
    const fallbackTopUp = generateAcademicFallback({ module, category, topic, difficulty, count: deficit });
    allRawQuestions.push(...fallbackTopUp);
  }

  // Format and normalize all questions
  return allRawQuestions.slice(0, targetCount).map((q) => {
    let opts = Array.isArray(q.options) && q.options.length >= 4
      ? q.options.slice(0, 4).map(o => String(o || '').trim())
      : ['Option A', 'Option B', 'Option C', 'Option D'];

    let correct = String(q.correctAnswer || opts[0]).trim();
    const upper = correct.toUpperCase();
    if (upper === 'A' || upper === 'OPTION A' || upper === '(A)') correct = opts[0];
    else if (upper === 'B' || upper === 'OPTION B' || upper === '(B)') correct = opts[1];
    else if (upper === 'C' || upper === 'OPTION C' || upper === '(C)') correct = opts[2];
    else if (upper === 'D' || upper === 'OPTION D' || upper === '(D)') correct = opts[3];

    // If correct is not one of the 4 options, guarantee inclusion
    if (!opts.includes(correct)) {
      opts[0] = correct;
    }

    return {
      module,
      category,
      department: module === 'Domain' ? (department || category) : null,
      topic,
      questionText: q.questionText || `Question on ${topic}`,
      codeSnippet: q.codeSnippet || '',
      options: opts,
      correctAnswer: correct,
      explanation: q.explanation || `Correct answer is verified for ${topic}.`,
      difficulty: q.difficulty || difficulty,
      marks: q.marks || 1,
      type: q.type || 'mcq',
      aiGenerated: true,
      aiProvider: q.aiProvider || mainResolvedProvider
    };
  });
};

module.exports = { generateQuestionsAI };
