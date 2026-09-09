import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/Button';
import LoadingState from '../../components/LoadingState';
import Modal from '../../components/Modal';
import { cleanMathExpression } from '../../utils/formatQuestion';
import {
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
  Award,
  BookOpen,
  Sparkles,
  Flame,
  Zap,
  Check,
  Layers,
  ArrowLeft,
  HelpCircle,
  TrendingUp,
  Target
} from 'lucide-react';

export const TopicPracticeRunnerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Route state may pass return topic
  const returnTopic = location.state?.returnTopic;

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState('');

  // Test Running State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins default
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [startTime] = useState(Date.now());

  // Result & XP State
  const [isCompleted, setIsCompleted] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [fullAttempt, setFullAttempt] = useState(null);
  const [gamification, setGamification] = useState(null);

  useEffect(() => {
    loadTest();
  }, [id]);

  const loadTest = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchFn = api.getAssessmentById || api.getAssessmentToTake;
      const res = await fetchFn(id);
      if (res?.success && res?.assessment) {
        setAssessment(res.assessment);
        const durationMins = res.assessment.timeLimitMinutes || (res.assessment.questions?.length || 10);
        setTimeLeft(durationMins * 60);
      } else {
        setError(res?.message || 'Failed to load practice test.');
      }
    } catch (err) {
      setError(err.message || 'Error loading practice test.');
    } finally {
      setLoading(false);
    }
  };

  // Timer Effect
  useEffect(() => {
    if (isCompleted || !assessment || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, assessment, timeLeft]);

  const handleSelectOption = (questionId, optionText) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionText
    }));
  };

  const handleClearAnswer = (questionId) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleSubmitTest = async (auto = false) => {
    if (submitting || isCompleted) return;
    setSubmitting(true);
    setConfirmSubmitOpen(false);

    try {
      const formattedAnswers = assessment.questions.map((q) => ({
        questionId: q._id,
        studentAnswer: answers[q._id] || ''
      }));

      const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

      const submitRes = await api.submitAssessment({
        assessmentId: assessment._id,
        timeSpentSeconds,
        answers: formattedAnswers,
        submissionReason: auto ? 'Time Expired — Auto Submitted' : 'Submitted Normally by Student'
      });

      if (submitRes?.success) {
        setResultData(submitRes);
        setIsCompleted(true);

        if (submitRes.attempt || submitRes.result) {
          setFullAttempt(submitRes.attempt || submitRes.result);
        }

        // Fetch full attempt for question-by-question review
        const targetAttemptId = submitRes.attemptId || submitRes.result?._id || submitRes.attempt?._id;
        if (targetAttemptId) {
          try {
            const attemptRes = await api.getAttemptById(targetAttemptId);
            if (attemptRes?.success && attemptRes.attempt) {
              setFullAttempt(attemptRes.attempt);
            }
          } catch (_) {}
        }

        // Fetch fresh gamification stats (XP, level, streak)
        try {
          const statsRes = await api.getGamificationStats();
          if (statsRes?.success) {
            setGamification(statsRes.stats || statsRes.data);
          }
        } catch (_) {}
      } else {
        alert(submitRes?.message || 'Failed to submit practice test.');
      }
    } catch (err) {
      alert(err.message || 'Error submitting practice test.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReturnToTraining = () => {
    navigate('/student/training');
  };

  if (loading) {
    return <LoadingState message="Preparing your topic practice drill..." />;
  }

  if (error || !assessment) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Unable to Load Practice Test</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'The test could not be found.'}</p>
        <Button variant="primary" onClick={handleReturnToTraining}>
          Back to Training
        </Button>
      </div>
    );
  }

  const questions = assessment.questions || [];
  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  // ==========================================
  // VIEW: COMPLETED RESULT & XP CELEBRATION
  // ==========================================
  if (isCompleted && resultData) {
    const isPractice = assessment.isPracticeTest;
    const score = resultData.score ?? resultData.result?.score ?? resultData.attempt?.score ?? fullAttempt?.score ?? 0;
    const totalMarks = resultData.totalMarks ?? resultData.result?.totalMarks ?? resultData.attempt?.totalMarks ?? fullAttempt?.totalMarks ?? totalQuestions;
    const percentage = resultData.percentage ?? (totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0);
    const status = resultData.status || (percentage >= 70 ? 'PASSED' : 'FAILED');

    const earnedXP = isPractice ? 20 : (status === 'PASSED' ? 40 : 10);
    const highScoreBonus = percentage >= 80 ? 15 : 0;
    const totalAwarded = earnedXP + highScoreBonus;

    return (
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleReturnToTraining}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Training Topics</span>
          </button>
          <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
            {assessment.topic || 'Topic Practice'}
          </span>
        </div>

        {/* Hero Celebration Card */}
        <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                Practice Drill Completed
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                {status === 'PASSED' || percentage >= 60 ? 'Awesome Work!' : 'Good Effort!'}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/80 max-w-md">
                You tested your knowledge on <span className="text-white font-bold">{assessment.topic || assessment.title}</span> using authentic questions from the Question Bank.
              </p>
            </div>

            {/* Score & XP Floating Badges */}
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[100px]">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-200">Score</span>
                <span className="text-2xl font-black text-white">
                  {score}/{totalMarks}
                </span>
                <span className="block text-[10px] font-semibold text-emerald-300">
                  {percentage}%
                </span>
              </div>

              <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/30 backdrop-blur-md p-4 rounded-2xl border border-amber-400/40 text-center min-w-[110px]">
                <span className="block text-[10px] font-black uppercase tracking-wider text-amber-200 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  XP Earned
                </span>
                <span className="text-2xl font-black text-amber-300">
                  +{totalAwarded} XP
                </span>
                <span className="block text-[10px] font-bold text-amber-200/80">
                  {highScoreBonus > 0 ? '+15 Bonus Included' : 'Level Up Progress'}
                </span>
              </div>
            </div>
          </div>

          {/* Gamification Progress Strip */}
          {gamification && (
            <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/10">
                <Flame className="w-5 h-5 text-amber-400 fill-current" />
                <div>
                  <span className="block text-[10px] font-bold text-blue-200 uppercase">Streak</span>
                  <span className="text-xs font-black text-white">{gamification.currentStreak || gamification.streak || 1} Day Streak Active!</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/10">
                <Award className="w-5 h-5 text-blue-300" />
                <div>
                  <span className="block text-[10px] font-bold text-blue-200 uppercase">Level</span>
                  <span className="text-xs font-black text-white">Level {gamification.level || 1} Scholar</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/10">
                <Zap className="w-5 h-5 text-emerald-400 fill-current" />
                <div>
                  <span className="block text-[10px] font-bold text-blue-200 uppercase">Total XP</span>
                  <span className="text-xs font-black text-white">{gamification.totalXP || 0} XP Accumulated</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">
            Review detailed question explanations below to deepen your understanding.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={() => navigate('/student/training')}
            >
              Back to Topic
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => navigate('/student/training')}
            >
              Practice Next Topic
            </Button>
          </div>
        </div>

        {/* Question-by-Question Review with Explanations */}
        {fullAttempt?.answers && (
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Detailed Solutions & Explanations ({fullAttempt.answers.length} Questions)
            </h3>

            <div className="space-y-4">
              {fullAttempt.answers.map((ans, idx) => (
                <div
                  key={idx}
                  className={`bg-white p-5 rounded-2xl border transition-all ${
                    ans.isCorrect
                      ? 'border-emerald-200 shadow-xs'
                      : 'border-rose-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-black text-slate-400">
                      Question {idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border flex items-center gap-1 ${
                        ans.isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {ans.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Correct (+{ans.marksAwarded || 1} pt)
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Incorrect
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-900 mb-3 leading-snug">
                    {cleanMathExpression(ans.questionText)}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        ans.isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <span>
                        <span className="font-bold">Your Answer: </span>
                        {ans.studentAnswer || <span className="italic text-slate-400">Skipped</span>}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-800">
                      <span className="font-bold">Correct Answer: </span>
                      <span className="text-emerald-700 font-bold">{ans.correctAnswer}</span>
                    </div>
                  </div>

                  {ans.explanation && (
                    <div className="mt-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                      <span className="font-black text-slate-900 flex items-center gap-1 mb-1">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                        Explanation:
                      </span>
                      {cleanMathExpression(ans.explanation)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: ACTIVE PRACTICE TEST RUNNER
  // ==========================================
  return (
    <div className="max-w-4xl mx-auto py-3 px-3 sm:px-4 space-y-3">
      {/* 1. STICKY TOP CONTROL DECK (Always visible - Never scrolls out of view!) */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />

        {/* Row 1: Brand, Title, Live Timer, Submit */}
        <div className="px-3.5 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setExitModalOpen(true)}
              className="w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition shrink-0 cursor-pointer"
              title="Exit practice test"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200/60">
                  {assessment.isPracticeTest ? 'Practice Drill' : 'Baseline Test'}
                </span>
                <span className="text-[11px] font-bold text-slate-500 truncate hidden sm:inline">
                  {assessment.topic || 'Topic'}
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">
                {assessment.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Live Countdown Timer Badge - Always pinned and visible! */}
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-black shadow-xs transition-colors ${
                timeLeft < 180
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}
              title="Time Remaining"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeLeft < 180 ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${timeLeft < 180 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
              </span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono tracking-wide">{formatTimer(timeLeft)}</span>
            </div>

            <Button
              size="sm"
              variant="primary"
              icon={Send}
              onClick={() => setConfirmSubmitOpen(true)}
              className="py-1.5 px-3 text-xs"
            >
              Submit
            </Button>
          </div>
        </div>

        {/* Row 2: Compact Question Navigator + Progress Bar */}
        <div className="px-3.5 py-2 sm:px-5 bg-slate-50/50 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <span>Question <strong className="text-blue-600 font-black">{currentIdx + 1}</strong> of {totalQuestions}</span>
            </span>
            <span className="font-semibold text-slate-500">
              <span className="text-emerald-700 font-bold">{answeredCount}</span> answered • <span className="text-slate-400">{totalQuestions - answeredCount}</span> remaining
            </span>
          </div>

          {/* Micro Progress Bar */}
          <div className="w-full bg-slate-200/80 rounded-full h-1 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.round((answeredCount / totalQuestions) * 100)}%` }}
            />
          </div>

          {/* Clickable Question Navigator Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q._id]);
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q._id}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-black transition-all shrink-0 flex items-center justify-center border relative cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30 scale-105'
                      : isAnswered
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold hover:bg-emerald-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                  {isAnswered && !isCurrent && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-600 rounded-full ring-1 ring-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. COMPACT CURRENT QUESTION CARD */}
      {currentQ && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          {/* Meta strip */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-black uppercase tracking-wider border border-blue-100">
                Question #{currentIdx + 1}
              </span>
              {currentQ.difficulty && (
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  String(currentQ.difficulty).toLowerCase() === 'hard'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : String(currentQ.difficulty).toLowerCase() === 'medium'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {currentQ.difficulty}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
              {currentQ.marks || 1} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
            </span>
          </div>

          {/* Question Prompt */}
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {cleanMathExpression(currentQ.questionText)}
          </h3>

          {/* Options Grid */}
          <div className="space-y-2 pt-1">
            {currentQ.options?.map((opt, oIdx) => {
              const optText = typeof opt === 'object' ? (opt.text || opt.title) : opt;
              const letter = String.fromCharCode(65 + oIdx);
              const isSelected = answers[currentQ._id] === optText;

              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelectOption(currentQ._id, optText)}
                  className={`w-full text-left p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-between gap-3 border-2 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-600 text-blue-950 shadow-xs'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:border-blue-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className={`leading-snug ${isSelected ? 'font-bold text-blue-950' : 'font-medium text-slate-800'}`}>
                      {optText}
                    </span>
                  </div>

                  {/* Radio Checkmark Circle */}
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Card Footer Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => i - 1)}
              >
                Previous
              </Button>
              {answers[currentQ._id] && (
                <button
                  type="button"
                  onClick={() => handleClearAnswer(currentQ._id)}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 transition px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                >
                  Clear choice
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentIdx < totalQuestions - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentIdx((i) => i + 1)}
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Send}
                  onClick={() => setConfirmSubmitOpen(true)}
                >
                  Submit Drill
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        title="Submit Practice Test?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            You have answered <span className="font-bold text-slate-900">{answeredCount}</span> of{' '}
            <span className="font-bold text-slate-900">{totalQuestions}</span> questions.
            {answeredCount < totalQuestions && (
              <span className="text-amber-600 block mt-1 font-semibold">
                You have {totalQuestions - answeredCount} unanswered questions.
              </span>
            )}
          </p>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-800 font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-current shrink-0" />
            <span>Submitting will instantly award +20 XP to your profile!</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmSubmitOpen(false)} disabled={submitting}>
              Keep Practicing
            </Button>
            <Button variant="primary" size="sm" icon={Send} loading={submitting} onClick={() => handleSubmitTest(false)}>
              Submit & Claim XP
            </Button>
          </div>
        </div>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={exitModalOpen}
        onClose={() => setExitModalOpen(false)}
        title="Leave Practice Test?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to exit? Your answers in this drill will not be submitted, but there is no penalty or lockout.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setExitModalOpen(false)}>
              Stay in Drill
            </Button>
            <Button variant="danger" size="sm" onClick={handleReturnToTraining}>
              Exit Drill
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TopicPracticeRunnerPage;
