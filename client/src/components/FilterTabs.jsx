import React from 'react';

/**
 * Reusable FilterTabs Component
 * Horizontal scrollable filter pills for modules, departments, categories, and statuses.
 */
export const FilterTabs = ({
  tabs = [],
  activeTab,
  onTabChange,
  counts = {},
  variant = 'default',
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const id = typeof tab === 'string' ? tab : tab.id;
        const label = typeof tab === 'string' ? tab : tab.label;
        const count = counts[id] !== undefined ? counts[id] : (typeof tab === 'object' ? tab.count : undefined);
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
              isActive
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                  isActive ? 'bg-blue-700/80 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default FilterTabs;
