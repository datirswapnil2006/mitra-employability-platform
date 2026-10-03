import React from 'react';
import { Sparkles, Clock, Layers, Lock, Maximize2, Minimize2 } from 'lucide-react';

export const AssessmentInfoCard = ({
  testTitle = 'Professional Behavioral Assessment',
  questionCount = 25,
  durationMinutes = 15,
  onEndAssessment,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Title & Dynamic Metadata */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {testTitle}
          </h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            SESSION ACTIVE
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600">
          <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md font-semibold border border-indigo-100">
            <Layers className="w-3 h-3 text-indigo-600" />
            {questionCount} Questions
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/70">
            <Clock className="w-3 h-3 text-slate-500" />
            {durationMinutes}m
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/70 font-semibold">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            AI-Calibrated
          </span>
        </div>
      </div>

      {/* Action Controls: Fullscreen Toggle & End Assessment */}
      <div className="flex items-center gap-2 sm:justify-end shrink-0">
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer shadow-2xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enable Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onEndAssessment}
          title="Exiting without submitting will lock this test for 24 hours"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
        >
          <Lock className="w-3.5 h-3.5 text-rose-500" />
          <span>Abandon</span>
          <span className="text-[9px] text-rose-500 font-bold bg-rose-100 px-1 rounded ml-0.5">24h lock</span>
        </button>
      </div>
    </div>
  );
};

export default AssessmentInfoCard;
