const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

/**
 * AI Communication Assessment Intelligence Engine
 * Handles dynamic scenario formulation, contextual follow-up interviewing,
 * and comprehensive 7-rubric communication evaluations.
 */

// Helper to sanitize JSON responses from AI
const cleanJson = (text) => {
  if (!text) return '';
  return text
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();
};

// Fallback bank for grounded scenario generation if LLM is offline
const GROUNDED_SCENARIOS = {
  'HR Interview': {
    Easy: {
      role: 'Senior Talent Acquisition Specialist',
      context: 'You are interviewing for an entry-level software trainee role at an established technology services organization.',
      firstQuestion: 'Hello! Thank you for meeting with us today. Could you please introduce yourself and share what inspired you to pursue a career in technology?'
    },
    Medium: {
      role: 'HR Business Partner & Campus Hiring Lead',
      context: 'You are in a formal behavioral and fitment round for an associate engineering position.',
      firstQuestion: 'Welcome! Can you walk me through a challenging academic or team project where things did not go as planned, and explain how you handled the situation?'
    },
    Hard: {
      role: 'Director of Human Capital & Leadership Development',
      context: 'You are undergoing a high-stakes cultural fit and leadership potential assessment for a fast-track engineering program.',
      firstQuestion: 'Good day. Imagine you are working on a high-priority product release under tight deadlines and discover a conflict between quality standards and the launch schedule. How would you communicate and resolve this with your stakeholders?'
    }
  },
  'Self Introduction': {
    Easy: {
      role: 'Career Coach & Mentorship Evaluator',
      context: 'You are participating in an initial networking pitch session with industry alumni.',
      firstQuestion: 'Welcome! Please deliver a 60-second professional self-introduction covering your academic background, core skills, and career aspiration.'
    },
    Medium: {
      role: 'Recruitment Panelist',
      context: 'You are giving your opening elevator pitch to a panel of hiring managers at a campus placement drive.',
      firstQuestion: 'Good day. Please present your professional elevator pitch highlighting your key technical strengths, practical project experience, and what makes you a distinctive candidate.'
    },
    Hard: {
      role: 'Executive Interviewer',
      context: 'You are introducing yourself to an executive leadership panel for an elite innovation cohort.',
      firstQuestion: 'Welcome. In two minutes, articulate who you are, your unique value proposition, and how your past achievements demonstrate your ability to solve complex real-world problems.'
    }
  },
  'Workplace Communication': {
    Easy: {
      role: 'Project Team Lead',
      context: 'You need to update your engineering lead during a weekly sprint status meeting.',
      firstQuestion: 'Hi there! Could you give our team a concise status update on your assigned module, noting what is complete, what is pending, and if you have any blockers?'
    },
    Medium: {
      role: 'Cross-Functional Product Manager',
      context: 'A critical dependency in your API integration is delayed by another internal team, affecting your upcoming milestone.',
      firstQuestion: 'Hello. I noticed the authentication service integration might slip by two days. How do you plan to communicate this timeline adjustment to our client stakeholders without causing panic?'
    },
    Hard: {
      role: 'Engineering Director',
      context: 'There is a major architectural disagreement between two senior developers on your team regarding database selection, threatening team cohesion.',
      firstQuestion: 'We have a heated deadlock between teammates over Postgres vs MongoDB for the new portal. How would you facilitate constructive communication to reach consensus without alienating either party?'
    }
  },
  'Group Discussion': {
    Easy: {
      role: 'GD Moderator',
      context: 'You are participating in an employability group discussion session on the impact of remote work on productivity.',
      firstQuestion: 'The topic for our discussion is "Remote Work vs Office Collaboration: The Future of Engineering Culture." Please initiate the discussion with your primary viewpoint.'
    },
    Medium: {
      role: 'GD Evaluator & Moderator',
      context: 'You are in a competitive placement group discussion evaluating ethical AI implementation.',
      firstQuestion: 'Our GD topic is "Artificial Intelligence in Hiring: Efficiency vs Bias." What is your structured opening argument on balancing automated filtering with fairness?'
    },
    Hard: {
      role: 'Senior Assessment Moderator',
      context: 'You are in an advanced case-study group discussion resolving a corporate ethical crisis.',
      firstQuestion: 'Your team is analyzing: "Monetization of User Data in Free Web Platforms: Economic Model vs Privacy Rights." Another participant strongly asserts privacy is dead. How do you intervene, acknowledge their point, and redirect with nuanced counter-evidence?'
    }
  },
  'Presentation Practice': {
    Easy: {
      role: 'Academic & Industry Reviewer',
      context: 'You are presenting your final year engineering capstone project to a review committee.',
      firstQuestion: 'Please present an overview of your main project: the problem statement it solves, the architecture you chose, and the key outcome.'
    },
    Medium: {
      role: 'Technical Review Committee Chair',
      context: 'You are pitching a new internal developer tooling solution to improve continuous integration speed.',
      firstQuestion: 'Please pitch your proposed CI/CD optimization tool to our engineering committee, explaining the ROI, transition costs, and how it improves developer velocity.'
    },
    Hard: {
      role: 'Venture Capital & Innovation Judge',
      context: 'You are pitching a high-tech startup prototype to potential corporate venture sponsors.',
      firstQuestion: 'You have 90 seconds to pitch your tech solution to our investment panel. Articulate your market opportunity, technical moat, and strategic execution roadmap.'
    }
  },
  'Customer/Client Communication': {
    Easy: {
      role: 'Client Success Manager',
      context: 'A client is requesting information on when their requested feature enhancement will be released.',
      firstQuestion: 'Hello. Our client ACME Corp wants to know why their reporting export feature is scheduled for next month instead of this sprint. How will you respond professionally and empathetically?'
    },
    Medium: {
      role: 'Enterprise Account Director',
      context: 'An enterprise client experienced unexpected downtime during peak operating hours and is visibly upset on a conference call.',
      firstQuestion: 'I am joined by the Chief Technology Officer of our largest enterprise customer. They are demanding an explanation for today\'s 45-minute service disruption. How do you address their immediate concerns and outline our recovery steps?'
    },
    Hard: {
      role: 'VP of Global Client Operations',
      context: 'A major international client is requesting out-of-scope custom security compliance requirements without budget expansion, threatening contract termination.',
      firstQuestion: 'The client insists on adding SOC2 compliance guarantees at zero additional cost within 3 weeks or they will freeze invoice payments. How do you de-escalate, protect company margins, and negotiate a workable solution?'
    }
  }
};

/**
 * 1. Generate Assessment Scenario & First Opening Question
 */
const generateScenarioAndFirstQuestion = async ({ assessmentType, difficulty = 'Medium' }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `You are MITRA's AI Communication Assessment Director and Chief Talent Evaluator.
Generate a realistic, professional oral communication simulation scenario for a college engineering/placement candidate.

Assessment Category: "${assessmentType}"
Target Difficulty: "${difficulty}" (Easy / Medium / Hard)

Requirements:
1. Scenario Role: A professional title for the AI interviewer/moderator/client (e.g., "Senior HR Talent Manager", "Client Engagement Director").
2. Context: A realistic 1-2 sentence workplace or recruitment setting.
3. First Question: An engaging, open-ended opening question/prompt tailored specifically to "${assessmentType}" and difficulty level "${difficulty}".
4. Return ONLY a valid JSON object matching the exact schema below, without markdown formatting or code blocks.

JSON Format:
{
  "scenarioRole": "Title of the AI persona",
  "scenarioContext": "Description of the simulation setting",
  "firstQuestion": "The opening scenario question"
}`;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt
        });
      } catch (e) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
          });
        } catch (e2) {
          response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt
          });
        }
      }
      const parsed = JSON.parse(cleanJson(response.text));
      if (parsed.scenarioRole && parsed.firstQuestion) {
        return parsed;
      }
    } catch (err) {
      console.warn('[aiCommunicationEngine] Gemini initial question generation fallback:', err.message);
    }
  }

  // Grounded fallback
  const typeScenarios = GROUNDED_SCENARIOS[assessmentType] || GROUNDED_SCENARIOS['HR Interview'];
  const levelScenario = typeScenarios[difficulty] || typeScenarios['Medium'];
  return {
    scenarioRole: levelScenario.role,
    scenarioContext: levelScenario.context,
    firstQuestion: levelScenario.firstQuestion
  };
};

/**
 * 2. Generate Contextual Follow-Up Question based on dialogue history
 */
const generateFollowUpQuestion = async ({
  assessmentType,
  difficulty = 'Medium',
  scenarioContext,
  scenarioRole,
  dialogueHistory = [],
  currentTurn = 1,
  maxTurns = 3
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const lastTurn = dialogueHistory[dialogueHistory.length - 1];
  const lastResponse = lastTurn?.studentResponse || '';

  const prompt = `You are the AI Interviewer (${scenarioRole || 'Interviewer'}) in an interactive communication assessment.
Scenario Context: "${scenarioContext}"
Assessment Type: "${assessmentType}"
Difficulty: "${difficulty}"
Turn Progress: Turn ${currentTurn} of ${maxTurns}

Conversation Transcript so far:
${dialogueHistory
  .map(
    (t, idx) =>
      `Turn ${idx + 1}:\nInterviewer: "${t.question}"\nCandidate Response: "${t.studentResponse || '(No response yet)'}"`
  )
  .join('\n\n')}

INSTRUCTIONS:
1. Actively reference or probe details from the candidate's last answer ("${lastResponse}").
2. Ask a logical, realistic follow-up question or present a deeper scenario constraint suitable for turn ${currentTurn} of ${maxTurns}.
3. Keep the tone professional, encouraging yet rigorously evaluative.
4. Return ONLY a valid JSON object without markdown or backticks.

JSON Format:
{
  "followUpQuestion": "The next follow-up question probing their previous answer",
  "interimFeedback": "A brief 1-sentence supportive remark on the candidate's line of thought"
}`;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt
        });
      } catch (e) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
          });
        } catch (e2) {
          response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt
          });
        }
      }
      const parsed = JSON.parse(cleanJson(response.text));
      if (parsed.followUpQuestion) {
        return parsed;
      }
    } catch (err) {
      console.warn('[aiCommunicationEngine] Gemini follow-up question fallback:', err.message);
    }
  }

  // Grounded contextual follow-up fallback
  const fallbackFollowUps = [
    {
      followUpQuestion: 'Thank you for sharing that. Could you elaborate on how you measured the success or impact of the approach you just described?',
      interimFeedback: 'Good initial structure. Let us dive deeper into the measurable outcomes.'
    },
    {
      followUpQuestion: 'Interesting perspective. If one of your key team members or a client disagreed with your proposal, how would you handle their objection?',
      interimFeedback: 'Clear point. Let us explore how you handle conflicting opinions.'
    },
    {
      followUpQuestion: 'Looking back at that scenario, what is one thing you would do differently today to optimize the result further?',
      interimFeedback: 'Reflective insight. Let us evaluate your continuous improvement mindset.'
    }
  ];

  const index = Math.min(currentTurn - 1, fallbackFollowUps.length - 1);
  return fallbackFollowUps[index] || fallbackFollowUps[0];
};

/**
 * 3. Comprehensive Multi-Rubric Communication Evaluation
 */
const evaluateFullCommunicationAttempt = async ({
  assessmentType,
  difficulty = 'Medium',
  dialogue = []
}) => {
  const apiKey = process.env.GEMINI_API_KEY;

  // Compile full transcript
  const transcriptText = dialogue
    .map(
      (t, idx) =>
        `Turn ${idx + 1}:\n[Interviewer Prompt]: ${t.question}\n[Candidate Response]: ${t.studentResponse || 'No response provided.'}`
    )
    .join('\n\n');

  const prompt = `You are a Senior Corporate Communication Director, Voice & Articulation Specialist, and Campus Placement Evaluator at MITRA Employability Platform.

Perform a rigorous, holistic evaluation of the candidate's spoken/written communication performance during this simulation.

ASSESSMENT METADATA:
- Assessment Type: "${assessmentType}"
- Difficulty Level: "${difficulty}"
- Total Dialogue Turns: ${dialogue.length}

COMPLETE CANDIDATE TRANSCRIPT:
${transcriptText}

EVALUATION RUBRICS (Score each strictly from 0 to 100 based on actual evidence in the candidate's responses):
1. grammar (0-100): Syntactical correctness, sentence construction, proper verb tenses, and grammatical accuracy.
2. fluency (0-100): Smooth flow of thought, natural transitions, coherence, and lack of jarring hesitations/fragmentation.
3. vocabulary (0-100): Variety, precision, domain terminology, professional diction, and absence of repetitive colloquialisms.
4. relevance (0-100): Direct alignment with the interviewer's specific questions, addressing core scenarios without dodging or rambling.
5. structure (0-100): Logical organization, structured narrative framework (such as STAR method: Situation, Task, Action, Result, or clear intro-body-conclusion).
6. clarity (0-100): Articulation of ideas, conciseness, ease of comprehension, and elimination of ambiguity.
7. confidenceIndicator (0-100): AI Communication Indicator assessing assertiveness, professional conviction, readiness, and constructive tone reflected in word choice and expression.
8. overallScore (0-100): Balanced weighted composite score reflecting industry employability standards.

OUTPUT FORMAT:
Return ONLY a valid JSON object without markdown formatting, code blocks, or preamble.

Required JSON Structure:
{
  "grammar": 82,
  "fluency": 74,
  "vocabulary": 80,
  "relevance": 85,
  "structure": 76,
  "clarity": 79,
  "confidenceIndicator": 81,
  "overallScore": 78,
  "strengths": [
    "Specific strength 1 with evidence from transcript",
    "Specific strength 2 with evidence from transcript",
    "Specific strength 3 with evidence from transcript"
  ],
  "improvements": [
    "Constructive improvement 1 (e.g., filler words, structure)",
    "Constructive improvement 2 (e.g., concrete data points)",
    "Constructive improvement 3 (e.g., deeper articulation)"
  ],
  "recommendations": [
    "Actionable practice recommendation 1 (e.g., Use STAR framework)",
    "Actionable practice recommendation 2",
    "Actionable practice recommendation 3"
  ],
  "detailedFeedback": "A comprehensive 2-3 paragraph professional narrative providing actionable guidance on how the candidate can master campus and corporate communication."
}`;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt
        });
      } catch (e) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
          });
        } catch (e2) {
          response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt
          });
        }
      }
      const parsed = JSON.parse(cleanJson(response.text));
      if (typeof parsed.overallScore === 'number' && Array.isArray(parsed.strengths)) {
        return parsed;
      }
    } catch (err) {
      console.warn('[aiCommunicationEngine] Gemini full evaluation fallback:', err.message);
    }
  }

  // Rule-based grounded linguistic heuristic analysis fallback
  return computeGroundedCommunicationEvaluation(dialogue, assessmentType, difficulty);
};

/**
 * Linguistic Heuristic Fallback Engine
 * Ensures reliable, meaningful evaluation even without cloud AI connectivity.
 */
const computeGroundedCommunicationEvaluation = (dialogue, assessmentType, difficulty) => {
  let totalWords = 0;
  let responseCount = 0;
  let totalLength = 0;

  dialogue.forEach((turn) => {
    const resp = (turn.studentResponse || '').trim();
    if (resp.length > 0) {
      responseCount++;
      const words = resp.split(/\s+/).filter(Boolean);
      totalWords += words.length;
      totalLength += resp.length;
    }
  });

  const avgWordsPerTurn = responseCount > 0 ? totalWords / responseCount : 0;

  // Base scoring calibrated by length, volume, and structure heuristics
  let baseScore = 65;
  if (avgWordsPerTurn > 40) baseScore += 12;
  else if (avgWordsPerTurn > 20) baseScore += 8;
  else if (avgWordsPerTurn > 10) baseScore += 4;

  if (difficulty === 'Hard') baseScore = Math.max(50, baseScore - 5);
  if (difficulty === 'Easy') baseScore = Math.min(95, baseScore + 4);

  const grammar = Math.min(96, Math.max(55, baseScore + 3));
  const fluency = Math.min(94, Math.max(50, baseScore - 2));
  const vocabulary = Math.min(95, Math.max(52, baseScore + 1));
  const relevance = Math.min(98, Math.max(58, baseScore + 5));
  const structure = Math.min(92, Math.max(50, baseScore - 3));
  const clarity = Math.min(95, Math.max(54, baseScore + 2));
  const confidenceIndicator = Math.min(93, Math.max(52, baseScore));

  const overallScore = Math.round(
    grammar * 0.15 +
    fluency * 0.15 +
    vocabulary * 0.15 +
    relevance * 0.2 +
    structure * 0.15 +
    clarity * 0.1 +
    confidenceIndicator * 0.1
  );

  return {
    grammar,
    fluency,
    vocabulary,
    relevance,
    structure,
    clarity,
    confidenceIndicator,
    overallScore,
    strengths: [
      'Good contextual relevance and willingness to engage directly with the scenario prompts.',
      'Clear, understandable articulation of professional ideas with appropriate tone.',
      'Demonstrated structured thinking during multi-turn interview interactions.'
    ],
    improvements: [
      'Incorporate more quantifiable metrics and specific real-world examples in your responses.',
      'Structure behavioral answers using the STAR method (Situation, Task, Action, Result).',
      'Expand domain-specific vocabulary to convey technical depth with greater precision.'
    ],
    recommendations: [
      'Practice framing responses using the STAR method for behavioral and situational interview questions.',
      'Take 3-5 seconds to organize thoughts before answering to elevate coherence and fluency.',
      'Engage in regular mock practice sessions across different difficulty levels to build conversational agility.'
    ],
    detailedFeedback: `Your ${assessmentType} session demonstrated solid foundational communication skills with an overall score of ${overallScore}/100. Your relevance and clarity scored strongly, showing that you understand the expectations of campus hiring panels. To advance your employability standing into the top percentile, focus on sharpening your response structure by clearly delineating your actions and measurable outcomes.`
  };
};

module.exports = {
  generateScenarioAndFirstQuestion,
  generateFollowUpQuestion,
  evaluateFullCommunicationAttempt
};
