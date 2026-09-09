import React from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { AlertTriangle, Lock, ShieldAlert, ArrowLeft, ArrowRight } from 'lucide-react';

export const ExitConfirmationModal = ({
  isOpen = false,
  onClose,
  onConfirmExit,
  submitting = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exit Assessment — 24h Lockout Warning"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 text-xs text-rose-950">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1.5 flex-1">
            <p className="font-black text-rose-900 text-sm">
              Assessment Will Be Locked for 24 Hours
            </p>
            <p className="leading-relaxed text-rose-800 font-medium text-xs">
              Navigating back or leaving this session before completing will immediately mark this evaluation as <strong>Abandoned</strong>.
            </p>
          </div>
        </div>

        {/* Behavioral Integrity Policy */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Behavioral Evaluation Policy</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            In accordance with standardized psychometric evaluation guidelines, tests cannot be paused or restarted once initiated. If you exit now, you will be restricted from attempting this assessment again for <strong>24 hours</strong>.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            icon={ArrowRight}
            className="w-full sm:w-auto text-xs font-black bg-indigo-600 hover:bg-indigo-700 shadow-sm justify-center order-1 sm:order-2"
          >
            Stay & Continue Assessment
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={onConfirmExit}
            disabled={submitting}
            icon={Lock}
            className="w-full sm:w-auto text-xs font-bold justify-center order-2 sm:order-1"
          >
            {submitting ? 'Abandoning...' : 'Abandon & Lock for 24h'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExitConfirmationModal;
