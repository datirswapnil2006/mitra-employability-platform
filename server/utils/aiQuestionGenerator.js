const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

/**
 * Multi-LLM AI Question Generator for MITRA Question Bank
 * Supports: Google Gemini, Groq Cloud, Hugging Face, and grounded fallback.
 */

const generatePrompt = ({ module, category, department, topic, difficulty, count }) => {
  const domainContext = department ? `Department: ${department}` : '';
  return `You are a premier technical assessment architect and recruitment exam creator for top engineering companies.
Generate exactly ${count} high-quality, academic and industry-level multiple choice questions (MCQs) for the following topic:

Domain / Module: "${module}"
Category: "${category}"
${domainContext}
Topic: "${topic}"
Difficulty Level: "${difficulty}" (Easy / Medium / Hard)

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

const cleanAndParseJson = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const stripped = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // Try direct parse
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
    if (parsed && typeof parsed === 'object') return [parsed];
  } catch (e) {
    // Attempt to extract JSON array substring
    const match = stripped.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      try {
        const extracted = JSON.parse(match[0]);
        if (Array.isArray(extracted) && extracted.length > 0) return extracted;
      } catch (innerE) {}
    }
  }
  return null;
};

// 1. Google Gemini Provider
const generateWithGemini = async (prompt, apiKey) => {
  const ai = new GoogleGenAI({ apiKey });
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });

      const parsed = cleanAndParseJson(response.text || '');
      if (parsed) return parsed;
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Provider]: Model '${modelName}' unavailable (${err.message}). Trying backup model...`);
    }
  }
  throw lastError || new Error('Gemini question generation failed.');
};

// 2. Groq Cloud Provider
const generateWithGroq = async (prompt, apiKey) => {
  const modelsToTry = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
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
          temperature: 0.2
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const rawContent = response.data?.choices?.[0]?.message?.content;
      if (!rawContent) continue;

      const parsed = cleanAndParseJson(rawContent);
      if (parsed) return parsed;
    } catch (err) {
      lastError = err;
      console.warn(`[Groq Provider]: Model '${modelName}' error: ${err.message}. Trying next Groq model...`);
    }
  }
  throw lastError || new Error('Groq question generation failed.');
};

// 3. Hugging Face Inference API Provider
const generateWithHuggingFace = async (prompt, apiKey) => {
  const response = await axios.post(
    'https://router.huggingface.co/hf-inference/v1/chat/completions',
    {
      model: 'meta-llama/Llama-3.2-3B-Instruct',
      messages: [
        {
          role: 'system',
          content: 'You are an expert MCQ examination creator. Output only valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2048,
      temperature: 0.3
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 18000
    }
  );

  const rawContent = response.data?.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error('No content returned from Hugging Face');

  const parsed = cleanAndParseJson(rawContent);
  if (parsed) return parsed;
  throw new Error('Hugging Face response could not be parsed into JSON');
};

// 4. Grounded Rule-Based Academic Fallback Generator
const generateAcademicFallback = ({ module, category, topic, difficulty, count }) => {
  const questions = [];
  const diff = difficulty || 'Medium';

  for (let i = 1; i <= count; i++) {
    if (module === 'Aptitude') {
      questions.push({
        questionText: `In the topic of ${topic} (${category}), what is the primary mathematical or logical rule applied to solve standard placement problems?`,
        codeSnippet: '',
        options: [
          `Proportional scaling and formulaic simplification of ${topic}`,
          `Arbitrary random estimation without standardized formulas`,
          `Linear negation without constraint validation`,
          `None of the above`
        ],
        correctAnswer: `Proportional scaling and formulaic simplification of ${topic}`,
        explanation: `Standard aptitude problems in ${topic} rely on systematic constraint analysis and formulaic proportional reductions.`,
        difficulty: diff,
        type: 'mcq',
        marks: 1
      });
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

/**
 * Main AI Generation Handler with Cascading Provider Fallback:
 * Groq -> Gemini -> Hugging Face -> Academic Fallback
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

  // Define preferred execution order based on requested provider or auto-mode
  const tryOrder = [];
  if (provider === 'gemini') {
    tryOrder.push('gemini', 'groq', 'huggingface');
  } else if (provider === 'groq') {
    tryOrder.push('groq', 'gemini', 'huggingface');
  } else if (provider === 'huggingface') {
    tryOrder.push('huggingface', 'groq', 'gemini');
  } else {
    // Default Auto preference: Groq -> Gemini -> Hugging Face
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
        questions = await generateWithGroq(prompt, groqKey);
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

  // If all providers failed or keys not configured, use calibrated academic fallback
  if (!generatedSuccessfully || !Array.isArray(questions) || questions.length === 0) {
    console.warn('[AI Question Generator]: All external LLM providers were unavailable. Using grounded academic fallback.');
    questions = generateAcademicFallback({ module, category, topic, difficulty, count });
    resolvedProvider = 'fallback';
  }

  // Format and validate returned questions
  return questions.slice(0, count).map((q) => ({
    module,
    category,
    department: module === 'Domain' ? (department || category) : null,
    topic,
    questionText: q.questionText || `Question on ${topic}`,
    codeSnippet: q.codeSnippet || '',
    options: Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: q.correctAnswer || (q.options ? q.options[0] : 'Option A'),
    explanation: q.explanation || `Correct answer is verified for ${topic}.`,
    difficulty: q.difficulty || difficulty,
    marks: q.marks || 1,
    type: q.type || 'mcq',
    aiGenerated: true,
    aiProvider: resolvedProvider
  }));
};

module.exports = { generateQuestionsAI };
