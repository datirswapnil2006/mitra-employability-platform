const mongoose = require('mongoose');
const User = require('./modules/auth/user.model');
const { Category, Topic, Company, LearningContent } = require('./modules/training/training.models');

/**
 * Clean System Initialization
 * Ensures default Administrator account exists and bootstraps initial standard Aptitude & Domain categories/topics if empty.
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

    // ==========================================
    // Bootstrapping Official Domain Categories (9 Departments)
    // ==========================================
    const domainDeptCategories = {
      EXTC: [
        'C Programming', 'Digital Electronics', 'Microprocessors & Microcontrollers',
        'Embedded Systems', 'Communication Systems', 'IoT Fundamentals',
        'Sensors & Transducers', 'Basic Programming & DSA', 'Core Technical Interview'
      ],
      IT: [
        'Programming & DSA', 'OOP', 'DBMS & SQL',
        'Operating Systems', 'Computer Networks', 'Web Development',
        'Software Engineering', 'Cloud & DevOps', 'Technical Interview Preparation'
      ],
      CSE: [
        'Programming & DSA', 'OOP', 'DBMS & SQL',
        'Operating Systems', 'Computer Networks', 'Web Development',
        'Software Engineering', 'Cloud & DevOps', 'Technical Interview Preparation'
      ],
      Civil: [
        'Engineering Mechanics', 'Strength of Materials', 'Structural Engineering',
        'Concrete Technology', 'Geotechnical Engineering', 'Surveying',
        'Transportation Engineering', 'Construction Management', 'AutoCAD & Design', 'Civil Core Interview Preparation'
      ],
      Mechanical: [
        'Engineering Mechanics', 'Strength of Materials', 'Thermodynamics',
        'Manufacturing Processes', 'Fluid Mechanics', 'Heat Transfer',
        'CAD & Design', 'CNC & Production', 'Industrial Engineering', 'Mechanical Core Interview Preparation'
      ],
      'CSE (IOT)': [
        'Programming & DSA', 'OOP', 'DBMS & SQL',
        'Computer Networks', 'IoT Fundamentals', 'Sensors & Actuators',
        'Embedded Systems', 'Microcontrollers', 'Cloud & IoT', 'IoT Technical Interview'
      ],
      AIDS: [
        'Programming & DSA', 'Python Programming', 'OOP',
        'DBMS & SQL', 'Statistics & Probability', 'Machine Learning',
        'Data Analysis', 'Deep Learning', 'Generative AI & LLM Basics', 'AI/Data Science Interview'
      ],
      MCA: [
        'Programming & DSA', 'OOP', 'DBMS & SQL',
        'Operating Systems', 'Computer Networks', 'Web Development',
        'Software Engineering', 'Cloud & DevOps', 'Application Development', 'Technical Interview Preparation'
      ],
      MBA: [
        'Marketing', 'Finance', 'Human Resource Management',
        'Operations Management', 'Business Analytics', 'Supply Chain Management',
        'Digital Marketing', 'Business Communication', 'Case Study & Business Problems', 'Management Interview Preparation'
      ]
    };

    console.log('[System Init]: Checking & initializing official Domain categories for 9 departments...');
    for (const [dept, categories] of Object.entries(domainDeptCategories)) {
      for (let i = 0; i < categories.length; i++) {
        const catTitle = categories[i];
        let cat = await Category.findOne({
          module: 'Domain',
          department: dept,
          title: catTitle
        });

        if (!cat) {
          cat = await Category.create({
            module: 'Domain',
            department: dept,
            departmentId: dept,
            title: catTitle,
            description: `Core domain curriculum and interview preparation for ${catTitle}.`,
            order: i + 1,
            status: 'published',
            createdBy: adminId
          });
        }

        // Add sample topics for EXTC (Electronics & Telecommunication Engineering)
        if (dept === 'EXTC') {
          let sampleExtcTopics = [];
          if (catTitle === 'Digital Electronics') {
            sampleExtcTopics = ['Number Systems & Binary Logic', 'Logic Gates & Boolean Algebra', 'K-Maps & Minimization', 'Combinational Circuits (Multiplexers/Encoders)', 'Sequential Circuits (Flip-Flops & Latches)', 'Counters & Shift Registers', 'Digital IC Families & Logic Levels'];
          } else if (catTitle === 'Microprocessors & Microcontrollers') {
            sampleExtcTopics = ['8085 Microprocessor Architecture', '8086 Architecture & Memory Segmentation', '8051 Microcontroller Architecture', 'Assembly Language Programming', 'Timer and Interrupt Programming', 'Serial Communication (UART/SPI/I2C)'];
          } else if (catTitle === 'Embedded Systems') {
            sampleExtcTopics = ['Introduction to Embedded Systems', 'ARM Cortex Architecture', 'Embedded C Fundamentals', 'GPIO Interfacing', 'ADC and DAC Interfacing', 'Real-Time Operating Systems (RTOS)'];
          } else if (catTitle === 'Communication Systems') {
            sampleExtcTopics = ['Analog Modulation (AM/FM/PM)', 'Digital Modulation (ASK/FSK/PSK/QAM)', 'Sampling Theorem & Pulse Code Modulation (PCM)', 'Information Theory & Channel Capacity', 'Antennas & Wave Propagation', 'Optical Fiber Communication'];
          } else if (catTitle === 'C Programming') {
            sampleExtcTopics = ['C Basics & Syntax', 'Pointers & Memory Allocation', 'Bitwise Operations in Embedded C', 'Structures and Unions', 'File Handling & Data Structures in C'];
          }

          for (let j = 0; j < sampleExtcTopics.length; j++) {
            const topTitle = sampleExtcTopics[j];
            let top = await Topic.findOne({
              module: 'Domain',
              department: dept,
              categoryId: cat._id,
              title: topTitle
            });
            if (!top) {
              top = await Topic.create({
                module: 'Domain',
                department: dept,
                departmentId: dept,
                categoryId: cat._id,
                category: catTitle,
                title: topTitle,
                description: `Structured video lectures, schematics, conceptual notes, and core interview questions for ${topTitle}.`,
                order: j + 1,
                status: 'published',
                createdBy: adminId
              });
            }

            // Seed sample video and note for first topic of Digital Electronics and Embedded Systems
            if (j === 0 && (catTitle === 'Digital Electronics' || catTitle === 'Embedded Systems')) {
              const videoExists = await LearningContent.findOne({ topicId: top._id, resourceType: 'video' });
              if (!videoExists) {
                await LearningContent.create({
                  module: 'Domain',
                  department: dept,
                  departmentId: dept,
                  categoryId: cat._id,
                  category: catTitle,
                  topicId: top._id,
                  topic: topTitle,
                  title: `${topTitle} — Master Lecture`,
                  description: `Comprehensive video tutorial and circuit analysis covering fundamental concepts of ${topTitle}.`,
                  videoUrl: 'https://www.youtube.com/watch?v=0h5G9g0cE8w',
                  resourceUrl: 'https://www.youtube.com/watch?v=0h5G9g0cE8w',
                  resourceType: 'video',
                  contentType: 'video',
                  difficulty: 'Beginner',
                  status: 'published',
                  createdBy: adminId
                });
              }

              const noteExists = await LearningContent.findOne({ topicId: top._id, resourceType: 'note' });
              if (!noteExists) {
                await LearningContent.create({
                  module: 'Domain',
                  department: dept,
                  departmentId: dept,
                  categoryId: cat._id,
                  category: catTitle,
                  topicId: top._id,
                  topic: topTitle,
                  title: `${topTitle} Comprehensive Study Notes & Cheatsheet`,
                  description: `Verified departmental revision notes, logic tables, formula summaries, and standard interview problems.`,
                  pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                  resourceUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                  fileName: `${topTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-notes.pdf`,
                  fileSize: '1.4 MB',
                  resourceType: 'note',
                  contentType: 'note',
                  difficulty: 'Intermediate',
                  status: 'published',
                  createdBy: adminId
                });
              }
            }
          }
        }

        // Add sample topic for DBMS & SQL under IT and CSE
        if ((dept === 'IT' || dept === 'CSE') && catTitle === 'DBMS & SQL') {
          const sampleTopics = [
            'DBMS Fundamentals', 'SQL Basics', 'DDL / DML / DQL', 'Joins',
            'Subqueries', 'Aggregate Functions', 'Group By & Having', 'Views',
            'Indexing', 'Window Functions', 'SQL Interview Questions'
          ];
          for (let j = 0; j < sampleTopics.length; j++) {
            const topTitle = sampleTopics[j];
            const topExists = await Topic.findOne({
              module: 'Domain',
              department: dept,
              categoryId: cat._id,
              title: topTitle
            });
            if (!topExists) {
              await Topic.create({
                module: 'Domain',
                department: dept,
                departmentId: dept,
                categoryId: cat._id,
                category: catTitle,
                title: topTitle,
                description: `Structured lectures, concepts, queries, and interview notes for ${topTitle}.`,
                order: j + 1,
                status: 'published',
                createdBy: adminId
              });
            }
          }
        }
      }
    }
    console.log('[System Init]: Official Domain categories and topics verified.');

    // ==========================================
    // Bootstrapping Communication Categories & Default Topics
    // ==========================================
    const commCategoryDefs = [
      {
        title: 'Grammar',
        description: 'Comprehensive grammar rules, sentence structure, tenses, and usage for professional communication.',
        order: 1,
        topics: [
          { title: 'Parts of Speech', description: 'Nouns, verbs, adjectives, adverbs, pronouns, prepositions, conjunctions, and interjections.', order: 1 },
          { title: 'Tenses', description: 'Present, past, and future tenses with simple, continuous, perfect, and perfect continuous forms.', order: 2 },
          { title: 'Articles', description: 'Definite and indefinite articles (a, an, the) with rules and exceptions.', order: 3 },
          { title: 'Prepositions', description: 'Usage of prepositions of time, place, direction, and manner.', order: 4 },
          { title: 'Subject-Verb Agreement', description: 'Rules for matching subjects with correct verb forms in singular and plural.', order: 5 },
          { title: 'Active & Passive Voice', description: 'Conversion between active and passive voice across all tenses.', order: 6 },
          { title: 'Direct & Indirect Speech', description: 'Reporting speech with correct tense shifts, pronouns, and time expressions.', order: 7 },
          { title: 'Sentence Correction', description: 'Identifying and fixing common grammatical errors in sentences.', order: 8 }
        ]
      },
      {
        title: 'Vocabulary',
        description: 'Build a strong placement-ready vocabulary including synonyms, antonyms, idioms, and word usage.',
        order: 2,
        topics: [
          { title: 'Synonyms & Antonyms', description: 'Common synonym and antonym pairs used in placement exams and professional writing.', order: 1 },
          { title: 'One Word Substitution', description: 'Replacing descriptive phrases with precise single words for concise communication.', order: 2 },
          { title: 'Idioms & Phrases', description: 'Common English idioms, their meanings, and correct usage in context.', order: 3 },
          { title: 'Phrasal Verbs', description: 'Frequently used phrasal verbs with meanings and sentence examples.', order: 4 },
          { title: 'Commonly Confused Words', description: 'Homophones, near-homophones, and commonly misused word pairs.', order: 5 },
          { title: 'Word Formation', description: 'Prefixes, suffixes, roots, and word families for expanding vocabulary.', order: 6 },
          { title: 'Placement Vocabulary', description: 'High-frequency vocabulary words that appear in placement aptitude and GD/PI rounds.', order: 7 }
        ]
      },
      {
        title: 'Speaking',
        description: 'Develop confident spoken English skills for interviews, group discussions, and professional settings.',
        order: 3,
        topics: [
          { title: 'Self Introduction', description: 'Structuring and delivering a confident, professional self-introduction for interviews.', order: 1 },
          { title: 'Pronunciation', description: 'Correct pronunciation of common words, stress patterns, and phonetic awareness.', order: 2 },
          { title: 'Fluency', description: 'Techniques to improve spoken fluency, reduce hesitation, and build confidence.', order: 3 },
          { title: 'Group Discussion', description: 'GD skills including initiation, active listening, assertiveness, and summarizing.', order: 4 },
          { title: 'Public Speaking', description: 'Overcoming stage fright and delivering engaging speeches with structure.', order: 5 },
          { title: 'Presentation Skills', description: 'Preparing and delivering effective presentations with clarity and confidence.', order: 6 },
          { title: 'Interview Speaking', description: 'Answering HR and technical interview questions with clarity, examples, and confidence.', order: 7 }
        ]
      },
      {
        title: 'Listening',
        description: 'Improve listening comprehension, accent understanding, and active listening for professional contexts.',
        order: 4,
        topics: [
          { title: 'Listening Fundamentals', description: 'Types of listening, barriers to effective listening, and active listening techniques.', order: 1 },
          { title: 'Listening Comprehension', description: 'Understanding spoken passages, grasping main ideas, and answering comprehension questions.', order: 2 },
          { title: 'Conversation Practice', description: 'Real-life dialogue exercises for everyday and professional conversation scenarios.', order: 3 },
          { title: 'Accent Understanding', description: 'Exposure to Indian, British, and American accents for improved comprehension.', order: 4 },
          { title: 'Interview Listening', description: 'Carefully understanding interview questions to provide relevant, precise answers.', order: 5 }
        ]
      },
      {
        title: 'Business Communication',
        description: 'Professional corporate communication skills for email writing, meetings, presentations, and workplace interactions.',
        order: 5,
        topics: [
          { title: 'Professional Email Writing', description: 'Structure, tone, and etiquette for writing formal and professional emails.', order: 1 },
          { title: 'Formal Communication', description: 'Written and spoken formal communication including letters, memos, and notices.', order: 2 },
          { title: 'Workplace Communication', description: 'Effective communication with peers, managers, and clients in a professional environment.', order: 3 },
          { title: 'Meeting & Discussion Skills', description: 'Participating in and leading productive meetings with structured agendas and minutes.', order: 4 },
          { title: 'Presentation Skills', description: 'Corporate presentation techniques using structured content and visual aids.', order: 5 },
          { title: 'Telephone & Online Communication', description: 'Professional phone etiquette, video call conduct, and remote communication best practices.', order: 6 },
          { title: 'Corporate Etiquette', description: 'Workplace norms, professional conduct, email etiquette, and business networking skills.', order: 7 }
        ]
      }
    ];

    console.log('[System Init]: Checking & initializing Communication categories and default topics...');
    for (const catDef of commCategoryDefs) {
      let cat = await Category.findOne({ module: 'Communication', title: catDef.title });
      if (!cat) {
        cat = await Category.create({
          module: 'Communication',
          department: null,
          departmentId: null,
          title: catDef.title,
          description: catDef.description,
          order: catDef.order,
          status: 'published',
          createdBy: adminId
        });
      }

      for (const topDef of catDef.topics) {
        const topExists = await Topic.findOne({ module: 'Communication', categoryId: cat._id, title: topDef.title });
        if (!topExists) {
          await Topic.create({
            module: 'Communication',
            department: null,
            departmentId: null,
            categoryId: cat._id,
            category: catDef.title,
            title: topDef.title,
            description: topDef.description,
            order: topDef.order,
            status: 'published',
            createdBy: adminId
          });
        }
      }
    }
    console.log('[System Init]: Communication categories and default topics verified.');

    // ==========================================
    // Bootstrapping Resume Categories & Default Topics
    // ==========================================
    const resumeCategoryDefs = [
      {
        title: 'Resume Building',
        description: 'Step-by-step guidance on crafting a high-impact, professional resume from scratch.',
        order: 1,
        topics: [
          { title: 'Resume Fundamentals', description: 'Core principles of effective resumes, purpose, target audience, and standard layouts.', order: 1 },
          { title: 'Resume Structure', description: 'Essential structural components, section ordering, hierarchy, and visual balance.', order: 2 },
          { title: 'Career Objective / Professional Summary', description: 'Writing compelling objective statements and executive summaries tailored to your profile.', order: 3 },
          { title: 'Education Section', description: 'Presenting academic credentials, degrees, coursework, GPAs, and institutional details.', order: 4 },
          { title: 'Skills Section', description: 'Categorizing technical, core engineering, programming, and interpersonal soft skills effectively.', order: 5 },
          { title: 'Experience & Internship', description: 'Action-verb bullet points, quantifiable achievements, and work experience descriptions.', order: 6 },
          { title: 'Projects Section', description: 'Framing academic, capstone, and personal projects with tools, role, and measurable impact.', order: 7 },
          { title: 'Achievements & Certifications', description: 'Highlighting competitive rankings, hackathons, verified credentials, and awards.', order: 8 },
          { title: 'Extra-Curricular Activities', description: 'Leadership roles, student clubs, volunteering, and personality indicators.', order: 9 },
          { title: 'Resume Mistakes to Avoid', description: 'Common red flags, grammatical pitfalls, formatting errors, and generic phrasing.', order: 10 },
          { title: 'Final Resume Review', description: 'Pre-submission checklist, peer-review strategies, proofreading, and quality benchmarks.', order: 11 }
        ]
      },
      {
        title: 'ATS Resume',
        description: 'Optimizing resumes for Applicant Tracking Systems (ATS) to maximize interview shortlist rates.',
        order: 2,
        topics: [
          { title: 'What is ATS?', description: 'How recruitment algorithms and ATS parsers scan, rank, and filter incoming applications.', order: 1 },
          { title: 'ATS-Friendly Resume Format', description: 'Single-column layouts, clean font choices, standard headings, and parser-safe structures.', order: 2 },
          { title: 'Keywords & Job Description', description: 'Extracting essential keywords, hard skills, and qualifiers from job postings.', order: 3 },
          { title: 'Resume Keyword Optimization', description: 'Contextual keyword insertion without keyword stuffing for higher match scores.', order: 4 },
          { title: 'ATS Score Improvement', description: 'Practical techniques to boost match scores on platforms like Jobscan and enterprise ATS.', order: 5 },
          { title: 'Job Description Analysis', description: 'Deconstructing role descriptions to tailor specific resume versions per opportunity.', order: 6 },
          { title: 'ATS Formatting Rules', description: 'File formats (PDF vs DOCX), table/column avoidances, header/footer parsing rules.', order: 7 },
          { title: 'Common ATS Mistakes', description: 'Complex graphics, text boxes, uncommon symbols, and parsing blockers.', order: 8 }
        ]
      },
      {
        title: 'Projects',
        description: 'Mastering project selection, technical documentation, and high-impact presentation on resumes.',
        order: 3,
        topics: [
          { title: 'How to Select a Project', description: 'Choosing industry-relevant, domain-aligned, and problem-solving project topics.', order: 1 },
          { title: 'Project Title & Description', description: 'Crafting clear, concise, and professional project titles and problem statements.', order: 2 },
          { title: 'How to Explain Your Project', description: 'The STAR approach (Situation, Task, Action, Result) for describing projects.', order: 3 },
          { title: 'Technical Skills in Projects', description: 'Mapping programming languages, frameworks, hardware tools, and libraries to projects.', order: 4 },
          { title: 'Project Responsibilities', description: 'Articulating individual contributions in team vs solo project initiatives.', order: 5 },
          { title: 'Project Challenges & Solutions', description: 'Highlighting architectural roadblocks, debugging hurdles, and creative solutions.', order: 6 },
          { title: 'Project Results & Impact', description: 'Quantifying outcomes: performance gains, accuracy metrics, user engagement, or cost savings.', order: 7 },
          { title: 'Final-Year Project Presentation', description: 'Documenting major capstone engineering/management projects effectively for recruiters.', order: 8 },
          { title: 'Project Section for Resume', description: 'Formatting guidelines, GitHub links, live demo URLs, and bullet point counts.', order: 9 }
        ]
      },
      {
        title: 'Resume Examples',
        description: 'Curated, placement-tested resume samples across freshers, engineering domains, IT, and management.',
        order: 4,
        topics: [
          { title: 'Fresher Resume', description: 'Complete verified template and guidelines for graduating students with limited experience.', order: 1 },
          { title: 'Software Developer Resume', description: 'Specialized example focusing on DSA, backend/frontend stacks, system design, and competitive coding.', order: 2 },
          { title: 'Core Engineering Resume', description: 'Templates tailored for Mechanical, Civil, and EXTC engineering profiles.', order: 3 },
          { title: 'Data & AI Resume', description: 'Samples emphasizing machine learning, statistics, data pipelines, SQL, and Python.', order: 4 },
          { title: 'IT Resume', description: 'Targeted examples for Information Technology roles including Cloud, DevOps, and Full-Stack.', order: 5 },
          { title: 'MBA Resume', description: 'Management profiles emphasizing leadership, ROI impact, analytics, and business case studies.', order: 6 },
          { title: 'MCA Resume', description: 'Computer Applications profiles highlighting software architecture and database design.', order: 7 },
          { title: 'Internship Resume', description: 'Compact templates optimized for undergraduate summer/winter internship applications.', order: 8 },
          { title: 'One-Page Resume', description: 'High-density, single-page layout maximizing space efficiency and readability.', order: 9 },
          { title: 'Role-Specific Resume Examples', description: 'Specialized resumes for QA/Testing, Cybersecurity, UI/UX, and IoT engineering.', order: 10 }
        ]
      }
    ];

    console.log('[System Init]: Checking & initializing Resume categories and default topics...');
    for (const catDef of resumeCategoryDefs) {
      let cat = await Category.findOne({ module: 'Resume', title: catDef.title });
      if (!cat) {
        cat = await Category.create({
          module: 'Resume',
          department: null,
          departmentId: null,
          title: catDef.title,
          description: catDef.description,
          order: catDef.order,
          status: 'published',
          createdBy: adminId
        });
      }

      for (const topDef of catDef.topics) {
        const topExists = await Topic.findOne({ module: 'Resume', categoryId: cat._id, title: topDef.title });
        if (!topExists) {
          await Topic.create({
            module: 'Resume',
            department: null,
            departmentId: null,
            categoryId: cat._id,
            category: catDef.title,
            title: topDef.title,
            description: topDef.description,
            order: topDef.order,
            status: 'published',
            createdBy: adminId
          });
        }
      }
    }
    console.log('[System Init]: Resume categories and default topics verified.');

    // ==========================================
    // Bootstrapping Interview Preparation Categories & Default Topics
    // ==========================================
    const interviewCategoryDefs = [
      {
        title: 'HR Interview',
        description: 'Master essential HR questions, self-introductions, career ambitions, and behavioral evaluation criteria.',
        order: 1,
        topics: [
          { title: 'Tell Me About Yourself', description: 'Structuring and delivering an engaging, professional self-pitch for HR interviews.', order: 1 },
          { title: 'Self Introduction', description: 'Clear personal introductions highlighting achievements, education, and career orientation.', order: 2 },
          { title: 'Strengths & Weaknesses', description: 'Articulating genuine strengths with examples and framing weaknesses constructively.', order: 3 },
          { title: 'Career Goals', description: 'Short-term and long-term career aspirations aligned with organizational growth.', order: 4 },
          { title: 'Why Should We Hire You?', description: 'Synthesizing skills, cultural fit, work ethic, and distinct value proposition.', order: 5 },
          { title: 'Why This Company?', description: 'Demonstrating company research, mission alignment, and enthusiasm for the organization.', order: 6 },
          { title: 'Why Should We Select You?', description: 'Standing out among candidate pools with problem-solving acumen and adaptability.', order: 7 },
          { title: 'Relocation & Work Preferences', description: 'Addressing shift timings, location flexibility, travel willingness, and team settings.', order: 8 },
          { title: 'Salary Expectations', description: 'Professional negotiation techniques, standard compensation ranges, and diplomatic responses.', order: 9 },
          { title: 'Handling Difficult HR Questions', description: 'Navigating gap years, backlogs, stressful scenarios, and sensitive background queries.', order: 10 },
          { title: 'Frequently Asked HR Questions', description: 'Comprehensive question bank covering standard HR rounds across top recruiters.', order: 11 }
        ]
      },
      {
        title: 'Technical Interview',
        description: 'Core programming, database, data structures, and engineering problem-solving questions for technical rounds.',
        order: 2,
        topics: [
          { title: 'Technical Self Introduction', description: 'Introducing your technical domain, coding stack, toolchain expertise, and key projects.', order: 1 },
          { title: 'Resume-Based Questions', description: 'Defending technical claims, coursework, certifications, and technologies listed on your resume.', order: 2 },
          { title: 'Programming Questions', description: 'Syntax fundamentals, control structures, memory allocation, and debugging in C++, Java, or Python.', order: 3 },
          { title: 'OOP Questions', description: 'Encapsulation, inheritance, polymorphism, abstraction, design patterns, and SOLID principles.', order: 4 },
          { title: 'DBMS & SQL Questions', description: 'Normalization, ACID properties, indexing, joins, aggregate queries, and transaction management.', order: 5 },
          { title: 'DSA Interview Questions', description: 'Arrays, linked lists, trees, graphs, time/space complexity, searching, and sorting algorithms.', order: 6 },
          { title: 'Project-Based Questions', description: 'Explaining system architecture, challenges, trade-offs, and technologies in personal projects.', order: 7 },
          { title: 'Internship-Based Questions', description: 'Discussing real-world project deliverables, team collaboration, and industry exposure.', order: 8 },
          { title: 'Problem Solving Approach', description: 'Structured whiteboarding, edge-case analysis, optimization techniques, and dry-running code.', order: 9 },
          { title: 'Role-Based Technical Questions', description: 'Questions tailored for frontend, backend, fullstack, QA, cloud, and core engineering tracks.', order: 10 },
          { title: 'Frequently Asked Technical Questions', description: 'Top placement questions asked by tier-1 and service-based technology employers.', order: 11 }
        ]
      },
      {
        title: 'Behavioral Questions',
        description: 'STAR-method grounded responses for teamwork, leadership, conflict resolution, and situational challenges.',
        order: 3,
        topics: [
          { title: 'STAR Method', description: 'The Situation, Task, Action, Result framework for structured storytelling in interviews.', order: 1 },
          { title: 'Leadership Questions', description: 'Demonstrating initiative, mentoring peers, taking ownership, and driving outcomes.', order: 2 },
          { title: 'Teamwork Questions', description: 'Cross-functional collaboration, active listening, and contributing to group deliverables.', order: 3 },
          { title: 'Conflict Resolution', description: 'Managing disagreements professionally, de-escalating tension, and finding common ground.', order: 4 },
          { title: 'Failure & Learning', description: 'Discussing mistakes transparently, extracting key lessons, and demonstrating resilience.', order: 5 },
          { title: 'Adaptability', description: 'Handling shifting project scopes, new technologies, tight deadlines, and changing environments.', order: 6 },
          { title: 'Problem Solving', description: 'Analyzing ambiguous workplace challenges and arriving at practical, logical resolutions.', order: 7 },
          { title: 'Time Management', description: 'Prioritization matrices, handling competing deadlines, and avoiding project bottlenecks.', order: 8 },
          { title: 'Decision Making', description: 'Data-driven decision making, weighing trade-offs, and taking calculated risks.', order: 9 },
          { title: 'Communication Challenges', description: 'Overcoming miscommunications, client escalations, and cross-cultural barriers.', order: 10 },
          { title: 'Situational Questions', description: 'Hypothetical workplace scenarios and evaluating ethical and professional judgment.', order: 11 }
        ]
      },
      {
        title: 'Company Preparation',
        description: 'Company-specific recruitment patterns, interview roadmaps, and preparation resources for top hiring partners.',
        order: 4,
        topics: [] // Managed via Company collection
      },
      {
        title: 'Mock Interview',
        description: 'Comprehensive video lectures, breakdown sessions, and preparation notes simulating live interview rounds.',
        order: 5,
        topics: [
          { title: 'HR Mock Interview', description: 'Simulated HR interview session with analysis of candidate answers and body language.', order: 1 },
          { title: 'Technical Mock Interview', description: 'Live coding and technical conceptual interview simulation with question breakdown.', order: 2 },
          { title: 'Behavioral Mock Interview', description: 'STAR method mock session evaluating behavioral, leadership, and situational responses.', order: 3 },
          { title: 'Resume-Based Mock Interview', description: 'Deep-dive cross-questioning simulation based on typical engineering resumes.', order: 4 },
          { title: 'Project-Based Mock Interview', description: 'Live project defense simulation focusing on architecture, edge cases, and code walkthroughs.', order: 5 },
          { title: 'Fresher Mock Interview', description: 'Holistic mock interview simulation designed specifically for graduating college freshers.', order: 6 },
          { title: 'IT/Software Mock Interview', description: 'Software engineering interview simulation spanning algorithms, web systems, and databases.', order: 7 },
          { title: 'Core Engineering Mock Interview', description: 'Technical mock session tailored for Mechanical, Civil, and EXTC engineering candidates.', order: 8 },
          { title: 'MBA Mock Interview', description: 'Management simulation covering business case studies, market analysis, and leadership.', order: 9 },
          { title: 'Final Interview Simulation', description: 'Comprehensive multi-round final placement interview simulation and feedback rubric.', order: 10 }
        ]
      }
    ];

    console.log('[System Init]: Checking & initializing Interview Preparation categories and default topics...');
    for (const catDef of interviewCategoryDefs) {
      let cat = await Category.findOne({
        module: { $in: ['Interview Preparation', 'Interview'] },
        title: catDef.title
      });
      if (!cat) {
        cat = await Category.create({
          module: 'Interview Preparation',
          department: null,
          departmentId: null,
          title: catDef.title,
          description: catDef.description,
          order: catDef.order,
          status: 'published',
          createdBy: adminId
        });
      }

      for (const topDef of catDef.topics) {
        const topExists = await Topic.findOne({
          module: { $in: ['Interview Preparation', 'Interview'] },
          categoryId: cat._id,
          title: topDef.title
        });
        if (!topExists) {
          await Topic.create({
            module: 'Interview Preparation',
            department: null,
            departmentId: null,
            categoryId: cat._id,
            category: catDef.title,
            title: topDef.title,
            description: topDef.description,
            order: topDef.order,
            status: 'published',
            createdBy: adminId
          });
        }
      }
    }
    console.log('[System Init]: Interview Preparation categories and default topics verified.');

    // ==========================================
    // Bootstrapping Initial Companies for Company Preparation
    // ==========================================
    const defaultCompanies = [
      { name: 'TCS', description: 'Tata Consultancy Services - NQT, Digital, and Prime hiring preparation.', order: 1 },
      { name: 'Infosys', description: 'Infosys - InfyTQ, HackWithInfy, and Specialist Programmer interview preparation.', order: 2 },
      { name: 'Cognizant', description: 'Cognizant - GenC, GenC Elevate, and GenC Next hiring curriculum.', order: 3 },
      { name: 'Accenture', description: 'Accenture - Associate Software Engineer (ASE) & Advanced ASE preparation.', order: 4 },
      { name: 'Wipro', description: 'Wipro - Elite NTH and Turbo recruitment tracks and interview rounds.', order: 5 },
      { name: 'Capgemini', description: 'Capgemini - Exceller test pattern, technical evaluation, and HR preparation.', order: 6 },
      { name: 'Deloitte', description: 'Deloitte - USI & India consulting, tech analyst, and business interview roadmap.', order: 7 },
      { name: 'HCLTech', description: 'HCLTech - First Career and engineering recruitment interview preparation.', order: 8 },
      { name: 'Tech Mahindra', description: 'Tech Mahindra - Technical, psychometric, and HR placement rounds.', order: 9 },
      { name: 'LTIMindtree', description: 'LTIMindtree - Spark, Campus, and specialized tech interview curriculum.', order: 10 }
    ];

    const standardCompanyTopics = [
      { title: 'Company Overview', description: 'History, leadership, core business domains, values, culture, and recent achievements.', order: 1 },
      { title: 'Hiring Process', description: 'Step-by-step recruitment stages, timeline, test formats, and candidate expectations.', order: 2 },
      { title: 'Eligibility & Selection Process', description: 'Academic cutoffs, backlogs policy, selection criteria, and qualification thresholds.', order: 3 },
      { title: 'Aptitude/Assessment Preparation', description: 'Online test syllabus, cognitive assessment questions, sectional timing, and practice drills.', order: 4 },
      { title: 'Technical Interview', description: 'Company-specific technical questions, coding problems, tech stack queries, and project defense.', order: 5 },
      { title: 'HR Interview', description: 'Company-focused HR evaluation, cultural fitment questions, and standard behavioral scenarios.', order: 6 },
      { title: 'Frequently Asked Questions', description: 'Curated repository of past interview experiences and repeated candidate questions.', order: 7 },
      { title: 'Interview Tips', description: 'Expert guidance, dos and don’ts, mindset strategies, and key tips for final round success.', order: 8 }
    ];

    console.log('[System Init]: Checking & initializing default Company Preparation companies...');
    const companyCat = await Category.findOne({
      module: { $in: ['Interview Preparation', 'Interview'] },
      title: 'Company Preparation'
    });

    for (const compDef of defaultCompanies) {
      let comp = await Company.findOne({ name: compDef.name });
      if (!comp) {
        comp = await Company.create({
          name: compDef.name,
          description: compDef.description,
          order: compDef.order,
          status: 'published',
          createdBy: adminId
        });
      }

      // Seed standard 8 topics for this company
      for (const topDef of standardCompanyTopics) {
        const topExists = await Topic.findOne({
          module: { $in: ['Interview Preparation', 'Interview'] },
          companyId: comp._id,
          title: topDef.title
        });
        if (!topExists) {
          await Topic.create({
            module: 'Interview Preparation',
            category: 'Company Preparation',
            categoryId: companyCat ? companyCat._id : null,
            companyId: comp._id,
            company: comp.name,
            department: null,
            departmentId: null,
            title: topDef.title,
            description: `${comp.name} ${topDef.description}`,
            order: topDef.order,
            status: 'published',
            createdBy: adminId
          });
        }
      }
    }
    console.log('[System Init]: Company Preparation companies and default topics verified.');

    // Safe migration: Link any existing LearningContent without topicId to matching Topic or default Topic
    const unlinkedContents = await LearningContent.find({
      module: { $in: ['Aptitude', 'Resume', 'Communication', 'Interview Preparation', 'Interview'] },
      $or: [{ topicId: { $exists: false } }, { topicId: null }]
    });

    if (unlinkedContents.length > 0) {
      console.log(`[System Init]: Migrating ${unlinkedContents.length} unlinked learning resources to topics...`);
      for (const item of unlinkedContents) {
        let matchingTopic = null;
        if (item.topic) {
          matchingTopic = await Topic.findOne({
            module: { $in: [item.module, 'Interview Preparation', 'Interview'] },
            title: { $regex: new RegExp(`^${item.topic.trim()}$`, 'i') }
          });
        }
        if (!matchingTopic && item.category) {
          matchingTopic = await Topic.findOne({
            module: { $in: [item.module, 'Interview Preparation', 'Interview'] },
            category: item.category
          });
        }
        if (matchingTopic) {
          item.topicId = matchingTopic._id;
          item.topic = matchingTopic.title;
          if (matchingTopic.categoryId) item.categoryId = matchingTopic.categoryId;
          if (matchingTopic.companyId) item.companyId = matchingTopic.companyId;
          if (matchingTopic.company) item.company = matchingTopic.company;
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

