import {
  Calculator,
  Brain,
  BookOpen,
  Code,
  Layers
} from 'lucide-react';

export const SECTION_ICONS = {
  quantitative: Calculator,
  logical: Brain,
  verbal: BookOpen,
  technical: Code,
  general: Layers
};

export const getSectionType = (name = '') => {
  const lower = String(name || '').toLowerCase();
  if (lower.includes('quant') || lower.includes('arithmetic') || lower.includes('math')) return 'quantitative';
  if (lower.includes('logic') || lower.includes('reasoning')) return 'logical';
  if (lower.includes('verbal') || lower.includes('english') || lower.includes('comprehension')) return 'verbal';
  if (lower.includes('domain') || lower.includes('tech') || lower.includes('core')) return 'technical';
  return 'general';
};

export const getSectionIconName = (name = '') => {
  const type = getSectionType(name);
  if (type === 'quantitative') return 'Calculator';
  if (type === 'logical') return 'Brain';
  if (type === 'verbal') return 'BookOpen';
  if (type === 'technical') return 'Code';
  return 'Layers';
};

/**
 * Derives section breakdown for tests:
 * - If it's a specific single-category assessment (e.g. Quantitative Aptitude, Logical Reasoning, Verbal Ability),
 *   it creates exactly 1 unified section. NEVER mixes questions into other categories!
 * - If it is an explicit Mix Assessment or Full Assessment, or has multiple configured sections,
 *   it groups questions by their true section / category metadata.
 */
export function getAssessmentSections(questions = [], assessment = {}) {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const categoryStr = String(assessment?.category || '').trim();
  const titleStr = String(assessment?.title || '').trim();
  const moduleStr = String(assessment?.module || '').trim();

  const isFullAssessment =
    moduleStr === 'Full' ||
    moduleStr === 'Full Assessment' ||
    titleStr.toLowerCase().includes('full assessment');

  const isMix =
    categoryStr === 'Mix Assessment' ||
    categoryStr === 'All Topics (Quantitative + Logical + Verbal)' ||
    categoryStr.toLowerCase().includes('mix') ||
    titleStr.toLowerCase().includes('mix assessment') ||
    isFullAssessment;

  // CASE 1: Single-category assessment (NOT a Mix Assessment or Full Assessment)
  // For example: "Quantitative Aptitude", "Logical Reasoning", "Verbal Ability", or "Domain"
  if (!isMix) {
    // Only split if the assessment has explicit, multiple sections defined in sectionsConfig
    const hasExplicitMultipleSections =
      Array.isArray(assessment?.sectionsConfig) && assessment.sectionsConfig.length > 1;

    if (!hasExplicitMultipleSections) {
      const sectionName = assessment?.category || assessment?.topic || assessment?.title || 'Main Assessment';
      const secType = getSectionType(sectionName);
      return [
        {
          id: 'sec-main',
          type: secType,
          name: sectionName,
          shortName: sectionName,
          iconName: getSectionIconName(sectionName),
          theme: secType === 'quantitative' ? 'blue' : secType === 'logical' ? 'purple' : secType === 'verbal' ? 'emerald' : 'indigo',
          questionIndices: questions.map((_, i) => i),
          startIndex: 0
        }
      ];
    }
  }

  // CASE 2: Multi-section or Mix Assessment
  // Priority 2a: Group by explicit question.section if distinct sections are present
  const sectionMap = new Map();
  questions.forEach((q, idx) => {
    // Use explicit question metadata: section, category, or module
    let secName = (q.section || q.category || '').trim();
    if (!secName || secName.toLowerCase() === 'general') {
      secName = isFullAssessment ? 'General Core' : 'Assessment Section';
    }

    if (!sectionMap.has(secName)) {
      sectionMap.set(secName, []);
    }
    sectionMap.get(secName).push(idx);
  });

  if (sectionMap.size > 1) {
    const list = [];
    let secIdx = 0;
    for (const [secName, indices] of sectionMap.entries()) {
      const secType = getSectionType(secName);
      list.push({
        id: `sec-${secIdx++}`,
        type: secType,
        name: secName,
        shortName: secName,
        iconName: getSectionIconName(secName),
        theme: secType === 'quantitative' ? 'blue' : secType === 'logical' ? 'purple' : secType === 'verbal' ? 'emerald' : 'indigo',
        questionIndices: indices,
        startIndex: indices[0]
      });
    }
    list.sort((a, b) => a.startIndex - b.startIndex);
    return list;
  }

  // Priority 2b: Mix Assessment with >= 6 questions without tags -> Balanced 3-way partition
  if (isMix && questions.length >= 6) {
    const total = questions.length;
    const countPerSection = Math.ceil(total / 3);

    const quant = [];
    const logical = [];
    const verbal = [];

    questions.forEach((_, idx) => {
      if (idx < countPerSection) {
        quant.push(idx);
      } else if (idx < countPerSection * 2) {
        logical.push(idx);
      } else {
        verbal.push(idx);
      }
    });

    const list = [];
    if (quant.length > 0) {
      list.push({
        id: 'sec-quant',
        type: 'quantitative',
        name: 'Quantitative Aptitude',
        shortName: 'Quantitative',
        iconName: 'Calculator',
        theme: 'blue',
        questionIndices: quant,
        startIndex: quant[0]
      });
    }
    if (logical.length > 0) {
      list.push({
        id: 'sec-logical',
        type: 'logical',
        name: 'Logical Reasoning',
        shortName: 'Logical Reasoning',
        iconName: 'Brain',
        theme: 'purple',
        questionIndices: logical,
        startIndex: logical[0]
      });
    }
    if (verbal.length > 0) {
      list.push({
        id: 'sec-verbal',
        type: 'verbal',
        name: 'Verbal Ability',
        shortName: 'Verbal Ability',
        iconName: 'BookOpen',
        theme: 'emerald',
        questionIndices: verbal,
        startIndex: verbal[0]
      });
    }
    return list;
  }

  // Fallback: 1 main section
  const defaultName = assessment?.category || assessment?.topic || 'Main Assessment';
  const defaultType = getSectionType(defaultName);
  return [
    {
      id: 'sec-main',
      type: defaultType,
      name: defaultName,
      shortName: defaultName,
      iconName: getSectionIconName(defaultName),
      theme: 'blue',
      questionIndices: questions.map((_, i) => i),
      startIndex: 0
    }
  ];
}
