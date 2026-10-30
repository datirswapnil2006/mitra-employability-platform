const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const { cleanMathExpression, normalizeCurrencySymbols, toSuperscript, toSubscript } = require('./mathCleaner');

/**
 * Enhanced PDF Question Extractor & Pattern Parser
 * 
 * Supports:
 * 1. Logical Reasoning (directions, seating arrangements, blood relations, puzzles, syllogisms)
 * 2. Quantitative Aptitude (math expressions, DI sets, tables, charts, graphs)
 * 3. Verbal Ability (reading comprehension passages + questions, grammar, sentence rearrangement)
 * 4. Technical Assessments (CSE/IT/EXTC/Mech/Civil with code snippets and tables)
 * 5. Sequence and Context Preservation (shared passages linked across all member questions)
 * 6. Multi-column & Page-boundary awareness with original page & question numbering
 * 7. Embedded visual assets extraction (JPEG/diagrams) & scanned PDF OCR fallback via Gemini
 * 8. Comprehensive extraction validation & confidence scoring for admin review
 */

// Common header/footer noise patterns to filter out
const NOISE_PATTERNS = [
  /^Page\s+\d+(\s+of\s+\d+)?$/i,
  /^---\s*Page\s+\d+\s*---$/i,
  /^\d+\s*\/\s*\d+$/,
  /^Copyright\s*©?.*$/i,
  /^All\s+rights\s+reserved.*$/i,
  /^www\.[a-z0-9\.\-]+\.[a-z]{2,}/i,
  /^https?:\/\/[^\s]+/i,
  /^Downloaded\s+from\b.*$/i
];

/**
 * Custom PDF page render to preserve layout coordinates, handle multi-column layouts,
 * and track original page boundaries.
 */
function customPageRender(pageData) {
  return pageData.getTextContent({
    normalizeWhitespace: false,
    disableCombineTextItems: false
  }).then(function (textContent) {
    const items = textContent.items || [];
    if (items.length === 0) return '';

    const validItems = items.filter((it) => it.str && it.str.trim());
    if (validItems.length === 0) return '';

    // Measure geometric horizontal span to detect multi-column pages
    const xCoords = validItems.map((it) => it.transform[4]);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const spanX = maxX - minX;

    let isTwoColumn = false;
    const splitX = minX + spanX / 2;

    if (spanX > 260 && validItems.length >= 10) {
      const leftCluster = validItems.filter((it) => it.transform[4] < splitX - 15);
      const rightCluster = validItems.filter((it) => it.transform[4] > splitX + 15);
      // Both columns must have substantial text items
      if (
        leftCluster.length >= 5 &&
        rightCluster.length >= 5 &&
        leftCluster.length / validItems.length > 0.22 &&
        rightCluster.length / validItems.length > 0.22
      ) {
        isTwoColumn = true;
      }
    }

    const formatItemList = (list) => {
      // Sort descending by Y (top to bottom). If on same horizontal line (within 6.0 points), sort ascending by X.
      const sorted = [...list].sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 6.0) return yDiff;
        return a.transform[4] - b.transform[4];
      });

      const lines = [];
      let curLine = [];
      let curLineY = null;

      for (const item of sorted) {
        const y = item.transform[5];
        if (curLineY === null) {
          curLine = [item];
          curLineY = y;
        } else if (Math.abs(curLineY - y) > 6.0) {
          lines.push(curLine);
          curLine = [item];
          curLineY = y;
        } else {
          curLine.push(item);
        }
      }
      if (curLine.length) lines.push(curLine);

      const formattedLines = lines.map((lineItems) => {
        lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
        const baseItem = lineItems.reduce((min, it) => (it.transform[5] < min.transform[5] ? it : min), lineItems[0]);
        const baseY = baseItem.transform[5];

        let lineStr = '';
        for (const it of lineItems) {
          let str = it.str;
          const yDiff = it.transform[5] - baseY;

          // Convert raised digits to Unicode superscripts
          if (yDiff >= 2.5 && /^\d+$/.test(str.trim())) {
            str = toSuperscript(str.trim());
          } else if (yDiff <= -2.5 && /^\d+$/.test(str.trim())) {
            // Convert lowered digits to Unicode subscripts
            str = toSubscript(str.trim());
          }

          if (!lineStr) {
            lineStr = str;
          } else {
            const hasLeading = str.startsWith(' ');
            const hasTrailing = lineStr.endsWith(' ');
            const isSuper = yDiff >= 2.5 && /^[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/.test(str);
            const isSub = yDiff <= -2.5 && /^[₀₁₂₃₄₅₆₇₈₉]+$/.test(str);
            if (isSuper || isSub) {
              lineStr += str;
            } else if (!hasLeading && !hasTrailing) {
              lineStr += ' ' + str;
            } else {
              lineStr += str;
            }
          }
        }
        return lineStr;
      });

      return formattedLines.join('\n');
    };

    let pageText = '';
    if (isTwoColumn) {
      // Preserve top-of-page full-width banners, titles, or shared passage directions
      const sortedByY = [...validItems].sort((a, b) => b.transform[5] - a.transform[5]);
      const lines = [];
      let curLine = [];
      let curY = null;

      for (const item of sortedByY) {
        if (curY === null) {
          curLine = [item];
          curY = item.transform[5];
        } else if (Math.abs(curY - item.transform[5]) > 6.0) {
          lines.push(curLine);
          curLine = [item];
          curY = item.transform[5];
        } else {
          curLine.push(item);
        }
      }
      if (curLine.length) lines.push(curLine);

      const headerItems = [];
      const columnItems = [];
      let checkingHeader = true;

      for (const line of lines) {
        if (checkingHeader) {
          const lineMinX = Math.min(...line.map((it) => it.transform[4]));
          const lineMaxX = Math.max(...line.map((it) => it.transform[4]));
          const lineText = line.map((it) => it.str).join(' ').trim();
          const isBanner = /(?:TEST|EXAM|ASSESSMENT|PAPER|DIRECTIONS?|INSTRUCTIONS?|SECTION|PART|READING\s*COMPREHENSION|STUDY\s*THE)/i.test(lineText);
          const spansAcross = lineMinX < splitX - 30 && lineMaxX > splitX + 30;

          if (spansAcross || isBanner) {
            headerItems.push(...line);
            continue;
          } else {
            checkingHeader = false;
          }
        }
        columnItems.push(...line);
      }

      if (headerItems.length > 0 && columnItems.length >= 10) {
        const headerText = formatItemList(headerItems);
        const leftItems = columnItems.filter((it) => it.transform[4] < splitX);
        const rightItems = columnItems.filter((it) => it.transform[4] >= splitX);
        const leftText = formatItemList(leftItems);
        const rightText = formatItemList(rightItems);
        pageText = (headerText ? headerText + '\n' : '') + leftText + '\n' + rightText;
      } else {
        const leftItems = validItems.filter((it) => it.transform[4] < splitX);
        const rightItems = validItems.filter((it) => it.transform[4] >= splitX);
        const leftText = formatItemList(leftItems);
        const rightText = formatItemList(rightItems);
        pageText = leftText + '\n' + rightText;
      }
    } else {
      pageText = formatItemList(validItems);
    }

    const pageNum = pageData.pageIndex + 1;
    return `\n[[PAGE_START:${pageNum}]]\n${pageText}\n[[PAGE_END:${pageNum}]]\n`;
  });
}

/**
 * Separate glued option markers that were fused without spaces.
 * E.g. "MondayB) Tuesday" -> "Monday\nB) Tuesday"
 * Avoids splitting coordinate points or entity names (e.g. "Point B.", "Town C.")
 */
function normalizeGluedOptionMarkers(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    // Glued (A), (B), (C), (D), (E) or (i), (ii), (iii), (iv), (v) - strictly letters/roman numerals, not single digits (to avoid breaking O(1) or step (1))
    .replace(/([^\s\(\[\{])\s*(\((?:[A-Ea-e]|[ivx]+)\))/g, '$1\n$2')
    // Glued Option A, Option B...
    .replace(/([a-zA-Z0-9\?\.\,\!\)\'\"])\s*(Option\s+[A-Ea-e][\:\.\-]?)/gi, '$1\n$2')
    // Glued A), B), C), D), E) - only if NOT preceded by words indicating coordinate points or entities
    .replace(/(?<=[a-zA-Z0-9\?\.\,\!\)\'\"])\s*(?<!\b(?:Point|Person|Village|Town|City|Station|Node|Step|Table|Figure|from|to|at|is|of|and|or)\s*)([A-Ea-e]\))(?=\s+[A-Za-z0-9]|\s*$)/gi, '\n$1 ')
    // Horizontal inline option markers with period: e.g. "red  B. blue" -> "red\nB. blue"
    .replace(/(?<=[a-zA-Z0-9\?\!\)\'\"])\s{2,}(?<!\b(?:e\.g|i\.e|etc|vs|vol|no|dr|mr|mrs|prof)\s*)([A-Ea-e]\.)(?=\s+[A-Za-z0-9]|\s*$)/gi, '\n$1 ');
}

/**
 * Extract document title and metadata from header lines before first question or passage
 */
function extractDocumentMetadata(text) {
  let documentTitle = '';
  if (!text || typeof text !== 'string') return { documentTitle };

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];
    if (line.startsWith('[[PAGE_')) continue;
    if (/^(?:Directions?\s*(?:\([^\)]+\)|for|to|[\:\-])|Instructions?[\:\-]|Questions?\s*(?:\d+|\([^\)]+\)|[\:\-])|Study\s*the|Read\s*the|Q(?:uestion)?\.?\s*\d+|\d+[\.\)\-])/i.test(line)) {
      break;
    }
    if (
      /(?:TEST|ASSESSMENT|PAPER|EXAM|PRACTICE|DIRECTION\s*SENSE|LOGICAL\s*REASONING|APTITUDE|VERBAL\s*ABILITY|DOMAIN|COMPREHENSION|QUESTION\s*BANK|MCQS?|QUIZ|TOPIC)/i.test(line) &&
      line.length >= 4 &&
      line.length <= 100 &&
      !/(?:Option\s+[A-D]|[A-D][\)\.\:\-]\s+)/i.test(line)
    ) {
      documentTitle = line.replace(/^(?:Title\s*:\s*|Document\s*:\s*)/i, '').trim();
      break;
    }
  }

  return { documentTitle };
}


/**
 * Clean and normalize text from PDF while preserving page tokens
 */
function cleanExtractedText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  const cleaned = rawText
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (line.startsWith('[[PAGE_START:') || line.startsWith('[[PAGE_END:')) return true;
      return !NOISE_PATTERNS.some((pattern) => pattern.test(line));
    })
    .join('\n');

  const withCurrency = normalizeCurrencySymbols(cleaned);
  return normalizeGluedOptionMarkers(withCurrency);
}

/**
 * Extract embedded visual assets (JPEG images, diagrams, charts) from PDF buffer
 */
function extractEmbeddedVisualAssets(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length < 200) return [];
  const assets = [];
  try {
    const rawStr = pdfBuffer.toString('latin1');
    const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
    let match;
    let assetIndex = 1;

    while ((match = streamRegex.exec(rawStr)) !== null && assets.length < 15) {
      const streamStart = match.index + (match[0].indexOf('\n') + 1);
      const streamEnd = match.index + match[0].lastIndexOf('endstream');
      if (streamEnd <= streamStart) continue;

      const slice = pdfBuffer.subarray(streamStart, streamEnd);
      // Valid JPEG header check: 0xFF, 0xD8, 0xFF
      if (slice.length > 800 && slice[0] === 0xFF && slice[1] === 0xD8 && slice[2] === 0xFF) {
        const base64 = slice.toString('base64');
        assets.push({
          id: `img-${assetIndex++}`,
          mimeType: 'image/jpeg',
          dataUrl: `data:image/jpeg;base64,${base64}`,
          sizeBytes: slice.length
        });
      }
    }
  } catch (err) {
    console.warn('[PDF Visual Asset Extractor] Warning:', err.message);
  }

  return assets;
}

/**
 * Extract answer key and global explanations from the end of the document if present.
 */
function extractGlobalAnswerKey(text) {
  const { answerKeyMap } = extractGlobalAnswersAndExplanations(text);
  return answerKeyMap;
}

function extractGlobalAnswersAndExplanations(text) {
  const answerKeyMap = new Map();
  const explanationMap = new Map();

  // Section header for end-of-document answer keys. Supports "ANSWER KEY (Questions 1 - 120)", "Answer Keys:", "ANSWERS AND SOLUTIONS", "Key:", etc.
  const sectionHeaderRegex = /(?:^|\n)\s*(?:FINAL\s+)?(?:ANSWERS?\s*(?:&|AND)\s*(?:EXPLANATIONS?|SOLUTIONS?)|SOLUTIONS?\s*(?:&|AND)?\s*ANSWERS?|ANSWERS?\s*(?:&|AND)?\s*HINTS?|HINTS?\s*(?:&|AND)?\s*SOLUTIONS?|SOLUTIONS?|ANSWER\s*KEYS?|KEY\s*ANSWERS?|ANSWERS?\s*KEY|CORRECT\s+(?:ANSWERS?|OPTIONS?)|ANSWERS?\s*SHEET|RESPONSE\s*KEYS?|SCORING\s*KEYS?|KEYS?|ANSWERS?)(?:\s*\([^\)\n]+\))?\s*[\:\-]?\s*\n([\s\S]+)$/i;
  const match = text.match(sectionHeaderRegex);

  if (match && match[1]) {
    const keySection = match[1];

    // Safety check: ensure this is not an accidental mid-document match containing fresh questions with multiple options
    const hasFullSubsequentQuestion = /(?:^|\n)\s*(?:Question\s*\d+|\b\d+[\.\)])[^\n]{15,}\n\s*(?:\(?[A-Ea-e]\)?|[A-Ea-e][\)\.])[^\n]+\n\s*(?:\(?[A-Ea-e]\)?|[A-Ea-e][\)\.])/i.test(keySection);
    if (hasFullSubsequentQuestion) {
      return { answerKeyMap, explanationMap };
    }

    // Pattern A: Numbered items with answers and detailed explanations (supports pipe | tables and option E)
    const blockRegex = /(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\)\-\:\s\t\|]*(?:\(?([A-Ea-e1-5])\)?[\.\:\-\s\t\|]+)?([^\n]+(?:\n(?!\s*(?:Q(?:uestion)?\.?\s*)?\d+[\.\)\-\:\s\t\|]+)[^\n]+)*)/gi;
    let blockMatch;

    while ((blockMatch = blockRegex.exec(keySection)) !== null) {
      const qNum = parseInt(blockMatch[1], 10);
      const letter = blockMatch[2] ? blockMatch[2].toUpperCase() : '';
      const body = (blockMatch[3] || '').trim();

      if (letter && ['A', 'B', 'C', 'D', 'E', '1', '2', '3', '4', '5'].includes(letter)) {
        const normalizedLetter = ['1', '2', '3', '4', '5'].includes(letter)
          ? String.fromCharCode(64 + parseInt(letter, 10))
          : letter;
        answerKeyMap.set(qNum, normalizedLetter);
      }

      if (body) {
        const ansInBody = body.match(/^(?:\(?([A-Ea-e1-5])\)?[\.\:\-\s\t\|]*|\bOption\s+([A-Ea-e1-5])[\.\:\-\s\t\|]*)([\s\S]*)/i);
        if (ansInBody) {
          const rawL = (ansInBody[1] || ansInBody[2]).toUpperCase();
          const l = ['1', '2', '3', '4', '5'].includes(rawL)
            ? String.fromCharCode(64 + parseInt(rawL, 10))
            : rawL;
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

    // Pattern B: Compact / Table / Glued answer keys: "1. A, 2. B, 3. C", "1(b) 2(c)", "1 | A \n 2 | B", "1-A 2-B"
    const simpleRegex = /(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\)\-\:\s\t\|]*(?:\(?([A-Ea-e1-5])\)?)/g;
    let simpleMatch;
    while ((simpleMatch = simpleRegex.exec(keySection)) !== null) {
      const qNum = parseInt(simpleMatch[1], 10);
      const letter = simpleMatch[2].toUpperCase();
      if (!answerKeyMap.has(qNum)) {
        const norm = ['1', '2', '3', '4', '5'].includes(letter)
          ? String.fromCharCode(64 + parseInt(letter, 10))
          : letter;
        answerKeyMap.set(qNum, norm);
      }
    }
  }

  return { answerKeyMap, explanationMap };
}

/**
 * Detect Shared Context Sets (Reading Comprehension passages, Seating arrangements,
 * Blood relations premises, Case studies, DI Tables) with question ranges.
 * Supports any number of questions per group (Q1-Q5, Q1-Q3, etc.) and unnumbered passages.
 */
function detectSharedContextSets(text, questionBlocks = []) {
  const sharedSets = [];

  // 1. Regex for explicit directions / passage headers with question ranges:
  // e.g., "Directions (Q. 1 to 5):", "Directions (Questions 1 - 4):", "Questions 1 to 5 are based on...",
  // "Study the following information and answer questions 1 to 5:", "Directions (16 - 20):"
  const dirRegex = /(?:^|\n)\s*(?:(?:Directions?|Instructions?|Passage|Case\s*Study|Study\s*the\s*following|Read\s*the\s*following|Questions?|Based\s*on\s*the\s*following|Refer\s*to\s*the\s*following)\s*(?:[^\n\r\:\-]*?)?(?:\(?\s*(?:for\s+)?(?:Q(?:uestions?|ue)?\.?\s*)?(\d+)\s*(?:to|-|–|—|through)\s*(?:Q(?:uestions?|ue)?\.?\s*)?(\d+)\s*\)?|\b(?:for\s+)?(?:Q(?:uestions?|ue)?\.?\s*)?(\d+)\s*(?:to|-|–|—)\s*(\d+)\b)[^\n\r]*?[\:\-])([\s\S]*?)(?=(?:\n\s*(?:Q(?:uestion|ue|ues)?\.?\s*\d+|\b\d+[\.\)\-]))|$)/gi;

  let m;
  while ((m = dirRegex.exec(text)) !== null) {
    const startQ = parseInt(m[1] || m[3], 10);
    const endQ = parseInt(m[2] || m[4], 10);
    let passage = (m[5] || '').trim();

    // Clean page break tokens from passage body
    passage = passage.replace(/\[\[PAGE_(?:START|END):\d+\]\]/g, '').trim();

    if (startQ && endQ && endQ >= startQ && passage.length > 15) {
      if (!sharedSets.some((s) => s.startQ === startQ && s.endQ === endQ)) {
        sharedSets.push({
          startQ,
          endQ,
          title: `Directions (Q. ${startQ} - ${endQ})`,
          passage: cleanExtractedText(passage)
        });
      }
    }
  }

  // 2. Unnumbered passages / directions that appear before question numbers
  const unnumberedDirRegex = /(?:^|\n)\s*(?:(?:Directions?|Instructions?|Case\s*Study|Study\s*the\s*following|Read\s*the\s*following|Reading\s*Comprehension)[\s\:\-]+)([^\n]+(?:\n(?!\s*(?:Q(?:uestion|ue|ues)?\.?\s*\d+|\b\d+[\.\)\-]))[^\n]+)*)(?=\n\s*(?:Q(?:uestion|ue|ues)?\.?\s*(\d+)|\b(\d+)[\.\)\-]))/gi;

  let um;
  const unnumberedMatches = [];
  while ((um = unnumberedDirRegex.exec(text)) !== null) {
    const startQ = parseInt(um[3] || um[4], 10);
    let rawPassage = (um[1] || '').replace(/\[\[PAGE_(?:START|END):\d+\]\]/g, '').trim();
    if (startQ && rawPassage.length > 25 && !sharedSets.some((s) => startQ >= s.startQ && startQ <= s.endQ)) {
      unnumberedMatches.push({
        startQ,
        rawPassage
      });
    }
  }

  for (let u = 0; u < unnumberedMatches.length; u++) {
    const cur = unnumberedMatches[u];
    let endQ = null;
    if (u + 1 < unnumberedMatches.length) {
      endQ = unnumberedMatches[u + 1].startQ - 1;
    } else {
      const nextExplicit = sharedSets.find((s) => s.startQ > cur.startQ);
      if (nextExplicit) {
        endQ = nextExplicit.startQ - 1;
      } else if (Array.isArray(questionBlocks) && questionBlocks.length > 0) {
        const remaining = questionBlocks.filter((b) => b.number >= cur.startQ);
        endQ = remaining.length > 0 ? remaining[remaining.length - 1].number : cur.startQ + 4;
      } else {
        endQ = cur.startQ + 4;
      }
    }

    if (endQ < cur.startQ) endQ = cur.startQ + 4;

    sharedSets.push({
      startQ: cur.startQ,
      endQ,
      title: `Directions (Q. ${cur.startQ} - ${endQ})`,
      passage: cleanExtractedText(cur.rawPassage)
    });
  }

  sharedSets.sort((a, b) => a.startQ - b.startQ);
  return sharedSets;
}

/**
 * Separate technical code snippets (C/C++, Java, Python, SQL) from question text
 */
function extractTechnicalContent(text) {
  if (!text) return { cleanText: text, codeSnippet: '' };

  // 1. Fenced code block ``` ... ```
  const fenceMatch = text.match(/```(?:[a-zA-Z0-9#+]+)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return {
      cleanText: text.replace(fenceMatch[0], '').trim(),
      codeSnippet: fenceMatch[1].trim()
    };
  }

  // 2. Embedded multi-line C / Java / Python / SQL code snippet
  const codeBlockRegex = /(?:#include\s*<[^>]+>[\s\S]+?\}|public\s+class\s+[A-Za-z0-9_]+[\s\S]+?\}|def\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*:[\s\S]+?(?=\b[A-D][\)\.]|\bOption|$)|SELECT\s+[\s\S]+?FROM\s+[a-zA-Z0-9_]+[\s\S]*?(?=;|\b[A-D][\)\.]|\bOption|$))/i;
  const codeMatch = text.match(codeBlockRegex);
  if (codeMatch && codeMatch[0].length > 25) {
    return {
      cleanText: text.replace(codeMatch[0], '').trim(),
      codeSnippet: codeMatch[0].trim()
    };
  }

  return { cleanText: text, codeSnippet: '' };
}

/**
 * Split text into raw question blocks based on question starters,
 * tracking page boundaries and preserving shared passage markers.
 */
function splitIntoQuestionBlocks(text) {
  let workingText = text;

  // Strip global Answer Key section from end of text so it does not generate false question blocks.
  const answerSectionRegex = /(?:^|\n)\s*(?:FINAL\s+)?(?:ANSWERS?\s*(?:&|AND)\s*(?:EXPLANATIONS?|SOLUTIONS?)|SOLUTIONS?\s*(?:&|AND)?\s*ANSWERS?|ANSWERS?\s*(?:&|AND)?\s*HINTS?|HINTS?\s*(?:&|AND)?\s*SOLUTIONS?|SOLUTIONS?|ANSWER\s*KEYS?|KEY\s*ANSWERS?|ANSWERS?\s*KEY|CORRECT\s+(?:ANSWERS?|OPTIONS?)|ANSWERS?\s*SHEET|RESPONSE\s*KEYS?|SCORING\s*KEYS?|KEYS?|ANSWERS?)(?:\s*\([^\)\n]+\))?\s*[\:\-]?\s*\n([\s\S]+)$/i;
  const ansMatch = workingText.match(answerSectionRegex);
  if (ansMatch) {
    const candidateSection = ansMatch[1] || '';
    // Ensure this is truly an answer key section at the end and not questions with options
    const hasFullSubsequentQuestion = /(?:^|\n)\s*(?:Question\s*\d+|\b\d+[\.\)])[^\n]{15,}\n\s*(?:\(?[A-Ea-e]\)?|[A-Ea-e][\)\.])[^\n]+\n\s*(?:\(?[A-Ea-e]\)?|[A-Ea-e][\)\.])/i.test(candidateSection);
    if (!hasFullSubsequentQuestion) {
      workingText = workingText.substring(0, ansMatch.index).trim();
    }
  }

  // Regex to match question numbering at start of a line
  // Matches: "1.", "1)", "1-", "(1)", "[1]", "Q1.", "Q1:", "Q.1", "Question 1:", "Question-1", "Que 1.", "Ques 1:", "Problem 1:", "Exercise 1:", "Task 1:", "Item 1:"
  // Supports glued numbers like "101.What", "101)What", "50.₹500", "50.25%" without mandatory trailing space
  const questionStartRegex = /(?:^|\n)\s*(?:(?:(?:Q(?:uestion|ue|ues)?|Problem|Prob|Exercise|Task|Item)[.\s\-:]*(\d+)[\.\)\-\:\s]*)|(?:\((\d+)\))|(?:\[(\d+)\])|(?:(\d+)[\.\)\-\:\/]))(?:\s*)/gi;

  const indices = [];
  let match;

  while ((match = questionStartRegex.exec(workingText)) !== null) {
    if (match.index === questionStartRegex.lastIndex) {
      questionStartRegex.lastIndex++;
    }
    const qNumStr = match[1] || match[2] || match[3] || match[4];
    const qNum = parseInt(qNumStr, 10);
    indices.push({
      index: match.index,
      length: match[0].length,
      number: qNum
    });
  }

  // Scan document section banners (e.g., "SECTION A: QUANTITATIVE APTITUDE", "PART I - REASONING", "MODULE 1")
  const sectionBannerRegex = /(?:^|\n)\s*(?:SECTION|PART|MODULE)\s*([A-Z0-9IVX]+)(?:\s*[\:\-]\s*([^\n\r]+))?/gi;
  const sectionBanners = [];
  let sMatch;
  while ((sMatch = sectionBannerRegex.exec(workingText)) !== null) {
    const secLetter = sMatch[1];
    const secTitle = (sMatch[2] || '').trim();
    let label = secTitle ? secTitle : `Section ${secLetter}`;
    sectionBanners.push({
      index: sMatch.index,
      label
    });
  }

  // Fallback if no standard numbered questions found
  if (indices.length === 0) {
    const fallbackBlocks = workingText.split(/\n{2,}/).filter((b) => b.trim().length > 20);
    return fallbackBlocks.map((block, idx) => ({
      rawText: block.trim(),
      number: idx + 1,
      pageNumber: 1,
      documentSection: ''
    }));
  }

  // Intervening directions or section headers regex to prevent bleeding into previous question block
  const passageHeaderRegex = /(?:^|\n)\s*(?:(?:Directions?|Instructions?|Passage|Case\s*Study|Study\s*the\s*following|Read\s*the\s*following|Questions?\s*(?:\(?\s*(?:for\s+)?(?:Q(?:uestions?|ue)?\.?\s*)?\d+|\b\d+\s*(?:to|-)))|SECTION\s+[A-Z0-9]+|PART\s+[A-Z0-9]+)/i;
  const hasOptionsRegex = /(?:Option\s+[A-Ea-e]|\(?[A-Ea-e1-5][\)\.\:\-]\s*)/i;

  const blocks = [];
  for (let i = 0; i < indices.length; i++) {
    const startPos = indices[i].index + indices[i].length;
    let endPos = i + 1 < indices.length ? indices[i + 1].index : workingText.length;

    // Check if intervening text has directions / passage header for next set (only if not the last question)
    if (i + 1 < indices.length) {
      const chunkBetween = workingText.substring(startPos, endPos);
      const pMatch = chunkBetween.match(passageHeaderRegex);
      if (pMatch && pMatch.index > 0) {
        const textBefore = chunkBetween.substring(0, pMatch.index);
        const textAfter = chunkBetween.substring(pMatch.index);
        // Only truncate if the text BEFORE pMatch already has options, and the text AFTER does NOT have options (belongs to the next section)
        if (hasOptionsRegex.test(textBefore) && !hasOptionsRegex.test(textAfter)) {
          endPos = startPos + pMatch.index;
        }
      }
    }

    let rawBlock = workingText.substring(startPos, endPos).trim();

    // Determine original page number from page boundary tags
    let pageNumber = 1;
    const precedingText = workingText.substring(0, startPos);
    const pageMatches = [...precedingText.matchAll(/\[\[PAGE_START:(\d+)\]\]/g)];
    if (pageMatches.length > 0) {
      pageNumber = parseInt(pageMatches[pageMatches.length - 1][1], 10);
    }

    // Check if question continues onto the next page
    const blockEndPageMatches = [...rawBlock.matchAll(/\[\[PAGE_START:(\d+)\]\]/g)];
    if (blockEndPageMatches.length > 0) {
      const nextPage = parseInt(blockEndPageMatches[blockEndPageMatches.length - 1][1], 10);
      if (nextPage !== pageNumber) {
        pageNumber = `${pageNumber}-${nextPage}`;
      }
    }

    // Clean page markers inside question block
    rawBlock = rawBlock.replace(/\[\[PAGE_(?:START|END):\d+\]\]/g, '').trim();

    // Strip any leaked section headers from the block
    rawBlock = rawBlock.replace(/^(?:SECTION\s+[A-Z0-9\-]+|PART\s+[A-Z0-9\-]+)[\s\:\-]*/i, '').trim();

    // Find active section banner for this question
    let documentSection = '';
    const activeBanner = sectionBanners.filter((b) => b.index < indices[i].index).pop();
    if (activeBanner) {
      documentSection = activeBanner.label;
    }

    if (rawBlock.length > 0) {
      blocks.push({
        rawText: rawBlock,
        number: indices[i].number || i + 1,
        pageNumber,
        documentSection
      });
    }
  }

  return blocks;
}

/**
 * Detect Section and Domain Type from question text and shared context.
 * Strictly respects targetTopic and defaultSection / category to prevent misclassification.
 */
function detectSectionAndType(
  text,
  passage = '',
  codeSnippet = '',
  defaultSection = 'Quantitative Aptitude',
  targetTopic = ''
) {
  const combined = `${text} ${passage}`.toLowerCase();
  const topicLower = (targetTopic || '').toLowerCase();
  const defaultLower = (defaultSection || '').toLowerCase();

  // 1. Technical / Domain Assessment
  if (codeSnippet || combined.includes('#include') || combined.includes('def ') || (combined.includes('select ') && combined.includes('from ')) || combined.includes('sql') || combined.includes('binary tree') || combined.includes('database')) {
    return { section: 'Domain Knowledge (CSE/IT)', type: codeSnippet ? 'output' : 'mcq' };
  }
  if (combined.includes('circuit') || combined.includes('op-amp') || combined.includes('microcontroller') || combined.includes('modulation') || combined.includes('signal')) {
    return { section: 'Domain Knowledge (EXTC)', type: 'mcq' };
  }
  if (combined.includes('thermodynamic') || combined.includes('reynolds') || combined.includes('stress') || combined.includes('strain') || combined.includes('gear')) {
    return { section: 'Domain Knowledge (Mechanical)', type: 'mcq' };
  }
  if (combined.includes('surveying') || combined.includes('concrete') || combined.includes('soil mechanics') || combined.includes('beam')) {
    return { section: 'Domain Knowledge (Civil)', type: 'mcq' };
  }

  // 2. Explicit or Inferred Logical Reasoning (Direction Sense, Seating Arrangement, Blood Relations, Puzzles, Syllogisms)
  const isDirectionSense =
    topicLower.includes('direction') ||
    combined.includes('facing north') ||
    combined.includes('facing south') ||
    combined.includes('facing east') ||
    combined.includes('facing west') ||
    combined.includes('north-east') ||
    combined.includes('south-west') ||
    combined.includes('north-west') ||
    combined.includes('south-east') ||
    combined.includes('direction and distance') ||
    combined.includes('direction diagram') ||
    combined.includes('which direction') ||
    combined.includes('starting point and final position') ||
    combined.includes('starting point') ||
    combined.includes('final position') ||
    combined.includes('shortest distance') ||
    combined.includes('walks 10 meters') ||
    combined.includes('turns right') ||
    combined.includes('turns left') ||
    combined.includes('turns towards');

  const isLogicalReasoning =
    isDirectionSense ||
    topicLower.includes('reasoning') ||
    topicLower.includes('blood') ||
    topicLower.includes('seating') ||
    topicLower.includes('puzzle') ||
    topicLower.includes('syllogism') ||
    defaultLower.includes('reasoning') ||
    combined.includes('seating arrangement') ||
    combined.includes('circular table') ||
    combined.includes('blood relation') ||
    combined.includes('syllogism');

  if (isLogicalReasoning) {
    return { section: 'Logical Reasoning', type: 'logical_reasoning' };
  }

  // 3. Quantitative Aptitude (Data Interpretation, Math)
  if (
    topicLower.includes('data interpretation') ||
    combined.includes('bar chart') ||
    combined.includes('pie chart') ||
    combined.includes('line graph') ||
    combined.includes('table below') ||
    combined.includes('data interpretation')
  ) {
    return { section: 'Quantitative Aptitude', type: 'data_interpretation' };
  }
  if (
    topicLower.includes('quant') ||
    topicLower.includes('math') ||
    topicLower.includes('percentage') ||
    topicLower.includes('profit') ||
    combined.includes('profit') ||
    combined.includes('percentage') ||
    combined.includes('ratio') ||
    combined.includes('time and work') ||
    combined.includes('speed') ||
    combined.includes('probability') ||
    combined.includes('algebra')
  ) {
    return { section: 'Quantitative Aptitude', type: 'mcq' };
  }

  // 4. Verbal Ability (Reading Comprehension, Grammar)
  if (
    topicLower.includes('verbal') ||
    topicLower.includes('comprehension') ||
    topicLower.includes('reading') ||
    defaultLower.includes('verbal') ||
    (passage && (combined.includes('author') || combined.includes('tone') || combined.includes('central idea') || combined.includes('passage') || combined.includes('meaning of'))) ||
    combined.includes('synonym') ||
    combined.includes('antonym') ||
    combined.includes('grammatically') ||
    combined.includes('fill in the blank') ||
    combined.includes('sentence rearrangement')
  ) {
    const isRc = !!passage && (combined.includes('passage') || combined.includes('author') || combined.includes('comprehension'));
    return { section: 'Verbal Ability', type: isRc ? 'reading_comprehension' : 'mcq' };
  }

  if (defaultLower.includes('reasoning')) return { section: 'Logical Reasoning', type: 'logical_reasoning' };
  if (defaultLower.includes('quant')) return { section: 'Quantitative Aptitude', type: 'mcq' };
  if (defaultLower.includes('verbal')) return { section: 'Verbal Ability', type: 'mcq' };
  return { section: defaultSection || 'Quantitative Aptitude', type: 'mcq' };
}

/**
 * Parse an individual question block to extract:
 * - Question statement (with math expressions cleaned)
 * - Options A, B, C, D
 * - Correct Answer
 * - Explanation
 * - Shared Context / Passage (if part of reading comp, seating, or DI set)
 * - Code snippet (if technical)
 * - Associated Visual Asset
 */
function parseQuestionBlock(
  rawBlock,
  qNumber,
  globalAnswerKey = new Map(),
  defaultDifficulty = 'Medium',
  globalExplanations = new Map(),
  sharedContextSets = [],
  visualAssets = [],
  pageNumber = 1,
  defaultCategory = 'Quantitative Aptitude',
  targetTopic = ''
) {
  let text = typeof rawBlock === 'object' && rawBlock !== null ? (rawBlock.rawText || '') : String(rawBlock || '').trim();
  const blockDocumentSection = typeof rawBlock === 'object' && rawBlock !== null ? rawBlock.documentSection : '';

  // Reject standalone concept/formula header blocks that lack options
  if (
    /^(?:Important\s+)?(?:Formula|Formulas|Concept|Concepts|Theory|Overview|Definition|Rule|Rules|Tip|Tips)\b/i.test(text) &&
    !/(?:Option\s+[A-E]|[A-Ea-e1-5][\)\.\:\-]\s+|\([ivx]+\))/i.test(text)
  ) {
    return null;
  }

  // 1. Separate Code Snippet if present
  const { cleanText: textWithoutCode, codeSnippet } = extractTechnicalContent(text);
  text = textWithoutCode;

  let explanation = '';
  let correctAnswer = '';
  let answerLetter = '';

  // 2. Extract Explanation if present
  const explanationRegex = /(?:\[?\s*(?:Detailed\s+Explanation|Explanation|Detailed\s+Solution|Solutions?|Soln|Sol|Rationale|Reasoning|Reason|Hints?|Description)\s*[.:\-\]\s]*)([\s\S]+)$/i;
  const expMatch = text.match(explanationRegex);
  if (expMatch) {
    explanation = expMatch[1].trim();
    text = text.substring(0, expMatch.index).trim();

    const ansInExp = explanation.match(/(?:\[?\s*(?:Correct\s*(?:Answer|Option)|Answer|Ans|Key)\s*[.:\-\]\s]*\s*(?:is\s*)?)(?:Option\s*([A-Ea-e1-5])\b|\(?([A-Ea-e1-5]|[ivx]+)\)?(?!\S)|([^\n\r\]]+))|(?:\bOption\s*\(?([A-Ea-e1-5])\)?\s*is\s*(?:the\s*)?correct)/i);
    if (ansInExp) {
      const rawChar = ansInExp[1] || ansInExp[2] || ansInExp[4];
      if (rawChar) {
        answerLetter = (rawChar).toUpperCase();
      }
      explanation = explanation.substring(0, ansInExp.index).trim();
    }
  }

  // 3. Extract Answer if present (supports "Ans. B", "Ans: C", "[Ans: B]", "Option C is correct", "Answer is (c)")
  const answerRegex = /(?:\[?\s*(?:Correct\s*(?:Answer|Option)|Answer|Ans|Key)\s*[.:\-\]\s]*\s*(?:is\s*)?)(?:Option\s*([A-Ea-e1-5])\b|\(?([A-Ea-e1-5]|[ivx]+)\)?(?!\S)|([^\n\r\]]+))|(?:\bOption\s*\(?([A-Ea-e1-5])\)?\s*is\s*(?:the\s*)?correct)/i;
  const ansMatch = text.match(answerRegex);
  if (ansMatch) {
    const rawChar = ansMatch[1] || ansMatch[2] || ansMatch[4];
    if (rawChar) {
      answerLetter = rawChar.toUpperCase();
    } else if (ansMatch[3]) {
      const rawAns = ansMatch[3].trim();
      if (['A', 'B', 'C', 'D', 'E', '1', '2', '3', '4', '5'].includes(rawAns.toUpperCase())) {
        answerLetter = rawAns.toUpperCase();
      } else {
        correctAnswer = rawAns;
      }
    }
    text = text.substring(0, ansMatch.index).trim();
  }

  // Check global answer key and explanations if not inline
  if (!answerLetter && !correctAnswer && globalAnswerKey.has(qNumber)) {
    answerLetter = globalAnswerKey.get(qNumber);
  }
  if (!explanation && globalExplanations.has(qNumber)) {
    explanation = globalExplanations.get(qNumber);
  }

  // Helper to normalize option markers (A-E, 1-5, i-v) to standard letters
  const normalizeOptLetter = (letterStr) => {
    if (!letterStr) return '';
    const l = String(letterStr).trim().toLowerCase();
    if (['1', 'i', 'a'].includes(l)) return 'A';
    if (['2', 'ii', 'b'].includes(l)) return 'B';
    if (['3', 'iii', 'c'].includes(l)) return 'C';
    if (['4', 'iv', 'd'].includes(l)) return 'D';
    if (['5', 'v', 'e'].includes(l)) return 'E';
    return l.toUpperCase();
  };

  // 4. Extract Options
  let options = [];
  let questionText = text;
  const optionMap = {};

  // Method A: Check line-by-line options first
  // Lines starting with (A), A), A., [A], Option A:, (i), i):
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const optLineRegex = /^(?:\(?([A-Ea-e1-5]|[ivx]+)[\)\]\.\:\-]|\[([A-Ea-e1-5]|[ivx]+)\]|Option\s+([A-Ea-e])[\:\.\-]?)\s*(.*)/i;

  let optStartLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const m = l.match(optLineRegex);
    const rawChar = m?.[1] || m?.[2] || m?.[3] || '';
    const letter = normalizeOptLetter(rawChar);
    if (m && letter === 'A') {
      // Verify not an entity statement like "Point A is..."
      const remainder = (m[4] || m[3] || '').trim();
      const isEntityStatement = /^(?:is|was|are|were|has|have|walks|runs|moves|stands|facing)\b/i.test(remainder);
      if (!isEntityStatement) {
        optStartLineIdx = i;
        break;
      }
    }
  }

  if (optStartLineIdx !== -1) {
    const qLines = lines.slice(0, optStartLineIdx);
    const optLines = lines.slice(optStartLineIdx);
    let curLetter = null;

    for (const l of optLines) {
      // Check if this line is an inline answer or explanation - stop options from bleeding!
      const isAns = l.match(answerRegex);
      const isExp = l.match(explanationRegex);
      if (isAns || isExp) {
        if (isAns && !answerLetter && !correctAnswer) {
          const rawChar = isAns[1] || isAns[2] || isAns[4];
          if (rawChar) answerLetter = normalizeOptLetter(rawChar);
          else if (isAns[3]) correctAnswer = isAns[3].trim();
        }
        if (isExp && !explanation) {
          explanation = (isExp[1] || '').trim();
        }
        break;
      }

      const m = l.match(optLineRegex);
      if (m) {
        const rawChar = m[1] || m[2] || m[3];
        const norm = normalizeOptLetter(rawChar);
        curLetter = norm;
        let val = (m[4] || m[3] || '').replace(/\s+/g, ' ').trim();

        // Check if inline answer is embedded on the same line as the option
        const trailingAns = val.match(answerRegex);
        if (trailingAns) {
          const rawAns = trailingAns[1] || trailingAns[2] || trailingAns[4];
          if (!answerLetter && !correctAnswer) {
            if (rawAns) answerLetter = normalizeOptLetter(rawAns);
            else if (trailingAns[3]) correctAnswer = trailingAns[3].trim();
          }
          val = val.substring(0, trailingAns.index).trim();
        }

        optionMap[norm] = val;
        options.push(val);
      } else if (curLetter && options.length > 0) {
        // Multi-line continuation
        const cont = l.replace(/\s+/g, ' ').trim();
        options[options.length - 1] += ' ' + cont;
        optionMap[curLetter] += ' ' + cont;
      }
    }

    if (options.length >= 2 && optionMap['A'] && optionMap['B']) {
      questionText = qLines.join(' ').trim();
    } else {
      options = [];
    }
  }

  // Method B: Horizontal options regex
  // Matches A) ... B) ... C) ... D) or (A) ... (B) ... or [A] ... [B] ... or (i) ... (ii) ...
  if (options.length < 2) {
    const horizRegex = /(?:^|\s+)(?<!(?:Point|Person|Village|Town|City|Station|Node|Step|Table|Figure)\s+)(?:Option\s+([A-Ea-e])[\:\.\-\s]*|\[([A-Ea-e1-5])\]\s*|\(?([A-Ea-e])[\)\]\.\:\-]\s*|\(([1-5])\)\s*|([1-5])[\)\.\:\-]\s*|\(([ivx]+)\)\s*)/gi;
    const matches = [];
    let hm;
    while ((hm = horizRegex.exec(text)) !== null) {
      const rawChar = hm[1] || hm[2] || hm[3] || hm[4] || hm[5] || hm[6] || '';
      const letter = normalizeOptLetter(rawChar);
      matches.push({
        letter,
        index: hm.index + (hm[0].length - hm[0].trimStart().length),
        length: hm[0].trim().length,
        fullIndex: hm.index,
        fullLength: hm[0].length
      });
    }

    // Must find sequential markers starting with A then B
    let aIdx = -1;
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].letter === 'A' && matches[i + 1]?.letter === 'B') {
        aIdx = i;
        break;
      }
    }

    if (aIdx !== -1) {
      const validMatches = matches.slice(aIdx);
      questionText = text.substring(0, validMatches[0].fullIndex).trim();
      options = [];
      for (let i = 0; i < validMatches.length; i++) {
        const cur = validMatches[i];
        const start = cur.fullIndex + cur.fullLength;
        const end = i + 1 < validMatches.length ? validMatches[i + 1].fullIndex : text.length;
        let optVal = text.substring(start, end).trim();
        optVal = optVal.replace(/\s+/g, ' ').trim();
        if (optVal) {
          // Check and strip trailing answer on horizontal options
          const trailingAns = optVal.match(answerRegex);
          if (trailingAns) {
            const rawAns = trailingAns[1] || trailingAns[2] || trailingAns[4];
            if (!answerLetter && !correctAnswer) {
              if (rawAns) answerLetter = normalizeOptLetter(rawAns);
              else if (trailingAns[3]) correctAnswer = trailingAns[3].trim();
            }
            optVal = optVal.substring(0, trailingAns.index).trim();
          }
          options.push(optVal);
          optionMap[cur.letter] = optVal;
        }
      }
    }
  }

  // Method C: Fallback line detection for options if standard markers were slightly deformed
  if (options.length < 2) {
    const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (rawLines.length >= 3) {
      let splitIdx = -1;
      for (let i = 1; i < rawLines.length; i++) {
        const line = rawLines[i];
        if (/^(?:[\(\[]?[A-E1-5a-e][\)\]\.\:\-]|Option\s+[A-Ea-e])/i.test(line)) {
          splitIdx = i;
          break;
        }
      }
      if (splitIdx !== -1) {
        questionText = rawLines.slice(0, splitIdx).join(' ').trim();
        for (let j = splitIdx; j < rawLines.length; j++) {
          const cleanOpt = rawLines[j].replace(/^(?:[\(\[]?[A-E1-5a-e][\)\]\.\:\-]|Option\s+[A-Ea-e][\:\.\-]?)\s*/i, '').trim();
          if (cleanOpt) {
            options.push(cleanOpt);
            const letter = String.fromCharCode(65 + (options.length - 1));
            optionMap[letter] = cleanOpt;
          }
        }
      }
    }
  }

  // Must have at least 2 detected options to be considered an MCQ
  if (options.length < 2) {
    const candidateLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (candidateLines.length >= 3 && candidateLines[0].length >= 8) {
      questionText = candidateLines[0];
      for (let k = 1; k < Math.min(candidateLines.length, 5); k++) {
        options.push(candidateLines[k]);
        optionMap[String.fromCharCode(65 + k - 1)] = candidateLines[k];
      }
    } else {
      return null;
    }
  }

  // Clean and normalize question text
  questionText = questionText
    .replace(/\s+/g, ' ')
    .replace(/^(?:Q(?:uestion|ue|ues)?\.?\s*\d+[\.\:\-\)]*|\d+[\.\)\-]*)\s*/i, '')
    .trim();

  // Clean math formatting
  questionText = cleanMathExpression(questionText);

  if (!questionText || questionText.length < 4) {
    return null;
  }

  // Normalize options: preserve 5 options if Option E is present or detected
  let finalOptions = [];
  if (optionMap['E'] || options.length >= 5) {
    finalOptions = [
      cleanMathExpression(optionMap['A'] || options[0] || 'Option A'),
      cleanMathExpression(optionMap['B'] || options[1] || 'Option B'),
      cleanMathExpression(optionMap['C'] || options[2] || 'Option C'),
      cleanMathExpression(optionMap['D'] || options[3] || 'Option D'),
      cleanMathExpression(optionMap['E'] || options[4] || 'Option E')
    ];
  } else if (optionMap['A'] && optionMap['B']) {
    finalOptions = [
      cleanMathExpression(optionMap['A']),
      cleanMathExpression(optionMap['B']),
      cleanMathExpression(optionMap['C'] || options[2] || 'Option C'),
      cleanMathExpression(optionMap['D'] || options[3] || 'Option D')
    ];
  } else {
    finalOptions = options.map((opt) => cleanMathExpression(opt.replace(/\s+/g, ' ').trim())).filter(Boolean);
    while (finalOptions.length < 4) {
      finalOptions.push(`Option ${String.fromCharCode(65 + finalOptions.length)}`);
    }
    finalOptions = finalOptions.length > 5 ? finalOptions.slice(0, 5) : finalOptions;
  }

  // Match correct answer
  let finalCorrectAnswer = finalOptions[0];
  let answerDetected = false;

  if (answerLetter) {
    let index = -1;
    const normAns = normalizeOptLetter(answerLetter);
    if (normAns === 'A') index = 0;
    else if (normAns === 'B') index = 1;
    else if (normAns === 'C') index = 2;
    else if (normAns === 'D') index = 3;
    else if (normAns === 'E') index = 4;

    if (index >= 0 && index < finalOptions.length) {
      finalCorrectAnswer = finalOptions[index];
      answerDetected = true;
    }
  } else if (correctAnswer) {
    const cleanExpected = correctAnswer.toLowerCase().trim();
    const exact = finalOptions.find((opt) => opt.toLowerCase().trim() === cleanExpected);
    if (exact) {
      finalCorrectAnswer = exact;
      answerDetected = true;
    } else {
      const cleanNoSpace = cleanExpected.replace(/\s+/g, '');
      const noSpace = finalOptions.find((opt) => opt.replace(/\s+/g, '').toLowerCase() === cleanNoSpace);
      if (noSpace) {
        finalCorrectAnswer = noSpace;
        answerDetected = true;
      }
    }
  }

  // 5. Link Shared Context / Passage (Reading Comp, Seating, DI)
  let matchedPassage = '';
  let matchedPassageTitle = '';
  if (Array.isArray(sharedContextSets) && sharedContextSets.length > 0) {
    const set = sharedContextSets.find((s) => qNumber >= s.startQ && qNumber <= s.endQ);
    if (set) {
      matchedPassage = set.passage;
      matchedPassageTitle = set.title;
    }
  }

  // 6. Link Visual Asset if referenced or on this page
  let matchedImageUrl = '';
  const textLower = questionText.toLowerCase();
  const referencesDiagram = /(?:diagram|figure|chart|graph|image|table\s*below|figure\s*\d+|chart\s*\d+)/i.test(textLower);
  if (referencesDiagram && visualAssets.length > 0) {
    matchedImageUrl = visualAssets[0].dataUrl;
  }

  // 7. Detect Section & Question Type (respects blockDocumentSection if detected from document banner)
  const effectiveCategory = blockDocumentSection || defaultCategory;
  const { section: detectedSection, type: detectedType } = detectSectionAndType(
    questionText,
    matchedPassage,
    codeSnippet,
    effectiveCategory,
    targetTopic
  );

  return {
    id: `extracted-${Date.now()}-${qNumber}`,
    questionNumber: qNumber,
    pageNumber: pageNumber || 1,
    questionText: questionText || `Question ${qNumber}`,
    options: finalOptions,
    correctAnswer: finalCorrectAnswer,
    explanation: cleanMathExpression(explanation || `Correct answer is ${finalCorrectAnswer}.`),
    difficulty: defaultDifficulty,
    type: detectedType,
    section: detectedSection,
    marks: 1,
    passage: matchedPassage,
    passageTitle: matchedPassageTitle,
    codeSnippet: codeSnippet || '',
    imageUrl: matchedImageUrl,
    answerDetected
  };
}

/**
 * Extraction Validation Engine:
 * Validates sequence gaps, duplicated numbers, option completeness,
 * answer key status, unattached visual assets, and computes confidence score.
 */
function validateExtractedQuestions(questions, totalPageCount = 1, unparsedQuestions = []) {
  const validated = [];
  const seenNumbers = new Set();
  const numberList = [];
  let hasMissingAnswers = false;
  let hasIncompleteOptions = false;
  let reviewRequiredCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const warnings = [];
    let score = 100;
    const qNum = q.questionNumber || i + 1;

    // 1. Check duplicate question number
    if (seenNumbers.has(qNum)) {
      warnings.push(`Duplicated question number #${qNum} detected.`);
      score -= 20;
    }
    seenNumbers.add(qNum);
    numberList.push(qNum);

    // 2. Check options completeness (supports 4 or 5 options)
    const validOptions = Array.isArray(q.options) ? q.options.filter((o) => o && String(o).trim()) : [];
    if (validOptions.length < 4) {
      warnings.push(`Incomplete options: source provided ${validOptions.length} of 4 expected options.`);
      score -= 25;
      hasIncompleteOptions = true;
    }

    // Check option boundaries for leaked directions or duplicate options
    const optionTexts = validOptions.map((o) => String(o).trim().toLowerCase());
    const hasDuplicateOptions = new Set(optionTexts).size < validOptions.length;
    if (hasDuplicateOptions && validOptions.length >= 2) {
      warnings.push('Duplicate answer options detected.');
      score -= 20;
    }
    const hasLeakedDirectionsInOption = validOptions.some((o) =>
      /(?:Directions?\s*(?:\([^\)]+\)|for|to|[\:\-])|Study\s*the\s*following|Read\s*the\s*following)/i.test(o)
    );
    if (hasLeakedDirectionsInOption) {
      warnings.push('Option appears to contain leaked directions or premise content.');
      score -= 30;
    }

    // 3. Check correct answer key detection
    if (!q.answerDetected) {
      warnings.push('Correct answer key not detected in document. Defaulted for admin review.');
      score -= 30;
      hasMissingAnswers = true;
    }

    // 4. Check unattached visual asset
    const textLower = (q.questionText || '').toLowerCase();
    const referencesVisual = /(?:refer to (?:the )?(?:given )?(?:bar chart|pie chart|line graph|diagram|figure|table)|as shown in (?:the )?(?:given )?(?:figure|diagram|chart))/i.test(textLower);
    if (referencesVisual && !q.imageUrl) {
      warnings.push('Question references an external graph, diagram, or chart not embedded in text.');
      score -= 15;
    }

    // 5. Check corrupted math or incomplete statement
    if (!q.questionText || q.questionText.trim().length < 8) {
      warnings.push('Question statement is unusually brief or potentially incomplete.');
      score -= 25;
    }
    if (q.questionText && (q.questionText.includes('=?') || /\\(?:frac|times|div)/.test(q.questionText))) {
      warnings.push('Contains unparsed mathematical fragments or raw LaTeX notation.');
      score -= 10;
    }

    // 6. Shared passage relationship validation
    if (q.passage) {
      if (q.questionText && q.passage.includes(q.questionText) && q.questionText.length > 30) {
        warnings.push('Question statement overlaps significantly with shared passage premise.');
        score -= 15;
      }
    }

    score = Math.max(0, Math.min(100, score));
    let confidence = 'HIGH';
    if (score < 60 || !q.answerDetected || validOptions.length < 4 || hasLeakedDirectionsInOption) {
      confidence = 'REVIEW_REQUIRED';
      reviewRequiredCount++;
    } else if (score < 85) {
      confidence = 'MEDIUM';
    }

    validated.push({
      ...q,
      warnings,
      confidence,
      confidenceScore: score
    });
  }

  // Sequence gap check
  const sortedNums = [...numberList].sort((a, b) => a - b);
  let sequenceValid = true;
  for (let i = 0; i < sortedNums.length - 1; i++) {
    if (sortedNums[i + 1] > sortedNums[i] + 1) {
      sequenceValid = false;
      const missing = sortedNums[i] + 1;
      const targetQ = validated.find((q) => q.questionNumber === sortedNums[i + 1]);
      if (targetQ) {
        targetQ.warnings.push(`Sequence gap detected: question #${missing} appears to be missing in document.`);
      }
    }
  }

  const validationSummary = {
    totalDetected: validated.length,
    totalExtracted: validated.length,
    validCount: validated.length - reviewRequiredCount,
    verifiedCount: validated.length - reviewRequiredCount,
    reviewRequiredCount,
    hasMissingAnswers,
    hasIncompleteOptions,
    sequenceValid,
    totalPages: totalPageCount,
    unparsedQuestions: unparsedQuestions || []
  };

  return { validatedQuestions: validated, validationSummary };
}

/**
 * Scanned PDF fallback using Gemini Multimodal Vision or OpenRouter with schema-validated output
 */
async function extractScannedPdfWithVision({
  pdfBuffer,
  category = 'Quantitative Aptitude',
  topic = 'General',
  difficulty = 'Medium',
  count = null
}) {
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY || '').trim();
  const openrouterKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const isValidGeminiKey = geminiKey && geminiKey.startsWith('AIzaSy') && geminiKey !== 'dummy_gemini_key_for_testing';
  const preferOpenRouter = process.env.AI_PROVIDER === 'openrouter' && openrouterKey;

  const prompt = `You are an expert assessment extractor performing OCR and question extraction on this scanned PDF document.
Extract all multiple choice questions (MCQs) strictly from the document.
Preserve exact question numbering, sequence, options (A, B, C, D, E), correct answers, explanations, and any shared passages/reading comprehension directions.
If there are bar charts, pie charts, or diagrams, describe the chart values accurately or state the question context.

Return ONLY a valid JSON array of objects. Do NOT use markdown code fences.
Schema per question:
[
  {
    "questionNumber": 1,
    "pageNumber": 1,
    "questionText": "Question statement...",
    "passage": "Optional shared reading comprehension passage or directions for a group of questions",
    "passageTitle": "Directions (Q. 1-5)",
    "codeSnippet": "",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Detailed explanation...",
    "difficulty": "${difficulty || 'Medium'}",
    "type": "mcq",
    "section": "${category || 'Quantitative Aptitude'}"
  }
]`;

  let rawResponse = '';

  // 1. Try Gemini Vision if valid Gemini key is present and not explicitly set to OpenRouter
  if (isValidGeminiKey && !preferOpenRouter) {
    try {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

      for (const model of models) {
        try {
          console.log(`[Scanned PDF OCR] Trying Gemini model ${model}...`);
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: pdfBuffer.toString('base64')
                }
              },
              prompt
            ],
            config: {
              temperature: 0.1,
              maxOutputTokens: 4096
            }
          });
          rawResponse = response.text || '';
          if (rawResponse) break;
        } catch (err) {
          console.warn(`[Scanned PDF OCR] Gemini model ${model} failed: ${err.message}`);
        }
      }
    } catch (gErr) {
      console.warn(`[Scanned PDF OCR] Gemini initialization failed: ${gErr.message}`);
    }
  }

  // 2. Fallback to OpenRouter Multimodal Vision if Gemini failed or OpenRouter is preferred
  if (!rawResponse && openrouterKey) {
    try {
      console.log('[Scanned PDF OCR] Trying OpenRouter multimodal vision fallback...');
      const axios = require('axios');
      const base64Pdf = pdfBuffer.toString('base64');
      const orModels = ['google/gemini-2.0-flash-001', 'qwen/qwen-2.5-vl-72b-instruct:free', 'nvidia/nemotron-3.5-lightning:free'];

      for (const model of orModels) {
        try {
          const res = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model,
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: prompt },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:application/pdf;base64,${base64Pdf}`
                      }
                    }
                  ]
                }
              ],
              temperature: 0.1,
              max_tokens: 4096
            },
            {
              headers: {
                Authorization: `Bearer ${openrouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://mitra-portal.edu',
                'X-Title': 'MITRA Portal PDF OCR'
              },
              timeout: 45000
            }
          );
          rawResponse = res.data?.choices?.[0]?.message?.content || '';
          if (rawResponse) break;
        } catch (orErr) {
          console.warn(`[Scanned PDF OCR] OpenRouter ${model} failed: ${orErr.message}`);
        }
      }
    } catch (orInitErr) {
      console.warn(`[Scanned PDF OCR] OpenRouter fallback failed: ${orInitErr.message}`);
    }
  }

  if (!rawResponse) {
    throw new Error('Scanned or image-only PDF detected with no readable text layer, and neither a valid Gemini API key nor OpenRouter API key could complete vision OCR.');
  }

  const { sanitizeAndParseJson } = require('./pdfQuestionExtractor');
  const parsed = sanitizeAndParseJson(rawResponse) || [];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Failed to parse questions from scanned PDF OCR response.');
  }

  return parsed.map((q, idx) => ({
    id: `ocr-${Date.now()}-${idx + 1}`,
    questionNumber: q.questionNumber || idx + 1,
    pageNumber: q.pageNumber || 1,
    questionText: cleanMathExpression(q.questionText || `Question ${idx + 1}`),
    options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: q.correctAnswer || q.options?.[0] || 'Option A',
    explanation: cleanMathExpression(q.explanation || `Correct answer is ${q.correctAnswer || 'Option A'}.`),
    passage: q.passage || '',
    passageTitle: q.passageTitle || '',
    codeSnippet: q.codeSnippet || '',
    difficulty: q.difficulty || difficulty || 'Medium',
    type: q.type || 'mcq',
    section: q.section || category || 'Quantitative Aptitude',
    marks: 1,
    answerDetected: !!q.correctAnswer,
    isScannedOcr: true
  }));
}

/**
 * Main function: Extracts questions from PDF buffer or text using pattern recognition,
 * layout-aware spatial rendering, shared passage linking, visual asset extraction,
 * and comprehensive extraction validation.
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
  let visualAssets = [];

  // 1. Extract visual assets and raw text from PDF buffer
  if (pdfBuffer && Buffer.isBuffer(pdfBuffer)) {
    if (pdfBuffer.length === 0) {
      throw new Error('Uploaded PDF file is empty (0 bytes).');
    }

    // Extract embedded images/charts
    visualAssets = extractEmbeddedVisualAssets(pdfBuffer);

    let timeoutId;
    try {
      const parsePromise = pdfParse(pdfBuffer, { pagerender: customPageRender });
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('PDF parsing timed out after 30 seconds.')), 30000);
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

  // 2. Fallback to Gemini Vision or OpenRouter if text is empty or near-empty (< 45 chars per page, likely scanned/image-only)
  const cleanedText = cleanExtractedText(extractedText);
  const textCharsWithoutPageTags = cleanedText.replace(/\[\[PAGE_(?:START|END):\d+\]\]/g, '').replace(/\s+/g, '').length;
  const avgCharsPerPage = textCharsWithoutPageTags / Math.max(1, pageCount);
  const isLikelyScanned = avgCharsPerPage < 45 || textCharsWithoutPageTags < 60;

  if (isLikelyScanned) {
    if (pdfBuffer && Buffer.isBuffer(pdfBuffer)) {
      console.log('[PDF Extractor] Minimal text layer detected. Initiating Scanned PDF Vision Fallback...');
      const ocrQuestions = await extractScannedPdfWithVision({
        pdfBuffer,
        category,
        topic,
        difficulty,
        count
      });
      const { validatedQuestions, validationSummary } = validateExtractedQuestions(ocrQuestions, pageCount);
      const parsedCount = parseInt(count, 10);
      const finalResult = parsedCount > 0 ? validatedQuestions.slice(0, parsedCount) : validatedQuestions;

      return {
        success: true,
        questions: finalResult,
        totalDetected: validatedQuestions.length,
        pageCount,
        validationSummary,
        category,
        topic,
        difficulty
      };
    } else {
      throw new Error('No readable text could be found in the PDF. The file may be scanned, image-only, or encrypted.');
    }
  }

  // 3. Extract document metadata (title, headings)
  const { documentTitle } = extractDocumentMetadata(cleanedText);

  // 4. Extract global answer key and explanations
  const { answerKeyMap, explanationMap } = extractGlobalAnswersAndExplanations(cleanedText);

  // 5. Split document into candidate question blocks with page and section tracking
  const blocks = splitIntoQuestionBlocks(cleanedText);
  if (blocks.length === 0) {
    throw new Error('Could not identify any questions in the uploaded PDF. Ensure the PDF contains numbered questions (e.g. 1., Q1.) with options.');
  }

  // 6. Detect shared context sets with question blocks context
  const sharedContextSets = detectSharedContextSets(cleanedText, blocks);

  // 7. Parse each block with shared context & visual asset linkage
  const parsedQuestions = [];
  const unparsedQuestions = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const q = parseQuestionBlock(
      block,
      block.number || i + 1,
      answerKeyMap,
      difficulty,
      explanationMap,
      sharedContextSets,
      visualAssets,
      block.pageNumber,
      category,
      topic
    );

    if (q && q.questionText && q.questionText.length > 5) {
      parsedQuestions.push(q);
    } else {
      unparsedQuestions.push({
        questionNumber: block.number || i + 1,
        pageNumber: block.pageNumber || 1,
        reason: 'Failed to extract valid multiple-choice options or question text too short.'
      });
    }
  }

  if (parsedQuestions.length === 0) {
    throw new Error('No valid multiple-choice questions could be extracted from the document. Please check the PDF layout.');
  }

  // 8. Deduplicate questions across chunks/pages
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

  // 9. Run Extraction Validation Engine
  const { validatedQuestions, validationSummary } = validateExtractedQuestions(uniqueQuestions, pageCount, unparsedQuestions);

  // 10. Apply count limit only if explicitly requested
  const parsedCount = parseInt(count, 10);
  const finalQuestions = parsedCount > 0 ? validatedQuestions.slice(0, parsedCount) : validatedQuestions;

  return {
    success: true,
    documentTitle: documentTitle || null,
    questions: finalQuestions,
    totalDetected: validatedQuestions.length,
    pageCount,
    validationSummary,
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
  normalizeGluedOptionMarkers,
  detectSharedContextSets,
  extractDocumentMetadata,
  detectSectionAndType,
  extractTechnicalContent,
  validateExtractedQuestions,
  extractEmbeddedVisualAssets,
  extractScannedPdfWithVision
};
