import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import { AI_PROVIDERS } from '../../constants/questionBank';
import {
  APTITUDE_CATEGORIES,
  APTITUDE_TOPICS,
  QUESTION_COUNT_OPTIONS,
  TIME_LIMIT_OPTIONS,
  PASS_PERCENTAGE_OPTIONS,
  DIFFICULTY_OPTIONS
} from '../../constants/aptitudeTopics';
import {
  Sparkles,
  FileUp,
  Bot,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Camera,
  Monitor,
  Maximize2,
  Eye,
  Copy,
  Smartphone,
  Users,
  Clock,
  Award,
  ChevronRight,
  ChevronLeft,
  Save,
  Send,
  FileText,
  HelpCircle,
  Layers,
  Check
} from 'lucide-react';

export const AptitudeAssessmentCreateModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialCategory = 'Quantitative Aptitude'
}) => {
  // Step Management: 1: Method & Config, 2: Question Review, 3: Mode & Proctoring, 4: Final Summary
  const [step, setStep] = useState(1);

  // Method: 'AI_GENERATED' | 'PDF_EXTRACTION'
  const [creationMethod, setCreationMethod] = useState('');

  // Assessment Info & Config
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [targetQuestionCount, setTargetQuestionCount] = useState(5);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(20);
  const [passingScorePercentage, setPassingScorePercentage] = useState(70);

  // AI Provider Config
  const [aiProvider, setAiProvider] = useState('gemini');

  // PDF Upload Config
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfText, setPdfText] = useState('');

  // Questions State for Review: array of { id, questionText, options, correctAnswer, explanation, difficulty, status: 'APPROVED' | 'PENDING' | 'REJECTED' }
  const [questions, setQuestions] = useState([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [editForm, setEditForm] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'Medium'
  });

  // Assessment Mode: 'NORMAL' | 'PROCTORED'
  const [assessmentMode, setAssessmentMode] = useState('NORMAL');

  // Proctoring Settings (Default: all ON when proctoring is enabled)
  const [proctoringSettings, setProctoringSettings] = useState({
    camera: true,
    screenShare: true,
    fullScreen: true,
    tabSwitch: true,
    copyPaste: true,
    secondPerson: true,
    mobileDetection: true
  });

  // Loading and Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Set default category topic on change
  useEffect(() => {
    const available = APTITUDE_TOPICS[category] || [];
    if (available.length > 0 && !available.includes(topic)) {
      setTopic(available[0]);
    }
  }, [category]);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCreationMethod('');
      setCategory(initialCategory);
      const available = APTITUDE_TOPICS[initialCategory] || [];
      setTopic(available[0] || 'Percentage');
      setCustomTopic('');
      setTitle('');
      setDescription('');
      setDifficulty('Medium');
      setTargetQuestionCount(5);
      setTimeLimitMinutes(20);
      setPassingScorePercentage(70);
      setAiProvider('gemini');
      setPdfFile(null);
      setPdfFileName('');
      setPdfText('');
      setQuestions([]);
      setAssessmentMode('NORMAL');
      setProctoringSettings({
        camera: true,
        screenShare: true,
        fullScreen: true,
        tabSwitch: true,
        copyPaste: true,
        secondPerson: true,
        mobileDetection: true
      });
      setErrorMsg('');
      setEditingQuestionIndex(null);
    }
  }, [isOpen, initialCategory]);

  const effectiveTopic = topic === 'Custom Topic' ? customTopic.trim() : topic;

  // Handle PDF file selection
  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorMsg('Please select a valid PDF file (.pdf).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('PDF file exceeds 10MB limit.');
      return;
    }

    setPdfFile(file);
    setPdfFileName(file.name);
    setErrorMsg('');

    // Read text from file
    const reader = new FileReader();
    reader.onload = (event) => {
      // Basic text extraction or fallback string
      const rawText = event.target.result;
      setPdfText(rawText || `Extracted content from ${file.name}`);
    };
    reader.readAsText(file);
  };

  // Step 1 -> Step 2: Trigger Generation / Extraction
  const handleGenerateOrExtract = async () => {
    if (!creationMethod) {
      setErrorMsg('Please select a creation method (AI Generated or PDF Extraction).');
      return;
    }

    if (!effectiveTopic) {
      setErrorMsg('Please select or enter a topic name.');
      return;
    }

    if (creationMethod === 'PDF_EXTRACTION' && !pdfFile && !pdfText) {
      setErrorMsg('Please upload a Question PDF file before proceeding.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (creationMethod === 'AI_GENERATED') {
        const res = await api.generateQuestionsForReview({
          provider: aiProvider,
          module: 'Aptitude',
          category,
          topic: effectiveTopic,
          difficulty,
          questionCount: targetQuestionCount
        });

        if (res.success && res.questions?.length > 0) {
          const formatted = res.questions.map((q, idx) => ({
            id: `gen-${Date.now()}-${idx}`,
            questionText: q.questionText || '',
            options: q.options || ['', '', '', ''],
            correctAnswer: q.correctAnswer || q.options?.[0] || '',
            explanation: q.explanation || '',
            difficulty: q.difficulty || difficulty,
            status: 'APPROVED' // Default approved upon generation for convenience, but Admin can edit/reject
          }));
          setQuestions(formatted);
          setStep(2);
        } else {
          setErrorMsg(res.message || 'Failed to generate questions via AI. Please check LLM provider.');
        }
      } else {
        // PDF Extraction
        const res = await api.extractPdfQuestions({
          pdfText: pdfText || `Questions for ${category} - ${effectiveTopic}`,
          category,
          topic: effectiveTopic,
          difficulty,
          questionCount: targetQuestionCount
        });

        if (res.success && res.questions?.length > 0) {
          const formatted = res.questions.map((q, idx) => ({
            id: `pdf-${Date.now()}-${idx}`,
            questionText: q.questionText || '',
            options: q.options || ['', '', '', ''],
            correctAnswer: q.correctAnswer || q.options?.[0] || '',
            explanation: q.explanation || '',
            difficulty: q.difficulty || difficulty,
            status: 'APPROVED'
          }));
          setQuestions(formatted);
          setStep(2);
        } else {
          setErrorMsg(res.message || 'Failed to extract questions from PDF.');
        }
      }
    } catch (err) {
      console.error('Generation/Extraction error:', err);
      setErrorMsg(err.message || 'Server error while generating questions.');
    } finally {
      setLoading(false);
    }
  };

  // Question Review Handlers
  const handleToggleApprove = (idx) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === idx ? { ...q, status: q.status === 'APPROVED' ? 'REJECTED' : 'APPROVED' } : q
      )
    );
  };

  const handleDeleteQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleStartEdit = (q, idx) => {
    setEditingQuestionIndex(idx);
    setEditForm({
      questionText: q.questionText,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'Medium'
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.questionText.trim()) return;
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === editingQuestionIndex
          ? {
              ...q,
              ...editForm,
              status: 'APPROVED'
            }
          : q
      )
    );
    setEditingQuestionIndex(null);
  };

  const handleAddManualQuestion = () => {
    const newQ = {
      id: `manual-${Date.now()}`,
      questionText: 'New Question: Calculate the required outcome...',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: 'Explanation for correct option.',
      difficulty: 'Medium',
      status: 'APPROVED'
    };
    setQuestions((prev) => [...prev, newQ]);
    handleStartEdit(newQ, questions.length);
  };

  const approvedQuestions = questions.filter((q) => q.status === 'APPROVED');
  const approvedCount = approvedQuestions.length;

  // Step 2 -> Step 3: Validate Question Count
  const handleProceedToMode = () => {
    if (approvedCount < targetQuestionCount) {
      setErrorMsg(
        `Only ${approvedCount} approved questions are available. Add or generate at least ${
          targetQuestionCount - approvedCount
        } more questions before publishing.`
      );
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  // Final Submit Handler (Draft or Publish)
  const handleFinalSave = async (statusToSet = 'published') => {
    // Validation
    const effectiveTitle =
      title.trim() || `${category} Assessment — ${effectiveTopic || 'Level 1'}`;

    if (!category) {
      setErrorMsg('Category is required.');
      return;
    }

    if (statusToSet === 'published') {
      if (approvedCount < targetQuestionCount) {
        setErrorMsg(
          `Cannot publish: Only ${approvedCount} approved questions available. You need ${targetQuestionCount} approved questions.`
        );
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        title: effectiveTitle,
        description:
          description.trim() ||
          `Comprehensive ${category} evaluation covering ${effectiveTopic} with ${targetQuestionCount} questions.`,
        module: 'Aptitude',
        category,
        topic: effectiveTopic,
        difficulty,
        questions: approvedQuestions.map((q) => ({
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          type: 'mcq',
          marks: 1
        })),
        passingScorePercentage,
        timeLimitMinutes,
        totalMarks: approvedQuestions.length,
        isAIGenerated: creationMethod === 'AI_GENERATED',
        aiProvider: creationMethod === 'AI_GENERATED' ? aiProvider : 'manual',
        creationMethod,
        assessmentMode,
        proctoringSettings:
          assessmentMode === 'PROCTORED'
            ? proctoringSettings
            : {
                camera: false,
                screenShare: false,
                fullScreen: false,
                tabSwitch: false,
                copyPaste: false,
                secondPerson: false,
                mobileDetection: false
              },
        status: statusToSet
      };

      const res = await api.createAssessment(payload);
      if (res.success) {
        if (onSuccess) onSuccess(res.assessment, statusToSet);
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to save assessment.');
      }
    } catch (err) {
      console.error('Error creating aptitude assessment:', err);
      setErrorMsg(err.message || 'Error creating assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Aptitude Assessment"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Step Progress Tracker */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              1
            </span>
            <span className={`text-xs font-bold ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              Creation Method & Topic
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </span>
            <span className={`text-xs font-bold ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
              Question Review ({approvedCount}/{targetQuestionCount})
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              3
            </span>
            <span className={`text-xs font-bold ${step >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
              Proctoring & Publish
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: METHOD & TOPIC CONFIGURATION */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Choose Creation Method Card Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Choose Assessment Creation Method *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCreationMethod('AI_GENERATED')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 ${
                    creationMethod === 'AI_GENERATED'
                      ? 'bg-blue-50/80 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">Option 1 — AI Generated</div>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      Automatically generate high-standard questions, options, and explanations with AI.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCreationMethod('PDF_EXTRACTION')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 ${
                    creationMethod === 'PDF_EXTRACTION'
                      ? 'bg-blue-50/80 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 mt-0.5">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">Option 2 — PDF Extraction</div>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      Upload a question PDF and parse questions, options, answers, and explanations.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* PDF Upload Box (If PDF Extraction) */}
            {creationMethod === 'PDF_EXTRACTION' && (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">Upload Question PDF *</span>
                  </div>
                  {pdfFileName && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {pdfFileName}
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Supported formats: Standard PDF documents containing numbered MCQs with 4 options and answers.
                </p>
              </div>
            )}

            {/* Category & Topic Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Aptitude Category *"
                options={APTITUDE_CATEGORIES}
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setCategory(newCat);
                  if (newCat === 'Mix Assessment' && targetQuestionCount < 15) {
                    setTargetQuestionCount(30);
                    setTimeLimitMinutes(30);
                  }
                }}
              />

              <div className="space-y-1">
                <Select
                  label="Aptitude Topic *"
                  options={[...(APTITUDE_TOPICS[category] || []), 'Custom Topic']}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                {topic === 'Custom Topic' && (
                  <Input
                    placeholder="Enter custom topic name..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="mt-2 text-xs"
                    required
                  />
                )}
              </div>
            </div>

            {/* Mix Assessment Helper Banner */}
            {category === 'Mix Assessment' && (
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs shadow-2xs">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold text-indigo-950 block">Comprehensive Aptitude Mix Assessment</span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Creates a balanced test distributing questions across <strong>Quantitative Aptitude</strong>, <strong>Logical Reasoning</strong>, and <strong>Verbal Ability</strong>. Recommended for full 30-question placement mock drives.
                  </p>
                </div>
              </div>
            )}

            {/* Assessment Title & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Assessment Title"
                placeholder={`e.g. ${category} Placement Test — ${effectiveTopic || 'Level 1'}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                label="Description (Optional)"
                placeholder="e.g. Comprehensive timed evaluation for campus hiring."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Test Constraints Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <Select
                label="Target Questions"
                options={QUESTION_COUNT_OPTIONS.map(String)}
                value={String(targetQuestionCount)}
                onChange={(e) => setTargetQuestionCount(parseInt(e.target.value, 10))}
              />
              <Select
                label="Difficulty"
                options={DIFFICULTY_OPTIONS}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              />
              <Select
                label="Time Limit"
                options={TIME_LIMIT_OPTIONS.map((t) => `${t} mins`)}
                value={`${timeLimitMinutes} mins`}
                onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value, 10))}
              />
              <Select
                label="Pass %"
                options={PASS_PERCENTAGE_OPTIONS.map((p) => `${p}%`)}
                value={`${passingScorePercentage}%`}
                onChange={(e) => setPassingScorePercentage(parseInt(e.target.value, 10))}
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateOrExtract}
                loading={loading}
                icon={creationMethod === 'AI_GENERATED' ? Sparkles : FileUp}
                disabled={!creationMethod}
              >
                {creationMethod === 'AI_GENERATED'
                  ? 'Generate Questions for Review'
                  : 'Extract Questions from PDF'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: QUESTION REVIEW & APPROVAL */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Header / Approval Stats Banner */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/40 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {category}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900">{effectiveTopic}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Review generated questions below. Edit, approve, or reject questions before configuring proctoring.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Approved Questions</span>
                  <span
                    className={`text-base font-black ${
                      approvedCount >= targetQuestionCount ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {approvedCount} / {targetQuestionCount}
                  </span>
                </div>
                <Button size="sm" variant="outline" icon={Plus} onClick={handleAddManualQuestion}>
                  Add Question
                </Button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isEditing = editingQuestionIndex === idx;
                const isApproved = q.status === 'APPROVED';

                if (isEditing) {
                  return (
                    <div key={q.id || idx} className="p-4 bg-white rounded-2xl border-2 border-blue-500 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-600">Editing Question {idx + 1}</span>
                        <div className="flex gap-2">
                          <Button size="xs" variant="outline" onClick={() => setEditingQuestionIndex(null)}>
                            Cancel
                          </Button>
                          <Button size="xs" variant="primary" onClick={handleSaveEdit}>
                            Save & Approve
                          </Button>
                        </div>
                      </div>

                      <textarea
                        value={editForm.questionText}
                        onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20"
                        rows={2}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {editForm.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <span className="w-6 text-xs font-bold text-slate-500">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...editForm.options];
                                newOpts[oIdx] = e.target.value;
                                setEditForm({ ...editForm, options: newOpts });
                              }}
                              className="flex-1 p-2 text-xs rounded-lg border border-slate-300"
                            />
                            <button
                              type="button"
                              onClick={() => setEditForm({ ...editForm, correctAnswer: opt })}
                              className={`px-2 py-1 text-[10px] font-bold rounded ${
                                editForm.correctAnswer === opt
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Correct
                            </button>
                          </div>
                        ))}
                      </div>

                      <Input
                        label="Explanation"
                        value={editForm.explanation}
                        onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={q.id || idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isApproved
                        ? 'bg-white border-slate-200 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 leading-relaxed">
                            {q.questionText}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            {q.options?.map((opt, oIdx) => {
                              const isCorrect = opt === q.correctAnswer;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2 rounded-xl text-xs border flex items-center justify-between ${
                                    isCorrect
                                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold'
                                      : 'bg-slate-50 border-slate-200/60 text-slate-700'
                                  }`}
                                >
                                  <span>
                                    <strong className="mr-1.5">{String.fromCharCode(65 + oIdx)}.</strong>
                                    {opt}
                                  </span>
                                  {isCorrect && (
                                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200/40">
                              <strong>Explanation:</strong> {q.explanation}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleApprove(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isApproved ? 'Approved' : 'Approve'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(q, idx)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                          title="Edit Question"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Validation Notice if approved < target */}
            {approvedCount < targetQuestionCount && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Only {approvedCount} approved questions are available. Add or generate at least{' '}
                  {targetQuestionCount - approvedCount} more questions before proceeding.
                </span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" icon={ChevronLeft} onClick={() => setStep(1)}>
                Back to Configuration
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" icon={Save} onClick={() => handleFinalSave('draft')}>
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  icon={ChevronRight}
                  onClick={handleProceedToMode}
                  disabled={approvedCount < targetQuestionCount}
                >
                  Configure Proctoring
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ASSESSMENT MODE & PROCTORING CONFIGURATION */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Assessment Mode Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Select Assessment Mode *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAssessmentMode('NORMAL')}
                  className={`p-5 rounded-3xl border text-left transition flex items-start gap-4 ${
                    assessmentMode === 'NORMAL'
                      ? 'bg-blue-50/80 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 mt-0.5">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">Normal Assessment</div>
                    <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
                      Standard practice test. Zero camera, zero microphone, zero screen sharing, and no proctoring monitoring active.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAssessmentMode('PROCTORED')}
                  className={`p-5 rounded-3xl border text-left transition flex items-start gap-4 ${
                    assessmentMode === 'PROCTORED'
                      ? 'bg-blue-50/80 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 mt-0.5">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">Proctored Assessment</div>
                    <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
                      High-stakes examination. Enforces webcam monitoring, screen-share verification, anti-cheat detection, and warning logs.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Proctoring Settings (Only shown if Proctored Assessment is selected) */}
            {assessmentMode === 'PROCTORED' && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Proctoring Anti-Cheat Controls
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure active security verifications for candidate test attempts.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full uppercase">
                    Proctoring Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Camera Monitoring */}
                  <label className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50/80 transition">
                    <div className="flex items-center gap-2.5">
                      <Camera className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Camera Monitoring</div>
                        <div className="text-[10px] text-slate-500">Live candidate video preview</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={proctoringSettings.camera}
                      onChange={(e) =>
                        setProctoringSettings({ ...proctoringSettings, camera: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Screen Sharing */}
                  <label className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50/80 transition">
                    <div className="flex items-center gap-2.5">
                      <Monitor className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Screen Sharing</div>
                        <div className="text-[10px] text-slate-500">Mandatory candidate screen stream</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={proctoringSettings.screenShare}
                      onChange={(e) =>
                        setProctoringSettings({
                          ...proctoringSettings,
                          screenShare: e.target.checked
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Full Screen */}
                  <label className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50/80 transition">
                    <div className="flex items-center gap-2.5">
                      <Maximize2 className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Full Screen Enforced</div>
                        <div className="text-[10px] text-slate-500">Locks browser to fullscreen</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={proctoringSettings.fullScreen}
                      onChange={(e) =>
                        setProctoringSettings({
                          ...proctoringSettings,
                          fullScreen: e.target.checked
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Tab Switch Detection */}
                  <label className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50/80 transition">
                    <div className="flex items-center gap-2.5">
                      <Eye className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Tab Switch Detection</div>
                        <div className="text-[10px] text-slate-500">Logs tab changes & triggers warning</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={proctoringSettings.tabSwitch}
                      onChange={(e) =>
                        setProctoringSettings({
                          ...proctoringSettings,
                          tabSwitch: e.target.checked
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Copy/Paste Detection */}
                  <label className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50/80 transition">
                    <div className="flex items-center gap-2.5">
                      <Copy className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Copy/Paste Blocking</div>
                        <div className="text-[10px] text-slate-500">Disables clipboard copying</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={proctoringSettings.copyPaste}
                      onChange={(e) =>
                        setProctoringSettings({
                          ...proctoringSettings,
                          copyPaste: e.target.checked
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Second Person Detection */}
                  <label className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50/80 transition">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Second Person Detection</div>
                        <div className="text-[10px] text-slate-500">Multi-face CV warning</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={proctoringSettings.secondPerson}
                      onChange={(e) =>
                        setProctoringSettings({
                          ...proctoringSettings,
                          secondPerson: e.target.checked
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Mobile Device Detection */}
                  <label className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50/80 transition">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Mobile Device Detection</div>
                        <div className="text-[10px] text-slate-500">Restricts non-desktop clients</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={proctoringSettings.mobileDetection}
                      onChange={(e) =>
                        setProctoringSettings({
                          ...proctoringSettings,
                          mobileDetection: e.target.checked
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Final Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" icon={ChevronLeft} onClick={() => setStep(2)}>
                Back to Questions
              </Button>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  icon={Save}
                  onClick={() => handleFinalSave('draft')}
                  loading={loading}
                >
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  icon={Send}
                  onClick={() => handleFinalSave('published')}
                  loading={loading}
                >
                  Publish Assessment
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AptitudeAssessmentCreateModal;
