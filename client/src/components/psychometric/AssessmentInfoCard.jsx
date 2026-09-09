import React from 'react';
import { Sparkles, Clock, Layers, LogOut, Lock, AlertCircle } from 'lucide-react';

export const AssessmentInfoCard = ({
  testTitle = 'Professional Behavioral Assessment',
  questionCount = 25,
  durationMinutes = 15,
  onEndAssessment
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Title & Dynamic Metadata */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {testTitle}
          </h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            SESSION ACTIVE
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg font-bold border border-indigo-100">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            {questionCount} Questions
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/70">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {durationMinutes} Minutes
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/70 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            AI-Calibrated
          </span>
        </div>
      </div>

      {/* End / Abandon Assessment Action with Lock Notification */}
      <div className="flex items-center sm:justify-end shrink-0">
        <button
          type="button"
          onClick={onEndAssessment}
          title="Exiting without submitting will lock this test for 24 hours"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
        >
          <Lock className="w-3.5 h-3.5 text-rose-500" />
          <span>Abandon Test</span>
          <span className="text-[10px] text-rose-500 font-bold bg-rose-100 px-1.5 py-0.5 rounded ml-0.5">24h lock</span>
        </button>
      </div>
    </div>
  );
};

export default AssessmentInfoCard;
