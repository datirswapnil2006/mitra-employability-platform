import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { ShieldAlert, Send, LogOut, X, AlertTriangle, ArrowRight } from 'lucide-react';

const AssessmentSessionContext = createContext(null);

export const AssessmentSessionProvider = ({ children }) => {
  const [session, setSession] = useState({
    isActive: false,
    assessmentId: null,
    assessmentTitle: '',
    isPractice: false,
    requires24hLock: true
  });

  const callbacksRef = useRef({
    onSubmit: null,
    onAbandon: null
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState(null); // 'SUBMIT' | 'LEAVE'
  const navigate = useNavigate();
  const location = useLocation();

  // Register active assessment session
  const startSession = useCallback(({
    assessmentId,
    assessmentTitle,
    isPractice = false,
    requires24hLock = true,
    onSubmit,
    onAbandon
  }) => {
    callbacksRef.current = { onSubmit, onAbandon };
    setSession({
      isActive: true,
      assessmentId,
      assessmentTitle: assessmentTitle || 'Assessment',
      isPractice,
      requires24hLock
    });
  }, []);

  // End active assessment session (called upon normal submit or completion)
  const endSession = useCallback(() => {
    callbacksRef.current = { onSubmit: null, onAbandon: null };
    setSession({
      isActive: false,
      assessmentId: null,
      assessmentTitle: '',
      isPractice: false,
      requires24hLock: false
    });
    setConfirmModalOpen(false);
    setPendingTarget(null);
    setActionType(null);
  }, []);

  // Intercept navigation to other modules (Sidebar, Navbar, breadcrumbs, etc.)
  const handleAttemptNavigation = useCallback((targetPath, customLabel = '') => {
    if (!session.isActive) return false;

    // Ignore navigation to same current active path
    if (location.pathname === targetPath) return true;

    setPendingTarget({ path: targetPath, label: customLabel });
    setConfirmModalOpen(true);
    return true; // Navigation was intercepted
  }, [session.isActive, location.pathname]);

  // Handle browser back / forward navigation via popstate
  useEffect(() => {
    if (!session.isActive) return;

    window.history.pushState(null, '', window.location.href);

    const handlePopState = (e) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      setPendingTarget({ path: '/student/dashboard', label: 'Dashboard' });
      setConfirmModalOpen(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [session.isActive]);

  // Handle browser tab close or reload
  useEffect(() => {
    if (!session.isActive) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'You have an active assessment in progress. Leaving this page will terminate and lock your attempt for 24 hours.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session.isActive]);

  // Submit test and proceed
  const handleConfirmSubmit = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setActionType('SUBMIT');
    try {
      if (callbacksRef.current.onSubmit) {
        await callbacksRef.current.onSubmit();
      }
      const destination = pendingTarget?.path;
      endSession();
      if (destination) {
        navigate(destination);
      }
    } catch (err) {
      console.error('Error submitting exam on navigation:', err);
    } finally {
      setActionLoading(false);
      setActionType(null);
    }
  };

  // Leave test and enforce 24-hour lockout
  const handleConfirmLeave = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setActionType('LEAVE');
    try {
      if (callbacksRef.current.onAbandon) {
        await callbacksRef.current.onAbandon();
      }
      const destination = pendingTarget?.path || '/student/assessments';
      endSession();
      navigate(destination);
    } catch (err) {
      console.error('Error abandoning exam on navigation:', err);
      const destination = pendingTarget?.path || '/student/assessments';
      endSession();
      navigate(destination);
    } finally {
      setActionLoading(false);
      setActionType(null);
    }
  };

  const handleCancelModal = () => {
    if (actionLoading) return;
    setConfirmModalOpen(false);
    setPendingTarget(null);
  };

  return (
    <AssessmentSessionContext.Provider
      value={{
        isAssessmentActive: session.isActive,
        session,
        startSession,
        endSession,
        handleAttemptNavigation
      }}
    >
      {children}

      {/* Leave Assessment Interception Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={handleCancelModal}
        title="Assessment in Progress — Navigation Warning"
        size="md"
      >
        <div className="space-y-5">
          {/* Danger Alert Banner */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900">
            <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-black text-sm text-rose-950">
                You have an ongoing test in progress!
              </h4>
              <p className="text-rose-800 leading-relaxed font-medium">
                You are currently attempting <strong className="text-rose-950">{session.assessmentTitle}</strong>.
                {session.requires24hLock ? (
                  <>
                    {' '}If you leave this assessment now without submitting, your exam attempt will be terminated and <strong className="text-rose-950 underline underline-offset-2">locked for 24 hours</strong>.
                  </>
                ) : (
                  <>
                    {' '}Leaving will exit your active practice session.
                  </>
                )}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Please choose whether you want to <strong>Submit your exam with your current answers</strong>, or <strong>Leave the exam</strong> {session.requires24hLock ? '(which will apply a 24-hour lockout)' : ''}:
          </p>

          {/* Action Options */}
          <div className="space-y-2.5 pt-1">
            {/* Option 1: Submit Test */}
            <button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={actionLoading}
              className="w-full text-left p-3.5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-600 transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-950 block">
                    Submit Test & Finish Normally
                  </span>
                  <span className="text-[11px] text-emerald-700 block font-medium">
                    Submit all answered questions and view your results without any lockout.
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-700 shrink-0 group-hover:translate-x-1 transition-transform ml-2" />
            </button>

            {/* Option 2: Leave & Lock for 24h */}
            <button
              type="button"
              onClick={handleConfirmLeave}
              disabled={actionLoading}
              className="w-full text-left p-3.5 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50/70 hover:border-rose-400 transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-rose-900 block">
                    {session.requires24hLock ? 'Leave Assessment & Lock for 24 Hours' : 'Leave Practice Test'}
                  </span>
                  <span className="text-[11px] text-rose-700/80 block font-medium">
                    {session.requires24hLock
                      ? 'Abandon your attempt. You will NOT be able to retake this test for 24 hours.'
                      : 'Exit to requested module without saving remaining answers.'}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-500 shrink-0 group-hover:translate-x-1 transition-transform ml-2" />
            </button>
          </div>

          {/* Cancel Footer */}
          <div className="flex items-center justify-end pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelModal}
              disabled={actionLoading}
              className="font-bold text-xs"
            >
              Stay in Exam (Continue Answering)
            </Button>
          </div>
        </div>
      </Modal>
    </AssessmentSessionContext.Provider>
  );
};

export const useAssessmentSession = () => {
  const context = useContext(AssessmentSessionContext);
  if (!context) {
    return {
      isAssessmentActive: false,
      session: { isActive: false },
      startSession: () => {},
      endSession: () => {},
      handleAttemptNavigation: () => false
    };
  }
  return context;
};
