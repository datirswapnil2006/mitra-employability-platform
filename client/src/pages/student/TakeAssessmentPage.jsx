import React, { useEffect, useState } from 'react';
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
  Play,
  Award,
  BookOpen,
  FileCheck
} from 'lucide-react';

export const TakeAssessmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [testStarted, setTestStarted] = useState(false);

  // Examination State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(1200); // 20 mins default
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    fetchAssessment();
  }, [id]);

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

  const fetchAssessment = async () => {
    setLoading(true);
    try {
      const res = await api.getAssessmentById(id);
      if (res.success && res.assessment) {
        setAssessment(res.assessment);
        setTimeLeft((res.assessment.timeLimitMinutes || 20) * 60);
      }
    } catch (err) {
      console.error('Error loading assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    setStartTime(Date.now());
    setTestStarted(true);
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
      const formattedAnswers = Object.keys(answers).map((qId) => ({
        questionId: qId,
        studentAnswer: answers[qId]
      }));

      const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

      const res = await api.submitAssessment({
        assessmentId: id,
        timeSpentSeconds,
        answers: formattedAnswers
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
  const unansweredCount = questions.length - answeredCount;

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 1. PRE-TEST INSTRUCTIONS SCREEN
  if (!testStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200/60">
                {assessment.module} • {assessment.category}
              </span>
              <h1 className="text-xl font-black text-slate-900 mt-1">{assessment.title}</h1>
            </div>
          </div>

          {/* Test Meta Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Questions</span>
              <span className="text-lg font-black text-slate-900">{questions.length}</span>
            </div>
            <div className="p-4 bg-blue-50/70 border border-blue-200/70 rounded-2xl">
              <span className="text-[11px] font-bold text-blue-600 block uppercase">Time Duration</span>
              <span className="text-lg font-black text-blue-900">{assessment.timeLimitMinutes || 20} Mins</span>
            </div>
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl">
              <span className="text-[11px] font-bold text-emerald-600 block uppercase">Passing Score</span>
              <span className="text-lg font-black text-emerald-900">{assessment.passingScorePercentage || 70}%</span>
            </div>
          </div>

          {/* Exam Rules & Instructions */}
          <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-xs text-slate-700">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Examination Rules & Instructions:
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 leading-relaxed">
              <li>Each question carries 1 mark with no negative marking.</li>
              <li>You can navigate between questions freely using the Question Palette.</li>
              <li>The test will auto-submit when the countdown timer reaches 00:00.</li>
              <li>Ensure a stable internet connection during the test session.</li>
            </ul>
          </div>

          <Button
            size="lg"
            icon={Play}
            onClick={handleStartTest}
            className="w-full justify-center text-sm font-bold shadow-md shadow-blue-500/20"
          >
            Start Assessment Now
          </Button>
        </div>
      </div>
    );
  }

  // 2. LIVE EXAMINATION TEST ENGINE
  const isTimeCritical = timeLeft < 120; // less than 2 minutes

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Top Examination HUD */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-800/60">
              {assessment.module} • {assessment.category}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Question {currentIdx + 1} of {questions.length}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white line-clamp-1">{assessment.title}</h2>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Live Countdown Timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-black text-sm shadow-inner transition-colors ${
              isTimeCritical
                ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-amber-300'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <Button
            size="sm"
            variant="primary"
            icon={Send}
            onClick={() => setConfirmSubmitOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 font-bold"
          >
            Submit Test
          </Button>
        </div>
      </div>

      {/* Main Examination Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Question & Options (Span 2) */}
        <div className="lg:col-span-2 space-y-5">
          {currentQ && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6 flex flex-col justify-between min-h-[480px]">
              <div className="space-y-4">
                {/* Question Info Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center border border-blue-200/60">
                      Q{currentIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      • {currentQ.difficulty || 'Medium'} ({currentQ.marks || 1} Mark)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleReview(currentQ._id)}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                      markedForReview[currentQ._id]
                        ? 'bg-purple-50 text-purple-700 border-purple-300'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                    <span>{markedForReview[currentQ._id] ? 'Marked for Review' : 'Mark for Review'}</span>
                  </button>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                  {currentQ.questionText}
                </h3>

                {/* Code snippet if present */}
                {currentQ.codeSnippet && (
                  <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner">
                    <pre>{currentQ.codeSnippet}</pre>
                  </div>
                )}

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {currentQ.options?.map((opt, oIdx) => {
                    const isSelected = answers[currentQ._id] === opt;
                    const letter = String.fromCharCode(65 + oIdx);
                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(currentQ._id, opt)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs sm:text-sm ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="leading-relaxed">{opt}</span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Nav Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  icon={ChevronLeft}
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => prev - 1)}
                >
                  Previous
                </Button>

                {answers[currentQ._id] && (
                  <button
                    type="button"
                    onClick={() => handleClearResponse(currentQ._id)}
                    className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold transition"
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
                >
                  Next Question
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Palette (Span 1) */}
        <div className="space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
            <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Question Navigation Palette
            </h4>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 shrink-0" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-purple-600 shrink-0" />
                <span>Marked for Review ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-blue-600 shrink-0" />
                <span>Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300 shrink-0" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
            </div>

            {/* Palette Numbers Grid */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q._id]);
                const isReview = Boolean(markedForReview[q._id]);
                const isCurrent = currentIdx === idx;

                let btnStyle = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                if (isCurrent) {
                  btnStyle = 'bg-blue-600 text-white font-black ring-2 ring-blue-400 shadow-sm';
                } else if (isReview) {
                  btnStyle = 'bg-purple-600 text-white font-bold shadow-xs';
                } else if (isAnswered) {
                  btnStyle = 'bg-emerald-600 text-white font-bold shadow-xs';
                }

                return (
                  <button
                    key={q._id || idx}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-xl border text-xs flex items-center justify-center transition-all ${btnStyle}`}
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
              className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 font-bold"
            >
              Submit Final Assessment
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Submission */}
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
    </div>
  );
};

export default TakeAssessmentPage;
