import React from 'react';

export const Card = ({ children, title, subtitle, action, className = '', style = {} }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--card-bg, #FFFFFF)',
        borderColor: 'var(--card-border, #E2E8F0)',
        color: 'var(--text-primary, #0F172A)',
        ...style
      }}
      className={`rounded-2xl p-6 border shadow-xs relative transition-colors duration-200 ${className}`}
    >
      {(title || subtitle || action) && (
        <div
          className="flex items-center justify-between mb-5 border-b pb-4"
          style={{ borderColor: 'var(--card-border, #E2E8F0)' }}
        >
          <div>
            {title && (
              <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary, #0F172A)' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary, #64748B)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
