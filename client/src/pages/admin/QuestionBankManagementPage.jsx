import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Sparkles,
  Upload,
  AlertCircle,
  RefreshCw,
  Award,
  Layers,
  Building2,
  ChevronRight,
  ChevronDown,
  FileText,
  Check,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import {
  QUESTION_BANK_MODULES,
  MODULE_CATEGORIES,
  normalizeModuleName
} from '../../constants/trainingModules';
import { OFFICIAL_DEPARTMENTS } from '../../constants/departments';

// Custom Downward-Opening Select to guarantee the menu opens strictly downside (below the button)
const DownwardDropdownSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No matching options found'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Current selected option label
  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : (options[0]?.label || placeholder);

  // Filter options by search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [options, searchTerm]);

  return (
    <div className={`relative ${isOpen ? 'z-20' : 'z-10'}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSearchTerm('');
        }}
        className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border text-left flex items-center justify-between transition-all duration-150 cursor-pointer ${
          isOpen
            ? 'border-blue-500 bg-white dark:bg-slate-900 ring-2 ring-blue-500/20 shadow-xs'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500'
        }`}
      >
        <span className="truncate pr-2 text-slate-800 dark:text-slate-200">
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Downward Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search bar if list has more than 5 options */}
          {options.length > 5 && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options Scrollable Container */}
          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-slate-50 dark:divide-slate-800/60 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 text-center italic">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 font-medium'
                    }`}
                    title={opt.label}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MODULE_TABS = [
  { id: 'All', label: 'All Modules' },
  { id: 'Aptitude', label: 'Aptitude' },
  { id: 'Domain', label: 'Domain Knowledge' },
  { id: 'Communication', label: 'Communication' }
];

export const QuestionBankManagementPage = () => {
  // Navigation / Hierarchy State
  const [selectedModule, setSelectedModule] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('All');

  // Memoized options for Submodule / Domain Downward Dropdown
  const categoryOptions = useMemo(() => {
    const opts = [{ value: 'All', label: 'All Submodules / Categories' }];
    categories.forEach((c) => {
      const catId = typeof c === 'object' ? (c._id || c.id || c.name) : c;
      const catTitle = typeof c === 'object' ? (c.title || c.label || c.name || catId) : c;
      opts.push({
        value: String(catId),
        label: String(catTitle)
      });
    });
    return opts;
  }, [categories]);

  // Memoized options for Topic Downward Dropdown
  const topicOptions = useMemo(() => {
    const defaultLabel = `All Topics (${topics.length > 0 ? `${topics.length} topics` : 'None'})`;
    const opts = [{ value: 'All', label: defaultLabel }];
    topics.forEach((t) => {
      const topId = typeof t === 'object' ? (t._id || t.id) : t;
      const topTitle = typeof t === 'object' ? (t.title || t.name || topId) : t;
      const badge = t.category ? ` [${t.category}]` : (t.module ? ` [${t.module}]` : '');
      opts.push({
        value: String(topId),
        label: `${String(topTitle)}${badge}`
      });
    });
    return opts;
  }, [topics]);

  // Questions State
  const [questions, setQuestions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Feedback
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // PDF Import State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfExtracting, setPdfExtracting] = useState(false);
  const [pdfTargetModule, setPdfTargetModule] = useState('Aptitude');
  const [pdfTargetDept, setPdfTargetDept] = useState('All');
  const [pdfTargetCategory, setPdfTargetCategory] = useState('Quantitative Aptitude');
  const [pdfTargetTopicId, setPdfTargetTopicId] = useState('All');
  const [pdfTargetTopicTitle, setPdfTargetTopicTitle] = useState('Percentage');
  const [pdfAvailableTopics, setPdfAvailableTopics] = useState([]);
  const [extractedQuestions, setExtractedQuestions] = useState([]);

  // Batch Selection State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  // Manual Add Single Question State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalCategories, setModalCategories] = useState([]);
  const [modalTopics, setModalTopics] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    module: 'Communication',
    department: 'All',
    category: 'Grammar',
    categoryId: '',
    topic: '',
    topicId: '',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    difficulty: 'Medium',
    marks: 1,
    explanation: ''
  });

  // 1. Load Categories when Module or Dept changes
  // Handlers for Cascade Reset
  const handleModuleChange = (newMod) => {
    setSelectedModule(newMod);
    setSelectedDept('All');
    setSelectedCategoryId('All');
    setSelectedTopicId('All');
    setSelectedQuestionIds([]);
    setPage(1);
  };

  const handleDeptChange = (newDept) => {
    setSelectedDept(newDept);
    setSelectedCategoryId('All');
    setSelectedTopicId('All');
    setSelectedQuestionIds([]);
    setPage(1);
  };

  const handleCategoryChange = (newCat) => {
    setSelectedCategoryId(newCat);
    setSelectedTopicId('All');
    setSelectedQuestionIds([]);
    setPage(1);
  };

  const handleTopicChange = (newTop) => {
    setSelectedTopicId(newTop);
    setSelectedQuestionIds([]);
    setPage(1);
  };

  // 1. Load Categories when Module or Dept changes
  useEffect(() => {
    loadCategories(selectedModule, selectedDept);
  }, [selectedModule, selectedDept]);

  const loadCategories = async (mod, dept) => {
    try {
      if (!mod || mod === 'All') {
        const allCats = [];
        // Aptitude standard categories
        (MODULE_CATEGORIES.Aptitude || []).forEach(c => {
          allCats.push({ _id: c.id, title: `${c.label} (Aptitude)`, name: c.id, module: 'Aptitude' });
        });
        // Communication standard categories
        (MODULE_CATEGORIES.Communication || []).forEach(c => {
          allCats.push({ _id: c.id, title: `${c.label} (Communication)`, name: c.id, module: 'Communication' });
        });
        // Fetch domain categories from database
        try {
          const res = await api.getCategories({ module: 'Domain' });
          if (res?.categories) {
            res.categories.forEach(c => {
              allCats.push({
                _id: String(c._id),
                title: `${c.title} (Domain - ${c.department || 'General'})`,
                name: String(c.title),
                module: 'Domain'
              });
            });
          }
        } catch (_) {}

        setCategories(allCats);
        setSelectedCategoryId('All');
        return;
      }

      if (mod === 'Aptitude') {
        const rawCats = MODULE_CATEGORIES['Aptitude'] || [];
        const formatted = rawCats.map((c) => {
          const id = typeof c === 'object' ? (c.id || c.label) : c;
          const label = typeof c === 'object' ? (c.label || c.name || c.id) : c;
          return { _id: String(id), title: String(label), name: String(id) };
        });
        setCategories(formatted);
        setSelectedCategoryId('All');
      } else if (mod === 'Domain' || mod === 'Domain Knowledge') {
        const params = { module: 'Domain' };
        if (dept && dept !== 'All') {
          params.department = dept;
        }
        const res = await api.getCategories(params);
        const cats = res?.categories || [];
        const formatted = cats.map(c => ({
          _id: String(c._id),
          title: dept && dept !== 'All' ? String(c.title) : `${c.title} (${c.department || 'General'})`,
          name: String(c.title || c.name)
        }));
        setCategories(formatted);
        setSelectedCategoryId('All');
      } else {
        const res = await api.getCategories({ module: mod });
        const cats = res?.categories || [];
        if (cats.length > 0) {
          setCategories(cats.map(c => ({
            _id: String(c._id),
            title: String(c.title || c.name),
            name: String(c.title || c.name)
          })));
        } else {
          const fallbackCats = MODULE_CATEGORIES[mod] || [];
          setCategories(fallbackCats.map(c => ({
            _id: String(c.id || c.label),
            title: String(c.label || c.name || c.id),
            name: String(c.id || c.label)
          })));
        }
        setSelectedCategoryId('All');
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
      setSelectedCategoryId('All');
    }
  };

  // 2. Load Topics when Category, Module, or Department changes
  useEffect(() => {
    loadTopics(selectedModule, selectedCategoryId, selectedDept);
  }, [selectedCategoryId, selectedModule, selectedDept]);

  const loadTopics = async (mod, catId, dept) => {
    try {
      const params = {};
      if (mod && mod !== 'All') {
        params.module = mod === 'Domain Knowledge' ? 'Domain' : mod;
      }
      if (dept && dept !== 'All') {
        params.department = dept;
      }
      if (catId && catId !== 'All') {
        const matched = categories.find(c => String(c._id) === String(catId) || String(c.name) === String(catId));
        if (matched && /^[0-9a-fA-F]{24}$/.test(matched._id)) {
          params.categoryId = matched._id;
          params.category = matched.name || matched.title;
        } else if (/^[0-9a-fA-F]{24}$/.test(catId)) {
          params.categoryId = catId;
        } else {
          params.category = catId;
        }
      }

      const res = await api.getTopics(params);
      const topicList = res?.topics || [];
      setTopics(topicList);
      setSelectedTopicId('All');
    } catch (err) {
      console.error('Failed to load topics:', err);
      setTopics([]);
      setSelectedTopicId('All');
    }
  };

  // 3. Load Questions when Any Filter Changes (Module, Dept, Category, Topic, Difficulty, Search, Page)
  useEffect(() => {
    loadQuestions();
  }, [selectedModule, selectedDept, selectedCategoryId, selectedTopicId, difficultyFilter, searchQuery, page]);

  const loadQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const params = {
        page,
        limit
      };

      if (selectedModule && selectedModule !== 'All') {
        params.module = selectedModule;
      }
      if (selectedDept && selectedDept !== 'All') {
        params.department = selectedDept;
      }
      if (selectedCategoryId && selectedCategoryId !== 'All') {
        const catObj = categories.find(c => String(c._id) === String(selectedCategoryId) || String(c.name) === String(selectedCategoryId) || String(c.title) === String(selectedCategoryId));
        if (catObj) {
          params.category = catObj.name || catObj.title;
          if (/^[0-9a-fA-F]{24}$/.test(catObj._id)) {
            params.categoryId = catObj._id;
          }
        } else if (/^[0-9a-fA-F]{24}$/.test(selectedCategoryId)) {
          params.categoryId = selectedCategoryId;
        } else {
          params.category = selectedCategoryId;
        }
      }
      if (selectedTopicId && selectedTopicId !== 'All') {
        const activeTopic = topics.find(t => String(t._id) === String(selectedTopicId) || t.title === selectedTopicId);
        if (activeTopic) {
          params.topic = activeTopic.title;
          if (/^[0-9a-fA-F]{24}$/.test(activeTopic._id)) {
            params.topicId = activeTopic._id;
          }
        } else if (/^[0-9a-fA-F]{24}$/.test(selectedTopicId)) {
          params.topicId = selectedTopicId;
        } else {
          params.topic = selectedTopicId;
        }
      }
      if (difficultyFilter && difficultyFilter !== 'All') {
        params.difficulty = difficultyFilter;
      }
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.getQuestions(params);
      if (res?.success) {
        setQuestions(res.questions || []);
        setTotalCount(res.total || res.questions?.length || 0);
      } else {
        setQuestions([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
      setQuestions([]);
      setTotalCount(0);
    } finally {
      setLoadingQuestions(false);
    }
  };



  // Load Topics for PDF Target Modal
  useEffect(() => {
    if (isPdfModalOpen) {
      loadPdfTopics(pdfTargetModule, pdfTargetCategory, pdfTargetDept);
    }
  }, [isPdfModalOpen, pdfTargetModule, pdfTargetCategory, pdfTargetDept]);

  const loadPdfTopics = async (mod, cat, dept) => {
    try {
      const params = {};
      if (mod && mod !== 'All') {
        params.module = mod === 'Domain Knowledge' ? 'Domain' : mod;
      }
      if (dept && dept !== 'All') params.department = dept;
      if (cat && cat !== 'All') params.category = cat;
      const res = await api.getTopics(params);
      if (res?.success && Array.isArray(res.topics)) {
        setPdfAvailableTopics(res.topics);
        if (res.topics.length > 0) {
          const matched = res.topics.find((t) => t.title === pdfTargetTopicTitle || t._id === pdfTargetTopicId);
          if (matched) {
            setPdfTargetTopicId(matched._id);
            setPdfTargetTopicTitle(matched.title);
          } else if (!pdfTargetTopicTitle) {
            setPdfTargetTopicId(res.topics[0]._id);
            setPdfTargetTopicTitle(res.topics[0].title);
          }
        }
      }
    } catch (_) {}
  };

  const handleExtractPdf = async (e) => {
    e?.preventDefault();
    if (!pdfFile) {
      alert('Please select a PDF file.');
      return;
    }

    setPdfExtracting(true);
    try {
      const formData = new FormData();
      formData.append('pdfFile', pdfFile);
      formData.append('category', pdfTargetCategory);
      formData.append('topic', pdfTargetTopicTitle);
      formData.append('questionCount', 'all');

      const res = await api.extractPdfQuestions(formData);
      if (res?.success && Array.isArray(res.questions) && res.questions.length > 0) {
        setExtractedQuestions(
          res.questions.map((q, idx) => ({
            ...q,
            selected: true,
            tempId: idx
          }))
        );
      } else {
        alert(res?.message || 'No multiple-choice questions could be detected in this PDF. Please verify that the PDF has readable text.');
      }
    } catch (err) {
      alert(err.message || 'Error extracting questions from PDF.');
    } finally {
      setPdfExtracting(false);
    }
  };

  const handleSavePdfQuestions = async () => {
    const selected = extractedQuestions.filter((q) => q.selected !== false);
    if (selected.length === 0) {
      alert('No questions selected to import.');
      return;
    }

    setSubmitting(true);
    try {
      const targetTopicDoc = pdfAvailableTopics.find(
        (t) => t._id === pdfTargetTopicId || t.title === pdfTargetTopicTitle
      );
      const finalTopicId = targetTopicDoc ? targetTopicDoc._id : (pdfTargetTopicId !== 'All' ? pdfTargetTopicId : null);
      const finalTopicTitle = targetTopicDoc ? targetTopicDoc.title : pdfTargetTopicTitle;
      const finalCategory = targetTopicDoc?.category || pdfTargetCategory;
      const finalModule = targetTopicDoc?.module || pdfTargetModule;

      const formatted = selected.map((q) => {
        const rawOptions = Array.isArray(q.options) ? q.options : [];
        const normalizedOptions = rawOptions.map((opt) => {
          if (typeof opt === 'object' && opt !== null) {
            return opt.text || opt.title || String(opt);
          }
          return String(opt);
        });

        let diff = q.difficulty ? String(q.difficulty).trim() : 'Medium';
        diff = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
        if (!['Easy', 'Medium', 'Hard'].includes(diff)) diff = 'Medium';

        return {
          questionText: q.questionText || q.text || '',
          options: normalizedOptions,
          correctAnswer: String(q.correctAnswer || normalizedOptions[0] || 'A').trim(),
          explanation: q.explanation || '',
          difficulty: diff,
          module: finalModule,
          category: finalCategory,
          topic: finalTopicTitle,
          topicId: finalTopicId,
          department: pdfTargetDept !== 'All' ? pdfTargetDept : null
        };
      });

      const res = await api.bulkSaveQuestions({
        questions: formatted,
        module: finalModule,
        category: finalCategory,
        topic: finalTopicTitle,
        topicId: finalTopicId,
        department: pdfTargetDept !== 'All' ? pdfTargetDept : null
      });

      if (res?.success) {
        setFeedback({
          type: 'success',
          message: `Successfully imported ${formatted.length} questions from PDF into ${finalTopicTitle}!`
        });
        setIsPdfModalOpen(false);
        setPdfFile(null);
        setExtractedQuestions([]);

        if (finalModule) setSelectedModule(finalModule);
        if (finalTopicId) setSelectedTopicId(finalTopicId);
        loadQuestions();
      } else {
        alert(res?.message || 'Failed to save questions.');
      }
    } catch (err) {
      alert(err.message || 'Error saving questions.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this question?')) return;
    try {
      const res = await api.deleteQuestion(id);
      if (res?.success) {
        setFeedback({
          type: 'success',
          message: 'Question deleted successfully.'
        });
        setSelectedQuestionIds(prev => prev.filter(qId => qId !== id));
        loadQuestions();
      } else {
        alert(res?.message || 'Failed to delete question');
      }
    } catch (err) {
      alert(err.message || 'Error deleting question');
    }
  };

  const toggleSelectQuestion = (id) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const allCurrentPageSelected = questions.length > 0 && questions.every(q => selectedQuestionIds.includes(q._id));

  const toggleSelectAllCurrentPage = () => {
    if (allCurrentPageSelected) {
      const pageIds = new Set(questions.map(q => q._id));
      setSelectedQuestionIds(prev => prev.filter(id => !pageIds.has(id)));
    } else {
      const combined = new Set([...selectedQuestionIds, ...questions.map(q => q._id)]);
      setSelectedQuestionIds(Array.from(combined));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedQuestionIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedQuestionIds.length} selected question(s)? This action cannot be undone.`)) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.bulkDeleteQuestions({ ids: selectedQuestionIds });
      if (res?.success) {
        setFeedback({
          type: 'success',
          message: res.message || `Deleted ${selectedQuestionIds.length} question(s) successfully.`
        });
        setSelectedQuestionIds([]);
        loadQuestions();
      } else {
        alert(res?.message || 'Failed to delete selected questions.');
      }
    } catch (err) {
      alert(err.message || 'Error deleting selected questions.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearTopicQuestions = async () => {
    const topicName = activeTopic?.title || activeTopic?.name || (topics.find(t => t._id === selectedTopicId)?.title) || 'this topic';
    if (!window.confirm(`⚠️ CAUTION: Are you sure you want to delete ALL questions for topic "${topicName}" (${totalCount} total questions)?\n\nThis will permanently delete all questions in this topic from the database Question Bank.`)) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.bulkDeleteQuestions({
        topic: activeTopic?.title || activeTopic?.name || topicName,
        topicId: selectedTopicId !== 'All' ? selectedTopicId : undefined,
        module: selectedModule !== 'All' ? selectedModule : undefined
      });
      if (res?.success) {
        setFeedback({
          type: 'success',
          message: res.message || `All questions for topic "${topicName}" were deleted successfully.`
        });
        setSelectedQuestionIds([]);
        loadQuestions();
      } else {
        alert(res?.message || 'Failed to clear topic questions.');
      }
    } catch (err) {
      alert(err.message || 'Error clearing topic questions.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeTopic = topics.find(t => t._id === selectedTopicId);

  // Compute Active Filter Label for Summary
  const filterSummaryLabel = useMemo(() => {
    if (selectedTopicId !== 'All' && activeTopic) {
      return activeTopic.title;
    }
    if (selectedCategoryId !== 'All') {
      return selectedCategoryId;
    }
    if (selectedDept !== 'All') {
      return `${selectedDept} Department`;
    }
    if (selectedModule !== 'All') {
      return `${selectedModule} Module`;
    }
    return 'All Training Topics';
  }, [selectedTopicId, activeTopic, selectedCategoryId, selectedDept, selectedModule]);

  // Available submodules for the PDF import modal
  const pdfSubmodules = useMemo(() => {
    const mod = pdfTargetModule || 'Aptitude';
    const raw = MODULE_CATEGORIES[mod] || MODULE_CATEGORIES[normalizeModuleName(mod)] || [];
    const list = raw.map((c) => (typeof c === 'object' ? (c.label || c.name || c.id) : c));
    if ((mod === 'Domain' || mod === 'Domain Knowledge') && categories.length > 0) {
      categories.forEach(c => {
        const name = c.title || c.name;
        if (name && !list.includes(name)) list.push(name);
      });
    }
    return list;
  }, [pdfTargetModule, categories]);

  const openPdfModal = () => {
    const mod = activeTopic?.module || (selectedModule !== 'All' ? selectedModule : 'Aptitude');
    const dept = selectedDept !== 'All' ? selectedDept : 'All';
    let cat = 'Quantitative Aptitude';
    if (activeTopic?.category) {
      const matchedCat = categories.find(c => c.name === activeTopic.category || c.title === activeTopic.category || c._id === activeTopic.category);
      cat = matchedCat ? (matchedCat.title || matchedCat.name) : activeTopic.category;
    } else if (selectedCategoryId !== 'All') {
      const catObj = categories.find(c => String(c._id) === String(selectedCategoryId) || String(c.name) === String(selectedCategoryId) || String(c.title) === String(selectedCategoryId));
      cat = catObj ? (catObj.title || catObj.name) : selectedCategoryId;
    } else {
      const defaultCats = MODULE_CATEGORIES[mod] || MODULE_CATEGORIES[normalizeModuleName(mod)] || [];
      if (defaultCats.length > 0) {
        cat = typeof defaultCats[0] === 'object' ? (defaultCats[0].label || defaultCats[0].name) : defaultCats[0];
      }
    }
    setPdfTargetModule(mod);
    setPdfTargetDept(dept);
    setPdfTargetCategory(cat);
    setPdfTargetTopicId(selectedTopicId !== 'All' ? selectedTopicId : (activeTopic?._id || ''));
    setPdfTargetTopicTitle(activeTopic?.title || (topics.length > 0 ? topics[0].title : 'Percentage'));
    setPdfFile(null);
    setExtractedQuestions([]);
    setIsPdfModalOpen(true);
  };

  const loadModalCategories = async (mod, dept) => {
    try {
      if (mod === 'Aptitude') {
        const raw = MODULE_CATEGORIES['Aptitude'] || [];
        const cats = raw.map(c => ({ _id: c.id || c.label, title: c.label || c.name || c.id, name: c.id || c.label }));
        setModalCategories(cats);
        return cats;
      } else if (mod === 'Domain' || mod === 'Domain Knowledge') {
        const params = { module: 'Domain' };
        if (dept && dept !== 'All') params.department = dept;
        const res = await api.getCategories(params);
        const cats = (res?.categories || []).map(c => ({ _id: c._id, title: c.title, name: c.title }));
        setModalCategories(cats);
        return cats;
      } else {
        const res = await api.getCategories({ module: mod });
        const cats = res?.categories || [];
        if (cats.length > 0) {
          const mapped = cats.map(c => ({ _id: c._id, title: c.title || c.name, name: c.title || c.name }));
          setModalCategories(mapped);
          return mapped;
        } else {
          const raw = MODULE_CATEGORIES[mod] || [];
          const mapped = raw.map(c => ({ _id: c.id || c.label, title: c.label || c.name || c.id, name: c.id || c.label }));
          setModalCategories(mapped);
          return mapped;
        }
      }
    } catch (_) {
      setModalCategories([]);
      return [];
    }
  };

  const loadModalTopics = async (mod, catId, catName, dept) => {
    try {
      const params = {};
      if (mod && mod !== 'All') {
        params.module = mod === 'Domain Knowledge' ? 'Domain' : mod;
      }
      if (dept && dept !== 'All') params.department = dept;
      if (catId && /^[0-9a-fA-F]{24}$/.test(catId)) {
        params.categoryId = catId;
      } else if (catName) {
        params.category = catName;
      }
      const res = await api.getTopics(params);
      const list = res?.topics || [];
      setModalTopics(list);
      return list;
    } catch (_) {
      setModalTopics([]);
      return [];
    }
  };

  const openAddModal = async () => {
    const mod = activeTopic?.module || (selectedModule !== 'All' ? selectedModule : 'Communication');
    const dept = selectedDept !== 'All' ? selectedDept : 'All';
    const cats = await loadModalCategories(mod, dept);

    let chosenCat = null;
    if (activeTopic?.category) {
      chosenCat = cats.find(c => c.title === activeTopic.category || c.name === activeTopic.category || (activeTopic.categoryId && String(c._id) === String(activeTopic.categoryId)));
    } else if (selectedCategoryId !== 'All') {
      chosenCat = cats.find(c => String(c._id) === String(selectedCategoryId) || c.name === selectedCategoryId || c.title === selectedCategoryId);
    }
    if (!chosenCat && cats.length > 0) {
      chosenCat = cats[0];
    }

    const catTitle = chosenCat ? (chosenCat.title || chosenCat.name) : (mod === 'Communication' ? 'Grammar' : (mod === 'Aptitude' ? 'Quantitative' : 'General'));
    const catId = (chosenCat && /^[0-9a-fA-F]{24}$/.test(chosenCat._id)) ? chosenCat._id : '';

    const tops = await loadModalTopics(mod, catId, catTitle, dept);

    let chosenTop = null;
    if (activeTopic?.title) {
      chosenTop = tops.find(t => t.title === activeTopic.title || (activeTopic._id && String(t._id) === String(activeTopic._id)));
    } else if (selectedTopicId !== 'All') {
      chosenTop = tops.find(t => String(t._id) === String(selectedTopicId) || t.title === selectedTopicId);
    }
    if (!chosenTop && tops.length > 0) {
      chosenTop = tops[0];
    }

    const topTitle = chosenTop ? chosenTop.title : '';
    const topId = (chosenTop && /^[0-9a-fA-F]{24}$/.test(chosenTop._id)) ? chosenTop._id : '';

    setNewQuestion({
      module: mod,
      department: dept,
      category: catTitle,
      categoryId: catId,
      topic: topTitle,
      topicId: topId,
      questionText: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      difficulty: 'Medium',
      marks: 1,
      explanation: ''
    });

    setIsAddModalOpen(true);
  };

  const handleModalModuleChange = async (newMod) => {
    const cats = await loadModalCategories(newMod, newQuestion.department);
    const firstCat = cats.length > 0 ? cats[0] : null;
    const catTitle = firstCat ? (firstCat.title || firstCat.name) : '';
    const catId = (firstCat && /^[0-9a-fA-F]{24}$/.test(firstCat._id)) ? firstCat._id : '';

    const tops = await loadModalTopics(newMod, catId, catTitle, newQuestion.department);
    const firstTop = tops.length > 0 ? tops[0] : null;
    const topTitle = firstTop ? firstTop.title : '';
    const topId = (firstTop && /^[0-9a-fA-F]{24}$/.test(firstTop._id)) ? firstTop._id : '';

    setNewQuestion(prev => ({
      ...prev,
      module: newMod,
      category: catTitle,
      categoryId: catId,
      topic: topTitle,
      topicId: topId
    }));
  };

  const handleModalCategoryChange = async (newCatId, newCatTitle) => {
    const validCatId = /^[0-9a-fA-F]{24}$/.test(newCatId) ? newCatId : '';
    const tops = await loadModalTopics(newQuestion.module, validCatId, newCatTitle, newQuestion.department);
    const firstTop = tops.length > 0 ? tops[0] : null;
    const topTitle = firstTop ? firstTop.title : '';
    const topId = (firstTop && /^[0-9a-fA-F]{24}$/.test(firstTop._id)) ? firstTop._id : '';

    setNewQuestion(prev => ({
      ...prev,
      category: newCatTitle,
      categoryId: validCatId,
      topic: topTitle,
      topicId: topId
    }));
  };

  const handleSaveSingleQuestion = async (e) => {
    e?.preventDefault();
    if (!newQuestion.questionText.trim()) {
      alert('Please enter the question text.');
      return;
    }
    if (newQuestion.options.some(opt => !opt.trim())) {
      alert('Please fill in all 4 options.');
      return;
    }
    if (!newQuestion.topic) {
      alert('Please select a valid topic.');
      return;
    }

    setSubmitting(true);
    try {
      const cleanCatId = /^[0-9a-fA-F]{24}$/.test(newQuestion.categoryId) ? newQuestion.categoryId : undefined;
      const cleanTopId = /^[0-9a-fA-F]{24}$/.test(newQuestion.topicId) ? newQuestion.topicId : undefined;
      const cleanDept = (newQuestion.department && newQuestion.department !== 'All' && OFFICIAL_DEPARTMENTS.includes(newQuestion.department))
        ? newQuestion.department
        : null;

      const payload = {
        module: newQuestion.module === 'Domain Knowledge' ? 'Domain' : newQuestion.module,
        department: cleanDept,
        category: newQuestion.category,
        categoryId: cleanCatId,
        topic: newQuestion.topic,
        topicId: cleanTopId,
        questionText: newQuestion.questionText.trim(),
        options: newQuestion.options.map(o => o.trim()),
        correctAnswer: newQuestion.options[newQuestion.correctAnswerIndex]?.trim() || newQuestion.options[0]?.trim(),
        difficulty: newQuestion.difficulty,
        marks: Number(newQuestion.marks) || 1,
        explanation: newQuestion.explanation?.trim() || '',
        type: 'mcq',
        status: 'active'
      };

      const res = await api.createQuestion(payload);
      if (res?.success) {
        setFeedback({
          type: 'success',
          message: `Question added successfully to topic "${newQuestion.topic}" in ${newQuestion.module}!`
        });
        setIsAddModalOpen(false);

        // If module was changed in modal, sync selectedModule
        if (selectedModule !== 'All' && selectedModule !== payload.module) {
          setSelectedModule(payload.module);
        }
        loadQuestions();
      } else {
        alert(res?.message || 'Failed to create question.');
      }
    } catch (err) {
      alert(err.message || 'Error creating question.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Training Question Bank"
        subtitle="Centralized repository of multiple choice questions organized by Training Module, Category, Department, and Topic."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={Plus}
              onClick={openAddModal}
            >
              + Add Question
            </Button>
            <Button
              variant="primary"
              icon={FileText}
              onClick={openPdfModal}
            >
              Add Questions via PDF Parse
            </Button>
          </div>
        }
      />

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center justify-between border ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Module Tabs Bar (Pill Filter like Training Module) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {MODULE_TABS.map((tab) => {
          const isActive = selectedModule === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleModuleChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Multi-Level Hierarchy Filter Bar (with 'All' at every level) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Filter Hierarchy: Module → Department → Submodule → Topic
          </div>

          {(selectedModule !== 'All' || selectedDept !== 'All' || selectedCategoryId !== 'All' || selectedTopicId !== 'All' || difficultyFilter !== 'All' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                handleModuleChange('All');
                setDifficultyFilter('All');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Module Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              1. Training Module
            </label>
            <select
              value={selectedModule}
              onChange={(e) => handleModuleChange(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Modules</option>
              {QUESTION_BANK_MODULES.map((m) => {
                const modId = typeof m === 'object' ? (m.id || m.name) : m;
                const modLabel = typeof m === 'object' ? (m.label || m.name || m.id) : m;
                return (
                  <option key={String(modId)} value={String(modId)}>
                    {String(modLabel)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Department Selector (Domain specific or general) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              2. Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => handleDeptChange(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Departments</option>
              {OFFICIAL_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Submodule / Category Selector (Opens Downside) */}
          <DownwardDropdownSelect
            label={
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                3. Submodule / Domain
              </span>
            }
            value={selectedCategoryId}
            onChange={(newVal) => handleCategoryChange(newVal)}
            options={categoryOptions}
            placeholder="All Submodules / Categories"
            searchPlaceholder="Search submodule / domain..."
          />

          {/* 4. Topic Selector (Opens Downside) */}
          <DownwardDropdownSelect
            label={
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                4. Topic
              </span>
            }
            value={selectedTopicId}
            onChange={(newVal) => handleTopicChange(newVal)}
            options={topicOptions}
            placeholder="All Topics"
            searchPlaceholder="Search topic..."
          />
        </div>
      </div>

      {/* Active Pool Overview Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded border border-blue-400/30">
              {selectedModule === 'All' ? 'All Modules' : selectedModule}
            </span>
            {selectedDept !== 'All' && (
              <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                {selectedDept}
              </span>
            )}
            {selectedCategoryId !== 'All' && (
              <span className="text-[11px] font-bold bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded border border-violet-400/30">
                {categories.find(c => String(c._id) === String(selectedCategoryId) || c.name === selectedCategoryId || c.title === selectedCategoryId)?.title || selectedCategoryId}
              </span>
            )}
            <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
              Database Question Pool
            </span>
          </div>

          <h2 className="text-xl font-black">{filterSummaryLabel}</h2>
          <p className="text-xs text-blue-200 mt-1 max-w-xl">
            {selectedTopicId !== 'All' && activeTopic?.description
              ? activeTopic.description
              : 'Questions in this pool are randomly served for practice tests and default assessments without external AI calls.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-xs px-5 py-3 rounded-xl border border-white/10 shrink-0">
          <div className="text-center pr-3 border-r border-white/20">
            <div className="text-2xl font-black text-white">{totalCount}</div>
            <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Total Questions</div>
          </div>
          <div className="flex items-center gap-2">
            {selectedTopicId !== 'All' && totalCount > 0 && (
              <button
                type="button"
                onClick={handleClearTopicQuestions}
                disabled={submitting}
                className="px-3.5 py-2.5 rounded-xl text-xs font-black bg-rose-600/90 hover:bg-rose-600 text-white shadow-md flex items-center gap-1.5 transition cursor-pointer border border-rose-400/40 disabled:opacity-50"
                title={`Delete all ${totalCount} questions for this topic`}
              >
                <Trash2 className="w-4 h-4" />
                Clear Topic Questions
              </button>
            )}
            <button
              type="button"
              onClick={openPdfModal}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Add Questions via PDF
            </button>
          </div>
        </div>
      </div>

      {/* Search & Secondary Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="w-full sm:w-80">
          <Input
            icon={Search}
            placeholder="Search questions or options..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadQuestions}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Batch Selection Bar */}
      {questions.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allCurrentPageSelected}
                onChange={toggleSelectAllCurrentPage}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <span>Select All on Page ({questions.length})</span>
            </label>
            {selectedQuestionIds.length > 0 && (
              <span className="font-extrabold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full text-[11px]">
                {selectedQuestionIds.length} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedQuestionIds.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={submitting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected ({selectedQuestionIds.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Question List */}
      {loadingQuestions ? (
        <LoadingState message="Loading question pool..." />
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center border border-slate-200 shadow-xs my-4 space-y-4">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-600">
            <Database className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 mb-1">
              No Questions in {filterSummaryLabel} Yet
            </h4>
            <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
              There are currently 0 questions for this topic in the database. You can quickly add questions using the offline PDF parser, generate them with AI, or enter them manually.
            </p>
          </div>
          <div className="flex items-center justify-center pt-2">
            <Button
              variant="primary"
              icon={FileText}
              onClick={openPdfModal}
            >
              Upload PDF (Parse Questions)
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const questionNumber = (page - 1) * limit + idx + 1;
            const ansStr = String(q.correctAnswer || '').trim();
            const letterIdx = ['A', 'B', 'C', 'D'].indexOf(ansStr.toUpperCase());

            // Strictly resolve to a single correct option index so multiple answers are never highlighted
            let resolvedCorrectIdx = -1;
            const objIdx = q.options?.findIndex(o => typeof o === 'object' && o !== null && o.isCorrect);
            if (objIdx >= 0) {
              resolvedCorrectIdx = objIdx;
            } else if (letterIdx >= 0 && letterIdx < (q.options?.length || 0)) {
              resolvedCorrectIdx = letterIdx;
            } else if (ansStr) {
              const matchIdx = q.options?.findIndex(o => {
                const text = typeof o === 'object' && o !== null ? (o.text || o.title) : String(o);
                return String(text).trim().toLowerCase() === ansStr.toLowerCase() ||
                       String(text).replace(/\s+/g, '').toLowerCase() === ansStr.replace(/\s+/g, '').toLowerCase();
              });
              if (matchIdx >= 0) {
                resolvedCorrectIdx = matchIdx;
              }
            }

            const isSelected = selectedQuestionIds.includes(q._id);

            return (
              <div
                key={q._id || idx}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition p-5 ${
                  isSelected ? 'border-blue-400 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-400' : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectQuestion(q._id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer mt-1.5 shrink-0"
                      title="Select question"
                    />
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                      {questionNumber}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {q.module && (
                          <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/50">
                            {q.module}
                          </span>
                        )}
                        {q.category && (
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {q.category}
                          </span>
                        )}
                        {q.topic && (
                          <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-900/50">
                            {q.topic}
                          </span>
                        )}
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          String(q.difficulty).toLowerCase() === 'hard'
                            ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/50'
                            : String(q.difficulty).toLowerCase() === 'medium'
                            ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/50'
                            : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/50'
                        }`}>
                          {q.difficulty || 'medium'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {q.marks || q.points || 1} pt
                        </span>
                      </div>

                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {q.questionText || q.text}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(q._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {q.options?.map((opt, oIdx) => {
                    const optText = typeof opt === 'object' && opt !== null ? (opt.text || opt.title) : opt;
                    const isCorrect = (oIdx === resolvedCorrectIdx);
                    const letter = String.fromCharCode(65 + oIdx);

                    return (
                      <div
                        key={oIdx}
                        className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 border ${
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {letter}
                        </span>
                        <span className="flex-1 truncate">{optText}</span>
                        {isCorrect && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="mt-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-slate-100">Explanation: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalCount > limit && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500 font-semibold">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} questions
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs font-black text-slate-700 px-2">
                  Page {page} of {Math.ceil(totalCount / limit)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(totalCount / limit)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PDF QUESTION IMPORT & PARSER MODAL (EXCLUSIVE OPTION) */}
      <Modal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="Add Questions Topic-Wise via PDF Parse"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            Upload any PDF containing multiple-choice questions (e.g. Percentage, Time & Work, DBMS). The offline pattern parser automatically extracts question statements, options (A, B, C, D), and correct answers, and saves them directly into your selected topic's Question Bank.
          </p>

          {selectedTopicId !== 'All' && activeTopic && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-950 font-bold">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Target Topic: <span className="underline font-black">{activeTopic.title}</span></span>
              </div>
              <span className="text-[10px] uppercase font-black bg-blue-200/70 text-blue-800 px-2 py-0.5 rounded">
                {selectedModule !== 'All' ? selectedModule : 'Aptitude'}
              </span>
            </div>
          )}

          {/* 1. Target Taxonomy Selectors */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              1. Tag Questions with Training Taxonomy
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Module */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Module
                </label>
                <select
                  value={pdfTargetModule}
                  onChange={(e) => {
                    const newMod = e.target.value;
                    setPdfTargetModule(newMod);
                    setPdfTargetDept('All');
                    const rawCats = MODULE_CATEGORIES[newMod] || MODULE_CATEGORIES[normalizeModuleName(newMod)] || [];
                    const firstCat = rawCats.length > 0 ? (typeof rawCats[0] === 'object' ? (rawCats[0].label || rawCats[0].name || rawCats[0].id) : rawCats[0]) : 'General';
                    setPdfTargetCategory(firstCat);
                    setPdfTargetTopicId('');
                    setPdfTargetTopicTitle('');
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {QUESTION_BANK_MODULES.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Submodule / Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Submodule / Category
                </label>
                {pdfSubmodules.length > 0 ? (
                  <select
                    value={pdfTargetCategory}
                    onChange={(e) => {
                      setPdfTargetCategory(e.target.value);
                      setPdfTargetTopicId('');
                      setPdfTargetTopicTitle('');
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {pdfSubmodules.map((sub, sIdx) => (
                      <option key={sIdx} value={sub}>{sub}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={pdfTargetCategory}
                    onChange={(e) => setPdfTargetCategory(e.target.value)}
                    placeholder="e.g. Quantitative Aptitude"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                )}
              </div>

              {/* Topic Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Topic
                </label>
                {pdfAvailableTopics.length > 0 ? (
                  <select
                    value={pdfTargetTopicTitle}
                    onChange={(e) => {
                      setPdfTargetTopicTitle(e.target.value);
                      const tDoc = pdfAvailableTopics.find((t) => t.title === e.target.value);
                      if (tDoc) setPdfTargetTopicId(tDoc._id);
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {pdfAvailableTopics.map((t) => (
                      <option key={t._id} value={t.title}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={pdfTargetTopicTitle}
                    onChange={(e) => setPdfTargetTopicTitle(e.target.value)}
                    placeholder="e.g. Percentage"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 2. File Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              2. Select PDF File
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition flex flex-col items-center justify-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <input
                type="file"
                accept=".pdf"
                id="pdf-question-file-input"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPdfFile(file);
                    setExtractedQuestions([]);
                  }
                }}
              />
              <label
                htmlFor="pdf-question-file-input"
                className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                {pdfFile ? `Selected: ${pdfFile.name} (${Math.round(pdfFile.size / 1024)} KB)` : 'Click to select PDF document'}
              </label>
              <p className="text-[11px] text-slate-400">
                Supports standard MCQ test papers with options (A, B, C, D) and answer keys.
              </p>
            </div>
          </div>

          {/* Extract Action Button */}
          {pdfFile && extractedQuestions.length === 0 && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                icon={Sparkles}
                loading={pdfExtracting}
                onClick={handleExtractPdf}
              >
                {pdfExtracting ? 'Parsing PDF Questions...' : 'Extract Questions from PDF'}
              </Button>
            </div>
          )}

          {/* 3. Extracted Questions Preview */}
          {extractedQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  3. Extracted Questions ({extractedQuestions.filter((q) => q.selected !== false).length} of {extractedQuestions.length} selected)
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = extractedQuestions.every((q) => q.selected !== false);
                      setExtractedQuestions(extractedQuestions.map((q) => ({ ...q, selected: !allSelected })));
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    {extractedQuestions.every((q) => q.selected !== false) ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Destination: {pdfTargetTopicTitle}
                  </span>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {extractedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={q.selected !== false}
                          onChange={(e) => {
                            const updated = [...extractedQuestions];
                            updated[idx].selected = e.target.checked;
                            setExtractedQuestions(updated);
                          }}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <p className="font-bold text-slate-900 leading-snug">
                          {idx + 1}. {q.questionText || q.text}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded shrink-0">
                        Ans: {q.correctAnswer}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pl-6 text-[11px] text-slate-600">
                      {q.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="truncate">
                          <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span> {typeof opt === 'object' ? (opt.text || opt.title) : opt}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="pl-6 pt-1 text-[11px] text-slate-500 bg-slate-100/60 p-2 rounded-lg border border-slate-200/60">
                        <span className="font-bold text-slate-700">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExtractedQuestions([])}
                >
                  Clear & Re-upload
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  icon={CheckCircle}
                  loading={submitting}
                  onClick={handleSavePdfQuestions}
                >
                  {submitting ? 'Importing...' : `Save ${extractedQuestions.filter((q) => q.selected !== false).length} Questions to Bank`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MANUAL ADD SINGLE QUESTION MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Single Question to Bank"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveSingleQuestion} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Create an individual multiple choice question tagged to a specific training module, category, and topic.
          </p>

          {/* Module, Category, Topic Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            {/* Module */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                1. Module
              </label>
              <select
                value={newQuestion.module}
                onChange={(e) => handleModalModuleChange(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {QUESTION_BANK_MODULES.map((m) => {
                  const mId = typeof m === 'object' ? (m.id || m.name) : m;
                  const mLabel = typeof m === 'object' ? (m.label || m.name || m.id) : m;
                  return (
                    <option key={String(mId)} value={String(mId)}>
                      {String(mLabel)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                2. Category
              </label>
              <select
                value={newQuestion.categoryId || newQuestion.category}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const matched = modalCategories.find(c => String(c._id) === String(selectedId) || c.name === selectedId || c.title === selectedId);
                  handleModalCategoryChange(selectedId, matched?.title || matched?.name || selectedId);
                }}
                className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {modalCategories.map((c) => {
                  const cId = c._id || c.name || c.title;
                  return (
                    <option key={String(cId)} value={String(cId)}>
                      {c.title || c.name || c.label || cId}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                3. Topic
              </label>
              <select
                value={newQuestion.topicId || newQuestion.topic}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const matched = modalTopics.find(t => String(t._id) === String(selectedId) || t.title === selectedId);
                  setNewQuestion(prev => ({
                    ...prev,
                    topic: matched?.title || selectedId,
                    topicId: matched?._id || selectedId
                  }));
                }}
                className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="">-- Select Topic --</option>
                {modalTopics.map((t) => (
                  <option key={String(t._id)} value={String(t._id)}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question Statement */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Question Text <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={newQuestion.questionText}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, questionText: e.target.value }))}
              placeholder="Enter the question statement..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* 4 Options with radio selection for Correct Answer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Answer Options <span className="text-slate-400 font-normal">(Select the button for the correct option)</span>
            </label>
            <div className="space-y-2">
              {['A', 'B', 'C', 'D'].map((letter, idx) => {
                const isSelected = newQuestion.correctAnswerIndex === idx;
                return (
                  <div key={letter} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewQuestion(prev => ({ ...prev, correctAnswerIndex: idx }))}
                      className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center border transition shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                      title={isSelected ? 'Marked as Correct Answer' : 'Click to mark as Correct Answer'}
                    >
                      {letter}
                    </button>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${letter}`}
                      value={newQuestion.options[idx] || ''}
                      onChange={(e) => {
                        const updated = [...newQuestion.options];
                        updated[idx] = e.target.value;
                        setNewQuestion(prev => ({ ...prev, options: updated }));
                      }}
                      className={`flex-1 text-xs px-3 py-2 rounded-xl border transition ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-50/40 text-emerald-950 font-semibold'
                          : 'border-slate-200 bg-white'
                      }`}
                    />
                    {isSelected && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                        Correct
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty & Marks */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty</label>
              <select
                value={newQuestion.difficulty}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Easy">Easy (Beginner)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="Hard">Hard (Advanced)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Marks</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newQuestion.marks}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, marks: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Explanation (Optional)</label>
            <textarea
              rows={2}
              value={newQuestion.explanation}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Explain why this answer is correct..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={CheckCircle}
              loading={submitting}
            >
              Save Question to Bank
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionBankManagementPage;
