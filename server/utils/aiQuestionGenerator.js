const { GoogleGenAI } = require('@google/genai');

/**
 * AI Question Generator for MITRA Question Bank
 * Powered exclusively by Google Gemini, with robust exponential backoff,
 * configured fallback model chains, chunked batching (10-20 questions/call),
 * deduplication between batches, and grounded academic fallback.
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeTextForComparison = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const isDuplicate = (newText, existingList) => {
  if (!newText || typeof newText !== 'string') return true;
  const normNew = normalizeTextForComparison(newText);
  if (normNew.length < 5) return true;

  for (const item of existingList) {
    const exText = typeof item === 'string' ? item : (item?.questionText || '');
    const normEx = normalizeTextForComparison(exText);
    if (!normEx) continue;
    if (normNew === normEx) return true;
    if (normNew.length > 25 && normEx.length > 25) {
      if (normNew.includes(normEx) || normEx.includes(normNew)) return true;
    }
  }
  return false;
};

const generatePrompt = ({
  module,
  category,
  department,
  topic,
  prompt,
  customPrompt,
  difficulty,
  count,
  existingQuestions = []
}) => {
  const domainContext = department ? `Department: ${department}` : '';
  const effectivePrompt = customPrompt || prompt || '';
  const isAptitudeMix = module === 'Aptitude' && (
    category === 'Mix Assessment' ||
    String(category || '').toLowerCase().includes('mix') ||
    String(topic || '').toLowerCase().includes('mix') ||
    String(topic || '').toLowerCase().includes('all topics')
  );

  const customPromptSection = effectivePrompt
    ? `
CUSTOM ASSESSMENT GENERATION PROMPT & SYLLABUS DIRECTIVES:
"${effectivePrompt}"
You MUST strictly follow the above custom prompt directives when determining which concepts, problem patterns, and scenarios to test.`
    : '';

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

  const existingDeduplicationSection = Array.isArray(existingQuestions) && existingQuestions.length > 0
    ? `
CRITICAL DEDUPLICATION DIRECTIVE:
The following questions have ALREADY been generated in earlier batches. You MUST NOT repeat any of them or produce trivial variations:
${existingQuestions.slice(-25).map((q, idx) => `${idx + 1}. "${typeof q === 'string' ? q : (q.questionText || '')}"`).join('\n')}
Generate completely distinct, original questions testing different subtopics, numbers, concepts, or problem structures.`
    : '';

  return `You are a premier technical assessment architect and recruitment exam creator for top engineering companies.
Generate exactly ${count} high-quality, academic and industry-level multiple choice questions (MCQs) for the following specifications:

Domain / Module: "${module}"
Category: "${category}"
${domainContext}
Topic / Focus: "${topic || effectivePrompt.slice(0, 50) || 'General'}"
Difficulty Level: "${difficulty}" (Easy / Medium / Hard)
${customPromptSection}
${mixedContext}
${existingDeduplicationSection}

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

const withTimeout = (promise, ms = 15000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Gemini API request timed out after ${ms}ms`)), ms))
  ]);
};

// 1. Google Gemini Provider with Exponential Backoff on 503 / 429 and Fallback Models
const generateWithGemini = async (prompt, apiKey) => {
  const ai = new GoogleGenAI({ apiKey });

  const configuredPrimary = process.env.GEMINI_MODEL;
  const configuredFallback = process.env.GEMINI_FALLBACK_MODEL;

  // Build model priority chain starting from configured models down to active Gemini models
  const modelsToTry = Array.from(
    new Set(
      [
        configuredPrimary,
        configuredFallback,
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite'
      ].filter(Boolean)
    )
  );

  let lastError = null;

  for (const modelName of modelsToTry) {
    const maxRetries = 2; // attempt 0, then attempt 1 after 1s, attempt 2 after 2s
    const baseDelay = 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              maxOutputTokens: 4096,
              temperature: 0.25
            }
          }),
          20000
        );

        const parsed = cleanAndParseJson(response.text || '');
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          return { questions: parsed, modelUsed: modelName };
        }
        break; // If output couldn't be parsed, try next model
      } catch (err) {
        lastError = err;
        const msg = String(err.message || '').toLowerCase();
        const status = err.status || (err.response && err.response.status);
        const isQuota =
          msg.includes('resource_exhausted') ||
          msg.includes('quota exceeded') ||
          msg.includes('exceeded your current quota');

        if (isQuota) {
          console.warn(
            `[Gemini Provider]: Model '${modelName}' quota exhausted (${status || '429'}). Switching to next fallback Gemini model...`
          );
          break;
        }

        const isTransient =
          status === 503 ||
          status === 429 ||
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('unavailable') ||
          msg.includes('overloaded') ||
          msg.includes('rate limit') ||
          msg.includes('timeout') ||
          msg.includes('timed out');

        if (isTransient && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.floor(Math.random() * 300);
          console.warn(
            `[Gemini Provider]: Model '${modelName}' returned transient status (${status || '503/429'}). Retrying attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`
          );
          await sleep(delay);
        } else {
          console.warn(
            `[Gemini Provider]: Model '${modelName}' failed (${err.message}). Trying configured fallback Gemini model...`
          );
          break; // Move to next fallback model
        }
      }
    }
  }

  throw lastError || new Error('Gemini question generation failed across all models.');
};

const cleanTopicName = (rawTopic, defaultCategory = 'Aptitude') => {
  if (!rawTopic || typeof rawTopic !== 'string') return defaultCategory;
  const trimmed = rawTopic.trim();
  if (/(create|generate|test|assessment|question|exam|mock|drive|prepare|for college)/i.test(trimmed)) {
    if (/quant/i.test(trimmed)) return 'Quantitative Aptitude';
    if (/reason|logic/i.test(trimmed)) return 'Logical Reasoning';
    if (/verbal|english/i.test(trimmed)) return 'Verbal Ability';
    if (/mix/i.test(trimmed)) return 'Mixed Aptitude';
    if (/dsa|data structure|algorithm/i.test(trimmed)) return 'Data Structures & Algorithms';
    if (/sql|dbms|database/i.test(trimmed)) return 'Database Management & SQL';
    if (/os|operating system/i.test(trimmed)) return 'Operating Systems';
    if (/network/i.test(trimmed)) return 'Computer Networks';
    return defaultCategory;
  }
  return trimmed;
};

// Realistic question banks for academic fallback
const REAL_QUANT_BANK = [
  (idx, diff) => {
    const a = 10 + (idx % 6) * 2;
    const b = 15 + (idx % 5) * 3;
    const combined = ((a * b) / (a + b)).toFixed(1);
    const ans = `${combined} days`;
    return {
      questionText: `Worker A can finish a task in ${a} days and Worker B can finish the same task in ${b} days. Working together, how many days will they take to complete the task?`,
      options: [ans, `${(parseFloat(combined) + 2).toFixed(1)} days`, `${(parseFloat(combined) - 1.5).toFixed(1)} days`, `${((a + b) / 2).toFixed(1)} days`],
      correctAnswer: ans,
      explanation: `Combined rate per day = (1/${a} + 1/${b}) = (${a + b})/${a * b}. Total days = (${a * b})/(${a + b}) = ${combined} days.`
    };
  },
  (idx, diff) => {
    const cp = 400 + (idx % 7) * 50;
    const gain = 10 + (idx % 5) * 5;
    const sp = Math.round(cp * (1 + gain / 100));
    const ans = `₹${sp}`;
    return {
      questionText: `A trader purchases an article for ₹${cp} and sells it at a profit of ${gain}%. What is the selling price of the article?`,
      options: [ans, `₹${sp + 40}`, `₹${sp - 35}`, `₹${cp + gain * 2}`],
      correctAnswer: ans,
      explanation: `Selling Price = Cost Price × (100 + Gain%) / 100 = ₹${cp} × ${100 + gain} / 100 = ₹${sp}.`
    };
  },
  (idx, diff) => {
    const passPct = 40;
    const score = 160 + (idx % 6) * 15;
    const failBy = 20 + (idx % 4) * 5;
    const passMarks = score + failBy;
    const total = Math.round((passMarks * 100) / passPct);
    const ans = `${total}`;
    return {
      questionText: `In a recruitment test, a candidate scored ${score} marks and failed by ${failBy} marks. If the passing threshold is ${passPct}%, what is the maximum total marks?`,
      options: [ans, `${total + 50}`, `${total - 40}`, `${total + 100}`],
      correctAnswer: ans,
      explanation: `Passing marks required = ${score} + ${failBy} = ${passMarks}. Maximum marks = (${passMarks} × 100) / ${passPct} = ${total}.`
    };
  },
  (idx, diff) => {
    const speed = 54 + (idx % 4) * 18;
    const speedMs = speed * (5 / 18);
    const timeSec = 12 + (idx % 4) * 3;
    const length = speedMs * timeSec;
    const ans = `${length} meters`;
    return {
      questionText: `A train running at a uniform speed of ${speed} km/h crosses a pole in ${timeSec} seconds. What is the length of the train?`,
      options: [ans, `${length + 50} meters`, `${length - 30} meters`, `${length + 100} meters`],
      correctAnswer: ans,
      explanation: `Speed in m/s = ${speed} × (5/18) = ${speedMs} m/s. Length = Speed × Time = ${speedMs} × ${timeSec} = ${length} meters.`
    };
  },
  (idx, diff) => {
    const p = 5000 + (idx % 6) * 1000;
    const r = 5 + (idx % 4) * 2;
    const t = 2 + (idx % 3);
    const si = (p * r * t) / 100;
    const ans = `₹${si}`;
    return {
      questionText: `Calculate the simple interest on a principal amount of ₹${p} for ${t} years at an interest rate of ${r}% per annum.`,
      options: [ans, `₹${si + 150}`, `₹${si - 120}`, `₹${si + 250}`],
      correctAnswer: ans,
      explanation: `Simple Interest = (P × R × T) / 100 = (${p} × ${r} × ${t}) / 100 = ₹${si}.`
    };
  },
  (idx, diff) => {
    const r1 = 3 + (idx % 3);
    const r2 = 5 + (idx % 3);
    const mult = 40 + (idx % 5) * 10;
    const sum = (r1 + r2) * mult;
    const partA = r1 * mult;
    const partB = r2 * mult;
    const ans = `₹${partA} and ₹${partB}`;
    return {
      questionText: `Divide ₹${sum} between Person X and Person Y in the ratio of ${r1} : ${r2}. What are their respective amounts?`,
      options: [ans, `₹${partA + 40} and ₹${partB - 40}`, `₹${partA - 50} and ₹${partB + 50}`, `₹${partA + 80} and ₹${partB - 80}`],
      correctAnswer: ans,
      explanation: `Total parts = ${r1} + ${r2} = ${r1 + r2}. 1 part = ₹${sum}/${r1 + r2} = ₹${mult}. X gets ₹${partA}, Y gets ₹${partB}.`
    };
  },
  (idx, diff) => {
    const red = 4 + (idx % 3);
    const blue = 6 + (idx % 4);
    const green = 2 + (idx % 2);
    const total = red + blue + green;
    const ans = `${blue}/${total}`;
    return {
      questionText: `A box contains ${red} red, ${blue} blue, and ${green} green balls. If one ball is picked at random, what is the probability that it is blue?`,
      options: [ans, `${red}/${total}`, `${green}/${total}`, `${blue - 1}/${total}`],
      correctAnswer: ans,
      explanation: `Total balls = ${total}. Number of favorable outcomes (blue) = ${blue}. Probability = ${blue}/${total}.`
    };
  },
  (idx, diff) => {
    const a = 12 + (idx % 4) * 4;
    const b = 18 + (idx % 4) * 6;
    const gcd = (x, y) => (!y ? x : gcd(y, x % y));
    const h = gcd(a, b);
    const lcm = (a * b) / h;
    const ans = `${lcm}`;
    return {
      questionText: `Find the Lowest Common Multiple (LCM) of ${a} and ${b}.`,
      options: [ans, `${lcm + 12}`, `${lcm - 6}`, `${a * b}`],
      correctAnswer: ans,
      explanation: `HCF of ${a} and ${b} is ${h}. LCM = (${a} × ${b}) / HCF = (${a * b}) / ${h} = ${lcm}.`
    };
  },
  (idx, diff) => {
    const currSon = 10 + (idx % 5) * 2;
    const currFather = currSon * 3;
    const yearsLater = 10;
    const ans = `${currFather + yearsLater} years and ${currSon + yearsLater} years`;
    return {
      questionText: `A father is currently 3 times as old as his son. If the son is currently ${currSon} years old, what will be their ages after ${yearsLater} years?`,
      options: [ans, `${currFather + yearsLater + 5} years and ${currSon + yearsLater - 2} years`, `${currFather + yearsLater - 4} years and ${currSon + yearsLater} years`, `${currFather * 2} years and ${currSon * 2} years`],
      correctAnswer: ans,
      explanation: `Current ages: Son = ${currSon}, Father = 3 × ${currSon} = ${currFather}. After ${yearsLater} years: Father = ${currFather + yearsLater}, Son = ${currSon + yearsLater}.`
    };
  },
  (idx, diff) => {
    const markedPrice = 1000 + (idx % 5) * 200;
    const discountPct = 15 + (idx % 3) * 5;
    const sp = markedPrice - (markedPrice * discountPct) / 100;
    const ans = `₹${sp}`;
    return {
      questionText: `An item has a marked price of ₹${markedPrice}. If a festive discount of ${discountPct}% is offered, what is the final cash selling price?`,
      options: [ans, `₹${sp + 50}`, `₹${sp - 40}`, `₹${markedPrice - discountPct * 10}`],
      correctAnswer: ans,
      explanation: `Discount = ₹${markedPrice} × ${discountPct}/100 = ₹${(markedPrice * discountPct) / 100}. Final SP = ₹${markedPrice} - Discount = ₹${sp}.`
    };
  }
];

const REAL_LOGICAL_BANK = [
  (idx, diff) => ({
    questionText: `Pointing to a photograph, a woman says: "His mother is the only daughter of my mother." How is the woman related to the boy in the photograph?`,
    options: ['Mother', 'Aunt', 'Sister', 'Grandmother'],
    correctAnswer: 'Mother',
    explanation: `The only daughter of the woman's mother is the woman herself. Hence, the boy's mother is the woman.`
  }),
  (idx, diff) => ({
    questionText: `In a certain code language, if 'SYSTEM' is coded as 'SYSMET' and 'NEARER' is coded as 'AENRER', how is 'FRACTION' coded in that language?`,
    options: ['CARFNOIT', 'CARFTION', 'ARFCNOIT', 'FRACNOIT'],
    correctAnswer: 'CARFNOIT',
    explanation: `The word is split into two equal halves of 4 letters and each half is reversed: 'FRAC' becomes 'CARF' and 'TION' becomes 'NOIT'. Combined: 'CARFNOIT'.`
  }),
  (idx, diff) => {
    const start = 4 + (idx % 4);
    const s1 = start, s2 = start * 2 + 1, s3 = s2 * 2 + 1, s4 = s3 * 2 + 1, s5 = s4 * 2 + 1;
    return {
      questionText: `Find the next number in the given series: ${s1}, ${s2}, ${s3}, ${s4}, ___?`,
      options: [`${s5}`, `${s5 + 4}`, `${s5 - 6}`, `${s4 * 2}`],
      correctAnswer: `${s5}`,
      explanation: `Pattern: Each term is obtained by multiplying the previous term by 2 and adding 1: (${s4} × 2) + 1 = ${s5}.`
    };
  },
  (idx, diff) => ({
    questionText: `A person walks 12 km North, then turns East and walks 5 km. How far is the person from the starting point?`,
    options: ['13 km', '17 km', '11 km', '15 km'],
    correctAnswer: '13 km',
    explanation: `By Pythagoras theorem: Distance = √(12² + 5²) = √(144 + 25) = √169 = 13 km.`
  }),
  (idx, diff) => ({
    questionText: `Statements:\n1. All laptops are electronic devices.\n2. All electronic devices are machines.\nConclusions:\nI. All laptops are machines.\nII. Some machines are laptops.`,
    options: ['Both I and II follow', 'Only conclusion I follows', 'Only conclusion II follows', 'Neither I nor II follows'],
    correctAnswer: 'Both I and II follow',
    explanation: `Since Laptops ⊆ Electronic Devices ⊆ Machines, all laptops are machines (I follows), and by subalternation, some machines are laptops (II follows).`
  }),
  (idx, diff) => ({
    questionText: `What is the angle between the hour hand and the minute hand of a clock at 3:30?`,
    options: ['75°', '80°', '70°', '90°'],
    correctAnswer: '75°',
    explanation: `Angle = |30H - (11/2)M| = |30(3) - (11/2)(30)| = |90 - 165| = 75°.`
  }),
  (idx, diff) => {
    const total = 40 + (idx % 5) * 5;
    const left = 12 + (idx % 6);
    const right = total - left + 1;
    return {
      questionText: `In a class of ${total} students, Aryan ranks ${left}th from the top. What is his rank from the bottom?`,
      options: [`${right}`, `${right + 1}`, `${right - 1}`, `${right + 2}`],
      correctAnswer: `${right}`,
      explanation: `Rank from bottom = Total students - Rank from top + 1 = ${total} - ${left} + 1 = ${right}.`
    };
  },
  (idx, diff) => ({
    questionText: `Select the odd one out from the following group:`,
    options: ['Copper', 'Iron', 'Zinc', 'Brass'],
    correctAnswer: 'Brass',
    explanation: `Copper, Iron, and Zinc are pure chemical elements, whereas Brass is an alloy (copper and zinc).`
  }),
  (idx, diff) => ({
    questionText: `If 'P + Q' means P is the brother of Q, and 'P × Q' means P is the father of Q, which of the following represents 'M is the uncle of N'?`,
    options: ['M + K × N', 'M × K + N', 'M + N × K', 'N × M + K'],
    correctAnswer: 'M + K × N',
    explanation: `'M + K' means M is the brother of K. 'K × N' means K is the father of N. Therefore, M is the brother of N's father, which means M is N's uncle.`
  }),
  (idx, diff) => ({
    questionText: `Four friends A, B, C, and D are sitting around a circular table facing the center. A is sitting opposite to C, and B is sitting to the immediate right of A. Who is sitting to the immediate left of C?`,
    options: ['B', 'D', 'A', 'Cannot be determined'],
    correctAnswer: 'B',
    explanation: `Looking towards the center: A is opposite C. B is to the right of A. Moving around clockwise gives A -> B -> C -> D. Thus, B is immediately to the left of C.`
  })
];

const REAL_VERBAL_BANK = [
  (idx, diff) => ({
    questionText: `Choose the correct option to fill in the blank:\n"Neither the manager nor the employees ___ aware of the policy revision."`,
    options: ['were', 'was', 'is', 'has been'],
    correctAnswer: 'were',
    explanation: `In subject-verb agreement with 'neither... nor', the verb agrees with the closer subject ('employees', which is plural, taking 'were').`
  }),
  (idx, diff) => ({
    questionText: `Choose the word that is most nearly OPPOSITE in meaning to 'METICULOUS':`,
    options: ['Careless', 'Diligent', 'Accurate', 'Punctual'],
    correctAnswer: 'Careless',
    explanation: `'Meticulous' means showing great attention to detail; very careful and precise. Its opposite is 'Careless'.`
  }),
  (idx, diff) => ({
    questionText: `Identify the grammatical error in the sentence:\n"She did not knew (A) / about the scheduled meeting (B) / until this morning. (C) / No error (D)"`,
    options: ['She did not knew (A)', 'about the scheduled meeting (B)', 'until this morning. (C)', 'No error (D)'],
    correctAnswer: 'She did not knew (A)',
    explanation: `The auxiliary verb 'did' requires the base form of the main verb: 'She did not know', not 'did not knew'.`
  }),
  (idx, diff) => ({
    questionText: `What is the meaning of the idiom: 'Bite the bullet'?`,
    options: ['Face an inevitable difficult situation with courage', 'Avoid a dangerous encounter', 'Make a rushed decision without planning', 'Inflict self-harm intentionally'],
    correctAnswer: 'Face an inevitable difficult situation with courage',
    explanation: `'To bite the bullet' means to force oneself to face a difficult or unpleasant situation that cannot be avoided.`
  }),
  (idx, diff) => ({
    questionText: `Choose the appropriate preposition:\n"The senior engineer is proficient ___ optimizing database queries."`,
    options: ['in', 'at', 'with', 'on'],
    correctAnswer: 'in',
    explanation: `The adjective 'proficient' is idiomatically followed by the preposition 'in' when referring to skills or disciplines.`
  }),
  (idx, diff) => ({
    questionText: `Choose the word that is most nearly SYNONYMOUS with 'CANDID':`,
    options: ['Frank', 'Deceptive', 'Shy', 'Arrogant'],
    correctAnswer: 'Frank',
    explanation: `'Candid' means truthful, straightforward, and frank.`
  }),
  (idx, diff) => ({
    questionText: `Convert to Passive Voice:\n"The development team has completed the deployment."`,
    options: [
      'The deployment has been completed by the development team.',
      'The deployment was completed by the development team.',
      'The deployment is completed by the development team.',
      'The deployment had been completed by the development team.'
    ],
    correctAnswer: 'The deployment has been completed by the development team.',
    explanation: `Present Perfect Active ('has completed') converts to Present Perfect Passive ('has been completed').`
  }),
  (idx, diff) => ({
    questionText: `Choose the correctly spelt word:`,
    options: ['Accommodation', 'Acommodation', 'Accomodation', 'Acomodation'],
    correctAnswer: 'Accommodation',
    explanation: `'Accommodation' is spelled with double 'c' and double 'm'.`
  }),
  (idx, diff) => ({
    questionText: `Select the word that can substitute the given phrase:\n"One who possesses multi-faceted skills and adapts to various fields"`,
    options: ['Versatile', 'Veteran', 'Novice', 'Vulnerable'],
    correctAnswer: 'Versatile',
    explanation: `'Versatile' describes someone capable of doing many things competently.`
  }),
  (idx, diff) => ({
    questionText: `Complete the sentence with the correct conditional tense:\n"If the system ___ load tested properly, the crash would have been averted."`,
    options: ['had been', 'was', 'has been', 'would be'],
    correctAnswer: 'had been',
    explanation: `In the third conditional ('would have been averted'), the 'if' clause requires the Past Perfect tense ('had been load tested').`
  })
];

const REAL_TECH_BANK = [
  (idx, diff) => ({
    questionText: `What is the worst-case time complexity of searching for an element in a balanced Binary Search Tree (AVL / Red-Black Tree)?`,
    options: ['O(log N)', 'O(N)', 'O(1)', 'O(N log N)'],
    correctAnswer: 'O(log N)',
    explanation: `In a self-balancing binary search tree, the height is guaranteed to be O(log N), so search, insertion, and deletion are O(log N).`
  }),
  (idx, diff) => ({
    questionText: `Which data structure follows the Last-In-First-Out (LIFO) order of operation?`,
    options: ['Stack', 'Queue', 'Linked List', 'Binary Tree'],
    correctAnswer: 'Stack',
    explanation: `A Stack operates on the LIFO principle (push and pop at the top of the stack).`
  }),
  (idx, diff) => ({
    questionText: `In SQL, which clause is used to filter aggregated group results produced by a GROUP BY statement?`,
    options: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'],
    correctAnswer: 'HAVING',
    explanation: `'WHERE' filters rows before aggregation, while 'HAVING' filters grouped records after aggregation.`
  }),
  (idx, diff) => ({
    questionText: `Which layer of the OSI 7-layer reference model is responsible for end-to-end flow control, error checking, and packet sequencing (TCP/UDP)?`,
    options: ['Transport Layer', 'Network Layer', 'Data Link Layer', 'Session Layer'],
    correctAnswer: 'Transport Layer',
    explanation: `The Transport Layer (Layer 4) handles reliable host-to-host communication and segmentation using protocols like TCP and UDP.`
  }),
  (idx, diff) => ({
    questionText: `In Operating Systems, which of the following is NOT one of Coffman's four necessary conditions for a Deadlock to occur?`,
    options: ['Preemptive Scheduling', 'Mutual Exclusion', 'Hold and Wait', 'Circular Wait'],
    correctAnswer: 'Preemptive Scheduling',
    explanation: `The four conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Preemption breaks deadlock.`
  }),
  (idx, diff) => ({
    questionText: `In Object-Oriented Programming, what is the mechanism called when a subclass provides a specific implementation of a method declared in its parent class?`,
    options: ['Method Overriding', 'Method Overloading', 'Encapsulation', 'Abstraction'],
    correctAnswer: 'Method Overriding',
    explanation: `Method Overriding allows a subclass to provide a runtime polymorphic implementation of an inherited parent method.`
  }),
  (idx, diff) => ({
    questionText: `What is the average time complexity of finding a key in a well-distributed Hash Table?`,
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N²)'],
    correctAnswer: 'O(1)',
    explanation: `A hash table with a good hash function and minimal collisions provides average-case O(1) constant time lookup.`
  }),
  (idx, diff) => ({
    questionText: `In Relational Database Design, which Normal Form (NF) requires removing partial functional dependencies on a composite primary key?`,
    options: ['Second Normal Form (2NF)', 'First Normal Form (1NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
    correctAnswer: 'Second Normal Form (2NF)',
    explanation: `2NF requires 1NF compliance and that all non-key attributes are fully functionally dependent on the primary key (no partial dependencies).`
  }),
  (idx, diff) => ({
    questionText: `Which sorting algorithm is guaranteed to have O(N log N) worst-case time complexity and is stable?`,
    options: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Selection Sort'],
    correctAnswer: 'Merge Sort',
    explanation: `Merge Sort divides the array in half recursively and merges in O(N), guaranteeing O(N log N) time in all cases while maintaining stability.`
  }),
  (idx, diff) => ({
    questionText: `In Computer Networks, what is the default subnet mask for a standard Class C IPv4 address network?`,
    options: ['255.255.255.0', '255.255.0.0', '255.0.0.0', '255.255.255.255'],
    correctAnswer: '255.255.255.0',
    explanation: `Class C networks use the first 24 bits for the network ID, giving a default subnet mask of 255.255.255.0 (/24).`
  })
];

// Grounded Rule-Based Academic Fallback Generator (Generates realistic, mathematically accurate placement exam MCQs)
const generateAcademicFallback = ({ module, category, topic, difficulty, count, offset = 0 }) => {
  const questions = [];
  const diff = difficulty || 'Medium';
  const cleanTopic = cleanTopicName(topic, category || 'Aptitude');

  for (let i = 0; i < count; i++) {
    const qIndex = offset + i;
    let qData = null;

    if (module === 'Aptitude') {
      const isMix = category === 'Mix Assessment' || String(topic || '').toLowerCase().includes('mix');
      const sectionType = isMix
        ? (qIndex % 3 === 0 ? 'Quantitative' : qIndex % 3 === 1 ? 'Logical' : 'Verbal')
        : (category || '');

      if (sectionType.includes('Quantitative') || (!isMix && /quant/i.test(sectionType))) {
        const templateFn = REAL_QUANT_BANK[qIndex % REAL_QUANT_BANK.length];
        qData = templateFn(qIndex, diff);
      } else if (sectionType.includes('Logical') || (!isMix && /logic|reason/i.test(sectionType))) {
        const templateFn = REAL_LOGICAL_BANK[qIndex % REAL_LOGICAL_BANK.length];
        qData = templateFn(qIndex, diff);
      } else {
        const templateFn = REAL_VERBAL_BANK[qIndex % REAL_VERBAL_BANK.length];
        qData = templateFn(qIndex, diff);
      }
    } else if (module === 'Domain' || module === 'Domain Knowledge' || module === 'Technical') {
      const templateFn = REAL_TECH_BANK[qIndex % REAL_TECH_BANK.length];
      qData = templateFn(qIndex, diff);
    } else {
      // Full Assessment blend
      const poolChoice = qIndex % 4;
      if (poolChoice === 0) qData = REAL_QUANT_BANK[qIndex % REAL_QUANT_BANK.length](qIndex, diff);
      else if (poolChoice === 1) qData = REAL_LOGICAL_BANK[qIndex % REAL_LOGICAL_BANK.length](qIndex, diff);
      else if (poolChoice === 2) qData = REAL_VERBAL_BANK[qIndex % REAL_VERBAL_BANK.length](qIndex, diff);
      else qData = REAL_TECH_BANK[qIndex % REAL_TECH_BANK.length](qIndex, diff);
    }

    if (qData) {
      questions.push({
        questionText: qData.questionText,
        codeSnippet: qData.codeSnippet || '',
        options: qData.options,
        correctAnswer: qData.correctAnswer,
        explanation: qData.explanation || `Verified correct solution for ${cleanTopic}.`,
        difficulty: diff,
        type: 'mcq',
        marks: 1
      });
    }
  }

  return questions;
};

// Helper: Normalize & strictly validate a single question object
const validateAndFormatQuestion = (q, defaultDifficulty = 'Medium', defaultTopic = 'General', module = 'Aptitude', category = 'General', department = null, resolvedProvider = 'gemini') => {
  if (!q || typeof q !== 'object') return null;

  const rawQuestionText = String(q.questionText || '').trim();
  if (!rawQuestionText) return null;

  // Options: exactly 4 non-empty strings
  let options = Array.isArray(q.options)
    ? q.options.map((o) => String(o || '').trim()).filter(Boolean)
    : [];

  while (options.length < 4) {
    options.push(`Option ${String.fromCharCode(65 + options.length)}`);
  }
  if (options.length > 4) {
    options = options.slice(0, 4);
  }

  // Correct answer: must match exactly one of the 4 options
  let correctAnswer = String(q.correctAnswer || '').trim();
  const upper = correctAnswer.toUpperCase();
  if (upper === 'A' || upper === 'OPTION A' || upper === '(A)') correctAnswer = options[0];
  else if (upper === 'B' || upper === 'OPTION B' || upper === '(B)') correctAnswer = options[1];
  else if (upper === 'C' || upper === 'OPTION C' || upper === '(C)') correctAnswer = options[2];
  else if (upper === 'D' || upper === 'OPTION D' || upper === '(D)') correctAnswer = options[3];

  if (!options.includes(correctAnswer)) {
    if (correctAnswer) {
      options[0] = correctAnswer;
    } else {
      correctAnswer = options[0];
    }
  }

  return {
    module,
    category,
    department: module === 'Domain' ? (department || category) : null,
    topic: defaultTopic,
    questionText: rawQuestionText,
    codeSnippet: q.codeSnippet || '',
    options,
    correctAnswer,
    explanation: q.explanation || `The correct answer is verified for ${defaultTopic}.`,
    difficulty: q.difficulty || defaultDifficulty,
    marks: q.marks || 1,
    type: 'mcq',
    aiGenerated: true,
    aiProvider: q.aiProvider || resolvedProvider
  };
};

// Helper: Single-batch question generator with Google Gemini, retries & grounded fallback
const generateSingleBatch = async ({
  provider = 'gemini',
  module = 'Aptitude',
  category = 'Quantitative',
  department = null,
  topic = 'General',
  prompt: customPromptText = '',
  customPrompt = '',
  difficulty = 'Medium',
  count = 10,
  existingQuestions = [],
  offset = 0
}) => {
  const prompt = generatePrompt({
    module,
    category,
    department,
    topic,
    prompt: customPromptText,
    customPrompt,
    difficulty,
    count,
    existingQuestions
  });

  let questions = [];
  let resolvedProvider = 'gemini';

  const geminiKey = (process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY || '').trim();
  let generatedSuccessfully = false;

  if (geminiKey && geminiKey !== 'dummy_gemini_key_for_testing') {
    try {
      const geminiResult = await generateWithGemini(prompt, geminiKey);
      if (geminiResult && Array.isArray(geminiResult.questions) && geminiResult.questions.length > 0) {
        questions = geminiResult.questions;
        resolvedProvider = 'gemini';
        generatedSuccessfully = true;
      }
    } catch (err) {
      console.warn(`[AI Question Generator]: Google Gemini generation failed (${err.message}). Using academic fallback...`);
    }
  }

  if (!generatedSuccessfully || !Array.isArray(questions) || questions.length === 0) {
    questions = generateAcademicFallback({ module, category, topic, difficulty, count, offset });
    resolvedProvider = 'fallback';
  }

  return { questions, resolvedProvider };
};

/**
 * Main AI Generation Handler with Chunked Batching (10–20 questions per Gemini call),
 * Deduplication across batches, and Exact Count Validation.
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
  existingQuestions = []
}) => {
  const targetCount = parseInt(count, 10) || 5;

  // Determine optimal batch size between 10 and 20 questions per call
  // For 60 questions: 3 batches of 20 (or 4 of 15)
  let batchSize = 20;
  if (targetCount <= 20) {
    batchSize = targetCount;
  } else if (targetCount % 15 === 0 && targetCount % 20 !== 0) {
    batchSize = 15;
  } else if (targetCount <= 30) {
    batchSize = 15;
  } else {
    batchSize = 20;
  }

  const allQuestions = [];
  const accumulatedTexts = Array.isArray(existingQuestions)
    ? existingQuestions.map((q) => (typeof q === 'string' ? q : q?.questionText || '')).filter(Boolean)
    : [];

  let remaining = targetCount;
  let offset = 0;
  let mainResolvedProvider = provider;

  while (remaining > 0) {
    const currentChunkSize = Math.min(batchSize, remaining);

    const { questions: batchQuestions, resolvedProvider } = await generateSingleBatch({
      provider,
      module,
      category,
      department,
      topic,
      prompt,
      customPrompt,
      difficulty,
      count: currentChunkSize,
      existingQuestions: accumulatedTexts,
      offset
    });

    mainResolvedProvider = resolvedProvider;

    // Filter duplicates and validate each question in the batch
    for (const rawQ of batchQuestions) {
      if (allQuestions.length >= targetCount) break;

      const formatted = validateAndFormatQuestion(
        rawQ,
        difficulty,
        topic,
        module,
        category,
        department,
        resolvedProvider
      );

      if (!formatted) continue;

      // Deduplication check
      if (!isDuplicate(formatted.questionText, accumulatedTexts)) {
        allQuestions.push(formatted);
        accumulatedTexts.push(formatted.questionText);
      }
    }

    offset += currentChunkSize;
    remaining = targetCount - allQuestions.length;

    // If batch didn't make progress (e.g. duplicate storm), top up with academic fallback
    if (batchQuestions.length === 0) {
      break;
    }
  }

  // Guarantee EXACT targetCount: Top up any remaining deficit with validated academic fallback
  if (allQuestions.length < targetCount) {
    const deficit = targetCount - allQuestions.length;
    const fallbackTopUp = generateAcademicFallback({
      module,
      category,
      topic,
      difficulty,
      count: deficit,
      offset: allQuestions.length
    });

    for (const q of fallbackTopUp) {
      const formatted = validateAndFormatQuestion(
        q,
        difficulty,
        topic,
        module,
        category,
        department,
        'fallback'
      );
      if (formatted) {
        allQuestions.push(formatted);
      }
    }
  }

  // Return strictly validated, deduplicated set of exactly targetCount questions
  return allQuestions.slice(0, targetCount);
};

module.exports = { generateQuestionsAI, isDuplicate };

