import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import LoadingState from '../../components/LoadingState';
import {
  BrainCircuit,
  Sparkles,
  Award,
  CheckCircle2,
  TrendingUp,
  Target,
  Users,
  Compass,
  ArrowRight,
  RotateCcw,
  Zap,
  Lightbulb,
  ShieldCheck,
  Building2
} from 'lucide-react';

export const PsychometricPage = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [takingTest, setTakingTest] = useState(false);

  // Form responses: { [questionId]: rating (1..5) }
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfileAndQuestions();
  }, []);

  const fetchProfileAndQuestions = async () => {
    setLoading(true);
    try {
      const [profileRes, questionsRes] = await Promise.all([
        api.getStudentPsychometricProfile(),
        api.getPsychometricQuestions()
      ]);

      if (profileRes.success && profileRes.hasProfile) {
        setProfile(profileRes.profile);
        setTakingTest(false);
      } else {
        setTakingTest(true);
      }

      if (questionsRes.success && questionsRes.questions) {
        setQuestions(questionsRes.questions);
      }
    } catch (err) {
      console.error('Error loading psychometric data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (qId, rating) => {
    setResponses((prev) => ({
      ...prev,
      [qId]: rating
    }));
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formattedResponses = questions.map((q) => ({
        questionId: q.id,
        questionText: q.prompt,
        dimension: q.dimension,
        rating: responses[q.id] || 3
      }));

      const res = await api.evaluatePsychometric({ responses: formattedResponses });
      if (res.success && res.profile) {
        setProfile(res.profile);
        setTakingTest(false);
      }
    } catch (err) {
      console.error('Error submitting evaluation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Connecting to AI Psychometric Engine..." />;

  const answeredCount = Object.keys(responses).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Psychometric Profiling"
        subtitle="Industrial behavioral fit analysis, Big Five personality mapping, and Employability Readiness Index."
        breadcrumbs={[
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Psychometric & AI' }
        ]}
        actions={
          profile && !takingTest && (
            <Button
              variant="outline"
              icon={RotateCcw}
              onClick={() => {
                setResponses({});
                setTakingTest(true);
              }}
            >
              Retake Evaluation
            </Button>
          )
        }
      />

      {/* VIEW 1: Psychometric Evaluation Questionnaire */}
      {takingTest ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Progress Header */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-600" />
                Situational Judgment & Behavioral Inventory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rate each statement honestly based on your standard work style and team habits.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:w-32 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-black text-indigo-700 whitespace-nowrap">
                {answeredCount} / {questions.length}
              </span>
            </div>
          </div>

          {/* Questions List */}
          <form onSubmit={handleSubmitEvaluation} className="space-y-4">
            {questions.map((q, idx) => {
              const currentRating = responses[q.id];
              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200/60">
                      {q.category}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Statement {idx + 1}</span>
                  </div>

                  <p className="text-sm font-bold text-slate-900 leading-relaxed">{q.prompt}</p>

                  {/* 1-5 Likert Options */}
                  <div className="grid grid-cols-5 gap-2 pt-2 text-center text-xs">
                    {[
                      { rating: 1, label: 'Strongly Disagree' },
                      { rating: 2, label: 'Disagree' },
                      { rating: 3, label: 'Neutral' },
                      { rating: 4, label: 'Agree' },
                      { rating: 5, label: 'Strongly Agree' }
                    ].map((opt) => {
                      const isSelected = currentRating === opt.rating;
                      return (
                        <button
                          key={opt.rating}
                          type="button"
                          onClick={() => handleRatingChange(q.id, opt.rating)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-sm shadow-indigo-500/20'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span className="font-black text-sm">{opt.rating}</span>
                          <span className="text-[10px] hidden sm:block leading-tight mt-1 line-clamp-1">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                icon={Sparkles}
                loading={submitting}
                disabled={answeredCount < questions.length}
                className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-sm font-bold shadow-md shadow-indigo-500/20"
              >
                {answeredCount < questions.length
                  ? `Please answer all questions (${answeredCount}/${questions.length})`
                  : 'Generate AI Psychometric Profile'}
              </Button>
            </div>
          </form>
        </div>
      ) : profile ? (
        /* VIEW 2: AI Psychometric Report & Analytics */
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Banner: Employability Readiness Index */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left z-10">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800/80">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                AI Evaluated Report ({profile.aiProvider?.toUpperCase() || 'GEMINI'})
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Employability Readiness Index
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {profile.aiSummary ||
                  'Your profile demonstrates high analytical discipline and collaborative readiness for top placement drives.'}
              </p>
            </div>

            {/* Circular Readiness Gauge */}
            <div className="relative shrink-0 flex flex-col items-center justify-center p-5 rounded-full bg-slate-900/80 border border-indigo-500/30 shadow-2xl">
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                {profile.employabilityIndex}%
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Readiness Score
              </span>
            </div>
          </div>

          {/* Personality & Behavioral Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Big Five Personality Traits */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-blue-600" />
                  Big Five Personality Dimensions
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">Standard Norms</span>
              </div>

              <div className="space-y-3.5">
                {[
                  { key: 'openness', label: 'Openness to Experience', desc: 'Innovation, curiosity & adaptability' },
                  { key: 'conscientiousness', label: 'Conscientiousness', desc: 'Discipline, quality & goal execution' },
                  { key: 'extraversion', label: 'Extraversion', desc: 'Interpersonal engagement & energy' },
                  { key: 'agreeableness', label: 'Agreeableness', desc: 'Empathy, trust & team harmony' },
                  { key: 'emotionalStability', label: 'Emotional Stability', desc: 'Stress resilience & composure' }
                ].map((trait) => {
                  const val = profile.personalityTraits?.[trait.key] || 75;
                  return (
                    <div key={trait.key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{trait.label}</span>
                          <span className="text-[10px] text-slate-400 block">{trait.desc}</span>
                        </div>
                        <span className="font-black text-blue-700">{val}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Workplace Behavioral Fit */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  Workplace Behavioral Competencies
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">Industry Scale</span>
              </div>

              <div className="space-y-3.5">
                {[
                  { key: 'problemSolving', label: 'Problem Solving & Logic', desc: 'Decomposing complex technical challenges' },
                  { key: 'teamwork', label: 'Teamwork & Synergy', desc: 'Cross-functional collaborative alignment' },
                  { key: 'adaptability', label: 'Agile Adaptability', desc: 'Pivoting smoothly with project changes' },
                  { key: 'communication', label: 'Technical Articulation', desc: 'Expressing ideas clearly and concisely' },
                  { key: 'leadership', label: 'Ownership & Initiative', desc: 'Proactively driving project milestones' }
                ].map((comp) => {
                  const val = profile.behavioralFit?.[comp.key] || 80;
                  return (
                    <div key={comp.key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{comp.label}</span>
                          <span className="text-[10px] text-slate-400 block">{comp.desc}</span>
                        </div>
                        <span className="font-black text-indigo-700">{val}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Strengths & Growth Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Validated Core Strengths
              </h3>
              <div className="space-y-2.5">
                {profile.strengths?.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-950 font-medium leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Areas */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                High-Impact Growth Opportunities
              </h3>
              <div className="space-y-2.5">
                {profile.growthAreas?.map((g, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950 font-medium leading-relaxed"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Career Roles & Action Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Career Fit */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Compass className="w-4 h-4 text-blue-600" />
                Recommended Industry Career Roles
              </h3>
              <div className="space-y-2">
                {profile.careerFit?.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-xl flex items-center justify-between text-xs font-bold text-blue-950"
                  >
                    <span>{c}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Plan */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Zap className="w-4 h-4 text-indigo-600" />
                Personalized Career Acceleration Steps
              </h3>
              <div className="space-y-2">
                {profile.actionPlan?.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-indigo-50/60 border border-indigo-200/60 rounded-xl flex items-center gap-2.5 text-xs text-indigo-950 font-medium"
                  >
                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PsychometricPage;
