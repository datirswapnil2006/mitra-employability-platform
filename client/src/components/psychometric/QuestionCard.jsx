import React from 'react';
import { Lightbulb, Info } from 'lucide-react';
import LikertQuestion from './LikertQuestion';
import FrequencyQuestion from './FrequencyQuestion';
import SituationalQuestion from './SituationalQuestion';
import ForcedChoiceQuestion from './ForcedChoiceQuestion';
import RankingQuestion from './RankingQuestion';
import ScenarioQuestion from './ScenarioQuestion';
import SelfAssessmentQuestion from './SelfAssessmentQuestion';

// Question Type format helper
const getQuestionTypeLabel = (type) => {
  switch (type) {
    case 'LIKERT':
      return 'Likert Scale';
    case 'FREQUENCY':
      return 'Frequency';
    case 'SITUATIONAL_JUDGMENT':
      return 'Situational Judgment';
    case 'FORCED_CHOICE':
      return 'Forced Choice';
    case 'RANKING':
      return 'Ranking';
    case 'SCENARIO_BASED':
      return 'Scenario Based';
    case 'SELF_ASSESSMENT':
      return 'Self Assessment';
    default:
      return 'Behavioral Statement';
  }
};

export const QuestionCard = ({
  question,
  currentIndex,
  totalQuestions,
  answeredCount,
  selectedAnswer,
  onSelectAnswer
}) => {
  if (!question) return null;

  const questionNumber = currentIndex + 1;
  const remainingCount = Math.max(0, totalQuestions - answeredCount);
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const questionTypeLabel = getQuestionTypeLabel(question.questionType);

  // Render question subcomponent based on type
  const renderQuestionComponent = () => {
    switch (question.questionType) {
      case 'LIKERT':
        return (
          <LikertQuestion
            questionId={question.questionId}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={onSelectAnswer}
          />
        );
      case 'FREQUENCY':
        return (
          <FrequencyQuestion
            questionId={question.questionId}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={onSelectAnswer}
          />
        );
      case 'SITUATIONAL_JUDGMENT':
        return (
          <SituationalQuestion
            questionId={question.questionId}
            options={question.options || []}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={onSelectAnswer}
          />
        );
      case 'FORCED_CHOICE':
        return (
          <ForcedChoiceQuestion
            questionId={question.questionId}
            options={question.options || []}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={onSelectAnswer}
          />
        );
      case 'RANKING':
        return (
          <RankingQuestion
            questionId={question.questionId}
            options={question.options || []}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={onSelectAnswer}
          />
        );
      case 'SCENARIO_BASED':
        return (
          <ScenarioQuestion
            questionId={question.questionId}
            options={question.options || []}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={onSelectAnswer}
          />
        );
      case 'SELF_ASSESSMENT':
        return (
          <SelfAssessmentQuestion
            questionId={question.questionId}
            options={question.options || []}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={onSelectAnswer}
          />
        );
      default:
        return (
          <LikertQuestion
            questionId={question.questionId}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={onSelectAnswer}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-7">
      {/* Top Header: Dynamic Question Counter & Progress Bar */}
      <div className="space-y-4 border-b border-slate-100 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Question Index & Competency */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Question <span className="text-indigo-600 font-mono font-black">{questionNumber}</span> of {totalQuestions}
            </span>

            {/* Question Type Badge */}
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/70">
              {questionTypeLabel}
            </span>

            {/* Competency Badge if available */}
            {question.competency && (
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60">
                {question.competency}
              </span>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200/70">
              Answered: {answeredCount}
            </span>
            <span className="text-slate-500 font-semibold bg-slate-50 px-3 py-1 rounded-lg border border-slate-200/70">
              Remaining: {remainingCount}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Assessment Progress</span>
            <span className="font-mono text-indigo-600 font-black">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/70">
            <div
              className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Workplace Scenario Context (if present) */}
      {question.scenario && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-slate-50/60 border-l-4 border-indigo-600 rounded-r-2xl text-xs text-indigo-950 flex items-start gap-3.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <span className="font-black uppercase text-[10px] text-indigo-900 tracking-wider block">
              Scenario Context
            </span>
            <p className="leading-relaxed text-slate-800 font-medium text-xs sm:text-sm italic">
              "{question.scenario}"
            </p>
          </div>
        </div>
      )}

      {/* Main Question Statement */}
      <div className="space-y-2">
        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-slate-900 leading-snug tracking-tight">
          {question.questionText}
        </h3>
      </div>

      {/* Dynamic Answer Component */}
      <div className="pt-2">
        {renderQuestionComponent()}
      </div>

      {/* Psychometric UX Guidance Disclaimer */}
      <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-[11px] leading-relaxed">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          There are no right or wrong answers. Select the response that genuinely reflects your workplace approach.
        </span>
      </div>
    </div>
  );
};

export default QuestionCard;
