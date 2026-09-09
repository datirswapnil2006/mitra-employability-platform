require('dotenv').config();
const mongoose = require('mongoose');
const { Assessment } = require('./modules/assessments/assessment.models');
const Question = require('./modules/assessments/question.model');
const { Topic } = require('./modules/training/training.models');

/**
 * Generates 200 diverse Quantitative Aptitude Percentage questions
 */
function generatePercentageQuestionBank(percentageTopicId) {
  const questions = [];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  const templates = [
    {
      type: 'increase_decrease',
      make: (i) => {
        const val = 10 + (i % 25) * 2;
        const base = 200 + (i * 15);
        const inc = Math.round(base * (1 + val / 100));
        const diff = inc - base;
        const options = [
          `${inc}`,
          `${inc + 10}`,
          `${inc - 10}`,
          `${inc + 20}`
        ];
        return {
          questionText: `If a quantity is ${base} and it increases by ${val}%, what is the final value?`,
          options,
          correctAnswer: `${inc}`,
          explanation: `Final value = ${base} + (${val}% of ${base}) = ${base} + ${diff} = ${inc}.`,
          difficulty: val <= 20 ? 'Easy' : (val <= 40 ? 'Medium' : 'Hard'),
          marks: 1
        };
      }
    },
    {
      type: 'fraction_to_percent',
      make: (i) => {
        const num = (i % 9) + 1;
        const den = num + (i % 5) + 1;
        const pct = ((num / den) * 100).toFixed(2);
        const options = [
          `${pct}%`,
          `${(parseFloat(pct) + 5).toFixed(2)}%`,
          `${(parseFloat(pct) - 4.5).toFixed(2)}%`,
          `${(parseFloat(pct) + 2.5).toFixed(2)}%`
        ];
        return {
          questionText: `Express the fraction ${num}/${den} as a percentage rounded to two decimal places.`,
          options,
          correctAnswer: `${pct}%`,
          explanation: `Percentage = (${num} / ${den}) * 100% = ${pct}%.`,
          difficulty: 'Easy',
          marks: 1
        };
      }
    },
    {
      type: 'salary_comparison',
      make: (i) => {
        const p = 10 + (i % 6) * 5; // 10, 15, 20, 25, 30, 35
        const ans = ((p / (100 - p)) * 100).toFixed(2);
        const options = [
          `${ans}%`,
          `${p}%`,
          `${(parseFloat(ans) + 5).toFixed(2)}%`,
          `${(parseFloat(ans) - 3.2).toFixed(2)}%`
        ];
        return {
          questionText: `If A's income is ${p}% less than B's income, by how much percent is B's income more than A's income?`,
          options,
          correctAnswer: `${ans}%`,
          explanation: `Let B's income = 100. A's income = ${100 - p}. Excess of B over A = (${p} / ${100 - p}) * 100% = ${ans}%.`,
          difficulty: 'Medium',
          marks: 1
        };
      }
    },
    {
      type: 'price_consumption',
      make: (i) => {
        const p = 20 + (i % 5) * 5; // 20, 25, 30, 35, 40
        const ans = ((p / (100 + p)) * 100).toFixed(2);
        const options = [
          `${ans}%`,
          `${p}%`,
          `${(parseFloat(ans) - 2).toFixed(2)}%`,
          `${(parseFloat(ans) + 4.5).toFixed(2)}%`
        ];
        return {
          questionText: `If the price of petrol increases by ${p}%, by what percentage must a motorist reduce consumption so expenditure remains unaltered?`,
          options,
          correctAnswer: `${ans}%`,
          explanation: `Reduction percentage = [r / (100 + r)] * 100% = [${p} / ${100 + p}] * 100% = ${ans}%.`,
          difficulty: 'Medium',
          marks: 1
        };
      }
    },
    {
      type: 'exam_marks',
      make: (i) => {
        const passPct = 35 + (i % 6) * 2;
        const scored = 120 + i * 5;
        const failedBy = 15 + (i % 4) * 5;
        const passMarks = scored + failedBy;
        const maxMarks = Math.round((passMarks / passPct) * 100);
        const options = [
          `${maxMarks}`,
          `${maxMarks + 50}`,
          `${maxMarks - 40}`,
          `${maxMarks + 100}`
        ];
        return {
          questionText: `A student needs ${passPct}% to pass an examination. He scores ${scored} marks and fails by ${failedBy} marks. Find the maximum marks of the examination.`,
          options,
          correctAnswer: `${maxMarks}`,
          explanation: `Pass marks = ${scored} + ${failedBy} = ${passMarks}. Since ${passPct}% of Max Marks = ${passMarks}, Max Marks = (${passMarks} * 100) / ${passPct} = ${maxMarks}.`,
          difficulty: 'Medium',
          marks: 1
        };
      }
    },
    {
      type: 'population_change',
      make: (i) => {
        const rate = 5 + (i % 4) * 2; // 5, 7, 9, 11
        const initial = 10000 + i * 1000;
        const finalPop = Math.round(initial * Math.pow(1 + rate / 100, 2));
        const options = [
          `${finalPop}`,
          `${finalPop + 250}`,
          `${finalPop - 180}`,
          `${finalPop + 500}`
        ];
        return {
          questionText: `The current population of a city is ${initial}. If it grows at an annual rate of ${rate}%, what will the population be after 2 years?`,
          options,
          correctAnswer: `${finalPop}`,
          explanation: `Population after 2 years = P * (1 + r/100)^2 = ${initial} * (1 + ${rate}/100)^2 = ${finalPop}.`,
          difficulty: 'Hard',
          marks: 1
        };
      }
    },
    {
      type: 'election_votes',
      make: (i) => {
        const total = 5000 + i * 500;
        const winnerPct = 52 + (i % 8) * 2;
        const loserPct = 100 - winnerPct;
        const winnerVotes = Math.round((winnerPct / 100) * total);
        const loserVotes = total - winnerVotes;
        const margin = winnerVotes - loserVotes;
        const options = [
          `${margin} votes`,
          `${margin + 120} votes`,
          `${margin - 80} votes`,
          `${margin + 200} votes`
        ];
        return {
          questionText: `In an election with two candidates, the winner secures ${winnerPct}% of total ${total} votes cast. By what margin did the winner defeat the rival?`,
          options,
          correctAnswer: `${margin} votes`,
          explanation: `Winner votes = ${winnerVotes}, Loser votes = ${loserVotes}. Margin = ${winnerVotes} - ${loserVotes} = ${margin} votes.`,
          difficulty: 'Easy',
          marks: 1
        };
      }
    },
    {
      type: 'successive_discount',
      make: (i) => {
        const d1 = 10 + (i % 4) * 5;
        const d2 = 10 + ((i + 1) % 3) * 5;
        const netDiscount = (d1 + d2 - (d1 * d2) / 100).toFixed(1);
        const options = [
          `${netDiscount}%`,
          `${d1 + d2}%`,
          `${(parseFloat(netDiscount) - 2).toFixed(1)}%`,
          `${(parseFloat(netDiscount) + 3).toFixed(1)}%`
        ];
        return {
          questionText: `Find the single equivalent discount percentage for two successive discounts of ${d1}% and ${d2}%.`,
          options,
          correctAnswer: `${netDiscount}%`,
          explanation: `Equivalent discount = d1 + d2 - (d1 * d2 / 100) = ${d1} + ${d2} - (${d1 * d2} / 100) = ${netDiscount}%.`,
          difficulty: 'Medium',
          marks: 1
        };
      }
    }
  ];

  for (let i = 0; i < 200; i++) {
    const template = templates[i % templates.length];
    const qData = template.make(i);

    questions.push({
      module: 'Aptitude',
      category: 'Quantitative',
      topic: 'Percentage',
      topicId: percentageTopicId,
      questionText: qData.questionText,
      codeSnippet: '',
      type: 'mcq',
      options: qData.options,
      correctAnswer: qData.correctAnswer,
      explanation: qData.explanation,
      difficulty: qData.difficulty,
      marks: qData.marks,
      tags: ['Percentage', 'Quantitative Aptitude', 'Arithmetic'],
      aiGenerated: false,
      aiProvider: 'manual',
      status: 'active'
    });
  }

  return questions;
}

async function runSeed() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mitra_portal';
  console.log('[Seed Questions]: Connecting to database...');
  await mongoose.connect(uri);

  try {
    // 1. Find or verify Percentage topic
    let percentageTopic = await Topic.findOne({ module: 'Aptitude', title: 'Percentage' });
    if (!percentageTopic) {
      console.log('[Seed Questions]: Percentage topic not found, creating topic...');
      percentageTopic = await Topic.create({
        module: 'Aptitude',
        category: 'Quantitative',
        title: 'Percentage',
        description: 'Concepts of percentage calculations, percentage change, and practical business applications.',
        order: 1,
        status: 'published'
      });
    }

    // 2. Migrate existing assessment questions into Question collection
    const assessments = await Assessment.find({});
    console.log(`[Seed Questions]: Inspecting ${assessments.length} existing assessments for questions...`);

    let migratedCount = 0;
    for (const a of assessments) {
      if (a.questions && Array.isArray(a.questions) && a.questions.length > 0) {
        // Find matching topic
        let tDoc = null;
        if (a.topicId) {
          tDoc = await Topic.findById(a.topicId);
        }
        if (!tDoc && a.topic) {
          tDoc = await Topic.findOne({ title: a.topic });
        }

        for (const q of a.questions) {
          const exists = await Question.findOne({ questionText: q.questionText.trim() });
          if (!exists) {
            await Question.create({
              module: a.module || 'Aptitude',
              category: a.category || 'Quantitative',
              department: a.department || null,
              topic: a.topic || (tDoc ? tDoc.title : 'General'),
              topicId: tDoc ? tDoc._id : null,
              questionText: q.questionText.trim(),
              codeSnippet: q.codeSnippet || '',
              type: q.type || 'mcq',
              options: q.options || [],
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || '',
              difficulty: q.difficulty || 'Medium',
              marks: q.marks || 1,
              status: 'active'
            });
            migratedCount++;
          }
        }
      }
    }
    console.log(`[Seed Questions]: Migrated ${migratedCount} questions from assessments into Question Bank.`);

    // 3. Seed Percentage 200 Questions
    const existingPercentageQCount = await Question.countDocuments({
      $or: [{ topicId: percentageTopic._id }, { topic: 'Percentage' }]
    });

    console.log(`[Seed Questions]: Percentage currently has ${existingPercentageQCount} questions in Question Bank.`);

    if (existingPercentageQCount < 200) {
      const needed = 200 - existingPercentageQCount;
      console.log(`[Seed Questions]: Seeding ${needed} additional questions to reach 200 questions for Percentage...`);
      const bank = generatePercentageQuestionBank(percentageTopic._id);

      // Filter out duplicates
      const docsToInsert = [];
      for (const item of bank) {
        if (docsToInsert.length >= needed) break;
        const exists = await Question.findOne({ questionText: item.questionText });
        if (!exists) {
          docsToInsert.push(item);
        }
      }

      if (docsToInsert.length > 0) {
        await Question.insertMany(docsToInsert);
        console.log(`[Seed Questions]: Successfully added ${docsToInsert.length} questions to Percentage Question Bank.`);
      }
    }

    const finalQCount = await Question.countDocuments({
      $or: [{ topicId: percentageTopic._id }, { topic: 'Percentage' }]
    });
    console.log(`[Seed Questions]: Percentage Question Bank now contains: ${finalQCount} questions.`);

    // 4. Ensure Percentage topic has a Default Topic Assessment (<= 30 questions)
    let defaultAssessment = await Assessment.findOne({
      $or: [
        { _id: percentageTopic.defaultAssessmentId },
        { topicId: percentageTopic._id, isDefaultTopicAssessment: true },
        { topic: 'Percentage', isDefaultTopicAssessment: true }
      ]
    });

    if (!defaultAssessment) {
      // Pick 15 questions from Question bank for the default assessment
      const percentageQuestions = await Question.find({
        $or: [{ topicId: percentageTopic._id }, { topic: 'Percentage' }]
      }).limit(15);

      defaultAssessment = await Assessment.create({
        title: 'Percentage — Topic Assessment',
        description: 'Comprehensive baseline evaluation covering percentage calculations and arithmetic reasoning.',
        module: 'Aptitude',
        category: 'Quantitative',
        topic: 'Percentage',
        topicId: percentageTopic._id,
        difficulty: 'Medium',
        isDefaultTopicAssessment: true,
        isPracticeTest: false,
        questions: percentageQuestions.map(q => ({
          questionText: q.questionText,
          codeSnippet: q.codeSnippet || '',
          type: q.type || 'mcq',
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          marks: q.marks || 1,
          difficulty: q.difficulty || 'Medium'
        })),
        passingScorePercentage: 70,
        timeLimitMinutes: 20,
        totalMarks: percentageQuestions.length,
        status: 'published'
      });

      percentageTopic.defaultAssessmentId = defaultAssessment._id;
      await percentageTopic.save();
      console.log(`[Seed Questions]: Created Default Assessment for Percentage with ${percentageQuestions.length} questions.`);
    } else {
      console.log(`[Seed Questions]: Default Assessment for Percentage already exists: ${defaultAssessment.title} (${defaultAssessment.questions?.length} questions).`);
    }

    console.log('[Seed Questions]: Migration and seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Questions Error]:', err);
    process.exit(1);
  }
}

runSeed();
