import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
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
  Zap,
  Target,
  Plus,
  Bot,
  AlertCircle,
  Sliders,
  FileCheck,
  Trash2,
  HelpCircle,
  Layers,
  BookOpen
} from 'lucide-react';

const PSYCHOMETRIC_DIMENSIONS = [
  { id: 'problemSolving', label: 'Problem Solving & Analytical Rigor', category: 'Analytical Problem Solving' },
  { id: 'teamwork', label: 'Teamwork & Synergy', category: 'Collaborative Alignment' },
  { id: 'leadership', label: 'Leadership & Initiative', category: 'Initiative & Leadership' },
  { id: 'adaptability', label: 'Agile Adaptability', category: 'Agile Adaptability' },
  { id: 'communication', label: 'Technical Articulation', category: 'Technical Articulation' },
  { id: 'openness', label: 'Openness & Curiosity', category: 'Innovation & Curiosity' },
  { id: 'conscientiousness', label: 'Conscientiousness & Discipline', category: 'Execution & Discipline' },
  { id: 'emotionalStability', label: 'Emotional Stability & Composure', category: 'Stress Resilience' }
];

export const AIAssessmentGenPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('evaluations'); // 'evaluations' | 'testPool'
  const [summaryData, setSummaryData] = useState({
    totalEvaluated: 0,
    avgReadiness: 0,
    departmentReadiness: [],
    profiles: []
  });
  const [questions, setQuestions] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Psychometric Test / Question Creator State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState('ai'); // 'ai' | 'manual'
  const [generatingAI, setGeneratingAI] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');

  // AI Form
  const [aiForm, setAiForm] = useState({
    roleTarget: 'Software Engineer',
    dimension: 'problemSolving',
    count: 2
  });

  // Manual Form
  const [manualForm, setManualForm] = useState({
    prompt: '',
    dimension: 'problemSolving',
    category: 'Analytical Problem Solving',
    department: 'All'
  });

  useEffect(() => {
    fetchAdminPsychometricSummary();
    fetchPsychometricQuestions();
  }, []);

  const fetchAdminPsychometricSummary = async () => {
    setLoading(true);
    try {
      const res = await api.getPsychometricAdminSummary();
      if (res.success) {
        setSummaryData({
          totalEvaluated: res.totalEvaluated || 0,
          avgReadiness: res.avgReadiness || 0,
          departmentReadiness: res.departmentReadiness || [],
          profiles: res.profiles || []
        });
      }
    } catch (err) {
      console.error('Error loading psychometric summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPsychometricQuestions = async () => {
    try {
      const res = await api.getPsychometricQuestions();
      if (res.success && res.questions) {
        setQuestions(res.questions);
      }
    } catch (err) {
      console.error('Error loading test questions:', err);
    }
  };

  const handleCreateAIQuestions = async (e) => {
    e.preventDefault();
    setGeneratingAI(true);
    setCreateError('');
    try {
      const res = await api.generateAIPsychometricQuestions(aiForm);
      if (res.success) {
        setIsCreateModalOpen(false);
        setCreateSuccessMsg(`Successfully generated ${res.count || 2} new AI Psychometric questions and added them to the active test pool!`);
        fetchPsychometricQuestions();
        setActiveTab('testPool');
        setTimeout(() => setCreateSuccessMsg(''), 6000);
      } else {
        setCreateError(res.message || 'Failed to generate questions.');
      }
    } catch (err) {
      setCreateError('Error connecting to AI psychometric service.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCreateManualQuestion = async (e) => {
    e.preventDefault();
    if (!manualForm.prompt.trim()) {
      setCreateError('Please enter the statement prompt.');
      return;
    }
    setGeneratingAI(true);
    setCreateError('');
    try {
      const res = await api.createPsychometricQuestion(manualForm);
      if (res.success) {
        setIsCreateModalOpen(false);
        setManualForm({
          prompt: '',
          dimension: 'problemSolving',
          category: 'Analytical Problem Solving',
          department: 'All'
        });
        setCreateSuccessMsg('Custom psychometric test question created and published to the active test pool!');
        fetchPsychometricQuestions();
        setActiveTab('testPool');
        setTimeout(() => setCreateSuccessMsg(''), 6000);
      } else {
        setCreateError(res.message || 'Failed to create question.');
      }
    } catch (err) {
      setCreateError('Failed to save question.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleDeleteCustomQuestion = async (id) => {
    if (!window.confirm('Remove this custom statement from the psychometric test pool?')) return;
    try {
      const res = await api.deletePsychometricQuestion(id);
      if (res.success) {
        fetchPsychometricQuestions();
      }
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  const filteredProfiles = summaryData.profiles.filter((p) => {
    const student = p.user || {};
    const matchesDept =
      departmentFilter === 'All' || student.department === departmentFilter;
    const matchesSearch =
      !searchQuery ||
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.erpNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Psychometric & Talent Intelligence"
        subtitle="Departmental employability readiness indices, Big Five personality distribution, and psychometric test management."
        breadcrumbs={[
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Psychometric Intelligence' }
        ]}
        actions={
          <Button
            size="sm"
            variant="primary"
            icon={Sparkles}
            onClick={() => {
              setCreateError('');
              setIsCreateModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
          >
            Create / AI Add Psychometric Test
          </Button>
        }
      />

      {createSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center gap-2.5 font-bold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{createSuccessMsg}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Evaluated Students</span>
            <span className="text-2xl font-black text-slate-900">{summaryData.totalEvaluated}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Cohort Avg Readiness</span>
            <span className="text-2xl font-black text-emerald-600">{summaryData.avgReadiness}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Active Test Questions</span>
            <span className="text-2xl font-black text-indigo-700">{questions.length} Items</span>
          </div>
        </div>
      </div>

      {/* Section View Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex border border-slate-200 shadow-inner max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab('evaluations')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'evaluations'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Candidate Reports ({summaryData.totalEvaluated})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('testPool')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'testPool'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Psychometric Test Inventory ({questions.length})</span>
        </button>
      </div>

      {/* TAB 1: STUDENT EVALUATIONS & REPORTS */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          {/* Department Readiness Breakdown */}
          {summaryData.departmentReadiness.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-blue-600" />
                Departmental Employability Readiness Distribution
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {summaryData.departmentReadiness.map((d) => (
                  <div
                    key={d.department}
                    className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-center space-y-1"
                  >
                    <span className="text-[11px] font-black uppercase text-indigo-700">{d.department}</span>
                    <div className="text-xl font-black text-slate-900">{d.avgScore}%</div>
                    <span className="text-[10px] text-slate-400 font-semibold block">{d.candidates} Candidates</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-48">
                <Select
                  options={['All', ...OFFICIAL_DEPARTMENTS]}
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full sm:w-72">
              <Input
                placeholder="Search candidate name, ERP, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Candidate Psychometric Evaluations Table */}
          {loading ? (
            <LoadingState message="Loading candidate psychometric records..." />
          ) : filteredProfiles.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Candidate</th>
                      <th className="py-3.5 px-4">Department & Year</th>
                      <th className="py-3.5 px-4 text-center">Readiness Index</th>
                      <th className="py-3.5 px-4">Primary Strength</th>
                      <th className="py-3.5 px-4">Recommended Role</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredProfiles.map((p) => {
                      const student = p.user || {};
                      return (
                        <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{student.name || 'Candidate'}</div>
                            <div className="text-[11px] text-slate-400">{student.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 text-[10px]">
                              {student.department || 'N/A'}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-1.5">{student.year || 'FE'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-black text-xs">
                              {p.employabilityIndex}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-slate-600">
                            {p.strengths?.[0] || 'High Analytical Rigor'}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] font-bold text-blue-700">
                            {p.careerFit?.[0] || 'Software Engineer'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              icon={Eye}
                              onClick={() => setSelectedProfile(p)}
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
              title="No Psychometric Evaluations Found"
              description="No candidates have submitted psychometric evaluations under this filter selection yet."
            />
          )}
        </div>
      )}

      {/* TAB 2: PSYCHOMETRIC TEST INVENTORY & CREATED QUESTIONS */}
      {activeTab === 'testPool' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Active Psychometric Test Pool ({questions.length} Questions)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard calibrated psychological battery combined with custom AI/admin created situational judgment statements.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => {
                setCreateError('');
                setIsCreateModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
            >
              Add Statement
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {questions.map((q, idx) => {
              const isCustom = q.isCustom;
              return (
                <div
                  key={q._id || q.id || idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCustom
                      ? 'bg-indigo-50/40 border-indigo-200/80 shadow-xs'
                      : 'bg-white border-slate-200 shadow-xs'
                  } flex items-start justify-between gap-4`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white">
                        #{idx + 1}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 capitalize">
                        {q.dimension}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {q.category}
                      </span>
                      {isCustom ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Custom Created / AI Generated
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Standard 15-Item Battery
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed pt-1">
                      "{q.prompt}"
                    </p>
                  </div>

                  {isCustom && q._id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomQuestion(q._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition shrink-0"
                      title="Delete custom question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Candidate Profile Details Modal */}
      {selectedProfile && (
        <Modal
          isOpen={Boolean(selectedProfile)}
          onClose={() => setSelectedProfile(null)}
          title={`Psychometric Report: ${selectedProfile.user?.name || 'Candidate'}`}
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-300">
                  {selectedProfile.user?.department} • {selectedProfile.user?.year}
                </span>
                <h4 className="text-lg font-black text-white">{selectedProfile.user?.name}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Readiness</span>
                <span className="text-2xl font-black text-emerald-400">
                  {selectedProfile.employabilityIndex}%
                </span>
              </div>
            </div>

            {/* AI Summary */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200/70 rounded-2xl text-xs text-indigo-950 leading-relaxed">
              <span className="font-extrabold block text-indigo-900 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                AI Executive Summary
              </span>
              {selectedProfile.aiSummary}
            </div>

            {/* Big Five Breakdown */}
            <div className="space-y-2.5">
              <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                Big Five Personality Dimensions
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(selectedProfile.personalityTraits || {}).map(([k, v]) => (
                  <div key={k} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                    <span className="capitalize text-slate-700 font-semibold">{k}</span>
                    <span className="font-black text-blue-700">{v}%</span>
                  </div>
                ))}
              </div>
            </div>

              {/* Strengths */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Core Strengths
                </h5>
                {selectedProfile.strengths?.map((s, i) => (
                  <div key={i} className="p-2.5 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-200 text-xs font-medium">
                    • {s}
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        )}

        {/* MODAL: Psychometric Test & Question Creator */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Psychometric Assessment Statements"
        >
          <div className="space-y-5">
            {/* Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-2xl flex border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setCreateMode('ai');
                  setCreateError('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  createMode === 'ai'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Generator</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateMode('manual');
                  setCreateError('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  createMode === 'manual'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Manual Builder</span>
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* AI Generator Form */}
            {createMode === 'ai' ? (
              <form onSubmit={handleCreateAIQuestions} className="space-y-4">
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/70 rounded-2xl text-xs text-indigo-950 leading-relaxed">
                  <span className="font-extrabold text-indigo-900 block mb-0.5">Industrial Psychometric AI Generator</span>
                  AI synthesizes grounded, situational judgment Likert statements mapped to target roles and psychological competencies.
                </div>

                <Input
                  label="Target Career Role / Industry *"
                  placeholder="e.g. Full-Stack Software Engineer / Technical Product Manager"
                  value={aiForm.roleTarget}
                  onChange={(e) => setAiForm({ ...aiForm, roleTarget: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Psychological Dimension *"
                    options={PSYCHOMETRIC_DIMENSIONS.map((d) => d.label)}
                    value={PSYCHOMETRIC_DIMENSIONS.find((d) => d.id === aiForm.dimension)?.label || 'Problem Solving & Analytical Rigor'}
                    onChange={(e) => {
                      const selected = PSYCHOMETRIC_DIMENSIONS.find((d) => d.label === e.target.value);
                      if (selected) setAiForm({ ...aiForm, dimension: selected.id });
                    }}
                  />
                  <Select
                    label="Number of Questions"
                    options={['1', '2', '3', '5']}
                    value={String(aiForm.count)}
                    onChange={(e) => setAiForm({ ...aiForm, count: parseInt(e.target.value, 10) })}
                  />
                </div>

                <Button
                  type="submit"
                  icon={Sparkles}
                  loading={generatingAI}
                  className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
                >
                  Generate & Add to Test Pool
                </Button>
              </form>
            ) : (
              /* Manual Builder Form */
              <form onSubmit={handleCreateManualQuestion} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Situational Judgment Statement Prompt *</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. I actively seek out novel technologies, frameworks, and unconventional problem-solving methods."
                    value={manualForm.prompt}
                    onChange={(e) => setManualForm({ ...manualForm, prompt: e.target.value })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Psychological Dimension *"
                    options={PSYCHOMETRIC_DIMENSIONS.map((d) => d.label)}
                    value={PSYCHOMETRIC_DIMENSIONS.find((d) => d.id === manualForm.dimension)?.label || 'Problem Solving & Analytical Rigor'}
                    onChange={(e) => {
                      const selected = PSYCHOMETRIC_DIMENSIONS.find((d) => d.label === e.target.value);
                      if (selected) {
                        setManualForm({
                          ...manualForm,
                          dimension: selected.id,
                          category: selected.category
                        });
                      }
                    }}
                  />
                  <Input
                    label="Category Tag *"
                    placeholder="e.g. Analytical Problem Solving"
                    value={manualForm.category}
                    onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                    required
                  />
                </div>

                <Select
                  label="Target Department"
                  options={['All', ...OFFICIAL_DEPARTMENTS]}
                  value={manualForm.department}
                  onChange={(e) => setManualForm({ ...manualForm, department: e.target.value })}
                />

                <Button
                  type="submit"
                  icon={Plus}
                  loading={generatingAI}
                  className="w-full justify-center bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Add Statement to Psychometric Pool
                </Button>
              </form>
            )}
          </div>
        </Modal>
      </div>
    );
  };

  export default AIAssessmentGenPage;
