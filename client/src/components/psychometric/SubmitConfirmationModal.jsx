import React from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { AlertCircle, CheckCircle2, Bookmark, Layers, Sparkles } from 'lucide-react';

export const SubmitConfirmationModal = ({
  isOpen = false,
  onClose,
  totalQuestions = 25,
  answeredCount = 0,
  markedCount = 0,
  submitting = false,
  onReviewUnanswered,
  onFinalSubmit
}) => {
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Assessment Confirmation"
    >
      <div className="space-y-5">
        {/* Assessment Summary Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total</span>
            <span className="text-base font-black text-slate-900 font-mono">{totalQuestions}</span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Answered</span>
            <span className="text-base font-black text-emerald-700 font-mono">{answeredCount}</span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-0.5">
            <span className="text-[10px] font-bold text-amber-700 uppercase block">Unanswered</span>
            <span className="text-base font-black text-amber-700 font-mono">{unansweredCount}</span>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-0.5">
            <span className="text-[10px] font-bold text-indigo-700 uppercase block">Marked</span>
            <span className="text-base font-black text-indigo-700 font-mono">{markedCount}</span>
          </div>
        </div>

        {/* Informational Prompt */}
        {unansweredCount > 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-950">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Unanswered Questions Detected</span>
            </div>
            <p className="leading-relaxed text-amber-900/90 font-medium">
              You still have <strong className="font-black text-amber-950">{unansweredCount} unanswered questions</strong>. Would you like to review them before submitting?
            </p>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All Questions Answered</span>
            </div>
            <p className="leading-relaxed text-emerald-900/90 font-medium">
              All {totalQuestions} questions have been answered. Once submitted, our AI engine will generate your 10-dimension talent readiness profile and personalized intelligence report.
            </p>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-3 border-t border-slate-100">
          {unansweredCount > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={onReviewUnanswered}
              className="text-xs font-bold justify-center"
            >
              Review Unanswered
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs font-semibold justify-center text-slate-600"
          >
            Continue Assessment
          </Button>

          <Button
            type="button"
            variant="primary"
            loading={submitting}
            icon={Sparkles}
            onClick={onFinalSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold shadow-md shadow-emerald-600/20 justify-center"
          >
            Submit Assessment
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SubmitConfirmationModal;
