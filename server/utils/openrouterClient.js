/**
 * OpenRouter AI Client for AI Question Generation (Free Tier Models)
 * Uses OpenRouter OpenAI-compatible chat completions API.
 */

const { cleanAndParseJson } = require('./geminiClient');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = (promise, ms = 25000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const err = new Error(`OpenRouter API request timed out after ${ms}ms`);
      err.code = 'ETIMEDOUT';
      err.status = 504;
      setTimeout(() => reject(err), ms);
    })
  ]);
};

const OPENROUTER_FREE_MODELS = [
  process.env.OPENROUTER_MODEL,
  'liquid/lfm-2.5-2.6b:free',
  'nvidia/nemotron-3.5-lightning:free'
].filter(Boolean);

/**
 * Generates questions using OpenRouter free endpoints
 */
const generateQuestionsWithOpenRouter = async ({
  prompt,
  systemInstruction = '',
  apiKey = null,
  timeoutMs = 9000,
  maxRetries = 1,
  jobId = 'direct_openrouter'
}) => {
  const resolvedKey = (apiKey || process.env.OPENROUTER_API_KEY || '').trim();

  if (!resolvedKey) {
    const keyError = new Error('OPENROUTER_API_KEY is not configured.');
    keyError.isPermanent = true;
    keyError.code = 'NO_API_KEY';
    throw keyError;
  }

  const modelsToTry = Array.from(new Set(OPENROUTER_FREE_MODELS));
  let lastError = null;

  const fullPrompt = `${systemInstruction ? `${systemInstruction}\n\n` : ''}${prompt}

CRITICAL JSON FORMAT RULE:
Output ONLY a raw, valid JSON array of objects conforming to the schema:
[
  {
    "questionText": "...",
    "options": ["...", "...", "...", "..."],
    "correctAnswer": "...",
    "explanation": "...",
    "difficulty": "Easy" | "Medium" | "Hard"
  }
]
Do NOT include markdown formatting or conversational commentary outside the JSON array.`;

  for (const modelName of modelsToTry) {
    const baseDelay = 1200;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();
      try {
        const response = await withTimeout(
          fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resolvedKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:5000',
              'X-Title': 'Mitra Employability Portal'
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert assessment creator. Return strictly raw valid JSON array matching the requested schema without any markdown wrapping or conversational filler.'
                },
                {
                  role: 'user',
                  content: fullPrompt
                }
              ],
              temperature: 0.3
            })
          }),
          timeoutMs
        );

        const durationMs = Date.now() - startTime;

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error?.message || errData.message || `HTTP ${response.status}`;
          const err = new Error(errMsg);
          err.status = response.status;
          err.code = errData.error?.code || response.status;

          if (response.status === 401 || response.status === 403) {
            err.isPermanent = true;
            throw err;
          }

          if (response.status === 404 || errMsg.includes('not found') || errMsg.includes('no longer available')) {
            console.warn(`[OpenRouter Fallback]: Model ${modelName} not available (${errMsg}). Trying next model...`);
            break; // Try next model immediately
          }

          throw err;
        }

        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content || '';
        const parsed = cleanAndParseJson(rawText);

        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(
            JSON.stringify({
              event: 'openrouter_generation_success',
              jobId,
              model: modelName,
              attempt,
              durationMs,
              questionsCount: parsed.length
            })
          );

          return {
            questions: parsed,
            modelUsed: modelName,
            tokenUsage: data.usage || {},
            latencyMs: durationMs
          };
        }

        throw new Error(`Failed to parse structured JSON from OpenRouter model ${modelName} response.`);
      } catch (err) {
        lastError = err;
        const durationMs = Date.now() - startTime;
        const status = err.status || 'unknown';

        console.warn(
          JSON.stringify({
            event: 'openrouter_generation_error',
            jobId,
            model: modelName,
            attempt,
            durationMs,
            status,
            message: err.message
          })
        );

        if (err.isPermanent) {
          throw err;
        }

        if (status === 429 && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.floor(Math.random() * 500);
          console.warn(`[OpenRouter Backoff]: Retrying ${modelName} attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
          await sleep(delay);
        } else {
          break; // Next model in chain
        }
      }
    }
  }

  throw lastError || new Error('OpenRouter generation failed across all available models.');
};

module.exports = {
  generateQuestionsWithOpenRouter,
  OPENROUTER_FREE_MODELS
};
