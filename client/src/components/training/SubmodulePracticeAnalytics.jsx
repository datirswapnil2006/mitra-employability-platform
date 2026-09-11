import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Badge from '../Badge';
import Button from '../Button';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  Flame,
  Clock,
  Sparkles,
  RotateCcw,
  Play,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Target,
  ArrowRight,
  Filter,
  History
} from 'lucide-react';

export const SubmodulePracticeAnalytics = ({
  moduleName = 'Aptitude',
  categoryName = 'Reasoning',
  categoryLabel = 'Logical Reasoning',
  submoduleId = null,
  onStartPractice = null // Callback (topicDoc) => void
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('both'); // 'both' | 'bar' | 'circle'
  const [topicFilter, setTopicFilter] = useState('all'); // 'all' | 'weak' | 'needs_practice' | 'strong'
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'history'

  useEffect(() => {
    fetchSubmoduleAnalytics();
  }, [moduleName, categoryName, submoduleId]);

  const fetchSubmoduleAnalytics = async () => {
    setLoading(true);
    try {
      const params = {
        module: moduleName,
        category: categoryName
      };
      if (submoduleId) params.submoduleId = submoduleId;

      const res = await api.getSubmodulePracticeAnalytics(params);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching submodule practice analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const { summary = {}, donutChart = {}, barChart = [], strongTopics = [], needsPracticeTopics = [], weakTopics = [], unpracticedTopics = [], recentAttempts = [] } = data || {};

  // Compute filtered bar chart items based on pill filter
  const filteredBarTopics = useMemo(() => {
    if (!barChart) return [];
    if (topicFilter === 'all') return barChart;
    return barChart.filter((item) => item.classification === topicFilter);
  }, [barChart, topicFilter]);

  // Compute SVG Donut Segments
  const donutSegments = useMemo(() => {
    const totalPracticed = (donutChart.strongCount || 0) + (donutChart.needsPracticeCount || 0) + (donutChart.weakCount || 0);
    if (totalPracticed === 0) return [];

    const segments = [
      {
        label: 'Strong Topics (≥75%)',
        count: donutChart.strongCount || 0,
        percentage: Math.round(((donutChart.strongCount || 0) / totalPracticed) * 100),
        color: '#10B981', // emerald
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-500'
      },
      {
        label: 'Needs Practice (50-74%)',
        count: donutChart.needsPracticeCount || 0,
        percentage: Math.round(((donutChart.needsPracticeCount || 0) / totalPracticed) * 100),
        color: '#F59E0B', // amber
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-500'
      },
      {
        label: 'Weak Topics (<50%)',
        count: donutChart.weakCount || 0,
        percentage: Math.round(((donutChart.weakCount || 0) / totalPracticed) * 100),
        color: '#F43F5E', // rose
        textColor: 'text-rose-700',
        bgColor: 'bg-rose-500'
      }
    ].filter((s) => s.count > 0);

    let cumulative = 0;
    return segments.map((seg) => {
      const strokeDasharray = `${seg.percentage} ${100 - seg.percentage}`;
      const strokeDashoffset = -cumulative;
      cumulative += seg.percentage;
      return {
        ...seg,
        strokeDasharray,
        strokeDashoffset
      };
    });
  }, [donutChart]);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/90 p-6 shadow-xs animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-2xl" />
            <div className="space-y-1.5">
              <div className="w-48 h-4 bg-slate-200 rounded-md" />
              <div className="w-32 h-3 bg-slate-100 rounded-md" />
            </div>
          </div>
          <div className="w-24 h-8 bg-slate-100 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 bg-slate-50 rounded-2xl border border-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  const hasAttempts = summary.totalDrills > 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-300">
      {/* 1. Header Bar with Collapse Toggle & View Selector */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 backdrop-blur-sm shadow-inner">
            <BrainCircuit className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                Performance Analytics
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {categoryLabel || categoryName} Submodule
              </span>
            </div>
            <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
              {categoryLabel || categoryName} Practice History & Topic Mastery
            </h2>
          </div>
        </div>

        {/* Tab & Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {hasAttempts && (
            <div className="flex bg-white/10 p-1 rounded-xl border border-white/10 backdrop-blur-xs text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('analytics');
                  setIsExpanded(true);
                }}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Charts & Topics</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('history');
                  setIsExpanded(true);
                }}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History Log ({summary.totalDrills})</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/10 cursor-pointer"
            title={isExpanded ? 'Collapse Analytics' : 'Expand Analytics'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Collapsible Content Area */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* KPI Summary Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Drills Attempted */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Drills Taken</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900">{summary.totalDrills || 0}</span>
                <span className="text-[10px] text-slate-500 block font-medium">in {categoryLabel}</span>
              </div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <BrainCircuit className="w-5 h-5" />
              </div>
            </div>

            {/* Average Score */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Avg</span>
                <span className={`text-xl sm:text-2xl font-black ${
                  (summary.overallAvg || 0) >= 75
                    ? 'text-emerald-600'
                    : (summary.overallAvg || 0) >= 50
                    ? 'text-amber-600'
                    : 'text-slate-900'
                }`}>
                  {summary.overallAvg || 0}%
                </span>
                <span className="text-[10px] text-slate-500 block font-medium">accuracy level</span>
              </div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
            </div>

            {/* Strong Topics */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Strong Topics</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-800">{summary.strongCount || 0}</span>
                <span className="text-[10px] text-emerald-600 block font-medium">≥75% mastery</span>
              </div>
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Weak Topics / Practice Needed */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              (summary.weakCount || 0) > 0
                ? 'bg-rose-50/70 border-rose-200'
                : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  (summary.weakCount || 0) > 0 ? 'text-rose-700' : 'text-slate-400'
                }`}>
                  Weak Topics
                </span>
                <span className={`text-xl sm:text-2xl font-black ${
                  (summary.weakCount || 0) > 0 ? 'text-rose-700' : 'text-slate-900'
                }`}>
                  {summary.weakCount || 0}
                </span>
                <span className="text-[10px] text-slate-500 block font-medium">&lt;50% score</span>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                (summary.weakCount || 0) > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: VISUAL CHARTS & TOPIC BREAKDOWNS                   */}
          {/* ========================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {!hasAttempts ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">No Practice Drills Yet in {categoryLabel}</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Start taking self-practice tests or official topic baseline tests on any topic below. Your mastery circle chart, topic performance bars, and weak topic alerts will appear here automatically!
                  </p>
                </div>
              ) : (
                <>
                  {/* Chart Layout Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Visual Insights:</span>
                      <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setChartMode('both')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            chartMode === 'both' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Side-by-Side
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartMode('bar')}
                          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            chartMode === 'bar' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Bar Chart</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartMode('circle')}
                          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            chartMode === 'circle' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <PieChartIcon className="w-3.5 h-3.5" />
                          <span>Circle Chart</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter for bar topics */}
                    {(chartMode === 'bar' || chartMode === 'both') && (
                      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold text-slate-600">
                        <Filter className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="shrink-0 text-slate-400">Filter:</span>
                        {[
                          { id: 'all', label: `All (${barChart.length})` },
                          { id: 'weak', label: `Weak (${weakTopics.length})` },
                          { id: 'needs_practice', label: `Needs Practice (${needsPracticeTopics.length})` },
                          { id: 'strong', label: `Strong (${strongTopics.length})` }
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => setTopicFilter(btn.id)}
                            className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                              topicFilter === btn.id
                                ? 'bg-slate-900 text-white border-slate-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Visual Charts Deck */}
                  <div className={`grid gap-6 ${chartMode === 'both' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
                    {/* CHART 1: CIRCLE / DONUT CHART (Mastery Share) */}
                    {(chartMode === 'circle' || chartMode === 'both') && (
                      <div className={`${chartMode === 'both' ? 'lg:col-span-5' : 'max-w-xl mx-auto w-full'} bg-slate-50/70 p-5 rounded-3xl border border-slate-200/80 flex flex-col justify-between`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Circle Chart</h4>
                            <p className="text-sm font-black text-slate-900">Topic Mastery Breakdown</p>
                          </div>
                          <Badge variant="primary">
                            {donutChart.practicedCount || 0} Topics Practiced
                          </Badge>
                        </div>

                        {/* SVG Donut */}
                        <div className="relative w-48 h-48 mx-auto my-2 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            {/* Background Track */}
                            <path
                              className="text-slate-200"
                              strokeWidth="3.8"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            {/* Animated Segments */}
                            {donutSegments.map((seg, i) => (
                              <path
                                key={i}
                                stroke={seg.color}
                                strokeWidth="4.2"
                                strokeDasharray={seg.strokeDasharray}
                                strokeDashoffset={seg.strokeDashoffset}
                                strokeLinecap="round"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                className="transition-all duration-700 hover:opacity-80"
                              />
                            ))}
                          </svg>

                          {/* Center Gauge Indicator */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proficiency</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                              {donutChart.overallProficiency || 0}%
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              (donutChart.overallProficiency || 0) >= 75
                                ? 'bg-emerald-100 text-emerald-800'
                                : (donutChart.overallProficiency || 0) >= 50
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {(donutChart.overallProficiency || 0) >= 75 ? 'Mastered' : (donutChart.overallProficiency || 0) >= 50 ? 'Intermediate' : 'Needs Work'}
                            </span>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="space-y-2 mt-4 pt-3 border-t border-slate-200/80 text-xs">
                          {donutSegments.map((seg, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${seg.bgColor}`} />
                                <span className="font-semibold text-slate-700">{seg.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{seg.count} topics</span>
                                <span className={`font-mono text-[11px] font-bold ${seg.textColor}`}>({seg.percentage}%)</span>
                              </div>
                            </div>
                          ))}
                          {donutChart.unpracticedCount > 0 && (
                            <div className="flex items-center justify-between text-slate-400">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-slate-300" />
                                <span>Unpracticed Topics</span>
                              </div>
                              <span className="font-semibold">{donutChart.unpracticedCount} topics</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CHART 2: BAR CHART (Topic-by-Topic Performance) */}
                    {(chartMode === 'bar' || chartMode === 'both') && (
                      <div className={`${chartMode === 'both' ? 'lg:col-span-7' : 'w-full'} bg-slate-50/70 p-5 rounded-3xl border border-slate-200/80 flex flex-col justify-between`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Bar Chart</h4>
                            <p className="text-sm font-black text-slate-900">Topic Performance Comparison</p>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            Showing {filteredBarTopics.length} topics
                          </span>
                        </div>

                        {/* Horizontal Bars */}
                        {filteredBarTopics.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-xs">
                            No topics matching the selected filter.
                          </div>
                        ) : (
                          <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                            {filteredBarTopics.map((item, idx) => {
                              const isStrong = item.classification === 'strong';
                              const isWeak = item.classification === 'weak';
                              const isPracticeNeeded = item.classification === 'needs_practice';

                              const barBg = isStrong
                                ? 'bg-emerald-500'
                                : isPracticeNeeded
                                ? 'bg-amber-500'
                                : 'bg-rose-500';

                              const badgeText = isStrong
                                ? 'Strong'
                                : isPracticeNeeded
                                ? 'Practice Needed'
                                : 'Weak Topic';

                              const badgeClass = isStrong
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPracticeNeeded
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800';

                              return (
                                <div key={idx} className="space-y-1 group">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        {item.topic}
                                      </span>
                                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${badgeClass}`}>
                                        {badgeText}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-[11px] text-slate-400 font-medium">
                                        {item.attemptsCount} {item.attemptsCount === 1 ? 'drill' : 'drills'}
                                      </span>
                                      <span className="font-black text-slate-900 font-mono w-10 text-right">
                                        {item.avgScore}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Progress Bar Container */}
                                  <div className="w-full h-3.5 bg-slate-200/80 rounded-full overflow-hidden relative shadow-inner">
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ease-out ${barBg}`}
                                      style={{ width: `${Math.max(item.avgScore, 4)}%` }}
                                    />
                                    {/* 75% Passing / Mastery Marker */}
                                    <div
                                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400/50 pointer-events-none"
                                      style={{ left: '75%' }}
                                      title="75% Mastery Target"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-200/80 font-medium">
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" /> Weak (&lt;50%)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" /> Needs Practice (50-74%)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> Strong (≥75%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Actionable Topic Lists: Weak Topics Alert & Practice Trigger */}
                  {weakTopics.length > 0 && (
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-50 to-pink-50/40 rounded-3xl border border-rose-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-rose-950">
                              Weak Topics — Priority Practice Needed ({weakTopics.length})
                            </h4>
                            <p className="text-xs text-rose-700">
                              These topics have average score below 50%. Practice drills are recommended to reach 75% benchmark.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                        {weakTopics.map((wt) => (
                          <div
                            key={wt.topic}
                            className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-2xs flex items-center justify-between gap-2 hover:border-rose-300 transition"
                          >
                            <div>
                              <p className="font-bold text-xs text-slate-900">{wt.topic}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                  Avg: {wt.avgPercentage}%
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {wt.attemptsCount} {wt.attemptsCount === 1 ? 'attempt' : 'attempts'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (onStartPractice) {
                                  onStartPractice({ _id: wt.topicId, title: wt.topic, category: wt.category });
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>Practice</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strong Topics Commendation */}
                  {strongTopics.length > 0 && (
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-teal-50/40 rounded-3xl border border-emerald-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-emerald-950">
                            Strong Topics Mastered ({strongTopics.length})
                          </h4>
                          <p className="text-xs text-emerald-700">
                            Great work! You have achieved 75%+ score on these topics.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {strongTopics.map((st) => (
                          <div
                            key={st.topic}
                            className="bg-white px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{st.topic}</span>
                            <span className="text-emerald-700 font-mono font-black">({st.avgPercentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PAST PRACTICE DRILLS HISTORY LOG                   */}
          {/* ========================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-slate-900">Recent Practice Drills History</h4>
                  <p className="text-xs text-slate-500">Chronological history of self-practice evaluations taken in this submodule.</p>
                </div>
                <Badge variant="primary">{recentAttempts.length} Recent Tests</Badge>
              </div>

              {recentAttempts.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  No practice test attempts recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {recentAttempts.map((att) => {
                    const isPassed = att.status === 'PASSED' || att.percentage >= 70;
                    const dateStr = att.attemptedAt
                      ? new Date(att.attemptedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Recent';

                    return (
                      <div
                        key={att._id}
                        className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-900">{att.topic}</span>
                            <Badge variant={isPassed ? 'success' : 'danger'}>
                              {isPassed ? 'Passed' : 'Needs Practice'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 font-medium truncate max-w-md">
                            {att.assessmentTitle}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {dateStr}
                            </span>
                            {att.timeSpentSeconds > 0 && (
                              <span>Time: {Math.round(att.timeSpentSeconds / 60)} mins</span>
                            )}
                          </div>
                        </div>

                        {/* Score & Retake Action */}
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <div className="text-base font-black text-slate-900 font-mono">
                              {att.score} / {att.totalMarks}
                            </div>
                            <span className={`text-xs font-bold font-mono ${
                              isPassed ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {att.percentage}%
                            </span>
                          </div>

                          {att.assessmentId && (
                            <button
                              type="button"
                              onClick={() => navigate(`/student/practice/${att.assessmentId}`)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Retake this test"
                            >
                              <RotateCcw className="w-3 h-3 text-slate-500" />
                              <span>Retake</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubmodulePracticeAnalytics;
