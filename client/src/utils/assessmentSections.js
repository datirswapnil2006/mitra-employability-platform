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

/**
 * Derives section breakdown for tests (e.g. Mixed Tests with Quantitative Aptitude, Logical Reasoning, Verbal Ability)
 */
export function getAssessmentSections(questions = [], assessment = {}) {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const isMix =
    assessment?.category === 'Mix Assessment' ||
    String(assessment?.category || '').toLowerCase().includes('mix') ||
    String(assessment?.topic || '').toLowerCase().includes('mix') ||
    String(assessment?.title || '').toLowerCase().includes('mix') ||
    assessment?.category === 'All Topics (Quantitative + Logical + Verbal)';

  // Method 1: Check if questions contain explicit section indicators in questionText, topic, or category
  const quantitativeIndices = [];
  const logicalIndices = [];
  const verbalIndices = [];
  const technicalIndices = [];
  const otherIndices = [];

  questions.forEach((q, idx) => {
    const rawText = `${q.questionText || ''} ${q.topic || ''} ${q.category || ''} ${q.section || ''}`.toLowerCase();

    if (
      rawText.includes('[quantitative') ||
      rawText.includes('quantitative aptitude') ||
      rawText.includes('arithmetic') ||
      rawText.includes('ratio & proportion') ||
      rawText.includes('percentage') ||
      rawText.includes('speed, time') ||
      rawText.includes('profit & loss') ||
      rawText.includes('time and work') ||
      rawText.includes('simple & compound')
    ) {
      quantitativeIndices.push(idx);
    } else if (
      rawText.includes('[logical') ||
      rawText.includes('logical reasoning') ||
      rawText.includes('reasoning') ||
      rawText.includes('syllogism') ||
      rawText.includes('blood relation') ||
      rawText.includes('seating arrangement') ||
      rawText.includes('direction sense') ||
      rawText.includes('coding-decoding') ||
      rawText.includes('pattern')
    ) {
      logicalIndices.push(idx);
    } else if (
      rawText.includes('[verbal') ||
      rawText.includes('verbal ability') ||
      rawText.includes('reading comprehension') ||
      rawText.includes('sentence correction') ||
      rawText.includes('vocabulary') ||
      rawText.includes('synonyms') ||
      rawText.includes('antonyms') ||
      rawText.includes('grammar') ||
      rawText.includes('error spotting')
    ) {
      verbalIndices.push(idx);
    } else if (
      rawText.includes('[technical') ||
      rawText.includes('coding') ||
      rawText.includes('algorithm') ||
      rawText.includes('data structure')
    ) {
      technicalIndices.push(idx);
    } else {
      otherIndices.push(idx);
    }
  });

  const distinctSectionsFound =
    (quantitativeIndices.length > 0 ? 1 : 0) +
    (logicalIndices.length > 0 ? 1 : 0) +
    (verbalIndices.length > 0 ? 1 : 0) +
    (technicalIndices.length > 0 ? 1 : 0);

  // If question content clearly distributes across >= 2 sections with minimal other:
  if (distinctSectionsFound >= 2 && otherIndices.length < questions.length * 0.4) {
    const list = [];
    if (quantitativeIndices.length > 0) {
      list.push({
        id: 'sec-quant',
        type: 'quantitative',
        name: 'Quantitative Aptitude',
        shortName: 'Quantitative',
        iconName: 'Calculator',
        theme: 'blue',
        questionIndices: quantitativeIndices,
        startIndex: quantitativeIndices[0]
      });
    }
    if (logicalIndices.length > 0) {
      list.push({
        id: 'sec-logical',
        type: 'logical',
        name: 'Logical Reasoning',
        shortName: 'Logical Reasoning',
        iconName: 'Brain',
        theme: 'purple',
        questionIndices: logicalIndices,
        startIndex: logicalIndices[0]
      });
    }
    if (verbalIndices.length > 0) {
      list.push({
        id: 'sec-verbal',
        type: 'verbal',
        name: 'Verbal Ability',
        shortName: 'Verbal Ability',
        iconName: 'BookOpen',
        theme: 'emerald',
        questionIndices: verbalIndices,
        startIndex: verbalIndices[0]
      });
    }
    if (technicalIndices.length > 0) {
      list.push({
        id: 'sec-tech',
        type: 'technical',
        name: 'Technical / Core',
        shortName: 'Technical',
        iconName: 'Code',
        theme: 'indigo',
        questionIndices: technicalIndices,
        startIndex: technicalIndices[0]
      });
    }
    if (otherIndices.length > 0) {
      list.push({
        id: 'sec-general',
        type: 'general',
        name: 'General Topics',
        shortName: 'General',
        iconName: 'Layers',
        theme: 'slate',
        questionIndices: otherIndices,
        startIndex: otherIndices[0]
      });
    }
    list.sort((a, b) => a.startIndex - b.startIndex);
    return list;
  }

  // Method 2: Mix Assessment or Aptitude with >= 6 questions without tags -> Balanced 3-way partition
  if (isMix || (assessment?.module === 'Aptitude' && questions.length >= 6)) {
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

  // Method 3: Single section
  return [
    {
      id: 'sec-main',
      type: 'general',
      name: assessment?.topic || assessment?.category || 'General Section',
      shortName: assessment?.topic || assessment?.category || 'Section 1',
      iconName: 'BookOpen',
      theme: 'blue',
      questionIndices: questions.map((_, i) => i),
      startIndex: 0
    }
  ];
}
