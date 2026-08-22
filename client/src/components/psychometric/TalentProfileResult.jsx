import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Award,
  CheckCircle2,
  Target,
  Users,
  Compass,
  Zap,
  Lightbulb,
  ShieldCheck,
  Building2,
  Clock,
  Printer,
  RotateCcw,
  FileText,
  TrendingUp,
  ArrowRight,
  Lock,
  Info
} from 'lucide-react';
import Button from '../Button';
import RadarChart from '../RadarChart';
import OnePageTalentReport from '../OnePageTalentReport';

const COMPETENCY_ICONS = {
  communication: Users,
  teamwork: Users,
  leadership: Compass,
  adaptability: Zap,
  emotionalIntelligence: ShieldCheck,
  problemSolving: BrainCircuit,
  initiative: Sparkles,
  timeManagement: Clock,
  resilience: Target,
  professionalism: Award
};

const COMPETENCIES_ORDER = [
  { key: 'communication', label: 'Communication' },
  { key: 'teamwork', label: 'Teamwork' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'adaptability', label: 'Adaptability' },
  { key: 'emotionalIntelligence', label: 'Emotional Intelligence' },
  { key: 'problemSolving', label: 'Problem Solving' },
  { key: 'initiative', label: 'Initiative' },
  { key: 'timeManagement', label: 'Time Management' },
  { key: 'resilience', label: 'Resilience' },
  { key: 'professionalism', label: 'Professionalism' }
];

export const TalentProfileResult = ({
  profile,
  cooldown = null,
  onRetakeAssessment
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (!profile) return null;

  const overallScore = profile.overallScore ?? profile.employabilityIndex ?? 82;
  const overallReadiness = profile.overallReadiness || (overallScore >= 85 ? 'Exceptional' : overallScore >= 70 ? 'Strong' : 'Developing');
  const aiSummary = profile.aiAnalysis?.aiSummary || profile.aiSummary || 'Your assessment demonstrates high analytical discipline and collaborative readiness across key technical and behavioral dimensions.';
  const strengths = profile.strengths || [];
  const developmentAreas = profile.developmentAreas || [];
  const recommendations = profile.recommendations || [];
  const workEnvironments = profile.suggestedWorkEnvironment || [
    'Collaborative cross-functional engineering teams',
    'Fast-paced, technology-driven environments',
    'Structured enterprise teams with high delivery rigor'
  ];

  // 24-Hour Cooldown Calculation
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const lastAttemptTime = profile?.submittedAt || profile?.createdAt || profile?.evaluatedAt
    ? new Date(profile.submittedAt || profile.createdAt || profile.evaluatedAt).getTime()
    : 0;
  const elapsed = lastAttemptTime ? Date.now() - lastAttemptTime : TWENTY_FOUR_HOURS_MS;
  const isCooldownActive = cooldown?.canRetake === false || (lastAttemptTime > 0 && elapsed < TWENTY_FOUR_HOURS_MS);

  const remainingMs = Math.max(0, TWENTY_FOUR_HOURS_MS - elapsed);
  const remainingHours = cooldown?.remainingHours !== undefined ? cooldown.remainingHours : Math.floor(remainingMs / (60 * 60 * 1000));
  const remainingMinutes = cooldown?.remainingMinutes !== undefined ? cooldown.remainingMinutes : Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  const nextAvailableDate = new Date(lastAttemptTime + TWENTY_FOUR_HOURS_MS).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner: Overall Readiness Score */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-center md:text-left z-10 flex-1">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800/80 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Talent Profile
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
              Readiness: {overallReadiness}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Overall Professional Readiness
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl">
            {aiSummary}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
            <Button
              variant="primary"
              icon={FileText}
              onClick={() => setIsReportModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-xs font-bold shadow-md shadow-indigo-600/30"
            >
              View Full AI Talent Intelligence Report
            </Button>
            <Button
              variant="outline"
              icon={Printer}
              onClick={() => setIsReportModalOpen(true)}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Download / Print Report
            </Button>

            {/* Retake Button with 24-Hour Cooldown Logic */}
            {isCooldownActive ? (
              <div className="relative group">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800/80 text-slate-400 border border-slate-700 cursor-not-allowed select-none"
                  title={`Retake available in ${remainingHours}h ${remainingMinutes}m (Available on ${nextAvailableDate})`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Retake in {remainingHours}h {remainingMinutes}m</span>
                </button>
              </div>
            ) : (
              <Button
                variant="ghost"
                icon={RotateCcw}
                onClick={onRetakeAssessment}
                className="text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10"
              >
                Retake Assessment
              </Button>
            )}
          </div>

          {/* Cooldown Information Notice if active */}
          {isCooldownActive && (
            <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-950/50 px-3 py-1.5 rounded-xl border border-amber-800/60 max-w-xl">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Assessment cooldown active. In accordance with behavioral evaluation standards, you can retake this assessment after 24 hours (Available on <strong>{nextAvailableDate}</strong>).
              </span>
            </div>
          )}
        </div>

        {/* Readiness Index Circular Badge */}
        <div className="relative shrink-0 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl min-w-[150px]">
          <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 font-mono">
            {overallScore}
            <span className="text-lg text-slate-400 font-normal"> / 100</span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 mt-1">
            {overallReadiness}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Readiness Index
          </span>
        </div>
      </div>

      {/* 10-Dimension Radar Chart & Competency Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart (Left 6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-600" />
              10-Dimension Talent Radar
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Spider Matrix</span>
          </div>
          <RadarChart
            traitScores={profile.traitScores || {}}
            size={400}
            showBenchmark={true}
            benchmarkValue={70}
          />
        </div>

        {/* Competency Score Cards (Right 6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              Talent Competency Breakdown
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">10 Core Dimensions</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {COMPETENCIES_ORDER.map((c) => {
              const scoreObj = profile.traitScores?.[c.key] || { score: 75, level: 'Strong' };
              const score = typeof scoreObj === 'number' ? scoreObj : scoreObj.score || 75;
              const level = scoreObj.level || (score >= 85 ? 'Excellent' : score >= 70 ? 'Strong' : 'Developing');
              const Icon = COMPETENCY_ICONS[c.key] || Target;

              return (
                <div key={c.key} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Icon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{c.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.2 rounded-full ${
                        level === 'Excellent'
                          ? 'bg-emerald-100 text-emerald-800'
                          : level === 'Strong'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {level}
                      </span>
                      <span className="font-mono font-black text-slate-900">{score}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        score >= 85 ? 'bg-emerald-600' : score >= 70 ? 'bg-indigo-600' : 'bg-amber-600'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key Strengths & Development Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 3 Strengths */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Key Strengths (Top 3)
          </h3>
          <div className="space-y-3">
            {strengths.slice(0, 3).map((s, idx) => (
              <div
                key={idx}
                className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl space-y-1 text-xs text-emerald-950"
              >
                <div className="flex justify-between font-black text-emerald-900">
                  <span>{s.competency || `Strength #${idx + 1}`}</span>
                  {s.score && <span className="font-mono">{s.score}%</span>}
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {s.explanation || s.workplaceRelevance || (typeof s === 'string' ? s : '')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2-3 Development Areas */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            Development Areas
          </h3>
          <div className="space-y-3">
            {developmentAreas.slice(0, 3).map((g, idx) => (
              <div
                key={idx}
                className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-2xl space-y-1 text-xs text-amber-950"
              >
                <div className="flex justify-between font-black text-amber-900">
                  <span>{g.area || `Development Focus #${idx + 1}`}</span>
                  {g.currentScore && <span className="font-mono">{g.currentScore}%</span>}
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {g.improvementSuggestion || g.whyItMatters || (typeof g === 'string' ? g : '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations & Suggested Workplace Environments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3-5 AI Recommendations */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Zap className="w-4 h-4 text-indigo-600" />
            AI Recommendations (Actionable Steps)
          </h3>
          <div className="space-y-2.5">
            {recommendations.slice(0, 5).map((r, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-indigo-50/50 border border-indigo-200/50 rounded-2xl flex items-start gap-3 text-xs"
              >
                <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <strong className="text-indigo-950 block">{r.title}</strong>
                  <span className="text-slate-600 text-[11px] leading-relaxed">{r.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Workplace Environments */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            Suggested Workplace Environments
          </h3>
          <div className="space-y-2">
            {workEnvironments.map((env, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-xl flex items-center justify-between text-xs font-bold text-blue-950"
              >
                <span>{env}</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {isReportModalOpen && (
        <OnePageTalentReport
          attempt={profile}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TalentProfileResult;
