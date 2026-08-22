import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../../components/LoadingState';
import AssessmentHeader from '../../components/psychometric/AssessmentHeader';
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

  const questions = activeTest?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIdx] || null;
  const answeredCount = Object.keys(responses).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;

  // Start Assessment Handler
  const handleStartAssessment = () => {
    if (profile && cooldown && cooldown.canRetake === false) {
      return;
    }

    const durationMinutes = activeTest?.durationMinutes || 15;
    const durationSecs = durationMinutes * 60;
    setTimeLeft(durationSecs);
    setTimeSpent(0);
    setCurrentIdx(0);
    setResponses({});
    setMarkedForReview({});
    setTakingTest(true);

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

  // Exit Assessment Handler
  const handleConfirmExit = () => {
    setIsExitModalOpen(false);
    setTakingTest(false);
    if (activeTest) {
      localStorage.removeItem(getStorageKey(activeTest._id));
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
  const unattemptedTests = tests.filter(t => !t.hasAttempted && t._id !== selectedTestId);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Assessment Header */}
      <AssessmentHeader />

      {/* 2. Published Assessments Selector / Catalog (When NOT actively answering questions) */}
      {!takingTest && tests.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Available Psychometric Assessments ({tests.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select an assessment published by administration to start or view your behavioral profile report.
                </p>
              </div>

              {unattemptedTests.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse self-start sm:self-auto">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  {unattemptedTests.length} New Assessment{unattemptedTests.length > 1 ? 's' : ''} Available
                </span>
              )}
            </div>

            {/* Test Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {tests.map((test) => {
                const isSelected = test._id === selectedTestId;
                const hasAttempted = Boolean(test.hasAttempted);
                const isCooldownActive = test.cooldown?.canRetake === false;

                return (
                  <div
                    key={test._id}
                    onClick={() => handleSelectTest(test._id)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 shadow-sm'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 bg-white'
                    }`}
                  >
                    {/* Card Header & Badges */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                          {test.category || 'Behavioral Assessment'}
                        </span>

                        {!hasAttempted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            NEW
                          </span>
                        ) : isCooldownActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Lock className="w-3 h-3 text-amber-600" />
                            24h Cooldown
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Completed
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                        {test.title}
                      </h3>
                    </div>

                    {/* Metadata & Footer Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2 text-[11px] font-medium">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {test.questionCount || test.questionsCount || 25} Qs
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {test.durationMinutes || 15}m
                        </span>
                      </div>

                      <span className={`text-xs font-bold flex items-center gap-1 ${
                        isSelected ? 'text-indigo-600' : 'text-slate-600 group-hover:text-indigo-600'
                      }`}>
                        {!hasAttempted ? 'Take Test' : 'View Report'}
                        <ArrowRight className="w-3 h-3" />
                      </span>
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
        <div className="py-12">
          <LoadingState message="Loading selected psychometric assessment..." />
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
        <div className="max-w-7xl mx-auto space-y-5 px-2 sm:px-4">
          {/* Top Assessment Info Card */}
          <AssessmentInfoCard
            questionCount={totalQuestions}
            durationMinutes={activeTest?.durationMinutes || 15}
            onEndAssessment={() => setIsExitModalOpen(true)}
          />

          {/* Three-Part Main Assessment Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
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

            {/* Right: Question Navigator, Timer, and Progress (4 cols on large screens) */}
            <div className="lg:col-span-4 space-y-4">
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
      />
    </div>
  );
};

export default PsychometricPage;

