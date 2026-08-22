import React from 'react';
import { LikertQuestion } from './LikertQuestion';
import { SituationalQuestion } from './SituationalQuestion';

export const SelfAssessmentQuestion = ({
  questionId,
  options = [],
  selectedAnswer,
  onSelectAnswer
}) => {
  // If options array has custom options, render them like situational/choices, otherwise default to 5-point scale
  if (options && options.length > 0) {
    return (
      <SituationalQuestion
        questionId={questionId}
        options={options}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={onSelectAnswer}
      />
    );
  }

  return (
    <LikertQuestion
      questionId={questionId}
      selectedAnswer={selectedAnswer}
      onSelectAnswer={onSelectAnswer}
    />
  );
};

export default SelfAssessmentQuestion;
