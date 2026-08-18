import React from 'react';

const variants = {
  primary: 'bg-blue-50 text-blue-700 border-blue-200/80',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
  info: 'bg-sky-50 text-sky-700 border-sky-200/80',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200'
};

export const Badge = ({ children, variant = 'primary', className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
