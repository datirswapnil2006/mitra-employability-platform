import React from 'react';
import { Check, ArrowRightLeft } from 'lucide-react';

export const ForcedChoiceQuestion = ({
  questionId,
  options = [],
  selectedAnswer,
  onSelectAnswer
}) => {
  return (
    <div className="space-y-4">
      {/* Subtitle prompt */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-lg w-fit">
        <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
        <span>Select the statement that best reflects your natural tendency:</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {options.map((opt, idx) => {
          const optText = typeof opt === 'string' ? opt : opt.text || (idx === 0 ? opt.statementA : opt.statementB) || '';
          const optVal = typeof opt === 'string' ? (idx === 0 ? 'A' : 'B') : opt.value || (idx === 0 ? 'A' : 'B');
          const isSelected = selectedAnswer === optVal || selectedAnswer === optText;
          const letter = idx === 0 ? 'A' : 'B';

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectAnswer(questionId, optVal)}
              className={`p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer select-none group min-h-[140px] ${
                isSelected
                  ? 'bg-indigo-50/90 border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  Statement {letter}
                </span>

                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-slate-300" />
                )}
              </div>

              {/* Statement Body */}
              <p
                className={`text-xs sm:text-sm leading-relaxed ${
                  isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800 font-medium'
                }`}
              >
                "{optText}"
              </p>

              {/* Selection Prompt */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className={isSelected ? 'text-indigo-700 font-bold' : 'text-slate-400'}>
                  {isSelected ? 'More like me ✓' : 'Click to choose'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ForcedChoiceQuestion;
