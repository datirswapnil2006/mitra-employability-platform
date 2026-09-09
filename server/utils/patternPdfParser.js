const pdfParse = require('pdf-parse/lib/pdf-parse.js');

/**
 * Pattern-Based PDF Question Extractor
 * Extracts text locally using pdf-parse and parses MCQs using deterministic regex patterns.
 * ZERO LLM calls - 100% offline and deterministic.
 */

// Common header/footer noise patterns to filter out
const NOISE_PATTERNS = [
  /^Page\s+\d+(\s+of\s+\d+)?$/i,
  /^---\s*Page\s+\d+\s*---$/i,
  /^\d+\s*\/\s*\d+$/,
  /^Copyright\s*©?.*$/i,
  /^All\s+rights\s+reserved.*$/i,
  /^www\.[a-z0-9\.\-]+\.[a-z]{2,}/i,
  /^https?:\/\/[^\s]+/i
];

/**
 * Clean and normalize text from PDF
 */
function cleanExtractedText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  return rawText
    // Remove null bytes and non-printable control characters (keep newlines & tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Normalize smart quotes and dashes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    // Normalize spaces (retain newlines)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      // Filter out common header/footer page markers
      if (!line) return false;
      return !NOISE_PATTERNS.some((pattern) => pattern.test(line));
    })
    .join('\n');
}

/**
 * Extract answer key section from the end of the document if present
 * E.g., "Answer Key: 1. A, 2. B, 3. C" or "Answers: 1-A, 2-B"
 */
function extractGlobalAnswerKey(text) {
  const answerKeyMap = new Map();
  const answerKeyHeaderRegex = /(?:ANSWER\s*KEY|ANSWERS|KEY\s*ANSWERS)[\s\:\-]+([\s\S]+)$/i;
  const match = text.match(answerKeyHeaderRegex);

  if (match && match[1]) {
    const keySection = match[1];
    // Match patterns like: 1. A, 1) B, 1 - C, Q1: D, 1: A
    const itemRegex = /(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\)\-\:\s]+([A-Da-d1-4])\b/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(keySection)) !== null) {
      if (itemMatch.index === itemRegex.lastIndex) {
        itemRegex.lastIndex++;
      }
      const qNum = parseInt(itemMatch[1], 10);
      const ansLetter = itemMatch[2].toUpperCase();
      answerKeyMap.set(qNum, ansLetter);
    }
  }

  return answerKeyMap;
}

/**
 * Split text into raw question blocks based on question starters
 */
function splitIntoQuestionBlocks(text) {
  // Regex to match question numbering at start of a line
  // Matches: "1.", "1)", "1-", "(1)", "Q1.", "Q1:", "Q.1", "Question 1:", "Que 1.", "Ques 1:"
  const questionStartRegex = /(?:^|\n)\s*(?:(?:Q(?:uestion|ue|ues)?\.?\s*(\d+)[\.\)\-\:\s]*)|(?:\((\d+)\))|(?:(\d+)[\.\)\-\:\s]))\s+/gi;

  const indices = [];
  let match;

  while ((match = questionStartRegex.exec(text)) !== null) {
    if (match.index === questionStartRegex.lastIndex) {
      questionStartRegex.lastIndex++;
    }
    const qNumStr = match[1] || match[2] || match[3];
    const qNum = parseInt(qNumStr, 10);
    indices.push({
      index: match.index,
      length: match[0].length,
      number: qNum
    });
  }

  // If no standard numbered questions found, try fallback: look for lines ending in '?' or separated by double newlines
  if (indices.length === 0) {
    const fallbackBlocks = text.split(/\n{2,}/).filter((b) => b.trim().length > 20);
    return fallbackBlocks.map((block, idx) => ({
      rawText: block.trim(),
      number: idx + 1
    }));
  }

  const blocks = [];
  for (let i = 0; i < indices.length; i++) {
    const startPos = indices[i].index + indices[i].length;
    const endPos = i + 1 < indices.length ? indices[i + 1].index : text.length;
    const rawBlock = text.substring(startPos, endPos).trim();

    if (rawBlock.length > 0) {
      blocks.push({
        rawText: rawBlock,
        number: indices[i].number || (i + 1)
      });
    }
  }

  return blocks;
}

/**
 * Parse an individual question block to extract:
 * - Question statement
 * - Option A, B, C, D
 * - Correct Answer
 * - Explanation
 */
function parseQuestionBlock(rawBlock, qNumber, globalAnswerKey = new Map(), defaultDifficulty = 'Medium') {
  let text = rawBlock.trim();

  let explanation = '';
  let correctAnswer = '';
  let answerLetter = '';

  // 1. Extract Explanation if present
  // Matches: "Explanation:", "Solution:", "Sol:", "Rationale:", "Reason:"
  const explanationRegex = /(?:Explanation|Solution|Sol|Rationale|Reason)[\s\:\-]+([\s\S]+)$/i;
  const expMatch = text.match(explanationRegex);
  if (expMatch) {
    explanation = expMatch[1].trim();
    text = text.substring(0, expMatch.index).trim();
  }

  // 2. Extract Answer if present
  // Matches standalone letter: "Answer: A", "Ans: (B)", "Correct Option: C", "Correct Answer: Option D", "Key: A"
  // Or standalone text/ratio: "Ans: 1:2", "Answer: 16:46"
  // Note: We use (?!\S) so 'Ans: 1:2' doesn't extract '1' as letter A
  const answerRegex = /(?:Correct\s*Answer|Correct\s*Option|Answer|Ans|Key)[\s\:\-]+(?:\(?([A-Da-d])\)?(?!\S)|\bOption\s*([A-Da-d])\b|([^\n\r]+))/i;
  const ansMatch = text.match(answerRegex);
  if (ansMatch) {
    answerLetter = (ansMatch[1] || ansMatch[2] || '').toUpperCase();
    if (!answerLetter && ansMatch[3]) {
      const rawAns = ansMatch[3].trim();
      if (['A', 'B', 'C', 'D'].includes(rawAns.toUpperCase())) {
        answerLetter = rawAns.toUpperCase();
      } else {
        correctAnswer = rawAns;
      }
    }
    text = text.substring(0, ansMatch.index).trim();
  }

  // Check global answer key if answer wasn't inline
  if (!answerLetter && !correctAnswer && globalAnswerKey.has(qNumber)) {
    answerLetter = globalAnswerKey.get(qNumber);
  }

  // 3. Extract Options
  let options = [];
  let questionText = text;

  // Unified robust option marker matching:
  // Handles:
  // - "Option A:", "Option B:"
  // - "1. A.", "1 A.", "2 B.", "3 C.", "4 D."
  // - "(A)", "[A]", "A.", "A)", "A:"
  // - "(1)", "[1]", "1.", "1)"
  const markerRegex = /(?:^|\s+)(?:Option\s+([A-Da-d])[\:\.\-\s]*|(?:\(?\d+[\.\)\:\-]?\s*)?[\(\[]?([A-Da-d])[\)\]\.\:\-]\s*|(?:\b|\()([A-Da-d])[\)\.\:\-]\s*|(?:\(?([1-4])[\)\]\.\:\-]\s+))(?!\d)/g;

  const matches = [];
  let m;
  while ((m = markerRegex.exec(text)) !== null) {
    const letter = (m[1] || m[2] || m[3] || '').toUpperCase();
    const num = m[4];
    const marker = letter || (num === '1' ? 'A' : num === '2' ? 'B' : num === '3' ? 'C' : num === '4' ? 'D' : '');
    matches.push({
      marker,
      index: m.index + (m[0].length - m[0].trimStart().length),
      length: m[0].trim().length,
      fullIndex: m.index,
      fullLength: m[0].length
    });
  }

  if (matches.length >= 2) {
    questionText = text.substring(0, matches[0].index).trim();
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].fullIndex + matches[i].fullLength;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      let optText = text.substring(start, end).trim();
      // Clean leading option markers if duplicated
      optText = optText.replace(/^(?:(?:\(?\d+[\.\)\:\-]?\s*)?[\(\[]?[A-Da-d][\)\]\.\:\-]?\s*)/, '').trim();
      // Clean trailing stray numbering/bullets before next option
      optText = optText.replace(/\s+[1-4•\-\|]$/, '').trim();
      if (optText) {
        options.push(optText);
      }
    }
  }

  // Fallback to line-by-line if markerRegex didn't detect enough options
  if (options.length < 2) {
    options = [];
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const optionLineRegex = /^(?:[\(\[]?([A-Da-d1-4])[\)\]\.\:\-]\s*|\b([A-Da-d])\s*[\)\.\-]\s*)(.*)/;
    const detectedOptionLines = [];
    const questionLines = [];
    let reachedOptions = false;

    for (const line of lines) {
      const optMatch = line.match(optionLineRegex);
      if (optMatch && (reachedOptions || ['A', 'a', '1'].includes(optMatch[1] || optMatch[2]))) {
        reachedOptions = true;
        const optVal = (optMatch[3] || '').trim();
        if (optVal) detectedOptionLines.push(optVal);
      } else if (reachedOptions && detectedOptionLines.length > 0 && detectedOptionLines.length < 4) {
        detectedOptionLines[detectedOptionLines.length - 1] += ' ' + line;
      } else if (!reachedOptions) {
        questionLines.push(line);
      }
    }

    if (detectedOptionLines.length >= 2) {
      options = detectedOptionLines;
      questionText = questionLines.join(' ').trim();
    }
  }

  // Clean up question text
  questionText = questionText
    .replace(/\s+/g, ' ')
    .replace(/^(?:Q(?:uestion|ue|ues)?\.?\s*\d+[\.\:\-\)]*|\d+[\.\)\-]*)\s*/i, '')
    .trim();

  // If questionText is empty or very short, use the first available snippet
  if (!questionText && text) {
    questionText = text.substring(0, 150).trim();
  }

  // Normalize options to exactly 4
  const normalizedOptions = options.map((opt) => opt.replace(/\s+/g, ' ').trim()).filter(Boolean);
  while (normalizedOptions.length < 4) {
    normalizedOptions.push(`Option ${String.fromCharCode(65 + normalizedOptions.length)}`);
  }
  const finalOptions = normalizedOptions.slice(0, 4);

  // Match correct answer
  let finalCorrectAnswer = finalOptions[0]; // fallback default
  let answerDetected = false;

  if (answerLetter) {
    let index = -1;
    if (['A', '1'].includes(answerLetter)) index = 0;
    else if (['B', '2'].includes(answerLetter)) index = 1;
    else if (['C', '3'].includes(answerLetter)) index = 2;
    else if (['D', '4'].includes(answerLetter)) index = 3;

    if (index >= 0 && index < finalOptions.length) {
      finalCorrectAnswer = finalOptions[index];
      answerDetected = true;
    }
  } else if (correctAnswer) {
    const cleanExpected = correctAnswer.toLowerCase().trim();
    // 1. Exact match
    const exact = finalOptions.find(opt => opt.toLowerCase().trim() === cleanExpected);
    if (exact) {
      finalCorrectAnswer = exact;
      answerDetected = true;
    } else {
      // 2. Whitespace-insensitive match
      const cleanNoSpace = cleanExpected.replace(/\s+/g, '');
      const noSpace = finalOptions.find(opt => opt.replace(/\s+/g, '').toLowerCase() === cleanNoSpace);
      if (noSpace) {
        finalCorrectAnswer = noSpace;
        answerDetected = true;
      }
    }
  }

  return {
    id: `extracted-${Date.now()}-${qNumber}`,
    questionNumber: qNumber,
    questionText: questionText || `Question ${qNumber}`,
    options: finalOptions,
    correctAnswer: finalCorrectAnswer,
    explanation: explanation || `Correct answer is ${finalCorrectAnswer}.`,
    difficulty: defaultDifficulty,
    type: 'mcq',
    marks: 1,
    answerDetected
  };
}

/**
 * Main function: Extracts questions from PDF buffer or text using pattern parsing
 *
 * @param {Object} params
 * @param {Buffer|null} params.pdfBuffer - Binary buffer of uploaded PDF
 * @param {string|null} params.pdfText - Raw text if already extracted
 * @param {string} [params.category] - Assessment category (e.g. 'Quantitative Aptitude')
 * @param {string} [params.topic] - Assessment topic (e.g. 'Profit and Loss')
 * @param {string} [params.difficulty] - Question difficulty ('Easy', 'Medium', 'Hard')
 * @param {number} [params.count] - Target question count
 * @returns {Promise<{ success: boolean, questions: Array, totalDetected: number, pageCount: number, message?: string }>}
 */
async function extractQuestionsWithPatterns({
  pdfBuffer,
  pdfText,
  category = 'Quantitative Aptitude',
  topic = 'General',
  difficulty = 'Medium',
  count = null
}) {
  let extractedText = '';
  let pageCount = 1;

  // 1. Extract raw text from PDF buffer using pdf-parse if buffer provided
  if (pdfBuffer && Buffer.isBuffer(pdfBuffer)) {
    if (pdfBuffer.length === 0) {
      throw new Error('Uploaded PDF file is empty (0 bytes).');
    }

    let timeoutId;
    try {
      const parsePromise = pdfParse(pdfBuffer);
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('PDF parsing timed out after 25 seconds. The PDF may be too large, scanned, or complex.')), 25000);
      });
      const pdfData = await Promise.race([parsePromise, timeoutPromise]);
      clearTimeout(timeoutId);
      extractedText = pdfData?.text || '';
      pageCount = pdfData?.numpages || 1;
    } catch (parseErr) {
      clearTimeout(timeoutId);
      throw new Error(`Failed to parse PDF: ${parseErr?.message || 'Invalid or corrupted PDF format'}`);
    }
  } else if (pdfText && typeof pdfText === 'string') {
    extractedText = pdfText;
  } else {
    throw new Error('No PDF file or text provided for extraction.');
  }

  // 2. Clean the extracted text
  const cleanedText = cleanExtractedText(extractedText);
  if (!cleanedText || cleanedText.trim().length === 0) {
    throw new Error('No readable text could be found in the PDF. The file may be scanned, image-only, or encrypted.');
  }

  // 3. Extract global answer key if present at the end of the document
  const globalAnswerKey = extractGlobalAnswerKey(cleanedText);

  // 4. Split document into question blocks
  const blocks = splitIntoQuestionBlocks(cleanedText);
  if (blocks.length === 0) {
    throw new Error('Could not identify any questions in the uploaded PDF. Ensure the PDF contains numbered questions (e.g. 1., Q1.) with options.');
  }

  // 5. Parse each block using pattern recognition
  const parsedQuestions = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const q = parseQuestionBlock(block.rawText, block.number || (i + 1), globalAnswerKey, difficulty);
    // Ensure question has meaningful text
    if (q.questionText && q.questionText.length > 5) {
      parsedQuestions.push(q);
    }
  }

  if (parsedQuestions.length === 0) {
    throw new Error('No valid multiple-choice questions could be extracted from the document. Please check the PDF layout.');
  }

  // Deduplicate questions by full questionText and options (without truncating to 60 chars)
  const seenKeys = new Set();
  const uniqueQuestions = [];

  for (const q of parsedQuestions) {
    const textKey = (q.questionText || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();

    if (!textKey) continue;

    const optKey = Array.isArray(q.options)
      ? q.options.map((o) => String(o).toLowerCase().replace(/[^a-z0-9]/g, '')).sort().join('|')
      : '';

    const uniqueKey = `${textKey}:::${optKey}`;

    if (!seenKeys.has(uniqueKey)) {
      seenKeys.add(uniqueKey);
      uniqueQuestions.push(q);
    }
  }

  // If a specific target count is explicitly requested and > 0, slice to it; otherwise return ALL detected questions
  const parsedCount = parseInt(count, 10);
  const finalQuestions = parsedCount > 0 ? uniqueQuestions.slice(0, parsedCount) : uniqueQuestions;

  return {
    success: true,
    questions: finalQuestions,
    totalDetected: uniqueQuestions.length,
    pageCount,
    category,
    topic,
    difficulty
  };
}

module.exports = {
  extractQuestionsWithPatterns,
  cleanExtractedText,
  parseQuestionBlock,
  splitIntoQuestionBlocks,
  extractGlobalAnswerKey
};
