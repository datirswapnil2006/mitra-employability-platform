import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Modal from '../Modal';
import Button from '../Button';
import StatusBadge from '../StatusBadge';
import {
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Award,
  BookOpen,
  Sparkles,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Printer,
  FileCheck,
  Bookmark,
  Send,
  Camera,
  Monitor,
  Maximize2,
  Copy,
  Smartphone,
  Users,
  Check,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  Layers
} from 'lucide-react';

export const AssessmentPreviewModal = ({
  isOpen,
  onClose,
  assessment,
  onStatusChange
}) => {
  const [activeTab, setActiveTab] = useState('inspector'); // 'inspector' | 'simulator'
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [localAssessment, setLocalAssessment] = useState(assessment);

  // Simulator State
  const [simStarted, setSimStarted] = useState(false);
  const [simQuestionIdx, setSimQuestionIdx] = useState(0);
  const [simAnswers, setSimAnswers] = useState({});
  const [simMarked, setSimMarked] = useState({});
  const [simTimeLeft, setSimTimeLeft] = useState(1200);
  const [simSubmitted, setSimSubmitted] = useState(false);
  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    if (isOpen && assessment) {
      setLocalAssessment(assessment);
      setActiveTab('inspector');
      setSelectedQuestionIdx(0);
      resetSimulator(assessment);
    }
  }, [isOpen, assessment]);

  const resetSimulator = (testData) => {
    const test = testData || localAssessment;
    const initialSeconds = (test?.timeLimitMinutes || 20) * 60;
    setSimStarted(false);
    setSimQuestionIdx(0);
    setSimAnswers({});
    setSimMarked({});
    setSimTimeLeft(initialSeconds);
    setSimSubmitted(false);
    setSimResult(null);
  };

  // Simulator live countdown
  useEffect(() => {
    if (!isOpen || activeTab !== 'simulator' || !simStarted || simSubmitted) return;

    if (simTimeLeft <= 0) {
      handleSimSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSimTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, activeTab, simStarted, simSubmitted, simTimeLeft]);

  if (!isOpen || !localAssessment) return null;

  const questions = localAssessment.questions || [];
  const currentQ = questions[selectedQuestionIdx] || questions[0];
  const isProctored = localAssessment.assessmentMode === 'PROCTORED';
  const proctorSettings = localAssessment.proctoringSettings || {};

  // Status Toggle (Draft <-> Published)
  const handleToggleStatus = async () => {
    const nextStatus = localAssessment.status === 'published' ? 'draft' : 'published';
    setUpdatingStatus(true);
    try {
      const res = await api.updateAssessment(localAssessment._id, { status: nextStatus });
      if (res.success && res.assessment) {
        setLocalAssessment(res.assessment);
        if (onStatusChange) {
          onStatusChange(res.assessment);
        }
      }
    } catch (err) {
      console.error('Error toggling assessment status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Simulator actions
  const handleSimSelectOption = (qIdx, opt) => {
    setSimAnswers((prev) => ({
      ...prev,
      [qIdx]: opt
    }));
  };

  const handleSimClearOption = (qIdx) => {
    setSimAnswers((prev) => {
      const updated = { ...prev };
      delete updated[qIdx];
      return updated;
    });
  };

  const handleSimToggleReview = (qIdx) => {
    setSimMarked((prev) => ({
      ...prev,
      [qIdx]: !prev[qIdx]
    }));
  };

  const handleSimSubmit = () => {
    let score = 0;
    let totalMarks = 0;
    const breakdown = questions.map((q, idx) => {
      const chosen = simAnswers[idx] || '';
      const marks = q.marks || 1;
      totalMarks += marks;
      const isCorrect = chosen.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
      if (isCorrect) score += marks;
      return {
        questionIdx: idx,
        questionText: q.questionText,
        chosen,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        marksAwarded: isCorrect ? marks : 0,
        totalMarks: marks
      };
    });

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const passThreshold = localAssessment.passingScorePercentage || 70;
    const isPassed = percentage >= passThreshold;

    setSimResult({
      score,
      totalMarks,
      percentage,
      isPassed,
      passThreshold,
      answeredCount: Object.keys(simAnswers).length,
      unansweredCount: Math.max(0, questions.length - Object.keys(simAnswers).length),
      breakdown
    });
    setSimSubmitted(true);
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Print Question Paper View
  const handlePrintPaper = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const questionsHtml = questions
      .map((q, i) => {
        const optionsHtml = (q.options || [])
          .map(
            (opt, oIdx) => `
          <div style="margin-left: 20px; margin-bottom: 4px;">
            <strong>(${String.fromCharCode(65 + oIdx)})</strong> ${opt}
          </div>
        `
          )
          .join('');

        return `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
          <div style="font-weight: bold; margin-bottom: 8px;">
            Q${i + 1}. ${q.questionText} <span style="float: right; font-size: 12px; color: #666;">[${q.marks || 1} Mark]</span>
          </div>
          ${q.codeSnippet ? `<pre style="background: #f4f4f5; padding: 8px; border-radius: 4px; font-size: 12px;">${q.codeSnippet}</pre>` : ''}
          ${optionsHtml}
          <div style="margin-top: 8px; font-size: 12px; color: #047857; background: #ecfdf5; padding: 6px 10px; border-radius: 4px; border-left: 3px solid #10b981;">
            <strong>Answer:</strong> ${q.correctAnswer}
            ${q.explanation ? `<br/><span style="color: #4b5563;"><em>Explanation:</em> ${q.explanation}</span>` : ''}
          </div>
        </div>
      `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${localAssessment.title} — MITRA Assessment Paper</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; font-size: 14px; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .badge { display: inline-block; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0 0 8px 0; font-size: 22px;">${localAssessment.title}</h1>
            <div>
              <span class="badge">${localAssessment.module}</span>
              <span class="badge">${localAssessment.category || 'General'}</span>
              ${localAssessment.topic ? `<span class="badge">Topic: ${localAssessment.topic}</span>` : ''}
              <span style="float: right; font-weight: bold;">
                Questions: ${questions.length} | Time: ${localAssessment.timeLimitMinutes || 20} mins | Pass Mark: ${localAssessment.passingScorePercentage || 70}%
              </span>
            </div>
          </div>
          ${questionsHtml}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-5xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-none">
              Assessment Preview & Review
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              Institutional Evaluation Inspector
            </span>
          </div>
        </div>
      }
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              icon={Printer}
              onClick={handlePrintPaper}
              className="text-xs font-semibold rounded-xl border-slate-300 hover:bg-slate-50"
            >
              Print Question Paper
            </Button>
            <Button
              size="sm"
              variant={localAssessment.status === 'published' ? 'outline' : 'success'}
              loading={updatingStatus}
              onClick={handleToggleStatus}
              icon={localAssessment.status === 'published' ? ToggleRight : ToggleLeft}
              className={`text-xs font-bold rounded-xl ${
                localAssessment.status === 'published'
                  ? 'text-amber-700 border-amber-300 hover:bg-amber-50'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }`}
            >
              {localAssessment.status === 'published' ? 'Convert to Draft' : 'Publish Test'}
            </Button>
          </div>

          <Button size="sm" variant="outline" onClick={onClose} className="text-xs font-bold rounded-xl border-slate-300 hover:bg-slate-50">
            Close Preview
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Assessment Overview Card */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200/80 shadow-2xs">
                  {localAssessment.module}
                </span>
                <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                  {localAssessment.category || 'General'}
                </span>
                {localAssessment.department && (
                  <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {localAssessment.department}
                  </span>
                )}
                {localAssessment.topic && (
                  <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200/80 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-violet-500" />
                    {localAssessment.topic}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    localAssessment.difficulty === 'Easy'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : localAssessment.difficulty === 'Hard'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {localAssessment.difficulty || 'Medium'}
                </span>
                {isProctored ? (
                  <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/80 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Proctored Mode
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Normal Mode
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-slate-900">{localAssessment.title}</h2>
              {localAssessment.description && (
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {localAssessment.description}
                </p>
              )}
            </div>

            <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
              <StatusBadge status={localAssessment.status || 'published'} />
              {localAssessment.isAIGenerated && (
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  AI ({localAssessment.aiProvider || 'Gemini'})
                </span>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center">
            <div className="bg-white/80 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Questions</span>
              <span className="text-sm font-black text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                {questions.length}
              </span>
            </div>
            <div className="bg-white/80 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Time Limit</span>
              <span className="text-sm font-black text-blue-600 flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {localAssessment.timeLimitMinutes || 20} mins
              </span>
            </div>
            <div className="bg-white/80 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Pass Mark</span>
              <span className="text-sm font-black text-emerald-600 flex items-center justify-center gap-1 mt-0.5">
                <Award className="w-3.5 h-3.5" />
                {localAssessment.passingScorePercentage || 70}%
              </span>
            </div>
            <div className="bg-white/80 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Marks</span>
              <span className="text-sm font-black text-indigo-600 flex items-center justify-center gap-1 mt-0.5">
                <Layers className="w-3.5 h-3.5" />
                {localAssessment.totalMarks || questions.reduce((acc, q) => acc + (q.marks || 1), 0)}
              </span>
            </div>
          </div>

          {/* Proctoring Settings Strip if Proctored */}
          {isProctored && (
            <div className="bg-rose-50/70 border border-rose-200/60 rounded-xl p-3 text-xs text-rose-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-rose-800">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Active Anti-Cheat & Proctoring Constraints:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {proctorSettings.camera && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-rose-200 text-[10px] font-semibold text-rose-700">
                    <Camera className="w-3 h-3" /> Webcam Stream
                  </span>
                )}
                {proctorSettings.screenShare && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-rose-200 text-[10px] font-semibold text-rose-700">
                    <Monitor className="w-3 h-3" /> Screen Share
                  </span>
                )}
                {proctorSettings.fullScreen && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-rose-200 text-[10px] font-semibold text-rose-700">
                    <Maximize2 className="w-3 h-3" /> Fullscreen Lock
                  </span>
                )}
                {proctorSettings.tabSwitch && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-rose-200 text-[10px] font-semibold text-rose-700">
                    <AlertCircle className="w-3 h-3" /> Tab Switch Guard
                  </span>
                )}
                {proctorSettings.copyPaste && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-rose-200 text-[10px] font-semibold text-rose-700">
                    <Copy className="w-3 h-3" /> Copy/Paste Block
                  </span>
                )}
                {proctorSettings.secondPerson && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-rose-200 text-[10px] font-semibold text-rose-700">
                    <Users className="w-3 h-3" /> Multi-Face Detection
                  </span>
                )}
                {proctorSettings.mobileDetection && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-rose-200 text-[10px] font-semibold text-rose-700">
                    <Smartphone className="w-3 h-3" /> Phone Detection
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('inspector')}
            className={`pb-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'inspector'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Faculty Questions & Answer Key ({questions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`pb-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'simulator'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Candidate Test Simulator (Interactive Student View)</span>
          </button>
        </div>

        {/* TAB 1: FACULTY INSPECTOR VIEW */}
        {activeTab === 'inspector' && (
          <div className="space-y-4">
            {/* Question Selector Jump Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Jump To:
              </span>
              {questions.map((q, idx) => {
                const isSelected = selectedQuestionIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedQuestionIdx(idx)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20 ring-2 ring-blue-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Active Question Detail Card */}
            {currentQ ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center">
                      Q{selectedQuestionIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Question {selectedQuestionIdx + 1} of {questions.length}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {currentQ.type || 'MCQ'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        currentQ.difficulty === 'Easy'
                          ? 'bg-emerald-50 text-emerald-700'
                          : currentQ.difficulty === 'Hard'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {currentQ.difficulty || 'Medium'}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                    {currentQ.marks || 1} Mark{(currentQ.marks || 1) > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Question Prompt */}
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                    {currentQ.questionText}
                  </p>

                  {/* Code snippet if any */}
                  {currentQ.codeSnippet && (
                    <div className="bg-slate-900 text-slate-100 rounded-xl p-3 text-xs font-mono overflow-x-auto">
                      <pre>{currentQ.codeSnippet}</pre>
                    </div>
                  )}

                  {/* SQL Schema if SQL type */}
                  {currentQ.schemaSql && (
                    <div className="bg-slate-800 text-emerald-300 rounded-xl p-3 text-xs font-mono overflow-x-auto">
                      <span className="text-[10px] text-slate-400 block mb-1 uppercase font-sans">Schema SQL:</span>
                      <pre>{currentQ.schemaSql}</pre>
                    </div>
                  )}
                </div>

                {/* Options List */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Answer Options:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {(currentQ.options || []).map((opt, oIdx) => {
                      const isCorrect =
                        opt.trim().toLowerCase() === (currentQ.correctAnswer || '').trim().toLowerCase();
                      return (
                        <div
                          key={oIdx}
                          className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                            isCorrect
                              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-semibold ring-2 ring-emerald-500/20'
                              : 'bg-slate-50/70 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="text-xs pt-0.5 leading-relaxed">{opt}</span>
                          </div>

                          {isCorrect && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shrink-0 shadow-2xs">
                              <Check className="w-3 h-3" /> Correct Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation Box */}
                {currentQ.explanation && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Academic Solution & Explanation:</span>
                    </div>
                    <p className="text-slate-700 pl-5 leading-relaxed whitespace-pre-wrap">
                      {currentQ.explanation}
                    </p>
                  </div>
                )}

                {/* Navigation Buttons between questions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={ChevronLeft}
                    disabled={selectedQuestionIdx === 0}
                    onClick={() => setSelectedQuestionIdx((prev) => Math.max(0, prev - 1))}
                    className="text-xs"
                  >
                    Previous Question
                  </Button>

                  <span className="text-xs font-bold text-slate-400">
                    {selectedQuestionIdx + 1} / {questions.length}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selectedQuestionIdx === questions.length - 1}
                    onClick={() =>
                      setSelectedQuestionIdx((prev) => Math.min(questions.length - 1, prev + 1))
                    }
                    className="text-xs"
                  >
                    Next Question
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                No questions recorded in this evaluation yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CANDIDATE TEST SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-4">
            {!simStarted ? (
              /* Pre-Simulation Start Screen */
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center max-w-xl mx-auto space-y-5 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                  <Play className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                    Live Examination Simulation
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    Candidate Test Experience Preview
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Test the assessment from the student’s perspective with interactive timer, question palette, option selection, and instant score evaluation.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Questions</span>
                    <span className="font-extrabold text-slate-900">{questions.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Duration</span>
                    <span className="font-extrabold text-blue-600">{localAssessment.timeLimitMinutes || 20} mins</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Pass Mark</span>
                    <span className="font-extrabold text-emerald-600">{localAssessment.passingScorePercentage || 70}%</span>
                  </div>
                </div>

                <Button
                  size="md"
                  variant="primary"
                  icon={Play}
                  onClick={() => setSimStarted(true)}
                  className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-sm font-bold shadow-md shadow-indigo-600/20"
                >
                  Start Test Simulation
                </Button>
              </div>
            ) : simSubmitted ? (
              /* Simulation Results Screen */
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="text-center space-y-2">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                      simResult?.isPassed
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}
                  >
                    {simResult?.isPassed ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : (
                      <XCircle className="w-7 h-7" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      simResult?.isPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {simResult?.isPassed ? 'Simulated Passed' : 'Simulated Needs Improvement'}
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    Simulation Score: {simResult?.score} / {simResult?.totalMarks} ({simResult?.percentage}%)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Passing Threshold: {simResult?.passThreshold}% • Answered: {simResult?.answeredCount} • Unanswered: {simResult?.unansweredCount}
                  </p>
                </div>

                {/* Question Breakdown List */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Grading & Answer Review:
                  </h4>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {simResult?.breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          item.isCorrect
                            ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                            : 'bg-rose-50/50 border-rose-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            {item.isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            Q{idx + 1}: {item.questionText}
                          </span>
                          <span
                            className={`font-black ${
                              item.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {item.marksAwarded} / {item.totalMarks} Mark
                          </span>
                        </div>
                        <div className="text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 border-t border-slate-200/50">
                          <div>
                            <span className="text-slate-400 font-medium">Your Selected Answer: </span>
                            <span className="font-semibold">{item.chosen || 'None (Skipped)'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Correct Key: </span>
                            <span className="font-semibold text-emerald-700">{item.correctAnswer}</span>
                          </div>
                        </div>
                        {item.explanation && (
                          <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded border border-slate-200/60">
                            <strong>Explanation:</strong> {item.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={RotateCcw}
                    onClick={() => resetSimulator(localAssessment)}
                    className="text-xs font-bold"
                  >
                    Retake Simulation
                  </Button>
                </div>
              </div>
            ) : (
              /* Active Simulator Question Screen */
              <div className="space-y-4">
                {/* Simulator Control Bar */}
                <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md border border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                      Simulation Mode
                    </span>
                  </div>

                  {/* Continuous Live Countdown Timer */}
                  <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700 shadow-inner">
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Left:</span>
                    <span className="font-mono font-black text-sm text-amber-300">
                      {formatTimer(simTimeLeft)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => resetSimulator(localAssessment)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700 transition shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restart</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSimSubmit}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 shadow-md shadow-emerald-950/40 transition active:scale-[0.98] cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Simulation</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Left: Active Question */}
                  <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                    {(() => {
                      const simQ = questions[simQuestionIdx];
                      if (!simQ) return null;
                      const chosenAnswer = simAnswers[simQuestionIdx] || '';
                      const isMarked = Boolean(simMarked[simQuestionIdx]);

                      return (
                        <>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                                Q{simQuestionIdx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-700">
                                Question {simQuestionIdx + 1} of {questions.length}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSimToggleReview(simQuestionIdx)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                                isMarked
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isMarked ? 'fill-amber-600 text-amber-600' : 'text-slate-400'}`} />
                              <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                            </button>
                          </div>

                          <p className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                            {simQ.questionText}
                          </p>

                          {simQ.codeSnippet && (
                            <div className="bg-slate-950 text-emerald-400 rounded-xl p-3.5 text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner">
                              <pre>{simQ.codeSnippet}</pre>
                            </div>
                          )}

                          {/* Interactive Option Selector */}
                          <div className="space-y-2.5 pt-2">
                            {(simQ.options || []).map((opt, oIdx) => {
                              const isSelected = chosenAnswer === opt;
                              const letter = String.fromCharCode(65 + oIdx);
                              return (
                                <div
                                  key={oIdx}
                                  onClick={() => handleSimSelectOption(simQuestionIdx, opt)}
                                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs sm:text-sm ${
                                    isSelected
                                      ? 'bg-blue-50/90 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-500/20 shadow-xs'
                                      : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
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
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Question Footer Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                            <button
                              type="button"
                              onClick={() => handleSimClearOption(simQuestionIdx)}
                              disabled={!chosenAnswer}
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                                chosenAnswer
                                  ? 'text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border-slate-200 hover:border-rose-200 cursor-pointer'
                                  : 'text-slate-300 border-slate-100 bg-slate-50/40 cursor-not-allowed'
                              }`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Clear Choice</span>
                            </button>

                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                disabled={simQuestionIdx === 0}
                                onClick={() => setSimQuestionIdx((prev) => Math.max(0, prev - 1))}
                                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Prev</span>
                              </button>
                              <button
                                type="button"
                                disabled={simQuestionIdx === questions.length - 1}
                                onClick={() =>
                                  setSimQuestionIdx((prev) => Math.min(questions.length - 1, prev + 1))
                                }
                                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm shadow-blue-500/20 active:scale-[0.98] cursor-pointer"
                              >
                                <span>{simQuestionIdx === questions.length - 1 ? 'Last Question' : 'Next'}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Right: Question Palette */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Question Palette
                    </h4>

                    <div className="grid grid-cols-5 gap-1.5">
                      {questions.map((_, idx) => {
                        const isCurrent = simQuestionIdx === idx;
                        const isAnswered = Boolean(simAnswers[idx]);
                        const isMarked = Boolean(simMarked[idx]);

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSimQuestionIdx(idx)}
                            className={`h-8 rounded-lg text-xs font-bold transition-all border ${
                              isCurrent
                                ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/30'
                                : isMarked
                                ? 'bg-amber-400 text-slate-900 border-amber-500'
                                : isAnswered
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
                        <span>Answered ({Object.keys(simAnswers).length})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-amber-400 shrink-0" />
                        <span>Marked for Review ({Object.values(simMarked).filter(Boolean).length})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-slate-200 shrink-0" />
                        <span>Not Answered ({Math.max(0, questions.length - Object.keys(simAnswers).length)})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AssessmentPreviewModal;
