const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

/**
 * PDF Question Extractor Configuration
 */
const PDF_CONFIG = {
  CHUNK_CHAR_LIMIT: 3500, // Maximum characters per PDF chunk for reliable token budgets
  MAX_CHUNKS: 5,           // Maximum logical chunks to process from a single PDF
  REDUCED_CHUNK_CHAR_LIMIT: 1800, // Reduced chunk size on 413 (Entity Too Large)
  TIMEOUT_GEMINI: 20000,
  TIMEOUT_GROQ: 25000,
  TIMEOUT_HF: 15000
};

/**
 * 1. Clean & Normalize PDF raw text
 */
function cleanPdfText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // remove control characters
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ') // collapse multiple spaces and tabs
    .replace(/\n{3,}/g, '\n\n') // collapse multiple blank lines
    .trim();
}

/**
 * 2. Split text into manageable, logical chunks
 */
function splitTextIntoChunks(text, chunkSize = PDF_CONFIG.CHUNK_CHAR_LIMIT, maxChunks = PDF_CONFIG.MAX_CHUNKS) {
  if (!text || text.length === 0) return [];
  if (text.length <= chunkSize) return [text];

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length && chunks.length < maxChunks) {
    let endIndex = startIndex + chunkSize;
    if (endIndex >= text.length) {
      chunks.push(text.substring(startIndex).trim());
      break;
    }

    // Look for paragraph or line boundaries to avoid splitting in the middle of a question
    const doubleNewlineIndex = text.lastIndexOf('\n\n', endIndex);
    if (doubleNewlineIndex > startIndex + Math.floor(chunkSize * 0.5)) {
      endIndex = doubleNewlineIndex;
    } else {
      const singleNewlineIndex = text.lastIndexOf('\n', endIndex);
      if (singleNewlineIndex > startIndex + Math.floor(chunkSize * 0.5)) {
        endIndex = singleNewlineIndex;
      }
    }

    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    startIndex = endIndex;
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * 3. Robust JSON Sanitizer and Parser
 * Handles <think> tags, unescaped LaTeX backslashes (\frac, \times), and partial JSON arrays
 */
const sanitizeBackslashes = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\\([a-zA-Z]+|\d+)/g, (match, p1) => {
    if (['n', 'r', 't', 'b', 'f', '"', '\\', '/'].includes(p1) || p1.startsWith('u')) return match;
    return p1;
  });
};

function sanitizeAndParseJson(raw) {
  if (!raw || typeof raw !== 'string') return null;

  let cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '') // Strip reasoning blocks
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // 1. Direct JSON parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    if (parsed && typeof parsed === 'object') return [parsed];
  } catch (e) {
    try {
      const sanitized = sanitizeBackslashes(cleaned);
      const parsed = JSON.parse(sanitized);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    } catch (inner) {}
  }

  // 2. Bracket substring extraction
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const sub = cleaned.substring(firstBracket, lastBracket + 1);
    try {
      const extracted = JSON.parse(sub);
      if (Array.isArray(extracted) && extracted.length > 0) return extracted;
    } catch (innerE) {
      try {
        const extracted = JSON.parse(sanitizeBackslashes(sub));
        if (Array.isArray(extracted) && extracted.length > 0) return extracted;
      } catch (innerE2) {}
    }
  }

  // 3. Object-by-object regex recovery
  const objMatches = cleaned.match(/\{[^{}]*("questionText"|"options"|"correctAnswer")[^{}]*\}/g);
  if (objMatches && objMatches.length > 0) {
    const recovered = [];
    for (const objStr of objMatches) {
      try {
        const item = JSON.parse(objStr);
        if (item.questionText && Array.isArray(item.options)) recovered.push(item);
      } catch (err) {
        try {
          const item = JSON.parse(sanitizeBackslashes(objStr));
          if (item.questionText && Array.isArray(item.options)) recovered.push(item);
        } catch (innerObjErr) {}
      }
    }
    if (recovered.length > 0) return recovered;
  }

  return null;
}

/**
 * 4. Create standard extraction prompt
 */
function buildExtractionPrompt({ chunkText, category, topic, difficulty, count }) {
  return `You are an expert assessment extractor.
Extract up to ${count} multiple choice questions (MCQs) strictly from the following document text.
Category: "${category || 'Quantitative Aptitude'}"
Topic: "${topic || 'General'}"
Difficulty: "${difficulty || 'Medium'}"

DOCUMENT TEXT:
"""
${chunkText}
"""

CRITICAL INSTRUCTIONS:
1. Extract or formulate clear MCQs directly based on the questions in the text.
2. Every question must have exactly 4 plausible options.
3. Determine or infer the correctAnswer matching EXACTLY one of the 4 options.
4. Provide a clear explanation.
5. Return ONLY a valid JSON array of question objects. Do NOT include markdown \`\`\`json or conversational text.

Required JSON Structure:
[
  {
    "questionText": "Question statement...",
    "codeSnippet": "",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Detailed explanation...",
    "difficulty": "${difficulty || 'Medium'}",
    "type": "mcq",
    "marks": 1
  }
]`;
}

/**
 * 5. Provider Implementations with Intelligent Error Handling
 */

// 5a. Gemini Provider (Error-aware: No repeated retries on 429/404)
async function extractWithGemini(prompt, apiKey) {
  const ai = new GoogleGenAI({ apiKey });
  const models = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];

  for (const model of models) {
    try {
      console.log(`[PDF AI] Trying Gemini model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          maxOutputTokens: 3000,
          temperature: 0.1
        }
      });

      const parsed = sanitizeAndParseJson(response.text || '');
      if (parsed && parsed.length > 0) {
        console.log(`[PDF AI] Gemini model ${model} extracted ${parsed.length} questions.`);
        return parsed;
      }
    } catch (err) {
      const msg = String(err.message || '');

      // Quota / Rate limit (429 / RESOURCE_EXHAUSTED) -> Immediately abort Gemini
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded')) {
        console.warn(`[PDF AI] Gemini quota exceeded (429). Switching immediately to next provider.`);
        throw new Error('GEMINI_QUOTA_EXHAUSTED');
      }

      // Model not found (404) -> Skip to next model, do not loop
      if (msg.includes('404') || msg.includes('NOT_FOUND')) {
        console.warn(`[PDF AI] Gemini model '${model}' not found (404). Trying next Gemini model...`);
        continue;
      }

      // Authentication error (401 / 403) -> Abort Gemini
      if (msg.includes('401') || msg.includes('403') || msg.includes('API_KEY_INVALID')) {
        console.warn(`[PDF AI] Gemini authentication error. Switching to next provider.`);
        throw new Error('GEMINI_AUTH_ERROR');
      }

      // High demand (503) -> 1 controlled retry
      if (msg.includes('503') || msg.includes('UNAVAILABLE')) {
        console.warn(`[PDF AI] Gemini 503 spike on ${model}. Retrying once in 1s...`);
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const retryRes = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { maxOutputTokens: 3000, temperature: 0.1 }
          });
          const parsed = sanitizeAndParseJson(retryRes.text || '');
          if (parsed && parsed.length > 0) return parsed;
        } catch (retryErr) {
          console.warn(`[PDF AI] Gemini retry failed. Switching to next model...`);
        }
      } else {
        console.warn(`[PDF AI] Gemini ${model} error: ${msg}. Switching model...`);
      }
    }
  }

  throw new Error('Gemini extraction failed.');
}

// 5b. Groq Provider (Handles 413 by reducing chunk size once, ignores <think> tokens)
async function extractWithGroq(prompt, apiKey, chunkText = '', chunkOptions = {}) {
  const models = [
    'openai/gpt-oss-120b',
    'groq/compound-mini',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b'
  ];

  let currentPrompt = prompt;

  for (const model of models) {
    try {
      console.log(`[PDF AI] Trying Groq model: ${model}`);
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert assessment extractor. Output strict JSON array only without any reasoning or markdown tags.'
            },
            { role: 'user', content: currentPrompt }
          ],
          temperature: 0.1,
          max_tokens: 2500
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: PDF_CONFIG.TIMEOUT_GROQ
        }
      );

      const content = response.data?.choices?.[0]?.message?.content || '';
      const parsed = sanitizeAndParseJson(content);
      if (parsed && parsed.length > 0) {
        console.log(`[PDF AI] Groq response validated (${parsed.length} questions).`);
        return parsed;
      }
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.error?.message || err.message || '';

      // 413: Request Entity Too Large -> Reduce chunk size and retry ONCE
      if (status === 413 || errorMsg.includes('too large') || errorMsg.includes('Requested')) {
        console.warn(`[PDF AI] Groq request too large (413 / TPM). Reducing chunk size and retrying once...`);
        if (chunkText && !chunkOptions.hasRetriedReduced) {
          const reducedChunk = chunkText.substring(0, Math.min(chunkText.length, PDF_CONFIG.REDUCED_CHUNK_CHAR_LIMIT));
          currentPrompt = buildExtractionPrompt({
            chunkText: reducedChunk,
            category: chunkOptions.category,
            topic: chunkOptions.topic,
            difficulty: chunkOptions.difficulty,
            count: Math.min(chunkOptions.count, 5)
          });
          chunkOptions.hasRetriedReduced = true;
          // Retry immediately with next model on smaller prompt
          continue;
        }
      }

      // 429: Rate Limit -> Switch immediately to next model
      if (status === 429) {
        console.warn(`[PDF AI] Groq model ${model} rate limited (429). Trying next Groq model...`);
        continue;
      }

      console.warn(`[PDF AI] Groq model ${model} error: ${errorMsg}. Trying next model...`);
    }
  }

  throw new Error('Groq extraction failed.');
}

// 5c. Hugging Face Provider (Router API with Meta-Llama-3.3-70B-Instruct-Turbo)
async function extractWithHuggingFace(prompt, apiKey) {
  const models = ['meta-llama/Llama-3.3-70B-Instruct-Turbo'];

  for (const model of models) {
    try {
      console.log(`[PDF AI] Trying Hugging Face model: ${model}`);
      const response = await axios.post(
        'https://router.huggingface.co/together/v1/chat/completions',
        {
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert exam extractor. Output strict JSON array of questions only.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 2500
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: PDF_CONFIG.TIMEOUT_HF
        }
      );

      const content = response.data?.choices?.[0]?.message?.content || '';
      const parsed = sanitizeAndParseJson(content);
      if (parsed && parsed.length > 0) {
        console.log(`[PDF AI] Hugging Face extracted ${parsed.length} questions.`);
        return parsed;
      }
    } catch (err) {
      console.warn(`[PDF AI] Hugging Face model ${model} error: ${err.response?.data?.error || err.message}`);
    }
  }

  throw new Error('Hugging Face extraction failed.');
}

/**
 * 6. Central AI Provider Manager with Cascading Fallback
 * Workflow: Gemini -> Groq -> Hugging Face
 */
async function extractChunkWithFallback({ chunkText, category, topic, difficulty, count }) {
  const prompt = buildExtractionPrompt({ chunkText, category, topic, difficulty, count });

  const geminiKey = (process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY || '').trim();
  const groqKey = (process.env.GROQ_API_KEY || process.env.Groq_API_KEY || '').trim();
  const hfKey = (
    process.env.HF_API_KEY ||
    process.env.HUGGINGFACE_API_KEY ||
    process.env.HuggingFace_API_KEY ||
    ''
  ).trim();

  // 1. Try Gemini
  if (geminiKey && geminiKey !== 'dummy_gemini_key_for_testing') {
    try {
      const geminiQuestions = await extractWithGemini(prompt, geminiKey);
      if (geminiQuestions && geminiQuestions.length > 0) return geminiQuestions;
    } catch (err) {
      console.warn(`[PDF AI] Switching to Groq (${err.message})`);
    }
  }

  // 2. Try Groq
  if (groqKey) {
    try {
      const groqQuestions = await extractWithGroq(prompt, groqKey, chunkText, { category, topic, difficulty, count });
      if (groqQuestions && groqQuestions.length > 0) return groqQuestions;
    } catch (err) {
      console.warn(`[PDF AI] Switching to Hugging Face (${err.message})`);
    }
  }

  // 3. Try Hugging Face
  if (hfKey) {
    try {
      const hfQuestions = await extractWithHuggingFace(prompt, hfKey);
      if (hfQuestions && hfQuestions.length > 0) return hfQuestions;
    } catch (err) {
      console.warn(`[PDF AI] Hugging Face failed: ${err.message}`);
    }
  }

  return [];
}

/**
 * 7. Heuristic Regex-Based Fallback Parser
 */
function heuristicExtract(text, defaultCategory = 'Quantitative Aptitude', defaultTopic = 'General', defaultDifficulty = 'Medium') {
  if (!text || typeof text !== 'string') return [];

  const questions = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let currentQ = null;

  const qStartRegex = /^(?:(?:Q(?:uestion)?\.?\s*\d+)|(?:\d+[\.\)\-]))\s*(.*)/i;
  const optionRegex = /^(?:[\(\[]?([A-Da-d1-4])[\)\]\.\:\-]\s*|\b([A-Da-d])\s*[\)\.\-]\s*)(.*)/;
  const answerRegex = /(?:Answer|Ans|Correct\s*Option|Key)[\s\:\-]+([A-Da-d]|\d+|[^\n]+)/i;
  const explanationRegex = /(?:Explanation|Solution|Rationale)[\s\:\-]+(.*)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const qMatch = line.match(qStartRegex);
    if (qMatch) {
      if (currentQ && currentQ.questionText && currentQ.options.length >= 2) {
        questions.push(finalizeQuestion(currentQ, defaultDifficulty));
      }
      currentQ = {
        questionText: qMatch[1] || line,
        options: [],
        correctAnswer: '',
        explanation: '',
        difficulty: defaultDifficulty
      };
      continue;
    }

    if (!currentQ) {
      if (
        line.endsWith('?') ||
        line.toLowerCase().includes('what') ||
        line.toLowerCase().includes('find') ||
        line.toLowerCase().includes('calculate')
      ) {
        currentQ = {
          questionText: line,
          options: [],
          correctAnswer: '',
          explanation: '',
          difficulty: defaultDifficulty
        };
      }
      continue;
    }

    const ansMatch = line.match(answerRegex);
    if (ansMatch) {
      currentQ.correctAnswer = ansMatch[1].trim();
      continue;
    }

    const expMatch = line.match(explanationRegex);
    if (expMatch) {
      currentQ.explanation = expMatch[1].trim();
      continue;
    }

    const optMatch = line.match(optionRegex);
    if (optMatch && currentQ.options.length < 4) {
      const optText = (optMatch[3] || optMatch[0]).trim();
      if (optText) {
        currentQ.options.push(optText);
      }
      continue;
    }

    if (currentQ.options.length === 0) {
      currentQ.questionText += ' ' + line;
    } else if (currentQ.options.length > 0 && currentQ.options.length <= 4 && !currentQ.correctAnswer) {
      currentQ.options[currentQ.options.length - 1] += ' ' + line;
    } else if (currentQ.explanation) {
      currentQ.explanation += ' ' + line;
    }
  }

  if (currentQ && currentQ.questionText && currentQ.options.length >= 2) {
    questions.push(finalizeQuestion(currentQ, defaultDifficulty));
  }

  return questions;
}

function finalizeQuestion(q, defaultDifficulty) {
  const options = Array.isArray(q.options) ? [...q.options] : [];
  while (options.length < 4) {
    options.push(`Option ${String.fromCharCode(65 + options.length)}`);
  }
  const slicedOpts = options.slice(0, 4);

  let matchedAns = slicedOpts[0];
  if (q.correctAnswer) {
    const clean = String(q.correctAnswer).toLowerCase().trim();
    if (clean === 'a' || clean === '1' || clean === 'option a') matchedAns = slicedOpts[0];
    else if (clean === 'b' || clean === '2' || clean === 'option b') matchedAns = slicedOpts[1];
    else if (clean === 'c' || clean === '3' || clean === 'option c') matchedAns = slicedOpts[2];
    else if (clean === 'd' || clean === '4' || clean === 'option d') matchedAns = slicedOpts[3];
    else {
      const found = slicedOpts.find((o) => o.toLowerCase().trim() === clean || o.toLowerCase().includes(clean));
      if (found) matchedAns = found;
    }
  }

  return {
    questionText: String(q.questionText || 'Question statement').trim(),
    codeSnippet: q.codeSnippet || '',
    options: slicedOpts,
    correctAnswer: matchedAns,
    explanation: String(q.explanation || `Correct answer is ${matchedAns}.`).trim(),
    difficulty: q.difficulty || defaultDifficulty || 'Medium',
    type: 'mcq',
    marks: 1
  };
}

/**
 * 8. Deduplicate questions across chunks
 */
function deduplicateQuestions(questions) {
  const seen = new Set();
  const unique = [];

  for (const q of questions) {
    if (!q || !q.questionText) continue;
    const normalizedKey = q.questionText
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 80);

    if (!seen.has(normalizedKey)) {
      seen.add(normalizedKey);
      unique.push(q);
    }
  }

  return unique;
}

/**
 * 9. Main Orchestrator: Extract Questions from PDF Text
 */
async function extractQuestionsFromPdfText({ pdfText, category = 'Quantitative Aptitude', topic = 'General', difficulty = 'Medium', count = 10 }) {
  const cleanedText = cleanPdfText(pdfText);
  if (!cleanedText) {
    console.warn('[PDF AI] Empty or invalid PDF text received.');
    return [];
  }

  console.log(`[PDF AI] Starting extraction`);
  console.log(`[PDF AI] Extracted ${cleanedText.length} characters`);

  const chunks = splitTextIntoChunks(cleanedText, PDF_CONFIG.CHUNK_CHAR_LIMIT, PDF_CONFIG.MAX_CHUNKS);
  console.log(`[PDF AI] Created ${chunks.length} chunks`);

  const targetTotal = Math.min(Math.max(parseInt(count, 10) || 10, 1), 50);
  const questionsPerChunk = Math.max(Math.ceil(targetTotal / chunks.length), 3);
  const accumulatedQuestions = [];

  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx];
    console.log(`[PDF AI] Processing chunk ${idx + 1}/${chunks.length} (${chunk.length} chars)...`);

    try {
      const extracted = await extractChunkWithFallback({
        chunkText: chunk,
        category,
        topic,
        difficulty,
        count: questionsPerChunk
      });

      if (Array.isArray(extracted) && extracted.length > 0) {
        accumulatedQuestions.push(...extracted);
      }
    } catch (chunkErr) {
      console.warn(`[PDF AI] Chunk ${idx + 1} extraction failed: ${chunkErr.message}`);
    }

    if (accumulatedQuestions.length >= targetTotal * 1.5) {
      break;
    }
  }

  // 10. Deduplicate and normalize accumulated questions
  let validQuestions = deduplicateQuestions(accumulatedQuestions).map((q) => finalizeQuestion(q, difficulty));

  // 11. Heuristic fallback if AI extraction yielded insufficient questions
  if (validQuestions.length < targetTotal) {
    console.log(`[PDF AI] AI yielded ${validQuestions.length}/${targetTotal} questions. Running heuristic parser...`);
    const heuristicResults = heuristicExtract(cleanedText, category, topic, difficulty);
    const deduplicatedHeuristic = deduplicateQuestions([...validQuestions, ...heuristicResults]);
    validQuestions = deduplicatedHeuristic.map((q) => finalizeQuestion(q, difficulty));
  }

  // 12. Grounded academic generator fallback if still under target (e.g. image-only / binary scanned PDF)
  if (validQuestions.length < targetTotal) {
    const deficit = targetTotal - validQuestions.length;
    console.log(`[PDF AI] Topping up ${deficit} questions via academic generator...`);
    try {
      const { generateQuestionsAI } = require('./aiQuestionGenerator');
      const fallbackQuestions = await generateQuestionsAI({
        provider: 'groq',
        module: 'Aptitude',
        category,
        topic,
        difficulty,
        count: deficit
      });
      if (Array.isArray(fallbackQuestions) && fallbackQuestions.length > 0) {
        validQuestions.push(...fallbackQuestions);
      }
    } catch (fbErr) {
      console.warn(`[PDF AI] Academic fallback top-up error: ${fbErr.message}`);
    }
  }

  const finalResult = validQuestions.slice(0, targetTotal);
  console.log(`[PDF AI] Extraction completed. Returning ${finalResult.length} questions.`);
  return finalResult;
}

module.exports = {
  extractQuestionsFromPdfText,
  heuristicExtract
};
