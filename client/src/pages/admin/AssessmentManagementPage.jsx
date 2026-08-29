import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAssessments, ASSESSMENT_KEYS } from '../../hooks/queries/useAssessmentQueries';
import { useDeleteAssessment } from '../../hooks/mutations/useAdminMutations';
import PageHeader from '../../components/PageHeader';
import FilterTabs from '../../components/FilterTabs';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import AptitudeAssessmentCreateModal from '../../components/assessments/AptitudeAssessmentCreateModal';
import AssessmentPreviewModal from '../../components/assessments/AssessmentPreviewModal';
import {
  TRAINING_MODULES,
  MODULE_CATEGORIES,
  normalizeModuleName
} from '../../constants/trainingModules';
import { AI_PROVIDERS, QUESTION_DIFFICULTIES } from '../../constants/questionBank';
import {
  Plus,
  Sparkles,
  Clock,
  Award,
  Trash2,
  Edit2,
  Play,
  Eye,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Bot,
  ShieldAlert,
  ShieldCheck,
  FileUp,
  FileText,
  BookOpen
} from 'lucide-react';

export const AssessmentManagementPage = () => {
  const queryClient = useQueryClient();
  const deleteAssessmentMutation = useDeleteAssessment();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawModule = searchParams.get('type') || searchParams.get('module') || 'Aptitude';
  const currentModule = normalizeModuleName(rawModule);
  const isAptitudeModule = currentModule === 'Aptitude';
  const isDomainModule = currentModule === 'Domain Knowledge';

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Modals state
  const [isAptitudeModalOpen, setIsAptitudeModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [previewAssessment, setPreviewAssessment] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState(null);

  // AI Generator Form
  const [aiForm, setAiForm] = useState({
    provider: 'gemini',
    title: '',
    description: '',
    module: currentModule,
    category: 'Quantitative',
    department: null,
    topic: '',
    difficulty: 'Medium',
    questionCount: 5,
    timeLimitMinutes: 20,
    passingScorePercentage: 70,
    status: 'published'
  });
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // Subcategory tabs for active module
  const availableCategories =
    MODULE_CATEGORIES[currentModule] ||
    MODULE_CATEGORIES[rawModule] ||
    [];

  const filterTabs = [
    { id: 'All', label: isDomainModule ? 'All Departments' : 'All Categories' },
    ...availableCategories
  ];

  // Modules including Full Assessment
  const assessmentModules = [
    ...TRAINING_MODULES,
    { id: 'Full', label: 'Full Assessment' }
  ];

  const params = useMemo(() => {
    const p = { module: currentModule };
    if (activeCategory !== 'All') {
      if (isDomainModule) {
        p.department = activeCategory;
      } else {
        p.category = activeCategory;
      }
    }
    return p;
  }, [currentModule, activeCategory, isDomainModule]);

  const { data: assessmentsRes, isLoading: loading } = useAssessments(params);
  const assessments = assessmentsRes?.assessments || [];

  const handleModuleChange = (newModId) => {
    setSearchParams({ type: newModId });
    setActiveCategory('All');
  };

  // Generate AI Assessment
  const handleGenerateAI = async (e) => {
    e.preventDefault();
    if (!aiForm.topic.trim()) {
      setAiError('Please enter a topic name.');
      return;
    }

    setGeneratingAI(true);
    setAiError('');

    try {
      const payload = {
        ...aiForm,
        module: currentModule,
        category: isDomainModule ? (aiForm.department || 'CSE') : aiForm.category,
        department: isDomainModule ? (aiForm.department || 'CSE') : null
      };

      const res = await api.generateAIAssessment(payload);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ASSESSMENT_KEYS.all });
        setIsAIModalOpen(false);
        setToast({
          type: 'success',
          title: 'Assessment Created',
          message: `Assessment "${res.assessment?.title || aiForm.title || 'Test'}" generated and published successfully.`
        });
      } else {
        setAiError(res.message || 'Failed to generate assessment. Please try again.');
      }
    } catch (err) {
      setAiError('AI generation failed. Please verify API keys or try another provider.');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Delete Assessment
  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return;
    try {
      const res = await deleteAssessmentMutation.mutateAsync(assessmentToDelete._id);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ASSESSMENT_KEYS.all });
        setDeleteConfirmOpen(false);
        setToast({
          type: 'success',
          title: 'Assessment Deleted',
          message: `Assessment "${assessmentToDelete.title || 'Test'}" was deleted successfully.`
        });
        setAssessmentToDelete(null);
      } else {
        setToast({
          type: 'error',
          title: 'Delete Failed',
          message: res?.message || 'Failed to delete assessment.'
        });
      }
    } catch (err) {
      console.error('Error deleting assessment:', err);
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err?.response?.data?.message || err?.message || 'Error deleting assessment.'
      });
    }
  };

  // Filter assessments by search
  const filteredAssessments = assessments.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.topic?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader
        title={`${currentModule} Assessment Management`}
        subtitle="Manage evaluations, generate tests with Gemini, Groq, and Hugging Face, and review candidate grading."
        breadcrumbs={[
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Assessments' },
          { label: currentModule }
        ]}
        actions={
          <div className="flex items-center gap-3">
            {isAptitudeModule ? (
              <Button
                variant="primary"
                icon={Sparkles}
                onClick={() => setIsAptitudeModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20"
              >
                Create Assessment
              </Button>
            ) : (
              <Button
                variant="outline"
                icon={Sparkles}
                onClick={() => {
                  setAiForm((prev) => ({
                    ...prev,
                    module: currentModule,
                    category: availableCategories[0]?.id || 'General',
                    department: isDomainModule ? 'CSE' : null,
                    title: '',
                    topic: ''
                  }));
                  setAiError('');
                  setIsAIModalOpen(true);
                }}
                className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
              >
                AI Assessment Generator
              </Button>
            )}
          </div>
        }
      />

      {/* Module Selector Buttons */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 overflow-x-auto">
        {assessmentModules.map((m) => {
          const isActive =
            rawModule === m.id ||
            currentModule === m.label ||
            (m.id === 'Domain' && isDomainModule);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleModuleChange(m.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Tabs & Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <FilterTabs
          tabs={filterTabs}
          activeTab={activeCategory}
          onTabChange={setActiveCategory}
        />

        <div className="w-full lg:w-72">
          <Input
            placeholder="Search assessment title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {/* Assessment Cards Grid */}
      {loading ? (
        <LoadingState message={`Loading ${currentModule} assessments...`} />
      ) : filteredAssessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group"
            >
              <div>
                {/* Header Tags */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.department && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {item.department}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {item.category || currentModule}
                    </span>
                    {item.topic && (
                      <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200/60 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-violet-500" />
                        {item.topic}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        item.difficulty === 'Easy'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.difficulty === 'Hard'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.difficulty || 'Medium'}
                    </span>
                    {item.assessmentMode === 'PROCTORED' ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Proctored
                      </span>
                    ) : item.module === 'Aptitude' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Normal
                      </span>
                    ) : null}

                    {item.isAIGenerated && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        {item.aiProvider === 'gemini'
                          ? 'Gemini 3.6 Flash'
                          : item.aiProvider === 'groq'
                          ? 'Groq Cloud'
                          : item.aiProvider === 'huggingface'
                          ? 'Hugging Face'
                          : 'AI Generated'}
                      </span>
                    )}

                    {item.creationMethod === 'PDF_EXTRACTION' && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-500" />
                        PDF Extracted
                      </span>
                    )}
                  </div>

                  <StatusBadge status={item.status || 'published'} />
                </div>

                <h3 className="font-bold text-base text-slate-900 line-clamp-2 leading-snug">
                  {item.title}
                </h3>

                {item.topic && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Topic:</span>
                    <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80">
                      {item.topic}
                    </span>
                  </div>
                )}

                {item.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200/60 rounded-2xl p-3 mt-4 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Questions</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {item.questions?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Time Limit</span>
                    <span className="text-sm font-extrabold text-blue-600 flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.timeLimitMinutes || 20}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Pass Mark</span>
                    <span className="text-sm font-extrabold text-emerald-600">
                      {item.passingScorePercentage || 70}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={Eye}
                  onClick={() => setPreviewAssessment(item)}
                  className="flex-1 justify-center shadow-xs"
                >
                  Preview Test
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setAssessmentToDelete(item);
                    setDeleteConfirmOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Delete Assessment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${activeCategory === 'All' ? currentModule : activeCategory} Assessments`}
          description={`No assessment evaluations have been published for ${
            activeCategory !== 'All' ? activeCategory : currentModule
          } yet.`}
          actionText={isAptitudeModule ? 'Create Aptitude Assessment' : 'Generate AI Assessment'}
          onAction={() => {
            if (isAptitudeModule) {
              setIsAptitudeModalOpen(true);
            } else {
              setAiForm((prev) => ({
                ...prev,
                module: currentModule,
                category: availableCategories[0]?.id || 'General',
                department: isDomainModule ? 'CSE' : null,
                title: '',
                topic: ''
              }));
              setAiError('');
              setIsAIModalOpen(true);
            }
          }}
        />
      )}

      {/* MODAL: AI Assessment Generator */}
      <Modal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        title={`AI Assessment Generator (${currentModule})`}
      >
        <form onSubmit={handleGenerateAI} className="space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category / Department *"
              options={availableCategories.map((c) => c.id)}
              value={aiForm.category}
              onChange={(e) =>
                setAiForm({
                  ...aiForm,
                  category: e.target.value,
                  department: isDomainModule ? e.target.value : null
                })
              }
            />
            <Select
              label="Difficulty Level *"
              options={QUESTION_DIFFICULTIES}
              value={aiForm.difficulty}
              onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
            />
          </div>

          <Input
            label="Topic / Exam Subject *"
            placeholder="e.g. Quantitative Profit & Loss / Database Indexing / Active Listening"
            value={aiForm.topic}
            onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
            required
          />

          <Input
            label="Assessment Title (Optional auto-naming)"
            placeholder="e.g. Master Evaluation on Profit & Loss"
            value={aiForm.title}
            onChange={(e) => setAiForm({ ...aiForm, title: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Questions"
              options={['5', '10', '15', '20']}
              value={String(aiForm.questionCount)}
              onChange={(e) =>
                setAiForm({ ...aiForm, questionCount: parseInt(e.target.value, 10) })
              }
            />
            <Select
              label="Time Limit"
              options={['10 mins', '15 mins', '20 mins', '30 mins', '45 mins', '60 mins']}
              value={`${aiForm.timeLimitMinutes} mins`}
              onChange={(e) =>
                setAiForm({
                  ...aiForm,
                  timeLimitMinutes: parseInt(e.target.value, 10)
                })
              }
            />
            <Select
              label="Pass %"
              options={['50%', '60%', '70%', '80%']}
              value={`${aiForm.passingScorePercentage}%`}
              onChange={(e) =>
                setAiForm({
                  ...aiForm,
                  passingScorePercentage: parseInt(e.target.value, 10)
                })
              }
            />
          </div>

          {aiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          <Button
            type="submit"
            icon={Sparkles}
            loading={generatingAI}
            className="w-full justify-center bg-indigo-600 hover:bg-indigo-700"
          >
            Generate & Publish Assessment
          </Button>
        </form>
      </Modal>

      {/* MODAL: Aptitude Assessment Wizard (AI & PDF Extraction & Review) */}
      <AptitudeAssessmentCreateModal
        isOpen={isAptitudeModalOpen}
        onClose={() => setIsAptitudeModalOpen(false)}
        onSuccess={(newAssessment, status) => {
          queryClient.invalidateQueries({ queryKey: ASSESSMENT_KEYS.all });
          setIsAptitudeModalOpen(false);
          const isDraft = status === 'draft' || newAssessment?.status === 'draft';
          setToast({
            type: 'success',
            title: isDraft ? 'Draft Saved' : 'Assessment Published',
            message: isDraft
              ? `Assessment "${newAssessment?.title || 'Test'}" has been saved as draft successfully.`
              : `Assessment "${newAssessment?.title || 'Test'}" has been published successfully.`
          });
        }}
        initialCategory={activeCategory !== 'All' ? activeCategory : 'Quantitative Aptitude'}
      />

      {/* MODAL: Assessment Preview & Review */}
      <AssessmentPreviewModal
        isOpen={Boolean(previewAssessment)}
        onClose={() => setPreviewAssessment(null)}
        assessment={previewAssessment}
        onStatusChange={(updated) => {
          queryClient.invalidateQueries({ queryKey: ASSESSMENT_KEYS.all });
          setPreviewAssessment(updated);
          setToast({
            type: 'success',
            title: 'Status Updated',
            message: `Assessment status updated to ${updated.status}.`
          });
        }}
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAssessment}
        title="Delete Assessment?"
        message={`Are you sure you want to delete "${assessmentToDelete?.title}"? All student attempts on this test will also be deleted.`}
        confirmText="Delete Assessment"
      />
    </div>
  );
};

export default AssessmentManagementPage;
