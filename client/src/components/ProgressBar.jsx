import React from 'react';

export const ProgressBar = ({ progress = 0, label, showPercentage = true, color = 'indigo', className = '' }) => {
  const cleanProgress = Math.min(100, Math.max(0, Number(progress) || 0));

  const colors = {
    indigo: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
    rose: 'bg-rose-600',
    sky: 'bg-sky-500'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5 text-xs">
          {label && <span className="font-semibold text-slate-700">{label}</span>}
          {showPercentage && <span className="font-bold text-slate-900">{cleanProgress}%</span>}
        </div>
      )}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors[color] || colors.indigo}`}
          style={{ width: `${cleanProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
