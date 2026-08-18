const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

/**
 * Standard 15-Item Situational Psychometric Inventory
 */
const PSYCHOMETRIC_QUESTIONS = [
  // Openness
  {
    id: 'O1',
    dimension: 'openness',
    category: 'Innovation & Curiosity',
    prompt: 'I actively seek out novel technologies, frameworks, and unconventional problem-solving methods.'
  },
  {
    id: 'O2',
    dimension: 'openness',
    category: 'Abstract Thinking',
    prompt: 'I enjoy analyzing complex architectural patterns and conceptual design challenges.'
  },
  // Conscientiousness
  {
    id: 'C1',
    dimension: 'conscientiousness',
    category: 'Execution & Discipline',
    prompt: 'I systematically organize my project deliverables, write thorough tests, and consistently meet deadlines.'
  },
  {
    id: 'C2',
    dimension: 'conscientiousness',
    category: 'Detail Orientation',
    prompt: 'I pay meticulous attention to code quality, edge cases, and documentation accuracy.'
  },
  // Extraversion
  {
    id: 'E1',
    dimension: 'extraversion',
    category: 'Interpersonal Engagement',
    prompt: 'I feel energized when presenting project findings and actively contributing in group brainstorming sessions.'
  },
  {
    id: 'E2',
    dimension: 'extraversion',
    category: 'Networking & Expression',
    prompt: 'I easily initiate discussions with mentors, peers, and cross-functional team members.'
  },
  // Agreeableness
  {
    id: 'A1',
    dimension: 'agreeableness',
    category: 'Team Collaboration',
    prompt: 'I prioritize team consensus, actively listen to conflicting viewpoints, and support struggling peers.'
  },
  {
    id: 'A2',
    dimension: 'agreeableness',
    category: 'Empathy & Feedback',
    prompt: 'I deliver and receive code reviews with constructive empathy and mutual respect.'
  },
  // Emotional Stability
  {
    id: 'ES1',
    dimension: 'emotionalStability',
    category: 'Stress Resilience',
    prompt: 'I remain calm, composed, and analytical when debugging critical production issues under tight timelines.'
  },
  {
    id: 'ES2',
    dimension: 'emotionalStability',
    category: 'Adaptability to Failure',
    prompt: 'When a project iteration encounters setbacks, I rapidly recalibrate without lingering frustration.'
  },
  // Workplace Behavioral Competencies
  {
    id: 'L1',
    dimension: 'leadership',
    category: 'Initiative & Leadership',
    prompt: 'I naturally step forward to take ownership of ambiguous requirements and guide project execution.'
  },
  {
    id: 'TW1',
    dimension: 'teamwork',
    category: 'Collaborative Alignment',
    prompt: 'I work seamlessly in distributed teams, coordinating responsibilities smoothly.'
  },
  {
    id: 'PS1',
    dimension: 'problemSolving',
    category: 'Analytical Problem Solving',
    prompt: 'I decompose intricate engineering challenges into clean, modular, testable components.'
  },
  {
    id: 'AD1',
    dimension: 'adaptability',
    category: 'Agile Adaptability',
    prompt: 'I adjust quickly when project scopes or technological stacks change mid-development.'
  },
  {
    id: 'CM1',
    dimension: 'communication',
    category: 'Technical Articulation',
    prompt: 'I can explain complex technical concepts clearly to both technical and non-technical stakeholders.'
  }
];

/**
 * Calculate dimension scores (0 - 100%) from responses
 */
const calculateDimensionScores = (responses = []) => {
  const scores = {
    openness: [],
    conscientiousness: [],
    extraversion: [],
    agreeableness: [],
    emotionalStability: [],
    leadership: [],
    teamwork: [],
    problemSolving: [],
    adaptability: [],
    communication: []
  };

  responses.forEach((r) => {
    const dim = r.dimension;
    const rating = Math.min(Math.max(Number(r.rating) || 3, 1), 5);
    const normalized = Math.round((rating / 5) * 100);
    if (scores[dim]) {
      scores[dim].push(normalized);
    }
  });

  const getAvg = (arr, defaultVal = 75) => {
    if (!arr || arr.length === 0) return defaultVal;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  };

  const personalityTraits = {
    openness: getAvg(scores.openness, 75),
    conscientiousness: getAvg(scores.conscientiousness, 80),
    extraversion: getAvg(scores.extraversion, 70),
    agreeableness: getAvg(scores.agreeableness, 85),
    emotionalStability: getAvg(scores.emotionalStability, 78)
  };

  const behavioralFit = {
    leadership: getAvg(scores.leadership, 72),
    teamwork: getAvg(scores.teamwork, 88),
    problemSolving: getAvg(scores.problemSolving, 82),
    adaptability: getAvg(scores.adaptability, 85),
    communication: getAvg(scores.communication, 79)
  };

  // Weighted overall Employability Readiness Index
  const employabilityIndex = Math.round(
    personalityTraits.conscientiousness * 0.25 +
    behavioralFit.problemSolving * 0.25 +
    behavioralFit.teamwork * 0.2 +
    personalityTraits.openness * 0.15 +
    behavioralFit.communication * 0.15
  );

  return { personalityTraits, behavioralFit, employabilityIndex };
};

/**
 * Generate AI Narrative via Gemini / Groq with Fallback
 */
const synthesizePsychometricProfileAI = async ({
  studentName = 'Student',
  department = 'Engineering',
  personalityTraits,
  behavioralFit,
  employabilityIndex
}) => {
  const prompt = `You are a Chief Talent Officer and Senior Industrial Psychologist at a tier-1 technology recruitment firm.
Analyze the psychometric profile of an engineering candidate:
Candidate: ${studentName} (${department} Department)
Employability Readiness Index: ${employabilityIndex}%

Personality Trait Scores (0-100%):
- Openness to Experience: ${personalityTraits.openness}%
- Conscientiousness: ${personalityTraits.conscientiousness}%
- Extraversion: ${personalityTraits.extraversion}%
- Agreeableness: ${personalityTraits.agreeableness}%
- Emotional Stability: ${personalityTraits.emotionalStability}%

Workplace Behavioral Competencies (0-100%):
- Problem Solving: ${behavioralFit.problemSolving}%
- Teamwork & Collaboration: ${behavioralFit.teamwork}%
- Adaptability: ${behavioralFit.adaptability}%
- Communication: ${behavioralFit.communication}%
- Leadership Initiative: ${behavioralFit.leadership}%

Return ONLY a valid JSON object (no markdown, no backticks) structured exactly as follows:
{
  "aiSummary": "2-3 concise, empowering sentences summarizing the candidate's core professional profile, work style, and industry value.",
  "strengths": [
    "Key strength 1 with specific workplace application",
    "Key strength 2 with specific workplace application",
    "Key strength 3 with specific workplace application"
  ],
  "growthAreas": [
    "Development area 1 with actionable focus",
    "Development area 2 with actionable focus"
  ],
  "careerFit": [
    "Recommended Role 1 (e.g. Full-Stack Systems Engineer)",
    "Recommended Role 2 (e.g. Solutions Consultant)",
    "Recommended Role 3 (e.g. Cloud/DevOps Specialist)"
  ],
  "actionPlan": [
    "Immediate developmental step 1",
    "Immediate developmental step 2"
  ]
}`;

  const geminiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;
  const groqKey = (process.env.GROQ_API_KEY || process.env.Groq_API_KEY || '').trim();

  // Try Gemini
  if (geminiKey && geminiKey !== 'dummy_gemini_key_for_testing') {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const cleaned = (response.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { ...parsed, aiProvider: 'gemini' };
    } catch (err) {
      console.warn('[Gemini Psychometric]:', err.message);
    }
  }

  // Try Groq
  if (groqKey) {
    try {
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        },
        {
          headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          timeout: 12000
        }
      );
      const parsed = JSON.parse(res.data?.choices?.[0]?.message?.content || '{}');
      if (parsed.strengths && parsed.careerFit) {
        return { ...parsed, aiProvider: 'groq' };
      }
    } catch (err) {
      console.warn('[Groq Psychometric]:', err.message);
    }
  }

  // Grounded Deterministic Fallback
  return {
    aiSummary: `${studentName} exhibits a disciplined, detail-oriented engineering orientation with strong collaborative synergy and high analytical rigor. Well-suited for high-velocity software engineering environments.`,
    strengths: [
      `High conscientiousness (${personalityTraits.conscientiousness}%) ensures disciplined test coverage and reliable milestone delivery.`,
      `Strong collaborative temperament (${behavioralFit.teamwork}%) fosters smooth integration in cross-functional engineering pods.`,
      `Methodical problem decomposition (${behavioralFit.problemSolving}%) minimizes architectural debt.`
    ],
    growthAreas: [
      `Expand public presentation comfort to communicate technical architecture to non-technical executives.`,
      `Take greater proactive initiative in defining ambiguous product specifications.`
    ],
    careerFit: [
      `Full-Stack Software Engineer (${department})`,
      `Systems / Cloud Infrastructure Engineer`,
      `Technical Product Consultant`
    ],
    actionPlan: [
      `Lead a technical demo session in upcoming team sprint reviews.`,
      `Participate in mock behavioral interview rounds using the STAR method.`
    ],
    aiProvider: 'fallback'
  };
};

module.exports = {
  PSYCHOMETRIC_QUESTIONS,
  calculateDimensionScores,
  synthesizePsychometricProfileAI
};
