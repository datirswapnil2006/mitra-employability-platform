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
 * Custom PDF page render to preserve spacing between columns and inline elements.
 * By default, pdf-parse joins same-line TextItems with "" (empty string), causing
 * multi-column options to fuse together (e.g. "MondayB) Tuesday").
 */
function customPageRender(pageData) {
  return pageData.getTextContent({
    normalizeWhitespace: false,
    disableCombineTextItems: false
  }).then(function (textContent) {
    let lastY = null;
    let text = '';

    for (const item of textContent.items) {
      const str = item.str;
      if (!str) continue;

      const currentY = item.transform[5];

      if (lastY === null) {
        text += str;
      } else if (Math.abs(lastY - currentY) > 3) {
        // Vertical position changed -> newline
        text += '\n' + str;
      } else {
        // Same line -> ensure whitespace separation between items
        const hasLeadingSpace = str.startsWith(' ');
        const hasTrailingSpace = text.endsWith(' ') || text.endsWith('\n');
        if (!hasLeadingSpace && !hasTrailingSpace) {
          text += ' ' + str;
        } else {
          text += str;
        }
      }

      lastY = currentY;
    }
    return text;
  });
}

/**
 * Separate glued option markers that were fused without spaces.
 * E.g. "MondayB) Tuesday" -> "Monday\nB) Tuesday"
 * "WednesdayD) Friday" -> "Wednesday\nD) Friday"
 */
function normalizeGluedOptionMarkers(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    // Glued (A), (B), (C), (D)
    .replace(/([^\s\(\[\{])\s*(\([A-Da-d]\))/g, '$1\n$2')
    // Glued A), B), C), D) or A., B., C., D.
    .replace(/([a-zA-Z0-9\?\.\,\!\)\'\"])\s*([A-Da-d][\)\.\:\-])(?=\s+[A-Za-z0-9]|\s*$)/g, '$1\n$2 ')
    // Glued Option A, Option B
    .replace(/([a-zA-Z0-9\?\.\,\!\)\'\"])\s*(Option\s+[A-Da-d][\:\.\-]?)/gi, '$1\n$2');
}

/**
 * Clean and normalize text from PDF
 */
function cleanExtractedText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  const cleaned = rawText
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

  return normalizeGluedOptionMarkers(cleaned);
}

/**
 * Extract answer key and global explanations from the end of the document if present.
 * Supports:
 * - "Answer Key: 1. A, 2. B, 3. C"
 * - "Answers and Explanations: 1. (D) Because August 15, 1947 has 5 odd days..."
 * - "Solutions: 1. D - 1600 years have 0 odd days..."
 */
function extractGlobalAnswerKey(text) {
  const { answerKeyMap } = extractGlobalAnswersAndExplanations(text);
  return answerKeyMap;
}

function extractGlobalAnswersAndExplanations(text) {
  const answerKeyMap = new Map();
  const explanationMap = new Map();

  const sectionHeaderRegex = /(?:ANSWERS?\s*(?:&|AND)?\s*EXPLANATIONS?|SOLUTIONS?|HINTS?\s*(?:&|AND)?\s*SOLUTIONS?|ANSWER\s*KEY|KEY\s*ANSWERS)[\s\:\-]+([\s\S]+)$/i;
  const match = text.match(sectionHeaderRegex);

  if (match && match[1]) {
    const keySection = match[1];

    // Pattern A: Numbered items with answers and detailed explanations
    // e.g. "1. (D) Explanation text...\n2. (C) Detailed explanation..."
    const blockRegex = /(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\)\-\:\s]+(?:\(?([A-Da-d1-4])\)?[\.\:\-\s]+)?([^\n]+(?:\n(?!\s*(?:Q(?:uestion)?\.?\s*)?\d+[\.\)\-\:\s]+)[^\n]+)*)/gi;
    let blockMatch;

    while ((blockMatch = blockRegex.exec(keySection)) !== null) {
      const qNum = parseInt(blockMatch[1], 10);
      const letter = blockMatch[2] ? blockMatch[2].toUpperCase() : '';
      const body = (blockMatch[3] || '').trim();

      if (letter && ['A', 'B', 'C', 'D', '1', '2', '3', '4'].includes(letter)) {
        const normalizedLetter = ['1', '2', '3', '4'].includes(letter)
          ? String.fromCharCode(64 + parseInt(letter, 10))
          : letter;
        answerKeyMap.set(qNum, normalizedLetter);
      }

      if (body) {
        const ansInBody = body.match(/^(?:\(?([A-Da-d])\)?[\.\:\-\s]*|\bOption\s+([A-Da-d])[\.\:\-\s]*)([\s\S]*)/i);
        if (ansInBody) {
          const l = (ansInBody[1] || ansInBody[2]).toUpperCase();
          if (!answerKeyMap.has(qNum)) answerKeyMap.set(qNum, l);
          const expText = (ansInBody[3] || '').trim();
          if (expText.length > 5) {
            explanationMap.set(qNum, expText);
          }
        } else if (body.length > 10) {
          explanationMap.set(qNum, body);
        }
      }
    }

    // Pattern B: Compact answer keys: "1. A, 2. B, 3. C" or "1-A 2-B"
    const simpleRegex = /(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\)\-\:\s]+([A-Da-d1-4])\b/g;
    let simpleMatch;
    while ((simpleMatch = simpleRegex.exec(keySection)) !== null) {
      const qNum = parseInt(simpleMatch[1], 10);
      const letter = simpleMatch[2].toUpperCase();
      if (!answerKeyMap.has(qNum)) {
        const norm = ['1', '2', '3', '4'].includes(letter)
          ? String.fromCharCode(64 + parseInt(letter, 10))
          : letter;
        answerKeyMap.set(qNum, norm);
      }
    }
  }

  return { answerKeyMap, explanationMap };
}

/**
 * Split text into raw question blocks based on question starters.
 * Automatically skips introductory preamble (formula sheets, concepts, theory notes)
 * when an explicit question section starts.
 */
function splitIntoQuestionBlocks(text) {
  let workingText = text;

  // If there's an explicit "Questions / Practice Questions / Exercise" header after formulas/concepts,
  // begin question scanning from that point
  const preambleRegex = /^(?:[\s\S]*?)(?:(?:QUESTIONS?|PRACTICE\s+QUESTIONS?|EXERCISE|PRACTICE\s+PROBLEMS?|MOCK\s+TEST|ALL\s+QUESTIONS)\s*[\:\-\n]+)([\s\S]+)$/i;
  const pMatch = workingText.match(preambleRegex);
  if (pMatch && pMatch[1] && pMatch[1].trim().length > 50) {
    workingText = pMatch[1].trim();
  }

  // Regex to match question numbering at start of a line
  // Matches: "1.", "1)", "1-", "Q1.", "Q1:", "Q.1", "Question 1:", "Que 1.", "Ques 1:"
  const questionStartRegex = /(?:^|\n)\s*(?:(?:Q(?:uestion|ue|ues)?\.?\s*(\d+)[\.\)\-\:\s]*)|(?:\((\d+)\)\s+[A-Za-z])|(?:(\d+)[\.\)\-\:\s]))\s+/gi;

  const indices = [];
  let match;

  while ((match = questionStartRegex.exec(workingText)) !== null) {
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

  // Fallback if no standard numbered questions found
  if (indices.length === 0) {
    const fallbackBlocks = workingText.split(/\n{2,}/).filter((b) => b.trim().length > 20);
    return fallbackBlocks.map((block, idx) => ({
      rawText: block.trim(),
      number: idx + 1
    }));
  }

  const blocks = [];
  for (let i = 0; i < indices.length; i++) {
    const startPos = indices[i].index + indices[i].length;
    const endPos = i + 1 < indices.length ? indices[i + 1].index : workingText.length;
    const rawBlock = workingText.substring(startPos, endPos).trim();

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
 * - Option A, B, C, D (properly separated from columns)
 * - Correct Answer
 * - Explanation
 *
 * Automatically filters out formula notes, instructions, and non-MCQ blocks (returns null).
 */
function parseQuestionBlock(rawBlock, qNumber, globalAnswerKey = new Map(), defaultDifficulty = 'Medium', globalExplanations = new Map()) {
  let text = rawBlock.trim();

  // 0. Quick reject for non-MCQ formula / concept headers that don't have option choices
  if (/^(?:Important\s+)?(?:Formula|Formulas|Concept|Concepts|Theory|Overview|Definition|Rule|Rules|Tip|Tips|Instruction|Directions)\b/i.test(text) &&
      !/(?:Option\s+[A-D]|[A-Da-d][\)\.\:\-]\s+)/i.test(text)) {
    return null;
  }

  let explanation = '';
  let correctAnswer = '';
  let answerLetter = '';

  // 1. Extract Explanation if present
  // Matches: "Detailed Explanation:", "Explanation:", "Solution:", "Detailed Solution:", "Sol:", "Rationale:", "Reason:", "Hint:", "Description:"
  const explanationRegex = /(?:Detailed\s+Explanation|Explanation|Detailed\s+Solution|Solution|Soln|Sol|Rationale|Reasoning|Reason|Hint|Description)[\s\:\-]+([\s\S]+)$/i;
  const expMatch = text.match(explanationRegex);
  if (expMatch) {
    explanation = expMatch[1].trim();
    text = text.substring(0, expMatch.index).trim();

    // Check if the explanation itself ended with an answer tag, e.g. "... Ans: (D)"
    const ansInExp = explanation.match(/(?:Correct\s*Answer|Correct\s*Option|Answer|Ans|Key)[\s\:\-]+(?:\(?([A-Da-d])\)?|\bOption\s*([A-Da-d])\b)/i);
    if (ansInExp) {
      answerLetter = (ansInExp[1] || ansInExp[2]).toUpperCase();
      explanation = explanation.substring(0, ansInExp.index).trim();
    }
  }

  // 2. Extract Answer if present
  // Matches standalone letter: "Answer: A", "Ans: (B)", "Correct Option: C", "Correct Answer: Option D", "Key: A"
  // Or standalone text/ratio: "Ans: 1:2", "Answer: 16:46"
  const answerRegex = /(?:Correct\s*Answer|Correct\s*Option|Answer|Ans|Key)[\s\:\-]+(?:\(?([A-Da-d])\)?(?!\S)|\bOption\s*([A-Da-d])\b|([^\n\r]+))/i;
  const ansMatch = text.match(answerRegex);
  if (ansMatch) {
    if (!answerLetter) {
      answerLetter = (ansMatch[1] || ansMatch[2] || '').toUpperCase();
    }
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

  // Check global answer key and global explanations if not inline
  if (!answerLetter && !correctAnswer && globalAnswerKey.has(qNumber)) {
    answerLetter = globalAnswerKey.get(qNumber);
  }
  if (!explanation && globalExplanations.has(qNumber)) {
    explanation = globalExplanations.get(qNumber);
  }

  // 3. Extract Options
  // Match markers: Option A, (A), [A], A., A), A:
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

  let options = [];
  let questionText = text;
  const optionMap = {};

  if (matches.length >= 2) {
    questionText = text.substring(0, matches[0].index).trim();
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].fullIndex + matches[i].fullLength;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      let optText = text.substring(start, end).trim();

      // Clean leading option markers if duplicated (do not strip first letter of words like Alpha, Beta)
      optText = optText.replace(/^(?:(?:Option\s+[A-Da-d][\:\.\-\s]*)|(?:\(?\d+[\.\)\:\-]?\s*)?[\(\[][A-Da-d][\)\]][\.\:\-\s]*|(?:\b|\()?[A-Da-d][\)\]\.\:\-]\s*)/i, '').trim();
      // Clean trailing stray numbering/bullets before next option
      optText = optText.replace(/\s+[1-4•\-\|]$/, '').trim();
      optText = optText.replace(/\s+/g, ' ').trim();

      if (optText) {
        options.push(optText);
        if (matches[i].marker) {
          optionMap[matches[i].marker] = optText;
        }
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
        const optVal = (optMatch[3] || '').replace(/\s+/g, ' ').trim();
        if (optVal) {
          detectedOptionLines.push(optVal);
          const mLetter = (optMatch[1] || optMatch[2]).toUpperCase();
          if (mLetter) optionMap[mLetter] = optVal;
        }
      } else if (reachedOptions && detectedOptionLines.length > 0 && detectedOptionLines.length < 4) {
        detectedOptionLines[detectedOptionLines.length - 1] += ' ' + line.trim();
      } else if (!reachedOptions) {
        questionLines.push(line);
      }
    }

    if (detectedOptionLines.length >= 2) {
      options = detectedOptionLines.map((o) => o.replace(/\s+/g, ' ').trim());
      questionText = questionLines.join(' ').trim();
    }
  }

  // CRUCIAL: If fewer than 2 real options were detected, this block is NOT an MCQ!
  // (e.g. it is a formula, concept note, instructions, or theory text)
  if (options.length < 2) {
    return null;
  }

  // Clean up question text
  questionText = questionText
    .replace(/\s+/g, ' ')
    .replace(/^(?:Q(?:uestion|ue|ues)?\.?\s*\d+[\.\:\-\)]*|\d+[\.\)\-]*)\s*/i, '')
    .trim();

  // If questionText is too short or empty, invalid block
  if (!questionText || questionText.length < 4) {
    return null;
  }

  // Normalize options to 4, respecting matched letters A, B, C, D if present
  let finalOptions = [];
  if (optionMap['A'] && optionMap['B']) {
    finalOptions = [
      optionMap['A'],
      optionMap['B'],
      optionMap['C'] || options[2] || 'Option C',
      optionMap['D'] || options[3] || 'Option D'
    ];
  } else {
    finalOptions = options.map((opt) => opt.replace(/\s+/g, ' ').trim()).filter(Boolean);
    while (finalOptions.length < 4) {
      finalOptions.push(`Option ${String.fromCharCode(65 + finalOptions.length)}`);
    }
    finalOptions = finalOptions.slice(0, 4);
  }

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

  // 1. Extract raw text from PDF buffer using pdf-parse with customPageRender
  if (pdfBuffer && Buffer.isBuffer(pdfBuffer)) {
    if (pdfBuffer.length === 0) {
      throw new Error('Uploaded PDF file is empty (0 bytes).');
    }

    let timeoutId;
    try {
      const parsePromise = pdfParse(pdfBuffer, { pagerender: customPageRender });
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

  // 2. Clean the extracted text and normalize glued option markers
  const cleanedText = cleanExtractedText(extractedText);
  if (!cleanedText || cleanedText.trim().length === 0) {
    throw new Error('No readable text could be found in the PDF. The file may be scanned, image-only, or encrypted.');
  }

  // 3. Extract global answer key and global explanations from end of document if present
  const { answerKeyMap, explanationMap } = extractGlobalAnswersAndExplanations(cleanedText);

  // 4. Split document into candidate question blocks (skips initial formula/concept preambles)
  const blocks = splitIntoQuestionBlocks(cleanedText);
  if (blocks.length === 0) {
    throw new Error('Could not identify any questions in the uploaded PDF. Ensure the PDF contains numbered questions (e.g. 1., Q1.) with options.');
  }

  // 5. Parse each block using pattern recognition (rejects formula notes/theory lacking options)
  const parsedQuestions = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const q = parseQuestionBlock(
      block.rawText,
      block.number || (i + 1),
      answerKeyMap,
      difficulty,
      explanationMap
    );
    // Ensure question is a valid MCQ with options and meaningful question text
    if (q && q.questionText && q.questionText.length > 5) {
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
  extractGlobalAnswerKey,
  extractGlobalAnswersAndExplanations,
  customPageRender,
  normalizeGluedOptionMarkers
};
