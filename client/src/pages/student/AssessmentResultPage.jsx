import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAssessmentAttemptResult } from '../../hooks/queries/useAssessmentQueries';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingState from '../../components/LoadingState';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ArrowLeft,
  BookOpen,
  FileCheck,
  Building2
} from 'lucide-react';

export const AssessmentResultPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateResult = location.state?.result || null;
  const { data: attemptRes, isLoading: queryLoading } = useAssessmentAttemptResult(id, {
    enabled: !stateResult && !!id
  });

  const result = stateResult || attemptRes?.attempt || null;
  const loading = !stateResult && queryLoading;

  if (loading) return <LoadingState message="Fetching your test performance report..." />;

  if (!result) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-md mx-auto space-y-4">
        <Award className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">No Result Data Available</h3>
        <p className="text-xs text-slate-500">Could not retrieve results for this test attempt.</p>
        <Button onClick={() => navigate('/student/assessments')} className="mx-auto">
          Back to Assessments
        </Button>
      </div>
    );
  }

  const { score, totalMarks, percentage, status, timeSpentSeconds, answers, assessmentId } = result;
  const isPassed = status === 'PASSED';
  const mins = Math.floor((timeSpentSeconds || 0) / 60);
  const secs = (timeSpentSeconds || 0) % 60;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div
        className={`rounded-3xl p-8 border text-center relative overflow-hidden shadow-xs ${
          isPassed
            ? 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-white'
            : 'border-rose-200 bg-gradient-to-b from-rose-50 to-white'
        }`}
      >
        <div
          className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border shadow-sm ${
            isPassed
              ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
              : 'bg-rose-100 text-rose-600 border-rose-200'
          }`}
        >
          {isPassed ? (
            <CheckCircle2 className="w-9 h-9" />
          ) : (
            <XCircle className="w-9 h-9" />
          )}
        </div>

        <span
          className={`text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider ${
            isPassed
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-rose-600 text-white shadow-xs'
          }`}
        >
          {status}
        </span>

        <h1 className="text-3xl font-black text-slate-900 mt-3">
          Score: {score} / {totalMarks} ({percentage}%)
        </h1>

        <p className="text-xs text-slate-500 mt-2 font-medium">
          Time Taken: {mins}m {secs}s • Attempt Recorded Successfully
        </p>

        {result.violationsCount > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            <span>Proctoring Warnings Recorded: {result.violationsCount}</span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {assessmentId && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate(`/student/take-assessment/${typeof assessmentId === 'object' ? assessmentId._id : assessmentId}`)}
            >
              Retake Assessment
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate('/student/assessments')}
          >
            Back to Assessments
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={BookOpen}
            onClick={() => navigate('/student/training')}
          >
            Go to Training
          </Button>
        </div>
      </div>

      {/* Detailed Question Review List */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">
          Question Performance & Explanations ({answers?.length || 0})
        </h3>

        {answers &&
          answers.map((ans, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs ${
                ans.isCorrect
                  ? 'border-emerald-200/80 hover:border-emerald-300'
                  : 'border-rose-200/80 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center">
                    Q{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {ans.type?.toUpperCase() || 'MCQ'} • {ans.marksAwarded} Marks
                  </span>
                </div>

                <span
                  className={`text-xs font-bold flex items-center gap-1 ${
                    ans.isCorrect ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {ans.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>

              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                {ans.questionText}
              </p>

              {/* Answers comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/70 font-mono">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Your Submission:</span>
                  <span
                    className={`font-extrabold ${
                      ans.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {ans.studentAnswer || '(No answer provided)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Correct Answer:</span>
                  <span className="text-emerald-700 font-extrabold">{ans.correctAnswer}</span>
                </div>
              </div>

              {/* Explanation Box */}
              {ans.explanation && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-xl text-xs text-blue-950 leading-relaxed">
                  <span className="font-extrabold text-blue-900">Explanation: </span>
                  {ans.explanation}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default AssessmentResultPage;
