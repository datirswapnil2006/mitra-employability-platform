import React from 'react';
import { Sparkles, Clock, Layers, LogOut } from 'lucide-react';

export const AssessmentInfoCard = ({
  questionCount = 25,
  durationMinutes = 15,
  onEndAssessment
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Title & Dynamic Metadata */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Professional Behavioral Assessment
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md font-bold border border-indigo-100">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            {questionCount} Questions
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {durationMinutes} Minutes
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            AI-Powered Analysis
          </span>
        </div>
      </div>

      {/* End Assessment Action */}
      <div className="flex items-center sm:justify-end shrink-0">
        <button
          type="button"
          onClick={onEndAssessment}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
        >
          <LogOut className="w-3.5 h-3.5" />
          End Assessment
        </button>
      </div>
    </div>
  );
};

export default AssessmentInfoCard;
