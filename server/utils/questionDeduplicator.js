const crypto = require('crypto');

/**
 * Question Deduplication Engine
 * Detects exact duplicates, near-duplicates, and structural repeats
 * within batches, across sections, and against existing question banks.
 */

const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getWordTokens = (normalized) => {
  if (!normalized) return new Set();
  const tokens = normalized.split(' ').filter((w) => w.length > 2);
  return new Set(tokens);
};

const getCharShingles = (normalized, n = 3) => {
  const shingles = new Set();
  const cleaned = normalized.replace(/\s+/g, '');
  if (cleaned.length < n) {
    if (cleaned.length > 0) shingles.add(cleaned);
    return shingles;
  }
  for (let i = 0; i <= cleaned.length - n; i++) {
    shingles.add(cleaned.substring(i, i + n));
  }
  return shingles;
};

const jaccardSimilarity = (setA, setB) => {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
};

/**
 * Computes deterministic unique question hash based on question text and sorted options.
 */
const computeQuestionHash = (question) => {
  const qText = typeof question === 'string' ? question : question?.questionText || '';
  const opts = Array.isArray(question?.options)
    ? [...question.options].map((o) => normalizeText(String(o))).sort().join('|')
    : '';
  const payload = `${normalizeText(qText)}:::${opts}`;
  return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 24);
};

/**
 * Checks if candidate question is an exact or near duplicate of any question in existingList.
 * @param {Object|string} candidate
 * @param {Array<Object|string>} existingList
 * @param {number} threshold - Jaccard similarity threshold (0.0 to 1.0)
 * @returns {{ isDuplicate: boolean, similarity: number, matchedWith: string | null, reason: string | null }}
 */
const checkIsDuplicate = (candidate, existingList = [], threshold = 0.75) => {
  const candidateText = typeof candidate === 'string' ? candidate : candidate?.questionText || '';
  const normCandidate = normalizeText(candidateText);

  if (!normCandidate || normCandidate.length < 5) {
    return { isDuplicate: true, similarity: 1, matchedWith: null, reason: 'Candidate question text too short or empty' };
  }

  const candidateWords = getWordTokens(normCandidate);
  const candidateShingles = getCharShingles(normCandidate, 3);
  const candidateHash = computeQuestionHash(candidate);

  for (const existing of existingList) {
    if (!existing) continue;
    const existingText = typeof existing === 'string' ? existing : existing?.questionText || '';
    const normExisting = normalizeText(existingText);
    if (!normExisting || normExisting.length < 5) continue;

    // 1. Exact normalized text match
    if (normCandidate === normExisting) {
      return {
        isDuplicate: true,
        similarity: 1.0,
        matchedWith: existingText,
        reason: 'Exact normalized question text match'
      };
    }

    // 2. Exact hash match
    const existingHash = computeQuestionHash(existing);
    if (candidateHash === existingHash) {
      return {
        isDuplicate: true,
        similarity: 1.0,
        matchedWith: existingText,
        reason: 'Identical question content and options hash'
      };
    }

    // 3. Substring containment for long questions
    if (normCandidate.length > 35 && normExisting.length > 35) {
      if (normCandidate.includes(normExisting) || normExisting.includes(normCandidate)) {
        return {
          isDuplicate: true,
          similarity: 0.95,
          matchedWith: existingText,
          reason: 'Direct substring containment between question texts'
        };
      }
    }

    // 4. Token & Shingle Jaccard Near-duplicate check
    const existingWords = getWordTokens(normExisting);
    const wordSim = jaccardSimilarity(candidateWords, existingWords);

    const existingShingles = getCharShingles(normExisting, 3);
    const shingleSim = jaccardSimilarity(candidateShingles, existingShingles);

    // Combined similarity score
    const combinedSim = wordSim * 0.5 + shingleSim * 0.5;

    if (combinedSim >= threshold) {
      return {
        isDuplicate: true,
        similarity: parseFloat(combinedSim.toFixed(3)),
        matchedWith: existingText,
        reason: `Near-duplicate text overlap detected (${(combinedSim * 100).toFixed(1)}% match)`
      };
    }
  }

  return { isDuplicate: false, similarity: 0, matchedWith: null, reason: null };
};

/**
 * Filters a list of newly generated questions, eliminating internal duplicates
 * as well as duplicates against an accumulated pool.
 */
const filterUniqueQuestions = (newQuestions = [], existingPool = [], threshold = 0.75) => {
  const accepted = [];
  const rejectedDuplicates = [];
  const workingPool = [...existingPool];

  for (const q of newQuestions) {
    const dupCheck = checkIsDuplicate(q, workingPool, threshold);
    if (dupCheck.isDuplicate) {
      rejectedDuplicates.push({
        question: q,
        reason: dupCheck.reason,
        matchedWith: dupCheck.matchedWith,
        similarity: dupCheck.similarity
      });
    } else {
      accepted.push(q);
      workingPool.push(q);
    }
  }

  return { accepted, rejectedDuplicates };
};

module.exports = {
  normalizeText,
  computeQuestionHash,
  checkIsDuplicate,
  filterUniqueQuestions,
  jaccardSimilarity
};
