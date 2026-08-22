const { GoogleGenAI } = require('@google/genai');

const COMPETENCIES = [
  'Communication',
  'Teamwork',
  'Leadership',
  'Adaptability',
  'Emotional Intelligence',
  'Problem Solving',
  'Initiative',
  'Time Management',
  'Resilience',
  'Professionalism'
];

const QUESTION_TYPES = [
  'LIKERT',
  'FREQUENCY',
  'SITUATIONAL_JUDGMENT',
  'FORCED_CHOICE',
  'RANKING',
  'SELF_ASSESSMENT',
  'SCENARIO_BASED'
];

// Base format weight distribution for dynamic question count calculation
const FORMAT_RATIOS = {
  LIKERT: 0.30,
  FREQUENCY: 0.16,
  SITUATIONAL_JUDGMENT: 0.16,
  FORCED_CHOICE: 0.12,
  RANKING: 0.10,
  SCENARIO_BASED: 0.08,
  SELF_ASSESSMENT: 0.08
};

/**
 * Dynamically calculate Question Type Distribution for ANY question count from 1 to 50.
 * Guarantees the sum of type counts strictly equals totalCount.
 */
function computeQuestionTypeDistribution(totalCount = 50) {
  const count = Math.max(1, Math.min(50, Math.round(Number(totalCount) || 50)));

  // Clean hand-tuned presets for canonical examples
  if (count === 1) return { LIKERT: 1 };
  if (count === 2) return { LIKERT: 1, SITUATIONAL_JUDGMENT: 1 };
  if (count === 3) return { LIKERT: 1, FREQUENCY: 1, SITUATIONAL_JUDGMENT: 1 };
  if (count === 4) return { LIKERT: 2, FREQUENCY: 1, SITUATIONAL_JUDGMENT: 1 };
  if (count === 5) return { LIKERT: 2, FREQUENCY: 1, SITUATIONAL_JUDGMENT: 1, FORCED_CHOICE: 1 };
  if (count === 10) {
    return {
      LIKERT: 3,
      FREQUENCY: 2,
      SITUATIONAL_JUDGMENT: 2,
      FORCED_CHOICE: 1,
      RANKING: 1,
      SCENARIO_BASED: 1
    };
  }
  if (count === 20) {
    return {
      LIKERT: 6,
      FREQUENCY: 3,
      SITUATIONAL_JUDGMENT: 3,
      FORCED_CHOICE: 3,
      RANKING: 2,
      SCENARIO_BASED: 3
    };
  }
  if (count === 25) {
    return {
      LIKERT: 7,
      FREQUENCY: 4,
      SITUATIONAL_JUDGMENT: 4,
      FORCED_CHOICE: 4,
      RANKING: 3,
      SCENARIO_BASED: 3
    };
  }
  if (count === 50) {
    return {
      LIKERT: 15,
      FREQUENCY: 8,
      SITUATIONAL_JUDGMENT: 8,
      FORCED_CHOICE: 6,
      RANKING: 5,
      SELF_ASSESSMENT: 4,
      SCENARIO_BASED: 4
    };
  }

  // Generalized Largest Remainder Method (Hare-Niemeyer) for any N (1 to 50)
  const types = Object.keys(FORMAT_RATIOS);
  const allocations = {};
  const remainders = [];
  let allocatedSum = 0;

  types.forEach((type) => {
    const raw = count * FORMAT_RATIOS[type];
    const floorVal = Math.floor(raw);
    allocations[type] = floorVal;
    allocatedSum += floorVal;
    remainders.push({ type, remainder: raw - floorVal });
  });

  remainders.sort((a, b) => b.remainder - a.remainder);

  let deficit = count - allocatedSum;
  let idx = 0;
  while (deficit > 0 && idx < remainders.length) {
    allocations[remainders[idx].type] += 1;
    deficit -= 1;
    idx += 1;
  }

  // Filter out 0 count types for clean display
  const result = {};
  Object.keys(allocations).forEach((k) => {
    if (allocations[k] > 0) result[k] = allocations[k];
  });

  return result;
}

/**
 * Dynamically calculate Competency Distribution for ANY question count (1 to 50)
 * across selected competencies.
 */
function computeCompetencyDistribution(totalCount = 50, selectedCompetencies = COMPETENCIES) {
  const count = Math.max(1, Math.min(50, Math.round(Number(totalCount) || 50)));
  const comps = Array.isArray(selectedCompetencies) && selectedCompetencies.length > 0
    ? selectedCompetencies
    : COMPETENCIES;

  const k = comps.length;
  const base = Math.floor(count / k);
  let remainder = count % k;

  const distribution = {};
  comps.forEach((comp, idx) => {
    distribution[comp] = base + (idx < remainder ? 1 : 0);
  });

  return distribution;
}


/**
 * Standard 50-Item Calibrated Question Bank for reliable instant generation & fallback
 */
const CALIBRATED_50_QUESTIONS = [
  // 1. Communication (5 questions)
  {
    questionId: 'Q01',
    questionType: 'LIKERT',
    competency: 'Communication',
    trait: 'Clarity & Articulation',
    questionText: 'I structure complex technical explanations into step-by-step concepts that non-technical stakeholders easily comprehend.',
    options: [
      { text: 'Strongly Disagree', score: 1 },
      { text: 'Disagree', score: 2 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 4 },
      { text: 'Strongly Agree', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q02',
    questionType: 'FREQUENCY',
    competency: 'Communication',
    trait: 'Active Listening',
    questionText: 'When participating in discussions, how frequently do you summarize other people’s viewpoints before presenting your own?',
    options: [
      { text: 'Never', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes', score: 3 },
      { text: 'Often', score: 4 },
      { text: 'Always', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q03',
    questionType: 'SITUATIONAL_JUDGMENT',
    competency: 'Communication',
    trait: 'Conflict De-escalation',
    questionText: 'A project partner disagrees publicly with your proposed architectural plan during a review meeting. What is your initial approach?',
    options: [
      { text: 'Acknowledge their perspective objectively and propose comparing pros and cons with benchmark data.', score: 5 },
      { text: 'Ask the faculty or team lead to make an immediate binding decision.', score: 3 },
      { text: 'Defend your original proposal firmly to ensure the team does not lose momentum.', score: 2 },
      { text: 'Drop your proposal immediately to avoid interpersonal conflict.', score: 1 }
    ],
    reverseScored: false,
    weight: 1.2
  },
  {
    questionId: 'Q04',
    questionType: 'FORCED_CHOICE',
    competency: 'Communication',
    trait: 'Expression Preference',
    questionText: 'Select the statement that more accurately reflects your natural communication style under pressure:',
    options: [
      { text: 'Statement A: I prioritize brevity and structured bullet points to prevent ambiguity.', value: 'A', score: 5 },
      { text: 'Statement B: I provide detailed comprehensive context to ensure no nuance is overlooked.', value: 'B', score: 4 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q05',
    questionType: 'SELF_ASSESSMENT',
    competency: 'Communication',
    trait: 'Presentation Confidence',
    questionText: 'How would you rate your ability to deliver a persuasive presentation to an unfamiliar corporate panel?',
    options: [
      { text: 'Emerging (Need extensive notes and rehearsal)', score: 2 },
      { text: 'Developing (Comfortable with familiar topics)', score: 3 },
      { text: 'Proficient (Confident with structured Q&A)', score: 4 },
      { text: 'Mastery (Persuasive, engaging, and highly articulate)', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },

  // 2. Teamwork (5 questions)
  {
    questionId: 'Q06',
    questionType: 'LIKERT',
    competency: 'Teamwork',
    trait: 'Cross-functional Collaboration',
    questionText: 'I willingly take on supporting tasks that may not be directly credited if they help the entire team meet its milestone.',
    options: [
      { text: 'Strongly Disagree', score: 1 },
      { text: 'Disagree', score: 2 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 4 },
      { text: 'Strongly Agree', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q07',
    questionType: 'FREQUENCY',
    competency: 'Teamwork',
    trait: 'Peer Assistance',
    questionText: 'How often do you proactively check in on teammates who appear stuck or overloaded with deliverables?',
    options: [
      { text: 'Never', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes', score: 3 },
      { text: 'Often', score: 4 },
      { text: 'Always', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q08',
    questionType: 'SITUATIONAL_JUDGMENT',
    competency: 'Teamwork',
    trait: 'Accountability & Alignment',
    questionText: 'A teammate consistently misses milestone check-ins, jeopardizing the final sprint submission. What do you do?',
    options: [
      { text: 'Schedule a 1-on-1 to understand their blockers and re-align sub-tasks collaboratively.', score: 5 },
      { text: 'Redistribute their pending workload among remaining members without discussion.', score: 3 },
      { text: 'Immediately report their delinquency to the supervisor or instructor.', score: 2 },
      { text: 'Wait until the deadline passes and let the evaluation reflect individual contribution.', score: 1 }
    ],
    reverseScored: false,
    weight: 1.2
  },
  {
    questionId: 'Q09',
    questionType: 'RANKING',
    competency: 'Teamwork',
    trait: 'Team Values',
    questionText: 'Rank these team dynamics in order of importance for achieving high-impact results (Top to Bottom):',
    options: [
      { text: 'Psychological safety and open feedback', score: 5 },
      { text: 'Clear division of responsibilities and KPIs', score: 4 },
      { text: 'Shared vision and technical alignment', score: 4 },
      { text: 'Rapid speed of individual execution', score: 3 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q10',
    questionType: 'LIKERT',
    competency: 'Teamwork',
    trait: 'Individual Isolation (Reverse)',
    questionText: 'I prefer working completely in isolation and find team synchronization meetings counterproductive.',
    options: [
      { text: 'Strongly Disagree', score: 5 },
      { text: 'Disagree', score: 4 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 2 },
      { text: 'Strongly Agree', score: 1 }
    ],
    reverseScored: true,
    weight: 1
  },

  // 3. Leadership (5 questions)
  {
    questionId: 'Q11',
    questionType: 'LIKERT',
    competency: 'Leadership',
    trait: 'Ownership in Ambiguity',
    questionText: 'When project guidelines are ambiguous, I naturally step forward to establish structure and facilitate direction.',
    options: [
      { text: 'Strongly Disagree', score: 1 },
      { text: 'Disagree', score: 2 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 4 },
      { text: 'Strongly Agree', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q12',
    questionType: 'FREQUENCY',
    competency: 'Leadership',
    trait: 'Inspiring Peers',
    questionText: 'How often do you encourage colleagues to take on stretch challenges that develop their skills?',
    options: [
      { text: 'Never', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes', score: 3 },
      { text: 'Often', score: 4 },
      { text: 'Always', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q13',
    questionType: 'SCENARIO_BASED',
    competency: 'Leadership',
    trait: 'Decisiveness under Uncertainty',
    scenario: 'Your capstone team is 48 hours away from a major deployment, and a debate erupts between two equally plausible technical architectures.',
    questionText: 'As a team member seeking to lead the group forward, what is your recommended course of action?',
    options: [
      { text: 'Synthesize a quick decision matrix focused on time-to-deliver and risk, then facilitate a consensus vote.', score: 5 },
      { text: 'Implement both options partially and see which works best on the day of presentation.', score: 2 },
      { text: 'Extend the research phase and request an extension from the evaluating committee.', score: 2 },
      { text: 'Let the most senior coder make the unilateral decision without team discussion.', score: 3 }
    ],
    reverseScored: false,
    weight: 1.2
  },
  {
    questionId: 'Q14',
    questionType: 'FORCED_CHOICE',
    competency: 'Leadership',
    trait: 'Leadership Style',
    questionText: 'Which leadership philosophy aligns more closely with your approach?',
    options: [
      { text: 'Statement A: Servant leadership — removing obstacles and empowering peers to shine.', value: 'A', score: 5 },
      { text: 'Statement B: Directional leadership — setting strict milestones and driving standard processes.', value: 'B', score: 4 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q15',
    questionType: 'LIKERT',
    competency: 'Leadership',
    trait: 'Hesitation to Guide (Reverse)',
    questionText: 'I hesitate to offer direction even when I notice our team is drifting off track.',
    options: [
      { text: 'Strongly Disagree', score: 5 },
      { text: 'Disagree', score: 4 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 2 },
      { text: 'Strongly Agree', score: 1 }
    ],
    reverseScored: true,
    weight: 1
  },

  // 4. Adaptability (5 questions)
  {
    questionId: 'Q16',
    questionType: 'LIKERT',
    competency: 'Adaptability',
    trait: 'Technology Pivot',
    questionText: 'I get excited rather than frustrated when asked to learn and apply an unfamiliar tool or programming stack on short notice.',
    options: [
      { text: 'Strongly Disagree', score: 1 },
      { text: 'Disagree', score: 2 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 4 },
      { text: 'Strongly Agree', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q17',
    questionType: 'FREQUENCY',
    competency: 'Adaptability',
    trait: 'Comfort with Ambiguity',
    questionText: 'How often do you adjust your work plans smoothly when organizational or project priorities change suddenly?',
    options: [
      { text: 'Never', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes', score: 3 },
      { text: 'Often', score: 4 },
      { text: 'Always', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q18',
    questionType: 'SITUATIONAL_JUDGMENT',
    competency: 'Adaptability',
    trait: 'Requirement Shifts',
    questionText: 'Midway through an engineering project, the client changes the core functional requirement by 40%. How do you respond?',
    options: [
      { text: 'Analyze reusable components, reprioritize the backlog with the team, and establish a realistic revised timeline.', score: 5 },
      { text: 'Express dissatisfaction with the scope creep but begrudgingly attempt all work without plan modifications.', score: 2 },
      { text: 'Insist on submitting the old requirement because work had already started.', score: 1 },
      { text: 'Immediately abandon all existing code and restart from scratch with no analysis.', score: 2 }
    ],
    reverseScored: false,
    weight: 1.2
  },
  {
    questionId: 'Q19',
    questionType: 'SELF_ASSESSMENT',
    competency: 'Adaptability',
    trait: 'Agile Mindset',
    questionText: 'How would you rate your agility in assimilating feedback from critical code reviews and pivoting your approach?',
    options: [
      { text: 'Emerging (Feel defensive or overwhelmed initially)', score: 2 },
      { text: 'Developing (Accept feedback after reflection)', score: 3 },
      { text: 'Proficient (Rapidly integrate feedback into iterations)', score: 4 },
      { text: 'Mastery (Actively seek out critiques to rapidly elevate quality)', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q20',
    questionType: 'LIKERT',
    competency: 'Adaptability',
    trait: 'Resistance to Change (Reverse)',
    questionText: 'I feel uncomfortable when standard routines are altered and prefer rigid predefined processes.',
    options: [
      { text: 'Strongly Disagree', score: 5 },
      { text: 'Disagree', score: 4 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 2 },
      { text: 'Strongly Agree', score: 1 }
    ],
    reverseScored: true,
    weight: 1
  },

  // 5. Emotional Intelligence (5 questions)
  {
    questionId: 'Q21',
    questionType: 'LIKERT',
    competency: 'Emotional Intelligence',
    trait: 'Self-regulation',
    questionText: 'I stay calm and composed even when receiving sharp criticism or working in high-tension environments.',
    options: [
      { text: 'Strongly Disagree', score: 1 },
      { text: 'Disagree', score: 2 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 4 },
      { text: 'Strongly Agree', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q22',
    questionType: 'FREQUENCY',
    competency: 'Emotional Intelligence',
    trait: 'Empathy in Teams',
    questionText: 'How often do you accurately detect unspoken emotional tension or fatigue among your project teammates?',
    options: [
      { text: 'Never', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes', score: 3 },
      { text: 'Often', score: 4 },
      { text: 'Always', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q23',
    questionType: 'SITUATIONAL_JUDGMENT',
    competency: 'Emotional Intelligence',
    trait: 'Supportive Mentorship',
    questionText: 'A junior team member is visibly demoralized after failing a technical mock interview. What is your reaction?',
    options: [
      { text: 'Offer empathetic encouragement, help them break down the interviewer feedback, and practice together.', score: 5 },
      { text: 'Tell them mock tests are unimportant and they should ignore the score.', score: 2 },
      { text: 'Advise them that technical fields may require much harder work than they are providing.', score: 1 },
      { text: 'Give them space and avoid mentioning the subject entirely.', score: 2 }
    ],
    reverseScored: false,
    weight: 1.2
  },
  {
    questionId: 'Q24',
    questionType: 'RANKING',
    competency: 'Emotional Intelligence',
    trait: 'Interpersonal Tactics',
    questionText: 'Rank the following interpersonal strategies from most effective to least effective for resolving workplace friction:',
    options: [
      { text: 'Active empathetic listening to uncover core underlying concerns', score: 5 },
      { text: 'Focusing on shared organizational goals and mutual interests', score: 4 },
      { text: 'Using neutral, non-accusatory language ("I notice" vs "You did")', score: 4 },
      { text: 'Postponing discussions until emotional intensity naturally subsides', score: 3 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q25',
    questionType: 'FORCED_CHOICE',
    competency: 'Emotional Intelligence',
    trait: 'Feedback Disposition',
    questionText: 'Select the statement that best captures your reaction when receiving tough feedback:',
    options: [
      { text: 'Statement A: I reflect objectively on the message and view it as actionable calibration data.', value: 'A', score: 5 },
      { text: 'Statement B: I seek external validation first before internalizing the critique.', value: 'B', score: 3 }
    ],
    reverseScored: false,
    weight: 1
  },

  // 6. Problem Solving (5 questions)
  {
    questionId: 'Q26',
    questionType: 'LIKERT',
    competency: 'Problem Solving',
    trait: 'Root Cause Analysis',
    questionText: 'When encountering a critical system bug, I systematically analyze root causes rather than applying hasty surface patches.',
    options: [
      { text: 'Strongly Disagree', score: 1 },
      { text: 'Disagree', score: 2 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 4 },
      { text: 'Strongly Agree', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q27',
    questionType: 'FREQUENCY',
    competency: 'Problem Solving',
    trait: 'Decomposition',
    questionText: 'How frequently do you decompose large ambiguous challenges into smaller testable sub-problems?',
    options: [
      { text: 'Never', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes', score: 3 },
      { text: 'Often', score: 4 },
      { text: 'Always', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q28',
    questionType: 'SCENARIO_BASED',
    competency: 'Problem Solving',
    trait: 'Architectural Tradeoffs',
    scenario: 'An algorithm you designed achieves 99% accuracy but runs with unacceptable latency for real-time mobile users.',
    questionText: 'What is your structured engineering next step?',
    options: [
      { text: 'Profile execution bottlenecks, evaluate algorithmic complexity, and implement caching or approximation tradeoffs.', score: 5 },
      { text: 'Upgrade server hardware specs without optimizing the underlying algorithm.', score: 2 },
      { text: 'Lower accuracy requirements to 50% immediately to save compute time.', score: 1 },
      { text: 'Tell product managers that real-time latency is mathematically impossible.', score: 1 }
    ],
    reverseScored: false,
    weight: 1.2
  },
  {
    questionId: 'Q29',
    questionType: 'SELF_ASSESSMENT',
    competency: 'Problem Solving',
    trait: 'Analytical Rigor',
    questionText: 'How confident are you when debugging a complex issue with zero documentation available?',
    options: [
      { text: 'Emerging (Need step-by-step guidance from seniors)', score: 2 },
      { text: 'Developing (Can isolate issues with search tools and forums)', score: 3 },
      { text: 'Proficient (Formulate hypotheses and test systematically)', score: 4 },
      { text: 'Mastery (Intuitive debugging through tracing, profiling, and deep logs)', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q30',
    questionType: 'LIKERT',
    competency: 'Problem Solving',
    trait: 'Surface Guessing (Reverse)',
    questionText: 'I tend to guess random solutions quickly when errors arise rather than examining logs and call stacks.',
    options: [
      { text: 'Strongly Disagree', score: 5 },
      { text: 'Disagree', score: 4 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 2 },
      { text: 'Strongly Agree', score: 1 }
    ],
    reverseScored: true,
    weight: 1
  },

  // 7. Initiative (5 questions)
  {
    questionId: 'Q31',
    questionType: 'LIKERT',
    competency: 'Initiative',
    trait: 'Proactive Innovation',
    questionText: 'I routinely create utility scripts, documentation, or starter templates to help streamline future team workflows without being asked.',
    options: [
      { text: 'Strongly Disagree', score: 1 },
      { text: 'Disagree', score: 2 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 4 },
      { text: 'Strongly Agree', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q32',
    questionType: 'FREQUENCY',
    competency: 'Initiative',
    trait: 'Self-driven Learning',
    questionText: 'How frequently do you explore new technical concepts outside of your required university curriculum?',
    options: [
      { text: 'Never', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes', score: 3 },
      { text: 'Often', score: 4 },
      { text: 'Always', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q33',
    questionType: 'SITUATIONAL_JUDGMENT',
    competency: 'Initiative',
    trait: 'Opportunity Identification',
    questionText: 'You notice that a recurring manual testing process consumes 4 hours of team time every week. What do you do?',
    options: [
      { text: 'Spend time exploring an automated test script and present a working proof-of-concept to the team.', score: 5 },
      { text: 'Continue executing the manual steps as specified without suggesting changes.', score: 2 },
      { text: 'Complain about the manual overhead to peers during breaks.', score: 1 },
      { text: 'Skip parts of the testing process to save personal time.', score: 1 }
    ],
    reverseScored: false,
    weight: 1.2
  },
  {
    questionId: 'Q34',
    questionType: 'FORCED_CHOICE',
    competency: 'Initiative',
    trait: 'Action Bias',
    questionText: 'When starting a new project with little direction, which matches your instinct?',
    options: [
      { text: 'Statement A: Build a rapid minimum prototype to clarify assumptions through concrete experimentation.', value: 'A', score: 5 },
      { text: 'Statement B: Wait for formal management instructions before writing any code.', value: 'B', score: 2 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q35',
    questionType: 'LIKERT',
    competency: 'Initiative',
    trait: 'Passive Dependency (Reverse)',
    questionText: 'I prefer waiting for explicit instructions before beginning any task, even when obvious next steps exist.',
    options: [
      { text: 'Strongly Disagree', score: 5 },
      { text: 'Disagree', score: 4 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 2 },
      { text: 'Strongly Agree', score: 1 }
    ],
    reverseScored: true,
    weight: 1
  },

  // 8. Time Management (5 questions)
  {
    questionId: 'Q36',
    questionType: 'LIKERT',
    competency: 'Time Management',
    trait: 'Prioritization & Scheduling',
    questionText: 'I prioritize tasks based on their urgency and long-term impact rather than tackling whatever appears easiest.',
    options: [
      { text: 'Strongly Disagree', score: 1 },
      { text: 'Disagree', score: 2 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 4 },
      { text: 'Strongly Agree', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q37',
    questionType: 'FREQUENCY',
    competency: 'Time Management',
    trait: 'Deadline Consistency',
    questionText: 'How often do you submit project deliverables comfortably ahead of deadlines with time for final review?',
    options: [
      { text: 'Never', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes', score: 3 },
      { text: 'Often', score: 4 },
      { text: 'Always', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q38',
    questionType: 'SITUATIONAL_JUDGMENT',
    competency: 'Time Management',
    trait: 'Managing Competing Deadlines',
    questionText: 'You have a final semester exam in two days and an internship assignment due tomorrow evening. How do you plan?',
    options: [
      { text: 'Timebox the assignment to meet core criteria cleanly, then dedicate remaining blocks to focused exam prep.', score: 5 },
      { text: 'Pull an all-nighter for the assignment and hope to cram for the exam during breaks.', score: 2 },
      { text: 'Abandon the internship assignment without informing the company.', score: 1 },
      { text: 'Skip the university exam to finish the internship assignment perfectly.', score: 1 }
    ],
    reverseScored: false,
    weight: 1.2
  },
  {
    questionId: 'Q39',
    questionType: 'RANKING',
    competency: 'Time Management',
    trait: 'Productivity Systems',
    questionText: 'Rank these productivity strategies in order of usefulness for maintaining daily focus:',
    options: [
      { text: 'Daily top-3 MITs (Most Important Tasks) defined every morning', score: 5 },
      { text: 'Timeblocking calendar slots for deep uninterrupted coding', score: 4 },
      { text: 'Breaking multi-week projects into 2-day micro-deliverables', score: 4 },
      { text: 'Multi-tasking across several chat tabs and code windows', score: 2 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q40',
    questionType: 'LIKERT',
    competency: 'Time Management',
    trait: 'Overwhelm & Procrastination (Reverse)',
    questionText: 'I frequently become overwhelmed when multiple tasks need attention and delay starting until the last minute.',
    options: [
      { text: 'Strongly Disagree', score: 5 },
      { text: 'Disagree', score: 4 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 2 },
      { text: 'Strongly Agree', score: 1 }
    ],
    reverseScored: true,
    weight: 1
  },

  // 9. Resilience (5 questions)
  {
    questionId: 'Q41',
    questionType: 'LIKERT',
    competency: 'Resilience',
    trait: 'Pressure Composure',
    questionText: 'I remain calm, focused, and analytical when troubleshooting critical live deployment bugs under tight supervision.',
    options: [
      { text: 'Strongly Disagree', score: 1 },
      { text: 'Disagree', score: 2 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 4 },
      { text: 'Strongly Agree', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q42',
    questionType: 'FREQUENCY',
    competency: 'Resilience',
    trait: 'Bounce Back after Setbacks',
    questionText: 'When a job interview or project evaluation doesn’t go well, how quickly do you channel that energy into constructive practice?',
    options: [
      { text: 'Never (Takes weeks to recover confidence)', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes', score: 3 },
      { text: 'Often (Reflect and resume within a day)', score: 4 },
      { text: 'Always (Immediate debrief and plan for next opportunity)', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q43',
    questionType: 'SCENARIO_BASED',
    competency: 'Resilience',
    trait: 'Handling Rejection',
    scenario: 'After 3 rounds of interviews with your dream company, you receive an automated rejection notice without specific feedback.',
    questionText: 'What is your proactive response?',
    options: [
      { text: 'Conduct an honest self-retrospective, identify areas to sharpen, and apply to other top opportunities.', score: 5 },
      { text: 'Send an angry email asking why you weren’t selected.', score: 1 },
      { text: 'Conclude that hiring processes are purely luck and stop preparing for other companies.', score: 1 },
      { text: 'Take a long break from interview prep entirely.', score: 2 }
    ],
    reverseScored: false,
    weight: 1.2
  },
  {
    questionId: 'Q44',
    questionType: 'FORCED_CHOICE',
    competency: 'Resilience',
    trait: 'Growth Mindset',
    questionText: 'Select the statement that best aligns with your perception of technical failure:',
    options: [
      { text: 'Statement A: Failure is a necessary diagnostic event that reveals exactly what skills to master next.', value: 'A', score: 5 },
      { text: 'Statement B: Failure is a discouraging sign that a topic may not suit my natural abilities.', value: 'B', score: 2 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q45',
    questionType: 'LIKERT',
    competency: 'Resilience',
    trait: 'Stress Vulnerability (Reverse)',
    questionText: 'I find it difficult to regain focus for several days after an unexpected project setback or negative critique.',
    options: [
      { text: 'Strongly Disagree', score: 5 },
      { text: 'Disagree', score: 4 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 2 },
      { text: 'Strongly Agree', score: 1 }
    ],
    reverseScored: true,
    weight: 1
  },

  // 10. Professionalism (5 questions)
  {
    questionId: 'Q46',
    questionType: 'LIKERT',
    competency: 'Professionalism',
    trait: 'Work Ethic & Integrity',
    questionText: 'I hold myself to high standards of honesty, academic integrity, and code ownership even when no one is inspecting my work.',
    options: [
      { text: 'Strongly Disagree', score: 1 },
      { text: 'Disagree', score: 2 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 4 },
      { text: 'Strongly Agree', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q47',
    questionType: 'FREQUENCY',
    competency: 'Professionalism',
    trait: 'Punctuality & Etiquette',
    questionText: 'How consistently do you arrive prepared, punctual, and attentive to professional meetings and campus placement sessions?',
    options: [
      { text: 'Never', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes', score: 3 },
      { text: 'Often', score: 4 },
      { text: 'Always', score: 5 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q48',
    questionType: 'SITUATIONAL_JUDGMENT',
    competency: 'Professionalism',
    trait: 'Confidentiality & Ethics',
    questionText: 'You notice a peer attempting to use unauthorized online solutions during a proctored technical assessment. What is your conduct?',
    options: [
      { text: 'Remain strictly focused on your own assessment and uphold absolute academic honesty in your submission.', score: 5 },
      { text: 'Ask the peer for the solution to finish your test faster.', score: 1 },
      { text: 'Start a disruptive argument during the examination.', score: 2 },
      { text: 'Help other students access the same unauthorized material.', score: 1 }
    ],
    reverseScored: false,
    weight: 1.2
  },
  {
    questionId: 'Q49',
    questionType: 'RANKING',
    competency: 'Professionalism',
    trait: 'Corporate Culture Pillars',
    questionText: 'Rank these qualities from most essential to least essential for building a respected engineering reputation:',
    options: [
      { text: 'Reliability — consistently delivering what you commit to', score: 5 },
      { text: 'Integrity — doing the right thing even in difficult situations', score: 5 },
      { text: 'Respectful, constructive workplace communication', score: 4 },
      { text: 'Displaying technical superiority in team arguments', score: 1 }
    ],
    reverseScored: false,
    weight: 1
  },
  {
    questionId: 'Q50',
    questionType: 'LIKERT',
    competency: 'Professionalism',
    trait: 'Careless Standards (Reverse)',
    questionText: 'I consider formatting standards, documentation, and professional etiquette trivial details that can be neglected.',
    options: [
      { text: 'Strongly Disagree', score: 5 },
      { text: 'Disagree', score: 4 },
      { text: 'Neutral', score: 3 },
      { text: 'Agree', score: 2 },
      { text: 'Strongly Agree', score: 1 }
    ],
    reverseScored: true,
    weight: 1
  }
];

/**
 * Validate Question Blueprint Quality for any expected count (1 to 50)
 */
function validateQuestionBlueprint(questions, expectedCount = null) {
  const issues = [];
  const targetCount = expectedCount !== null ? Number(expectedCount) : (Array.isArray(questions) ? questions.length : 50);

  if (!Array.isArray(questions)) {
    return { valid: false, issues: ['Questions must be an array.'] };
  }

  if (targetCount < 1 || targetCount > 50) {
    issues.push(`Target question count must be between 1 and 50 (received ${targetCount}).`);
  }

  if (questions.length !== targetCount) {
    issues.push(`Expected ${targetCount} questions, received ${questions.length}.`);
  }

  // Check unique IDs
  const idSet = new Set();
  questions.forEach((q, idx) => {
    const id = q.questionId || `Q${idx + 1}`;
    if (idSet.has(id)) {
      issues.push(`Duplicate questionId: ${id}`);
    }
    idSet.add(id);

    if (!q.questionText || q.questionText.trim().length < 5) {
      issues.push(`Question #${idx + 1} has insufficient questionText.`);
    }
    if (!q.competency || !COMPETENCIES.includes(q.competency)) {
      issues.push(`Question #${idx + 1} has invalid competency "${q.competency}".`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      issues.push(`Question #${idx + 1} has insufficient options.`);
    }
  });

  return {
    valid: issues.length === 0,
    requestedCount: targetCount,
    generatedCount: questions.length,
    validCount: questions.length - issues.length > 0 ? questions.length : (issues.length === 0 ? questions.length : 0),
    issues
  };
}

/**
 * AI Question Generator for ANY question count from 1 to 50
 */
async function generateDynamicAIQuestions({
  title = 'AI Talent & Psychometric Assessment',
  category = 'Behavioral Assessment',
  targetRole = 'Software Engineer',
  questionCount = 50,
  competencies = COMPETENCIES,
  startIndex = 0
}) {
  // Validate and clamp count strictly between 1 and 50
  const parsedCount = parseInt(questionCount, 10);
  const count = (!isNaN(parsedCount) && parsedCount >= 1 && parsedCount <= 50) ? parsedCount : 50;

  const activeCompetencies = Array.isArray(competencies) && competencies.length > 0
    ? competencies.filter(c => COMPETENCIES.includes(c))
    : COMPETENCIES;
  const safeComps = activeCompetencies.length > 0 ? activeCompetencies : COMPETENCIES;

  const typeDistribution = computeQuestionTypeDistribution(count);
  const compDistribution = computeCompetencyDistribution(count, safeComps);

  const apiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;

  if (apiKey && apiKey !== 'dummy_gemini_key_for_testing') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
You are a lead psychometrician and industrial psychologist at an elite talent assessment institute.
Generate a professional psychometric assessment blueprint for candidates targeting "${targetRole}" in the category "${category || 'Behavioral Assessment'}".

STRICT SPECIFICATIONS:
1. Generate EXACTLY ${count} questions (No more, no less).
2. Competency Distribution (${count} total):
${Object.entries(compDistribution).map(([comp, num]) => `   - ${comp}: ${num} questions`).join('\n')}
3. Format Distribution across Question Types (${count} total):
${Object.entries(typeDistribution).map(([type, num]) => `   - ${type}: ${num} questions`).join('\n')}
4. Include reverseScored: true on approximately 15-20% of questions.
5. Question types specification:
   - LIKERT: 5 options (Strongly Disagree=1 to Strongly Agree=5)
   - FREQUENCY: 5 options (Never=1 to Always=5)
   - SITUATIONAL_JUDGMENT: 4 options with realistic workplace scenario and scores 1 to 5
   - FORCED_CHOICE: 2 options (Statement A vs Statement B)
   - RANKING: 4 items to prioritize
   - SELF_ASSESSMENT: 4 levels of proficiency
   - SCENARIO_BASED: Scenario context + question + 4 choices
6. All questions must be collegiate, realistic, non-clinical, non-discriminatory, and focused on workplace employability.

Return ONLY a valid JSON array of ${count} objects with structure:
[
  {
    "questionId": "Q01",
    "questionType": "LIKERT",
    "competency": "Communication",
    "trait": "Clarity & Articulation",
    "scenario": "",
    "questionText": "...",
    "options": [
      { "text": "Strongly Disagree", "score": 1 },
      { "text": "Disagree", "score": 2 },
      { "text": "Neutral", "score": 3 },
      { "text": "Agree", "score": 4 },
      { "text": "Strongly Agree", "score": 5 }
    ],
    "reverseScored": false,
    "weight": 1,
    "difficulty": "Medium"
  }
]
`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt
      });

      const textOutput = (response.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(textOutput);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const formatted = parsed.slice(0, count).map((q, idx) => {
          const qNum = startIndex + idx + 1;
          return {
            questionId: `Q${String(qNum).padStart(2, '0')}`,
            questionType: q.questionType || Object.keys(typeDistribution)[idx % Object.keys(typeDistribution).length],
            competency: q.competency || safeComps[idx % safeComps.length],
            trait: q.trait || 'Workplace Behavior',
            scenario: q.scenario || '',
            questionText: q.questionText || `Evaluates situational workplace readiness in ${q.competency || 'workplace settings'}.`,
            options: q.options || [
              { text: 'Strongly Disagree', score: 1 },
              { text: 'Disagree', score: 2 },
              { text: 'Neutral', score: 3 },
              { text: 'Agree', score: 4 },
              { text: 'Strongly Agree', score: 5 }
            ],
            reverseScored: Boolean(q.reverseScored),
            weight: q.weight || 1,
            difficulty: q.difficulty || 'Medium'
          };
        });

        // If Gemini returned at least the required count, return formatted slice
        if (formatted.length === count) {
          return { success: true, questions: formatted, count: formatted.length, source: 'gemini' };
        }
      }
    } catch (err) {
      console.warn('[Dynamic AI Question Gen Gemini]:', err.message);
    }
  }

  // Fallback: Dynamically craft exactly `count` calibrated questions matching the competency distribution
  const fallbackQuestions = [];
  const compIndices = {};
  safeComps.forEach(c => { compIndices[c] = 0; });

  // Map calibrated questions by competency
  const calibratedByComp = {};
  COMPETENCIES.forEach(c => {
    calibratedByComp[c] = CALIBRATED_50_QUESTIONS.filter(q => q.competency === c);
  });

  const compList = [];
  Object.entries(compDistribution).forEach(([comp, n]) => {
    for (let i = 0; i < n; i++) compList.push(comp);
  });

  for (let i = 0; i < count; i++) {
    const targetComp = compList[i] || safeComps[i % safeComps.length];
    const available = calibratedByComp[targetComp] || CALIBRATED_50_QUESTIONS;
    const itemIdx = compIndices[targetComp] % available.length;
    compIndices[targetComp] += 1;

    const baseQ = available[itemIdx] || CALIBRATED_50_QUESTIONS[i % CALIBRATED_50_QUESTIONS.length];
    const qNum = startIndex + i + 1;

    fallbackQuestions.push({
      ...baseQ,
      questionId: `Q${String(qNum).padStart(2, '0')}`,
      competency: targetComp
    });
  }

  return {
    success: true,
    count: fallbackQuestions.length,
    questions: fallbackQuestions,
    source: 'calibrated-battery'
  };
}

/**
 * Backward-compatible alias for 50-Question generator
 */
async function generate50QuestionsAI(params = {}) {
  return generateDynamicAIQuestions({
    ...params,
    questionCount: 50
  });
}

/**
 * Calculate Question Response Score
 */
function scoreResponseItem(qConfig, studentAnswer) {
  let score = 3;
  let maxScore = 5;

  if (!qConfig) {
    return { score: 3, maxScore: 5 };
  }

  const { questionType, reverseScored, options = [] } = qConfig;

  if (questionType === 'LIKERT' || questionType === 'FREQUENCY') {
    let numeric = typeof studentAnswer === 'number' ? studentAnswer : parseInt(studentAnswer, 10);
    if (isNaN(numeric) || numeric < 1 || numeric > 5) {
      // Find by text match in options
      const optIdx = options.findIndex(o => (typeof o === 'string' ? o : o.text) === studentAnswer);
      numeric = optIdx !== -1 ? optIdx + 1 : 3;
    }
    score = reverseScored ? (6 - numeric) : numeric;
    maxScore = 5;
  } else if (questionType === 'SITUATIONAL_JUDGMENT' || questionType === 'SCENARIO_BASED' || questionType === 'SELF_ASSESSMENT') {
    // Check if options have designated scores
    const matchedOpt = options.find(o => (typeof o === 'string' ? o : o.text) === studentAnswer || o.value === studentAnswer);
    if (matchedOpt && typeof matchedOpt.score === 'number') {
      score = matchedOpt.score;
    } else {
      score = 4;
    }
    maxScore = 5;
  } else if (questionType === 'FORCED_CHOICE') {
    const matchedOpt = options.find(o => o.value === studentAnswer || o.text === studentAnswer);
    score = matchedOpt?.score || 4;
    maxScore = 5;
  } else if (questionType === 'RANKING') {
    // Array of ranked option texts
    score = Array.isArray(studentAnswer) && studentAnswer.length > 0 ? 4.5 : 3.5;
    maxScore = 5;
  }

  return {
    score: Math.max(1, Math.min(maxScore, score)),
    maxScore
  };
}

/**
 * Compute Complete Attempt Trait Scores & Overall Readiness (Agnostic to 1-50 question counts)
 */
function calculateAttemptScoring(questions, responses) {
  const competencyMap = {};
  COMPETENCIES.forEach((c) => {
    competencyMap[c] = { rawScore: 0, maxRawScore: 0, count: 0 };
  });

  const questionConfigMap = {};
  (questions || []).forEach((q) => {
    questionConfigMap[q.questionId] = q;
  });

  const detailedResponses = [];

  (responses || []).forEach((resp) => {
    const qConfig = questionConfigMap[resp.questionId];
    if (!qConfig) return;

    const { score, maxScore } = scoreResponseItem(qConfig, resp.answer);
    const weight = qConfig.weight || 1;

    const weightedScore = score * weight;
    const weightedMax = maxScore * weight;

    const comp = qConfig.competency || 'General';
    if (competencyMap[comp]) {
      competencyMap[comp].rawScore += weightedScore;
      competencyMap[comp].maxRawScore += weightedMax;
      competencyMap[comp].count += 1;
    }

    detailedResponses.push({
      questionId: qConfig.questionId,
      questionText: qConfig.questionText,
      answer: resp.answer,
      score,
      maxScore,
      questionType: qConfig.questionType,
      competency: qConfig.competency,
      trait: qConfig.trait || '',
      reverseScored: qConfig.reverseScored
    });
  });

  // Calculate 0-100 percentage for each competency
  const traitScores = {};
  let totalPercentSum = 0;
  let evaluatedCompCount = 0;

  const competencyKeys = {
    'Communication': 'communication',
    'Teamwork': 'teamwork',
    'Leadership': 'leadership',
    'Adaptability': 'adaptability',
    'Emotional Intelligence': 'emotionalIntelligence',
    'Problem Solving': 'problemSolving',
    'Initiative': 'initiative',
    'Time Management': 'timeManagement',
    'Resilience': 'resilience',
    'Professionalism': 'professionalism'
  };

  const competencyExplanations = {
    'Communication': {
      Excellent: 'Demonstrates outstanding clarity, persuasive articulation, and active listening across multi-tiered audiences.',
      Strong: 'Communicates ideas effectively with structured logical clarity and constructive empathy.',
      Developing: 'Expresses technical thoughts well; can sharpen active listening in high-pressure reviews.',
      Emerging: 'Basic communication demonstrated; encouraged to practice spontaneous technical presentations.'
    },
    'Teamwork': {
      Excellent: 'Exemplifies cross-functional synergy, collaborative empathy, and proactive peer empowerment.',
      Strong: 'Works seamlessly in distributed project squads, consistently aligning with team milestones.',
      Developing: 'Cooperative contributor; will benefit from deeper proactive check-ins on struggling peers.',
      Emerging: 'Prefers isolated tasks; encouraged to engage more in group architecture sprints.'
    },
    'Leadership': {
      Excellent: 'Natural catalyst for vision and decisive execution under ambiguous specifications.',
      Strong: 'Takes proactive ownership, guides milestone delivery, and facilitates group consensus.',
      Developing: 'Shows strong personal initiative; developing confidence to guide larger cross-discipline groups.',
      Emerging: 'Prefers directed roles; encouraged to lead small project sub-modules.'
    },
    'Adaptability': {
      Excellent: 'Highly agile mindset that thrives during requirement pivots and rapid technology adoption.',
      Strong: 'Pivots smoothly when project scopes evolve, maintaining strong productivity.',
      Developing: 'Adjusts to changes with brief recalibration time; open to agile workflows.',
      Emerging: 'Prefers rigid routines; encouraged to practice short hackathons and rapid prototyping.'
    },
    'Emotional Intelligence': {
      Excellent: 'Exceptional self-regulation, interpersonal tact, and composure under high scrutiny.',
      Strong: 'Maintains healthy perspective, interprets peer dynamics accurately, and takes critiques constructively.',
      Developing: 'Handles normal interactions calmly; occasional stress reactions during tight crunch periods.',
      Emerging: 'Encouraged to practice emotional decompression techniques during high-stakes evaluations.'
    },
    'Problem Solving': {
      Excellent: 'Systematically decomposes intricate engineering problems with algorithmic rigor and root-cause analysis.',
      Strong: 'Structured problem solver capable of isolating edge cases and testing hypotheses logically.',
      Developing: 'Solves standard technical challenges; benefits from deeper architectural profiling.',
      Emerging: 'Relies on trial-and-error; encouraged to practice systematic debugging and flow diagrams.'
    },
    'Initiative': {
      Excellent: 'Self-starting innovator who proactively solves bottlenecks before being assigned.',
      Strong: 'Consistently demonstrates strong ownership, independent learning, and forward planning.',
      Developing: 'Executes assigned tasks well; can take more spontaneous ownership of unassigned blockers.',
      Emerging: 'Prefers explicit direction; encouraged to contribute ideas in open brainstorming.'
    },
    'Time Management': {
      Excellent: 'Flawless prioritization, disciplined milestone pacing, and consistent early deliverables.',
      Strong: 'Organizes competing priorities effectively, meeting critical target deadlines.',
      Developing: 'Good execution discipline; occasional crunch pressure near final deployment.',
      Emerging: 'Prone to task procrastination; recommended to adopt timeboxing and daily MITs.'
    },
    'Resilience': {
      Excellent: 'Unwavering composure under high pressure, viewing setbacks as constructive diagnostic data.',
      Strong: 'Rebounds quickly from rejections or critical code reviews with focused resolve.',
      Developing: 'Recovers after brief reflection; maintains good long-term stamina.',
      Emerging: 'Experiences lingering discouragement after setbacks; encouraged to adopt growth mindset debriefs.'
    },
    'Professionalism': {
      Excellent: 'Exemplary workplace ethics, impeccable punctuality, and unwavering code craft standards.',
      Strong: 'Highly reliable team member with strong accountability and respectful communication.',
      Developing: 'Maintains good standards; can elevate consistency in documentation and follow-ups.',
      Emerging: 'Developing professional habits; encouraged to adhere strictly to industry conventions.'
    }
  };

  COMPETENCIES.forEach((c) => {
    const count = competencyMap[c].count;
    const raw = competencyMap[c].rawScore;
    const max = competencyMap[c].maxRawScore;

    // If competency had questions, score dynamically; if not tested in small assessment, set calibrated baseline (75)
    const percentage = max > 0 ? Math.round((raw / max) * 100) : 75;

    let level = 'Developing';
    if (percentage >= 85) level = 'Excellent';
    else if (percentage >= 70) level = 'Strong';
    else if (percentage >= 55) level = 'Developing';
    else level = 'Emerging';

    const explanation = competencyExplanations[c]?.[level] || `Demonstrated ${level.toLowerCase()} performance in ${c}.`;

    const key = competencyKeys[c];
    traitScores[key] = {
      score: percentage,
      rawScore: Math.round(raw * 10) / 10,
      maxRawScore: max,
      questionsTested: count,
      level,
      explanation
    };

    if (count > 0) {
      totalPercentSum += percentage;
      evaluatedCompCount += 1;
    }
  });

  // Overall score: Average of evaluated competencies, or fallback to average of all
  const overallScore = evaluatedCompCount > 0
    ? Math.round(totalPercentSum / evaluatedCompCount)
    : 75;

  let overallReadiness = 'Strong';
  if (overallScore >= 88) overallReadiness = 'Exceptional';
  else if (overallScore >= 72) overallReadiness = 'Strong';
  else if (overallScore >= 58) overallReadiness = 'Developing';
  else overallReadiness = 'Emerging';

  return {
    traitScores,
    overallScore,
    overallReadiness,
    detailedResponses
  };
}

/**
 * Synthesize AI Talent Profile Analysis (Non-diagnostic, Evidence-based)
 */
async function synthesizeAITalentReport({ studentName = 'Candidate', department = 'Engineering', traitScores, overallScore, overallReadiness }) {
  // Sort competencies by score
  const sortedCompetencies = COMPETENCIES.map((c) => {
    const key = c === 'Emotional Intelligence' ? 'emotionalIntelligence' : c === 'Problem Solving' ? 'problemSolving' : c === 'Time Management' ? 'timeManagement' : c.toLowerCase();
    return {
      name: c,
      score: traitScores[key]?.score || 75,
      level: traitScores[key]?.level || 'Strong',
      explanation: traitScores[key]?.explanation || ''
    };
  }).sort((a, b) => b.score - a.score);

  // Top 3 Strengths
  const top3 = sortedCompetencies.slice(0, 3);
  const strengths = top3.map((item) => ({
    competency: item.name,
    score: item.score,
    explanation: `Your responses indicate strong tendencies in ${item.name.toLowerCase()}, characterized by ${item.explanation.toLowerCase()}`,
    workplaceRelevance: `Highly valued in ${department} teams requiring collaborative reliability, proactive ownership, and high execution standards.`
  }));

  // Bottom 2-3 Development Areas
  const bottom3 = sortedCompetencies.slice(-3).reverse();
  const developmentAreas = bottom3.map((item) => ({
    area: item.name,
    currentScore: item.score,
    whyItMatters: `Strengthening ${item.name.toLowerCase()} will significantly enhance career acceleration and performance during high-stakes placement rounds.`,
    improvementSuggestion: getDevelopmentSuggestion(item.name)
  }));

  // Actionable MITRA Learning Recommendations
  const recommendations = [
    {
      title: `Practice Targeted ${top3[0]?.name || 'Problem Solving'} Exercises`,
      description: `Leverage your natural aptitude in ${top3[0]?.name || 'Problem Solving'} to mentor peers and tackle advanced capstone architectures.`,
      moduleLink: '/student/training?category=Aptitude'
    },
    {
      title: `Participate in Time-Bound Collaborative Sprints`,
      description: `Engage in structured peer code reviews and sprint simulations to sharpen ${bottom3[0]?.name || 'Communication'}.`,
      moduleLink: '/student/training?category=Domain'
    },
    {
      title: `Conduct Mock Technical & Behavioral Interviews`,
      description: `Simulate high-pressure campus placement rounds to reinforce composure, active listening, and concise articulation.`,
      moduleLink: '/student/training?category=Interview'
    },
    {
      title: `Structured Workplace Prioritization`,
      description: `Implement daily MITs (Most Important Tasks) and timeboxing to sustain high output during crunch deadlines.`,
      moduleLink: '/student/training?category=Resume'
    }
  ];

  // Suggested Professional Environments
  const suggestedWorkEnvironment = [
    'Collaborative cross-functional engineering teams',
    'Fast-paced, technology-driven product environments',
    'Innovation-focused research & architecture labs',
    'Structured enterprise environments with high engineering standards'
  ];

  // AI Summary synthesis (Gemini or Evidence-Based Template)
  let aiSummary = `Your assessment responses suggest a robust foundation in ${top3[0]?.name || 'Problem Solving'} and ${top3[1]?.name || 'Adaptability'}, reflecting disciplined analytical execution and collaborative alignment. In professional team settings, your patterns indicate high adaptability when working through technical challenges. Focus on refining ${bottom3[0]?.name || 'Time Management'} through structured prioritization to maximize placement impact.`;
  let provider = 'evidence-engine';

  const apiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;
  if (apiKey && apiKey !== 'dummy_gemini_key_for_testing') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
You are an industrial talent psychologist at an engineering university placement portal.
Synthesize a concise 3-5 sentence professional behavioral talent summary for student "${studentName}" in department "${department}".

Talent Scores:
- Overall Readiness: ${overallScore}/100 (${overallReadiness})
- Top Strengths: ${top3.map(t => `${t.name} (${t.score}%)`).join(', ')}
- Growth Opportunities: ${bottom3.map(t => `${t.name} (${t.score}%)`).join(', ')}

RULES:
1. Strictly evidence-based assessment language ("Your assessment suggests...", "Your responses indicate...").
2. Absolutely NO medical, clinical, or personality disorder diagnoses.
3. Absolutely NO definitive claims like "You are definitely..." or "You should become...".
4. Highlight top strengths, collaborative readiness, and 1 growth focus.
5. Exactly 3 to 5 sentences.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt
      });

      const text = (response.text || '').trim();
      if (text.length > 50) {
        aiSummary = text;
        provider = 'gemini';
      }
    } catch (err) {
      console.warn('[Gemini Talent Synthesis]:', err.message);
    }
  }

  return {
    aiSummary,
    provider,
    strengths,
    developmentAreas,
    recommendations,
    suggestedWorkEnvironment
  };
}

function getDevelopmentSuggestion(competency) {
  switch (competency) {
    case 'Communication':
      return 'Practice summarizing technical ideas in 60-second elevator pitches and seek regular feedback during peer reviews.';
    case 'Teamwork':
      return 'Actively volunteer for cross-departmental group projects and schedule weekly alignment check-ins with team members.';
    case 'Leadership':
      return 'Take the initiative to facilitate planning sessions, define sprint milestones, and guide sub-module deliverables.';
    case 'Adaptability':
      return 'Participate in 24-hour hackathons or tackle unfamiliar technology stacks to increase comfort with ambiguous specifications.';
    case 'Emotional Intelligence':
      return 'Practice constructive reflection during feedback sessions and analyze situational dynamics before reacting under pressure.';
    case 'Problem Solving':
      return 'Engage regularly with algorithmic platforms and practice breaking complex problems into modular flow diagrams.';
    case 'Initiative':
      return 'Identify recurring manual bottlenecks in your coursework or projects and build proactive automated scripts to resolve them.';
    case 'Time Management':
      return 'Adopt the Pomodoro technique or timeboxing for deep work and establish clear personal deadlines 48 hours before official due dates.';
    case 'Resilience':
      return 'Conduct objective post-mortem reviews after challenging mock interviews, viewing each gap as targeted learning data.';
    case 'Professionalism':
      return 'Standardize your Git commit conventions, code documentation, and communication etiquette across all team repositories.';
    default:
      return 'Engage in deliberate daily practice and leverage MITRA training modules to build consistent mastery.';
  }
}

module.exports = {
  COMPETENCIES,
  QUESTION_TYPES,
  FORMAT_RATIOS,
  CALIBRATED_50_QUESTIONS,
  computeQuestionTypeDistribution,
  computeCompetencyDistribution,
  validateQuestionBlueprint,
  generateDynamicAIQuestions,
  generate50QuestionsAI,
  scoreResponseItem,
  calculateAttemptScoring,
  synthesizeAITalentReport
};
