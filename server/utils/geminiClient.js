const { GoogleGenAI } = require('@google/genai');

/**
 * Robust Google Gemini Client for AI Question Generation
 * Features:
 * - Native OpenAPI/JSON Schema structured output
 * - Bounded retries with exponential backoff & jitter
 * - Clear separation of transient (429/503/timeout) vs permanent errors (401/403/invalid key)
 * - Configurable model fallback priority chain
 * - Request timeouts and token / cost estimation
 * - Secure API key handling (never logged or exposed)
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = (promise, ms = 25000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const err = new Error(`Gemini API request timed out after ${ms}ms`);
      err.code = 'ETIMEDOUT';
      err.status = 504;
      setTimeout(() => reject(err), ms);
    })
  ]);
};

// Pricing rates per 1,000,000 tokens (USD)
const MODEL_PRICING = {
  'gemini-2.5-flash': { prompt: 0.075, candidate: 0.30 },
  'gemini-2.0-flash': { prompt: 0.10, candidate: 0.40 },
  'gemini-1.5-flash': { prompt: 0.075, candidate: 0.30 },
  'gemini-2.5-flash-lite': { prompt: 0.05, candidate: 0.20 },
  'gemini-3.5-flash': { prompt: 0.10, candidate: 0.40 },
  default: { prompt: 0.075, candidate: 0.30 }
};

const estimateTokenCost = (promptTokens = 0, candidateTokens = 0, model = 'default') => {
  const rate = MODEL_PRICING[model] || MODEL_PRICING.default;
  const promptCost = (promptTokens / 1_000_000) * rate.prompt;
  const candidateCost = (candidateTokens / 1_000_000) * rate.candidate;
  return parseFloat((promptCost + candidateCost).toFixed(6));
};

const isPermanentError = (err) => {
  if (!err) return false;
  const status = err.status || err.statusCode || (err.response && err.response.status);
  const msg = String(err.message || '').toLowerCase();

  // 401 / 403 Authentication / Key errors
  if (status === 401 || status === 403) return true;
  if (msg.includes('api key not valid') || msg.includes('unauthenticated') || msg.includes('permission_denied')) return true;

  // 400 Bad Request with invalid prompt/schema (not retryable without changes)
  if (status === 400 && (msg.includes('invalid argument') || msg.includes('invalid_argument'))) return true;

  return false;
};

const isTransientError = (err) => {
  if (!err) return false;
  if (isPermanentError(err)) return false;

  const status = err.status || err.statusCode || (err.response && err.response.status);
  const code = err.code || '';
  const msg = String(err.message || '').toLowerCase();

  return (
    status === 429 ||
    status === 503 ||
    status === 504 ||
    status === 500 ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'EAI_AGAIN' ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('quota exceeded') ||
    msg.includes('timed out') ||
    msg.includes('timeout') ||
    msg.includes('overloaded') ||
    msg.includes('temporarily unavailable') ||
    msg.includes('network') ||
    msg.includes('fetch failed')
  );
};

const cleanAndParseJson = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const stripped = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    if (parsed && typeof parsed === 'object') return [parsed];
  } catch (e) {
    // Substring fallback between [ and ]
    const firstB = stripped.indexOf('[');
    const lastB = stripped.lastIndexOf(']');
    if (firstB !== -1 && lastB > firstB) {
      try {
        const sub = stripped.substring(firstB, lastB + 1);
        const parsed = JSON.parse(sub);
        if (Array.isArray(parsed)) return parsed;
      } catch (inner) {}
    }
  }
  return null;
};

// Structured Output Schema Definition for Gemini config
const buildQuestionResponseSchema = () => {
  return {
    type: 'array',
    description: 'List of verified multiple choice assessment questions',
    items: {
      type: 'object',
      properties: {
        questionText: { type: 'string', description: 'The complete question problem statement' },
        codeSnippet: { type: 'string', description: 'Optional formatted code snippet or context' },
        options: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exactly 4 distinct, unambiguous answer options'
        },
        correctAnswer: { type: 'string', description: 'The exact string matching one of the options' },
        explanation: { type: 'string', description: 'Step-by-step verified rationale of the answer' },
        difficulty: { type: 'string', description: 'Easy, Medium, or Hard' },
        marks: { type: 'integer', description: 'Marks awarded for the question' },
        schemaSql: { type: 'string', description: 'DDL CREATE TABLE statements for SQL questions' },
        referenceQuery: { type: 'string', description: 'Reference SQL query for SQL questions' },
        competency: { type: 'string', description: 'Behavioral or technical competency evaluated' }
      },
      required: ['questionText', 'options', 'correctAnswer', 'explanation']
    }
  };
};

/**
 * Generates a batch of questions using Google Gemini with structured output,
 * retries with backoff/jitter, and fallback models.
 */
const generateQuestionsWithGemini = async ({
  prompt,
  systemInstruction = '',
  apiKey = null,
  timeoutMs = 25000,
  maxRetries = 2,
  jobId = 'direct'
}) => {
  const resolvedKey = (apiKey || process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY || '').trim();

  if (!resolvedKey || resolvedKey === 'dummy_gemini_key_for_testing') {
    const keyError = new Error('GEMINI_API_KEY is not configured or is a testing placeholder.');
    keyError.isPermanent = true;
    keyError.code = 'NO_API_KEY';
    throw keyError;
  }

  const ai = new GoogleGenAI({ apiKey: resolvedKey });

  // Priority Model Chain
  const modelsToTry = Array.from(
    new Set(
      [
        process.env.GEMINI_MODEL,
        process.env.GEMINI_FALLBACK_MODEL,
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-3.5-flash'
      ].filter(Boolean)
    )
  );

  let lastError = null;

  for (const modelName of modelsToTry) {
    const baseDelay = 1200;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();
      try {
        const genConfig = {
          responseMimeType: 'application/json',
          responseSchema: buildQuestionResponseSchema(),
          temperature: 0.2
        };

        if (systemInstruction) {
          genConfig.systemInstruction = systemInstruction;
        }

        const response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: genConfig
          }),
          timeoutMs
        );

        const durationMs = Date.now() - startTime;
        const rawText = response.text || '';
        const parsed = cleanAndParseJson(rawText);

        // Token Usage Tracking
        const usage = response.usageMetadata || {};
        const promptTokens = usage.promptTokenCount || 0;
        const candidateTokens = usage.candidatesTokenCount || 0;
        const totalTokens = usage.totalTokenCount || (promptTokens + candidateTokens);
        const costUsd = estimateTokenCost(promptTokens, candidateTokens, modelName);

        // Structured Logging
        console.log(
          JSON.stringify({
            event: 'gemini_generation_success',
            jobId,
            model: modelName,
            attempt,
            durationMs,
            tokens: { prompt: promptTokens, candidate: candidateTokens, total: totalTokens },
            costUsd,
            questionsCount: Array.isArray(parsed) ? parsed.length : 0
          })
        );

        if (Array.isArray(parsed) && parsed.length > 0) {
          return {
            questions: parsed,
            modelUsed: modelName,
            tokenUsage: { promptTokens, candidateTokens, totalTokens, estimatedCostUsd: costUsd },
            latencyMs: durationMs
          };
        }

        // If returned text couldn't be parsed into questions, try next attempt or model
        throw new Error(`Failed to parse structured JSON from model ${modelName} response.`);
      } catch (err) {
        lastError = err;
        const durationMs = Date.now() - startTime;
        const status = err.status || err.statusCode || (err.response && err.response.status) || 'unknown';
        const transient = isTransientError(err);
        const permanent = isPermanentError(err);

        console.warn(
          JSON.stringify({
            event: 'gemini_generation_error',
            jobId,
            model: modelName,
            attempt,
            durationMs,
            status,
            transient,
            permanent,
            message: err.message
          })
        );

        if (permanent) {
          // Do not retry permanent authorization or configuration errors
          const permErr = new Error(`Gemini permanent error (${status}): ${err.message}`);
          permErr.isPermanent = true;
          permErr.status = status;
          throw permErr;
        }

        if (transient && attempt < maxRetries) {
          // Bounded exponential backoff with jitter
          const delay = baseDelay * Math.pow(2, attempt) + Math.floor(Math.random() * 400);
          console.warn(`[Gemini Backoff]: Retrying ${modelName} attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
          await sleep(delay);
        } else {
          // Move to next fallback model in chain
          break;
        }
      }
    }
  }

  throw lastError || new Error('Gemini question generation failed across all available models.');
};

module.exports = {
  generateQuestionsWithGemini,
  estimateTokenCost,
  isPermanentError,
  isTransientError,
  cleanAndParseJson,
  buildQuestionResponseSchema
};
