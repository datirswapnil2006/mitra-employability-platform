import React from 'react';
import { Check } from 'lucide-react';

export const SituationalQuestion = ({
  questionId,
  options = [],
  selectedAnswer,
  onSelectAnswer
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        {options.map((opt, idx) => {
          const optText = typeof opt === 'string' ? opt : opt.text || '';
          const optVal = typeof opt === 'string' ? opt : opt.value || opt.text;
          const isSelected = selectedAnswer === optVal || selectedAnswer === optText;
          const letter = String.fromCharCode(65 + idx);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectAnswer(questionId, optVal)}
              className={`w-full p-4 sm:p-5 rounded-xl border text-left transition-all duration-200 flex items-start gap-3.5 cursor-pointer select-none group ${
                isSelected
                  ? 'bg-indigo-50/90 border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Option Letter Indicator */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                }`}
              >
                {letter}
              </div>

              {/* Option Body */}
              <div className="flex-1 min-w-0 pr-2">
                <p
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isSelected ? 'text-indigo-950 font-bold' : 'text-slate-700 font-medium'
                  }`}
                >
                  {optText}
                </p>
              </div>

              {/* Checkmark */}
              <div className="shrink-0 pt-0.5">
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-slate-300" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SituationalQuestion;
