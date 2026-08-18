import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Eye,
  FileCheck,
  TrendingUp,
  BookOpen
} from 'lucide-react';

export const StudentPerformancePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  useEffect(() => {
    fetchStudentAttempts();
  }, []);

  const fetchStudentAttempts = async () => {
    setLoading(true);
    try {
      const res = await api.getStudentAttempts();
      if (res.success) {
        setAttempts(res.attempts || []);
      }
    } catch (err) {
      console.error('Error fetching student attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter((a) => a.status === 'PASSED').length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / totalAttempts)
      : 0;

  const formatDuration = (seconds) => {
    const mins = Math.floor((seconds || 0) / 60);
    const secs = (seconds || 0) % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assessment Performance History"
        subtitle="Review past examination attempts, inspect detailed question explanations, and retake tests."
        breadcrumbs={[
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Performance & Results' }
        ]}
      />

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Evaluations</span>
            <span className="text-2xl font-black text-slate-900">{totalAttempts}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Tests Passed</span>
            <span className="text-2xl font-black text-emerald-600">
              {passedAttempts} / {totalAttempts}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Average Score</span>
            <span className="text-2xl font-black text-indigo-700">{avgScore}%</span>
          </div>
        </div>
      </div>

      {/* Attempts List */}
      {loading ? (
        <LoadingState message="Loading your assessment history..." />
      ) : attempts.length > 0 ? (
        <div className="space-y-4">
          {attempts.map((att, idx) => {
            const isPassed = att.status === 'PASSED';
            const test = att.assessmentId || {};
            return (
              <div
                key={att._id || idx}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200/60">
                      {test.module || 'Evaluation'}
                    </span>
                    {test.category && (
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {test.category}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isPassed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {att.status}
                    </span>
                    <span className="text-xs text-slate-400">Attempt #{att.attemptNumber || 1}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {test.title || 'Assessment Test'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDuration(att.timeSpentSeconds)}
                    </span>
                    <span>•</span>
                    <span>{formatDate(att.attemptedAt)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Score</span>
                    <div className="text-2xl font-black text-slate-900">
                      {att.percentage}%{' '}
                      <span className="text-xs font-semibold text-slate-400">
                        ({att.score}/{att.totalMarks})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Eye}
                      onClick={() => setSelectedAttempt(att)}
                      className="flex-1 sm:flex-none justify-center"
                    >
                      Review Audit
                    </Button>

                    {test._id && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={RotateCcw}
                        onClick={() => navigate(`/student/take-assessment/${test._id}`)}
                        className="flex-1 sm:flex-none justify-center shadow-xs"
                      >
                        Retake
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No Assessment Attempts Recorded"
          description="You have not completed any evaluations yet. Browse through available assessments and take your first test."
          actionText="Browse Assessments"
          onAction={() => navigate('/student/assessments')}
        />
      )}

      {/* Review Modal */}
      {selectedAttempt && (
        <Modal
          isOpen={Boolean(selectedAttempt)}
          onClose={() => setSelectedAttempt(null)}
          title="Attempt Response Breakdown"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-300">
                  {selectedAttempt.assessmentId?.module} • {selectedAttempt.assessmentId?.category}
                </span>
                <h4 className="text-base font-black text-white">{selectedAttempt.assessmentId?.title}</h4>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full font-black text-xs uppercase mb-0.5 ${
                    selectedAttempt.status === 'PASSED'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {selectedAttempt.status}
                </span>
                <div className="text-lg font-black text-white">{selectedAttempt.percentage}%</div>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              {selectedAttempt.answers?.map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                    ans.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">Question {idx + 1}</span>
                    <span className={`font-bold ${ans.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {ans.isCorrect ? `✓ Correct (+${ans.marksAwarded})` : '✗ Incorrect (0)'}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800 leading-relaxed">{ans.questionText}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Your Answer:</span>
                      <span className={ans.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {ans.studentAnswer || '(No answer)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Correct Reference:</span>
                      <span className="text-emerald-700 font-bold">{ans.correctAnswer}</span>
                    </div>
                  </div>

                  {ans.explanation && (
                    <p className="text-[11px] text-slate-600 bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/60 leading-relaxed">
                      <strong className="text-blue-900">Explanation: </strong>
                      {ans.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentPerformancePage;
