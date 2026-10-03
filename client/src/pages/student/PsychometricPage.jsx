import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import AssessmentInfoCard from '../../components/psychometric/AssessmentInfoCard';
import QuestionCard from '../../components/psychometric/QuestionCard';
import QuestionNavigator from '../../components/psychometric/QuestionNavigator';
import AssessmentProgress from '../../components/psychometric/AssessmentProgress';
import AssessmentTimer from '../../components/psychometric/AssessmentTimer';
import AssessmentActions from '../../components/psychometric/AssessmentActions';
import SubmitConfirmationModal from '../../components/psychometric/SubmitConfirmationModal';
import ExitConfirmationModal from '../../components/psychometric/ExitConfirmationModal';
import PsychometricInstructions from '../../components/psychometric/PsychometricInstructions';
import TalentProfileResult from '../../components/psychometric/TalentProfileResult';
import { Sparkles, Layers, CheckCircle2, Clock, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { useFullscreen } from '../../utils/fullscreen';
import { useAssessmentSession } from '../../context/AssessmentSessionContext';

export const PsychometricPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [switchingTest, setSwitchingTest] = useState(false);
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [activeTest, setActiveTest] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cooldown, setCooldown] = useState(null);
  const [takingTest, setTakingTest] = useState(false);

  // Fullscreen option controller
  const { isFullscreen, toggleFullscreen, enterFullscreen: triggerFullscreen, exitFullscreen: leaveFullscreen } = useFullscreen();

  // Active assessment session controller (auto-closes sidebar & protects navigation with 24h lock)
  const { startSession, endSession } = useAssessmentSession();

  // Live Assessment State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState({}); // { [qId]: answer }
  const [markedForReview, setMarkedForReview] = useState({}); // { [qId]: boolean }
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins default
  const [timeSpent, setTimeSpent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  // Storage key helper for auto-save
  const getStorageKey = useCallback((testId) => {
    const userId = user?._id || user?.id || 'candidate';
    return `mitra_psychometric_progress_${userId}_${testId || 'active'}`;
  }, [user]);

  // 1. Initial Data Fetch: Load all published tests and select active test
  useEffect(() => {
    fetchInitialData();
    return () => {
      endSession();
    };
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const testsRes = await api.getPsychometricTests();
      let publishedTests = [];
      if (testsRes.success && Array.isArray(testsRes.tests)) {
        publishedTests = testsRes.tests;
        setTests(publishedTests);
      }

      // Determine initial test to select:
      // Priority 1: First unattempted test (newly published)
      // Priority 2: First test in list
      let initialTest = publishedTests.find(t => !t.hasAttempted) || publishedTests[0];

      if (initialTest) {
        setSelectedTestId(initialTest._id);
        await loadTestDetails(initialTest._id, initialTest);
      } else {
        // Fallback to active single test endpoint
        const testRes = await api.getPsychometricTestById('active');
        if (testRes.success && testRes.test) {
          setActiveTest(testRes.test);
          setSelectedTestId(testRes.test._id);
          const profileRes = await api.getStudentPsychometricProfile(testRes.test._id);
          if (profileRes.success && profileRes.hasProfile) {
            setProfile(profileRes.profile);
            setCooldown(profileRes.cooldown || null);
          }
        }
      }
    } catch (err) {
      console.error('Error loading psychometric initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load specific test details & student profile for that test
  const loadTestDetails = async (testId, testMeta = null) => {
    setSwitchingTest(true);
    try {
      const [testRes, profileRes] = await Promise.all([
        api.getPsychometricTestById(testId),
        api.getStudentPsychometricProfile(testId)
      ]);

      if (testRes.success && testRes.test) {
        setActiveTest(testRes.test);
        const durationSecs = (testRes.test.durationMinutes || 15) * 60;
        setTimeLeft(durationSecs);
      }

      if (profileRes.success && profileRes.hasProfile) {
        setProfile(profileRes.profile);
        setCooldown(profileRes.cooldown || null);
        setTakingTest(false);
        localStorage.removeItem(getStorageKey(testId));
      } else {
        setProfile(null);
        setCooldown(null);

        // Check if there is an in-progress local storage attempt for this specific test
        const storageKey = getStorageKey(testId);
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed && parsed.takingTest) {
              const elapsedSinceStart = parsed.startedAt ? Math.floor((Date.now() - parsed.startedAt) / 1000) : 0;
              const durationSecs = ((testRes?.test?.durationMinutes) || 15) * 60;
              if (elapsedSinceStart < durationSecs) {
                setResponses(parsed.responses || {});
                setMarkedForReview(parsed.markedForReview || {});
                setCurrentIdx(parsed.currentIdx || 0);
                setTimeSpent(parsed.timeSpent || 0);
                setTimeLeft(Math.max(0, durationSecs - elapsedSinceStart));
                setTakingTest(true);
              } else {
                localStorage.removeItem(storageKey);
                setTakingTest(false);
              }
            }
          } catch (e) {
            console.error('Error restoring progress:', e);
          }
        } else {
          setTakingTest(false);
        }
      }
    } catch (err) {
      console.error('Error loading test details:', err);
    } finally {
      setSwitchingTest(false);
    }
  };

  // Handle switching selected assessment
  const handleSelectTest = async (testId) => {
    if (takingTest) {
      if (!window.confirm('You are currently taking an assessment. Switching will leave the current session. Continue?')) {
        return;
      }
    }
    setSelectedTestId(testId);
    await loadTestDetails(testId);
  };

  // 2. Auto-save progress to localStorage on any state change
  useEffect(() => {
    if (!takingTest || !activeTest) return;

    const storageKey = getStorageKey(activeTest._id);
    const stateToSave = {
      takingTest: true,
      currentIdx,
      responses,
      markedForReview,
      timeSpent,
      startedAt: Date.now() - (timeSpent * 1000)
    };

    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [takingTest, activeTest, currentIdx, responses, markedForReview, timeSpent, getStorageKey]);

  // 3. Timer Countdown Engine
  useEffect(() => {
    if (!takingTest || submitting) return;

    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [takingTest, timeLeft, submitting]);

  // 3b. Intercept Browser Back Navigation (Tab Arrow) and Tab Unload during active test
  useEffect(() => {
    if (!takingTest || submitting) return;

    // Push dummy state to browser history so pressing the back arrow fires popstate rather than exiting immediately
    window.history.pushState({ inPsychometricTest: true }, '');

    const handlePopState = (e) => {
      e.preventDefault();
      // Keep user in page history
      window.history.pushState({ inPsychometricTest: true }, '');
      setIsExitModalOpen(true);
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Please complete your psychometric assessment before leaving. If you exit or navigate away, your assessment will be locked for 24 hours.';
      return e.returnValue;
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [takingTest, submitting]);

  const questions = activeTest?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIdx] || null;
  const answeredCount = Object.keys(responses).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;

  // Start Assessment Handler
  const handleStartAssessment = async () => {
    if (profile && cooldown && cooldown.canRetake === false) {
      return;
    }

    // Default to Fullscreen mode
    try {
      await triggerFullscreen();
    } catch (_) {}

    const durationMinutes = activeTest?.durationMinutes || 15;
    const durationSecs = durationMinutes * 60;
    setTimeLeft(durationSecs);
    setTimeSpent(0);
    setCurrentIdx(0);
    setResponses({});
    setMarkedForReview({});
    setTakingTest(true);

    // Register active session to auto-close sidebar & guard navigation with 24h lock
    startSession({
      assessmentId: activeTest?._id,
      assessmentTitle: activeTest?.title || 'Psychometric Assessment',
      isPractice: false,
      requires24hLock: true,
      onSubmit: async () => {
        await handleFinalSubmit();
      },
      onAbandon: async () => {
        await handleConfirmExit();
      }
    });

    if (activeTest) {
      const storageKey = getStorageKey(activeTest._id);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          takingTest: true,
          currentIdx: 0,
          responses: {},
          markedForReview: {},
          timeSpent: 0,
          startedAt: Date.now()
        })
      );
    }
  };

  // Handle Response Selection
  const handleSelectAnswer = (questionId, value) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Toggle Mark for Review
  const handleToggleMarkReview = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.questionId;
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Navigation Handlers
  const handlePrevious = () => {
    setCurrentIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1));
  };

  const handleSelectQuestion = (idx) => {
    setCurrentIdx(idx);
  };

  const handleReviewUnanswered = () => {
    setIsSubmitModalOpen(false);
    const firstUnansweredIndex = questions.findIndex(
      (q) => responses[q.questionId] === undefined || responses[q.questionId] === ''
    );
    if (firstUnansweredIndex !== -1) {
      setCurrentIdx(firstUnansweredIndex);
    }
  };

  // Exit / Abandon Assessment Handler (Enforces 24-hour lockout)
  const handleConfirmExit = async () => {
    endSession();
    try {
      await leaveFullscreen();
    } catch (_) {}
    setIsExitModalOpen(false);
    setSubmitting(true);
    try {
      if (activeTest?._id) {
        localStorage.removeItem(getStorageKey(activeTest._id));
        const res = await api.abandonPsychometricAttempt(activeTest._id, {
          timeSpentSeconds: timeSpent,
          responses
        });
        if (res.success && res.cooldown) {
          setCooldown(res.cooldown);
          setProfile(res.attempt || {
            testTitle: activeTest.title,
            isAbandoned: true,
            submittedAt: new Date()
          });
        }
      }
      setTakingTest(false);

      // Refresh test list status to display 24h Cooldown badge
      const testsRes = await api.getPsychometricTests();
      if (testsRes.success && Array.isArray(testsRes.tests)) {
        setTests(testsRes.tests);
      }
    } catch (err) {
      console.error('Error abandoning psychometric assessment:', err);
      setTakingTest(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    if (submitting) return;
    setIsSubmitModalOpen(false);
    setSubmitting(true);

    try {
      const formattedResponses = questions.map((q) => ({
        questionId: q.questionId,
        questionText: q.questionText,
        competency: q.competency,
        questionType: q.questionType,
        answer:
          responses[q.questionId] !== undefined
            ? responses[q.questionId]
            : q.questionType === 'LIKERT'
            ? 3
            : 'Neutral'
      }));

      const res = await api.submitPsychometricAttempt(activeTest?._id, {
        responses: formattedResponses,
        timeSpentSeconds: timeSpent
      });

      if (res.success && (res.attempt || res.profile)) {
        endSession();
        try {
          await leaveFullscreen();
        } catch (_) {}
        setProfile(res.attempt || res.profile);
        setCooldown({
          canRetake: false,
          lastAttemptAt: new Date(),
          nextRetakeAvailableAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          remainingHours: 24,
          remainingMinutes: 0
        });
        setTakingTest(false);

        // Clear cached progress
        if (activeTest) {
          localStorage.removeItem(getStorageKey(activeTest._id));
        }

        // Refresh test list status
        const testsRes = await api.getPsychometricTests();
        if (testsRes.success && Array.isArray(testsRes.tests)) {
          setTests(testsRes.tests);
        }
      } else {
        if (res.message) {
          alert(res.message);
        }
        if (activeTest?._id) {
          localStorage.removeItem(getStorageKey(activeTest._id));
          await loadTestDetails(activeTest._id);
        }
        setTakingTest(false);
      }
    } catch (err) {
      console.error('Error submitting psychometric evaluation:', err);
      alert('Failed to submit assessment: ' + (err.message || 'Server error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Connecting to MITRA AI Psychometric Engine..." />;
  }

  // Timer Warning States
  const isTimeCritical = timeLeft <= 60; // 1 min critical
  const isTimeWarning = timeLeft > 60 && timeLeft <= 300; // 5 mins warning

  // Check if there are other unattempted tests
  const unattemptedTests = tests.filter((t) => !t.hasAttempted && t._id !== selectedTestId);

  // Calculate quick summary metrics
  const completedTestsCount = tests.filter((t) => t.hasAttempted).length;
  const pendingTestsCount = Math.max(0, tests.length - completedTestsCount);

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header & Executive Stats Ribbon (When NOT actively taking test) */}
      {!takingTest && (
        <div className="space-y-4">
          <PageHeader
            title="Psychometric & Behavioral Evaluation"
            subtitle="AI-driven situational judgment tests and behavioral profiling to map your workplace competencies."
            breadcrumbs={[
              { label: 'Student Ecosystem', link: '/student/dashboard' },
              { label: 'Psychometric' }
            ]}
          />

          {/* Executive Diagnostic Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Available Tests</p>
                <p className="text-base sm:text-lg font-black text-slate-900">{tests.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Completed Reports</p>
                <p className="text-base sm:text-lg font-black text-slate-900">{completedTestsCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Pending Tests</p>
                <p className="text-base sm:text-lg font-black text-slate-900">{pendingTestsCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-purple-600">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">AI Competencies</p>
                <p className="text-base sm:text-lg font-black text-slate-900">10 Core Dimensions</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Published Assessments Selector / Catalog (When NOT actively answering questions) */}
      {!takingTest && tests.length > 0 && (
        <div className="w-full">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Assessment Catalog & Diagnostic Modules
                  </h2>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {tests.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Select an assessment to begin your evaluation or review your previously generated talent intelligence profile.
                </p>
              </div>

              {unattemptedTests.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  {unattemptedTests.length} New Assessment{unattemptedTests.length > 1 ? 's' : ''} Ready
                </span>
              )}
            </div>

            {/* Test Cards List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {tests.map((test) => {
                const isSelected = test._id === selectedTestId;
                const hasAttempted = Boolean(test.hasAttempted);
                const isCooldownActive = test.cooldown?.canRetake === false;

                return (
                  <div
                    key={test._id}
                    onClick={() => handleSelectTest(test._id)}
                    className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${
                      isSelected
                        ? 'border-indigo-600 bg-gradient-to-b from-indigo-50/50 via-white to-white ring-2 ring-indigo-600/20 shadow-md shadow-indigo-600/5'
                        : 'border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/60 bg-white shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    {/* Active Selected Marker Ribbon */}
                    {isSelected && (
                      <div className="absolute -top-px left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-indigo-600 to-transparent" />
                    )}

                    {/* Card Header & Badges */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/80">
                          {test.category || 'Behavioral Test'}
                        </span>

                        {!hasAttempted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            NEW
                          </span>
                        ) : isCooldownActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Lock className="w-3 h-3 text-amber-600" />
                            24h Lock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Completed
                          </span>
                        )}
                      </div>

                      <h3 className={`text-sm font-extrabold line-clamp-2 transition-colors ${
                        isSelected ? 'text-indigo-950' : 'text-slate-900 group-hover:text-indigo-600'
                      }`}>
                        {test.title}
                      </h3>

                      {test.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 font-medium leading-relaxed">
                          {test.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata & Footer Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {test.questionCount || test.questionsCount || 25} Qs
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {test.durationMinutes || 15}m
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-black flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'text-indigo-600'
                            : 'text-slate-600 group-hover:text-indigo-600'
                        }`}>
                          {!hasAttempted ? 'Start' : 'View Report'}
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Loading state during test switch */}
      {switchingTest && (
        <div className="py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <LoadingState message="Configuring selected psychometric assessment..." />
        </div>
      )}

      {/* 3. VIEW: INSTRUCTIONS / LANDING SCREEN (If not taking test and no profile exists for this test) */}
      {!switchingTest && !takingTest && !profile && (
        <PsychometricInstructions
          testTitle={activeTest?.title}
          questionCount={totalQuestions || activeTest?.questionCount || 25}
          durationMinutes={activeTest?.durationMinutes || 15}
          onStartAssessment={handleStartAssessment}
        />
      )}

      {/* 4. VIEW: LIVE ASSESSMENT RUNNER */}
      {takingTest && currentQuestion && (
        <div className="w-full space-y-5 animate-in fade-in duration-200">
          {/* Proctoring Focus Mode Indicator */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-sm border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-extrabold uppercase tracking-wider text-[11px] text-indigo-300">
                Live Psychometric Assessment
              </span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <span className="text-slate-300 hidden sm:inline text-[11px]">
                Responses auto-saved in real-time. Do not navigate away or refresh.
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              Item {currentIdx + 1} of {totalQuestions}
            </span>
          </div>

          {/* Top Assessment Info Card */}
          <AssessmentInfoCard
            testTitle={activeTest?.title}
            questionCount={totalQuestions}
            durationMinutes={activeTest?.durationMinutes || 15}
            onEndAssessment={() => setIsExitModalOpen(true)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />

          {/* Three-Part Main Assessment Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start">
            {/* Center: Main Question Interaction Area (8 cols on large screens) */}
            <div className="lg:col-span-8 space-y-4">
              <QuestionCard
                question={currentQuestion}
                currentIndex={currentIdx}
                totalQuestions={totalQuestions}
                answeredCount={answeredCount}
                selectedAnswer={responses[currentQuestion.questionId]}
                onSelectAnswer={handleSelectAnswer}
              />

              {/* Bottom Actions Bar */}
              <AssessmentActions
                currentIndex={currentIdx}
                totalQuestions={totalQuestions}
                isMarked={Boolean(markedForReview[currentQuestion.questionId])}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onToggleMarkReview={handleToggleMarkReview}
                onSubmitClick={() => setIsSubmitModalOpen(true)}
              />
            </div>

            {/* Right: Question Navigator, Timer, and Progress (4 cols on large screens, sticky for easy access) */}
            <div className="lg:col-span-4 space-y-4 sticky top-6">
              {/* Timer HUD */}
              <AssessmentTimer
                timeLeftSeconds={timeLeft}
                isCritical={isTimeCritical}
                isWarning={isTimeWarning}
              />

              {/* Question Navigator Grid */}
              <QuestionNavigator
                questions={questions}
                currentIndex={currentIdx}
                responses={responses}
                markedForReview={markedForReview}
                onSelectQuestion={handleSelectQuestion}
              />

              {/* Progress Overview Card */}
              <AssessmentProgress
                totalQuestions={totalQuestions}
                answeredCount={answeredCount}
                markedCount={markedCount}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW: AI TALENT PROFILE RESULTS (When submitted or previously completed for this test) */}
      {!switchingTest && !takingTest && profile && (
        <TalentProfileResult
          profile={profile}
          cooldown={cooldown}
          availableTests={tests}
          selectedTestId={selectedTestId}
          onSelectTest={handleSelectTest}
          onRetakeAssessment={handleStartAssessment}
        />
      )}

      {/* 6. Submit Confirmation Modal */}
      <SubmitConfirmationModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        markedCount={markedCount}
        submitting={submitting}
        onReviewUnanswered={handleReviewUnanswered}
        onFinalSubmit={handleFinalSubmit}
      />

      {/* 7. Exit Assessment Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirmExit={handleConfirmExit}
        submitting={submitting}
      />
    </div>
  );
};

export default PsychometricPage;

