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

export const PsychometricPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [profileRes, testRes] = await Promise.all([
        api.getStudentPsychometricProfile(),
        api.getPsychometricTestById('active')
      ]);

      if (testRes.success && testRes.test) {
        setActiveTest(testRes.test);
        const durationSecs = (testRes.test.durationMinutes || 15) * 60;
        setTimeLeft(durationSecs);
      }

      if (profileRes.success && profileRes.hasProfile) {
        setProfile(profileRes.profile);
        if (profileRes.cooldown) {
          setCooldown(profileRes.cooldown);
        }
        // Candidate has a completed profile: display results and clear any stale in-progress cache
        setTakingTest(false);
        if (testRes?.test?._id) {
          localStorage.removeItem(getStorageKey(testRes.test._id));
        }
      } else if (testRes.success && testRes.test) {
        // Only check localStorage for in-progress attempt if candidate DOES NOT have a completed profile
        const storageKey = getStorageKey(testRes.test._id);
        const savedData = localStorage.getItem(storageKey);

        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed && parsed.takingTest) {
              const elapsedSinceStart = parsed.startedAt ? Math.floor((Date.now() - parsed.startedAt) / 1000) : 0;
              const durationSecs = (testRes.test.durationMinutes || 15) * 60;

              // Only resume if allocated time has not expired
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
            console.error('Error restoring saved psychometric progress:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error loading psychometric data:', err);
    } finally {
      setLoading(false);
    }
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
    // Prevent starting if candidate already has a profile and cooldown is active
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

        // Clear cached progress from localStorage
        if (activeTest) {
          localStorage.removeItem(getStorageKey(activeTest._id));
        }
      }
    } catch (err) {
      console.error('Error submitting psychometric evaluation:', err);
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

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Assessment Header */}
      <AssessmentHeader />

      {/* 2. VIEW: INSTRUCTIONS / LANDING SCREEN (If not taking test and no profile exists) */}
      {!takingTest && !profile && (
        <PsychometricInstructions
          testTitle={activeTest?.title}
          questionCount={totalQuestions || activeTest?.questionCount || 25}
          durationMinutes={activeTest?.durationMinutes || 15}
          onStartAssessment={handleStartAssessment}
        />
      )}

      {/* 3. VIEW: LIVE ASSESSMENT RUNNER */}
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

      {/* 4. VIEW: AI TALENT PROFILE RESULTS (When submitted or previously completed) */}
      {!takingTest && profile && (
        <TalentProfileResult
          profile={profile}
          cooldown={cooldown}
          onRetakeAssessment={handleStartAssessment}
        />
      )}

      {/* 5. Submit Confirmation Modal */}
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

      {/* 6. Exit Assessment Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirmExit={handleConfirmExit}
      />
    </div>
  );
};

export default PsychometricPage;
