import React from 'react';
import { Check } from 'lucide-react';

const LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree', scoreText: '1' },
  { value: 2, label: 'Disagree', scoreText: '2' },
  { value: 3, label: 'Neutral', scoreText: '3' },
  { value: 4, label: 'Agree', scoreText: '4' },
  { value: 5, label: 'Strongly Agree', scoreText: '5' }
];

export const LikertQuestion = ({
  questionId,
  selectedAnswer,
  onSelectAnswer
}) => {
  return (
    <div className="space-y-3">
      {/* Desktop & Mobile: Large touch-friendly clickable rows */}
      <div className="grid grid-cols-1 gap-2.5">
        {LIKERT_OPTIONS.map((option) => {
          const isSelected = selectedAnswer === option.value || selectedAnswer === option.label;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectAnswer(questionId, option.value)}
              className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer select-none group ${
                isSelected
                  ? 'bg-indigo-50/90 border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Left: Prominent Custom Radio & Option Label */}
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 shadow-2xs'
                      : 'border-slate-300 bg-white group-hover:border-slate-400'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>

                {/* Option Text */}
                <span
                  className={`text-sm sm:text-base font-semibold leading-tight ${
                    isSelected ? 'text-indigo-950 font-bold' : 'text-slate-700'
                  }`}
                >
                  {option.label}
                </span>
              </div>

              {/* Right: Selected Tag indicator */}
              {isSelected ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-lg shrink-0">
                  <Check className="w-3.5 h-3.5" />
                  Selected
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-300 group-hover:text-slate-400 shrink-0">
                  Select
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LikertQuestion;
