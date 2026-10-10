import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import { OFFICIAL_DEPARTMENTS } from '../../constants/departments';
import {
  Sparkles,
  FileUp,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Layers,
  Building2,
  Check,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit2,
  RotateCcw,
  Plus,
  Loader2,
  FileText,
  ShieldCheck,
  Eye,
  Search,
  Filter,
  Users,
  Compass
} from 'lucide-react';

const DEPARTMENT_PROMPTS = {
  CSE: 'Data Structures & Algorithms, Object-Oriented Programming, Operating Systems, Database Management Systems (SQL), and Computer Networks.',
  IT: 'Web Technologies (Full-Stack), Cloud Architectures, Database Design, Network Security, and DevOps fundamentals.',
  EXTC: 'Digital Electronics, Microprocessors & Microcontrollers, Embedded Systems, Signals & Systems, and Analog/Digital Communications.',
  Mechanical: 'Thermodynamics, Fluid Mechanics, Strength of Materials, Theory of Machines, and Manufacturing Technology.',
  Civil: 'Structural Analysis, Geotechnical & Foundation Engineering, Concrete Technology, Surveying, and Fluid Mechanics.',
  'CSE (IoT)': 'IoT Architectures, Wireless Sensor Networks, Embedded C, Sensors/Actuators Interfacing, and Edge Computing.',
  AIDS: 'Machine Learning Algorithms, Deep Learning Fundamentals, Python for Data Science, Statistics & Probability, and SQL.',
  MCA: 'Java Programming & OOP, Relational Databases & SQL, Data Structures & Algorithms, and Full-Stack Web Development.',
  MBA: 'Financial Management, Marketing Strategy, Human Resource Principles, Operations & Supply Chain, and Business Analytics.'
};

const DURATION_OPTIONS = [
  { value: '30', label: '30 Minutes' },
  { value: '45', label: '45 Minutes' },
  { value: '60', label: '60 Minutes (1 Hour)' },
  { value: '90', label: '90 Minutes (1.5 Hours)' },
  { value: '120', label: '120 Minutes (2 Hours)' },
  { value: '150', label: '150 Minutes (2.5 Hours)' },
  { value: '180', label: '180 Minutes (3 Hours)' }
];

export const FullAssessmentCreateModal = ({
  isOpen,
  onClose,
  onSuccess,
  assessmentToEdit = null
}) => {
  // Step Management: 1 = Configuration & Creation, 2 = Question Review, 3 = Summary & Publish
  const [step, setStep] = useState(1);

  // 1. Basic Information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [instructions, setInstructions] = useState(
    '1. This is a comprehensive Full Assessment consisting of Aptitude and Domain Knowledge sections.\n' +
    '2. The Aptitude section (Quantitative, Logical Reasoning, Verbal Ability) is common for all candidates.\n' +
    '3. The Domain Knowledge section is specifically customized to your academic department.\n' +
    '4. All questions are Multiple Choice Questions (MCQs) carrying 1 mark each.\n' +
    '5. There is no negative marking unless specifically announced.\n' +
    '6. Manage your time effectively and ensure test submission before the timer runs out.'
  );
  const [status, setStatus] = useState('published'); // 'published' | 'draft'
  const [passingScorePercentage, setPassingScorePercentage] = useState(70);

  // 2. Aptitude Configuration (Question Counts)
  const [quantCount, setQuantCount] = useState(10);
  const [logicalCount, setLogicalCount] = useState(10);
  const [verbalCount, setVerbalCount] = useState(10);

  // 3. Domain Knowledge Configuration
  const [deptSelectionMode, setDeptSelectionMode] = useState('ALL'); // 'ALL' | 'SELECT'
  const [selectedDepartments, setSelectedDepartments] = useState([...OFFICIAL_DEPARTMENTS]);
  const [deptDefaultCount, setDeptDefaultCount] = useState(15);
  const [deptCustomCounts, setDeptCustomCounts] = useState({});

  // 4. Question Creation Settings
  const [creationTab, setCreationTab] = useState('AI'); // 'AI' | 'PDF'
  const [difficulty, setDifficulty] = useState('Medium');
  const [aiFocusNotes, setAiFocusNotes] = useState('');

  // PDF Extraction File Upload
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');

  // Questions Review & Store
  const [questions, setQuestions] = useState([]);
  const [activeReviewSection, setActiveReviewSection] = useState('ALL');
  const [searchReviewQuery, setSearchReviewQuery] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Manual Question Addition
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    section: 'Quantitative Ability',
    department: null,
    questionText: '',
    codeSnippet: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'Medium'
  });

  // State flags & Progress
  const [loading, setLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [regeneratingIdx, setRegeneratingIdx] = useState(null);

  // Reset or pre-fill on open
  useEffect(() => {
    if (isOpen) {
      if (assessmentToEdit) {
        setTitle(assessmentToEdit.title || '');
        setDescription(assessmentToEdit.description || '');
        setDurationMinutes(assessmentToEdit.timeLimitMinutes || 90);
        setInstructions(assessmentToEdit.instructions || '');
        setStatus(assessmentToEdit.status || 'published');
        setPassingScorePercentage(assessmentToEdit.passingScorePercentage || 70);
        setQuestions(assessmentToEdit.questions || []);

        const conf = assessmentToEdit.sectionsConfig;
        if (conf) {
          if (conf.aptitude) {
            setQuantCount(conf.aptitude.quantitative || 10);
            setLogicalCount(conf.aptitude.logical || 10);
            setVerbalCount(conf.aptitude.verbal || 10);
          }
          if (conf.domain) {
            setDeptSelectionMode(conf.domain.allDepartments ? 'ALL' : 'SELECT');
            setSelectedDepartments(conf.domain.selectedDepartments || [...OFFICIAL_DEPARTMENTS]);
            if (conf.domain.departmentQuestionCounts) {
              setDeptCustomCounts(conf.domain.departmentQuestionCounts);
            }
          }
        }
        setStep(assessmentToEdit.questions?.length ? 2 : 1);
      } else {
        setStep(1);
        setTitle('');
        setDescription('');
        setDurationMinutes(90);
        setStatus('published');
        setPassingScorePercentage(70);
        setQuantCount(10);
        setLogicalCount(10);
        setVerbalCount(10);
        setDeptSelectionMode('ALL');
        setSelectedDepartments([...OFFICIAL_DEPARTMENTS]);
        setDeptDefaultCount(15);
        setDeptCustomCounts({});
        setDifficulty('Medium');
        setAiFocusNotes('');
        setPdfFile(null);
        setPdfFileName('');
        setQuestions([]);
        setErrorMsg('');
        setProgressStatus('');
        setProgressPercent(0);
      }
    }
  }, [isOpen, assessmentToEdit]);

  // Handle department toggles
  const handleToggleDepartment = (dept) => {
    if (selectedDepartments.includes(dept)) {
      if (selectedDepartments.length <= 1) {
        setErrorMsg('At least one department must be selected.');
        return;
      }
      setSelectedDepartments(selectedDepartments.filter((d) => d !== dept));
    } else {
      setSelectedDepartments([...selectedDepartments, dept]);
    }
    setErrorMsg('');
  };

  const handleSelectAllDepartments = () => {
    setDeptSelectionMode('ALL');
    setSelectedDepartments([...OFFICIAL_DEPARTMENTS]);
  };

  const handleCustomDeptSelectMode = () => {
    setDeptSelectionMode('SELECT');
  };

  const getDeptCount = (dept) => {
    if (deptCustomCounts[dept] !== undefined && deptCustomCounts[dept] !== '') {
      return parseInt(deptCustomCounts[dept], 10) || 0;
    }
    return parseInt(deptDefaultCount, 10) || 15;
  };

  const setDeptCount = (dept, count) => {
    setDeptCustomCounts((prev) => ({
      ...prev,
      [dept]: count
    }));
  };

  // Calculations
  const totalAptitudeQuestions = (parseInt(quantCount, 10) || 0) + (parseInt(logicalCount, 10) || 0) + (parseInt(verbalCount, 10) || 0);

  const totalDomainQuestionsInAssessment = useMemo(() => {
    return selectedDepartments.reduce((acc, dept) => acc + getDeptCount(dept), 0);
  }, [selectedDepartments, deptDefaultCount, deptCustomCounts]);

  const studentDomainCount = useMemo(() => {
    if (selectedDepartments.length === 0) return 0;
    return getDeptCount(selectedDepartments[0]);
  }, [selectedDepartments, deptDefaultCount, deptCustomCounts]);

  const studentTotalQuestions = totalAptitudeQuestions + studentDomainCount;

  // Handle PDF upload
  const handlePdfFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a valid .pdf document.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('PDF file exceeds 25MB limit.');
      return;
    }
    setPdfFile(file);
    setPdfFileName(file.name);
    setErrorMsg('');
  };

  // Helper to generate a single section via AI
  const generateSectionQuestionsAI = async ({ sectionName, department = null, categoryName, targetCount, syllabusPrompt }) => {
    const totalTarget = Math.max(1, parseInt(targetCount, 10) || 5);
    const collected = [];

    const effectiveTopic = syllabusPrompt
      ? `${sectionName}: ${syllabusPrompt.slice(0, 80)}`
      : `${sectionName} Questions`;

    const res = await api.generateQuestionsForReview({
      provider: 'gemini',
      module: department ? 'Domain' : 'Aptitude',
      category: categoryName,
      department: department || null,
      topic: effectiveTopic,
      prompt: syllabusPrompt || `${sectionName} placement questions`,
      customPrompt: syllabusPrompt || `${sectionName} comprehensive test questions`,
      difficulty,
      questionCount: totalTarget,
      existingQuestions: []
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
        if (!opts.includes(corr)) opts[0] = corr;

        collected.push({
          id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          section: sectionName,
          department: department || null,
          category: categoryName,
          questionText: q.questionText,
          codeSnippet: q.codeSnippet || '',
          options: opts,
          correctAnswer: corr,
          explanation: q.explanation || '',
          difficulty: q.difficulty || difficulty,
          status: 'APPROVED',
          marks: 1
        });
      }
    }

    return collected;
  };

  // Trigger Full AI Generation across Aptitude and all selected Departments
  const handleRunFullAIGeneration = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter an Assessment Name.');
      return;
    }
    if (totalAptitudeQuestions <= 0) {
      setErrorMsg('Please configure at least 1 question in the Aptitude section.');
      return;
    }
    if (selectedDepartments.length === 0) {
      setErrorMsg('Please select at least one department for Domain Knowledge.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setProgressPercent(5);
    setProgressStatus('Initializing AI test architect with Google Gemini...');

    try {
      const generatedList = [];
      const tasks = [];

      // Task 1: Quantitative
      if (quantCount > 0) {
        tasks.push({
          type: 'APTITUDE',
          section: 'Quantitative Ability',
          category: 'Quantitative',
          department: null,
          count: parseInt(quantCount, 10),
          prompt: `Quantitative Aptitude (Time & Work, Speed Distance, Percentage, Profit Loss, Ratio, Averages, Number System). ${aiFocusNotes}`
        });
      }

      // Task 2: Logical Reasoning
      if (logicalCount > 0) {
        tasks.push({
          type: 'APTITUDE',
          section: 'Logical Reasoning',
          category: 'Reasoning',
          department: null,
          count: parseInt(logicalCount, 10),
          prompt: `Logical Reasoning (Number & Letter Series, Syllogisms, Blood Relations, Direction Sense, Coding-Decoding, Seating Arrangement). ${aiFocusNotes}`
        });
      }

      // Task 3: Verbal Ability
      if (verbalCount > 0) {
        tasks.push({
          type: 'APTITUDE',
          section: 'Verbal Ability',
          category: 'Verbal',
          department: null,
          count: parseInt(verbalCount, 10),
          prompt: `Verbal Ability (Reading Comprehension, Sentence Correction, Synonyms & Antonyms, Spotting Errors, Vocabulary). ${aiFocusNotes}`
        });
      }

      // Tasks for each selected department
      for (const dept of selectedDepartments) {
        const dCount = getDeptCount(dept);
        if (dCount > 0) {
          tasks.push({
            type: 'DOMAIN',
            section: 'Domain Knowledge',
            category: dept,
            department: dept,
            count: dCount,
            prompt: `Core technical interview and campus placement questions for ${dept} department. Key topics: ${DEPARTMENT_PROMPTS[dept] || dept}. ${aiFocusNotes}`
          });
        }
      }

      const totalTasks = tasks.length;
      for (let i = 0; i < totalTasks; i++) {
        const t = tasks[i];
        const label = t.department ? `Domain (${t.department})` : t.section;
        setProgressStatus(`[${i + 1}/${totalTasks}] Generating ${label} (${t.count} questions)...`);
        setProgressPercent(Math.round(((i) / totalTasks) * 90) + 5);

        const chunk = await generateSectionQuestionsAI({
          sectionName: t.section,
          department: t.department,
          categoryName: t.category,
          targetCount: t.count,
          syllabusPrompt: t.prompt
        });

        if (chunk.length > 0) {
          generatedList.push(...chunk);
        }
      }

      setProgressPercent(100);
      setProgressStatus('Questions generated successfully!');
      await new Promise((r) => setTimeout(r, 400));

      if (generatedList.length === 0) {
        setErrorMsg('Failed to generate questions. Please verify Gemini configuration or try again.');
        return;
      }

      setQuestions(generatedList);
      setStep(2);
    } catch (err) {
      console.error('Full assessment generation error:', err);
      setErrorMsg(err.message || 'Error occurred while generating assessment questions.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger PDF Extraction for targeted section
  const handleExtractFromPdf = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter an Assessment Name first.');
      return;
    }
    if (!pdfFile) {
      setErrorMsg('Please select a PDF file containing questions.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setProgressStatus(`Extracting questions from ${pdfFileName}...`);
    setProgressPercent(40);

    try {
      const formData = new FormData();
      formData.append('pdfFile', pdfFile);
      formData.append('category', 'Full Assessment');
      formData.append('topic', title.trim() || 'Comprehensive Assessment');
      formData.append('difficulty', difficulty);
      formData.append('questionCount', 'all');

      const res = await api.extractPdfQuestions(formData);

      if (res.success && Array.isArray(res.questions) && res.questions.length > 0) {
        const formatted = res.questions.map((q, idx) => {
          const text = `${q.questionText || ''} ${q.category || ''} ${q.topic || ''}`.toLowerCase();
          let sectionName = 'Quantitative Ability';
          let department = null;

          if (text.includes('quantitative') || text.includes('math') || text.includes('arithmetic') || text.includes('percentage') || text.includes('ratio')) {
            sectionName = 'Quantitative Ability';
          } else if (text.includes('logical') || text.includes('reasoning') || text.includes('syllogism') || text.includes('series') || text.includes('blood relation')) {
            sectionName = 'Logical Reasoning';
          } else if (text.includes('verbal') || text.includes('grammar') || text.includes('synonym') || text.includes('antonym') || text.includes('sentence')) {
            sectionName = 'Verbal Ability';
          } else {
            // Check if matches any selected department
            for (const d of selectedDepartments) {
              if (text.includes(d.toLowerCase())) {
                sectionName = 'Domain Knowledge';
                department = d;
                break;
              }
            }
            if (!department) {
              // Distribute logically across sections if not explicitly detected
              const qCap = parseInt(quantCount, 10) || 10;
              const lCap = parseInt(logicalCount, 10) || 10;
              const vCap = parseInt(verbalCount, 10) || 10;
              if (idx < qCap) {
                sectionName = 'Quantitative Ability';
              } else if (idx < qCap + lCap) {
                sectionName = 'Logical Reasoning';
              } else if (idx < qCap + lCap + vCap) {
                sectionName = 'Verbal Ability';
              } else {
                sectionName = 'Domain Knowledge';
                department = selectedDepartments[0] || 'CSE';
              }
            }
          }

          return {
            id: `pdf-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            section: sectionName,
            department,
            category: department || sectionName,
            questionText: q.questionText || '',
            codeSnippet: q.codeSnippet || '',
            passage: q.passage || '',
            passageTitle: q.passageTitle || '',
            imageUrl: q.imageUrl || '',
            tableData: q.tableData || '',
            questionNumber: q.questionNumber || idx + 1,
            pageNumber: q.pageNumber || 1,
            warnings: q.warnings || [],
            confidence: q.confidence || 'HIGH',
            options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: q.correctAnswer || q.options?.[0] || 'Option A',
            explanation: q.explanation || '',
            difficulty: q.difficulty || difficulty,
            status: 'APPROVED',
            marks: 1
          };
        });

        setQuestions((prev) => [...prev, ...formatted]);
        setPdfFile(null);
        setPdfFileName('');
        setProgressPercent(100);
        setProgressStatus(`Extracted ${formatted.length} questions successfully!`);
        await new Promise((r) => setTimeout(r, 400));
        setStep(2);
      } else {
        setErrorMsg(res.message || 'No questions could be extracted from this PDF. Please verify PDF contains numbered multiple-choice questions.');
      }
    } catch (err) {
      console.error('PDF extraction error:', err);
      setErrorMsg(err.message || 'Failed to extract questions from PDF.');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate a single question via AI
  const handleRegenerateSingle = async (idx) => {
    const targetQ = questions[idx];
    if (!targetQ) return;
    setRegeneratingIdx(idx);
    setErrorMsg('');

    try {
      const res = await api.generateQuestionsForReview({
        provider: 'gemini',
        module: targetQ.department ? 'Domain' : 'Aptitude',
        category: targetQ.category || (targetQ.department ? targetQ.department : 'Quantitative'),
        department: targetQ.department || null,
        topic: targetQ.section,
        prompt: `Generate 1 fresh, distinct question for ${targetQ.section} (${targetQ.department || targetQ.category}).`,
        difficulty: targetQ.difficulty || 'Medium',
        questionCount: 1,
        existingQuestions: questions.map((q) => q.questionText)
      });

      if (res.success && res.questions && res.questions[0]) {
        const fresh = res.questions[0];
        let opts = Array.isArray(fresh.options) && fresh.options.length >= 4
          ? fresh.options.slice(0, 4)
          : ['Option A', 'Option B', 'Option C', 'Option D'];
        let corr = fresh.correctAnswer || opts[0];
        if (!opts.includes(corr)) opts[0] = corr;

        setQuestions((prev) =>
          prev.map((item, i) =>
            i === idx
              ? {
                  ...item,
                  questionText: fresh.questionText,
                  codeSnippet: fresh.codeSnippet || '',
                  options: opts,
                  correctAnswer: corr,
                  explanation: fresh.explanation || '',
                  difficulty: fresh.difficulty || item.difficulty
                }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Regenerate single question error:', err);
    } finally {
      setRegeneratingIdx(null);
    }
  };

  // Delete question
  const handleDeleteQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Toggle question status (APPROVED / EXCLUDED)
  const handleToggleStatus = (idx) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === idx ? { ...q, status: q.status === 'APPROVED' ? 'EXCLUDED' : 'APPROVED' } : q
      )
    );
  };

  // Save inline edit
  const handleSaveEdit = (editedQ) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === editingQuestion.index ? { ...editedQ, id: q.id } : q))
    );
    setEditingQuestion(null);
  };

  // Add manual question
  const handleSaveManualQuestion = (e) => {
    e.preventDefault();
    if (!manualForm.questionText.trim()) return;

    const newQ = {
      id: `manual-${Date.now()}`,
      section: manualForm.section,
      department: manualForm.section === 'Domain Knowledge' ? manualForm.department || 'CSE' : null,
      category: manualForm.section === 'Domain Knowledge' ? manualForm.department || 'CSE' : manualForm.section,
      questionText: manualForm.questionText.trim(),
      codeSnippet: manualForm.codeSnippet.trim(),
      options: manualForm.options.map((o, idx) => o.trim() || `Option ${String.fromCharCode(65 + idx)}`),
      correctAnswer: manualForm.correctAnswer.trim() || manualForm.options[0].trim(),
      explanation: manualForm.explanation.trim(),
      difficulty: manualForm.difficulty,
      status: 'APPROVED',
      marks: 1
    };

    setQuestions((prev) => [newQ, ...prev]);
    setIsAddQuestionModalOpen(false);
    setManualForm({
      section: 'Quantitative Ability',
      department: null,
      questionText: '',
      codeSnippet: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      difficulty: 'Medium'
    });
  };

  // Save / Publish Full Assessment
  const handleSaveAssessment = async (saveStatus) => {
    if (!title.trim()) {
      setErrorMsg('Please provide an Assessment Name.');
      setStep(1);
      return;
    }

    const approvedQuestions = questions.filter((q) => q.status !== 'EXCLUDED');
    if (approvedQuestions.length === 0) {
      setErrorMsg('Assessment must contain at least 1 approved question.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        module: 'Full Assessment',
        category: 'Comprehensive',
        department: null,
        topic: 'Aptitude & Domain Knowledge',
        difficulty,
        timeLimitMinutes: parseInt(durationMinutes, 10) || 90,
        passingScorePercentage: parseInt(passingScorePercentage, 10) || 70,
        status: saveStatus || status,
        creationMethod: creationTab === 'PDF' ? 'PDF_EXTRACTION' : 'AI_GENERATED',
        isAIGenerated: creationTab !== 'PDF',
        sectionsConfig: {
          aptitude: {
            quantitative: parseInt(quantCount, 10) || 0,
            logical: parseInt(logicalCount, 10) || 0,
            verbal: parseInt(verbalCount, 10) || 0
          },
          domain: {
            allDepartments: deptSelectionMode === 'ALL',
            selectedDepartments,
            departmentQuestionCounts: selectedDepartments.reduce((acc, dept) => {
              acc[dept] = getDeptCount(dept);
              return acc;
            }, {})
          }
        },
        questions: approvedQuestions.map((q) => ({
          questionText: q.questionText,
          codeSnippet: q.codeSnippet || '',
          section: q.section,
          department: q.department || null,
          category: q.category || '',
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          marks: q.marks || 1,
          difficulty: q.difficulty || 'Medium',
          type: 'mcq'
        }))
      };

      let res;
      if (assessmentToEdit && assessmentToEdit._id) {
        res = await api.updateAssessment(assessmentToEdit._id, payload);
      } else {
        res = await api.createAssessment(payload);
      }

      if (res.success && res.assessment) {
        if (onSuccess) {
          onSuccess(res.assessment, saveStatus || status);
        }
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to save Full Assessment.');
      }
    } catch (err) {
      console.error('Error saving full assessment:', err);
      setErrorMsg(err.message || 'Failed to save Full Assessment.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered review questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Section filter
      if (activeReviewSection !== 'ALL') {
        if (activeReviewSection === 'QUANT' && q.section !== 'Quantitative Ability') return false;
        if (activeReviewSection === 'LOGICAL' && q.section !== 'Logical Reasoning') return false;
        if (activeReviewSection === 'VERBAL' && q.section !== 'Verbal Ability') return false;
        if (activeReviewSection.startsWith('DEPT:')) {
          const dept = activeReviewSection.replace('DEPT:', '');
          if (q.department !== dept) return false;
        }
      }

      // Query filter
      if (searchReviewQuery.trim()) {
        const needle = searchReviewQuery.toLowerCase();
        const textMatch = q.questionText.toLowerCase().includes(needle);
        const optMatch = q.options?.some((o) => o.toLowerCase().includes(needle));
        if (!textMatch && !optMatch) return false;
      }

      return true;
    });
  }, [questions, activeReviewSection, searchReviewQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900/5 via-indigo-900/5 to-purple-900/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  New Assessment Architecture
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Department-Aware
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                {assessmentToEdit ? 'Edit Full Assessment' : 'Create Full Assessment'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Step Indicators */}
            <div className="hidden sm:flex items-center gap-1.5 mr-4 text-xs font-bold">
              <span className={`px-2.5 py-1 rounded-lg ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                1. Configure
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={`px-2.5 py-1 rounded-lg ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                2. Review ({questions.length})
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={`px-2.5 py-1 rounded-lg ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                3. Finalize
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
          {/* Global Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2.5 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Loading Progress State */}
          {loading && (
            <div className="p-6 bg-white border border-blue-100 rounded-3xl shadow-sm text-center space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{progressStatus || 'Processing...'}</h4>
                <p className="text-xs text-slate-500 mt-1">Please keep this window open while questions are being processed.</p>
              </div>
              <div className="w-full max-w-md mx-auto bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: CONFIGURATION & CREATION */}
          {/* ========================================================================= */}
          {!loading && step === 1 && (
            <div className="space-y-6">
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">1</span>
                    <h3 className="text-sm font-bold text-slate-900">Basic Information</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">Test Details & Candidate Instructions</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Assessment Name *</label>
                    <Input
                      placeholder="e.g. Campus Placement Drive 2026 — Comprehensive Evaluation"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Duration (Minutes) *</label>
                      <Select
                        options={DURATION_OPTIONS.map((o) => `${o.value} mins`)}
                        value={`${durationMinutes} mins`}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Assessment Status</label>
                      <Select
                        options={['published', 'draft']}
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Short Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of this assessment evaluation for students..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition custom-scrollbar"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Test Instructions (Visible on student instructions screen)</label>
                  <textarea
                    rows={4}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition custom-scrollbar leading-relaxed font-mono"
                  />
                </div>
              </div>

              {/* SECTION 2: APTITUDE */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">2</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Aptitude Section</h3>
                      <p className="text-[11px] text-slate-500">Common questions given to all students across every department</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Aptitude</span>
                    <span className="text-sm font-black text-blue-600">{totalAptitudeQuestions} Questions</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Quantitative Ability */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Quantitative Ability</span>
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Quant</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Arithmetic, Percentages, Profit & Loss, Time & Work, Speed, Ratio.
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={quantCount}
                        onChange={(e) => setQuantCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-20 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-center"
                      />
                      <span className="text-xs text-slate-500 font-semibold">questions</span>
                    </div>
                  </div>

                  {/* Logical Reasoning */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Logical Reasoning</span>
                      <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Logic</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Series, Blood Relations, Syllogisms, Coding, Direction Sense.
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={logicalCount}
                        onChange={(e) => setLogicalCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-20 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-center"
                      />
                      <span className="text-xs text-slate-500 font-semibold">questions</span>
                    </div>
                  </div>

                  {/* Verbal Ability */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Verbal Ability</span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Verbal</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Comprehension, Grammar, Spotting Errors, Synonyms/Antonyms.
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={verbalCount}
                        onChange={(e) => setVerbalCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-20 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-center"
                      />
                      <span className="text-xs text-slate-500 font-semibold">questions</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DOMAIN KNOWLEDGE */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">3</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Domain Knowledge Section</h3>
                      <p className="text-[11px] text-slate-500">Department-specific questions shown according to student's academic branch</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Depts</span>
                    <span className="text-sm font-black text-indigo-600">
                      {selectedDepartments.length} of {OFFICIAL_DEPARTMENTS.length} Depts
                    </span>
                  </div>
                </div>

                {/* Department Selection Mode Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Department Scope:</span>
                    <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={handleSelectAllDepartments}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          deptSelectionMode === 'ALL'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All Departments ({OFFICIAL_DEPARTMENTS.length})
                      </button>
                      <button
                        type="button"
                        onClick={handleCustomDeptSelectMode}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          deptSelectionMode === 'SELECT'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Select Departments
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Default questions per dept:</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={deptDefaultCount}
                      onChange={(e) => setDeptDefaultCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg text-center focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                </div>

                {/* 9 Official Departments Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {OFFICIAL_DEPARTMENTS.map((dept) => {
                    const isSelected = selectedDepartments.includes(dept);
                    const qCount = getDeptCount(dept);

                    return (
                      <div
                        key={dept}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-blue-50/40 border-blue-200/90 shadow-2xs'
                            : 'bg-slate-50/40 border-slate-200/70 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleDepartment(dept)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 rounded-md transition"
                            />
                            <span className="font-extrabold text-xs text-slate-900">{dept}</span>
                          </label>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              disabled={!isSelected}
                              value={qCount}
                              onChange={(e) => setDeptCount(dept, e.target.value)}
                              className="w-14 px-1.5 py-0.5 text-xs font-bold text-center bg-white border border-slate-200 rounded-md focus:border-blue-600 outline-none disabled:bg-slate-100"
                            />
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-2 pl-6">
                          {DEPARTMENT_PROMPTS[dept]}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Info Banner */}
                <div className="bg-indigo-50/60 border border-indigo-200/60 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-900">
                  <div className="flex items-center gap-2 font-medium">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      <strong>Department-Aware Mechanism:</strong> Each candidate will receive their department's specific questions ({studentDomainCount} questions) plus common Aptitude ({totalAptitudeQuestions} questions).
                    </span>
                  </div>
                  <span className="font-black whitespace-nowrap text-indigo-700 bg-white px-3 py-1 rounded-xl border border-indigo-200/80 shadow-2xs self-start sm:self-auto">
                    Candidate Test: {studentTotalQuestions} Questions
                  </span>
                </div>
              </div>

              {/* SECTION 4: QUESTION CREATION METHOD */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">4</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Question Creation Channel</h3>
                      <p className="text-[11px] text-slate-500">Generate through Google Gemini AI or extract directly from PDF question paper</p>
                    </div>
                  </div>

                  {/* Channel Switch */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setCreationTab('AI')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                        creationTab === 'AI'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Generator
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreationTab('PDF')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                        creationTab === 'PDF'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      PDF Extraction
                    </button>
                  </div>
                </div>

                {/* AI Generation Form */}
                {creationTab === 'AI' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Target Difficulty</label>
                        <Select
                          options={['Easy', 'Medium', 'Hard', 'Mixed']}
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">AI Provider</label>
                        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          Google Gemini (Multi-Section Orchestration)
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Custom Focus Notes / Test Syllabus (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Include questions on modern DSA, cloud architectures, and financial modeling for MBA..."
                        value={aiFocusNotes}
                        onChange={(e) => setAiFocusNotes(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition custom-scrollbar"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">
                          Automated Generation Pipeline Ready
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Will generate {totalAptitudeQuestions} Aptitude questions + {totalDomainQuestionsInAssessment} Domain questions across {selectedDepartments.length} departments.
                        </p>
                      </div>

                      <Button
                        type="button"
                        icon={Sparkles}
                        variant="primary"
                        onClick={handleRunFullAIGeneration}
                        className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 font-bold self-start sm:self-auto shrink-0"
                      >
                        Generate All Sections with AI
                      </Button>
                    </div>
                  </div>
                )}

                {/* PDF Extraction Form */}
                {creationTab === 'PDF' && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-blue-50/60 border border-blue-200/70 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          <strong>Native PDF Extraction:</strong> Upload your assessment question paper. All questions and options will be extracted while preserving original question content.
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shrink-0">
                        Zero Content Alteration
                      </span>
                    </div>

                    {/* Upload Dropzone */}
                    <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-6 text-center transition bg-slate-50/50">
                      <input
                        type="file"
                        id="full-assessment-pdf-upload"
                        accept="application/pdf"
                        onChange={handlePdfFileSelect}
                        className="hidden"
                      />
                      <label htmlFor="full-assessment-pdf-upload" className="cursor-pointer block space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                          <FileUp className="w-6 h-6" />
                        </div>
                        {pdfFileName ? (
                          <div>
                            <span className="text-xs font-extrabold text-blue-600">{pdfFileName}</span>
                            <p className="text-[11px] text-slate-400 mt-0.5">Click to change file</p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-extrabold text-slate-800">
                              Upload Question Paper PDF
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Extracts numbered multiple choice questions and 4 options preserving exact formatting
                            </p>
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        icon={FileUp}
                        variant="primary"
                        disabled={!pdfFile}
                        onClick={handleExtractFromPdf}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-sm font-bold"
                      >
                        Extract Questions from PDF
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: QUESTION REVIEW & MANAGEMENT */}
          {/* ========================================================================= */}
          {!loading && step === 2 && (
            <div className="space-y-4">
              {/* Review Filter Bar */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => setActiveReviewSection('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        activeReviewSection === 'ALL'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({questions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReviewSection('QUANT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        activeReviewSection === 'QUANT'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Quantitative ({questions.filter((q) => q.section === 'Quantitative Ability').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReviewSection('LOGICAL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        activeReviewSection === 'LOGICAL'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Logical ({questions.filter((q) => q.section === 'Logical Reasoning').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReviewSection('VERBAL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        activeReviewSection === 'VERBAL'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Verbal ({questions.filter((q) => q.section === 'Verbal Ability').length})
                    </button>

                    {selectedDepartments.map((dept) => {
                      const deptQCount = questions.filter((q) => q.department === dept).length;
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setActiveReviewSection(`DEPT:${dept}`)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            activeReviewSection === `DEPT:${dept}`
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {dept} ({deptQCount})
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    icon={Plus}
                    onClick={() => setIsAddQuestionModalOpen(true)}
                    className="text-xs shrink-0 font-bold"
                  >
                    Add Question Manually
                  </Button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search question text or options..."
                    value={searchReviewQuery}
                    onChange={(e) => setSearchReviewQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((q, idx) => {
                    const originalIndex = questions.findIndex((item) => item.id === q.id);
                    const isExcluded = q.status === 'EXCLUDED';

                    return (
                      <div
                        key={q.id || idx}
                        className={`bg-white rounded-2xl border p-4.5 transition-all shadow-2xs ${
                          isExcluded
                            ? 'border-slate-200 opacity-60 bg-slate-50'
                            : 'border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                #{originalIndex + 1}
                              </span>

                              {q.pageNumber && (
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  Page {q.pageNumber}
                                </span>
                              )}

                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                                {q.section}
                              </span>

                              {q.department ? (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  Domain: {q.department}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                                  Common Aptitude
                                </span>
                              )}

                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {q.difficulty || 'Medium'}
                              </span>

                              {q.confidence === 'REVIEW_REQUIRED' && (
                                <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Needs Review
                                </span>
                              )}

                              {isExcluded && (
                                <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  Excluded from Test
                                </span>
                              )}
                            </div>

                            {/* Shared Passage / Case Study Context */}
                            {q.passage && (
                              <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl text-xs space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                                  📖 {q.passageTitle || 'Shared Context / Directions'}
                                </span>
                                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-[11px] font-medium max-h-36 overflow-y-auto">
                                  {q.passage}
                                </p>
                              </div>
                            )}

                            <p className="text-xs font-bold text-slate-900 leading-snug">
                              {q.questionText}
                            </p>

                            {q.codeSnippet && (
                              <pre className="text-[11px] p-2.5 bg-slate-900 text-slate-100 rounded-xl font-mono overflow-x-auto">
                                {q.codeSnippet}
                              </pre>
                            )}

                            {Array.isArray(q.warnings) && q.warnings.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {q.warnings.map((w, wIdx) => (
                                  <span key={wIdx} className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                                    ⚠ {w}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* 4 Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {(q.options || []).map((opt, oIdx) => {
                                const isCorrect = opt.trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase();
                                return (
                                  <div
                                    key={oIdx}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                                      isCorrect
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                        : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 border border-current">
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <span className="truncate">{opt}</span>
                                    {isCorrect && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600 shrink-0" />}
                                  </div>
                                );
                              })}
                            </div>

                            {q.explanation && (
                              <p className="text-[11px] text-slate-500 italic pt-1">
                                <strong className="text-slate-700 not-italic">Explanation:</strong> {q.explanation}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(originalIndex)}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                                isExcluded
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={isExcluded ? 'Include question' : 'Exclude question'}
                            >
                              {isExcluded ? 'Include' : 'Exclude'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRegenerateSingle(originalIndex)}
                              disabled={regeneratingIdx === originalIndex}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Regenerate single question with AI"
                            >
                              <RotateCcw className={`w-4 h-4 ${regeneratingIdx === originalIndex ? 'animate-spin text-blue-600' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingQuestion({ ...q, index: originalIndex })}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit question"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(originalIndex)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                    <p className="text-xs text-slate-500">No questions found in this view filter.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: FINAL VERIFICATION & PUBLISH */}
          {/* ========================================================================= */}
          {!loading && step === 3 && (
            <div className="space-y-5">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Assessment Summary
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{title}</h3>
                  {description && <p className="text-xs text-slate-600 mt-1">{description}</p>}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Duration</span>
                    <span className="text-sm font-black text-blue-600 flex items-center justify-center gap-1 mt-0.5">
                      <Clock className="w-4 h-4" />
                      {durationMinutes} mins
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Pass Mark</span>
                    <span className="text-sm font-black text-emerald-600 flex items-center justify-center gap-1 mt-0.5">
                      <Award className="w-4 h-4" />
                      {passingScorePercentage}%
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Per-Student Test</span>
                    <span className="text-sm font-black text-indigo-600 flex items-center justify-center gap-1 mt-0.5">
                      <Users className="w-4 h-4" />
                      {studentTotalQuestions} Questions
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Questions in Bank</span>
                    <span className="text-sm font-black text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                      <Layers className="w-4 h-4" />
                      {questions.filter((q) => q.status !== 'EXCLUDED').length} Questions
                    </span>
                  </div>
                </div>

                {/* Breakdown Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="text-xs font-extrabold text-slate-900 block border-b border-slate-200/80 pb-1.5">
                      Aptitude Section (Common)
                    </span>
                    <ul className="text-xs space-y-1.5 text-slate-600">
                      <li className="flex justify-between">
                        <span>Quantitative Ability:</span>
                        <strong className="text-slate-900">
                          {questions.filter((q) => q.section === 'Quantitative Ability' && q.status !== 'EXCLUDED').length} questions
                        </strong>
                      </li>
                      <li className="flex justify-between">
                        <span>Logical Reasoning:</span>
                        <strong className="text-slate-900">
                          {questions.filter((q) => q.section === 'Logical Reasoning' && q.status !== 'EXCLUDED').length} questions
                        </strong>
                      </li>
                      <li className="flex justify-between">
                        <span>Verbal Ability:</span>
                        <strong className="text-slate-900">
                          {questions.filter((q) => q.section === 'Verbal Ability' && q.status !== 'EXCLUDED').length} questions
                        </strong>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="text-xs font-extrabold text-slate-900 block border-b border-slate-200/80 pb-1.5">
                      Domain Knowledge ({selectedDepartments.length} Departments)
                    </span>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1 text-xs text-slate-600 pr-1">
                      {selectedDepartments.map((dept) => {
                        const cnt = questions.filter((q) => q.department === dept && q.status !== 'EXCLUDED').length;
                        return (
                          <div key={dept} className="flex justify-between py-0.5">
                            <span className="font-semibold text-slate-700">{dept}:</span>
                            <strong className="text-slate-900">{cnt} questions</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Candidate Journey Notice */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-emerald-950">Department-Aware Candidate Experience</h5>
                    <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                      When students begin this assessment, the portal will automatically detect their branch (e.g. CSE or Mechanical) and deliver the common Aptitude questions along with their respective department questions. Students will not see other branches' questions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Navigation Controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              icon={ChevronLeft}
              onClick={() => setStep(step - 1)}
              className="text-xs font-bold"
            >
              Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-xs text-slate-500"
            >
              Cancel
            </Button>
          )}

          <div className="flex items-center gap-2">
            {step === 1 && (
              <Button
                type="button"
                variant="primary"
                icon={ChevronRight}
                onClick={() => {
                  if (!title.trim()) {
                    setErrorMsg('Please enter an Assessment Name.');
                    return;
                  }
                  if (questions.length > 0) {
                    setStep(2);
                  } else {
                    setErrorMsg('Please generate questions with AI or extract from PDF first.');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 font-bold"
              >
                Continue to Review
              </Button>
            )}

            {step === 2 && (
              <Button
                type="button"
                variant="primary"
                icon={ChevronRight}
                onClick={() => setStep(3)}
                className="bg-blue-600 hover:bg-blue-700 font-bold"
              >
                Proceed to Finalize
              </Button>
            )}

            {step === 3 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSaveAssessment('draft')}
                  loading={loading}
                  className="font-bold text-xs"
                >
                  Save as Draft
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={() => handleSaveAssessment('published')}
                  loading={loading}
                  className="bg-blue-600 hover:bg-blue-700 font-bold text-xs"
                >
                  Publish Assessment
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Inline Question Edit Modal */}
      {editingQuestion && (
        <Modal
          isOpen={Boolean(editingQuestion)}
          onClose={() => setEditingQuestion(null)}
          title={`Edit Question #${editingQuestion.index + 1}`}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Question Text *</label>
              <textarea
                rows={3}
                value={editingQuestion.questionText}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Code Snippet (Optional)</label>
              <textarea
                rows={2}
                value={editingQuestion.codeSnippet || ''}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, codeSnippet: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 font-mono focus:border-blue-600 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">4 Options (Select radio for correct answer) *</label>
              {(editingQuestion.options || []).map((opt, oIdx) => {
                const isCorrect = opt.trim() === editingQuestion.correctAnswer.trim();
                return (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct-answer-radio"
                      checked={isCorrect}
                      onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: opt })}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="w-6 text-xs font-bold text-slate-500">
                      ({String.fromCharCode(65 + oIdx)})
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...editingQuestion.options];
                        newOpts[oIdx] = e.target.value;
                        const newCorrect = isCorrect ? e.target.value : editingQuestion.correctAnswer;
                        setEditingQuestion({ ...editingQuestion, options: newOpts, correctAnswer: newCorrect });
                      }}
                      className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Explanation</label>
              <textarea
                rows={2}
                value={editingQuestion.explanation || ''}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditingQuestion(null)} className="text-xs">
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleSaveEdit(editingQuestion)} className="text-xs font-bold bg-blue-600">
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Question Creation Modal */}
      {isAddQuestionModalOpen && (
        <Modal
          isOpen={isAddQuestionModalOpen}
          onClose={() => setIsAddQuestionModalOpen(false)}
          title="Add Question to Full Assessment"
        >
          <form onSubmit={handleSaveManualQuestion} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Section *</label>
                <select
                  value={manualForm.section}
                  onChange={(e) => setManualForm({ ...manualForm, section: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="Quantitative Ability">Quantitative Ability</option>
                  <option value="Logical Reasoning">Logical Reasoning</option>
                  <option value="Verbal Ability">Verbal Ability</option>
                  <option value="Domain Knowledge">Domain Knowledge</option>
                </select>
              </div>

              {manualForm.section === 'Domain Knowledge' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Department *</label>
                  <select
                    value={manualForm.department || 'CSE'}
                    onChange={(e) => setManualForm({ ...manualForm, department: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  >
                    {OFFICIAL_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={manualForm.difficulty}
                    onChange={(e) => setManualForm({ ...manualForm, difficulty: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Question Text *</label>
              <textarea
                rows={3}
                required
                value={manualForm.questionText}
                onChange={(e) => setManualForm({ ...manualForm, questionText: e.target.value })}
                placeholder="Enter complete question statement..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Code Snippet (Optional)</label>
              <textarea
                rows={2}
                value={manualForm.codeSnippet}
                onChange={(e) => setManualForm({ ...manualForm, codeSnippet: e.target.value })}
                placeholder="Optional programming code snippet..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 font-mono focus:border-blue-600 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">4 Options (Select radio for correct answer) *</label>
              {manualForm.options.map((opt, oIdx) => {
                const isSelectedAnswer = opt && opt === manualForm.correctAnswer;
                return (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="manual-correct-radio"
                      checked={Boolean(isSelectedAnswer)}
                      onChange={() => setManualForm({ ...manualForm, correctAnswer: opt })}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="w-6 text-xs font-bold text-slate-500">
                      ({String.fromCharCode(65 + oIdx)})
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${String.fromCharCode(65 + oIdx)} text...`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...manualForm.options];
                        next[oIdx] = e.target.value;
                        const nextCorr = isSelectedAnswer ? e.target.value : manualForm.correctAnswer;
                        setManualForm({ ...manualForm, options: next, correctAnswer: nextCorr || next[0] });
                      }}
                      className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Explanation</label>
              <textarea
                rows={2}
                value={manualForm.explanation}
                onChange={(e) => setManualForm({ ...manualForm, explanation: e.target.value })}
                placeholder="Detailed rationale for the correct answer..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsAddQuestionModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="text-xs font-bold bg-blue-600">
                Add Question
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default FullAssessmentCreateModal;
