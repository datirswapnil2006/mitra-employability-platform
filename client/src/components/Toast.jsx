import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const Toast = ({
  message,
  type = 'success',
  title,
  onClose,
  duration = 4500,
  position = 'top-center'
}) => {
  useEffect(() => {
    if (!duration || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  const config = {
    success: {
      bg: 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      Icon: CheckCircle2,
      defaultTitle: 'Success'
    },
    error: {
      bg: 'bg-rose-950/95 border-rose-500/40 text-rose-100',
      iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      Icon: AlertCircle,
      defaultTitle: 'Error'
    },
    warning: {
      bg: 'bg-amber-950/95 border-amber-500/40 text-amber-100',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      Icon: AlertTriangle,
      defaultTitle: 'Notice'
    },
    info: {
      bg: 'bg-slate-900/95 border-blue-500/40 text-slate-100',
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Icon: Info,
      defaultTitle: 'Information'
    }
  }[type] || {
    bg: 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Icon: CheckCircle2,
    defaultTitle: 'Success'
  };

  const { bg, iconBg, Icon, defaultTitle } = config;

  const positionClasses = {
    'top-right': 'top-6 right-6 animate-in slide-in-from-top-6',
    'top-center': 'top-6 left-1/2 -translate-x-1/2 animate-in slide-in-from-top-6',
    'bottom-right': 'bottom-6 right-6 animate-in slide-in-from-bottom-6'
  }[position] || 'top-6 right-6 animate-in slide-in-from-top-6';

  return (
    <div className={`fixed z-50 max-w-md w-full sm:w-auto min-w-[320px] pointer-events-auto transition-all fade-in duration-300 ${positionClasses}`}>
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3.5 ${bg}`}>
        <div className={`p-2 rounded-xl border shrink-0 ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="text-xs font-black uppercase tracking-wider opacity-90">
            {title || defaultTitle}
          </h4>
          <p className="text-xs font-medium mt-0.5 leading-relaxed">
            {message}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
