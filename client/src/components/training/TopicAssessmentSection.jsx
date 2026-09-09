import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../Button';
import Badge from '../Badge';
import ProgressBar from '../ProgressBar';
import PracticeTestModal from './PracticeTestModal';
import {
  Award,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  FileCheck,
  RotateCcw,
  Zap,
  Layers,
  Flame,
  ShieldCheck
} from 'lucide-react';

export const TopicAssessmentSection = ({
  topic,
  totalContents = 0,
  completedContentsCount = 0
}) => {
  const navigate = useNavigate();
  const [defaultAssessment, setDefaultAssessment] = useState(null);
  const [userAttempt, setUserAttempt] = useState(null);
  const [questionStats, setQuestionStats] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);

  useEffect(() => {
    if (topic?._id) {
      loadTopicAssessmentData();
    }
  }, [topic?._id]);

  const loadTopicAssessmentData = async () => {
    setLoading(true);
    try {
      const [assessmentRes, statsRes] = await Promise.all([
        api.getDefaultTopicAssessment(topic._id),
        api.getTopicQuestionStats(topic._id, topic.title)
      ]);

      if (assessmentRes.success) {
        setDefaultAssessment(assessmentRes.assessment);
        setUserAttempt(assessmentRes.userAttempt);
      }

      if (statsRes.success && statsRes.stats) {
        setQuestionStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Failed to load topic assessment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage =
    totalContents > 0
      ? Math.min(100, Math.round((completedContentsCount / totalContents) * 100))
      : 0;

  const isTopicFullyStudied = progressPercentage >= 100;

  return (
    <div className="space-y-6 pt-2">
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Topic Assessment & Practice Hub
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Validate your mastery with the official baseline test or generate practice drills from the question bank.
          </p>
        </div>

        {questionStats.total > 0 && (
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-xs font-bold border border-blue-100">
            <Layers className="w-3.5 h-3.5" />
            <span>{questionStats.total} Questions in Bank</span>
          </div>
        )}
      </div>

      {/* Grid: Default Assessment & Practice Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Default Topic Assessment */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" />
                Official Topic Test
              </span>
              {userAttempt && (
                <Badge variant={userAttempt.status === 'PASSED' ? 'success' : 'danger'}>
                  {userAttempt.status === 'PASSED' ? `Passed (${userAttempt.percentage}%)` : `Failed (${userAttempt.percentage}%)`}
                </Badge>
              )}
            </div>

            <h4 className="font-black text-base text-slate-900 leading-snug">
              {defaultAssessment?.title || `${topic?.title} — Official Assessment`}
            </h4>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Standard curriculum evaluation. Earn 40 XP upon passing (70%+). Zero AI latency.
            </p>

            {/* Test Metrics */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Questions</span>
                <span className="text-xs font-black text-slate-800">
                  {defaultAssessment?.questions?.length || 15} Q (Max 30)
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Time Limit</span>
                <span className="text-xs font-black text-slate-800">
                  {defaultAssessment?.timeLimitMinutes || 20} Mins
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Pass Mark</span>
                <span className="text-xs font-black text-emerald-600">
                  {defaultAssessment?.passingScorePercentage || 70}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>+40 XP on completion</span>
            </div>

            {defaultAssessment ? (
              <Button
                size="sm"
                variant={userAttempt ? 'outline' : 'primary'}
                icon={userAttempt ? RotateCcw : Play}
                onClick={() => navigate(`/student/practice/${defaultAssessment._id}`, { state: { returnTopic: topic } })}
              >
                {userAttempt ? 'Retake Test' : 'Start Baseline Test'}
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                Setting Up...
              </Button>
            )}
          </div>
        </div>

        {/* Card 2: Student Self Practice Test */}
        <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white rounded-3xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-lg border border-amber-400/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Adaptive Practice
              </span>
              <span className="text-[11px] font-bold text-blue-200/80">
                Instant Creation
              </span>
            </div>

            <h4 className="font-black text-base text-white leading-snug">
              Create Self Practice Test
            </h4>
            <p className="text-xs text-blue-100/80 mt-1.5 leading-relaxed">
              Configure randomized question sets directly from the topic question bank. Select question count up to 30 questions.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-blue-800/60 text-center">
              <div className="bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="block text-[10px] font-bold text-blue-300 uppercase">Question Limit</span>
                <span className="text-xs font-black text-white">Up to 30 Questions</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="block text-[10px] font-bold text-blue-300 uppercase">Available in Bank</span>
                <span className="text-xs font-black text-amber-300">
                  {questionStats.total > 0 ? `${questionStats.total} Questions` : '200 Questions'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-blue-800/60 flex items-center justify-between">
            <div className="text-[11px] text-blue-200 font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>+20 XP + Daily Streak</span>
            </div>

            <button
              type="button"
              onClick={() => setIsPracticeModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-slate-900 shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95 border border-white"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Configure Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Practice Test Configuration Modal */}
      <PracticeTestModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        topic={topic}
        availableQuestionsCount={questionStats.total}
      />
    </div>
  );
};

export default TopicAssessmentSection;
