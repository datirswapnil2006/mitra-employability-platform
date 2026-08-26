const mongoose = require('mongoose');
const User = require('./modules/auth/user.model');
const { Topic, LearningContent } = require('./modules/training/training.models');

/**
 * Clean System Initialization
 * Ensures default Administrator account exists and bootstraps initial standard Aptitude topics if empty.
 */
const seedData = async () => {
  try {
    const adminUser = await User.findOne({ role: 'admin' });
    let adminId = adminUser ? adminUser._id : null;

    if (!adminUser) {
      console.log('[System Init]: Bootstrapping initial system administrator...');
      const newAdmin = await User.create({
        name: 'Dr. N. N. Khalsa (Admin)',
        email: 'admin@mitra.edu',
        password: 'adminpassword123',
        role: 'admin',
        department: 'CSE'
      });
      adminId = newAdmin._id;
      console.log('[System Init]: Administrator account initialized (admin@mitra.edu).');
    }

    // Default test student with 100% verified profile
    let studentUser = await User.findOne({ email: 'student@mitra.edu' });
    if (!studentUser) {
      const { StudentProfile } = require('./modules/students/student.model');
      studentUser = await User.create({
        name: 'Aarav Patel (Student)',
        email: 'student@mitra.edu',
        password: 'studentpassword123',
        role: 'student',
        department: 'CSE'
      });

      const profile = new StudentProfile({
        user: studentUser._id,
        erpNumber: 'CSE2026001',
        rollNo: 'CSE2026001',
        department: 'CSE',
        year: 'Third Year',
        batch: '2026',
        phone: '9876543210',
        hometown: 'Pune',
        aadhaarNumber: '123456789012',
        educationGap: 'No',
        hasBacklogs: 'No',
        resumeUrl: 'https://mitra.edu/resumes/aarav.pdf',
        tenthPercentage: 92,
        twelfthPercentage: 89,
        cgpa: 9.1
      });
      profile.profileCompletionPercentage = 100;
      await profile.save();
      console.log('[System Init]: Verified student account initialized (student@mitra.edu).');
    }

    // Initialize default Aptitude topics if none exist
    const topicCount = await Topic.countDocuments({ module: 'Aptitude' });
    if (topicCount === 0) {
      console.log('[System Init]: Bootstrapping default standard Aptitude topics...');
      
      const defaultTopics = [
        // Quantitative Aptitude
        { module: 'Aptitude', category: 'Quantitative', title: 'Percentage', description: 'Concepts of percentage calculations, percentage change, and practical business applications.', order: 1 },
        { module: 'Aptitude', category: 'Quantitative', title: 'Profit & Loss', description: 'Cost price, selling price, marked price, discount, and profit/loss margins.', order: 2 },
        { module: 'Aptitude', category: 'Quantitative', title: 'Ratio & Proportion', description: 'Direct, inverse, and compound ratios, proportions, and mixture problems.', order: 3 },
        { module: 'Aptitude', category: 'Quantitative', title: 'Average', description: 'Arithmetic mean, weighted average, and real-world age/score calculations.', order: 4 },
        { module: 'Aptitude', category: 'Quantitative', title: 'Time & Work', description: 'Efficiency, pipes & cisterns, and collaborative work calculations.', order: 5 },
        { module: 'Aptitude', category: 'Quantitative', title: 'Speed, Time & Distance', description: 'Relative speed, trains, boats & streams, and average speed equations.', order: 6 },
        
        // Logical Reasoning
        { module: 'Aptitude', category: 'Reasoning', title: 'Blood Relations', description: 'Family tree mappings, direct & coded relationship deductions.', order: 1 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Direction Sense', description: 'Cardinal directions, turns, angles, and shortest distance calculations.', order: 2 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Coding-Decoding', description: 'Letter shifting, substitution, and alphanumeric deciphering.', order: 3 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Syllogism', description: 'Deductive logic, Venn diagram representations, and truth-value deductions.', order: 4 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Seating Arrangement', description: 'Linear and circular positioning with multiple constraint matrices.', order: 5 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Number/Alphabet Series', description: 'Pattern recognition, missing term identification, and series rules.', order: 6 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Analogy', description: 'Semantic, numeric, and symbolic relationship matching.', order: 7 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Classification', description: 'Odd one out identification and categorisation rules.', order: 8 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Statement & Conclusions', description: 'Logical inferences, assumptions, and critical reasoning arguments.', order: 9 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Puzzles', description: 'Floor puzzles, scheduling, and multi-variable logic riddles.', order: 10 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Ranking & Order', description: 'Position finding, comparisons, and queue ordering logic.', order: 11 },

        // Verbal Ability
        { module: 'Aptitude', category: 'Verbal', title: 'Reading Comprehension', description: 'Critical reading, inferential comprehension, and paragraph analysis.', order: 1 },
        { module: 'Aptitude', category: 'Verbal', title: 'Sentence Correction', description: 'Grammar rules, subject-verb agreement, modifiers, and parallelism.', order: 2 },
        { module: 'Aptitude', category: 'Verbal', title: 'Para Jumbles', description: 'Sentence rearrangement, logical flow detection, and coherent paragraph structuring.', order: 3 },
        { module: 'Aptitude', category: 'Verbal', title: 'Vocabulary & Idioms', description: 'Synonyms, antonyms, contextual word usage, and idiomatic phrases.', order: 4 }
      ];

      for (const t of defaultTopics) {
        const exists = await Topic.findOne({ module: 'Aptitude', category: t.category, title: t.title });
        if (!exists) {
          await Topic.create({
            ...t,
            status: 'published',
            createdBy: adminId
          });
        }
      }
      console.log('[System Init]: Standard Aptitude topics verified and initialized.');
    } else {
      // Ensure missing reasoning topics are also created for existing databases
      const reasoningTopics = [
        { module: 'Aptitude', category: 'Reasoning', title: 'Blood Relations', description: 'Family tree mappings, direct & coded relationship deductions.', order: 1 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Direction Sense', description: 'Cardinal directions, turns, angles, and shortest distance calculations.', order: 2 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Coding-Decoding', description: 'Letter shifting, substitution, and alphanumeric deciphering.', order: 3 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Syllogism', description: 'Deductive logic, Venn diagram representations, and truth-value deductions.', order: 4 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Seating Arrangement', description: 'Linear and circular positioning with multiple constraint matrices.', order: 5 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Number/Alphabet Series', description: 'Pattern recognition, missing term identification, and series rules.', order: 6 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Analogy', description: 'Semantic, numeric, and symbolic relationship matching.', order: 7 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Classification', description: 'Odd one out identification and categorisation rules.', order: 8 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Statement & Conclusions', description: 'Logical inferences, assumptions, and critical reasoning arguments.', order: 9 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Puzzles', description: 'Floor puzzles, scheduling, and multi-variable logic riddles.', order: 10 },
        { module: 'Aptitude', category: 'Reasoning', title: 'Ranking & Order', description: 'Position finding, comparisons, and queue ordering logic.', order: 11 }
      ];

      for (const t of reasoningTopics) {
        const exists = await Topic.findOne({ module: 'Aptitude', category: 'Reasoning', title: t.title });
        if (!exists) {
          await Topic.create({
            ...t,
            status: 'published',
            createdBy: adminId
          });
        }
      }
    }

    // Safe migration: Link any existing LearningContent without topicId to matching Topic or default Topic
    const unlinkedAptitudeContents = await LearningContent.find({
      module: 'Aptitude',
      $or: [{ topicId: { $exists: false } }, { topicId: null }]
    });

    if (unlinkedAptitudeContents.length > 0) {
      console.log(`[System Init]: Migrating ${unlinkedAptitudeContents.length} unlinked Aptitude learning resources to topics...`);
      for (const item of unlinkedAptitudeContents) {
        let matchingTopic = null;
        if (item.topic) {
          matchingTopic = await Topic.findOne({
            module: 'Aptitude',
            title: { $regex: new RegExp(`^${item.topic.trim()}$`, 'i') }
          });
        }
        if (!matchingTopic && item.category) {
          matchingTopic = await Topic.findOne({
            module: 'Aptitude',
            category: item.category
          });
        }
        if (matchingTopic) {
          item.topicId = matchingTopic._id;
          item.topic = matchingTopic.title;
          await item.save();
        }
      }
      console.log('[System Init]: Migration complete.');
    }

  } catch (err) {
    console.error('[System Init Error]:', err.message);
  }
};

module.exports = seedData;
