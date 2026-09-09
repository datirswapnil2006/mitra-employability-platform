import React, { useState } from 'react';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Award,
  Users,
  BrainCircuit,
  CheckCircle2,
  BookOpen,
  Layers,
  Sparkles
} from 'lucide-react';

const DEPT_COLORS = [
  { bg: '#3B82F6', hover: '#2563EB', light: '#EFF6FF', text: 'text-blue-600' },     // Blue
  { bg: '#6366F1', hover: '#4F46E5', light: '#EEF2FF', text: 'text-indigo-600' },   // Indigo
  { bg: '#10B981', hover: '#059669', light: '#ECFDF5', text: 'text-emerald-600' },  // Emerald
  { bg: '#F59E0B', hover: '#D97706', light: '#FFFBEB', text: 'text-amber-600' },    // Amber
  { bg: '#8B5CF6', hover: '#7C3AED', light: '#F5F3FF', text: 'text-purple-600' },   // Purple
  { bg: '#EC4899', hover: '#DB2777', light: '#FDF2F8', text: 'text-pink-600' },     // Pink
  { bg: '#14B8A6', hover: '#0D9488', light: '#F0FDFA', text: 'text-teal-600' },     // Teal
  { bg: '#F97316', hover: '#EA580C', light: '#FFF7ED', text: 'text-orange-600' },   // Orange
  { bg: '#64748B', hover: '#475569', light: '#F8FAFC', text: 'text-slate-600' }     // Slate
];

export const PracticeAnalyticsCharts = ({ analytics, loading }) => {
  const [chartMode, setChartMode] = useState('bar'); // 'bar' | 'circle'
  const [activeDeptHover, setActiveDeptHover] = useState(null);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center space-y-3 animate-pulse shadow-sm">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl mx-auto flex items-center justify-center">
          <BrainCircuit className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">Calculating Real-Time Practice Analytics...</h4>
        <p className="text-xs text-slate-500">Aggregating departmental drill attempts, score averages, and topic shares.</p>
      </div>
    );
  }

  if (!analytics) return null;

  const { overview = {}, departmentData = [], topicDistribution = [] } = analytics;

  // Filter departments with data for prominent charts, but keep full list available
  const maxAttempts = Math.max(...departmentData.map((d) => d.practiceAttempts), 1);
  const totalAttempts = overview.totalPracticeAttempts || 0;

  // Compute SVG Donut segments for Department Share
  let cumulativePercent = 0;
  const donutSegments = departmentData.map((dept, idx) => {
    const share = totalAttempts > 0 ? (dept.practiceAttempts / totalAttempts) * 100 : 0;
    const strokeDasharray = `${share} ${100 - share}`;
    const strokeDashoffset = -cumulativePercent;
    cumulativePercent += share;
    const color = DEPT_COLORS[idx % DEPT_COLORS.length];
    return {
      ...dept,
      share: Math.round(share),
      strokeDasharray,
      strokeDashoffset,
      color
    };
  });

  // Compute SVG Donut segments for Topic Distribution
  let topicCumulative = 0;
  const topicSegments = topicDistribution.slice(0, 6).map((item, idx) => {
    const share = item.percentage;
    const strokeDasharray = `${share} ${100 - share}`;
    const strokeDashoffset = -topicCumulative;
    topicCumulative += share;
    const color = DEPT_COLORS[(idx + 2) % DEPT_COLORS.length];
    return {
      ...item,
      share,
      strokeDasharray,
      strokeDashoffset,
      color
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Drills */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Drills</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{overview.totalPracticeAttempts || 0}</p>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block">
            {overview.totalQuestionsSolved || 0} Questions Solved
          </span>
        </div>

        {/* Practicing Students */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Active Students</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{overview.uniqueStudents || 0}</p>
          <span className="text-[11px] font-semibold text-slate-500">
            Across {departmentData.filter((d) => d.practiceAttempts > 0).length} Active Depts
          </span>
        </div>

        {/* Average Drill Score */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Average Score</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">{overview.overallAvgScore || 0}%</p>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block">
            Pass Rate: {overview.overallPassRate || 0}%
          </span>
        </div>

        {/* Top Performing Dept */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Top Dept Lead</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          {(() => {
            const sortedByAttempts = [...departmentData].sort((a, b) => b.practiceAttempts - a.practiceAttempts);
            const topDept = sortedByAttempts[0];
            return (
              <>
                <p className="text-2xl font-black text-slate-900 truncate">
                  {topDept?.practiceAttempts > 0 ? topDept.department : 'N/A'}
                </p>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block">
                  {topDept?.practiceAttempts || 0} Drills Logged
                </span>
              </>
            );
          })()}
        </div>
      </div>

      {/* 2. Visual Chart Deck (Toggle Bar vs Donut) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-6">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Department-Wise Practice Performance Analytics
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative drill volume, participant engagement, and average competency per academic department.
            </p>
          </div>

          {/* Chart View Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                chartMode === 'bar'
                  ? 'bg-white text-blue-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bar Chart</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('circle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                chartMode === 'circle'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Circle / Donut Chart</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VIEW 1: BAR CHART (Department Drills & Score Comparison)     */}
        {/* ============================================================ */}
        {chartMode === 'bar' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
                  <span className="font-semibold text-slate-700">Drills Attempted</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  <span className="font-semibold text-slate-700">Average Score %</span>
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                Hover on bars for detailed metrics
              </span>
            </div>

            {/* Horizontal Bar Chart Bars */}
            <div className="space-y-3.5">
              {departmentData.map((d, idx) => {
                const attemptsWidth = Math.max(Math.round((d.practiceAttempts / maxAttempts) * 100), 2);
                const isZero = d.practiceAttempts === 0;

                return (
                  <div
                    key={d.department}
                    onMouseEnter={() => setActiveDeptHover(d.department)}
                    onMouseLeave={() => setActiveDeptHover(null)}
                    className={`p-3 rounded-2xl border transition-all ${
                      activeDeptHover === d.department
                        ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs w-28 truncate">
                          {d.department}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                          {d.totalStudents} Students
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="text-blue-700 font-black">
                          {d.practiceAttempts} {d.practiceAttempts === 1 ? 'drill' : 'drills'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className={d.avgScore >= 60 ? 'text-emerald-700 font-black' : 'text-slate-600'}>
                          {d.avgScore}% avg
                        </span>
                      </div>
                    </div>

                    {/* Comparative Dual Bars */}
                    <div className="space-y-1.5">
                      {/* Bar 1: Attempts Count */}
                      <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden relative">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${isZero ? 1 : attemptsWidth}%` }}
                        />
                      </div>

                      {/* Bar 2: Average Score % */}
                      {d.practiceAttempts > 0 && (
                        <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(1, d.avgScore))}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: CIRCLE / DONUT CHARTS (Department Share & Topics)    */}
        {/* ============================================================ */}
        {chartMode === 'circle' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
            {/* Circle Chart 1: Department Attempts Share */}
            <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Department Participation Share
                  </h4>
                  <p className="text-[11px] text-slate-500">Distribution of total practice drills by department</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-2">
                {/* SVG Donut Circle */}
                <div className="relative w-40 h-40 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {/* Background track circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#E2E8F0"
                      strokeWidth="3.2"
                    />
                    {totalAttempts === 0 ? (
                      <circle
                        cx="18"
                        cy="18"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke="#CBD5E1"
                        strokeWidth="3.2"
                        strokeDasharray="100 0"
                      />
                    ) : (
                      donutSegments.map((seg, idx) => (
                        <circle
                          key={seg.department}
                          cx="18"
                          cy="18"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke={seg.color.bg}
                          strokeWidth="3.4"
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          className="transition-all duration-500 hover:opacity-80"
                        />
                      ))
                    )}
                  </svg>
                  {/* Center Circle KPI */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900 leading-tight">
                      {totalAttempts}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      Drills
                    </span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar w-full sm:w-auto text-xs">
                  {donutSegments.map((seg) => (
                    <div key={seg.department} className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="flex items-center gap-1.5 font-bold text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color.bg }} />
                        <span className="truncate max-w-[100px]">{seg.department}</span>
                      </span>
                      <span className="font-mono font-black text-slate-900">
                        {seg.practiceAttempts} <span className="text-slate-400 text-[10px]">({seg.share}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Circle Chart 2: Top Practiced Topics */}
            <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Topic Practice Distribution
                  </h4>
                  <p className="text-[11px] text-slate-500">Most attempted Question Bank drill categories</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-2">
                {/* SVG Donut Circle */}
                <div className="relative w-40 h-40 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#E2E8F0"
                      strokeWidth="3.2"
                    />
                    {topicDistribution.length === 0 ? (
                      <circle
                        cx="18"
                        cy="18"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke="#CBD5E1"
                        strokeWidth="3.2"
                        strokeDasharray="100 0"
                      />
                    ) : (
                      topicSegments.map((seg) => (
                        <circle
                          key={seg.topic}
                          cx="18"
                          cy="18"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke={seg.color.bg}
                          strokeWidth="3.4"
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          className="transition-all duration-500 hover:opacity-80"
                        />
                      ))
                    )}
                  </svg>
                  {/* Center Circle KPI */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900 leading-tight">
                      {topicDistribution.length}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      Topics
                    </span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar w-full sm:w-auto text-xs">
                  {topicSegments.length > 0 ? (
                    topicSegments.map((seg) => (
                      <div key={seg.topic} className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold text-slate-700">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color.bg }} />
                          <span className="truncate max-w-[110px]" title={seg.topic}>{seg.topic}</span>
                        </span>
                        <span className="font-mono font-black text-slate-900">
                          {seg.count} <span className="text-slate-400 text-[10px]">({seg.share}%)</span>
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">No topic attempts logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Live Departmental Table Preview */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Department Drill Metrics Preview
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Download contains complete detailed audit trail
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600">
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-center">Registered</th>
                  <th className="py-2.5 px-3 text-center">Drills Taken</th>
                  <th className="py-2.5 px-3 text-center">Active Students</th>
                  <th className="py-2.5 px-3 text-center">Avg Score %</th>
                  <th className="py-2.5 px-3 text-center">Pass Rate %</th>
                  <th className="py-2.5 px-3 text-center">Questions Solved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {departmentData.map((d) => (
                  <tr key={d.department} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3 font-bold text-slate-900">{d.department}</td>
                    <td className="py-2 px-3 text-center text-slate-600">{d.totalStudents}</td>
                    <td className="py-2 px-3 text-center font-bold text-blue-700">{d.practiceAttempts}</td>
                    <td className="py-2 px-3 text-center text-slate-600">{d.activeStudents}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-black ${
                        d.avgScore >= 70 ? 'bg-emerald-50 text-emerald-700' : d.avgScore > 0 ? 'bg-amber-50 text-amber-700' : 'text-slate-400'
                      }`}>
                        {d.avgScore}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        d.passRate >= 70 ? 'text-emerald-700' : d.passRate > 0 ? 'text-amber-700' : 'text-slate-400'
                      }`}>
                        {d.passRate}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-700">{d.totalQuestions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeAnalyticsCharts;
