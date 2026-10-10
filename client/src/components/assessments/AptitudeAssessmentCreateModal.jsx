import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import { AI_PROVIDERS } from '../../constants/questionBank';
import { OFFICIAL_DEPARTMENTS } from '../../constants/departments';
import {
  APTITUDE_CATEGORIES,
  APTITUDE_TOPICS,
  QUESTION_COUNT_OPTIONS,
  TIME_LIMIT_OPTIONS,
  PASS_PERCENTAGE_OPTIONS,
  DIFFICULTY_OPTIONS
} from '../../constants/aptitudeTopics';

const DOMAIN_SUGGESTIONS = {
  CSE: ['Data Structures & Algorithms', 'Object-Oriented Programming (OOP)', 'DBMS & SQL Queries', 'Operating Systems', 'Computer Networks', 'Software Engineering', 'Web Technologies', 'System Design', 'Compiler Principles'],
  IT: ['Full-Stack Web Development', 'Cloud Computing (AWS/Azure)', 'Database Architectures & SQL', 'Computer Networks & Security', 'DevOps & CI/CD Pipelines', 'Cybersecurity Fundamentals', 'Programming with Python/Java'],
  EXTC: ['Digital Electronics & Logic Gates', 'Microprocessors & Microcontrollers (8051/ARM)', 'Embedded Systems & RTOS', 'Analog & Digital Communication', 'VLSI Design & CMOS', 'Signals & Systems', 'Electromagnetics & Antennas'],
  Civil: ['Structural Analysis & Mechanics', 'Geotechnical & Foundation Engineering', 'Surveying & Advanced Geomatics', 'Concrete Technology & RCC Design', 'Transportation & Highway Engineering', 'Environmental Engineering', 'Fluid Mechanics (Civil)'],
  Mechanical: ['Thermodynamics & Heat Transfer', 'Fluid Mechanics & Hydraulic Machines', 'Strength of Materials', 'Theory of Machines', 'CAD/CAM & Automation', 'Manufacturing Processes & Metallurgy', 'Automobile Engineering'],
  'CSE (IOT)': ['IoT Architecture & Wireless Protocols', 'Sensors & Actuators Interfacing', 'Embedded C & Arduino/Raspberry Pi', 'Edge Computing & Cloud IoT', 'Smart Systems & Microcontrollers'],
  AIDS: ['Machine Learning Algorithms', 'Deep Learning & Neural Networks', 'Python for Data Science', 'Statistics & Probability', 'Natural Language Processing (NLP)', 'Generative AI & LLM Foundations', 'SQL & Data Engineering'],
  MCA: ['Enterprise Java & Spring Framework', 'Data Structures & Algorithms', 'Relational Databases & SQL', 'Web Development (React & Node.js)', 'Operating Systems & Networks', 'Cloud & DevOps'],
  MBA: ['Corporate Finance & Investment Analysis', 'Marketing Management & Brand Strategy', 'Human Resource Management', 'Operations & Supply Chain Logistics', 'Business Analytics & Data Interpretation', 'Strategic Management & Case Studies']
};

const FULL_ASSESSMENT_SUGGESTIONS = [
  'Quantitative Aptitude & Problem Solving',
  'Logical Reasoning & Analytical Deduction',
  'Verbal Ability & Professional Communication',
  'Core Technical Concepts & DSA',
  'Campus Placement Drive Simulation',
  'Quantitative, Logical & Technical Blend'
];
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
  BookOpen,
  Check,
  RotateCcw,
  Loader2
} from 'lucide-react';

export const AptitudeAssessmentCreateModal = ({
  isOpen,
  onClose,
  onSuccess,
  module = 'Aptitude',
  initialCategory = 'Quantitative Aptitude',
  initialDepartment = 'CSE'
}) => {
  const isDomain = module === 'Domain Knowledge' || module === 'Domain';
  const isFull = module === 'Full Assessment' || module === 'Full';
  const isAptitude = !isDomain && !isFull;

  // Step Management: 1: Method & Config, 2: Question Review, 3: Mode & Proctoring, 4: Final Summary
  const [step, setStep] = useState(1);

  // Method: 'AI_GENERATED' | 'PDF_EXTRACTION'
  const [creationMethod, setCreationMethod] = useState('');

  // Assessment Info & Config
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartment || 'CSE');
  const [prompt, setPrompt] = useState('');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [targetQuestionCount, setTargetQuestionCount] = useState(5);
  const [isCustomCount, setIsCustomCount] = useState(false);
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

  // Loading, Progress, and Error States
  const [loading, setLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [regeneratingIndex, setRegeneratingIndex] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Curated training suggestions based on the active module and category
  const currentSuggestions = useMemo(() => {
    if (isDomain) {
      return DOMAIN_SUGGESTIONS[selectedDepartment] || DOMAIN_SUGGESTIONS.CSE;
    }
    if (isFull) {
      return FULL_ASSESSMENT_SUGGESTIONS;
    }
    if (category === 'Mix Assessment') {
      return [
        'Time & Work', 'Percentage', 'Profit & Loss', 'Ratio & Proportion',
        'Blood Relations', 'Direction Sense', 'Number Series', 'Syllogism',
        'Reading Comprehension', 'Sentence Correction', 'Synonyms & Antonyms'
      ];
    }
    return APTITUDE_TOPICS[category] || Object.values(APTITUDE_TOPICS).flat().slice(0, 15);
  }, [isDomain, isFull, selectedDepartment, category]);

  const handleAddTopicToPrompt = (topicName) => {
    setPrompt((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return `Generate questions focusing on ${topicName}`;
      }
      if (trimmed.toLowerCase().includes(topicName.toLowerCase())) {
        return prev;
      }
      return `${trimmed}, ${topicName}`;
    });
  };

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
      setCategory(initialCategory || 'Quantitative Aptitude');
      setSelectedDepartment(initialDepartment || 'CSE');
      setPrompt('');
      const available = APTITUDE_TOPICS[initialCategory] || [];
      setTopic(available[0] || 'Percentage');
      setCustomTopic('');
      setTitle('');
      setDescription('');
      setDifficulty('Medium');
      setTargetQuestionCount(5);
      setIsCustomCount(false);
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
      setProgressStatus('');
      setProgressPercent(0);
      setRegeneratingIndex(null);
      setEditingQuestionIndex(null);
    }
  }, [isOpen, initialCategory, initialDepartment, module]);

  const effectiveTopic = topic === 'Custom Topic' ? customTopic.trim() : topic;
  const [savingToBank, setSavingToBank] = useState(false);
  const [bankSuccessMsg, setBankSuccessMsg] = useState('');

  // Handle PDF file selection (100% UNCHANGED)
  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please select a valid PDF file (.pdf).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('PDF file exceeds 20MB limit.');
      return;
    }

    setPdfFile(file);
    setPdfFileName(file.name);
    setErrorMsg('');
  };

  // Step 1 -> Step 2: Trigger Generation / Extraction
  const handleGenerateOrExtract = async () => {
    if (!creationMethod) {
      setErrorMsg('Please select a Question Source (AI Generated or PDF Extraction).');
      return;
    }

    if (creationMethod === 'AI_GENERATED') {
      if (!prompt.trim()) {
        setErrorMsg('Please write an AI Generation Prompt or click any topic suggestion below.');
        return;
      }
    } else {
      if (!effectiveTopic) {
        setErrorMsg('Please select or enter a topic name.');
        return;
      }
      if (!pdfFile && !pdfText) {
        setErrorMsg('Please upload a Question PDF file before extracting.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const normalizedModule =
        module === 'Domain Knowledge' ? 'Domain' : module === 'Full Assessment' ? 'Full' : module;
      const normalizedCategory = isDomain ? selectedDepartment : category;
      const normalizedDepartment = isDomain ? selectedDepartment : null;

      if (creationMethod === 'AI_GENERATED') {
        const totalTarget = Math.max(1, parseInt(targetQuestionCount, 10) || 5);

        // Split into batches of 10–20 questions per Gemini call
        const batchChunks = [];
        let preferredBatch = 20;
        if (totalTarget <= 20) {
          preferredBatch = totalTarget;
        } else if (totalTarget % 15 === 0 && totalTarget % 20 !== 0) {
          preferredBatch = 15;
        } else if (totalTarget <= 30) {
          preferredBatch = 15;
        } else {
          preferredBatch = 20;
        }

        let rem = totalTarget;
        while (rem > 0) {
          const sz = Math.min(preferredBatch, rem);
          batchChunks.push(sz);
          rem -= sz;
        }

        const collected = [];
        let runningTotal = 0;

        for (let bIdx = 0; bIdx < batchChunks.length; bIdx++) {
          const chunkSize = batchChunks[bIdx];
          const nextTarget = Math.min(runningTotal + chunkSize, totalTarget);
          setProgressStatus(`Generating ${nextTarget}/${totalTarget}...`);
          setProgressPercent(Math.round((bIdx / batchChunks.length) * 100));

          const res = await api.generateQuestionsForReview({
            provider: aiProvider,
            module: normalizedModule,
            category: normalizedCategory,
            department: normalizedDepartment,
            topic: prompt.slice(0, 60).trim(),
            prompt: prompt.trim(),
            customPrompt: prompt.trim(),
            difficulty,
            questionCount: chunkSize,
            existingQuestions: collected.map((q) => q.questionText)
          });

          if (res.success && Array.isArray(res.questions) && res.questions.length > 0) {
            for (const q of res.questions) {
              if (collected.length >= totalTarget) break;

              let opts = Array.isArray(q.options) && q.options.length >= 4
                ? q.options.slice(0, 4).map((o) => String(o || '').trim())
                : ['Option A', 'Option B', 'Option C', 'Option D'];
              while (opts.length < 4) {
                opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
              }

              let corr = String(q.correctAnswer || opts[0]).trim();
              const upper = corr.toUpperCase();
              if (upper === 'A' || upper === 'OPTION A' || upper === '(A)') corr = opts[0];
              else if (upper === 'B' || upper === 'OPTION B' || upper === '(B)') corr = opts[1];
              else if (upper === 'C' || upper === 'OPTION C' || upper === '(C)') corr = opts[2];
              else if (upper === 'D' || upper === 'OPTION D' || upper === '(D)') corr = opts[3];
              if (!opts.includes(corr)) opts[0] = corr;

              // Deduplication against previously collected questions
              const normQ = String(q.questionText || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              const isDup = collected.some((item) => {
                const normItem = item.questionText.toLowerCase().replace(/[^a-z0-9]/g, '');
                return normQ === normItem || (normQ.length > 25 && normItem.length > 25 && (normQ.includes(normItem) || normItem.includes(normQ)));
              });

              if (!isDup && q.questionText) {
                collected.push({
                  id: `gen-${Date.now()}-${collected.length}`,
                  questionText: q.questionText,
                  codeSnippet: q.codeSnippet || '',
                  options: opts,
                  correctAnswer: corr,
                  explanation: q.explanation || '',
                  difficulty: q.difficulty || difficulty,
                  status: 'APPROVED'
                });
              }
            }
            runningTotal = collected.length;
          }
        }

        setProgressStatus(`Generating ${totalTarget}/${totalTarget}...`);
        setProgressPercent(95);

        // Guarantee EXACT totalTarget (top up any deficit caused by rejected duplicates)
        if (collected.length < totalTarget) {
          const deficit = totalTarget - collected.length;
          const topUpRes = await api.generateQuestionsForReview({
            provider: aiProvider,
            module: normalizedModule,
            category: normalizedCategory,
            department: normalizedDepartment,
            topic: prompt.slice(0, 60).trim(),
            prompt: prompt.trim(),
            customPrompt: prompt.trim(),
            difficulty,
            questionCount: deficit,
            existingQuestions: collected.map((q) => q.questionText)
          });
          if (topUpRes.success && Array.isArray(topUpRes.questions)) {
            for (const q of topUpRes.questions) {
              if (collected.length >= totalTarget) break;
              let opts = Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'];
              while (opts.length < 4) opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
              let corr = String(q.correctAnswer || opts[0]).trim();
              if (!opts.includes(corr)) opts[0] = corr;
              collected.push({
                id: `gen-${Date.now()}-${collected.length}`,
                questionText: q.questionText,
                codeSnippet: q.codeSnippet || '',
                options: opts,
                correctAnswer: corr,
                explanation: q.explanation || '',
                difficulty: q.difficulty || difficulty,
                status: 'APPROVED'
              });
            }
          }
        }

        // Final strict validation: exactly totalTarget questions, 4 options each, one matching correct answer
        const validated = collected.slice(0, totalTarget).map((q, idx) => {
          let opts = Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'];
          while (opts.length < 4) opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
          let corr = q.correctAnswer;
          if (!opts.includes(corr)) corr = opts[0];
          return {
            ...q,
            id: q.id || `gen-${Date.now()}-${idx}`,
            options: opts,
            correctAnswer: corr
          };
        });

        if (validated.length > 0) {
          setProgressStatus('Test ready.');
          setProgressPercent(100);
          await new Promise((r) => setTimeout(r, 400));
          setQuestions(validated);
          setTargetQuestionCount(validated.length);
          setStep(2);
        } else {
          setErrorMsg('Failed to generate questions via AI. Please check LLM provider.');
        }
      } else {
        // PDF Extraction - Send binary PDF to backend for local pdf-parse pattern recognition (100% UNCHANGED)
        let payload;
        if (pdfFile) {
          payload = new FormData();
          payload.append('pdfFile', pdfFile);
          payload.append('category', category);
          payload.append('topic', effectiveTopic);
          payload.append('difficulty', difficulty);
          payload.append('questionCount', targetQuestionCount || 50);
        } else {
          payload = {
            pdfText: pdfText || '',
            category,
            topic: effectiveTopic,
            difficulty,
            questionCount: targetQuestionCount || 50
          };
        }

        const res = await api.extractPdfQuestions(payload);

        if (res.success && res.questions?.length > 0) {
          const formatted = res.questions.map((q, idx) => ({
            id: q.id || `pdf-${Date.now()}-${idx}`,
            questionText: q.questionText || '',
            passage: q.passage || '',
            passageTitle: q.passageTitle || '',
            options: q.options || ['', '', '', ''],
            correctAnswer: q.correctAnswer || q.options?.[0] || '',
            explanation: q.explanation || '',
            difficulty: q.difficulty || difficulty,
            status: 'APPROVED'
          }));
          setQuestions(formatted);
          setTargetQuestionCount(formatted.length);
          setStep(2);
        } else {
          setErrorMsg(res.message || 'No questions could be extracted from this PDF. Please verify that the PDF contains numbered MCQs.');
        }
      }
    } catch (err) {
      console.error('Generation/Extraction error:', err);
      setErrorMsg(err.message || 'Server error while processing questions.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle approval / selection of a question
  const handleToggleApprove = (idx) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === idx ? { ...q, status: q.status === 'APPROVED' ? 'REJECTED' : 'APPROVED' } : q
      )
    );
  };

  // Select All or Deselect All
  const handleSelectAll = (select = true) => {
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        status: select ? 'APPROVED' : 'REJECTED'
      }))
    );
  };

  const handleDeleteQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRegenerateQuestion = async (idx) => {
    const targetQ = questions[idx];
    if (!targetQ) return;
    setRegeneratingIndex(idx);
    setErrorMsg('');
    try {
      const normalizedModule =
        module === 'Domain Knowledge' ? 'Domain' : module === 'Full Assessment' ? 'Full' : module;
      const normalizedCategory = isDomain ? selectedDepartment : category;
      const normalizedDepartment = isDomain ? selectedDepartment : null;

      const otherQuestionTexts = questions.filter((_, i) => i !== idx).map((q) => q.questionText);

      const res = await api.generateQuestionsForReview({
        provider: aiProvider,
        module: normalizedModule,
        category: normalizedCategory,
        department: normalizedDepartment,
        topic: prompt.slice(0, 60).trim() || effectiveTopic,
        prompt: prompt.trim() || effectiveTopic,
        customPrompt: prompt.trim() || effectiveTopic,
        difficulty: targetQ.difficulty || difficulty,
        questionCount: 1,
        existingQuestions: otherQuestionTexts
      });

      if (res.success && Array.isArray(res.questions) && res.questions.length > 0) {
        const newQ = res.questions[0];
        let opts = Array.isArray(newQ.options) && newQ.options.length >= 4
          ? newQ.options.slice(0, 4)
          : ['Option A', 'Option B', 'Option C', 'Option D'];
        while (opts.length < 4) opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
        let corr = String(newQ.correctAnswer || opts[0]).trim();
        if (!opts.includes(corr)) corr = opts[0];

        setQuestions((prev) =>
          prev.map((q, i) =>
            i === idx
              ? {
                  ...q,
                  questionText: newQ.questionText,
                  codeSnippet: newQ.codeSnippet || '',
                  options: opts,
                  correctAnswer: corr,
                  explanation: newQ.explanation || q.explanation,
                  difficulty: newQ.difficulty || q.difficulty,
                  status: 'APPROVED'
                }
              : q
          )
        );
      } else {
        setErrorMsg('Failed to regenerate this question. Please try again.');
      }
    } catch (err) {
      console.error('Error regenerating question:', err);
      setErrorMsg('Error regenerating question: ' + (err.message || 'Unknown error'));
    } finally {
      setRegeneratingIndex(null);
    }
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

  // Save selected questions to Question Bank
  const handleSaveToQuestionBank = async () => {
    if (approvedQuestions.length === 0) {
      setErrorMsg('No approved questions selected to save to Question Bank.');
      return;
    }
    setSavingToBank(true);
    setErrorMsg('');
    try {
      let savedCount = 0;
      for (const q of approvedQuestions) {
        await api.createQuestion({
          module: 'Aptitude',
          category,
          topic: effectiveTopic,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty || difficulty,
          aiGenerated: creationMethod === 'AI_GENERATED',
          aiProvider: creationMethod === 'AI_GENERATED' ? aiProvider : 'manual'
        });
        savedCount++;
      }
      setBankSuccessMsg(`Successfully saved ${savedCount} question(s) to Question Bank!`);
      setTimeout(() => setBankSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save to question bank error:', err);
      setErrorMsg('Error saving to Question Bank: ' + err.message);
    } finally {
      setSavingToBank(false);
    }
  };

  // Step 2 -> Step 3: Validate Question Count & proceed
  const handleProceedToMode = () => {
    if (approvedCount === 0) {
      setErrorMsg('Please approve or select at least 1 question for the assessment.');
      return;
    }
    // Automatically synchronize target count to approved questions if fewer were approved
    if (approvedCount < targetQuestionCount) {
      setTargetQuestionCount(approvedCount);
    }
    setErrorMsg('');
    setStep(3);
  };

  // Final Submit Handler (Draft or Publish)
  const handleFinalSave = async (statusToSet = 'published') => {
    const normalizedModule =
      module === 'Domain Knowledge' ? 'Domain' : module === 'Full Assessment' ? 'Full' : module;
    const normalizedCategory = isDomain ? selectedDepartment : category;
    const normalizedDepartment = isDomain ? selectedDepartment : null;

    const displayTopic = prompt.slice(0, 35).trim() || effectiveTopic || 'General';
    const effectiveTitle =
      title.trim() || `${module} Assessment — ${displayTopic}`;

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
    setProgressStatus('Saving questions...');
    setProgressPercent(80);

    try {
      const payload = {
        title: effectiveTitle,
        description:
          description.trim() ||
          `Comprehensive ${module} evaluation covering ${prompt.trim() || effectiveTopic} with ${targetQuestionCount} questions.`,
        module: normalizedModule,
        category: normalizedCategory,
        department: normalizedDepartment,
        topic: prompt.slice(0, 60).trim() || effectiveTopic,
        prompt: prompt.trim(),
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
        setProgressStatus('Test ready.');
        setProgressPercent(100);
        await new Promise((r) => setTimeout(r, 400));
        if (onSuccess) onSuccess(res.assessment, statusToSet);
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to save assessment.');
      }
    } catch (err) {
      console.error('Error creating assessment:', err);
      setErrorMsg(err.message || 'Error creating assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create ${module} Assessment`}
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
                Select Question Source *
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
                    <div className="text-sm font-extrabold text-slate-900">AI Generated</div>
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
                    <div className="text-sm font-extrabold text-slate-900">PDF Extraction</div>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      Upload an aptitude/question PDF and extract questions offline without AI.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* PDF Upload Box (If PDF Extraction) */}
            {creationMethod === 'PDF_EXTRACTION' && (
              <div className="p-4 bg-indigo-50/40 border border-dashed border-indigo-300 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">Upload Question PDF *</span>
                  </div>
                  {pdfFileName && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      <Check className="w-3.5 h-3.5" /> {pdfFileName}
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Supported format: Multi-page or single-page PDF containing numbered questions (1., Q1.) with options (A-D) and answers. Processed 100% locally.
                </p>
              </div>
            )}

            {/* AI GENERATED: Write AI Prompt with Training Module Suggestions */}
            {creationMethod === 'AI_GENERATED' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {isDomain ? (
                    <Select
                      label="Engineering Department *"
                      options={OFFICIAL_DEPARTMENTS}
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                    />
                  ) : (
                    <Select
                      label="Assessment Category *"
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
                  )}

                  <Select
                    label="Difficulty Level *"
                    options={DIFFICULTY_OPTIONS}
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  />
                </div>

                {/* AI Prompt Input (Replaces rigid topic selection) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      AI Test Generation Prompt / Syllabus Instructions *
                    </label>
                    <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Powered by Google Gemini
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      isDomain
                        ? `e.g. Generate questions for ${selectedDepartment} covering key algorithms, design patterns, database indexing, and practical troubleshooting...`
                        : isFull
                        ? 'e.g. Comprehensive campus recruitment mock test combining Quantitative problem-solving, Logical deduction, and core engineering aptitude...'
                        : `e.g. Generate questions on ${category === 'Mix Assessment' ? 'Mixed Aptitude' : category} focusing on practical word problems, shortcuts, and calculation speed...`
                    }
                    className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition custom-scrollbar"
                  />

                  {/* Training Module Suggestions Bar */}
                  <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        Suggested Topics from Training Module (Click to append to prompt):
                      </span>
                      {prompt && (
                        <button
                          type="button"
                          onClick={() => setPrompt('')}
                          className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar pt-0.5">
                      {currentSuggestions.map((sug) => {
                        const isIncluded = prompt.toLowerCase().includes(sug.toLowerCase());
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleAddTopicToPrompt(sug)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition border flex items-center gap-1 ${
                              isIncluded
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                            }`}
                          >
                            <span>{sug}</span>
                            {isIncluded ? <Check className="w-3 h-3 ml-0.5" /> : <Plus className="w-3 h-3 ml-0.5 opacity-60" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PDF EXTRACTION: 100% Unchanged (Select Category & Topic) */}
            {creationMethod === 'PDF_EXTRACTION' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label={isDomain ? "Department *" : "Aptitude Category *"}
                  options={isDomain ? OFFICIAL_DEPARTMENTS : APTITUDE_CATEGORIES}
                  value={isDomain ? selectedDepartment : category}
                  onChange={(e) => {
                    if (isDomain) {
                      setSelectedDepartment(e.target.value);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                />

                <div className="space-y-1">
                  <Select
                    label="Topic / Subject *"
                    options={[...(isDomain ? (DOMAIN_SUGGESTIONS[selectedDepartment] || ['General']) : (APTITUDE_TOPICS[category] || [])), 'Custom Topic']}
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
            )}

            {/* Mix Assessment Helper Banner */}
            {category === 'Mix Assessment' && creationMethod !== 'PDF_EXTRACTION' && (
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs shadow-2xs">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold text-indigo-950 block">Comprehensive Aptitude Mix Assessment</span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Creates a balanced test distributing questions across <strong>Quantitative Aptitude</strong>, <strong>Logical Reasoning</strong>, and <strong>Verbal Ability</strong>. Recommended for full placement mock drives (up to 180 questions).
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
              <div>
                <Select
                  label="Target Questions (Max 180)"
                  options={[...QUESTION_COUNT_OPTIONS.map(String), 'Custom']}
                  value={isCustomCount ? 'Custom' : String(targetQuestionCount)}
                  onChange={(e) => {
                    if (e.target.value === 'Custom') {
                      setIsCustomCount(true);
                    } else {
                      setIsCustomCount(false);
                      setTargetQuestionCount(parseInt(e.target.value, 10));
                    }
                  }}
                />
                {isCustomCount && (
                  <input
                    type="number"
                    min="1"
                    max="180"
                    placeholder="Enter 1 - 180"
                    value={targetQuestionCount}
                    onChange={(e) => {
                      const raw = parseInt(e.target.value, 10);
                      const val = isNaN(raw) ? '' : Math.min(Math.max(raw, 1), 180);
                      setTargetQuestionCount(val);
                    }}
                    className="mt-1.5 block w-full px-3 py-1.5 text-xs bg-white border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                  />
                )}
              </div>
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

            {/* Live Generation Progress Banner */}
            {loading && progressStatus && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/90 rounded-2xl flex items-center gap-3.5 shadow-2xs">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-blue-950 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      {progressStatus}
                    </span>
                    <span className="text-[11px] font-black text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200/70 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

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
                  : 'Extract Questions'}
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
                  {creationMethod === 'PDF_EXTRACTION' && (
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      PDF Extraction Mode
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 font-semibold">
                  {creationMethod === 'PDF_EXTRACTION'
                    ? `Extracted Questions: ${questions.length} questions detected from uploaded PDF.`
                    : 'Review generated questions below. Edit, select, or modify questions before finalizing.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right mr-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Selected Questions</span>
                  <span className="text-base font-black text-emerald-600">
                    {approvedCount} / {questions.length}
                  </span>
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleSelectAll(approvedCount !== questions.length)}
                >
                  {approvedCount === questions.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button size="xs" variant="outline" icon={Plus} onClick={handleAddManualQuestion}>
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
                          {q.passage && (
                            <div className="mb-2 p-2 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-amber-900 block">
                                {q.passageTitle || 'Shared Context / Directions'}
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto font-medium">
                                {q.passage}
                              </p>
                            </div>
                          )}
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

                        {creationMethod === 'AI_GENERATED' && (
                          <button
                            type="button"
                            onClick={() => handleRegenerateQuestion(idx)}
                            disabled={regeneratingIndex !== null}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition disabled:opacity-40"
                            title="Regenerate this Question with AI"
                          >
                            {regeneratingIndex === idx ? (
                              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </button>
                        )}

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

            {/* Success message when saving to question bank */}
            {bankSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bankSuccessMsg}</span>
              </div>
            )}

            {/* Validation Notice if no questions selected */}
            {approvedCount === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Please select or approve at least 1 question to continue.</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" icon={ChevronLeft} onClick={() => setStep(1)}>
                Back to Configuration
              </Button>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button
                  variant="outline"
                  onClick={handleSaveToQuestionBank}
                  loading={savingToBank}
                  disabled={approvedCount === 0}
                  className="text-xs"
                >
                  Save to Question Bank
                </Button>
                <Button variant="outline" icon={Save} onClick={() => handleFinalSave('draft')}>
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  icon={ChevronRight}
                  onClick={handleProceedToMode}
                  disabled={approvedCount === 0}
                >
                  Add Selected Questions to Assessment ({approvedCount})
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

            {/* Live Saving Progress Banner */}
            {loading && progressStatus && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/90 rounded-2xl flex items-center gap-3.5 shadow-2xs">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-blue-950 flex items-center gap-2">
                      <Save className="w-3.5 h-3.5 text-blue-600" />
                      {progressStatus}
                    </span>
                    <span className="text-[11px] font-black text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200/70 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
                    />
                  </div>
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
