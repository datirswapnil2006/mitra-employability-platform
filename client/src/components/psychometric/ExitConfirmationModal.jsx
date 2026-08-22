import React from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { AlertTriangle } from 'lucide-react';

export const ExitConfirmationModal = ({
  isOpen = false,
  onClose,
  onConfirmExit
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exit Assessment Confirmation"
    >
      <div className="space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-950">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-900 text-sm">
              Are you sure you want to leave this assessment?
            </p>
            <p className="leading-relaxed text-rose-800 font-medium">
              Your answered questions and current progress will be retained, but the timer will continue running until the allocated duration expires.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold"
          >
            Continue Assessment
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={onConfirmExit}
            className="text-xs font-bold"
          >
            Exit Assessment
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExitConfirmationModal;
