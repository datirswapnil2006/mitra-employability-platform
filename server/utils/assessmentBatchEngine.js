const crypto = require('crypto');
const AssessmentGenerationJob = require('../modules/assessments/generationJob.model');
const { Assessment } = require('../modules/assessments/assessment.models');
const { generateQuestionsWithGemini } = require('./geminiClient');
const { validateQuestionBatch } = require('./questionValidator');
const { checkIsDuplicate, filterUniqueQuestions, computeQuestionHash } = require('./questionDeduplicator');
const { generateGroundedQuestionsBatch } = require('./groundedQuestionFallback');

// In-memory concurrency locks to prevent race conditions on the same job
const activeJobLocks = new Set();

const acquireJobLock = (jobId) => {
  if (activeJobLocks.has(jobId)) {
    return false;
  }
  activeJobLocks.add(jobId);
  return true;
};

const releaseJobLock = (jobId) => {
  activeJobLocks.delete(jobId);
};

/**
 * Normalizes input configuration into structured sections
 */
const normalizeAssessmentSections = (inputConfig = {}) => {
  const {
    sections = [],
    module: moduleName = 'Aptitude',
    category = 'General',
    department = null,
    topic = '',
    prompt = '',
    customPrompt = '',
    difficulty = 'Medium',
    questionCount = 5,
    competencies = []
  } = inputConfig;

  // 1. If explicit sections array was provided, use it
  if (Array.isArray(sections) && sections.length > 0) {
    return sections.map((sec, idx) => ({
      sectionId: sec.sectionId || sec.id || `sec_${idx + 1}`,
      name: sec.name || sec.title || `Section ${idx + 1}`,
      topic: sec.topic || topic || sec.name || 'General',
      type: sec.type || (sec.name?.toLowerCase().includes('sql') ? 'sql' :
            (sec.name?.toLowerCase().includes('coding') || sec.name?.toLowerCase().includes('java') || sec.name?.toLowerCase().includes('python') ? 'coding' :
            (sec.name?.toLowerCase().includes('psychometric') || sec.name?.toLowerCase().includes('behavioral') ? 'psychometric' : 'mcq'))),
      questionCount: Math.max(1, parseInt(sec.questionCount || sec.count || 5, 10)),
      difficulty: sec.difficulty || difficulty || 'Medium',
      marks: sec.marks || 1,
      department: sec.department || department || null,
      category: sec.category || category || 'General',
      customPrompt: sec.customPrompt || sec.prompt || customPrompt || prompt || '',
      competencies: Array.isArray(sec.competencies) ? sec.competencies : competencies
    }));
  }

  // 2. If it is a Full Assessment or Mixed Aptitude, decompose into multiple balanced sections
  const totalCount = Math.max(1, parseInt(questionCount, 10) || 5);
  const cleanMod = String(moduleName).toLowerCase();
  const cleanCat = String(category).toLowerCase();
  const cleanTopic = String(topic).toLowerCase();

  const isFullAssessment = cleanMod.includes('full');
  const isAptitudeMix = cleanCat.includes('mix') || cleanTopic.includes('mix') || cleanTopic.includes('all topics');

  if (isFullAssessment) {
    const aptCount = Math.floor(totalCount / 2);
    const domainCount = totalCount - aptCount;
    const quantCount = Math.floor(aptCount / 3);
    const logicCount = Math.floor(aptCount / 3);
    const verbalCount = aptCount - (quantCount + logicCount);

    return [
      {
        sectionId: 'sec_quant',
        name: 'Quantitative Ability',
        topic: 'Quantitative Aptitude (Arithmetic, Algebra, Percentages)',
        type: 'mcq',
        questionCount: Math.max(1, quantCount),
        difficulty,
        marks: 1,
        category: 'Quantitative Aptitude',
        department: null,
        customPrompt: customPrompt || prompt
      },
      {
        sectionId: 'sec_logic',
        name: 'Logical Reasoning',
        topic: 'Logical Reasoning (Puzzles, Series, Coding-Decoding)',
        type: 'mcq',
        questionCount: Math.max(1, logicCount),
        difficulty,
        marks: 1,
        category: 'Logical Reasoning',
        department: null,
        customPrompt: customPrompt || prompt
      },
      {
        sectionId: 'sec_verbal',
        name: 'Verbal Ability',
        topic: 'Verbal Ability (Grammar, Vocabulary, Comprehension)',
        type: 'mcq',
        questionCount: Math.max(1, verbalCount),
        difficulty,
        marks: 1,
        category: 'Verbal Ability',
        department: null,
        customPrompt: customPrompt || prompt
      },
      {
        sectionId: 'sec_domain',
        name: 'Domain Knowledge',
        topic: department ? `${department} Core Technical & Placement Concepts` : 'Core Technical Concepts',
        type: 'mcq',
        questionCount: Math.max(1, domainCount),
        difficulty,
        marks: 1,
        category: department || category || 'Computer Science',
        department: department || null,
        customPrompt: customPrompt || prompt
      }
    ];
  }

  if (isAptitudeMix && totalCount >= 3) {
    const quantCount = Math.floor(totalCount / 3);
    const logicCount = Math.floor(totalCount / 3);
    const verbalCount = totalCount - (quantCount + logicCount);

    return [
      {
        sectionId: 'sec_quant',
        name: 'Quantitative Ability',
        topic: 'Quantitative Aptitude',
        type: 'mcq',
        questionCount: quantCount,
        difficulty,
        marks: 1,
        category: 'Quantitative Aptitude',
        department: null,
        customPrompt: customPrompt || prompt
      },
      {
        sectionId: 'sec_logic',
        name: 'Logical Reasoning',
        topic: 'Logical Reasoning',
        type: 'mcq',
        questionCount: logicCount,
        difficulty,
        marks: 1,
        category: 'Logical Reasoning',
        department: null,
        customPrompt: customPrompt || prompt
      },
      {
        sectionId: 'sec_verbal',
        name: 'Verbal Ability',
        topic: 'Verbal Ability',
        type: 'mcq',
        questionCount: verbalCount,
        difficulty,
        marks: 1,
        category: 'Verbal Ability',
        department: null,
        customPrompt: customPrompt || prompt
      }
    ];
  }

  // 3. Single section assessment
  let singleType = 'mcq';
  if (cleanCat.includes('sql') || cleanTopic.includes('sql') || cleanCat.includes('dbms')) singleType = 'sql';
  else if (cleanCat.includes('coding') || cleanCat.includes('python') || cleanCat.includes('java') || cleanCat.includes('c++')) singleType = 'coding';
  else if (cleanMod.includes('psychometric') || cleanCat.includes('behavioral')) singleType = 'psychometric';

  return [
    {
      sectionId: 'sec_main',
      name: topic || category || moduleName,
      topic: topic || category || 'General',
      type: singleType,
      questionCount: totalCount,
      difficulty,
      marks: 1,
      category,
      department: department || null,
      customPrompt: customPrompt || prompt,
      competencies
    }
  ];
};

/**
 * Constructs prompt for Gemini for a specific section batch
 */
const buildSectionBatchPrompt = ({ section, count, existingQuestions = [] }) => {
  const existingSection = existingQuestions.length > 0
    ? `\nCRITICAL DEDUPLICATION DIRECTIVE:\nThe following questions were already generated. DO NOT repeat or trivially rephrase them:\n${existingQuestions.slice(-15).map((q, idx) => `${idx + 1}. "${typeof q === 'string' ? q : q.questionText}"`).join('\n')}`
    : '';

  return `You are a premier technical assessment architect.
Generate exactly ${count} distinct, verified multiple choice questions (MCQs) for the following assessment section:

Section Name: "${section.name}"
Topic / Syllabus: "${section.topic}"
Domain / Category: "${section.category}"
Department: ${section.department || 'General / Common'}
Question Type: "${section.type}" (e.g. mcq, sql, coding, psychometric)
Difficulty Level: "${section.difficulty}"
${section.customPrompt ? `Admin Specific Directives: "${section.customPrompt}"` : ''}
${existingSection}

STRICT SPECIFICATION RULES:
1. Every question must have exactly 4 plausible, distinct options (or 5 for psychometric).
2. The correctAnswer must match EXACTLY one of the strings in the options array.
3. Every option must be unique (no duplicate choices).
4. Provide a thorough, step-by-step explanation.
5. If Question Type is "sql", include a schemaSql definition and referenceQuery.
6. If Question Type is "coding", provide an explicit codeSnippet.
7. Return ONLY a valid JSON array complying with the requested response schema.`;
};

/**
 * Creates a new generation job in MongoDB
 */
const createGenerationJob = async ({
  title,
  description,
  module: moduleName,
  category,
  department,
  difficulty,
  timeLimitMinutes,
  passingScorePercentage,
  scoringRules,
  sections,
  batchSize = 5,
  assessmentId = null,
  userId = null
}) => {
  const normalizedSections = normalizeAssessmentSections({
    sections,
    module: moduleName,
    category,
    department,
    difficulty,
    questionCount: sections ? undefined : 5
  });

  const requestedCount = normalizedSections.reduce((acc, s) => acc + s.questionCount, 0);
  const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const sectionsProgress = normalizedSections.map((sec) => {
    const secTarget = sec.questionCount;
    const batchCount = Math.ceil(secTarget / batchSize);
    const batches = [];
    let rem = secTarget;

    for (let b = 0; b < batchCount; b++) {
      const bReq = Math.min(batchSize, rem);
      batches.push({
        batchIndex: b,
        batchKey: `${jobId}_${sec.sectionId}_batch_${b}`,
        requestedCount: bReq,
        acceptedCount: 0,
        status: 'pending',
        attempts: 0
      });
      rem -= bReq;
    }

    return {
      sectionId: sec.sectionId,
      name: sec.name,
      topic: sec.topic,
      type: sec.type,
      targetCount: secTarget,
      acceptedCount: 0,
      status: 'pending',
      batches
    };
  });

  const jobDoc = await AssessmentGenerationJob.create({
    jobId,
    assessmentId,
    status: 'pending',
    config: {
      title,
      description,
      module: moduleName,
      category,
      department,
      difficulty,
      timeLimitMinutes,
      passingScorePercentage,
      scoringRules,
      sections: normalizedSections,
      batchSize
    },
    requestedCount,
    acceptedCount: 0,
    failedCount: 0,
    sectionsProgress,
    acceptedQuestions: [],
    errorDetails: [],
    tokenUsage: { promptTokens: 0, candidateTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
    idempotencyKeys: [],
    createdBy: userId
  });

  return jobDoc;
};

/**
 * Executes or resumes a batch generation job until complete or bounded retry limit reached
 */
const runGenerationJob = async (jobId, { maxBatchAttempts = 2 } = {}) => {
  if (!acquireJobLock(jobId)) {
    throw new Error(`Generation job '${jobId}' is already running concurrently.`);
  }

  try {
    const job = await AssessmentGenerationJob.findOne({ jobId });
    if (!job) {
      throw new Error(`Generation job '${jobId}' not found.`);
    }

    if (job.status === 'completed') {
      return job;
    }

    job.status = 'in_progress';
    job.updatedAt = new Date();
    await job.save();

    const sections = job.config.sections;
    const batchSize = Math.max(5, Math.min(10, job.config.batchSize || 5));
    const accumulatedPool = [...job.acceptedQuestions];

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      const secProgress = job.sectionsProgress.find((p) => p.sectionId === section.sectionId);
      if (!secProgress) continue;

      if (secProgress.status === 'completed' && secProgress.acceptedCount >= secProgress.targetCount) {
        continue;
      }

      secProgress.status = 'in_progress';

      for (let bIdx = 0; bIdx < secProgress.batches.length; bIdx++) {
        const batch = secProgress.batches[bIdx];

        // Idempotency check: if this batch already succeeded and key is recorded, skip
        if (job.idempotencyKeys.includes(batch.batchKey) && batch.status === 'completed') {
          continue;
        }

        const needed = batch.requestedCount - batch.acceptedCount;
        if (needed <= 0) {
          batch.status = 'completed';
          continue;
        }

        batch.status = 'in_progress';
        batch.attempts += 1;

        let batchAccepted = [];
        let batchError = null;

        // Try Gemini structured output first
        try {
          const prompt = buildSectionBatchPrompt({
            section,
            count: needed,
            existingQuestions: accumulatedPool.map((q) => q.questionText)
          });

          const geminiRes = await generateQuestionsWithGemini({
            prompt,
            jobId: `${job.jobId}_sec${sIdx}_b${bIdx}`
          });

          // Accumulate token usage
          if (geminiRes.tokenUsage) {
            job.tokenUsage.promptTokens += geminiRes.tokenUsage.promptTokens;
            job.tokenUsage.candidateTokens += geminiRes.tokenUsage.candidateTokens;
            job.tokenUsage.totalTokens += geminiRes.tokenUsage.totalTokens;
            job.tokenUsage.estimatedCostUsd += geminiRes.tokenUsage.estimatedCostUsd;
          }

          // Validate every question with strict Zod schema & deterministic checks
          const { accepted: validList, rejected } = validateQuestionBatch(geminiRes.questions, {
            type: section.type,
            section: section.name,
            department: section.department,
            category: section.category,
            topic: section.topic,
            difficulty: section.difficulty,
            marks: section.marks
          });

          if (rejected.length > 0) {
            job.errorDetails.push({
              timestamp: new Date(),
              section: section.name,
              batchIndex: bIdx,
              error: `Validation rejected ${rejected.length} invalid questions from Gemini output: ${JSON.stringify(rejected.map(r => r.errors))}`,
              code: 'VALIDATION_REJECTION',
              isTransient: false
            });
          }

          // Filter duplicates against accumulated pool
          const { accepted: uniqueList, rejectedDuplicates } = filterUniqueQuestions(
            validList,
            accumulatedPool,
            0.75
          );

          if (rejectedDuplicates.length > 0) {
            job.errorDetails.push({
              timestamp: new Date(),
              section: section.name,
              batchIndex: bIdx,
              error: `Deduplication rejected ${rejectedDuplicates.length} duplicates`,
              code: 'DUPLICATE_REJECTION',
              isTransient: false
            });
          }

          batchAccepted = uniqueList;
        } catch (genErr) {
          batchError = genErr;
          const isTransient = !genErr.isPermanent;
          job.errorDetails.push({
            timestamp: new Date(),
            section: section.name,
            batchIndex: bIdx,
            error: genErr.message,
            code: genErr.code || genErr.status || 'GEN_ERROR',
            isTransient
          });

          // Top up with deterministic grounded questions so the batch does not halt incomplete
          const fallbackList = generateGroundedQuestionsBatch({
            count: needed,
            type: section.type,
            module: job.config.module,
            category: section.category,
            department: section.department,
            topic: section.topic,
            difficulty: section.difficulty,
            seedOffset: accumulatedPool.length + bIdx * 10
          });

          const { accepted: validFallback } = validateQuestionBatch(fallbackList, {
            type: section.type,
            section: section.name,
            department: section.department,
            category: section.category,
            topic: section.topic,
            difficulty: section.difficulty,
            marks: section.marks
          });

          const { accepted: uniqueFallback } = filterUniqueQuestions(
            validFallback,
            accumulatedPool,
            0.8
          );

          batchAccepted = uniqueFallback;
        }

        // Top up any remaining deficit in this batch to guarantee exact count
        if (batchAccepted.length < needed) {
          const deficit = needed - batchAccepted.length;
          const topUpList = generateGroundedQuestionsBatch({
            count: deficit,
            type: section.type,
            module: job.config.module,
            category: section.category,
            department: section.department,
            topic: section.topic,
            difficulty: section.difficulty,
            seedOffset: accumulatedPool.length + batchAccepted.length + 50
          });

          for (const tQ of topUpList) {
            if (batchAccepted.length >= needed) break;
            const check = checkIsDuplicate(tQ, [...accumulatedPool, ...batchAccepted]);
            if (!check.isDuplicate) {
              batchAccepted.push(tQ);
            }
          }
        }

        // Add verified unique questions to pool and job
        const finalBatchQuestions = batchAccepted.slice(0, needed);
        for (const fQ of finalBatchQuestions) {
          const qObj = {
            ...fQ,
            section: section.name,
            department: section.department,
            category: section.category,
            topic: section.topic,
            difficulty: section.difficulty,
            marks: section.marks || 1
          };
          job.acceptedQuestions.push(qObj);
          accumulatedPool.push(qObj);
        }

        batch.acceptedCount += finalBatchQuestions.length;
        secProgress.acceptedCount += finalBatchQuestions.length;
        job.acceptedCount += finalBatchQuestions.length;

        if (batch.acceptedCount >= batch.requestedCount) {
          batch.status = 'completed';
          job.idempotencyKeys.push(batch.batchKey);
        } else {
          batch.status = 'failed';
          job.failedCount += (batch.requestedCount - batch.acceptedCount);
        }

        // Save progress to MongoDB after each batch
        job.updatedAt = new Date();
        await job.save();
      }

      if (secProgress.acceptedCount >= secProgress.targetCount) {
        secProgress.status = 'completed';
      } else {
        secProgress.status = 'failed';
      }
    }

    // Set overall status: completed only if acceptedCount equals requestedCount
    if (job.acceptedCount >= job.requestedCount) {
      job.status = 'completed';
    } else if (job.acceptedCount > 0) {
      job.status = 'partial';
    } else {
      job.status = 'failed';
    }

    job.updatedAt = new Date();
    await job.save();

    // Sync to Assessment in MongoDB (Keep incomplete assessment in 'draft' status!)
    if (job.assessmentId) {
      const isComplete = job.status === 'completed';
      const targetStatus = isComplete ? (job.config.status || 'published') : 'draft';

      await Assessment.findByIdAndUpdate(job.assessmentId, {
        questions: job.acceptedQuestions,
        totalMarks: job.acceptedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0),
        status: targetStatus,
        updatedAt: new Date()
      });
    }

    return job;
  } finally {
    releaseJobLock(jobId);
  }
};

/**
 * Resumes an interrupted or partial generation job, regenerating only missing questions
 */
const resumeGenerationJob = async (jobId) => {
  return runGenerationJob(jobId);
};

module.exports = {
  createGenerationJob,
  runGenerationJob,
  resumeGenerationJob,
  normalizeAssessmentSections,
  buildSectionBatchPrompt,
  acquireJobLock,
  releaseJobLock
};
