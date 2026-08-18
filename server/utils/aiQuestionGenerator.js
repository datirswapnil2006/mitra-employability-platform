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

// 1. Google Gemini Provider
const generateWithGemini = async (prompt, apiKey) => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  const textOutput = response.text || '';
  const cleanedText = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanedText);
};

// 2. Groq Cloud Provider (Llama 3.3 / Mixtral)
const generateWithGroq = async (prompt, apiKey) => {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert assessment generator. Always output strict JSON arrays only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
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
  if (!rawContent) throw new Error('No content returned from Groq');

  const parsed = JSON.parse(rawContent);
  if (Array.isArray(parsed)) return parsed;
  if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
  return [parsed];
};

// 3. Hugging Face Inference API Provider (Llama 3 / Mistral)
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

  const cleaned = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  if (Array.isArray(parsed)) return parsed;
  if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
  return [parsed];
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
 * Main AI Generation Handler
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

  const geminiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;
  const groqKey = (process.env.GROQ_API_KEY || process.env.Groq_API_KEY || '').trim();
  const hfKey = (
    process.env.HF_API_KEY ||
    process.env.HUGGINGFACE_API_KEY ||
    process.env.HuggingFace_API_KEY ||
    ''
  ).trim();

  try {
    if (provider === 'gemini' && geminiKey && geminiKey !== 'dummy_gemini_key_for_testing') {
      questions = await generateWithGemini(prompt, geminiKey);
    } else if (provider === 'groq' && groqKey) {
      questions = await generateWithGroq(prompt, groqKey);
    } else if (provider === 'huggingface' && hfKey) {
      questions = await generateWithHuggingFace(prompt, hfKey);
    } else {
      // Auto-fallback to any available configured key
      if (geminiKey && geminiKey !== 'dummy_gemini_key_for_testing') {
        questions = await generateWithGemini(prompt, geminiKey);
        resolvedProvider = 'gemini';
      } else if (groqKey) {
        questions = await generateWithGroq(prompt, groqKey);
        resolvedProvider = 'groq';
      } else if (hfKey) {
        questions = await generateWithHuggingFace(prompt, hfKey);
        resolvedProvider = 'huggingface';
      } else {
        questions = generateAcademicFallback({ module, category, topic, difficulty, count });
        resolvedProvider = 'fallback';
      }
    }
  } catch (err) {
    console.warn(`[AI Generator Error - ${provider}]:`, err.message);
    // Graceful fallback to grounded academic questions
    questions = generateAcademicFallback({ module, category, topic, difficulty, count });
    resolvedProvider = 'fallback';
  }

  // Format and validate returned questions
  return questions.map((q) => ({
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
