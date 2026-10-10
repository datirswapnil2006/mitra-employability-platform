const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  extractQuestionsWithPatterns,
  cleanExtractedText,
  parseQuestionBlock,
  splitIntoQuestionBlocks,
  detectSharedContextSets,
  validateExtractedQuestions,
  extractEmbeddedVisualAssets
} = require('./utils/patternPdfParser');

async function runTestSuite() {
  console.log('===============================================================');
  console.log('MITRA Employability Portal: PDF Extraction Enhancement Test Suite');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function recordResult(testName, isSuccess, details = '') {
    if (isSuccess) {
      console.log(`[PASS] ${testName}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // Test 1: Logical direction questions with diagrams
  // -------------------------------------------------------------------------
  try {
    const text1 = `
[[PAGE_START:1]]
Directions (Q. 1 to 2): A man walks 10 meters East, then turns right and walks 5 meters. Refer to the direction diagram below.
1. In which direction is he now facing with respect to his starting point?
A) South-East
B) North-West
C) North-East
D) South-West
Answer: A
Explanation: Starting from origin, 10m East and 5m South puts him in South-East quadrant.

2. What is the shortest distance between his starting point and final position?
A) 5√5 m
B) 10√5 m
C) 15 m
D) 25 m
Answer: A
Explanation: By Pythagoras theorem, distance = √(10^2 + 5^2) = √125 = 5√5 meters.
[[PAGE_END:1]]
`;
    const res1 = await extractQuestionsWithPatterns({ pdfText: text1, category: 'Logical Reasoning' });
    const q1 = res1.questions[0];
    const q2 = res1.questions[1];
    const ok =
      res1.questions.length === 2 &&
      q1.passage &&
      q2.passage &&
      q1.passage.includes('walks 10 meters') &&
      q1.section === 'Logical Reasoning' &&
      q1.correctAnswer === 'South-East';
    recordResult('1. Logical direction questions with diagrams', ok, `Extracted 2 questions, shared direction context preserved across both.`);
  } catch (e) {
    recordResult('1. Logical direction questions with diagrams', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 2: Relationship questions sharing a common paragraph
  // -------------------------------------------------------------------------
  try {
    const text2 = `
[[PAGE_START:1]]
Directions (Questions 1 to 2): Read the following family relationship information carefully to answer the questions:
P is the father of Q. Q is the sister of R. R is married to S. S is the brother of T.
1. How is P related to R?
A) Father
B) Brother
C) Uncle
D) Grandfather
Answer: A
Explanation: Since P is father of Q and Q is sister of R, P is also the father of R.

2. How is S related to Q?
A) Brother-in-law
B) Cousin
C) Father
D) Son
Answer: A
Explanation: R is the spouse of S and sibling of Q, making S the brother-in-law of Q.
[[PAGE_END:1]]
`;
    const res2 = await extractQuestionsWithPatterns({ pdfText: text2, category: 'Logical Reasoning' });
    const q1 = res2.questions[0];
    const q2 = res2.questions[1];
    const ok =
      res2.questions.length === 2 &&
      q1.passage.includes('P is the father of Q') &&
      q2.passage.includes('P is the father of Q') &&
      q1.correctAnswer === 'Father' &&
      q2.correctAnswer === 'Brother-in-law';
    recordResult('2. Relationship questions sharing a common paragraph', ok, `Both questions successfully linked to common family tree premise.`);
  } catch (e) {
    recordResult('2. Relationship questions sharing a common paragraph', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 3: Quantitative aptitude questions with bar, pie, and line graphs (DI sets)
  // -------------------------------------------------------------------------
  try {
    const text3 = `
[[PAGE_START:1]]
Directions (Q. 1 to 2): Study the following bar chart representing company production (in metric tons) from 2020 to 2023 and answer the questions that follow:
Year: 2020 (400 MT), 2021 (500 MT), 2022 (600 MT), 2023 (750 MT)
1. What is the percentage increase in production from 2020 to 2021?
A) 20%
B) 25%
C) 30%
D) 35%
Answer: B
Explanation: Percentage increase = ((500 - 400) / 400) * 100 = 25%.

2. What is the ratio of production in 2020 to that in 2022?
A) 2:3
B) 3:4
C) 4:5
D) 1:2
Answer: A
Explanation: Ratio = 400 : 600 = 2:3.
[[PAGE_END:1]]
`;
    const res3 = await extractQuestionsWithPatterns({ pdfText: text3, category: 'Quantitative Aptitude' });
    const q1 = res3.questions[0];
    const q2 = res3.questions[1];
    const ok =
      res3.questions.length === 2 &&
      q1.type === 'data_interpretation' &&
      q1.passage.includes('bar chart representing company production') &&
      q2.passage.includes('bar chart representing company production') &&
      q1.correctAnswer === '25%' &&
      q2.correctAnswer === '2:3';
    recordResult('3. Quantitative aptitude questions with bar/pie/line graphs', ok, `Extracted DI set with table/chart data preserved across questions.`);
  } catch (e) {
    recordResult('3. Quantitative aptitude questions with bar/pie/line graphs', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 4: Verbal comprehension passages followed by multiple questions
  // -------------------------------------------------------------------------
  try {
    const text4 = `
[[PAGE_START:1]]
Directions (Q. 1 to 3): Read the following passage carefully and answer the questions given below it:
Artificial intelligence is rapidly transforming global industry. While automation enhances manufacturing precision and reduces human error, it simultaneously demands workforce upskilling. Leaders argue that education systems must adapt dynamically to avoid widening socio-economic divides.

1. According to the author, what is the primary industrial benefit of automation?
A) Workforce reduction
B) Enhanced precision and reduced human error
C) Lower educational expenses
D) Complete elimination of leadership roles
Answer: B
Explanation: The passage directly states automation enhances manufacturing precision and reduces human error.

2. What do leaders emphasize is crucial to prevent socio-economic divides?
A) Halting AI research
B) Educational adaptation and workforce upskilling
C) Subsidizing manual labor
D) Eliminating manufacturing plants
Answer: B
Explanation: The text stresses that education systems must adapt dynamically to avoid widening divides.

3. Which of the following best reflects the tone of the passage?
A) Cynical
B) Analytical and forward-looking
C) Sarcastic
D) Apathetic
Answer: B
Explanation: The author objectively balances the technological advantages with educational imperatives.
[[PAGE_END:1]]
`;
    const res4 = await extractQuestionsWithPatterns({ pdfText: text4, category: 'Verbal Ability' });
    const ok =
      res4.questions.length === 3 &&
      res4.questions.every((q) => q.passage && q.passage.includes('Artificial intelligence is rapidly transforming')) &&
      res4.questions[0].section === 'Verbal Ability' &&
      res4.questions[0].type === 'reading_comprehension';
    recordResult('4. Verbal comprehension passages followed by multiple questions', ok, `Extracted 3 RC questions; passage linked to all questions.`);
  } catch (e) {
    recordResult('4. Verbal comprehension passages followed by multiple questions', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 5: Questions split across pages
  // -------------------------------------------------------------------------
  try {
    const text5 = `
[[PAGE_START:1]]
1. A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?
A) 120 metres
B) 150 metres
[[PAGE_END:1]]
[[PAGE_START:2]]
C) 180 metres
D) 324 metres
Answer: B
Explanation: Speed = 60 * (5/18) = 50/3 m/s. Length = (50/3) * 9 = 150 metres.

2. A person crosses a 600 m long street in 5 minutes. What is his speed in km per hour?
A) 3.6 km/hr
B) 7.2 km/hr
C) 8.4 km/hr
D) 10 km/hr
Answer: B
Explanation: Speed = 600 / (5 * 60) = 2 m/s. In km/hr = 2 * (18/5) = 7.2 km/hr.
[[PAGE_END:2]]
`;
    const res5 = await extractQuestionsWithPatterns({ pdfText: text5, category: 'Quantitative Aptitude' });
    const q1 = res5.questions[0];
    const ok =
      res5.questions.length === 2 &&
      q1.options.length === 4 &&
      q1.pageNumber === '1-2' &&
      q1.options[0].includes('120') &&
      q1.options[3].includes('324') &&
      q1.correctAnswer.includes('150');
    recordResult('5. Questions split across pages', ok, `Question crossing Page 1 and 2 reconstructed seamlessly with pageNumber '1-2'.`);
  } catch (e) {
    recordResult('5. Questions split across pages', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 6: Multi-column question papers
  // -------------------------------------------------------------------------
  try {
    // Simulate multi-column page text where items were extracted in column order
    const text6 = `
[[PAGE_START:1]]
1. Which data structure uses FIFO principle?
A) Stack
B) Queue
C) Tree
D) Graph
Answer: B

2. What is the time complexity of searching in a balanced BST?
A) O(1)
B) O(log n)
C) O(n)
D) O(n^2)
Answer: B

3. In SQL, which clause is used to filter group results?
A) WHERE
B) HAVING
C) ORDER BY
D) GROUP BY
Answer: B
[[PAGE_END:1]]
`;
    const res6 = await extractQuestionsWithPatterns({ pdfText: text6, category: 'Domain Knowledge' });
    const ok =
      res6.questions.length === 3 &&
      res6.questions[0].questionNumber === 1 &&
      res6.questions[1].questionNumber === 2 &&
      res6.questions[2].questionNumber === 3 &&
      res6.questions[1].options[1].includes('O(log n)');
    recordResult('6. Multi-column question papers', ok, `Preserved sequential reading order across columns without interleaving.`);
  } catch (e) {
    recordResult('6. Multi-column question papers', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 7: Scanned PDFs and image-based questions
  // -------------------------------------------------------------------------
  try {
    // When text layer is missing or < 60 chars, validation engine handles graceful reporting
    const validationRes = validateExtractedQuestions([
      {
        questionNumber: 1,
        questionText: 'Refer to the given bar chart to compute the net revenue in FY23.',
        options: ['10 Cr', '15 Cr', '20 Cr', '25 Cr'],
        correctAnswer: '15 Cr',
        imageUrl: '',
        answerDetected: true
      }
    ]);
    const q = validationRes.validatedQuestions[0];
    const ok =
      q.warnings.some((w) => w.includes('references an external graph, diagram')) &&
      validationRes.validationSummary.totalDetected === 1;
    recordResult('7. Scanned PDFs and image-based questions', ok, `Visual reference detected and flagged for review when asset is external.`);
  } catch (e) {
    recordResult('7. Scanned PDFs and image-based questions', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 8: Technical MCQs, code snippets, and mathematical expressions
  // -------------------------------------------------------------------------
  try {
    const text8 = `
[[PAGE_START:1]]
1. What is the output of the following C program?
#include <stdio.h>
int main() {
    int a = 10, b = 20;
    printf("%d", a + b);
    return 0;
}
A) 10
B) 20
C) 30
D) Compilation Error
Answer: C
Explanation: The sum of 10 and 20 evaluates to 30.

2. Simplify the mathematical expression \\frac{3}{4} + \\frac{1}{2} = ?
A) 1
B) 5/4
C) 3/2
D) 7/4
Answer: B
Explanation: 3/4 + 2/4 = 5/4.
[[PAGE_END:1]]
`;
    const res8 = await extractQuestionsWithPatterns({ pdfText: text8, category: 'Domain Knowledge' });
    const q1 = res8.questions[0];
    const q2 = res8.questions[1];
    const ok =
      q1.codeSnippet.includes('#include <stdio.h>') &&
      q1.section.includes('CSE/IT') &&
      q2.questionText.includes('(3 / 4)') &&
      q2.correctAnswer === '5/4';
    recordResult('8. Technical MCQs, code snippets, and mathematical expressions', ok, `Code snippet isolated into codeSnippet field; math cleaned to Unicode.`);
  } catch (e) {
    recordResult('8. Technical MCQs, code snippets, and mathematical expressions', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 9: PDFs with missing answer keys or incomplete options
  // -------------------------------------------------------------------------
  try {
    const text9 = `
[[PAGE_START:1]]
1. Which planet in our solar system is known as the Red Planet?
A) Venus
B) Mars
C) Jupiter

2. What is the boiling point of water at sea level?
A) 90°C
B) 100°C
C) 110°C
D) 120°C
[[PAGE_END:1]]
`;
    const res9 = await extractQuestionsWithPatterns({ pdfText: text9, category: 'General' });
    const q1 = res9.questions[0];
    const q2 = res9.questions[1];
    const ok =
      res9.validationSummary.hasMissingAnswers === true &&
      res9.validationSummary.reviewRequiredCount >= 1 &&
      q1.warnings.some((w) => w.includes('Incomplete options') || w.includes('Correct answer key not detected')) &&
      q2.warnings.some((w) => w.includes('Correct answer key not detected')) &&
      q1.confidence === 'REVIEW_REQUIRED';
    recordResult('9. PDFs with missing answer keys or incomplete options', ok, `Flagged incomplete options (<4) and missing answer keys with REVIEW_REQUIRED.`);
  } catch (e) {
    recordResult('9. PDFs with missing answer keys or incomplete options', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 10: Existing PDFs that already work with the current implementation
  // -------------------------------------------------------------------------
  try {
    const text10 = `
1. If 20% of a number is 50, then what is the number?
A) 200
B) 250
C) 300
D) 350

2. The average of five numbers is 27. If one number is excluded, the average becomes 25. The excluded number is:
A) 30
B) 35
C) 40
D) 45

Answer Key:
1. B
2. B
`;
    const res10 = await extractQuestionsWithPatterns({ pdfText: text10, category: 'Quantitative Aptitude' });
    const ok =
      res10.questions.length === 2 &&
      res10.questions[0].correctAnswer === '250' &&
      res10.questions[1].correctAnswer === '35' &&
      res10.questions[0].answerDetected === true &&
      res10.questions[1].answerDetected === true;
    recordResult('10. Existing PDFs with global answer key', ok, `Standard aptitude test with global answer key parsed with 100% fidelity.`);
  } catch (e) {
    recordResult('10. Existing PDFs with global answer key', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 11: 20-Question Direction Sense Test (4 Passages × 5 Questions)
  // -------------------------------------------------------------------------
  try {
    const text11 = `
[[PAGE_START:1]]
DIRECTION SENSE TEST
SECTION I - LOGICAL REASONING

Directions (Q. 1 - 5): Read the following information carefully to answer the given questions:
Point A is 10 meters North of Point B. Point C is 8 meters East of Point B. Point D is 6 meters South of Point C. Point E is 12 meters West of Point D. Point F is 6 meters North of Point E.

1. In which direction is Point F with respect to Point B?
A) West
B) East
C) North-West
D) South-East

2. What is the shortest distance between Point A and Point B?
A) 10 meters
B) 8 meters
C) 6 meters
D) 12 meters

3. In which direction is Point C with respect to Point A?
A) South-East
B) North-East
C) South-West
D) North-West

4. What is the shortest distance between Point D and Point C?
A) 6 meters
B) 8 meters
C) 10 meters
D) 12 meters

5. In which direction is Point E with respect to Point C?
A) South-West
B) North-East
C) South-East
D) North-West

Directions (Q. 6 - 10): Study the following information carefully and answer the questions given below:
Ravi starts from Point P and walks 15 meters towards East to reach Point Q. From Point Q, he turns right and walks 10 meters to reach Point R. From Point R, he turns right and walks 20 meters to reach Point S. From Point S, he turns right and walks 10 meters to reach Point T.

6. In which direction is Point T with respect to Point P?
A) West
B) East
C) North
D) South

7. What is the shortest distance between Point P and Point T?
A) 5 meters
B) 10 meters
C) 15 meters
D) 20 meters

8. In which direction is Point R with respect to Point P?
A) South-East
B) South-West
C) North-East
D) North-West

9. What is the total distance covered by Ravi from Point P to Point T?
A) 55 meters
B) 50 meters
C) 45 meters
D) 40 meters

10. In which direction was Ravi facing while walking from Point S to Point T?
A) North
B) South
C) East
D) West
[[PAGE_END:1]]
[[PAGE_START:2]]
Directions (Questions 11 to 15): Refer to the given details to answer the following questions:
Town K is 14 km towards the North of Town L. Town M is 9 km towards the East of Town K. Town N is 14 km towards the South of Town M. Town O is 9 km towards the West of Town N.

11. Which town is located in the exact same location as Town L?
A) Town O
B) Town K
C) Town M
D) Town N

12. What is the distance between Town K and Town M?
A) 9 km
B) 14 km
C) 5 km
D) 23 km

13. In which direction is Town M with respect to Town L?
A) North-East
B) North-West
C) South-East
D) South-West

14. What is the distance between Town L and Town N?
A) 9 km
B) 14 km
C) 18 km
D) 23 km

15. In which direction is Town N with respect to Town K?
A) South-East
B) South-West
C) North-East
D) North-West

Directions (16 - 20): Read the given instructions and answer the following questions:
A person begins walking from his home towards North. After walking 12 meters, he turns left and walks 5 meters. Then he turns left again and walks 8 meters. Finally, he turns right and walks 7 meters to reach his office.

16. In which direction is the first turn point with respect to his home?
A) North
B) South
C) East
D) West

17. What is the total distance walked from home to office?
A) 32 meters
B) 25 meters
C) 30 meters
D) 35 meters

18. In which direction was he walking just before reaching his office?
A) West
B) East
C) North
D) South

19. How many times did he turn left during his walk?
A) 2 times
B) 1 time
C) 3 times
D) 0 times

20. In which direction is his office with respect to his home?
A) North-West
B) South-East
C) North-East
D) South-West

ANSWER KEY
1. A  2. A  3. A  4. A  5. A
6. A  7. A  8. A  9. A  10. A
11. A 12. A 13. A 14. A 15. A
16. A 17. A 18. A 19. A 20. A
[[PAGE_END:2]]
`;
    const res11 = await extractQuestionsWithPatterns({
      pdfText: text11,
      category: 'Logical Reasoning',
      topic: 'Direction Sense'
    });

    const set1 = res11.questions.filter((q) => q.passageTitle === 'Directions (Q. 1 - 5)');
    const set2 = res11.questions.filter((q) => q.passageTitle === 'Directions (Q. 6 - 10)');
    const set3 = res11.questions.filter((q) => q.passageTitle === 'Directions (Q. 11 - 15)');
    const set4 = res11.questions.filter((q) => q.passageTitle === 'Directions (Q. 16 - 20)');

    const allOptionsValid = res11.questions.every((q) => Array.isArray(q.options) && q.options.length === 4);
    const allAnswersMapped = res11.questions.every((q) => q.answerDetected === true && q.correctAnswer === q.options[0]);
    const allClassifiedCorrectly = res11.questions.every((q) => q.section === 'Logical Reasoning' && q.type === 'logical_reasoning');
    const titlePreserved = res11.documentTitle === 'DIRECTION SENSE TEST';

    const ok =
      res11.questions.length === 20 &&
      set1.length === 5 &&
      set2.length === 5 &&
      set3.length === 5 &&
      set4.length === 5 &&
      allOptionsValid &&
      allAnswersMapped &&
      allClassifiedCorrectly &&
      titlePreserved;

    recordResult(
      '11. 20-Question Direction Sense Test (4 passages x 5 questions)',
      ok,
      `Extracted 20 questions across 4 passages (5 each), 100% options & answers mapped, classified as Logical Reasoning.`
    );
  } catch (e) {
    recordResult('11. 20-Question Direction Sense Test (4 passages x 5 questions)', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 12: Real Number_System_MCQ.pdf (20 Questions across 4 Pages)
  // -------------------------------------------------------------------------
  try {
    let pdfPath = path.join(__dirname, 'test_fixtures', 'Number_System_MCQ.pdf');
    if (!fs.existsSync(pdfPath)) {
      pdfPath = 'D:/Downloads/Number_System_MCQ.pdf';
    }
    const buf12 = fs.readFileSync(pdfPath);
    const res12 = await extractQuestionsWithPatterns({
      pdfBuffer: buf12,
      category: 'Quantitative Aptitude',
      topic: 'Number System'
    });

    const qCount12 = res12.questions.length;
    const all4Opts12 = res12.questions.every((q) => Array.isArray(q.options) && q.options.length === 4);
    const allAnsDetected12 = res12.questions.every((q) => q.answerDetected === true && q.correctAnswer);
    const qNums12 = res12.questions.map((q) => q.questionNumber);
    const sequential12 = qNums12.every((num, idx) => num === idx + 1);
    const pagesRepresented = new Set(res12.questions.map((q) => String(q.pageNumber).split('-')[0]));
    const fourPagesCovered = pagesRepresented.has('1') && pagesRepresented.has('2') && pagesRepresented.has('3') && pagesRepresented.has('4');
    const mathExponentCleaned = res12.questions[0].questionText.includes('¹²³');

    const ok12 =
      qCount12 === 20 &&
      all4Opts12 &&
      allAnsDetected12 &&
      sequential12 &&
      fourPagesCovered &&
      mathExponentCleaned;

    recordResult(
      '12. Real Number_System_MCQ.pdf (20 Questions across 4 Pages)',
      ok12,
      `Extracted all 20 questions, 100% options & answers mapped, 4 pages covered, math exponent formatted as 7¹²³.`
    );
  } catch (e) {
    recordResult('12. Real Number_System_MCQ.pdf (20 Questions across 4 Pages)', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 13: 5 Questions on a single page
  // -------------------------------------------------------------------------
  try {
    const text13 = `
[[PAGE_START:1]]
General Mathematics Practice Test
1. What is the value of 15 * 8?
A) 110
B) 120
C) 130
D) 140
Answer: B

2. What is 25% of 200?
A) 40
B) 45
C) 50
D) 55
Answer: C

3. If x + 5 = 12, what is the value of x?
A) 5
B) 6
C) 7
D) 8
Answer: C

4. What is the average of 10, 20, and 30?
A) 15
B) 20
C) 25
D) 30
Answer: B

5. Solve for y: 2y = 18.
A) 8
B) 9
C) 10
D) 11
Answer: B
[[PAGE_END:1]]
`;
    const res13 = await extractQuestionsWithPatterns({
      pdfText: text13,
      category: 'Quantitative Aptitude'
    });
    const ok13 =
      res13.questions.length === 5 &&
      res13.questions.every((q) => q.options.length === 4 && q.answerDetected);
    recordResult('13. 5 Questions on a single page', ok13, `Extracted all 5 questions on single page with 100% options and answers.`);
  } catch (e) {
    recordResult('13. 5 Questions on a single page', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 14: Options wrapped across lines
  // -------------------------------------------------------------------------
  try {
    const text14 = `
[[PAGE_START:1]]
Data Communication Test
Question 1
Which of the following layers of the OSI reference model is responsible for end-to-end
error detection, flow control, and data packet transmission?
A) Physical Layer which carries the raw unstructured bitstream
over the physical transmission medium
B) Transport Layer which provides transparent transfer of data
between end systems and reliable error recovery
C) Network Layer which handles packet forwarding and routing
through intermediate routers
D) Session Layer which manages dialog control between applications
Correct Answer: B) Transport Layer which provides transparent transfer of data between end systems and reliable error recovery
[[PAGE_END:1]]
`;
    const res14 = await extractQuestionsWithPatterns({
      pdfText: text14,
      category: 'Technical Knowledge'
    });
    const q14 = res14.questions[0];
    const ok14 =
      res14.questions.length === 1 &&
      q14.options.length === 4 &&
      q14.options[1].includes('Transport Layer') &&
      q14.options[1].includes('reliable error recovery') &&
      q14.correctAnswer.includes('Transport Layer');
    recordResult('14. Options wrapped across lines', ok14, `Wrapped multi-line option text assembled accurately without option fragmentation.`);
  } catch (e) {
    recordResult('14. Options wrapped across lines', false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test 15: Real Number_System_MCQ_Hard.pdf (30 Questions across 6 Pages)
  // -------------------------------------------------------------------------
  try {
    let pdfPathHard = path.join(__dirname, 'test_fixtures', 'Number_System_MCQ_Hard.pdf');
    if (!fs.existsSync(pdfPathHard)) {
      pdfPathHard = 'D:/Downloads/Number_System_MCQ_Hard.pdf';
    }
    const buf15 = fs.readFileSync(pdfPathHard);
    const res15 = await extractQuestionsWithPatterns({
      pdfBuffer: buf15,
      category: 'Quantitative Aptitude',
      topic: 'Number System'
    });

    const ok15 =
      res15.questions.length === 30 &&
      res15.questions.every((q) => q.options.length === 4 && q.answerDetected);

    recordResult(
      '15. Real Number_System_MCQ_Hard.pdf (30 Questions across 6 Pages)',
      ok15,
      `Extracted all 30 questions from 6 pages with 100% options and answers mapped.`
    );
  } catch (e) {
    recordResult('15. Real Number_System_MCQ_Hard.pdf (30 Questions across 6 Pages)', false, e.message);
  }

  console.log('\n---------------------------------------------------------------');
  console.log(`Test Execution Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed}`);
  console.log('---------------------------------------------------------------');

  return { passed, failed };
}

runTestSuite().then(({ passed, failed }) => {
  if (failed > 0) {
    process.exit(1);
  }
});

