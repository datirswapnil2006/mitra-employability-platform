import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import RadarChart from '../../components/RadarChart';
import OnePageTalentReport from '../../components/OnePageTalentReport';
import { OFFICIAL_DEPARTMENTS } from '../../constants/departments';
import {
  BrainCircuit,
  Sparkles,
  Users,
  Award,
  TrendingUp,
  Building2,
  CheckCircle2,
  Eye,
  Target,
  Plus,
  AlertCircle,
  Trash2,
  Layers,
  BookOpen,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Printer,
  Check
} from 'lucide-react';

const CATEGORIES = [
  'Behavioral Assessment',
  'Personality Traits',
  'Cognitive Ability',
  'Emotional Intelligence',
  'Aptitude Profiling',
  'Employability Skills'
];

const ALL_COMPETENCIES = [
  'Communication',
  'Teamwork',
  'Leadership',
  'Adaptability',
  'Emotional Intelligence',
  'Problem Solving',
  'Initiative',
  'Time Management',
  'Resilience',
  'Professionalism'
];

const QUESTION_TYPES = [
  { id: 'LIKERT', label: 'Likert Agreement (5-Point)' },
  { id: 'FREQUENCY', label: 'Frequency Scale (5-Point)' },
  { id: 'SITUATIONAL_JUDGMENT', label: 'Situational Judgment' },
  { id: 'FORCED_CHOICE', label: 'Forced Choice (A vs B)' },
  { id: 'RANKING', label: 'Priority Ranking' },
  { id: 'SELF_ASSESSMENT', label: 'Self Assessment' },
  { id: 'SCENARIO_BASED', label: 'Scenario Based' }
];

export const AIAssessmentGenPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'builder' | 'candidates' | 'analytics'

  // Tests & Summary State
  const [tests, setTests] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalEvaluated: 0,
    avgReadiness: 0,
    departmentReadiness: [],
    competencyAverages: [],
    attempts: []
  });

  // Filters for Candidates Tab
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All');
  const [scoreFilter, setScoreFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Student Attempt for Talent Profile Modal & Print Report
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);

  // Selected Test for Preview Modal
  const [previewTest, setPreviewTest] = useState(null);

  // Success / Error Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ==========================================
  // AI QUESTION BUILDER STATE (6-STEP WIZARD)
  // ==========================================
  const [wizardStep, setWizardStep] = useState(1); // 1 to 6
  const [builderForm, setBuilderForm] = useState({
    title: 'Senior Campus Placement Behavioral Battery',
    description: 'Comprehensive situational judgment and behavioral profiling evaluation designed for campus recruitment readiness.',
    category: 'Behavioral Assessment',
    questionCount: 50,
    durationMinutes: 25,
    targetRole: 'Software Engineer & Technical Consultant',
    competencies: [...ALL_COMPETENCIES]
  });
  const [questionCountError, setQuestionCountError] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generatingMissing, setGeneratingMissing] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState(null);

  // Helper for auto-suggested duration
  const getSuggestedDuration = (count) => {
    const n = parseInt(count, 10) || 50;
    if (n <= 10) return 5;
    if (n <= 25) return 15;
    return 25;
  };

  // Dynamic distribution calculator for client-side live preview
  const computeClientTypeDistribution = (count) => {
    const c = Math.max(1, Math.min(50, Math.round(Number(count) || 50)));
    if (c === 1) return [{ type: 'Likert Agreement (5-Point)', count: 1 }];
    if (c === 2) return [{ type: 'Likert Agreement (5-Point)', count: 1 }, { type: 'Situational Judgment', count: 1 }];
    if (c === 3) return [{ type: 'Likert Agreement (5-Point)', count: 1 }, { type: 'Frequency Scale (5-Point)', count: 1 }, { type: 'Situational Judgment', count: 1 }];
    if (c === 4) return [{ type: 'Likert Agreement (5-Point)', count: 2 }, { type: 'Frequency Scale (5-Point)', count: 1 }, { type: 'Situational Judgment', count: 1 }];
    if (c === 5) return [{ type: 'Likert Agreement (5-Point)', count: 2 }, { type: 'Frequency Scale (5-Point)', count: 1 }, { type: 'Situational Judgment', count: 1 }, { type: 'Forced Choice (A vs B)', count: 1 }];
    if (c === 10) {
      return [
        { type: 'Likert Agreement (5-Point)', count: 3 },
        { type: 'Frequency Scale (5-Point)', count: 2 },
        { type: 'Situational Judgment', count: 2 },
        { type: 'Forced Choice (A vs B)', count: 1 },
        { type: 'Priority Ranking', count: 1 },
        { type: 'Scenario Based', count: 1 }
      ];
    }
    if (c === 20) {
      return [
        { type: 'Likert Agreement (5-Point)', count: 6 },
        { type: 'Frequency Scale (5-Point)', count: 3 },
        { type: 'Situational Judgment', count: 3 },
        { type: 'Forced Choice (A vs B)', count: 3 },
        { type: 'Priority Ranking', count: 2 },
        { type: 'Scenario Based', count: 3 }
      ];
    }
    if (c === 25) {
      return [
        { type: 'Likert Agreement (5-Point)', count: 7 },
        { type: 'Frequency Scale (5-Point)', count: 4 },
        { type: 'Situational Judgment', count: 4 },
        { type: 'Forced Choice (A vs B)', count: 4 },
        { type: 'Priority Ranking', count: 3 },
        { type: 'Scenario Based', count: 3 }
      ];
    }
    if (c === 50) {
      return [
        { type: 'Likert Agreement (5-Point)', count: 15 },
        { type: 'Frequency Scale (5-Point)', count: 8 },
        { type: 'Situational Judgment', count: 8 },
        { type: 'Forced Choice (A vs B)', count: 6 },
        { type: 'Priority Ranking', count: 5 },
        { type: 'Self Assessment', count: 4 },
        { type: 'Scenario Based', count: 4 }
      ];
    }

    // Largest remainder calculation
    const ratios = [
      { type: 'Likert Agreement (5-Point)', ratio: 0.30 },
      { type: 'Frequency Scale (5-Point)', ratio: 0.16 },
      { type: 'Situational Judgment', ratio: 0.16 },
      { type: 'Forced Choice (A vs B)', ratio: 0.12 },
      { type: 'Priority Ranking', ratio: 0.10 },
      { type: 'Scenario Based', ratio: 0.08 },
      { type: 'Self Assessment', ratio: 0.08 }
    ];

    let allocated = 0;
    const list = ratios.map(r => {
      const raw = c * r.ratio;
      const floor = Math.floor(raw);
      allocated += floor;
      return { type: r.type, count: floor, rem: raw - floor };
    });

    list.sort((a, b) => b.rem - a.rem);
    let remCount = c - allocated;
    let i = 0;
    while (remCount > 0 && i < list.length) {
      list[i].count += 1;
      remCount -= 1;
      i += 1;
    }

    return list.filter(item => item.count > 0);
  };

  const computeClientCompetencyDistribution = (count, comps) => {
    const c = Math.max(1, Math.min(50, Math.round(Number(count) || 50)));
    const active = comps.length > 0 ? comps : ALL_COMPETENCIES;
    const base = Math.floor(c / active.length);
    const rem = c % active.length;

    const res = {};
    active.forEach((comp, idx) => {
      res[comp] = base + (idx < rem ? 1 : 0);
    });
    return res;
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [testsRes, summaryRes] = await Promise.all([
        api.getPsychometricTests(),
        api.getPsychometricAdminSummary()
      ]);

      if (testsRes.success && testsRes.tests) {
        setTests(testsRes.tests);
      }
      if (summaryRes.success) {
        setSummaryData({
          totalEvaluated: summaryRes.totalEvaluated || 0,
          avgReadiness: summaryRes.avgReadiness || 0,
          departmentReadiness: summaryRes.departmentReadiness || [],
          competencyAverages: summaryRes.competencyAverages || [],
          attempts: summaryRes.attempts || []
        });
      }
    } catch (err) {
      console.error('Error loading psychometric admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 6000);
  };

  // Toggle Test Active Status
  const handleToggleTest = async (testId) => {
    try {
      const res = await api.togglePsychometricTestStatus(testId);
      if (res.success) {
        showSuccess(res.message || 'Assessment status updated.');
        fetchInitialData();
      }
    } catch (err) {
      showError('Failed to toggle assessment status.');
    }
  };

  // Delete Test
  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this psychometric assessment? Historical student attempts will be preserved.')) return;
    try {
      const res = await api.deletePsychometricTest(testId);
      if (res.success) {
        setTests(prev => prev.filter(t => t._id !== testId));
        showSuccess('Assessment deleted successfully.');
        fetchInitialData();
      } else {
        showError(res.message || 'Failed to delete assessment.');
      }
    } catch (err) {
      showError('Failed to delete assessment.');
    }
  };

  // Handle Question Count Change with Strict 1-50 Integer Validation
  const handleQuestionCountChange = (val) => {
    const raw = String(val).trim();
    if (raw === '') {
      setBuilderForm(prev => ({ ...prev, questionCount: '' }));
      setQuestionCountError('Please enter a number between 1 and 50.');
      return;
    }

    if (raw.includes('.')) {
      setQuestionCountError('Only integer values are allowed (decimals rejected).');
      return;
    }

    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) {
      setQuestionCountError('Please enter a valid integer.');
      return;
    }

    if (parsed < 1) {
      setQuestionCountError('Minimum question count is 1.');
      setBuilderForm(prev => ({ ...prev, questionCount: 1, durationMinutes: getSuggestedDuration(1) }));
      return;
    }

    if (parsed > 50) {
      setQuestionCountError('Maximum allowed questions = 50.');
      setBuilderForm(prev => ({ ...prev, questionCount: 50, durationMinutes: getSuggestedDuration(50) }));
      return;
    }

    setQuestionCountError('');
    setBuilderForm(prev => ({
      ...prev,
      questionCount: parsed,
      durationMinutes: getSuggestedDuration(parsed)
    }));
  };

  // Run AI Dynamic Question Generation (Step 3 -> Step 4 -> Step 5)
  const handleGenerateQuestions = async () => {
    const count = parseInt(builderForm.questionCount, 10);
    if (isNaN(count) || count < 1 || count > 50) {
      showError('Please configure a valid question count between 1 and 50.');
      setWizardStep(1);
      return;
    }

    setGeneratingAI(true);
    setWizardStep(4);
    try {
      const res = await api.generateDynamicAIQuestions({
        title: builderForm.title,
        category: builderForm.category,
        targetRole: builderForm.targetRole,
        questionCount: count,
        competencies: builderForm.competencies
      });

      if (res.success && res.questions) {
        setGeneratedQuestions(res.questions);
        setValidationResult(res.validation || {
          valid: res.questions.length === count,
          requestedCount: count,
          generatedCount: res.questions.length,
          validCount: res.questions.length,
          issues: []
        });
        setTimeout(() => {
          setGeneratingAI(false);
          setWizardStep(5);
        }, 1200);
      } else {
        setGeneratingAI(false);
        showError(res.message || 'AI Generation failed.');
        setWizardStep(3);
      }
    } catch (err) {
      setGeneratingAI(false);
      showError('Error connecting to AI Generation service.');
      setWizardStep(3);
    }
  };

  // Generate Missing Questions when generated count < requested count
  const handleGenerateMissingQuestions = async () => {
    const targetCount = parseInt(builderForm.questionCount, 10);
    setGeneratingMissing(true);
    try {
      const res = await api.generateMissingAIQuestions({
        title: builderForm.title,
        category: builderForm.category,
        targetRole: builderForm.targetRole,
        currentQuestions: generatedQuestions,
        targetCount,
        competencies: builderForm.competencies
      });

      if (res.success && res.questions) {
        setGeneratedQuestions(res.questions);
        setValidationResult(res.validation || {
          valid: res.questions.length === targetCount,
          requestedCount: targetCount,
          generatedCount: res.questions.length,
          validCount: res.questions.length,
          issues: []
        });
        showSuccess(res.message || 'Missing questions generated successfully.');
      } else {
        showError(res.message || 'Failed to generate missing questions.');
      }
    } catch (err) {
      showError('Error generating missing questions.');
    } finally {
      setGeneratingMissing(false);
    }
  };

  // Save / Publish Generated Test (Step 6)
  const handlePublishTest = async () => {
    const count = parseInt(builderForm.questionCount, 10);
    if (generatedQuestions.length !== count) {
      showError(`Cannot publish: Assessment requires exactly ${count} questions, but only ${generatedQuestions.length} are generated.`);
      setWizardStep(5);
      return;
    }

    try {
      const res = await api.createPsychometricTest({
        title: builderForm.title,
        description: builderForm.description,
        category: builderForm.category,
        questionCount: count,
        questionsCount: count,
        durationMinutes: builderForm.durationMinutes,
        competencies: builderForm.competencies,
        questions: generatedQuestions,
        status: 'published'
      });

      if (res.success) {
        showSuccess(`New ${count}-question AI Psychometric Assessment published to students!`);
        fetchInitialData();
        setActiveTab('library');
        setWizardStep(1);
        setGeneratedQuestions([]);
      } else {
        showError(res.message || 'Failed to publish assessment.');
      }
    } catch (err) {
      showError('Error saving assessment.');
    }
  };

  // Filter Candidates
  const filteredAttempts = summaryData.attempts.filter((a) => {
    const matchesDept = departmentFilter === 'All' || a.department === departmentFilter || a.user?.department === departmentFilter;
    const matchesBatch = batchFilter === 'All' || a.batch === batchFilter || a.user?.batch === batchFilter;
    const score = a.overallScore || 0;
    let matchesScore = true;
    if (scoreFilter === '85+') matchesScore = score >= 85;
    else if (scoreFilter === '70-84') matchesScore = score >= 70 && score < 85;
    else if (scoreFilter === '55-69') matchesScore = score >= 55 && score < 70;
    else if (scoreFilter === '<55') matchesScore = score < 55;

    const matchesSearch =
      !searchQuery ||
      a.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.erpNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDept && matchesBatch && matchesScore && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Psychometric Assessment & Behavioral Profiling"
        subtitle="AI-driven dynamic talent intelligence engine, competency distribution matrix, and candidate readiness reports."
        breadcrumbs={[
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Psychometric Intelligence' }
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="primary"
              icon={Sparkles}
              onClick={() => {
                setWizardStep(1);
                setActiveTab('builder');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 font-bold"
            >
              AI Assessment Builder
            </Button>
          </div>
        }
      />

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center gap-2.5 font-bold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-2xl flex items-center gap-2.5 font-bold shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top Macro Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Candidate Evaluations</span>
            <span className="text-2xl font-black text-slate-900">{summaryData.totalEvaluated}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Cohort Avg Readiness</span>
            <span className="text-2xl font-black text-emerald-600">{summaryData.avgReadiness}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Active Assessments</span>
            <span className="text-2xl font-black text-indigo-700">{tests.filter(t => t.isActive).length} Active</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex border border-slate-200 shadow-inner max-w-2xl">
        {[
          { id: 'library', label: 'Assessment Library', icon: BookOpen, count: tests.length },
          { id: 'builder', label: 'AI Builder', icon: Sparkles },
          { id: 'candidates', label: 'Student Reports', icon: Users, count: summaryData.totalEvaluated },
          { id: 'analytics', label: 'Cohort Analytics', icon: TrendingUp }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* TAB 1: ASSESSMENT LIBRARY */}
      {/* ========================================== */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Published Psychometric Assessments ({tests.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage dynamic behavioral inventories, toggle active tests for student batches, and review questions.
              </p>
            </div>

            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => {
                setWizardStep(1);
                setActiveTab('builder');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 shrink-0 font-bold"
            >
              Create New Assessment
            </Button>
          </div>

          {loading ? (
            <LoadingState message="Loading psychometric tests..." />
          ) : tests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map((t) => (
                <div
                  key={t._id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4 hover:border-indigo-200 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                        {t.category}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        t.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                        {t.isActive ? 'Active for Students' : 'Draft / Inactive'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-900 tracking-tight">{t.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {t.description || '50-item calibrated psychological assessment evaluating 10 workplace competencies.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50 rounded-2xl p-3 text-center border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Questions</span>
                        <span className="font-mono font-black text-slate-900">{t.questions?.length || t.questionsCount || 50} Items</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Duration</span>
                        <span className="font-mono font-black text-slate-900">{t.durationMinutes || 20} Mins</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Attempts</span>
                        <span className="font-mono font-black text-indigo-700">{t.attemptsCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Eye}
                        onClick={() => setPreviewTest(t)}
                        className="text-xs py-1.5"
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={t.isActive ? ToggleRight : ToggleLeft}
                        onClick={() => handleToggleTest(t._id)}
                        className={`text-xs py-1.5 ${t.isActive ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-600'}`}
                      >
                        {t.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTest(t._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Delete assessment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Assessments in Library"
              description="Create your first 50-question AI Psychometric Assessment using the AI Builder."
              actionLabel="Launch AI 50-Question Builder"
              onAction={() => {
                setWizardStep(1);
                setActiveTab('builder');
              }}
            />
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: AI 50-QUESTION ASSESSMENT BUILDER */}
      {/* ========================================== */}
      {activeTab === 'builder' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          {/* Step Progress Tracker */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {[
                { step: 1, title: 'Details' },
                { step: 2, title: 'Competencies' },
                { step: 3, title: 'AI Blueprint' },
                { step: 4, title: 'Generation' },
                { step: 5, title: 'Review Qs' },
                { step: 6, title: 'Publish' }
              ].map((s, idx) => {
                const isCompleted = wizardStep > s.step;
                const isCurrent = wizardStep === s.step;
                return (
                  <React.Fragment key={s.step}>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : s.step}
                      </div>
                      <span className={`text-[10px] font-bold ${isCurrent ? 'text-indigo-700' : 'text-slate-400'}`}>
                        {s.title}
                      </span>
                    </div>
                    {idx < 5 && (
                      <div className={`flex-1 h-0.5 mx-2 ${wizardStep > idx + 1 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* STEP 1: ASSESSMENT DETAILS */}
          {wizardStep === 1 && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-slate-900">Step 1: Configure Assessment Details</h3>
                <p className="text-xs text-slate-500">Define the assessment title, target role, question count (1 to 50), and time limit.</p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Assessment Title *"
                  value={builderForm.title}
                  onChange={(e) => setBuilderForm({ ...builderForm, title: e.target.value })}
                  placeholder="e.g. Senior Campus Placement Behavioral Assessment"
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Assessment Description</label>
                  <textarea
                    rows={3}
                    value={builderForm.description}
                    onChange={(e) => setBuilderForm({ ...builderForm, description: e.target.value })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Question Count Configuration Field */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-200/80 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                        Number of Questions *
                      </label>
                      <span className="text-[11px] text-indigo-700 font-medium block">
                        Choose between 1 and 50 questions.
                      </span>
                    </div>

                    <div className="w-full sm:w-32">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        step={1}
                        value={builderForm.questionCount}
                        onChange={(e) => handleQuestionCountChange(e.target.value)}
                        className={`w-full text-center text-sm font-black p-2 border rounded-xl focus:ring-2 focus:outline-hidden ${
                          questionCountError
                            ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-400'
                            : 'border-indigo-300 bg-white text-indigo-950 focus:ring-indigo-500 shadow-xs'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Quick Select Presets */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quick Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[5, 10, 15, 20, 25, 30, 40, 50].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleQuestionCountChange(preset)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            Number(builderForm.questionCount) === preset
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-indigo-200/60 hover:bg-indigo-50 hover:text-indigo-900'
                          }`}
                        >
                          {preset} Qs
                        </button>
                      ))}
                    </div>
                  </div>

                  {questionCountError && (
                    <div className="text-xs text-rose-600 font-bold flex items-center gap-1.5 pt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{questionCountError}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Assessment Category"
                    options={CATEGORIES}
                    value={builderForm.category}
                    onChange={(e) => setBuilderForm({ ...builderForm, category: e.target.value })}
                  />
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-700">Estimated Duration (Minutes)</label>
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        Suggested: {getSuggestedDuration(builderForm.questionCount)}m
                      </span>
                    </div>
                    <Select
                      options={['5', '10', '15', '20', '25', '30', '45', '60']}
                      value={String(builderForm.durationMinutes)}
                      onChange={(e) => setBuilderForm({ ...builderForm, durationMinutes: parseInt(e.target.value, 10) })}
                    />
                  </div>
                </div>

                <Input
                  label="Target Career Role / Industry Focus *"
                  value={builderForm.targetRole}
                  onChange={(e) => setBuilderForm({ ...builderForm, targetRole: e.target.value })}
                  placeholder="e.g. Full-Stack Software Engineer, Data Scientist, Tech Consultant"
                  required
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  disabled={Boolean(questionCountError) || !builderForm.questionCount}
                  onClick={() => setWizardStep(2)}
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                >
                  Continue to Competencies
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: COMPETENCY SELECTION */}
          {wizardStep === 2 && (() => {
            const compDist = computeClientCompetencyDistribution(builderForm.questionCount, builderForm.competencies);
            return (
              <div className="max-w-3xl mx-auto space-y-5">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Step 2: Select Competency Dimensions</h3>
                  <p className="text-xs text-slate-500">
                    The {builderForm.questionCount} questions will be dynamically balanced across the selected competencies.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_COMPETENCIES.map((comp) => {
                    const isSelected = builderForm.competencies.includes(comp);
                    const compCount = compDist[comp] || 0;
                    return (
                      <div
                        key={comp}
                        onClick={() => {
                          const updated = isSelected
                            ? builderForm.competencies.filter((c) => c !== comp)
                            : [...builderForm.competencies, comp];
                          setBuilderForm({ ...builderForm, competencies: updated });
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </div>
                          <span className="text-xs">{comp}</span>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-700 bg-white/80 px-2 py-0.5 rounded border border-indigo-200/60 font-black">
                          {isSelected ? `${compCount} Qs` : '0 Qs'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setWizardStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    icon={ArrowRight}
                    onClick={() => setWizardStep(3)}
                    disabled={builderForm.competencies.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                  >
                    Review AI Blueprint
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* STEP 3: AI BLUEPRINT MATRIX */}
          {wizardStep === 3 && (() => {
            const clientTypes = computeClientTypeDistribution(builderForm.questionCount);
            const clientComps = computeClientCompetencyDistribution(builderForm.questionCount, builderForm.competencies);
            const count = parseInt(builderForm.questionCount, 10) || 50;

            return (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-slate-900">
                    Step 3: {count}-Question AI Generation Blueprint
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dynamic calibrated distribution calculated for exactly {count} questions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Competency Distribution */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-600" />
                        Competencies ({builderForm.competencies.length})
                      </span>
                      <span className="font-mono text-indigo-700 font-black">Total: {count}</span>
                    </h4>
                    <div className="space-y-1.5 text-xs max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {Object.entries(clientComps).map(([comp, n]) => (
                        <div key={comp} className="flex justify-between items-center py-1 border-b border-slate-100">
                          <span className="text-slate-700">{comp}</span>
                          <span className="font-mono font-black text-indigo-700">{n} Questions</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question Type Distribution */}
                  <div className="p-4 bg-indigo-50/50 border border-indigo-200/70 rounded-2xl space-y-3">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-900 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        Format Distribution
                      </span>
                      <span className="font-mono text-indigo-700 font-black">Total: {count}</span>
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {clientTypes.map((fmt) => (
                        <div key={fmt.type} className="flex justify-between items-center py-1 border-b border-indigo-100">
                          <span className="text-indigo-950 font-medium">{fmt.type}</span>
                          <span className="font-mono font-black text-indigo-700">{fmt.count} Questions</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-3 text-xs text-purple-950">
                  <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                  <span>
                    AI will dynamically generate <strong>exactly {count} questions</strong> balanced according to this blueprint.
                  </span>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setWizardStep(2)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    icon={Sparkles}
                    onClick={handleGenerateQuestions}
                    className="bg-indigo-600 hover:bg-indigo-700 text-sm font-bold shadow-lg shadow-indigo-600/30"
                  >
                    Generate {count} Questions with AI
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* STEP 4: AI GENERATION IN PROGRESS */}
          {wizardStep === 4 && (
            <div className="max-w-md mx-auto py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto animate-bounce">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Synthesizing {builderForm.questionCount}-Item Psychometric Inventory...
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Applying industrial behavioral mapping, balancing reverse-scored questions, and validating collegiate readability.
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                <div className="bg-indigo-600 h-full rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & EDIT QUESTIONS WITH VALIDATION BEFORE PUBLISH */}
          {wizardStep === 5 && (() => {
            const targetCount = parseInt(builderForm.questionCount, 10) || 50;
            const currentCount = generatedQuestions.length;
            const isComplete = currentCount === targetCount;
            const missingCount = Math.max(0, targetCount - currentCount);

            return (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Review & Refine Generated Questions
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target: <strong>{targetCount}</strong> questions • Generated: <strong>{currentCount}</strong> questions
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setWizardStep(3)} className="text-xs">
                      Regenerate All
                    </Button>
                    <Button
                      variant="primary"
                      icon={ArrowRight}
                      disabled={!isComplete}
                      onClick={() => setWizardStep(6)}
                      className={`font-bold text-xs ${
                        isComplete ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Proceed to Publish
                    </Button>
                  </div>
                </div>

                {/* Validation Status Card */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isComplete
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isComplete ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {isComplete ? 'Ready to Publish' : 'Missing Questions'}
                      </span>
                      <span className="text-xs font-bold">
                        Requested: {targetCount} • Generated: {currentCount} • Valid: {currentCount}
                      </span>
                    </div>

                    {!isComplete && (
                      <p className="text-xs font-bold text-amber-900">
                        {missingCount} question(s) are missing. Generate missing questions to complete the assessment.
                      </p>
                    )}
                  </div>

                  {!isComplete && (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={Sparkles}
                      loading={generatingMissing}
                      onClick={handleGenerateMissingQuestions}
                      className="bg-amber-600 hover:bg-amber-700 font-bold shrink-0 shadow-sm"
                    >
                      Generate {missingCount} Missing Questions
                    </Button>
                  )}
                </div>

                {/* Questions List */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {generatedQuestions.map((q, idx) => (
                    <div
                      key={q.questionId || idx}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono">
                            #{idx + 1}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {q.competency}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {q.questionType}
                          </span>
                          {q.reverseScored && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              Reverse Scored
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-semibold text-slate-400">
                          Trait: {q.trait || 'General'}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-900 leading-relaxed">
                        "{q.questionText}"
                      </p>

                      {q.scenario && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          Context: {q.scenario}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setWizardStep(3)}>
                    Back to Blueprint
                  </Button>
                  <Button
                    variant="primary"
                    icon={ArrowRight}
                    disabled={!isComplete}
                    onClick={() => setWizardStep(6)}
                    className={`font-bold ${
                      isComplete ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Proceed to Publish
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* STEP 6: PUBLISH ASSESSMENT */}
          {wizardStep === 6 && (
            <div className="max-w-2xl mx-auto space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Ready to Publish Assessment</h3>
                <p className="text-xs text-slate-500">
                  Your {builderForm.questionCount}-question AI talent battery has been validated and is ready to be published to student portals.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Title:</span>
                  <span className="font-black text-slate-900">{builderForm.title}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <span className="font-bold text-indigo-700">{builderForm.category}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Total Questions:</span>
                  <span className="font-black text-slate-900">{builderForm.questionCount} Validated Items</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Estimated Duration:</span>
                  <span className="font-bold text-slate-900">{builderForm.durationMinutes} Minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Target Role:</span>
                  <span className="font-bold text-slate-900">{builderForm.targetRole}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setWizardStep(5)}>
                  Back to Review
                </Button>
                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={handlePublishTest}
                  className="bg-emerald-600 hover:bg-emerald-700 text-sm font-black shadow-lg shadow-emerald-600/30"
                >
                  Publish Assessment to Portal
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: STUDENT CANDIDATE TALENT REPORTS */}
      {/* ========================================== */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-40">
                <Select
                  options={['All', ...OFFICIAL_DEPARTMENTS]}
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                />
              </div>
              <div className="w-32">
                <Select
                  options={['All', '2024', '2025', '2026', '2027']}
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                />
              </div>
              <div className="w-36">
                <Select
                  options={['All', '85+', '70-84', '55-69', '<55']}
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full sm:w-72">
              <Input
                placeholder="Search student, ERP, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Candidates Table */}
          {loading ? (
            <LoadingState message="Loading candidate evaluations..." />
          ) : filteredAttempts.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Candidate</th>
                      <th className="py-3.5 px-4">Department & Batch</th>
                      <th className="py-3.5 px-4 text-center">Readiness Index</th>
                      <th className="py-3.5 px-4">Primary Strength</th>
                      <th className="py-3.5 px-4">Evaluation Date</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredAttempts.map((a) => {
                      const studentName = a.studentName || a.user?.name || 'Candidate';
                      const email = a.user?.email || '';
                      const dept = a.department || a.user?.department || 'EXTC';
                      const batch = a.batch || a.user?.batch || '2026';
                      const score = a.overallScore || 75;
                      const strength = a.strengths?.[0]?.competency || 'Problem Solving';
                      const evalDate = a.submittedAt
                        ? new Date(a.submittedAt).toLocaleDateString()
                        : 'Recent';

                      return (
                        <tr key={a._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{studentName}</div>
                            <div className="text-[11px] text-slate-400">{email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 text-[10px]">
                              {dept}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-1.5">{batch}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-black text-xs">
                              {score}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-slate-600">
                            {strength}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-slate-500 font-mono">
                            {evalDate}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              icon={Eye}
                              onClick={() => setSelectedAttempt(a)}
                            >
                              View Report
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Candidate Evaluations Found"
              description="No student attempts match the applied filters. Try selecting 'All' or clearing search."
            />
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: COHORT TALENT INTELLIGENCE ANALYTICS */}
      {/* ========================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Department Readiness Cards */}
          {summaryData.departmentReadiness.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Departmental Employability Readiness Index
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {summaryData.departmentReadiness.map((d) => (
                  <div
                    key={d.department}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1"
                  >
                    <span className="text-[11px] font-black uppercase text-indigo-700">{d.department}</span>
                    <div className="text-xl font-black text-slate-900">{d.avgScore}%</div>
                    <span className="text-[10px] text-slate-400 font-semibold block">{d.candidates} Candidates</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competency Distribution Matrix & Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Competency Averages Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Target className="w-4 h-4 text-blue-600" />
                Competency Performance Ranking (10 Dimensions)
              </h3>
              <div className="space-y-3">
                {summaryData.competencyAverages.map((c, idx) => (
                  <div key={c.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">{idx + 1}. {c.name}</span>
                      <span className="font-black text-indigo-700 font-mono">{c.avgScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          c.avgScore >= 80 ? 'bg-emerald-600' : c.avgScore >= 70 ? 'bg-indigo-600' : 'bg-amber-600'
                        }`}
                        style={{ width: `${c.avgScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Cohort Radar Chart */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col items-center justify-center">
              <h3 className="text-sm font-extrabold text-slate-900 mb-2 w-full text-left flex items-center gap-2 border-b border-slate-100 pb-3">
                <BrainCircuit className="w-4 h-4 text-purple-600" />
                Cohort Talent Dimension Radar
              </h3>
              <RadarChart
                traitScores={summaryData.competencyAverages.reduce((acc, c) => {
                  acc[c.key] = c.avgScore;
                  return acc;
                }, {})}
                size={400}
                showBenchmark={true}
                benchmarkValue={70}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* CANDIDATE TALENT PROFILE MODAL */}
      {/* ========================================== */}
      {selectedAttempt && !isPrintReportOpen && (
        <Modal
          isOpen={Boolean(selectedAttempt)}
          onClose={() => setSelectedAttempt(null)}
          title={`AI Talent Profile: ${selectedAttempt.studentName || selectedAttempt.user?.name || 'Candidate'}`}
        >
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Header info */}
            <div className="p-5 bg-slate-900 text-white rounded-3xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  {selectedAttempt.department || selectedAttempt.user?.department} • {selectedAttempt.batch || selectedAttempt.user?.batch}
                </span>
                <h4 className="text-lg font-black text-white">{selectedAttempt.studentName || selectedAttempt.user?.name}</h4>
                <p className="text-xs text-slate-400 font-mono">ERP: {selectedAttempt.erpNumber || 'N/A'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Overall Readiness</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">
                  {selectedAttempt.overallScore}%
                </span>
              </div>
            </div>

            {/* AI Summary */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200/70 rounded-2xl text-xs text-indigo-950 leading-relaxed">
              <span className="font-extrabold block text-indigo-900 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                AI Executive Behavioral Summary
              </span>
              {selectedAttempt.aiAnalysis?.aiSummary || selectedAttempt.aiSummary}
            </div>

            {/* Radar Chart */}
            <div className="p-4 bg-white border border-slate-200 rounded-3xl flex flex-col items-center">
              <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider mb-2 w-full text-left">
                10-Dimension Talent Radar
              </h5>
              <RadarChart
                traitScores={selectedAttempt.traitScores || {}}
                size={380}
              />
            </div>

            {/* Top Strengths & Development Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <h5 className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Key Strengths
                </h5>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {selectedAttempt.strengths?.map((s, i) => (
                    <div key={i} className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <strong>{s.competency}:</strong> {s.explanation || s.workplaceRelevance}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <h5 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-600" />
                  Growth Opportunities
                </h5>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {selectedAttempt.developmentAreas?.map((d, i) => (
                    <div key={i} className="bg-white p-2.5 rounded-xl border border-amber-100">
                      <strong>{d.area}:</strong> {d.improvementSuggestion || d.whyItMatters}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                icon={Printer}
                onClick={() => setIsPrintReportOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
              >
                Open 1-Page Printable Report
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================== */}
      {/* 1-PAGE PRINTABLE REPORT MODAL */}
      {/* ========================================== */}
      {isPrintReportOpen && selectedAttempt && (
        <OnePageTalentReport
          attempt={selectedAttempt}
          onClose={() => setIsPrintReportOpen(false)}
        />
      )}

      {/* ========================================== */}
      {/* TEST PREVIEW MODAL */}
      {/* ========================================== */}
      {previewTest && (
        <Modal
          isOpen={Boolean(previewTest)}
          onClose={() => setPreviewTest(null)}
          title={`Preview: ${previewTest.title}`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-slate-900">{previewTest.title}</div>
              <p className="text-slate-500">{previewTest.description}</p>
              <div className="flex gap-4 pt-2 font-mono text-[11px] text-indigo-700">
                <span>{previewTest.questions?.length || 50} Questions</span>
                <span>{previewTest.durationMinutes || 20} Minutes</span>
                <span>Category: {previewTest.category}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                Question Inventory Preview
              </h5>
              {previewTest.questions?.map((q, i) => (
                <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-black bg-slate-900 text-white px-2 py-0.5 rounded-full">#{i + 1}</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{q.competency}</span>
                    <span className="text-slate-400">{q.questionType}</span>
                  </div>
                  <p className="font-bold text-slate-900 pt-1">"{q.questionText}"</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AIAssessmentGenPage;
