import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export const ErrorState = ({
  title = 'Something went wrong',
  description = 'An error occurred while loading this section. Please try again.',
  onRetry
}) => {
  return (
    <div className="bg-rose-50/50 rounded-2xl p-8 text-center flex flex-col items-center justify-center border border-rose-200 shadow-xs my-4">
      <div className="p-3 bg-rose-100 rounded-2xl border border-rose-200 mb-3 text-rose-600">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-600 max-w-md mb-5 leading-relaxed">{description}</p>
      {onRetry && (
        <Button size="sm" variant="outline" icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
