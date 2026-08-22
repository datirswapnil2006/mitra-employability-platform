import React from 'react';
import { RotateCcw, ArrowUpDown } from 'lucide-react';

export const RankingQuestion = ({
  questionId,
  options = [],
  selectedAnswer,
  onSelectAnswer
}) => {
  const currentRankList = Array.isArray(selectedAnswer) ? selectedAnswer : [];

  const handleToggleRank = (optText) => {
    let updated = [...currentRankList];
    const existingIndex = updated.indexOf(optText);

    if (existingIndex !== -1) {
      // Remove from list
      updated.splice(existingIndex, 1);
    } else {
      // Add to list in sequence
      updated.push(optText);
    }

    onSelectAnswer(questionId, updated);
  };

  const handleReset = () => {
    onSelectAnswer(questionId, []);
  };

  return (
    <div className="space-y-3">
      {/* Helper Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-semibold bg-slate-50 p-3 rounded-xl border border-slate-200/80">
        <span className="flex items-center gap-1.5 text-slate-700">
          <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
          Click statements in your order of highest priority (1st to last):
        </span>
        {currentRankList.length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 hover:underline font-bold cursor-pointer self-end sm:self-auto"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Order
          </button>
        )}
      </div>

      {/* Options List */}
      <div className="grid grid-cols-1 gap-2.5">
        {options.map((opt, idx) => {
          const optText = typeof opt === 'string' ? opt : opt.text || '';
          const rankIdx = currentRankList.indexOf(optText);
          const isRanked = rankIdx !== -1;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleToggleRank(optText)}
              className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer select-none group ${
                isRanked
                  ? 'bg-indigo-50/90 border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Option Text */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-xs font-black text-slate-400">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isRanked ? 'text-indigo-950 font-bold' : 'text-slate-700 font-medium'
                  }`}
                >
                  {optText}
                </span>
              </div>

              {/* Rank Position Badge */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                  isRanked
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}
              >
                {isRanked ? `#${rankIdx + 1}` : '—'}
              </div>
            </button>
          );
        })}
      </div>

      {currentRankList.length > 0 && currentRankList.length < options.length && (
        <p className="text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg font-medium border border-amber-200/60">
          Ranked {currentRankList.length} of {options.length} options. Click the remaining items to complete ranking.
        </p>
      )}
    </div>
  );
};

export default RankingQuestion;
