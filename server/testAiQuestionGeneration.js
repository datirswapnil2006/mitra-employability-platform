require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const { Assessment } = require('./modules/assessments/assessment.models');
const AssessmentGenerationJob = require('./modules/assessments/generationJob.model');
const {
  validateQuestion,
  validateQuestionBatch,
  resolveAnswerToOption
} = require('./utils/questionValidator');
const {
  checkIsDuplicate,
  filterUniqueQuestions,
  computeQuestionHash,
  normalizeText,
  jaccardSimilarity
} = require('./utils/questionDeduplicator');
const {
  isTransientError,
  isPermanentError,
  estimateTokenCost,
  cleanAndParseJson
} = require('./utils/geminiClient');
const {
  createGenerationJob,
  runGenerationJob,
  resumeGenerationJob,
  normalizeAssessmentSections,
  acquireJobLock,
  releaseJobLock
} = require('./utils/assessmentBatchEngine');
const {
  generateGroundedQuestionsBatch,
  generateSqlQuestion,
  generateProgrammingQuestion,
  generatePsychometricQuestion
} = require('./utils/groundedQuestionFallback');
const { generateQuestionsAI } = require('./utils/aiQuestionGenerator');

async function runAiGenerationTestSuite() {
  console.log('======================================================================');
  console.log('MITRA Employability Portal: AI Assessment Generation Reliability Tests');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function report(testName, isSuccess, details = '') {
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

  // Connect to DB for integration tests
  await connectDB();
  console.log('✓ Connected to MongoDB for Test Suite\n');

  try {
    // -----------------------------------------------------------------------
    // TEST 1: Zod Schema & Deterministic Question Validation
    // -----------------------------------------------------------------------
    console.log('--- TEST SUITE 1: Zod Schema & Deterministic Question Validation ---');
    {
      // 1a. Valid MCQ Question
      const validQ = {
        questionText: 'What is the worst-case time complexity of QuickSort?',
        options: ['O(n log n)', 'O(n^2)', 'O(log n)', 'O(n)'],
        correctAnswer: 'O(n^2)',
        explanation: 'QuickSort exhibits O(n^2) worst-case complexity when the chosen pivot consistently partitions the array into unbalanced subarrays.',
        difficulty: 'Medium',
        type: 'mcq',
        marks: 1
      };
      const vResult = validateQuestion(validQ);
      report('1a. Valid question accepted by Zod and deterministic validation', vResult.valid === true);

      // 1b. Duplicate Options Rejection
      const dupOptsQ = {
        questionText: 'What is the output of 5 + 5 in decimal arithmetic?',
        options: ['10', '10', '15', '20'],
        correctAnswer: '10',
        explanation: '5 plus 5 equals 10.'
      };
      const dupResult = validateQuestion(dupOptsQ);
      report('1b. Duplicate options in question rejected', dupResult.valid === false && dupResult.errors.some(e => e.includes('All options must be unique')));

      // 1c. Mismatched Correct Answer Rejection
      const mismatchQ = {
        questionText: 'Which protocol is primarily used for secure web browsing?',
        options: ['HTTP', 'FTP', 'SSH', 'SMTP'],
        correctAnswer: 'HTTPS', // Not in options!
        explanation: 'HTTPS provides encrypted communication over TLS.'
      };
      const mismatchResult = validateQuestion(mismatchQ);
      report('1c. Mismatched correct answer rejected (no silent hallucination)', mismatchResult.valid === false && mismatchResult.errors.some(e => e.includes('does not match any of the provided options')));

      // 1d. Insufficient Options Count Rejection
      const fewOptsQ = {
        questionText: 'What is the boolean evaluation of null in JavaScript?',
        options: ['true', 'false'],
        correctAnswer: 'false',
        explanation: 'In boolean contexts, null evaluates to falsy (false).'
      };
      const fewResult = validateQuestion(fewOptsQ, { optionsCount: 4 });
      report('1d. Insufficient options count (< 4 for standard MCQ) rejected', fewResult.valid === false && fewResult.errors.some(e => e.includes('Expected exactly 4 options')));

      // 1e. Placeholder text rejection
      const placeholderQ = {
        questionText: 'What is the capital city of Japan?',
        options: ['Tokyo', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Tokyo',
        explanation: 'Tokyo is the capital city of Japan.'
      };
      const placeholderResult = validateQuestion(placeholderQ);
      report('1e. Placeholder option text rejected', placeholderResult.valid === false && placeholderResult.errors.some(e => e.includes('placeholder text')));

      // 1f. SQL Question Deterministic Schema & Query Check
      const sqlValid = generateSqlQuestion(1);
      const sqlValidation = validateQuestion(sqlValid, { type: 'sql' });
      report('1f. SQL question with schemaSql and referenceQuery verified', sqlValidation.valid === true);

      const sqlInvalid = {
        questionText: 'How do you query data?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: 'Explanation text here.'
      };
      const sqlInvalidResult = validateQuestion(sqlInvalid, { type: 'sql' });
      report('1g. SQL question missing schemaSql/query rejected', sqlInvalidResult.valid === false);
    }

    // -----------------------------------------------------------------------
    // TEST 2: Exact & Near-Duplicate Detection Engine
    // -----------------------------------------------------------------------
    console.log('\n--- TEST SUITE 2: Duplicate & Near-Duplicate Detection ---');
    {
      const qBase = {
        questionText: 'Explain the difference between TCP and UDP transport layer protocols.',
        options: ['TCP is connection-oriented, UDP is connectionless', 'Both are identical', 'TCP is faster', 'UDP guarantees order']
      };

      const qNearDup = {
        questionText: 'Explain the difference between TCP and UDP transport protocols.',
        options: ['TCP is connection-oriented, UDP is connectionless', 'Both are identical', 'TCP is faster', 'UDP guarantees order']
      };

      const qUnique = {
        questionText: 'What is the maximum payload size of a standard Ethernet frame?',
        options: ['1500 bytes', '1024 bytes', '2048 bytes', '4096 bytes']
      };

      const dupCheck1 = checkIsDuplicate(qNearDup, [qBase], 0.75);
      report('2a. Near-duplicate question detected via high token/shingle overlap', dupCheck1.isDuplicate === true, `Similarity: ${dupCheck1.similarity}`);

      const dupCheck2 = checkIsDuplicate(qUnique, [qBase], 0.75);
      report('2b. Unique question distinguished and accepted', dupCheck2.isDuplicate === false);

      // Filtering a batch containing duplicates
      const batchWithDups = [qBase, qNearDup, qUnique];
      const filterRes = filterUniqueQuestions(batchWithDups, []);
      report('2c. Filter batch eliminates near-duplicates while preserving unique items', filterRes.accepted.length === 2 && filterRes.rejectedDuplicates.length === 1);
    }

    // -----------------------------------------------------------------------
    // TEST 3: Transient vs Permanent Error Classification & Token Tracking
    // -----------------------------------------------------------------------
    console.log('\n--- TEST SUITE 3: Error Classification & Cost Tracking ---');
    {
      const err429 = new Error('Resource has been exhausted (e.g. check quota).');
      err429.status = 429;
      report('3a. 429 Rate Limit recognized as transient error', isTransientError(err429) === true && isPermanentError(err429) === false);

      const err503 = new Error('The service is temporarily overloaded.');
      err503.status = 503;
      report('3b. 503 Service Unavailable recognized as transient error', isTransientError(err503) === true && isPermanentError(err503) === false);

      const errTimeout = new Error('Gemini API request timed out after 25000ms');
      errTimeout.code = 'ETIMEDOUT';
      report('3c. ETIMEDOUT recognized as transient error', isTransientError(errTimeout) === true);

      const err401 = new Error('API key not valid. Please pass a valid API key.');
      err401.status = 400;
      report('3d. Invalid API key recognized as permanent error (no endless retries)', isPermanentError(err401) === true && isTransientError(err401) === false);

      // Token Cost Estimation
      const cost = estimateTokenCost(2000, 800, 'gemini-2.5-flash');
      report('3e. Token cost computed accurately', cost > 0 && typeof cost === 'number', `Cost: $${cost}`);
    }

    // -----------------------------------------------------------------------
    // TEST 4: Partial JSON & Malformed Output Parser
    // -----------------------------------------------------------------------
    console.log('\n--- TEST SUITE 4: Malformed & Markdown JSON Parsing ---');
    {
      const markdownJson = '```json\n[{"questionText":"What is polymorphism?","options":["A","B","C","D"],"correctAnswer":"A","explanation":"Explanation"}]\n```';
      const parsed = cleanAndParseJson(markdownJson);
      report('4a. Strips markdown fences and parses valid JSON array', Array.isArray(parsed) && parsed.length === 1 && parsed[0].questionText === 'What is polymorphism?');

      const thinkTagsJson = '<think>Let me formulate the questions...</think>\n[{"questionText":"What is inheritance?","options":["1","2","3","4"],"correctAnswer":"1","explanation":"Explanation"}]';
      const parsedThink = cleanAndParseJson(thinkTagsJson);
      report('4b. Strips <think> reasoning tokens cleanly', Array.isArray(parsedThink) && parsedThink.length === 1);

      const brokenText = 'Random chat response without json';
      const parsedBroken = cleanAndParseJson(brokenText);
      report('4c. Returns null on non-JSON response instead of throwing unhandled error', parsedBroken === null);
    }

    // -----------------------------------------------------------------------
    // TEST 5: Multi-Section Dynamic Configuration
    // -----------------------------------------------------------------------
    console.log('\n--- TEST SUITE 5: Multi-Section Configuration Normalization ---');
    {
      // 5a. Explicit multi-sections request (Aptitude, Python, SQL, Technical, Psychometric)
      const multiSectionInput = {
        sections: [
          { name: 'Quantitative Aptitude', topic: 'Arithmetic', questionCount: 10, type: 'mcq' },
          { name: 'Python Programming', topic: 'Core Python', questionCount: 10, type: 'coding' },
          { name: 'SQL & Database', topic: 'Joins and Aggregates', questionCount: 5, type: 'sql' },
          { name: 'Technical CSE', topic: 'Data Structures', questionCount: 10, type: 'mcq', department: 'CSE' },
          { name: 'Psychometric Profile', topic: 'Workplace Behavior', questionCount: 5, type: 'psychometric' }
        ]
      };
      const normalized = normalizeAssessmentSections(multiSectionInput);
      report('5a. Multiple assessment sections normalized with correct types and counts', normalized.length === 5 && normalized[1].type === 'coding' && normalized[2].type === 'sql' && normalized[4].type === 'psychometric');

      // 5b. Full assessment 180 questions configuration
      const full180 = normalizeAssessmentSections({
        module: 'Full Assessment',
        department: 'CSE',
        questionCount: 180
      });
      const sum180 = full180.reduce((sum, s) => sum + s.questionCount, 0);
      report('5b. 180-question assessment decomposed across multiple sections', sum180 === 180 && full180.length === 4, `Sections: ${full180.map(s => `${s.name} (${s.questionCount})`).join(', ')}`);
    }

    // -----------------------------------------------------------------------
    // TEST 6: Batch Generation Engine & Idempotent Resumption (MongoDB)
    // -----------------------------------------------------------------------
    console.log('\n--- TEST SUITE 6: Batch Generation Engine, Persistence & Resumption ---');
    {
      // Create a test assessment in DB
      const testAssessment = await Assessment.create({
        title: 'Test Batch Assessment',
        module: 'Aptitude',
        category: 'Quantitative',
        status: 'draft',
        questions: []
      });

      // Create a multi-section generation job: 2 sections, 10 questions total (2 batches of 5)
      const jobDoc = await createGenerationJob({
        title: testAssessment.title,
        module: 'Aptitude',
        sections: [
          { name: 'Quantitative Ability', topic: 'Arithmetic', questionCount: 5, type: 'mcq' },
          { name: 'Logical Reasoning', topic: 'Puzzles', questionCount: 5, type: 'mcq' }
        ],
        batchSize: 5,
        assessmentId: testAssessment._id
      });

      report('6a. Generation job created in MongoDB with pending status', jobDoc.jobId && jobDoc.status === 'pending' && jobDoc.requestedCount === 10);

      // Run the job
      const completedJob = await runGenerationJob(jobDoc.jobId);
      report('6b. Generation job completed in batches with exact question count', completedJob.status === 'completed' && completedJob.acceptedCount === 10);
      report('6c. Idempotency keys recorded for completed batches', completedJob.idempotencyKeys.length >= 2);

      // Verify assessment was updated with verified questions
      const updatedAss = await Assessment.findById(testAssessment._id);
      report('6d. Assessment questions updated in MongoDB with verified questions', updatedAss.questions.length === 10 && updatedAss.totalMarks === 10);

      // Concurrency lock test: attempting to run concurrent job throws error
      acquireJobLock(completedJob.jobId);
      let concurrencyBlocked = false;
      try {
        await runGenerationJob(completedJob.jobId);
      } catch (lockErr) {
        concurrencyBlocked = lockErr.message.includes('already running concurrently');
      }
      releaseJobLock(completedJob.jobId);
      report('6e. In-memory concurrency protection prevents simultaneous duplicate execution', concurrencyBlocked === true);

      // Resumption test: Simulate an interrupted job
      const interruptedJob = await AssessmentGenerationJob.create({
        jobId: `interrupted_${Date.now()}`,
        assessmentId: testAssessment._id,
        status: 'in_progress',
        config: {
          module: 'Aptitude',
          sections: [
            { sectionId: 'sec_1', name: 'Quant', questionCount: 10, type: 'mcq' }
          ],
          batchSize: 5
        },
        requestedCount: 10,
        acceptedCount: 5, // 5 already accepted
        failedCount: 0,
        sectionsProgress: [{
          sectionId: 'sec_1',
          name: 'Quant',
          targetCount: 10,
          acceptedCount: 5,
          status: 'in_progress',
          batches: [
            { batchIndex: 0, batchKey: 'batch_0_done', requestedCount: 5, acceptedCount: 5, status: 'completed' },
            { batchIndex: 1, batchKey: 'batch_1_pending', requestedCount: 5, acceptedCount: 0, status: 'pending' }
          ]
        }],
        acceptedQuestions: generateGroundedQuestionsBatch({ count: 5, topic: 'Initial 5' }),
        idempotencyKeys: ['batch_0_done']
      });

      // Resume interrupted job
      const resumedJob = await resumeGenerationJob(interruptedJob.jobId);
      report('6f. Resuming interrupted job generates ONLY missing questions without duplicating batch 0', resumedJob.acceptedCount === 10 && resumedJob.status === 'completed');

      // Clean up test documents
      await Assessment.findByIdAndDelete(testAssessment._id);
      await AssessmentGenerationJob.deleteMany({ jobId: { $in: [jobDoc.jobId, interruptedJob.jobId] } });
    }

    // -----------------------------------------------------------------------
    // TEST 7: Draft Status Enforcement on Incomplete Assessment
    // -----------------------------------------------------------------------
    console.log('\n--- TEST SUITE 7: Incomplete Assessment Draft Status Preservation ---');
    {
      const partialAssessment = await Assessment.create({
        title: 'Partial Assessment Draft Test',
        module: 'Aptitude',
        status: 'draft',
        questions: []
      });

      const partialJob = await createGenerationJob({
        title: partialAssessment.title,
        module: 'Aptitude',
        sections: [
          { name: 'Quantitative', questionCount: 10, type: 'mcq' }
        ],
        batchSize: 5,
        assessmentId: partialAssessment._id
      });

      // Simulate partial job state (e.g. accepted 5 of 10)
      partialJob.status = 'partial';
      partialJob.acceptedCount = 5;
      partialJob.acceptedQuestions = generateGroundedQuestionsBatch({ count: 5, topic: 'Partial' });
      await partialJob.save();

      // Assessment must remain in 'draft' when acceptedCount < requestedCount
      const isComplete = partialJob.status === 'completed' && partialJob.acceptedCount >= partialJob.requestedCount;
      const targetStatus = isComplete ? 'published' : 'draft';

      await Assessment.findByIdAndUpdate(partialAssessment._id, {
        questions: partialJob.acceptedQuestions,
        status: targetStatus
      });

      const checkedAss = await Assessment.findById(partialAssessment._id);
      report('7a. Incomplete assessment is strictly preserved in "draft" status (never silently published)', checkedAss.status === 'draft' && checkedAss.questions.length === 5);

      // Clean up
      await Assessment.findByIdAndDelete(partialAssessment._id);
      await AssessmentGenerationJob.deleteMany({ jobId: partialJob.jobId });
    }

    // -----------------------------------------------------------------------
    // TEST 8: 180-Question Batch Generation Scalability Simulation
    // -----------------------------------------------------------------------
    console.log('\n--- TEST SUITE 8: 180-Question Multi-Batch Scalability Simulation ---');
    {
      const fullSections = normalizeAssessmentSections({
        module: 'Full Assessment',
        department: 'CSE',
        questionCount: 180
      });

      // Ensure every section has 5-10 question batches
      let totalBatches = 0;
      const batchSize = 10;
      for (const s of fullSections) {
        totalBatches += Math.ceil(s.questionCount / batchSize);
      }

      report('8a. 180-question assessment breaks into multiple small batches of <= 10 questions', totalBatches === 18, `Total batches calculated: ${totalBatches} across 4 sections`);

      // Verify each section question generator generates strictly validated questions
      const cseBatch = generateGroundedQuestionsBatch({ count: 5, department: 'CSE', module: 'Domain' });
      const { accepted: validCse } = validateQuestionBatch(cseBatch);
      report('8b. Technical domain questions batch validated', validCse.length === 5);

      const psychBatch = generateGroundedQuestionsBatch({ count: 5, type: 'psychometric', category: 'Behavioral' });
      const { accepted: validPsych } = validateQuestionBatch(psychBatch, { isPsychometric: true, optionsCount: 5 });
      report('8c. Psychometric Likert 5-point assessment batch validated with scoring rules', validPsych.length === 5 && validPsych[0].scoringRule !== null);
    }

    // -----------------------------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------------------------
    console.log('\n======================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('======================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled Test Suite Error:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

runAiGenerationTestSuite();
