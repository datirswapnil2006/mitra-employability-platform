import React from 'react';
import { CheckCircle2, Circle, Bookmark, HelpCircle } from 'lucide-react';

export const AssessmentProgress = ({
  totalQuestions = 25,
  answeredCount = 0,
  markedCount = 0
}) => {
  const safeTotal = Math.max(1, totalQuestions);
  const remainingCount = Math.max(0, safeTotal - answeredCount);
  const percent = Math.min(100, Math.round((answeredCount / safeTotal) * 100));

  // Circular progress SVG parameters
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          Progress Overview
        </h3>
        <p className="text-[10px] text-slate-400 font-medium">
          Real-time completion metrics
        </p>
      </div>

      {/* Circular Progress Gauge & Stats */}
      <div className="flex items-center gap-4">
        {/* SVG Circular Progress Meter */}
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
            {/* Background Track */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="text-slate-100"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Progress Stroke */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="text-indigo-600 transition-all duration-500 ease-out"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          {/* Centered Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-black text-slate-900 font-mono leading-none">
              {percent}%
            </span>
            <span className="text-[9px] font-bold text-slate-400 mt-0.5">
              Done
            </span>
          </div>
        </div>

        {/* 4 Stat Breakdown Items */}
        <div className="grid grid-cols-2 gap-2 flex-1 text-xs">
          {/* Answered */}
          <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200/70">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Answered</span>
            <span className="text-sm font-black text-emerald-700 font-mono">{answeredCount}</span>
          </div>

          {/* Remaining */}
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Remaining</span>
            <span className="text-sm font-black text-slate-700 font-mono">{remainingCount}</span>
          </div>

          {/* Marked for Review */}
          <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/70">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Marked</span>
            <span className="text-sm font-black text-amber-700 font-mono">{markedCount}</span>
          </div>

          {/* Total Questions */}
          <div className="p-2 rounded-xl bg-indigo-50/60 border border-indigo-200/60">
            <span className="text-[10px] font-bold text-indigo-700 uppercase block">Total</span>
            <span className="text-sm font-black text-indigo-900 font-mono">{totalQuestions}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentProgress;
