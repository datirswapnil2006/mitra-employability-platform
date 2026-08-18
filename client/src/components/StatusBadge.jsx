import React from 'react';

/**
 * Reusable StatusBadge Component
 * Unified status indicators across the entire MITRA platform.
 */
export const StatusBadge = ({ status = 'active', className = '' }) => {
  const normalized = (status || '').toLowerCase().trim();

  const statusMap = {
    // General
    active: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    inactive: { label: 'Inactive', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
    suspended: { label: 'Suspended', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' },

    // Training & Content
    published: { label: 'Published', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    draft: { label: 'Draft', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
    archived: { label: 'Archived', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' },

    // Assessments & Attempts
    passed: { label: 'Passed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    failed: { label: 'Needs Improvement', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    in_progress: { label: 'In Progress', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    completed: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },

    // Profile
    verified: { label: 'Verified 100%', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    incomplete: { label: 'Incomplete', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
  };

  const current = statusMap[normalized] || {
    label: status.toUpperCase(),
    bg: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${current.bg} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {current.label}
    </span>
  );
};

export default StatusBadge;
