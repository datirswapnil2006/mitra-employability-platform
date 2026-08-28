import React, { useState } from 'react';
import { useAdminAnalytics } from '../../hooks/queries/useAdminQueries';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Select from '../../components/Select';
import ProgressBar from '../../components/ProgressBar';
import LoadingState from '../../components/LoadingState';
import { OFFICIAL_DEPARTMENTS } from '../../constants/departments';
import {
  Users,
  Award,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  Building2,
  BrainCircuit,
  Trophy,
  BookOpen,
  Target
} from 'lucide-react';

export const AnalyticsPage = () => {
  const [department, setDepartment] = useState('All');
  const departments = ['All', ...OFFICIAL_DEPARTMENTS];

  const { data, isLoading: loading } = useAdminAnalytics({ department });

  if (loading) return <LoadingState message="Aggregating departmental analytics & placement intelligence..." />;

  const stats = data?.stats || {};
  const deptStats = data?.departmentStats || [];
  const moduleStats = data?.moduleStats || [];
  const leaderboard = data?.leaderboard || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Analytics & Talent Intelligence"
        subtitle="Departmental comparisons, assessment pass rates, psychometric readiness indices, and student leaderboards."
        breadcrumbs={[
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Analytics' }
        ]}
        actions={
          <div className="w-48">
            <Select
              options={departments}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
        }
      />

      {/* Top Macro Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Candidates</span>
            <span className="text-2xl font-black text-slate-900">{stats.totalStudents || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Exam Attempts</span>
            <span className="text-2xl font-black text-slate-900">{stats.totalAttempts || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Platform Pass Rate</span>
            <span className="text-2xl font-black text-emerald-600">{stats.passRate || 0}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Avg Assessment Score</span>
            <span className="text-2xl font-black text-amber-600">{stats.avgAssessmentScore || 0}%</span>
          </div>
        </div>
      </div>

      {/* 9 Official Departments Comparative Cards Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Departmental Comparative Performance (Official 9 Departments)
          </h3>
          <span className="text-xs font-semibold text-slate-400">Institutional Benchmarks</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptStats.map((item) => (
            <div
              key={item.department}
              className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                  {item.department}
                </span>
                <span className="text-xs font-bold text-slate-500">{item.studentCount} Students</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Avg Score</span>
                  <span className="text-sm font-black text-slate-900">{item.avgAssessmentScore}%</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Pass Rate</span>
                  <span className="text-sm font-black text-emerald-600">{item.passRate}%</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Readiness</span>
                  <span className="text-sm font-black text-indigo-600">{item.avgReadiness}%</span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Profile Completion:</span>
                  <span className="font-bold text-slate-700">{item.avgProfileCompletion}%</span>
                </div>
                <ProgressBar progress={item.avgProfileCompletion} color="emerald" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module Stats & Leaderboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Performance Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Curriculum Module Performance Metrics
          </h3>

          <div className="space-y-3">
            {moduleStats.map((mod) => (
              <div
                key={mod.module}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs font-semibold"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{mod.module}</span>
                  <span className="text-[10px] text-slate-400">
                    {mod.publishedTests} Tests • {mod.attemptsCount} Attempts
                  </span>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Avg Score</span>
                    <span className="font-black text-blue-700">{mod.avgScore}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Pass Rate</span>
                    <span className="font-black text-emerald-600">{mod.passRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Students Leaderboard */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            Top Performing Candidates (Leaderboard)
          </h3>

          {leaderboard.length > 0 ? (
            <div className="space-y-2.5">
              {leaderboard.map((student, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{student.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {student.department} • {student.testsAttempted} Tests Taken
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-600">{student.avgScore}%</span>
                    <span className="text-[10px] text-slate-400 block">Avg Score</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-xs text-slate-400">
              No completed student evaluations yet for leaderboard computation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
