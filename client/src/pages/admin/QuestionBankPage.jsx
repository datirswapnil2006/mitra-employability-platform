import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import FilterTabs from '../../components/FilterTabs';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  QUESTION_MODULES,
  QUESTION_CATEGORIES,
  AI_PROVIDERS,
  QUESTION_DIFFICULTIES
} from '../../constants/questionBank';
import {
  Plus,
  Sparkles,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Code2,
  BookOpen,
  Layers,
  Building2,
  Cpu,
  BrainCircuit,
  Bot
} from 'lucide-react';

export const QuestionBankPage = () => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [activeModule, setActiveModule] = useState('Aptitude');
  const [activeCategory, setActiveCategory] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Manual Question Form
  const [manualForm, setManualForm] = useState({
    module: 'Aptitude',
    category: 'Quantitative',
    department: null,
    topic: '',
    questionText: '',
    codeSnippet: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    explanation: '',
    difficulty: 'Medium',
    marks: 1
  });

  // AI Generator Form & Output State
  const [aiForm, setAiForm] = useState({
    provider: 'gemini',
    module: 'Aptitude',
    category: 'Quantitative',
    department: null,
    topic: '',
    difficulty: 'Medium',
    count: 3
  });
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState([]);
  const [selectedAIQuestions, setSelectedAIQuestions] = useState({});
  const [savingAI, setSavingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // Sub-categories / Department tabs for active module
  const currentCategories = QUESTION_CATEGORIES[activeModule] || [];
  const filterTabs = [
    { id: 'All', label: activeModule === 'Domain' ? 'All Departments' : 'All Categories' },
    ...currentCategories
  ];

  useEffect(() => {
    setActiveCategory('All');
  }, [activeModule]);

  useEffect(() => {
    fetchQuestions();
  }, [activeModule, activeCategory, difficultyFilter]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = { module: activeModule };
      if (activeCategory !== 'All') {
        if (activeModule === 'Domain') {
          params.department = activeCategory;
        } else {
          params.category = activeCategory;
        }
      }
      if (difficultyFilter !== 'All') {
        params.difficulty = difficultyFilter;
      }

      const res = await api.getQuestions(params);
      if (res.success) {
        setQuestions(res.questions || []);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Manual Question Submission
  const handleSaveManualQuestion = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...manualForm,
        module: activeModule,
        correctAnswer: manualForm.options[manualForm.correctAnswerIndex] || manualForm.options[0],
        aiGenerated: false,
        aiProvider: 'manual'
      };

      if (editingQuestion) {
        await api.updateQuestion(editingQuestion._id, payload);
      } else {
        await api.createQuestion(payload);
      }

      setIsManualModalOpen(false);
      setEditingQuestion(null);
      resetManualForm();
      fetchQuestions();
    } catch (err) {
      console.error('Error saving question:', err);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    const correctIdx = q.options.indexOf(q.correctAnswer);
    setManualForm({
      module: q.module || activeModule,
      category: q.category || 'Quantitative',
      department: q.department || null,
      topic: q.topic || '',
      questionText: q.questionText || '',
      codeSnippet: q.codeSnippet || '',
      options: q.options?.length >= 4 ? q.options : ['', '', '', ''],
      correctAnswerIndex: correctIdx !== -1 ? correctIdx : 0,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'Medium',
      marks: q.marks || 1
    });
    setIsManualModalOpen(true);
  };

  // Delete Question
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      const res = await api.deleteQuestion(questionToDelete._id);
      if (res.success) {
        setDeleteConfirmOpen(false);
        setQuestionToDelete(null);
        fetchQuestions();
      }
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  // Generate Questions via AI (Gemini, Groq, Hugging Face)
  const handleGenerateAI = async () => {
    if (!aiForm.topic.trim()) {
      setAiError('Please enter a topic name for AI question generation.');
      return;
    }

    setGeneratingAI(true);
    setAiError('');
    setAiGeneratedQuestions([]);
    setSelectedAIQuestions({});

    try {
      const payload = {
        ...aiForm,
        module: activeModule,
        category: aiForm.category || currentCategories[0]?.id || 'Quantitative',
        department: activeModule === 'Domain' ? aiForm.category : null
      };

      const res = await api.generateAIQuestions(payload);
      if (res.success && res.questions) {
        setAiGeneratedQuestions(res.questions);
        // Default select all generated questions
        const initialSelected = {};
        res.questions.forEach((_, idx) => {
          initialSelected[idx] = true;
        });
        setSelectedAIQuestions(initialSelected);
      } else {
        setAiError(res.message || 'Failed to generate questions. Please try again.');
      }
    } catch (err) {
      setAiError('AI generation failed. Please verify API configuration or try another provider.');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Bulk Save Selected AI Questions
  const handleBulkSaveAI = async () => {
    const selectedList = aiGeneratedQuestions.filter((_, idx) => selectedAIQuestions[idx]);
    if (selectedList.length === 0) return;

    setSavingAI(true);
    try {
      const res = await api.bulkSaveQuestions({ questions: selectedList });
      if (res.success) {
        setIsAIModalOpen(false);
        setAiGeneratedQuestions([]);
        fetchQuestions();
      }
    } catch (err) {
      console.error('Error saving AI questions:', err);
    } finally {
      setSavingAI(false);
    }
  };

  const resetManualForm = () => {
    setManualForm({
      module: activeModule,
      category: currentCategories[0]?.id || 'Quantitative',
      department: activeModule === 'Domain' ? currentCategories[0]?.id : null,
      topic: '',
      questionText: '',
      codeSnippet: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      explanation: '',
      difficulty: 'Medium',
      marks: 1
    });
  };

  // Filter questions by search query
  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.questionText?.toLowerCase().includes(query) ||
      q.topic?.toLowerCase().includes(query) ||
      q.category?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Bank & AI Generator"
        subtitle="Manage questions across Aptitude, Technical, and Domain with multi-LLM generation via Gemini, Groq, and Hugging Face."
        breadcrumbs={[
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Assessments' },
          { label: 'Question Bank' }
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              icon={Sparkles}
              onClick={() => {
                setAiForm((prev) => ({
                  ...prev,
                  module: activeModule,
                  category: currentCategories[0]?.id || 'Quantitative'
                }));
                setAiError('');
                setAiGeneratedQuestions([]);
                setIsAIModalOpen(true);
              }}
              className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            >
              AI Generator
            </Button>
            <Button
              size="md"
              icon={Plus}
              onClick={() => {
                setEditingQuestion(null);
                resetManualForm();
                setIsManualModalOpen(true);
              }}
            >
              Add Question
            </Button>
          </div>
        }
      />

      {/* Module Selector Buttons */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 overflow-x-auto">
        {QUESTION_MODULES.map((m) => {
          const isActive = activeModule === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveModule(m.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Tabs & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <FilterTabs
          tabs={filterTabs}
          activeTab={activeCategory}
          onTabChange={setActiveCategory}
        />

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
          <div className="w-36">
            <Select
              options={['All', 'Easy', 'Medium', 'Hard']}
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search question or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <LoadingState message="Loading question bank items..." />
      ) : filteredQuestions.length > 0 ? (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-all duration-200 space-y-4"
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                    Q{idx + 1}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200/60">
                    {q.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {q.topic}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      q.difficulty === 'Easy'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : q.difficulty === 'Hard'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                  {q.aiGenerated && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      {q.aiProvider?.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(q)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Question"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionToDelete(q);
                      setDeleteConfirmOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-sm font-bold text-slate-900 leading-relaxed">{q.questionText}</p>

              {/* Code Snippet if present */}
              {q.codeSnippet && (
                <div className="bg-slate-950 text-emerald-400 p-3.5 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
                  <pre>{q.codeSnippet}</pre>
                </div>
              )}

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {q.options?.map((opt, optIdx) => {
                  const isCorrect = opt === q.correctAnswer;
                  const letter = String.fromCharCode(65 + optIdx);
                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                        isCorrect
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold ring-1 ring-emerald-400/30'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 mt-0.5 leading-relaxed">{opt}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {q.explanation && (
                <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-xl text-xs text-blue-900 leading-relaxed">
                  <span className="font-bold text-blue-950">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${activeCategory === 'All' ? activeModule : activeCategory} Questions`}
          description="The question bank has no questions for this selection yet. Add questions manually or generate them with Gemini, Groq, or Hugging Face."
          actionText="Add Question"
          onAction={() => {
            setEditingQuestion(null);
            resetManualForm();
            setIsManualModalOpen(true);
          }}
        />
      )}

      {/* MODAL 1: Multi-LLM AI Question Generator */}
      <Modal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        title="AI Question Generator (Multi-LLM Engine)"
      >
        <div className="space-y-4">
          {/* AI Provider Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Select AI LLM Provider *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {AI_PROVIDERS.map((provider) => {
                const isSelected = aiForm.provider === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setAiForm({ ...aiForm, provider: provider.id })}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold">{provider.name}</span>
                      <Bot className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    </div>
                    <span className="text-[10px] text-slate-500">{provider.model}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category / Department *"
              options={currentCategories.map((c) => c.id)}
              value={aiForm.category}
              onChange={(e) => setAiForm({ ...aiForm, category: e.target.value })}
            />
            <Select
              label="Difficulty Level *"
              options={QUESTION_DIFFICULTIES}
              value={aiForm.difficulty}
              onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Topic / Subject Name *"
                placeholder="e.g. Percentages, Binary Trees, SQL Joins"
                value={aiForm.topic}
                onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                required
              />
            </div>
            <div>
              <Select
                label="Question Count"
                options={['1', '2', '3', '5', '10']}
                value={String(aiForm.count)}
                onChange={(e) => setAiForm({ ...aiForm, count: parseInt(e.target.value, 10) })}
              />
            </div>
          </div>

          {aiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          <Button
            type="button"
            icon={Sparkles}
            loading={generatingAI}
            onClick={handleGenerateAI}
            className="w-full justify-center bg-indigo-600 hover:bg-indigo-700"
          >
            Generate Questions with {AI_PROVIDERS.find((p) => p.id === aiForm.provider)?.name}
          </Button>

          {/* AI Generated Questions Preview List */}
          {aiGeneratedQuestions.length > 0 && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">
                  Generated Questions ({aiGeneratedQuestions.length})
                </span>
                <span className="text-[11px] text-slate-500">Select questions to save</span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                {aiGeneratedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedAIQuestions[idx])}
                        onChange={(e) =>
                          setSelectedAIQuestions({ ...selectedAIQuestions, [idx]: e.target.checked })
                        }
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <p className="font-bold text-slate-900 flex-1">{q.questionText}</p>
                    </div>
                    <div className="pl-5 text-[11px] text-emerald-700 font-semibold">
                      Correct: {q.correctAnswer}
                    </div>
                    {q.explanation && (
                      <p className="pl-5 text-[10px] text-slate-500 italic">{q.explanation}</p>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                icon={CheckCircle2}
                loading={savingAI}
                onClick={handleBulkSaveAI}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700"
              >
                Save Selected to Question Bank
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 2: Manual Add / Edit Question */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingQuestion(null);
        }}
        title={editingQuestion ? 'Edit Question' : `Add Question to ${activeModule}`}
      >
        <form onSubmit={handleSaveManualQuestion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category / Department *"
              options={currentCategories.map((c) => c.id)}
              value={manualForm.category}
              onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
            />
            <Input
              label="Topic Name *"
              placeholder="e.g. Number Systems, Sorting, Microcontrollers"
              value={manualForm.topic}
              onChange={(e) => setManualForm({ ...manualForm, topic: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Question Text *</label>
            <textarea
              rows={3}
              placeholder="Enter question description..."
              value={manualForm.questionText}
              onChange={(e) => setManualForm({ ...manualForm, questionText: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Code Snippet (Optional)</label>
            <textarea
              rows={2}
              placeholder="int x = 10; ..."
              value={manualForm.codeSnippet}
              onChange={(e) => setManualForm({ ...manualForm, codeSnippet: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-900 text-emerald-400 font-mono border border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* 4 Options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Multiple Choice Options (4 Required) *</label>
            {manualForm.options.map((opt, optIdx) => (
              <div key={optIdx} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <input
                  type="text"
                  placeholder={`Option ${String.fromCharCode(65 + optIdx)} text...`}
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...manualForm.options];
                    newOpts[optIdx] = e.target.value;
                    setManualForm({ ...manualForm, options: newOpts });
                  }}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Correct Answer Key *"
              options={['Option A', 'Option B', 'Option C', 'Option D']}
              value={`Option ${String.fromCharCode(65 + manualForm.correctAnswerIndex)}`}
              onChange={(e) => {
                const idx = e.target.value.charCodeAt(7) - 65;
                setManualForm({ ...manualForm, correctAnswerIndex: Math.max(0, idx) });
              }}
            />
            <Select
              label="Difficulty"
              options={QUESTION_DIFFICULTIES}
              value={manualForm.difficulty}
              onChange={(e) => setManualForm({ ...manualForm, difficulty: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Explanation & Working Solution</label>
            <textarea
              rows={2}
              placeholder="Explain why the selected option is correct..."
              value={manualForm.explanation}
              onChange={(e) => setManualForm({ ...manualForm, explanation: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <Button type="submit" className="w-full justify-center">
            {editingQuestion ? 'Update Question' : 'Save Question to Bank'}
          </Button>
        </form>
      </Modal>

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteQuestion}
        title="Delete Question?"
        message="Are you sure you want to permanently delete this question from the Question Bank?"
        confirmText="Delete Question"
      />
    </div>
  );
};

export default QuestionBankPage;
