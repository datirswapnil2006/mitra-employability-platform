import React from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Sparkles } from 'lucide-react';
import Button from '../Button';

export const AssessmentActions = ({
  currentIndex = 0,
  totalQuestions = 25,
  isMarked = false,
  onPrevious,
  onNext,
  onToggleMarkReview,
  onSubmitClick
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
      {/* Left: Previous Button */}
      <div className="w-full sm:w-auto">
        <Button
          type="button"
          size="sm"
          variant="outline"
          icon={ArrowLeft}
          disabled={isFirst}
          onClick={onPrevious}
          className="w-full sm:w-auto text-xs font-semibold justify-center"
        >
          Previous
        </Button>
      </div>

      {/* Center / Right: Mark for Review & Next/Submit */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        {/* Mark for Review Button */}
        <button
          type="button"
          onClick={onToggleMarkReview}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border select-none ${
            isMarked
              ? 'bg-amber-100/90 text-amber-900 border-amber-400 shadow-2xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isMarked ? 'fill-amber-600 text-amber-600' : 'text-slate-400'}`} />
          <span>{isMarked ? 'Marked' : 'Mark Review'}</span>
        </button>

        {/* Next or Review & Submit */}
        {isLast ? (
          <button
            type="button"
            onClick={onSubmitClick}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-[0.98] transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Review & Submit</span>
          </button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="primary"
            icon={ArrowRight}
            onClick={onNext}
            className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold shadow-sm shadow-indigo-600/20 justify-center"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default AssessmentActions;
