import React from 'react';

export const StatCard = ({ title, value, icon: Icon, trend, subtitle, color = 'indigo' }) => {
  const iconColors = {
    indigo: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-start justify-between relative overflow-hidden transition-all hover:shadow-md">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</h4>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {trend && (
          <span className={`inline-flex items-center text-xs font-bold mt-2 ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl border ${iconColors[color] || iconColors.indigo}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
