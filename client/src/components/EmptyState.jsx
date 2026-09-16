import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No Content Available',
  description = 'There are currently no items to display.',
  actionText,
  onAction
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 shadow-xs my-4">
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4 text-blue-600 dark:text-blue-400">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
