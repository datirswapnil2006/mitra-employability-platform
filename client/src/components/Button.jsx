import React from 'react';

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold hover:opacity-95 active:scale-[0.99]',
  secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-medium focus:ring-slate-300',
  outline: 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 shadow-xs font-medium focus:ring-slate-200',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs font-semibold focus:ring-rose-500/25',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold focus:ring-emerald-500/25',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs font-semibold focus:ring-amber-500/25',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 font-medium'
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-2',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm sm:text-base rounded-xl gap-2'
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  className = '',
  disabled = false,
  style = {},
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      style={style}
      className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5 text-current shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
