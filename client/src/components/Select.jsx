import React from 'react';

export const Select = ({
  label,
  options = [],
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <select
        className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 transition-all ${
          error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''
        } ${className}`}
        {...props}
      >
        {options.map((opt, i) => {
          const value = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={i} value={value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              {labelText}
            </option>
          );
        })}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

export default Select;
