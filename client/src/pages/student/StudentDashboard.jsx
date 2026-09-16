import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudentOverallProgress } from '../../hooks/queries/useStudentQueries';
import { useStudentAttempts } from '../../hooks/queries/useAssessmentQueries';
import { useTrainingModules } from '../../hooks/queries/useTrainingQueries';
import { api } from '../../services/api';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingState from '../../components/LoadingState';
import {
  BookOpen,
  FileCheck,
  ArrowRight,
  PlayCircle,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Flame,
  Trophy,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard = () => {
  const { user, profileCompletion } = useAuth();

  const { data: progressRes, isLoading: progressLoading } = useStudentOverallProgress();
  const { data: attemptsRes, isLoading: attemptsLoading } = useStudentAttempts();
  const { data: modulesRes, isLoading: modulesLoading } = useTrainingModules(
    { department: user?.department || 'CSE' },
    { enabled: !!user }
  );

  const [gamification, setGamification] = useState({
    totalXP: 0,
    currentStreak: 0,
    longestStreak: 0,
    level: 1,
    nextLevelXP: 100,
    progressToNextLevel: 0,
    recentActivities: []
  });

  useEffect(() => {
    api.getGamificationStats()
      .then((res) => {
        const stats = res?.stats || res?.data;
        if (stats) {
          const totalXP = stats.totalXP ?? 0;
          const level = stats.level || Math.max(1, Math.floor(totalXP / 100) + 1);
          const nextLevelXP = stats.nextLevelXP || (level * 100);
          const currentLevelBaseXP = (level - 1) * 100;
          const progressToNextLevel = stats.progressToNextLevel !== undefined
            ? stats.progressToNextLevel
            : Math.min(100, Math.max(0, Math.round(((totalXP - currentLevelBaseXP) / 100) * 100)));

          setGamification({
            totalXP,
            currentStreak: stats.currentStreak ?? stats.streak ?? 0,
            longestStreak: stats.longestStreak ?? stats.currentStreak ?? 0,
            level,
            nextLevelXP,
            progressToNextLevel,
            recentActivities: stats.recentActivities || []
          });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch gamification stats:', err);
      });
  }, []);

  const loading = progressLoading || attemptsLoading || modulesLoading;

  const overallStats = {
    overallPercentage: progressRes?.overallPercentage || 0,
    completedSubmodulesCount: progressRes?.completedSubmodulesCount || 0,
    totalSubmodules: progressRes?.totalSubmodules || 0,
    continueLearning: progressRes?.continueLearning || null,
  };

  const attempts = attemptsRes?.attempts || [];
  const attemptsStats = {
    count: attempts.length,
    passed: attempts.filter((a) => a.status === 'PASSED').length,
  };

  const recommendedModules = (modulesRes?.modules || []).slice(0, 3);

  if (loading) return <LoadingState message="Preparing your student dashboard..." />;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 rounded-3xl p-8 border border-blue-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="primary">{user?.department || 'CSE'} Department</Badge>
              {profileCompletion === 100 && (
                <Badge variant="success" className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Profile Unlocked
                </Badge>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 shadow-xs">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                {gamification.totalXP} XP • Lvl {gamification.level}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800/80 shadow-xs">
                <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-500 animate-pulse" />
                {gamification.currentStreak} Day Streak
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.name || 'Student'} 👋
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
              Track your employability readiness, complete training submodules, practice assessments, and earn XP.
            </p>
          </div>

          <Link to="/student/training">
            <Button size="lg" icon={ArrowRight}>
              Explore Training
            </Button>
          </Link>
        </div>
      </div>

      {/* Core Metrics Grid with Gamification */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total XP & Level */}
        <Card title="Total XP" subtitle={`Level ${gamification.level} Learner`}>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-amber-600 flex items-center gap-1.5">
              <Zap className="w-6 h-6 fill-amber-500" />
              {gamification.totalXP}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Next: {gamification.nextLevelXP} XP
            </span>
          </div>
          <ProgressBar
            progress={gamification.progressToNextLevel || 0}
            color="amber"
            className="mt-3"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Progress to Lvl {gamification.level + 1}</span>
            <span className="font-bold text-amber-700 dark:text-amber-400">{gamification.progressToNextLevel}%</span>
          </div>
        </Card>

        {/* Current Streak */}
        <Card title="Learning Streak" subtitle={`Best: ${gamification.longestStreak} days in a row`}>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-rose-600 flex items-center gap-1.5">
              <Flame className="w-6 h-6 fill-rose-500 animate-pulse" />
              {gamification.currentStreak} <span className="text-lg font-bold text-slate-600 dark:text-slate-400">days</span>
            </span>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/60">
              🔥 Active
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Keep your daily streak:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">Study today</span>
          </div>
        </Card>

        {/* Overall Training Progress */}
        <Card title="Training Progress" subtitle={`${overallStats.completedSubmodulesCount} of ${overallStats.totalSubmodules || 1} submodules`}>
          <ProgressBar progress={overallStats.overallPercentage} color="indigo" className="mt-2" />
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Target: 100% Modules</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{overallStats.overallPercentage}% Complete</span>
          </div>
        </Card>

        {/* Assessments Progress */}
        <Card title="Topic & Mock Tests" subtitle="Passed assessments">
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{attemptsStats.passed}</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              out of {attemptsStats.count} attempts
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Pass Rate:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {attemptsStats.count > 0 ? Math.round((attemptsStats.passed / attemptsStats.count) * 100) : 0}%
            </span>
          </div>
        </Card>
      </div>

      {/* Next Priority Action: Continue Learning Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Continue Learning" subtitle="Prioritized next step in your curriculum">
            {overallStats.continueLearning ? (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{overallStats.continueLearning.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Current Progress: {overallStats.continueLearning.progress}%</p>
                  </div>
                </div>

                <Link to="/student/training">
                  <Button size="sm" icon={ArrowRight}>
                    Continue Submodule
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs">
                Start your first training module to unlock personalized recommendations.
              </div>
            )}
          </Card>

          {/* Recommended Modules */}
          <Card title="Recommended Training" subtitle="Curated for your department">
            <div className="space-y-3">
              {recommendedModules.map((mod) => (
                <div key={mod._id} className="p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">{mod.title}</h5>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{mod.category}</span>
                    </div>
                  </div>
                  <Link to="/student/training">
                    <Button size="sm" variant="outline">
                      View Module
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Unlocked Assessments Sidebar */}
        <div className="space-y-6">
          <Card title="Available Assessments" subtitle="Submodules with 100% completion">
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-start gap-3 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-emerald-900 dark:text-emerald-300">SQL Joins Mock Test 1</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">20 Marks • 15 Mins</p>
                  <Link to="/student/training" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-block mt-2">
                    Take Test →
                  </Link>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-start gap-3 shadow-xs">
                <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-blue-900 dark:text-blue-300">Quantitative Aptitude Test 1</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">25 Marks • 20 Mins</p>
                  <Link to="/student/assessments" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-block mt-2">
                    Take Assessment →
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
