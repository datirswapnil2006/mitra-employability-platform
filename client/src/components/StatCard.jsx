import React from 'react';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = 'indigo',
  className = '',
  onClick,
  active = false,
  activeColor = 'blue'
}) => {
  const iconColors = {
    indigo: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  const activeRings = {
    blue: 'ring-2 ring-blue-500 border-blue-500 shadow-md',
    amber: 'ring-2 ring-amber-500 border-amber-500 shadow-md',
    emerald: 'ring-2 ring-emerald-500 border-emerald-500 shadow-md',
    indigo: 'ring-2 ring-indigo-500 border-indigo-500 shadow-md',
    rose: 'ring-2 ring-rose-500 border-rose-500 shadow-md'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-start justify-between relative overflow-hidden transition-all duration-200 h-full w-full ${
        onClick ? 'cursor-pointer' : ''
      } ${
        active
          ? `${activeRings[activeColor] || activeRings.blue} scale-[1.02]`
          : onClick
          ? 'hover:shadow-md hover:scale-[1.01]'
          : 'hover:shadow-md'
      } ${className}`}
    >
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{title}</p>
        <h4 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</h4>
        {subtitle && <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>}
        {trend && (
          <span className={`inline-flex items-center text-xs font-bold mt-2 ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl border shrink-0 ${iconColors[color] || iconColors.indigo}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
