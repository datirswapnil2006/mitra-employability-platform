import React from 'react';

export const LoadingState = ({ message = 'Loading contents...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-blue-100"></div>
        <div className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-xs font-semibold text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingState;
