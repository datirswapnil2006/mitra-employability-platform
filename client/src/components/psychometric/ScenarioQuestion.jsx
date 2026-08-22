import React from 'react';
import { SituationalQuestion } from './SituationalQuestion';

export const ScenarioQuestion = ({
  questionId,
  options = [],
  selectedAnswer,
  onSelectAnswer
}) => {
  return (
    <SituationalQuestion
      questionId={questionId}
      options={options}
      selectedAnswer={selectedAnswer}
      onSelectAnswer={onSelectAnswer}
    />
  );
};

export default ScenarioQuestion;
