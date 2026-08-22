import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export const AssessmentTimer = ({
  timeLeftSeconds = 900,
  isCritical = false,
  isWarning = false
}) => {
  const mins = Math.floor(Math.max(0, timeLeftSeconds) / 60);
  const secs = Math.max(0, timeLeftSeconds) % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Visual state styling
  let containerStyle = 'bg-slate-900 border-slate-800 text-white';
  let badgeStyle = 'text-indigo-400';
  let pulseDot = 'bg-emerald-500';

  if (isCritical) {
    containerStyle = 'bg-rose-950 border-rose-600 text-rose-100 shadow-md shadow-rose-950/40 animate-pulse';
    badgeStyle = 'text-rose-400';
    pulseDot = 'bg-rose-500';
  } else if (isWarning) {
    containerStyle = 'bg-amber-950/90 border-amber-500 text-amber-100';
    badgeStyle = 'text-amber-400';
    pulseDot = 'bg-amber-400';
  }

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${containerStyle}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseDot}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pulseDot}`} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider">
            Time Left
          </span>
        </div>

        {isCritical && (
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded-full border border-rose-700/60 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Ending Soon
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${badgeStyle}`} />
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none">
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssessmentTimer;
