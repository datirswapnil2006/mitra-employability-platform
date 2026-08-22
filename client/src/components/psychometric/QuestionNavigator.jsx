import React from 'react';
import { Bookmark, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export const QuestionNavigator = ({
  questions = [],
  currentIndex = 0,
  responses = {},
  markedForReview = {},
  onSelectQuestion
}) => {
  const totalCount = questions.length;
  const answeredCount = Object.keys(responses).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = Math.max(0, totalCount - answeredCount);

  // Find index of first unanswered question for quick jump
  const firstUnansweredIndex = questions.findIndex(
    (q) => responses[q.questionId] === undefined || responses[q.questionId] === ''
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Navigator Title & Quick Jump */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Question Navigator
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">
            Jump directly to any item
          </p>
        </div>

        {unansweredCount > 0 && firstUnansweredIndex !== -1 && (
          <button
            type="button"
            onClick={() => onSelectQuestion(firstUnansweredIndex)}
            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
          >
            Next Pending
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* State Legend */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5 text-indigo-700">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-indigo-200 shrink-0" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Answered ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
          <span>Unanswered ({unansweredCount})</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-700">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          <span>Marked ({markedCount})</span>
        </div>
      </div>

      {/* Dynamic Question Buttons Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-5 gap-1.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
        {questions.map((q, idx) => {
          const qId = q.questionId;
          const isCurrent = currentIndex === idx;
          const isAnswered = responses[qId] !== undefined && responses[qId] !== '';
          const isMarked = Boolean(markedForReview[qId]);

          // Determine button style according to state priority:
          // 1. Current (highest priority)
          // 2. Marked for review
          // 3. Answered
          // 4. Unanswered (neutral)
          let buttonClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/80';

          if (isCurrent) {
            buttonClass = 'bg-indigo-600 text-white font-black ring-2 ring-indigo-600 ring-offset-2 shadow-xs scale-105 z-10';
          } else if (isMarked) {
            buttonClass = isAnswered
              ? 'bg-amber-50 text-amber-900 border-2 border-amber-400 font-bold'
              : 'bg-amber-100 text-amber-900 border-2 border-dashed border-amber-500 font-bold';
          } else if (isAnswered) {
            buttonClass = 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold hover:bg-emerald-100';
          }

          return (
            <button
              key={qId || idx}
              type="button"
              onClick={() => onSelectQuestion(idx)}
              className={`h-8 rounded-lg text-xs font-mono transition-all flex items-center justify-center relative cursor-pointer select-none ${buttonClass}`}
              title={`Question ${idx + 1}${isMarked ? ' (Marked for Review)' : isAnswered ? ' (Answered)' : ' (Unanswered)'}`}
            >
              <span>{idx + 1}</span>

              {/* Tiny indicator for review */}
              {isMarked && !isCurrent && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionNavigator;
