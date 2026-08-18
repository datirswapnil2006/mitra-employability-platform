import React from 'react';

/**
 * Reusable PageHeader Component
 * Displays title, subtitle, optional badge, breadcrumbs, and action button slot.
 */
export const PageHeader = ({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  actions
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300">/</span>}
                {crumb.link ? (
                  <a href={crumb.link} className="hover:text-slate-700 transition">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-slate-600 font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
