import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingState from '../../components/LoadingState';
import { BookOpen, FileCheck, ArrowRight, PlayCircle, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard = () => {
  const { user, profileCompletion } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    overallPercentage: 0,
    completedSubmodulesCount: 0,
    totalSubmodules: 0,
    continueLearning: null
  });
  const [attemptsStats, setAttemptsStats] = useState({ count: 0, passed: 0 });
  const [recommendedModules, setRecommendedModules] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [progressRes, attemptsRes, modulesRes] = await Promise.all([
          api.getOverallProgress(),
          api.getStudentAttempts(),
          api.getModules({ department: user?.department || 'CSE' })
        ]);

        if (progressRes.success) {
          setOverallStats({
            overallPercentage: progressRes.overallPercentage,
            completedSubmodulesCount: progressRes.completedSubmodulesCount,
            totalSubmodules: progressRes.totalSubmodules,
            continueLearning: progressRes.continueLearning
          });
        }

        if (attemptsRes.success) {
          const attempts = attemptsRes.attempts || [];
          setAttemptsStats({
            count: attempts.length,
            passed: attempts.filter(a => a.status === 'PASSED').length
          });
        }

        if (modulesRes.success) {
          setRecommendedModules((modulesRes.modules || []).slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) return <LoadingState message="Preparing your student dashboard..." />;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white rounded-3xl p-8 border border-blue-200/80 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary">{user?.department || 'CSE'} Department</Badge>
              {profileCompletion === 100 && (
                <Badge variant="success" className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Profile Unlocked
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Student'} 👋
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-xl">
              Track your employability readiness, complete training submodules, and unlock domain assessments.
            </p>
          </div>

          <Link to="/student/training">
            <Button size="lg" icon={ArrowRight}>
              Explore Training
            </Button>
          </Link>
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Completion */}
        <Card title="Profile Completion" subtitle="Mandatory 100% gating requirement">
          <ProgressBar progress={profileCompletion} color={profileCompletion === 100 ? 'emerald' : 'amber'} className="mt-2" />
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              {profileCompletion === 100 ? '✓ Ready for All Assessments' : 'Incomplete Profile'}
            </span>
            <Link to="/student/profile" className="text-blue-600 font-bold hover:underline">
              {profileCompletion === 100 ? 'View Details' : 'Complete Profile →'}
            </Link>
          </div>
        </Card>

        {/* Overall Training Progress */}
        <Card title="Overall Training" subtitle={`${overallStats.completedSubmodulesCount} of ${overallStats.totalSubmodules || 1} submodules complete`}>
          <ProgressBar progress={overallStats.overallPercentage} color="indigo" className="mt-2" />
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Target: 100% Modules</span>
            <span className="font-bold text-blue-600">{overallStats.overallPercentage}% Complete</span>
          </div>
        </Card>

        {/* Assessments Progress */}
        <Card title="Assessments" subtitle="Completed mock & AI tests">
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-slate-900">{attemptsStats.passed}</span>
            <span className="text-xs font-semibold text-slate-500">
              out of {attemptsStats.count} attempts
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Pass Rate:</span>
            <span className="font-bold text-emerald-600">
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
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{overallStats.continueLearning.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">Current Progress: {overallStats.continueLearning.progress}%</p>
                  </div>
                </div>

                <Link to="/student/training">
                  <Button size="sm" icon={ArrowRight}>
                    Continue Submodule
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                Start your first training module to unlock personalized recommendations.
              </div>
            )}
          </Card>

          {/* Recommended Modules */}
          <Card title="Recommended Training" subtitle="Curated for your department">
            <div className="space-y-3">
              {recommendedModules.map((mod) => (
                <div key={mod._id} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-900">{mod.title}</h5>
                      <span className="text-xs text-slate-500">{mod.category}</span>
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
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-emerald-900">SQL Joins Mock Test 1</h5>
                  <p className="text-[11px] text-slate-500 mt-1">20 Marks • 15 Mins</p>
                  <Link to="/student/training" className="text-xs font-bold text-blue-600 hover:underline inline-block mt-2">
                    Take Test →
                  </Link>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 shadow-xs">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-blue-900">AI Adaptive Assessment</h5>
                  <p className="text-[11px] text-slate-500 mt-1">Grounded question generation</p>
                  <Link to="/student/training" className="text-xs font-bold text-blue-600 hover:underline inline-block mt-2">
                    Generate AI Test →
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
