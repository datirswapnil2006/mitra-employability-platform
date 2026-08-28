const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

/**
 * Heuristic & AI-assisted parser to extract multiple choice questions from PDF text
 */
function heuristicExtract(text, defaultCategory = 'Quantitative Aptitude', defaultTopic = 'General', defaultDifficulty = 'Medium') {
  if (!text || typeof text !== 'string') return [];

  const questions = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let currentQ = null;

  const qStartRegex = /^(?:(?:Q(?:uestion)?\.?\s*\d+)|(?:\d+[\.\)\-]))\s*(.*)/i;
  const optionRegex = /^(?:[\(\[]?([A-Da-d1-4])[\)\]\.\:\-]\s*|\b([A-Da-d])\s*[\)\.\-]\s*)(.*)/;
  const answerRegex = /(?:Answer|Ans|Correct\s*Option|Key)[\s\:\-]+([A-Da-d]|\d+|[^\n]+)/i;
  const explanationRegex = /(?:Explanation|Solution|Rationale)[\s\:\-]+(.*)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check Question Start
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
      // If no question started yet, create one if line ends with '?' or looks like a question
      if (line.endsWith('?') || line.toLowerCase().includes('what') || line.toLowerCase().includes('find') || line.toLowerCase().includes('calculate')) {
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

    // Check Answer
    const ansMatch = line.match(answerRegex);
    if (ansMatch) {
      const rawAns = ansMatch[1].trim();
      currentQ.correctAnswer = rawAns;
      continue;
    }

    // Check Explanation
    const expMatch = line.match(explanationRegex);
    if (expMatch) {
      currentQ.explanation = expMatch[1].trim();
      continue;
    }

    // Check Option (A, B, C, D)
    const optMatch = line.match(optionRegex);
    if (optMatch && currentQ.options.length < 4) {
      const optText = (optMatch[3] || optMatch[0]).trim();
      if (optText) {
        currentQ.options.push(optText);
      }
      continue;
    }

    // Append to existing text
    if (currentQ.options.length === 0) {
      currentQ.questionText += ' ' + line;
    } else if (currentQ.options.length > 0 && currentQ.options.length <= 4 && !currentQ.correctAnswer) {
      // Append to last option
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
  // Ensure 4 options
  while (q.options.length < 4) {
    q.options.push(`Option ${String.fromCharCode(65 + q.options.length)}`);
  }
  q.options = q.options.slice(0, 4);

  // Match correct answer
  let matchedAns = q.options[0];
  if (q.correctAnswer) {
    const clean = q.correctAnswer.toLowerCase().trim();
    if (clean === 'a' || clean === '1') matchedAns = q.options[0];
    else if (clean === 'b' || clean === '2') matchedAns = q.options[1];
    else if (clean === 'c' || clean === '3') matchedAns = q.options[2];
    else if (clean === 'd' || clean === '4') matchedAns = q.options[3];
    else {
      const found = q.options.find(o => o.toLowerCase().trim() === clean || o.toLowerCase().includes(clean));
      if (found) matchedAns = found;
    }
  }

  return {
    questionText: q.questionText.trim(),
    codeSnippet: '',
    options: q.options,
    correctAnswer: matchedAns,
    explanation: q.explanation.trim() || `Correct answer is ${matchedAns}.`,
    difficulty: q.difficulty || defaultDifficulty || 'Medium',
    type: 'mcq',
    marks: 1
  };
}

async function extractQuestionsFromPdfText({ pdfText, category, topic, difficulty = 'Medium', count = 5 }) {
  if (!pdfText || !pdfText.trim()) return [];

  // Try AI-assisted extraction first if Gemini/Groq key is available for high precision
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const prompt = `You are an expert exam extractor and assessment architect.
Extract up to ${count} multiple choice questions (MCQs) strictly from the following document text.
Category: "${category || 'Quantitative Aptitude'}"
Topic: "${topic || 'General'}"
Difficulty: "${difficulty}"

DOCUMENT TEXT:
"""
${pdfText.slice(0, 8000)}
"""

CRITICAL INSTRUCTIONS:
1. Extract or formulate clear MCQs directly based on the questions in the text.
2. Every question must have exactly 4 options.
3. Determine or infer the correctAnswer matching one of the 4 options.
4. Provide a step-by-step explanation.
5. Return ONLY a valid JSON array of question objects without markdown tags.

Required JSON Structure:
[
  {
    "questionText": "Question statement...",
    "codeSnippet": "",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Detailed explanation...",
    "difficulty": "${difficulty}",
    "type": "mcq",
    "marks": 1
  }
]`;

  if (geminiKey) {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const geminiModels = ['gemini-3.6-flash', 'gemini-3.5-flash'];
    for (const model of geminiModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt
        });
        const raw = response.text || '';
        const stripped = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(stripped);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn(`[PDF Extraction Gemini ${model} fallback]:`, e.message);
      }
    }
  }

  if (groqKey) {
    const groqModels = ['qwen/qwen3.6-27b', 'openai/gpt-oss-120b', 'groq/compound'];
    for (const model of groqModels) {
      try {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert exam extractor. Return strict JSON array of questions only.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.1
          },
          { headers: { Authorization: `Bearer ${groqKey}` }, timeout: 15000 }
        );
        const content = response.data?.choices?.[0]?.message?.content || '';
        const stripped = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(stripped);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn(`[PDF Extraction Groq ${model} fallback]:`, e.message);
      }
    }
  }

  // Fallback to heuristic parser
  const heuristicQuestions = heuristicExtract(pdfText, category, topic, difficulty);
  if (heuristicQuestions.length > 0) {
    return heuristicQuestions.slice(0, count);
  }

  // If text was unstructured or binary, generate questions matching category and topic
  try {
    const { generateQuestionsAI } = require('./aiQuestionGenerator');
    const fallbackQuestions = await generateQuestionsAI({
      provider: 'gemini',
      module: 'Aptitude',
      category,
      topic,
      difficulty,
      count
    });
    if (fallbackQuestions && fallbackQuestions.length > 0) {
      return fallbackQuestions;
    }
  } catch (err) {
    console.warn('[PDF Extraction Fallback AI Generator]:', err.message);
  }

  return [];
}

module.exports = {
  extractQuestionsFromPdfText,
  heuristicExtract
};
