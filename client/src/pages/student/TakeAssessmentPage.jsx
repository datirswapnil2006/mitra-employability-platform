import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/Button';
import LoadingState from '../../components/LoadingState';
import Modal from '../../components/Modal';
import {
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Play,
  Award,
  BookOpen,
  FileCheck,
  Camera,
  Monitor,
  Maximize2,
  Eye,
  Copy,
  Users,
  Smartphone,
  Check,
  AlertTriangle,
  Video
} from 'lucide-react';

export const TakeAssessmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [lockedInfo, setLockedInfo] = useState(null);
  const [testStarted, setTestStarted] = useState(false);

  // Examination State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(1200); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  // Proctoring State & Violations
  const [violationsCount, setViolationsCount] = useState(0);
  const [proctoringLogs, setProctoringLogs] = useState([]);
  const [tabWarningModalOpen, setTabWarningModalOpen] = useState(false);
  const [copyWarningToast, setCopyWarningToast] = useState(false);
  const [exitWarningModalOpen, setExitWarningModalOpen] = useState(false);

  // Proctoring Hardware Streams
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraVerified, setCameraVerified] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [screenVerified, setScreenVerified] = useState(false);
  const [systemCheckLoading, setSystemCheckLoading] = useState(false);
  const [systemCheckError, setSystemCheckError] = useState('');

  const videoRef = useRef(null);
  const floatingVideoRef = useRef(null);

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  // Intercept Browser Back Button and Tab Closing during active test
  useEffect(() => {
    if (!testStarted || submitting) return;

    // Push dummy history entry so back button fires popstate rather than navigating away immediately
    window.history.pushState({ inAssessmentTest: true }, '');

    const handlePopState = (e) => {
      e.preventDefault();
      // Keep student in page history
      window.history.pushState({ inAssessmentTest: true }, '');
      setExitWarningModalOpen(true);
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Please complete your test before leaving. If you leave now, you will be restricted from retaking for 24 hours.';
      return e.returnValue;
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [testStarted, submitting]);

  // Clean up media streams on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream, screenStream]);

  // Live Timer Countdown
  useEffect(() => {
    if (!testStarted || submitting) return;

    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, timeLeft, submitting]);

  // Proctoring Anti-Cheat Event Listeners (Tab switch & Window Blur)
  useEffect(() => {
    if (!testStarted || submitting) return;

    const isProctored = assessment?.assessmentMode === 'PROCTORED';
    const tabSwitchEnabled = assessment?.proctoringSettings?.tabSwitch ?? true;

    if (!isProctored || !tabSwitchEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('TAB_SWITCH', 'Candidate switched browser tab or minimized window.');
      }
    };

    const handleWindowBlur = () => {
      logViolation('WINDOW_BLUR', 'Focus lost from assessment window.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [testStarted, submitting, assessment]);

  const logViolation = (type, details) => {
    setViolationsCount((prev) => prev + 1);
    setProctoringLogs((prev) => [
      ...prev,
      {
        type,
        timestamp: new Date(),
        details
      }
    ]);
    setTabWarningModalOpen(true);
  };

  // Copy/Paste Prevention
  const handleCopyPasteBlock = (e) => {
    if (assessment?.assessmentMode === 'PROCTORED' && assessment?.proctoringSettings?.copyPaste) {
      e.preventDefault();
      setCopyWarningToast(true);
      setTimeout(() => setCopyWarningToast(false), 3000);
      setViolationsCount((prev) => prev + 1);
      setProctoringLogs((prev) => [
        ...prev,
        {
          type: 'CLIPBOARD_ATTEMPT',
          timestamp: new Date(),
          details: 'Clipboard copy/paste blocked.'
        }
      ]);
    }
  };

  const fetchAssessment = async () => {
    setLoading(true);
    try {
      const res = await api.getAssessmentById(id);
      if (res.isLocked) {
        setLockedInfo({
          message: res.message || 'This assessment is temporarily locked due to a recent attempt or abandonment.',
          lockedUntil: res.lockedUntil,
          remainingMinutes: res.remainingMinutes,
          isAbandoned: res.isAbandoned
        });
      } else if (res.success && res.assessment) {
        setAssessment(res.assessment);
        setTimeLeft((res.assessment.timeLimitMinutes || 20) * 60);
      }
    } catch (err) {
      console.error('Error loading assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verify Camera Stream
  const handleVerifyCamera = async () => {
    setSystemCheckLoading(true);
    setSystemCheckError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      setCameraStream(stream);
      setCameraVerified(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setSystemCheckError('Camera access denied or unavailable. Please enable webcam permissions.');
    } finally {
      setSystemCheckLoading(false);
    }
  };

  // Verify Screen Share Stream
  const handleVerifyScreen = async () => {
    setSystemCheckLoading(true);
    setSystemCheckError('');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      setScreenStream(stream);
      setScreenVerified(true);
    } catch (err) {
      console.error('Screen share error:', err);
      setSystemCheckError('Screen share permission cancelled or denied.');
    } finally {
      setSystemCheckLoading(false);
    }
  };

  // Start Test (handles Normal vs Proctored mode)
  const handleStartTest = async () => {
    const isProctored = assessment?.assessmentMode === 'PROCTORED';
    const settings = assessment?.proctoringSettings || {};

    if (isProctored) {
      if (settings.camera && !cameraVerified) {
        setSystemCheckError('Please verify your camera before starting the proctored test.');
        return;
      }
      if (settings.screenShare && !screenVerified) {
        setSystemCheckError('Please share your screen before starting the proctored test.');
        return;
      }

      // Trigger Fullscreen if enabled
      if (settings.fullScreen) {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (e) {
          console.warn('Fullscreen request bypassed:', e.message);
        }
      }
    }

    setStartTime(Date.now());
    setTestStarted(true);

    // Attach stream to floating video element
    setTimeout(() => {
      if (floatingVideoRef.current && cameraStream) {
        floatingVideoRef.current.srcObject = cameraStream;
      }
    }, 200);
  };

  const handleSelectOption = (qId, optionText) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionText
    }));
  };

  const handleClearResponse = (qId) => {
    setAnswers((prev) => {
      const updated = { ...prev };
      delete updated[qId];
      return updated;
    });
  };

  const handleToggleReview = (qId) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Exit fullscreen if active
      if (document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch (e) {}
      }

      const formattedAnswers = Object.keys(answers).map((qId) => ({
        questionId: qId,
        studentAnswer: answers[qId]
      }));

      const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

      const res = await api.submitAssessment({
        assessmentId: id,
        timeSpentSeconds,
        answers: formattedAnswers,
        violationsCount,
        proctoringLogs
      });

      if (res.success && res.result) {
        navigate(`/student/assessment-result/${res.result._id}`, {
          state: { result: res.result }
        });
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Preparing examination environment..." />;

  if (lockedInfo) {
    const hours = Math.floor((lockedInfo.remainingMinutes || 0) / 60);
    const mins = (lockedInfo.remainingMinutes || 0) % 60;
    return (
      <div className="max-w-xl mx-auto text-center p-8 bg-white rounded-3xl border border-amber-200 shadow-sm space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <Clock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            24-Hour Cooldown Active
          </span>
          <h2 className="text-xl font-black text-slate-900">
            Assessment Temporarily Locked
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            {lockedInfo.message}
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Time Remaining Until Next Attempt</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {hours > 0 ? `${hours}h ` : ''}{mins}m
          </span>
        </div>

        <Button
          size="md"
          variant="primary"
          onClick={() => navigate('/student/assessments')}
          className="w-full justify-center bg-blue-600 hover:bg-blue-700 font-bold"
        >
          Return to Assessments
        </Button>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-xl mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Assessment Not Found</h2>
        <p className="text-xs text-slate-500">The requested evaluation is unavailable or has been archived.</p>
        <Button onClick={() => navigate('/student/assessments')} className="mx-auto">
          Return to Assessments
        </Button>
      </div>
    );
  }

  const questions = assessment.questions || [];
  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isProctored = assessment.assessmentMode === 'PROCTORED';
  const proctorSettings = assessment.proctoringSettings || {};

  // 1. PRE-TEST INSTRUCTIONS & SYSTEM VERIFICATION SCREEN
  if (!testStarted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200/60">
                    {assessment.module} • {assessment.category}
                  </span>
                  {isProctored ? (
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Proctored Test
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Normal Assessment
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-black text-slate-900 mt-1">{assessment.title}</h1>
              </div>
            </div>
          </div>

          {/* Test Meta Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Questions</span>
              <span className="text-lg font-black text-slate-900">{questions.length}</span>
            </div>
            <div className="p-4 bg-blue-50/70 border border-blue-200/70 rounded-2xl">
              <span className="text-[11px] font-bold text-blue-600 block uppercase">Duration</span>
              <span className="text-lg font-black text-blue-900">{assessment.timeLimitMinutes || 20} Mins</span>
            </div>
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl">
              <span className="text-[11px] font-bold text-emerald-600 block uppercase">Passing Score</span>
              <span className="text-lg font-black text-emerald-900">{assessment.passingScorePercentage || 70}%</span>
            </div>
          </div>

          {/* System Check for Proctored Tests */}
          {isProctored && (
            <div className="p-5 bg-rose-50/50 border border-rose-200/80 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Mandatory Proctoring System Check
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full uppercase">
                  Anti-Cheat Active
                </span>
              </div>

              {systemCheckError && (
                <div className="p-3 bg-rose-100 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{systemCheckError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Camera Verification */}
                {proctorSettings.camera && (
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-slate-700" />
                        <span className="text-xs font-bold text-slate-900">Webcam Stream</span>
                      </div>
                      {cameraVerified ? (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={handleVerifyCamera}
                          loading={systemCheckLoading}
                        >
                          Enable Camera
                        </Button>
                      )}
                    </div>
                    {cameraVerified && (
                      <div className="w-full h-24 rounded-xl bg-slate-950 overflow-hidden relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-2 text-[9px] font-bold text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded">
                          Live Feed Active
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Screen Share Verification */}
                {proctorSettings.screenShare && (
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-slate-700" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Screen Sharing</div>
                        <div className="text-[10px] text-slate-500">Candidate desktop stream</div>
                      </div>
                    </div>
                    {screenVerified ? (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={handleVerifyScreen}
                        loading={systemCheckLoading}
                      >
                        Share Screen
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exam Rules */}
          <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-xs text-slate-700">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Examination Guidelines:
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 leading-relaxed">
              <li>Each question carries 1 mark with no negative marking.</li>
              <li>You can navigate questions freely using the Question Palette.</li>
              <li>The test will auto-submit when the countdown reaches 00:00.</li>
              {isProctored && (
                <li className="text-rose-700 font-semibold">
                  Tab switching, minimizing the browser window, or copy-pasting is strictly prohibited and logged.
                </li>
              )}
            </ul>
          </div>

          <Button
            size="lg"
            icon={Play}
            onClick={handleStartTest}
            className="w-full justify-center text-sm font-bold shadow-md shadow-blue-500/20"
          >
            {isProctored ? 'Verify & Start Proctored Assessment' : 'Start Assessment Now'}
          </Button>
        </div>
      </div>
    );
  }

  // 2. LIVE TEST ENGINE SCREEN
  const isTimeCritical = timeLeft < 120; // under 2 mins
  const progressPercentage = questions.length > 0 ? Math.round(((currentIdx + 1) / questions.length) * 100) : 0;
  const answeredPercentage = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div
      onCopy={handleCopyPasteBlock}
      onCut={handleCopyPasteBlock}
      onPaste={handleCopyPasteBlock}
      onContextMenu={(e) => {
        if (isProctored && proctorSettings.copyPaste) e.preventDefault();
      }}
      className="max-w-7xl mx-auto space-y-5 select-none animate-in fade-in duration-300 pb-12"
    >
      {/* Top Examination HUD */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 bg-blue-900/60 px-2.5 py-0.5 rounded-md border border-blue-700/60">
                {assessment.module} • {assessment.category}
              </span>
              {assessment.topic && (
                <span className="text-[10px] font-bold text-violet-300 bg-violet-900/60 px-2.5 py-0.5 rounded-md border border-violet-700/60 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-violet-400" />
                  {assessment.topic}
                </span>
              )}
              {isProctored ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-950/80 px-2.5 py-0.5 rounded-md border border-rose-800/80 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" /> Proctored Examination
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/80 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Standard Assessment
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {assessment.title}
            </h2>
          </div>

          {/* Right Action & Continuous Countdown Timer */}
          <div className="flex items-center gap-3 sm:gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
            <div
              className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border font-mono font-black text-sm shadow-inner transition-all ${
                isTimeCritical
                  ? 'bg-rose-950/90 border-rose-600 text-rose-300 animate-pulse ring-2 ring-rose-500/40'
                  : 'bg-slate-800/90 border-slate-700 text-amber-300'
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-400' : 'text-amber-400'} shrink-0`} />
              <div className="flex flex-col">
                <span className="text-[9px] font-sans font-bold text-slate-400 uppercase leading-none">Remaining</span>
                <span className="text-sm sm:text-base leading-tight mt-0.5">{formatTimer(timeLeft)}</span>
              </div>
            </div>

            <Button
              size="sm"
              variant="primary"
              icon={Send}
              onClick={() => setConfirmSubmitOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md shadow-emerald-600/30 text-xs sm:text-sm px-4 py-2"
            >
              Submit Exam
            </Button>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>
              Question <strong className="text-white">{currentIdx + 1}</strong> of <strong className="text-white">{questions.length}</strong>
            </span>
            <span>
              <strong className="text-emerald-400">{answeredCount}</strong> answered ({answeredPercentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Copy/Paste Block Warning Toast */}
      {copyWarningToast && (
        <div className="p-3.5 bg-rose-600 text-white text-xs rounded-2xl shadow-xl flex items-center justify-between font-bold animate-bounce border border-rose-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Copy/Paste is restricted during proctored assessments. Violation has been recorded.</span>
          </div>
        </div>
      )}

      {/* Main Examination Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Question & Options (Span 2) */}
        <div className="lg:col-span-2 space-y-5">
          {currentQ && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 flex flex-col justify-between min-h-[500px]">
              <div className="space-y-5">
                {/* Question Info Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      Q{currentIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Question {currentIdx + 1} of {questions.length}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        currentQ.difficulty === 'Easy'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : currentQ.difficulty === 'Hard'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {currentQ.difficulty || 'Medium'}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      {currentQ.marks || 1} Mark{(currentQ.marks || 1) > 1 ? 's' : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleReview(currentQ._id)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                      markedForReview[currentQ._id]
                        ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        markedForReview[currentQ._id] ? 'fill-amber-600 text-amber-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{markedForReview[currentQ._id] ? 'Marked for Review' : 'Mark for Review'}</span>
                  </button>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {currentQ.questionText}
                </h3>

                {/* Code snippet if present */}
                {currentQ.codeSnippet && (
                  <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                    <pre>{currentQ.codeSnippet}</pre>
                  </div>
                )}

                {/* SQL Schema if present */}
                {currentQ.schemaSql && (
                  <div className="bg-slate-900 text-cyan-300 p-4 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1 uppercase font-sans">Schema SQL:</span>
                    <pre>{currentQ.schemaSql}</pre>
                  </div>
                )}

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Select the correct answer:
                  </span>
                  {currentQ.options?.map((opt, oIdx) => {
                    const isSelected = answers[currentQ._id] === opt;
                    const letter = String.fromCharCode(65 + oIdx);
                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(currentQ._id, opt)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs sm:text-sm ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="leading-relaxed">{opt}</span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Nav Action Bar */}
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  icon={ChevronLeft}
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => prev - 1)}
                  className="font-bold text-xs"
                >
                  Previous
                </Button>

                {answers[currentQ._id] && (
                  <button
                    type="button"
                    onClick={() => handleClearResponse(currentQ._id)}
                    className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1.5 font-semibold transition py-1 px-2.5 rounded-lg hover:bg-rose-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Selection</span>
                  </button>
                )}

                <Button
                  size="sm"
                  variant="primary"
                  icon={ChevronRight}
                  disabled={currentIdx === questions.length - 1}
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="font-bold text-xs"
                >
                  {currentIdx === questions.length - 1 ? 'Last Question' : 'Save & Next'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Palette & Floating Proctoring Widget (Span 1) */}
        <div className="space-y-5">
          {/* Floating Camera Widget if Proctored with Camera enabled */}
          {isProctored && proctorSettings.camera && cameraStream && (
            <div className="bg-slate-900 rounded-3xl p-3 border border-slate-800 shadow-md space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Live Proctoring Active
                  </span>
                </div>
                <Video className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="w-full h-32 rounded-2xl bg-black overflow-hidden relative border border-slate-800">
                <video
                  ref={floatingVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Question Palette */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900">
                Question Palette
              </h4>
              <span className="text-xs font-bold text-slate-400">
                {questions.length} Items
              </span>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2.5 text-[11px] font-semibold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-400 shrink-0" />
                <span>Review ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-blue-600 shrink-0" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-200 shrink-0" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
            </div>

            {/* Palette Numbers Grid */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q._id]);
                const isReview = Boolean(markedForReview[q._id]);
                const isCurrent = currentIdx === idx;

                let btnStyle = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                if (isCurrent) {
                  btnStyle = 'bg-blue-600 text-white font-black ring-2 ring-blue-500/50 shadow-sm';
                } else if (isReview) {
                  btnStyle = 'bg-amber-400 text-slate-950 font-bold border-amber-500 shadow-2xs';
                } else if (isAnswered) {
                  btnStyle = 'bg-emerald-500 text-white font-bold border-emerald-600 shadow-2xs';
                }

                return (
                  <button
                    key={q._id || idx}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-xl border text-xs flex items-center justify-center transition-all ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <Button
              size="md"
              variant="primary"
              icon={Send}
              onClick={() => setConfirmSubmitOpen(true)}
              className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md shadow-emerald-600/20"
            >
              Submit Final Assessment
            </Button>
          </div>
        </div>
      </div>

      {/* Modal: Tab Switch Warning Pop-up */}
      <Modal
        isOpen={tabWarningModalOpen}
        onClose={() => setTabWarningModalOpen(false)}
        title="Proctoring Warning"
      >
        <div className="space-y-4 text-center p-2">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            Window Focus Lost / Tab Switch Detected!
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            You have switched away from the active examination window. All focus changes and tab switches are logged for faculty review.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700">
            Recorded Violations: <span className="text-rose-600 font-black">{violationsCount}</span>
          </div>
          <Button
            variant="primary"
            onClick={() => setTabWarningModalOpen(false)}
            className="w-full justify-center bg-rose-600 hover:bg-rose-700"
          >
            I Understand, Resume Test
          </Button>
        </div>
      </Modal>

      {/* Confirmation Modal Before Final Submit */}
      <Modal
        isOpen={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        title="Submit Assessment?"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Answered</span>
              <span className="text-xl font-black text-emerald-900">{answeredCount}</span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Unanswered</span>
              <span className="text-xl font-black text-slate-800">{unansweredCount}</span>
            </div>
          </div>

          {isProctored && violationsCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Note: {violationsCount} proctoring warning(s) were logged during this attempt.
              </span>
            </div>
          )}

          <p className="text-xs text-slate-600 text-center leading-relaxed">
            Are you sure you want to submit your assessment? Once submitted, your answers will be auto-graded and cannot be edited.
          </p>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmSubmitOpen(false)}
              className="flex-1 justify-center"
            >
              Back to Test
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={handleFinalSubmit}
              className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm & Submit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Exit / Incomplete Test Warning */}
      <Modal
        isOpen={exitWarningModalOpen}
        onClose={() => setExitWarningModalOpen(false)}
        title="Incomplete Assessment Alert"
      >
        <div className="space-y-4 text-center p-2">
          <div className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs border border-amber-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            Please Complete Your Test Before Leaving
          </h3>
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed text-left space-y-1.5">
            <p className="font-bold text-amber-950">Important Notice:</p>
            <p>
              If you cancel or leave this assessment before submitting:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[11px] font-semibold text-amber-800">
              <li>Your current answers and progress will be lost.</li>
              <li>You will be restricted from retaking this assessment for <strong>24 hours</strong>.</li>
            </ul>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => setExitWarningModalOpen(false)}
              className="flex-1 justify-center bg-blue-600 hover:bg-blue-700 font-bold"
            >
              Continue Test
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await api.abandonAssessment({ assessmentId: id });
                } catch (e) {
                  console.error('Error abandoning assessment:', e);
                }
                setExitWarningModalOpen(false);
                if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
                if (screenStream) screenStream.getTracks().forEach((t) => t.stop());
                if (document.fullscreenElement && document.exitFullscreen) {
                  document.exitFullscreen().catch(() => {});
                }
                navigate('/student/assessments');
              }}
              className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs font-bold"
            >
              Abandon & Leave (24h Lock)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TakeAssessmentPage;
