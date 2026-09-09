require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { Assessment, AssessmentAttempt } = require('./modules/assessments/assessment.models');
const Question = require('./modules/assessments/question.model');
const { Topic } = require('./modules/training/training.models');
const User = require('./modules/auth/user.model');
const StudentGamification = require('./modules/gamification/gamification.model');
const gamificationService = require('./modules/gamification/gamification.service');
const assessmentController = require('./modules/assessments/assessment.controller');

async function runTests() {
  console.log('--- STARTING SYSTEM INTEGRATION & VERIFICATION TESTS ---');
  await connectDB();
  console.log('✓ Connected to MongoDB');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  try {
    // TEST 1: Check Percentage Topic & Default Assessment
    console.log('\n--- TEST SUITE 1: Training Topic & Default Assessment ---');
    const percentageTopic = await Topic.findOne({ title: { $regex: /percentage/i } });
    assert(percentageTopic, 'Topic "Percentage" exists in DB');
    console.log(`  Topic ID: ${percentageTopic._id}, Title: ${percentageTopic.title}`);

    // Check default assessment
    let defaultAssessment = null;
    if (percentageTopic.defaultAssessmentId) {
      defaultAssessment = await Assessment.findById(percentageTopic.defaultAssessmentId);
    }
    if (!defaultAssessment) {
      defaultAssessment = await Assessment.findOne({
        topicId: percentageTopic._id,
        isDefaultTopicAssessment: true
      });
    }
    assert(defaultAssessment !== null, 'Default assessment is associated with Percentage topic');
    assert(defaultAssessment.questions.length <= 30, `Default assessment questions count (${defaultAssessment.questions.length}) <= 30`);
    assert(defaultAssessment.isDefaultTopicAssessment === true, 'isDefaultTopicAssessment flag is true');
    console.log(`  Default Assessment ID: ${defaultAssessment._id}, Title: ${defaultAssessment.title}, Questions: ${defaultAssessment.questions.length}`);

    // TEST 2: Check Topic Question Bank Pool
    console.log('\n--- TEST SUITE 2: Question Bank by Hierarchy ---');
    const percentageQuestionsCount = await Question.countDocuments({
      $or: [{ topicId: percentageTopic._id }, { topic: { $regex: /percentage/i } }]
    });
    assert(percentageQuestionsCount >= 200, `Percentage topic has >= 200 questions in question bank (found: ${percentageQuestionsCount})`);

    // Verify question structure
    const sampleQuestion = await Question.findOne({
      $or: [{ topicId: percentageTopic._id }, { topic: { $regex: /percentage/i } }]
    });
    assert((sampleQuestion.questionText || sampleQuestion.text) && sampleQuestion.options && sampleQuestion.options.length >= 2, 'Question has valid text and options');
    assert(sampleQuestion.correctAnswer || sampleQuestion.options.some(o => o.isCorrect), 'Question has marked correct option');
    assert(sampleQuestion.topicId || sampleQuestion.topic, 'Question maintains topic reference');

    // TEST 3: Student Self-Practice Test (10 Questions)
    console.log('\n--- TEST SUITE 3: Practice Test (10 Questions) ---');
    const studentUser = await User.findOne({ role: 'student' }) || await User.findOne();
    assert(studentUser, 'Found student user for testing');

    const req10 = {
      user: { _id: studentUser._id, role: 'student', department: studentUser.department || 'CSE' },
      body: {
        topicId: percentageTopic._id,
        topic: percentageTopic.title,
        questionCount: 10,
        difficulty: 'All'
      }
    };
    let res10Data = null;
    const res10 = {
      status: () => res10,
      json: (d) => { res10Data = d; return res10; }
    };

    await assessmentController.createPracticeTest(req10, res10);
    assert(res10Data && res10Data.success, 'Practice test (10 Qs) created successfully');
    assert(res10Data.assessment.questions.length === 10, `Practice test contains exactly 10 questions (actual: ${res10Data.assessment.questions.length})`);
    assert(res10Data.assessment.isPracticeTest === true, 'Assessment is marked as isPracticeTest');

    // TEST 4: Student Self-Practice Test (30 Questions - System Maximum)
    console.log('\n--- TEST SUITE 4: Practice Test (30 Questions) ---');
    const req30 = {
      user: { _id: studentUser._id, role: 'student', department: studentUser.department || 'CSE' },
      body: {
        topicId: percentageTopic._id,
        topic: percentageTopic.title,
        questionCount: 30,
        difficulty: 'All'
      }
    };
    let res30Data = null;
    const res30 = {
      status: () => res30,
      json: (d) => { res30Data = d; return res30; }
    };

    await assessmentController.createPracticeTest(req30, res30);
    assert(res30Data && res30Data.success, 'Practice test (30 Qs) created successfully');
    assert(res30Data.assessment.questions.length === 30, `Practice test contains exactly 30 questions (actual: ${res30Data.assessment.questions.length})`);

    // TEST 5: HARD RULE - Attempt to Create 31+ Questions (e.g. 50 Qs Request)
    console.log('\n--- TEST SUITE 5: Hard Rule Enforcement - Request >30 Questions ---');
    const req50 = {
      user: { _id: studentUser._id, role: 'student', department: studentUser.department || 'CSE' },
      body: {
        topicId: percentageTopic._id,
        topic: percentageTopic.title,
        questionCount: 50, // Exceeds limit
        difficulty: 'All'
      }
    };
    let res50Data = null;
    const res50 = {
      status: () => res50,
      json: (d) => { res50Data = d; return res50; }
    };

    await assessmentController.createPracticeTest(req50, res50);
    assert(res50Data && res50Data.success, 'Practice test API handled request gracefully');
    assert(res50Data.assessment.questions.length === 30, `Capped strictly to 30 questions (actual: ${res50Data.assessment.questions.length})`);
    assert(res50Data.assessment.questions.length <= 30, 'HARD RULE VERIFIED: Test questions NEVER exceed 30');

    // TEST 6: Schema Pre-Save Hook Capping
    console.log('\n--- TEST SUITE 6: Schema-Level 30-Question Cap ---');
    const oversizedQuestions = Array.from({ length: 45 }, (_, i) => ({
      questionText: `Test question ${i + 1}`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      marks: 1
    }));
    const testOversized = new Assessment({
      title: 'Oversized Test Schema Check',
      module: 'Aptitude',
      category: 'Quantitative Aptitude',
      department: 'CSE',
      questions: oversizedQuestions,
      totalMarks: 45
    });
    await testOversized.save();
    const fetchedOversized = await Assessment.findById(testOversized._id);
    assert(fetchedOversized.questions.length === 30, `Schema pre-save hook automatically truncated 45 questions to 30 (actual: ${fetchedOversized.questions.length})`);
    await Assessment.findByIdAndDelete(testOversized._id);

    // TEST 7: Gamification Layer (XP & Streak)
    console.log('\n--- TEST SUITE 7: Gamification (XP & Streak) ---');
    // Clear test gamification for clean verification
    await StudentGamification.deleteMany({ user: studentUser._id });

    // Activity 1: Lecture Completion (+15 XP)
    const testLectureId = new mongoose.Types.ObjectId();
    const g1 = await gamificationService.awardActivityXP(
      studentUser._id,
      'LECTURE_COMPLETE',
      testLectureId,
      'Completed Percentage Introduction Video'
    );
    assert(g1 !== null && g1.totalXP === 15, `First lecture completion awarded 15 XP (actual: ${g1?.totalXP})`);
    assert(g1.currentStreak === 1, `Current streak is 1 day (actual: ${g1.currentStreak})`);

    // Activity 2: Idempotency Check (Duplicate lecture completion)
    const gDuplicate = await gamificationService.awardActivityXP(
      studentUser._id,
      'LECTURE_COMPLETE',
      testLectureId,
      'Completed Percentage Introduction Video again'
    );
    assert(gDuplicate.totalXP === 15 && gDuplicate.activities.length === 1, 'Duplicate completion correctly rejected (idempotency preserved)');

    // Activity 3: Note Read (+10 XP)
    const testNoteId = new mongoose.Types.ObjectId();
    const g2 = await gamificationService.awardActivityXP(
      studentUser._id,
      'NOTE_READ',
      testNoteId,
      'Read Percentage Study Notes PDF'
    );
    assert(g2.totalXP === 25, `Total XP is now 25 (actual: ${g2.totalXP})`);

    // Activity 4: Practice Test Completion (+20 XP)
    const testPracticeId = new mongoose.Types.ObjectId();
    const g3 = await gamificationService.awardActivityXP(
      studentUser._id,
      'PRACTICE_TEST_COMPLETE',
      testPracticeId,
      'Completed Percentage Practice Test'
    );
    assert(g3.totalXP === 45, `Total XP is now 45 (actual: ${g3.totalXP})`);

    // Activity 5: High Score Bonus (+15 XP)
    const g4 = await gamificationService.awardActivityXP(
      studentUser._id,
      'HIGH_SCORE_BONUS',
      testPracticeId,
      'Scored 90% in Percentage Practice Test'
    );
    assert(g4.totalXP === 60, `Total XP is now 60 (actual: ${g4.totalXP})`);

    // Activity 6: Topic 100% Completion (+50 XP)
    const g5 = await gamificationService.awardActivityXP(
      studentUser._id,
      'TOPIC_COMPLETE',
      percentageTopic._id,
      '100% Percentage Topic Completion'
    );
    assert(g5.totalXP === 110, `Total XP is now 110 (actual: ${g5.totalXP})`);
    assert(g5.level === 2, `Student leveled up to Level 2 (actual: ${g5.level})`);

    // Test Gamification Stats Endpoint Output
    const stats = await gamificationService.getStudentGamificationStats(studentUser._id);
    assert(stats.totalXP === 110, 'Stats endpoint returns correct totalXP (110)');
    assert(stats.level === 2, 'Stats endpoint returns correct level (2)');
    assert(stats.currentStreak === 1, 'Stats endpoint returns correct streak (1)');
    assert(stats.recentActivities.length > 0, 'Stats endpoint returns activity history');

    // TEST 8: Backward Compatibility
    console.log('\n--- TEST SUITE 8: Backward Compatibility Check ---');
    const existingAssessmentsCount = await Assessment.countDocuments();
    assert(existingAssessmentsCount >= 10, `All existing assessments preserved (found: ${existingAssessmentsCount})`);

    const existingAttemptsCount = await AssessmentAttempt.countDocuments();
    assert(existingAttemptsCount >= 9, `All existing attempts preserved (found: ${existingAttemptsCount})`);

    console.log(`\n========================================`);
    console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} checks passed successfully!`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
