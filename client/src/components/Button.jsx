import React from 'react';

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold focus:ring-blue-500/25',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-medium focus:ring-slate-300',
  outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 hover:text-slate-900 shadow-xs font-medium focus:ring-slate-200',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs font-semibold focus:ring-rose-500/25',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold focus:ring-emerald-500/25',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs font-semibold focus:ring-amber-500/25'
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-sm sm:text-base rounded-xl'
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
