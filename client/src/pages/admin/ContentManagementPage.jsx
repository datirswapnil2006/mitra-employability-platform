import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
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
import NoteReaderModal from '../../components/NoteReaderModal';
import { MODULE_CATEGORIES, normalizeModuleName } from '../../constants/trainingModules';
import { DEPARTMENT_DETAILS, getDepartmentDetails } from '../../constants/departments';
import {
  Plus,
  Sparkles,
  Play,
  Trash2,
  Edit2,
  ExternalLink,
  Video,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowLeft,
  Eye,
  EyeOff,
  FolderOpen,
  Settings2,
  Upload,
  FileCheck,
  X,
  Layers,
  ChevronRight,
  BookOpen,
  GraduationCap,
  UserCheck,
  Code2,
  MessageSquare,
  Users
} from 'lucide-react';

export const ContentManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawModule = searchParams.get('module') || 'Aptitude';
  const currentModule = normalizeModuleName(rawModule);
  const isAptitudeModule = currentModule === 'Aptitude';
  const isDomainModule = currentModule === 'Domain Knowledge' || rawModule === 'Domain';
  const isCommunicationModule = currentModule === 'Communication';
  const isResumeModule = currentModule === 'Resume';
  const isInterviewModule = currentModule === 'Interview Preparation' || currentModule === 'Interview' || rawModule === 'Interview';

  // Available categories for current module (Aptitude, Communication, Resume, Interview, etc.)
  const availableCategories = MODULE_CATEGORIES[currentModule] || MODULE_CATEGORIES[rawModule] || [
    { id: 'General', label: 'General' }
  ];

  // Selected Category filter for standard modules
  const [activeCategory, setActiveCategory] = useState(
    isAptitudeModule ? (availableCategories[0]?.id || 'Quantitative') : 'All'
  );

  // ==========================================
  // Domain Module Specific State Hierarchy
  // Level 1: selectedDept (e.g. 'IT', 'EXTC', 'CSE', etc.)
  // Level 2: selectedDomainCategory (Category object)
  // Level 3: selectedTopic (Topic object)
  // Level 4: Topic Details (Videos / Notes)
  // ==========================================
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedDomainCategory, setSelectedDomainCategory] = useState(null);
  const [domainCategories, setDomainCategories] = useState([]);
  const [deptStats, setDeptStats] = useState({});

  // ==========================================
  // Communication Module Specific State Hierarchy
  // Level 1: commCategories (5 categories with counts)
  // Level 2: selectedCommCategory (Category object)
  // Level 3: selectedTopic (Topic object)
  // Level 4: Topic Details (Videos / Notes)
  // ==========================================
  const [commCategories, setCommCategories] = useState([]);
  const [selectedCommCategory, setSelectedCommCategory] = useState(null);
  const [commTopics, setCommTopics] = useState([]);

  // ==========================================
  // Resume Module Specific State Hierarchy
  // Level 1: resumeCategories (4 categories with counts)
  // Level 2: selectedResumeCategory (Category object)
  // Level 3: selectedTopic (Topic object)
  // Level 4: Topic Details (Videos / Notes)
  // ==========================================
  const [resumeCategories, setResumeCategories] = useState([]);
  const [selectedResumeCategory, setSelectedResumeCategory] = useState(null);
  const [resumeTopics, setResumeTopics] = useState([]);

  // ==========================================
  // Interview Preparation Module Specific State Hierarchy
  // Level 1: interviewCategories (5 fixed categories with counts)
  // Level 2 (Standard): selectedInterviewCategory (Category object) -> interviewTopics
  // Level 2 (Company Prep): companies (Data-driven companies with counts)
  // Level 3 (Company Prep): selectedCompany (Company object) -> companyTopics
  // Level 3/4: selectedTopic (Topic object) -> Topic Details (Videos / Notes)
  // ==========================================
  const [interviewCategories, setInterviewCategories] = useState([]);
  const [selectedInterviewCategory, setSelectedInterviewCategory] = useState(null);
  const [interviewTopics, setInterviewTopics] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyTopics, setCompanyTopics] = useState([]);

  // Company Modal State (Add / Edit)
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    description: '',
    logoUrl: '',
    status: 'published',
    order: 0
  });

  // Selected Topic (For Topic Details View in Aptitude, Domain, Communication, Resume & Interview)
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeTopicTab, setActiveTopicTab] = useState('videos'); // 'videos' | 'notes'

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [contents, setContents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Domain Category Modal State (Add / Edit)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    title: '',
    description: '',
    department: 'CSE',
    status: 'published',
    order: 0
  });

  // Topic Modal State (Add / Edit)
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm] = useState({
    title: '',
    description: '',
    category: availableCategories[0]?.id || 'Quantitative',
    categoryId: null,
    department: null,
    status: 'published',
    order: 0
  });

  // Video Modal State (Add / Edit)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    difficulty: 'Beginner',
    status: 'published',
    category: availableCategories[0]?.id || 'Quantitative'
  });

  // PDF Note Modal State (Add / Edit)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [noteForm, setNoteForm] = useState({
    title: '',
    description: '',
    pdfUrl: '',
    fileName: '',
    fileSize: '',
    difficulty: 'Beginner',
    status: 'published',
    category: availableCategories[0]?.id || 'Quantitative'
  });

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: null, // 'category' | 'topic' | 'video' | 'note'
    item: null
  });

  // Preview Modals
  const [activeVideoPreview, setActiveVideoPreview] = useState(null);
  const [activeNotePreview, setActiveNotePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Filter tabs for category row in Aptitude and other modules
  const filterTabs = isAptitudeModule
    ? availableCategories
    : [
        { id: 'All', label: 'All Categories' },
        ...availableCategories
      ];

  // Reset drill-down selection when module changes
  useEffect(() => {
    setSelectedDept(null);
    setSelectedDomainCategory(null);
    setSelectedCommCategory(null);
    setSelectedResumeCategory(null);
    setSelectedInterviewCategory(null);
    setSelectedCompany(null);
    setSelectedTopic(null);
    setSearchQuery('');
    if (isAptitudeModule) {
      setActiveCategory(availableCategories[0]?.id || 'Quantitative');
    } else {
      setActiveCategory('All');
    }
  }, [currentModule]);

  // Main data fetching orchestrator
  useEffect(() => {
    if (isDomainModule) {
      if (selectedTopic) {
        fetchTopicContents(selectedTopic._id, 'Domain');
      } else if (selectedDomainCategory) {
        fetchDomainCategoryTopics(selectedDomainCategory._id);
      } else if (selectedDept) {
        fetchDepartmentCategories(selectedDept);
      } else {
        fetchDepartmentOverviewStats();
      }
    } else if (isCommunicationModule) {
      if (selectedTopic) {
        fetchTopicContents(selectedTopic._id, 'Communication');
      } else if (selectedCommCategory) {
        fetchCommTopics(selectedCommCategory._id);
      } else {
        fetchCommCategories();
      }
    } else if (isResumeModule) {
      if (selectedTopic) {
        fetchTopicContents(selectedTopic._id, 'Resume');
      } else if (selectedResumeCategory) {
        fetchResumeTopics(selectedResumeCategory._id);
      } else {
        fetchResumeCategories();
      }
    } else if (isInterviewModule) {
      if (selectedTopic) {
        fetchTopicContents(selectedTopic._id, 'Interview Preparation');
      } else if (selectedCompany) {
        fetchCompanyTopics(selectedCompany._id);
      } else if (selectedInterviewCategory?.title === 'Company Preparation') {
        fetchCompanies();
      } else if (selectedInterviewCategory) {
        fetchInterviewTopics(selectedInterviewCategory._id);
      } else {
        fetchInterviewCategories();
      }
    } else if (isAptitudeModule) {
      if (!selectedTopic) {
        fetchAptitudeTopics();
      } else {
        fetchTopicContents(selectedTopic._id, 'Aptitude');
      }
    } else {
      fetchNonAptitudeContents();
    }
  }, [currentModule, activeCategory, selectedDept, selectedDomainCategory, selectedTopic, selectedCommCategory, selectedResumeCategory, selectedInterviewCategory, selectedCompany]);

  // ==========================================
  // API Fetch Handlers
  // ==========================================
  const fetchDepartmentOverviewStats = async () => {
    setLoading(true);
    try {
      const res = await api.getCategories({ module: 'Domain' });
      if (res.success && res.categories) {
        const stats = {};
        DEPARTMENT_DETAILS.forEach((d) => {
          const deptCats = res.categories.filter((c) => c.department === d.id || c.department === d.dbKey || c.department === d.code);
          stats[d.id] = {
            categoryCount: deptCats.length,
            topicCount: deptCats.reduce((acc, c) => acc + (c.topicCount || 0), 0),
            videoCount: deptCats.reduce((acc, c) => acc + (c.videoCount || 0), 0),
            notesCount: deptCats.reduce((acc, c) => acc + (c.notesCount || 0), 0)
          };
        });
        setDeptStats(stats);
      }
    } catch (err) {
      console.error('Error fetching department overview stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentCategories = async (deptCode) => {
    setLoading(true);
    try {
      const res = await api.getCategories({ module: 'Domain', department: deptCode });
      if (res.success) {
        setDomainCategories(res.categories || []);
      }
    } catch (err) {
      console.error('Error fetching department categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomainCategoryTopics = async (categoryId) => {
    setLoading(true);
    try {
      const res = await api.getTopics({ module: 'Domain', categoryId });
      if (res.success) {
        setTopics(res.topics || []);
      }
    } catch (err) {
      console.error('Error fetching category topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAptitudeTopics = async () => {
    setLoading(true);
    try {
      const params = { module: 'Aptitude' };
      if (activeCategory && activeCategory !== 'All') {
        params.category = activeCategory;
      }
      const res = await api.getTopics(params);
      if (res.success) {
        setTopics(res.topics || []);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicContents = async (topicId, moduleOverride) => {
    setLoading(true);
    try {
      const res = await api.getContentList({
        module: moduleOverride || (isDomainModule ? 'Domain' : (isCommunicationModule ? 'Communication' : (isResumeModule ? 'Resume' : (isInterviewModule ? 'Interview Preparation' : 'Aptitude')))),
        topicId
      });
      if (res.success) {
        setContents(res.contents || []);
      }
    } catch (err) {
      console.error('Error fetching topic contents:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Communication Fetch Handlers
  // ==========================================
  const fetchCommCategories = async () => {
    setLoading(true);
    try {
      const res = await api.getCategories({ module: 'Communication' });
      if (res.success) {
        setCommCategories(res.categories || []);
      }
    } catch (err) {
      console.error('Error fetching communication categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommTopics = async (categoryId) => {
    setLoading(true);
    try {
      const res = await api.getTopics({ module: 'Communication', categoryId });
      if (res.success) {
        setCommTopics(res.topics || []);
      }
    } catch (err) {
      console.error('Error fetching communication topics:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Resume Fetch Handlers
  // ==========================================
  const fetchResumeCategories = async () => {
    setLoading(true);
    try {
      const res = await api.getCategories({ module: 'Resume' });
      if (res.success) {
        setResumeCategories(res.categories || []);
      }
    } catch (err) {
      console.error('Error fetching resume categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumeTopics = async (categoryId) => {
    setLoading(true);
    try {
      const res = await api.getTopics({ module: 'Resume', categoryId });
      if (res.success) {
        setResumeTopics(res.topics || []);
      }
    } catch (err) {
      console.error('Error fetching resume topics:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Interview Preparation Fetch Handlers
  // ==========================================
  const fetchInterviewCategories = async () => {
    setLoading(true);
    try {
      const res = await api.getCategories({ module: 'Interview Preparation' });
      if (res.success) {
        setInterviewCategories(res.categories || []);
      }
    } catch (err) {
      console.error('Error fetching interview categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviewTopics = async (categoryId) => {
    setLoading(true);
    try {
      const res = await api.getTopics({ module: 'Interview Preparation', categoryId });
      if (res.success) {
        setInterviewTopics(res.topics || []);
      }
    } catch (err) {
      console.error('Error fetching interview topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.getCompanies();
      if (res.success) {
        setCompanies(res.companies || []);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyTopics = async (companyId) => {
    setLoading(true);
    try {
      const res = await api.getTopics({ module: 'Interview Preparation', companyId });
      if (res.success) {
        setCompanyTopics(res.topics || []);
      }
    } catch (err) {
      console.error('Error fetching company topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNonAptitudeContents = async () => {
    setLoading(true);
    try {
      const params = { module: currentModule };
      if (activeCategory !== 'All') params.category = activeCategory;
      const res = await api.getContentList(params);
      if (res.success) {
        setContents(res.contents || []);
      }
    } catch (err) {
      console.error('Error fetching training contents:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Domain Category Handlers
  // ==========================================
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      title: '',
      description: '',
      department: selectedDept || 'CSE',
      status: 'published',
      order: domainCategories.length + 1
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (category, e) => {
    if (e) e.stopPropagation();
    setEditingCategory(category);
    setCategoryForm({
      title: category.title,
      description: category.description || '',
      department: category.department || selectedDept,
      status: category.status || 'published',
      order: category.order || 0
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...categoryForm,
        module: 'Domain',
        department: selectedDept || categoryForm.department,
        departmentId: selectedDept || categoryForm.department
      };
      let res;
      if (editingCategory) {
        res = await api.updateCategory(editingCategory._id, payload);
      } else {
        res = await api.createCategory(payload);
      }

      if (res.success) {
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        if (selectedDept) fetchDepartmentCategories(selectedDept);
        if (selectedDomainCategory && editingCategory && selectedDomainCategory._id === editingCategory._id) {
          setSelectedDomainCategory(res.category);
        }
      }
    } catch (err) {
      console.error('Error saving domain category:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirm.item) return;
    try {
      const res = await api.deleteCategory(deleteConfirm.item._id);
      if (res.success) {
        setDeleteConfirm({ open: false, type: null, item: null });
        if (selectedDomainCategory && selectedDomainCategory._id === deleteConfirm.item._id) {
          setSelectedDomainCategory(null);
          setSelectedTopic(null);
        }
        if (selectedDept) fetchDepartmentCategories(selectedDept);
      }
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const handleToggleCategoryPublish = async (cat, e) => {
    if (e) e.stopPropagation();
    try {
      const newStatus = cat.status === 'published' ? 'draft' : 'published';
      const res = await api.updateCategory(cat._id, { status: newStatus });
      if (res.success && selectedDept) {
        fetchDepartmentCategories(selectedDept);
      }
    } catch (err) {
      console.error('Error toggling category status:', err);
    }
  };

  // ==========================================
  // Company Management Handlers (Company Preparation)
  // ==========================================
  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setCompanyForm({
      name: '',
      description: '',
      logoUrl: '',
      status: 'published',
      order: companies.length + 1
    });
    setIsCompanyModalOpen(true);
  };

  const handleOpenEditCompany = (company, e) => {
    if (e) e.stopPropagation();
    setEditingCompany(company);
    setCompanyForm({
      name: company.name,
      description: company.description || '',
      logoUrl: company.logoUrl || '',
      status: company.status || 'published',
      order: company.order || 0
    });
    setIsCompanyModalOpen(true);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let res;
      if (editingCompany) {
        res = await api.updateCompany(editingCompany._id, companyForm);
      } else {
        res = await api.createCompany(companyForm);
      }

      if (res.success) {
        setIsCompanyModalOpen(false);
        setEditingCompany(null);
        fetchCompanies();
        if (selectedCompany && editingCompany && selectedCompany._id === editingCompany._id) {
          setSelectedCompany(res.company);
        }
      }
    } catch (err) {
      console.error('Error saving company:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!deleteConfirm.item) return;
    try {
      const res = await api.deleteCompany(deleteConfirm.item._id);
      if (res.success) {
        setDeleteConfirm({ open: false, type: null, item: null });
        if (selectedCompany && selectedCompany._id === deleteConfirm.item._id) {
          setSelectedCompany(null);
          setSelectedTopic(null);
        }
        fetchCompanies();
      }
    } catch (err) {
      console.error('Error deleting company:', err);
    }
  };

  const handleToggleCompanyPublish = async (comp, e) => {
    if (e) e.stopPropagation();
    try {
      const newStatus = comp.status === 'published' ? 'draft' : 'published';
      const res = await api.updateCompany(comp._id, { status: newStatus });
      if (res.success) {
        fetchCompanies();
      }
    } catch (err) {
      console.error('Error toggling company publish status:', err);
    }
  };

  // ==========================================
  // Topic Management Handlers
  // ==========================================
  const handleOpenAddTopic = () => {
    setEditingTopic(null);
    if (isDomainModule) {
      setTopicForm({
        title: '',
        description: '',
        category: selectedDomainCategory ? selectedDomainCategory.title : '',
        categoryId: selectedDomainCategory ? selectedDomainCategory._id : null,
        company: '',
        companyId: null,
        department: selectedDept,
        status: 'published',
        order: topics.length + 1
      });
    } else if (isCommunicationModule) {
      setTopicForm({
        title: '',
        description: '',
        category: selectedCommCategory ? selectedCommCategory.title : '',
        categoryId: selectedCommCategory ? selectedCommCategory._id : null,
        company: '',
        companyId: null,
        department: null,
        status: 'published',
        order: commTopics.length + 1
      });
    } else if (isResumeModule) {
      setTopicForm({
        title: '',
        description: '',
        category: selectedResumeCategory ? selectedResumeCategory.title : '',
        categoryId: selectedResumeCategory ? selectedResumeCategory._id : null,
        company: '',
        companyId: null,
        department: null,
        status: 'published',
        order: resumeTopics.length + 1
      });
    } else if (isInterviewModule) {
      if (selectedCompany) {
        setTopicForm({
          title: '',
          description: '',
          category: 'Company Preparation',
          categoryId: selectedInterviewCategory ? selectedInterviewCategory._id : null,
          company: selectedCompany.name,
          companyId: selectedCompany._id,
          department: null,
          status: 'published',
          order: companyTopics.length + 1
        });
      } else {
        setTopicForm({
          title: '',
          description: '',
          category: selectedInterviewCategory ? selectedInterviewCategory.title : '',
          categoryId: selectedInterviewCategory ? selectedInterviewCategory._id : null,
          company: '',
          companyId: null,
          department: null,
          status: 'published',
          order: interviewTopics.length + 1
        });
      }
    } else {
      setTopicForm({
        title: '',
        description: '',
        category: activeCategory !== 'All' ? activeCategory : (availableCategories[0]?.id || 'Quantitative'),
        categoryId: null,
        company: '',
        companyId: null,
        department: null,
        status: 'published',
        order: topics.length + 1
      });
    }
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (topic, e) => {
    if (e) e.stopPropagation();
    setEditingTopic(topic);
    setTopicForm({
      title: topic.title,
      description: topic.description || '',
      category: topic.category || (selectedDomainCategory ? selectedDomainCategory.title : (selectedCommCategory ? selectedCommCategory.title : (selectedResumeCategory ? selectedResumeCategory.title : (selectedInterviewCategory ? selectedInterviewCategory.title : activeCategory)))),
      categoryId: topic.categoryId || (selectedDomainCategory ? selectedDomainCategory._id : (selectedCommCategory ? selectedCommCategory._id : (selectedResumeCategory ? selectedResumeCategory._id : (selectedInterviewCategory ? selectedInterviewCategory._id : null)))),
      company: topic.company || (selectedCompany ? selectedCompany.name : ''),
      companyId: topic.companyId || (selectedCompany ? selectedCompany._id : null),
      department: topic.department || selectedDept,
      status: topic.status || 'published',
      order: topic.order || 0
    });
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let payload;
      if (isCommunicationModule) {
        payload = {
          ...topicForm,
          module: 'Communication',
          department: null,
          departmentId: null,
          categoryId: selectedCommCategory ? selectedCommCategory._id : topicForm.categoryId,
          category: selectedCommCategory ? selectedCommCategory.title : topicForm.category
        };
      } else if (isResumeModule) {
        payload = {
          ...topicForm,
          module: 'Resume',
          department: null,
          departmentId: null,
          categoryId: selectedResumeCategory ? selectedResumeCategory._id : topicForm.categoryId,
          category: selectedResumeCategory ? selectedResumeCategory.title : topicForm.category
        };
      } else if (isInterviewModule) {
        payload = {
          ...topicForm,
          module: 'Interview Preparation',
          department: null,
          departmentId: null,
          categoryId: selectedInterviewCategory ? selectedInterviewCategory._id : topicForm.categoryId,
          category: selectedInterviewCategory ? selectedInterviewCategory.title : (topicForm.category || 'Interview Preparation'),
          companyId: selectedCompany ? selectedCompany._id : (topicForm.companyId || null),
          company: selectedCompany ? selectedCompany.name : (topicForm.company || '')
        };
      } else {
        payload = {
          ...topicForm,
          module: isDomainModule ? 'Domain' : 'Aptitude',
          department: isDomainModule ? (selectedDept || topicForm.department) : null,
          departmentId: isDomainModule ? (selectedDept || topicForm.department) : null,
          categoryId: isDomainModule ? (selectedDomainCategory ? selectedDomainCategory._id : topicForm.categoryId) : null,
          category: isDomainModule ? (selectedDomainCategory ? selectedDomainCategory.title : topicForm.category) : topicForm.category
        };
      }

      let res;
      if (editingTopic) {
        res = await api.updateTopic(editingTopic._id, payload);
      } else {
        res = await api.createTopic(payload);
      }

      if (res.success) {
        setIsTopicModalOpen(false);
        setEditingTopic(null);
        if (isCommunicationModule && selectedCommCategory) {
          fetchCommTopics(selectedCommCategory._id);
        } else if (isResumeModule && selectedResumeCategory) {
          fetchResumeTopics(selectedResumeCategory._id);
        } else if (isInterviewModule) {
          if (selectedCompany) fetchCompanyTopics(selectedCompany._id);
          else if (selectedInterviewCategory) fetchInterviewTopics(selectedInterviewCategory._id);
        } else if (isDomainModule && selectedDomainCategory) {
          fetchDomainCategoryTopics(selectedDomainCategory._id);
        } else {
          fetchAptitudeTopics();
        }
        if (selectedTopic && editingTopic && selectedTopic._id === editingTopic._id) {
          setSelectedTopic(res.topic);
        }
      }
    } catch (err) {
      console.error('Error saving topic:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!deleteConfirm.item) return;
    try {
      const res = await api.deleteTopic(deleteConfirm.item._id);
      if (res.success) {
        setDeleteConfirm({ open: false, type: null, item: null });
        if (selectedTopic && selectedTopic._id === deleteConfirm.item._id) {
          setSelectedTopic(null);
        }
        if (isCommunicationModule && selectedCommCategory) {
          fetchCommTopics(selectedCommCategory._id);
        } else if (isResumeModule && selectedResumeCategory) {
          fetchResumeTopics(selectedResumeCategory._id);
        } else if (isInterviewModule) {
          if (selectedCompany) fetchCompanyTopics(selectedCompany._id);
          else if (selectedInterviewCategory) fetchInterviewTopics(selectedInterviewCategory._id);
        } else if (isDomainModule && selectedDomainCategory) {
          fetchDomainCategoryTopics(selectedDomainCategory._id);
        } else {
          fetchAptitudeTopics();
        }
      }
    } catch (err) {
      console.error('Error deleting topic:', err);
    }
  };

  // ==========================================
  // Video Management Handlers
  // ==========================================
  const handleOpenAddVideo = () => {
    setEditingVideo(null);
    setPreviewData(null);
    setFetchError('');
    let cat = activeCategory;
    if (isDomainModule) cat = selectedDomainCategory ? selectedDomainCategory.title : '';
    else if (isCommunicationModule) cat = selectedCommCategory ? selectedCommCategory.title : '';
    else if (isResumeModule) cat = selectedResumeCategory ? selectedResumeCategory.title : '';
    else if (isInterviewModule) cat = selectedInterviewCategory ? selectedInterviewCategory.title : 'HR Interview';
    else if (selectedTopic) cat = selectedTopic.category;
    setVideoForm({
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      difficulty: 'Beginner',
      status: 'published',
      category: cat
    });
    setIsVideoModalOpen(true);
  };

  const handleOpenEditVideo = (video) => {
    setEditingVideo(video);
    setPreviewData(null);
    setFetchError('');
    setVideoForm({
      title: video.title,
      description: video.description || '',
      videoUrl: video.videoUrl || video.resourceUrl || '',
      thumbnailUrl: video.thumbnailUrl || '',
      difficulty: video.difficulty || 'Beginner',
      status: video.status || 'published',
      category: video.category || (selectedDomainCategory ? selectedDomainCategory.title : activeCategory)
    });
    setIsVideoModalOpen(true);
  };

  const handleFetchVideoDetails = async () => {
    if (!videoForm.videoUrl || !videoForm.videoUrl.trim()) {
      setFetchError('Please enter a valid video URL first.');
      return;
    }

    setDetecting(true);
    setFetchError('');
    setPreviewData(null);

    try {
      const res = await api.previewMetadata(videoForm.videoUrl.trim());
      if (res.success && res.metadata) {
        const meta = res.metadata;
        setPreviewData(meta);
        setVideoForm((prev) => ({
          ...prev,
          title: prev.title || meta.title,
          description: prev.description || meta.description,
          thumbnailUrl: meta.thumbnailUrl
        }));
      } else {
        setFetchError(res.message || 'Unable to fetch video details.');
      }
    } catch (err) {
      setFetchError('Unable to fetch video information. Please verify the URL.');
    } finally {
      setDetecting(false);
    }
  };

  const handleSaveVideo = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let payload;
      if (isCommunicationModule) {
        payload = {
          ...videoForm,
          module: 'Communication',
          resourceType: 'video',
          contentType: 'video',
          topicId: selectedTopic ? selectedTopic._id : undefined,
          topic: selectedTopic ? selectedTopic.title : undefined,
          categoryId: selectedCommCategory ? selectedCommCategory._id : undefined,
          category: selectedCommCategory ? selectedCommCategory.title : videoForm.category,
          department: null,
          departmentId: null
        };
      } else if (isResumeModule) {
        payload = {
          ...videoForm,
          module: 'Resume',
          resourceType: 'video',
          contentType: 'video',
          topicId: selectedTopic ? selectedTopic._id : undefined,
          topic: selectedTopic ? selectedTopic.title : undefined,
          categoryId: selectedResumeCategory ? selectedResumeCategory._id : undefined,
          category: selectedResumeCategory ? selectedResumeCategory.title : videoForm.category,
          department: null,
          departmentId: null
        };
      } else if (isInterviewModule) {
        payload = {
          ...videoForm,
          module: 'Interview Preparation',
          resourceType: 'video',
          contentType: 'video',
          topicId: selectedTopic ? selectedTopic._id : undefined,
          topic: selectedTopic ? selectedTopic.title : undefined,
          categoryId: selectedInterviewCategory ? selectedInterviewCategory._id : (selectedTopic ? selectedTopic.categoryId : undefined),
          category: selectedInterviewCategory ? selectedInterviewCategory.title : (selectedTopic ? selectedTopic.category : videoForm.category),
          companyId: selectedCompany ? selectedCompany._id : (selectedTopic ? selectedTopic.companyId : undefined),
          company: selectedCompany ? selectedCompany.name : (selectedTopic ? selectedTopic.company : undefined),
          department: null,
          departmentId: null
        };
      } else {
        payload = {
          ...videoForm,
          module: isDomainModule ? 'Domain' : currentModule,
          resourceType: 'video',
          contentType: 'video',
          topicId: selectedTopic ? selectedTopic._id : undefined,
          topic: selectedTopic ? selectedTopic.title : undefined,
          categoryId: isDomainModule ? (selectedDomainCategory ? selectedDomainCategory._id : undefined) : undefined,
          category: isDomainModule
            ? (selectedDomainCategory ? selectedDomainCategory.title : videoForm.category)
            : (selectedTopic ? selectedTopic.category : (videoForm.category || activeCategory)),
          department: isDomainModule ? selectedDept : undefined,
          departmentId: isDomainModule ? selectedDept : undefined
        };
      }

      let res;
      if (editingVideo) {
        res = await api.updateContent(editingVideo._id, payload);
      } else {
        res = await api.createContent(payload);
      }

      if (res.success) {
        setIsVideoModalOpen(false);
        setEditingVideo(null);
        if (selectedTopic) {
          const mod = isInterviewModule ? 'Interview Preparation' : (isResumeModule ? 'Resume' : (isCommunicationModule ? 'Communication' : (isDomainModule ? 'Domain' : 'Aptitude')));
          fetchTopicContents(selectedTopic._id, mod);
        } else {
          fetchNonAptitudeContents();
        }
      }
    } catch (err) {
      console.error('Error saving video:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // PDF Notes Management Handlers (Max 5MB Limit)
  // ==========================================
  const handleOpenAddNote = () => {
    setEditingNote(null);
    setPdfError('');
    let cat = activeCategory;
    if (isDomainModule) cat = selectedDomainCategory ? selectedDomainCategory.title : '';
    else if (isCommunicationModule) cat = selectedCommCategory ? selectedCommCategory.title : '';
    else if (isResumeModule) cat = selectedResumeCategory ? selectedResumeCategory.title : '';
    else if (isInterviewModule) cat = selectedInterviewCategory ? selectedInterviewCategory.title : 'HR Interview';
    else if (selectedTopic) cat = selectedTopic.category;
    setNoteForm({
      title: '',
      description: '',
      pdfUrl: '',
      fileName: '',
      fileSize: '',
      difficulty: 'Beginner',
      status: 'published',
      category: cat
    });
    setIsNoteModalOpen(true);
  };

  const handleOpenEditNote = (note) => {
    setEditingNote(note);
    setPdfError('');
    setNoteForm({
      title: note.title,
      description: note.description || '',
      pdfUrl: note.pdfUrl || note.resourceUrl || '',
      fileName: note.fileName || 'document.pdf',
      fileSize: note.fileSize || '',
      difficulty: note.difficulty || 'Beginner',
      status: note.status || 'published',
      category: note.category || (selectedDomainCategory ? selectedDomainCategory.title : (selectedCommCategory ? selectedCommCategory.title : (selectedResumeCategory ? selectedResumeCategory.title : (selectedInterviewCategory ? selectedInterviewCategory.title : activeCategory))))
    });
    setIsNoteModalOpen(true);
  };

  const handlePdfFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfError('');

    // Strict PDF check
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Only PDF files (.pdf) are supported. Please select a valid PDF.');
      return;
    }

    // Strict 5MB limit check (5 * 1024 * 1024 bytes)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setPdfError(`File size (${sizeMB} MB) exceeds the 5MB limit. Please upload a PDF up to 5MB.`);
      return;
    }

    const readableSize =
      file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    const reader = new FileReader();
    reader.onload = () => {
      setNoteForm((prev) => ({
        ...prev,
        pdfUrl: reader.result,
        fileName: file.name,
        fileSize: readableSize,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '')
      }));
    };
    reader.onerror = () => {
      setPdfError('Error reading PDF file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    setPdfError('');

    if (!noteForm.pdfUrl) {
      setPdfError('Please select a PDF document (up to 5MB) for this study note.');
      return;
    }

    setSubmitting(true);
    try {
      let payload;
      if (isCommunicationModule) {
        payload = {
          ...noteForm,
          module: 'Communication',
          resourceType: 'note',
          contentType: 'note',
          resourceUrl: noteForm.pdfUrl,
          topicId: selectedTopic ? selectedTopic._id : undefined,
          topic: selectedTopic ? selectedTopic.title : undefined,
          categoryId: selectedCommCategory ? selectedCommCategory._id : undefined,
          category: selectedCommCategory ? selectedCommCategory.title : noteForm.category,
          department: null,
          departmentId: null
        };
      } else if (isResumeModule) {
        payload = {
          ...noteForm,
          module: 'Resume',
          resourceType: 'note',
          contentType: 'note',
          resourceUrl: noteForm.pdfUrl,
          topicId: selectedTopic ? selectedTopic._id : undefined,
          topic: selectedTopic ? selectedTopic.title : undefined,
          categoryId: selectedResumeCategory ? selectedResumeCategory._id : undefined,
          category: selectedResumeCategory ? selectedResumeCategory.title : noteForm.category,
          department: null,
          departmentId: null
        };
      } else if (isInterviewModule) {
        payload = {
          ...noteForm,
          module: 'Interview Preparation',
          resourceType: 'note',
          contentType: 'note',
          resourceUrl: noteForm.pdfUrl,
          topicId: selectedTopic ? selectedTopic._id : undefined,
          topic: selectedTopic ? selectedTopic.title : undefined,
          categoryId: selectedInterviewCategory ? selectedInterviewCategory._id : (selectedTopic ? selectedTopic.categoryId : undefined),
          category: selectedInterviewCategory ? selectedInterviewCategory.title : (selectedTopic ? selectedTopic.category : noteForm.category),
          companyId: selectedCompany ? selectedCompany._id : (selectedTopic ? selectedTopic.companyId : undefined),
          company: selectedCompany ? selectedCompany.name : (selectedTopic ? selectedTopic.company : undefined),
          department: null,
          departmentId: null
        };
      } else {
        payload = {
          ...noteForm,
          module: isDomainModule ? 'Domain' : currentModule,
          resourceType: 'note',
          contentType: 'note',
          resourceUrl: noteForm.pdfUrl,
          topicId: selectedTopic ? selectedTopic._id : undefined,
          topic: selectedTopic ? selectedTopic.title : undefined,
          categoryId: isDomainModule ? (selectedDomainCategory ? selectedDomainCategory._id : undefined) : undefined,
          category: isDomainModule
            ? (selectedDomainCategory ? selectedDomainCategory.title : noteForm.category)
            : (selectedTopic ? selectedTopic.category : (noteForm.category || activeCategory)),
          department: isDomainModule ? selectedDept : undefined,
          departmentId: isDomainModule ? selectedDept : undefined
        };
      }

      let res;
      if (editingNote) {
        res = await api.updateContent(editingNote._id, payload);
      } else {
        res = await api.createContent(payload);
      }

      if (res.success) {
        setIsNoteModalOpen(false);
        setEditingNote(null);
        if (selectedTopic) {
          const mod = isInterviewModule ? 'Interview Preparation' : (isResumeModule ? 'Resume' : (isCommunicationModule ? 'Communication' : (isDomainModule ? 'Domain' : 'Aptitude')));
          fetchTopicContents(selectedTopic._id, mod);
        }
      } else {
        setPdfError(res.message || 'Unable to save study note PDF.');
      }
    } catch (err) {
      console.error('Error saving note:', err);
      setPdfError('Error saving study note PDF.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (item, resourceType) => {
    try {
      const newStatus = item.status === 'published' ? 'draft' : 'published';
      let res;
      if (resourceType === 'topic') {
        res = await api.updateTopic(item._id, { status: newStatus });
        if (res.success) {
          if (isInterviewModule) {
            if (selectedCompany) fetchCompanyTopics(selectedCompany._id);
            else if (selectedInterviewCategory) fetchInterviewTopics(selectedInterviewCategory._id);
          } else if (isCommunicationModule && selectedCommCategory) {
            fetchCommTopics(selectedCommCategory._id);
          } else if (isResumeModule && selectedResumeCategory) {
            fetchResumeTopics(selectedResumeCategory._id);
          } else if (isDomainModule && selectedDomainCategory) {
            fetchDomainCategoryTopics(selectedDomainCategory._id);
          } else {
            fetchAptitudeTopics();
          }
        }
      } else {
        res = await api.updateContent(item._id, { status: newStatus });
        if (res.success) {
          if (selectedTopic) {
            const mod = isInterviewModule ? 'Interview Preparation' : (isResumeModule ? 'Resume' : (isCommunicationModule ? 'Communication' : (isDomainModule ? 'Domain' : 'Aptitude')));
            fetchTopicContents(selectedTopic._id, mod);
          } else fetchNonAptitudeContents();
        }
      }
    } catch (err) {
      console.error('Error toggling publish status:', err);
    }
  };

  const handleDeleteContent = async () => {
    if (!deleteConfirm.item) return;
    try {
      const res = await api.deleteContent(deleteConfirm.item._id);
      if (res.success) {
        setDeleteConfirm({ open: false, type: null, item: null });
        if (selectedTopic) {
          const mod = isInterviewModule ? 'Interview Preparation' : (isResumeModule ? 'Resume' : (isCommunicationModule ? 'Communication' : (isDomainModule ? 'Domain' : 'Aptitude')));
          fetchTopicContents(selectedTopic._id, mod);
        } else fetchNonAptitudeContents();
      }
    } catch (err) {
      console.error('Error deleting content:', err);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.type === 'category') handleDeleteCategory();
    else if (deleteConfirm.type === 'company') handleDeleteCompany();
    else if (deleteConfirm.type === 'topic') handleDeleteTopic();
    else if (deleteConfirm.type === 'video' || deleteConfirm.type === 'note') handleDeleteContent();
  };

  // Filtered categories/topics/contents by search
  const filteredDepartments = DEPARTMENT_DETAILS.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.code.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  });

  const filteredDomainCategories = domainCategories.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
  });

  const filteredTopics = topics.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
  });

  const filteredInterviewCategories = interviewCategories.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
  });

  const filteredInterviewTopics = interviewTopics.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
  });

  const filteredCompanies = companies.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
  });

  const filteredCompanyTopics = companyTopics.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
  });

  const videoContents = contents.filter((c) => c.resourceType !== 'note');
  const noteContents = contents.filter((c) => c.resourceType === 'note');

  const filteredVideos = videoContents.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
  });

  const filteredNotes = noteContents.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.fileName?.toLowerCase().includes(q)
    );
  });

  const activeCategoryObj = availableCategories.find((c) => c.id === activeCategory);
  const activeCategoryLabel = activeCategoryObj ? activeCategoryObj.label : activeCategory;
  const currentDeptObj = selectedDept ? getDepartmentDetails(selectedDept) : null;

  // Compute Page Header details
  const getHeaderProps = () => {
    if (isDomainModule) {
      if (selectedTopic) {
        return {
          title: `${selectedTopic.title} • Resources`,
          subtitle: `Manage video lectures and PDF study notes for ${selectedTopic.title} in ${selectedDomainCategory?.title} (${currentDeptObj?.code}).`,
          breadcrumbs: [
            { label: 'Admin', link: '/admin/dashboard' },
            { label: 'Training', onClick: () => { setSelectedDept(null); setSelectedDomainCategory(null); setSelectedTopic(null); } },
            { label: 'Domain', onClick: () => { setSelectedDept(null); setSelectedDomainCategory(null); setSelectedTopic(null); } },
            { label: currentDeptObj?.code || selectedDept, onClick: () => { setSelectedTopic(null); } },
            { label: selectedDomainCategory?.title || 'Category', onClick: () => { setSelectedTopic(null); } },
            { label: selectedTopic.title }
          ],
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setSelectedTopic(null)}
              >
                Back to Topics
              </Button>
              {activeTopicTab === 'videos' ? (
                <Button size="md" icon={Plus} onClick={handleOpenAddVideo}>
                  Add Video
                </Button>
              ) : (
                <Button size="md" icon={Plus} onClick={handleOpenAddNote}>
                  Add Study Note (PDF)
                </Button>
              )}
            </div>
          )
        };
      }
      if (selectedDomainCategory) {
        return {
          title: `${selectedDomainCategory.title} • Topics`,
          subtitle: `Manage placement topics, structured syllabus, and learning resources under ${selectedDomainCategory.title} for ${currentDeptObj?.name}.`,
          breadcrumbs: [
            { label: 'Admin', link: '/admin/dashboard' },
            { label: 'Training', onClick: () => { setSelectedDept(null); setSelectedDomainCategory(null); } },
            { label: 'Domain', onClick: () => { setSelectedDept(null); setSelectedDomainCategory(null); } },
            { label: currentDeptObj?.code || selectedDept, onClick: () => setSelectedDomainCategory(null) },
            { label: selectedDomainCategory.title }
          ],
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setSelectedDomainCategory(null)}
              >
                Back to Categories
              </Button>
              <Button size="md" icon={Plus} onClick={handleOpenAddTopic}>
                Add Topic
              </Button>
            </div>
          )
        };
      }
      if (selectedDept) {
        return {
          title: `${currentDeptObj?.name || selectedDept}`,
          subtitle: `Manage placement training categories and core engineering/management curriculum for ${currentDeptObj?.code}.`,
          breadcrumbs: [
            { label: 'Admin', link: '/admin/dashboard' },
            { label: 'Training', onClick: () => setSelectedDept(null) },
            { label: 'Domain', onClick: () => setSelectedDept(null) },
            { label: currentDeptObj?.code || selectedDept }
          ],
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setSelectedDept(null)}
              >
                Back to Departments
              </Button>
              <Button size="md" icon={Plus} onClick={handleOpenAddCategory}>
                Add Category
              </Button>
            </div>
          )
        };
      }
      return {
        title: 'Domain Knowledge Management',
        subtitle: 'Configure specialized engineering & management curriculum across all 9 official academic departments.',
        breadcrumbs: [
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Training' },
          { label: 'Domain Knowledge' }
        ],
        actions: null
      };
    }

    // ==========================================
    // COMMUNICATION MODULE HEADERS
    // ==========================================
    if (isCommunicationModule) {
      if (selectedTopic && selectedCommCategory) {
        return {
          title: `${selectedTopic.title} • Topic Resources`,
          subtitle: `Manage video lectures and PDF study notes for ${selectedTopic.title} under ${selectedCommCategory.title}.`,
          breadcrumbs: [
            { label: 'Admin', link: '/admin/dashboard' },
            { label: 'Training' },
            { label: 'Communication', onClick: () => { setSelectedCommCategory(null); setSelectedTopic(null); } },
            { label: selectedCommCategory.title, onClick: () => setSelectedTopic(null) },
            { label: selectedTopic.title }
          ],
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setSelectedTopic(null)}
              >
                Back to Topics
              </Button>
              {activeTopicTab === 'videos' ? (
                <Button size="md" icon={Plus} onClick={handleOpenAddVideo}>
                  Add Video
                </Button>
              ) : (
                <Button size="md" icon={Plus} onClick={handleOpenAddNote}>
                  Add Study Note (PDF)
                </Button>
              )}
            </div>
          )
        };
      }
      if (selectedCommCategory) {
        return {
          title: `${selectedCommCategory.title} • Topics`,
          subtitle: `Manage communication topics, video lessons, and PDF study notes for ${selectedCommCategory.title}.`,
          breadcrumbs: [
            { label: 'Admin', link: '/admin/dashboard' },
            { label: 'Training' },
            { label: 'Communication', onClick: () => setSelectedCommCategory(null) },
            { label: selectedCommCategory.title }
          ],
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setSelectedCommCategory(null)}
              >
                Back to Categories
              </Button>
              <Button size="md" icon={Plus} onClick={handleOpenAddTopic}>
                Add Topic
              </Button>
            </div>
          )
        };
      }
      return {
        title: 'Communication Training Management',
        subtitle: 'Manage Grammar, Vocabulary, Speaking, Listening, and Business Communication topics, videos, and PDF notes.',
        breadcrumbs: [
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Training' },
          { label: 'Communication' }
        ],
        actions: null
      };
    }

    // ==========================================
    // RESUME MODULE HEADERS
    // ==========================================
    if (isResumeModule) {
      if (selectedTopic && selectedResumeCategory) {
        return {
          title: `${selectedTopic.title} • Topic Resources`,
          subtitle: `Manage video guides and PDF study notes for ${selectedTopic.title} under ${selectedResumeCategory.title}.`,
          breadcrumbs: [
            { label: 'Admin', link: '/admin/dashboard' },
            { label: 'Training' },
            { label: 'Resume', onClick: () => { setSelectedResumeCategory(null); setSelectedTopic(null); } },
            { label: selectedResumeCategory.title, onClick: () => setSelectedTopic(null) },
            { label: selectedTopic.title }
          ],
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setSelectedTopic(null)}
              >
                Back to Topics
              </Button>
              {activeTopicTab === 'videos' ? (
                <Button size="md" icon={Plus} onClick={handleOpenAddVideo}>
                  Add Video
                </Button>
              ) : (
                <Button size="md" icon={Plus} onClick={handleOpenAddNote}>
                  Add Study Note (PDF)
                </Button>
              )}
            </div>
          )
        };
      }
      if (selectedResumeCategory) {
        return {
          title: `${selectedResumeCategory.title} • Topics`,
          subtitle: `Manage resume topics, video lessons, and PDF templates for ${selectedResumeCategory.title}.`,
          breadcrumbs: [
            { label: 'Admin', link: '/admin/dashboard' },
            { label: 'Training' },
            { label: 'Resume', onClick: () => setSelectedResumeCategory(null) },
            { label: selectedResumeCategory.title }
          ],
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setSelectedResumeCategory(null)}
              >
                Back to Categories
              </Button>
              <Button size="md" icon={Plus} onClick={handleOpenAddTopic}>
                Add Topic
              </Button>
            </div>
          )
        };
      }
      return {
        title: 'Resume Training Management',
        subtitle: 'Manage Resume Building, ATS Resume, Projects, and Resume Examples topics, videos, and PDF notes.',
        breadcrumbs: [
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Training' },
          { label: 'Resume' }
        ],
        actions: null
      };
    }

    // ==========================================
    // INTERVIEW PREPARATION MODULE HEADERS
    // ==========================================
    if (isInterviewModule) {
      if (selectedTopic && selectedCompany) {
        return {
          title: `${selectedTopic.title} • ${selectedCompany.name}`,
          subtitle: `Manage video lessons and study notes for ${selectedTopic.title} under ${selectedCompany.name} Company Preparation.`,
          breadcrumbs: [
            { label: 'Admin', link: '/admin/dashboard' },
            { label: 'Training' },
            { label: 'Interview Preparation', onClick: () => { setSelectedInterviewCategory(null); setSelectedCompany(null); setSelectedTopic(null); } },
            { label: 'Company Preparation', onClick: () => { setSelectedCompany(null); setSelectedTopic(null); } },
            { label: selectedCompany.name, onClick: () => setSelectedTopic(null) },
            { label: selectedTopic.title }
          ],
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setSelectedTopic(null)}
              >
                Back to Topics
              </Button>
              {activeTopicTab === 'videos' ? (
                <Button size="md" icon={Plus} onClick={handleOpenAddVideo}>
                  Add Video
                </Button>
              ) : (
                <Button size="md" icon={Plus} onClick={handleOpenAddNote}>
                  Add Study Note (PDF)
                </Button>
              )}
            </div>
          )
        };
      }
      if (selectedTopic && selectedInterviewCategory) {
        return {
          title: `${selectedTopic.title} • ${selectedInterviewCategory.title}`,
          subtitle: `Manage video lessons and study notes for ${selectedTopic.title} under ${selectedInterviewCategory.title}.`,
          breadcrumbs: [
            { label: 'Admin', link: '/admin/dashboard' },
            { label: 'Training' },
            { label: 'Interview Preparation', onClick: () => { setSelectedInterviewCategory(null); setSelectedTopic(null); } },
            { label: selectedInterviewCategory.title, onClick: () => setSelectedTopic(null) },
            { label: selectedTopic.title }
          ],
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setSelectedTopic(null)}
              >
                Back to Topics
              </Button>
              {activeTopicTab === 'videos' ? (
                <Button size="md" icon={Plus} onClick={handleOpenAddVideo}>
                  Add Video
                </Button>
              ) : (
                <Button size="md" icon={Plus} onClick={handleOpenAddNote}>
                  Add Study Note (PDF)
                </Button>
              )}
            </div>
          )
        };
      }
      if (selectedCompany) {
        return {
          title: `${selectedCompany.name} • Preparation Topics`,
          subtitle: `Manage topics, test patterns, technical rounds, and interview tips for ${selectedCompany.name}.`,
          breadcrumbs: [
            { label: 'Admin', link: '/admin/dashboard' },
            { label: 'Training' },
            { label: 'Interview Preparation', onClick: () => { setSelectedInterviewCategory(null); setSelectedCompany(null); } },
            { label: 'Company Preparation', onClick: () => setSelectedCompany(null) },
            { label: selectedCompany.name }
          ],
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setSelectedCompany(null)}
              >
                Back to Companies
              </Button>
              <Button size="md" icon={Plus} onClick={handleOpenAddTopic}>
                Add Topic
              </Button>
            </div>
          )
        };
      }
      if (selectedInterviewCategory) {
        if (selectedInterviewCategory.title === 'Company Preparation') {
          return {
            title: 'Company Preparation • Target Employers',
            subtitle: 'Manage target placement companies, hiring roadmaps, assessment drills, and interview preparation.',
            breadcrumbs: [
              { label: 'Admin', link: '/admin/dashboard' },
              { label: 'Training' },
              { label: 'Interview Preparation', onClick: () => setSelectedInterviewCategory(null) },
              { label: 'Company Preparation' }
            ],
            actions: (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  icon={ArrowLeft}
                  onClick={() => setSelectedInterviewCategory(null)}
                >
                  Back to Categories
                </Button>
                <Button size="md" icon={Plus} onClick={handleOpenAddCompany}>
                  Add Company
                </Button>
              </div>
            )
          };
        }
        return {
          title: `${selectedInterviewCategory.title} • Topics`,
          subtitle: `Manage interview topics, video tutorials, and study notes for ${selectedInterviewCategory.title}.`,
          breadcrumbs: [
            { label: 'Admin', link: '/admin/dashboard' },
            { label: 'Training' },
            { label: 'Interview Preparation', onClick: () => setSelectedInterviewCategory(null) },
            { label: selectedInterviewCategory.title }
          ],
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setSelectedInterviewCategory(null)}
              >
                Back to Categories
              </Button>
              <Button size="md" icon={Plus} onClick={handleOpenAddTopic}>
                Add Topic
              </Button>
            </div>
          )
        };
      }
      return {
        title: 'Interview Preparation Management',
        subtitle: 'Manage HR Interview, Technical Interview, Behavioral Questions, Company Preparation, and Mock Interview curriculum.',
        breadcrumbs: [
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Training' },
          { label: 'Interview Preparation' }
        ],
        actions: null
      };
    }

    // Aptitude & other modules
    if (selectedTopic) {
      return {
        title: `${selectedTopic.title} • Topic Management`,
        subtitle: `Manage verified video lectures and 5MB PDF study notes for ${selectedTopic.title} under ${activeCategoryLabel}.`,
        breadcrumbs: [
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Training' },
          { label: currentModule, onClick: () => setSelectedTopic(null) },
          { label: activeCategoryLabel },
          { label: selectedTopic.title }
        ],
        actions: (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedTopic(null)}
            >
              Back to Topics
            </Button>
            {activeTopicTab === 'videos' ? (
              <Button size="md" icon={Plus} onClick={handleOpenAddVideo}>
                Add Video
              </Button>
            ) : (
              <Button size="md" icon={Plus} onClick={handleOpenAddNote}>
                Add Study Note (PDF)
              </Button>
            )}
          </div>
        )
      };
    }

    return {
      title: `${currentModule} Training Management`,
      subtitle: isAptitudeModule
        ? 'Manage Aptitude topics, video lectures, and PDF study notes organized topic-wise across Quantitative, Reasoning, and Verbal Ability.'
        : `Configure verified video lessons and syllabus resources for ${currentModule}.`,
      breadcrumbs: [
        { label: 'Admin', link: '/admin/dashboard' },
        { label: 'Training' },
        { label: currentModule }
      ],
      actions: isAptitudeModule ? (
        <Button size="md" icon={Plus} onClick={handleOpenAddTopic}>
          Add Topic
        </Button>
      ) : (
        <Button size="md" icon={Plus} onClick={handleOpenAddVideo}>
          Add {currentModule} Video
        </Button>
      )
    };
  };

  const headerProps = getHeaderProps();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={headerProps.title}
        subtitle={headerProps.subtitle}
        breadcrumbs={headerProps.breadcrumbs}
        actions={headerProps.actions}
      />

      {/* ========================================================================= */}
      {/* 1. DOMAIN MODULE - 4-LEVEL HIERARCHY */}
      {/* ========================================================================= */}
      {isDomainModule && (
        <div className="space-y-6">
          {/* LEVEL 1: ALL 9 DEPARTMENTS VIEW */}
          {!selectedDept && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    Official Departments (9)
                  </span>
                </div>
                <div className="w-full sm:w-80">
                  <Input
                    placeholder="Search department code or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {loading ? (
                <LoadingState message="Loading official departments..." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDepartments.map((dept) => {
                    const st = deptStats[dept.id] || { categoryCount: 0, topicCount: 0, videoCount: 0, notesCount: 0 };
                    return (
                      <div
                        key={dept.id}
                        className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl border flex items-center gap-1.5 ${dept.badgeColor}`}>
                              <Building2 className="w-3.5 h-3.5" />
                              {dept.code}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              {st.categoryCount} Categories
                            </span>
                          </div>

                          <h3 className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                            {dept.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {dept.description}
                          </p>

                          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-center">
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="block text-xs font-black text-slate-800">{st.topicCount}</span>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Topics</span>
                            </div>
                            <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100/60">
                              <span className="block text-xs font-black text-blue-700">{st.videoCount}</span>
                              <span className="block text-[10px] font-bold text-blue-500 uppercase">Videos</span>
                            </div>
                            <div className="bg-rose-50/50 p-2 rounded-xl border border-rose-100/60">
                              <span className="block text-xs font-black text-rose-700">{st.notesCount}</span>
                              <span className="block text-[10px] font-bold text-rose-500 uppercase">Notes</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <span>Manage curriculum</span>
                          </span>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={ChevronRight}
                            onClick={() => {
                              setSelectedDept(dept.id);
                              setSearchQuery('');
                            }}
                          >
                            Manage / View
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 2: DEPARTMENT CATEGORIES VIEW */}
          {selectedDept && !selectedDomainCategory && !selectedTopic && (
            <div className="space-y-6">
              {/* Department Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-lg">
                    {currentDeptObj?.code || selectedDept}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-600 uppercase">Domain Department</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-bold text-slate-500">{domainCategories.length} Placement Categories</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">{currentDeptObj?.name}</h2>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {currentDeptObj?.description}
                    </p>
                  </div>
                </div>

                <Button size="md" icon={Plus} onClick={handleOpenAddCategory}>
                  Add Category
                </Button>
              </div>

              {/* Search bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-600">
                  Showing {filteredDomainCategories.length} categories for {currentDeptObj?.code}
                </div>
                <div className="w-full sm:w-72">
                  <Input
                    placeholder={`Search ${currentDeptObj?.code} categories...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {loading ? (
                <LoadingState message={`Loading ${currentDeptObj?.code} categories...`} />
              ) : filteredDomainCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDomainCategories.map((cat) => (
                    <div
                      key={cat._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 flex items-center gap-1.5">
                            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                            {cat.department || currentDeptObj?.code}
                          </span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={cat.status || 'published'} />
                            <button
                              type="button"
                              onClick={(e) => handleToggleCategoryPublish(cat, e)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                              title={cat.status === 'published' ? 'Unpublish Category' : 'Publish Category'}
                            >
                              {cat.status === 'published' ? (
                                <Eye className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                          {cat.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {cat.description || 'Core domain category training curriculum and interview prep.'}
                        </p>

                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <span>{cat.topicCount || 0} Topics</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <Video className="w-4 h-4 text-blue-600" />
                            <span>{cat.videoCount || 0} Videos</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span>{cat.notesCount || 0} Notes</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditCategory(cat, e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ open: true, type: 'category', item: cat });
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Button
                          size="sm"
                          variant="primary"
                          icon={Settings2}
                          onClick={() => {
                            setSelectedDomainCategory(cat);
                            setSearchQuery('');
                          }}
                        >
                          Manage Topics
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={`No Categories in ${currentDeptObj?.code}`}
                  description={`Get started by adding placement training categories for ${currentDeptObj?.name}.`}
                  actionText="Add Category"
                  onAction={handleOpenAddCategory}
                />
              )}
            </div>
          )}

          {/* LEVEL 3: CATEGORY TOPICS VIEW */}
          {selectedDept && selectedDomainCategory && !selectedTopic && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {currentDeptObj?.code} • {selectedDomainCategory.title}
                    </span>
                    <StatusBadge status={selectedDomainCategory.status || 'published'} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedDomainCategory.title} Topics</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {selectedDomainCategory.description || 'Topic breakdown and resources.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => handleOpenEditCategory(selectedDomainCategory)}
                  >
                    Edit Category
                  </Button>
                  <Button size="sm" icon={Plus} onClick={handleOpenAddTopic}>
                    Add Topic
                  </Button>
                </div>
              </div>

              {/* Topics search bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-600">
                  Showing {filteredTopics.length} topics under {selectedDomainCategory.title}
                </div>
                <div className="w-full sm:w-72">
                  <Input
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {loading ? (
                <LoadingState message="Loading topics..." />
              ) : filteredTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTopics.map((topic) => (
                    <div
                      key={topic._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 flex items-center gap-1.5">
                            <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                            {topic.category || selectedDomainCategory.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={topic.status || 'published'} />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePublish(topic, 'topic');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                              title={topic.status === 'published' ? 'Unpublish Topic' : 'Publish Topic'}
                            >
                              {topic.status === 'published' ? (
                                <Eye className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {topic.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {topic.description || 'Topic training modules, video lectures, and PDF study notes.'}
                        </p>

                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Video className="w-4 h-4 text-blue-600" />
                            <span>{topic.videoCount || 0} Videos</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span>{topic.notesCount || 0} PDF Notes</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditTopic(topic, e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Topic Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ open: true, type: 'topic', item: topic });
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Button
                          size="sm"
                          variant="primary"
                          icon={Settings2}
                          onClick={() => {
                            setSelectedTopic(topic);
                            setActiveTopicTab('videos');
                            setSearchQuery('');
                          }}
                        >
                          Manage Topic
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={`No Topics in ${selectedDomainCategory.title}`}
                  description={`Add technical topics for ${selectedDomainCategory.title} under ${currentDeptObj?.code}.`}
                  actionText="Add Topic"
                  onAction={handleOpenAddTopic}
                />
              )}
            </div>
          )}

          {/* LEVEL 4: TOPIC DETAILS (Videos / Notes) */}
          {selectedDept && selectedDomainCategory && selectedTopic && (
            <div className="space-y-6">
              {/* Topic Overview Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {currentDeptObj?.code} • {selectedDomainCategory.title}
                    </span>
                    <StatusBadge status={selectedTopic.status || 'published'} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedTopic.title}</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {selectedTopic.description || 'Topic curriculum and training resources.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => handleOpenEditTopic(selectedTopic)}
                  >
                    Edit Topic Details
                  </Button>
                </div>
              </div>

              {/* Sub-Tabs: Videos & PDF Notes */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('videos')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'videos'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Videos ({videoContents.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('notes')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'notes'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF Notes ({noteContents.length})</span>
                  </button>
                </div>

                <div className="w-full sm:w-64">
                  <Input
                    placeholder={`Search ${activeTopicTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Tab Content 1: VIDEOS */}
              {activeTopicTab === 'videos' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading videos..." />
                  ) : filteredVideos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredVideos.map((video) => (
                        <div
                          key={video._id}
                          className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                        >
                          <div className="relative aspect-video bg-slate-900 overflow-hidden">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                <Video className="w-10 h-10 opacity-50" />
                              </div>
                            )}

                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setActiveVideoPreview(video)}
                                className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110"
                                title="Watch Video Preview"
                              >
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </button>
                            </div>

                            <div className="absolute top-2.5 left-2.5">
                              <StatusBadge status={video.status || 'published'} />
                            </div>
                            <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              {video.difficulty || 'Beginner'}
                            </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 line-clamp-2">
                                {video.title}
                              </h4>
                              {video.description && (
                                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                  {video.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(video, 'video')}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                                title={video.status === 'published' ? 'Unpublish' : 'Publish'}
                              >
                                {video.status === 'published' ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-[11px]">Published</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[11px]">Draft</span>
                                  </>
                                )}
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditVideo(video)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit Video"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm({ open: true, type: 'video', item: video })}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete Video"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No Videos in this Topic"
                      description={`Add external YouTube or Vimeo video lessons for ${selectedTopic.title}.`}
                      actionText="Add Video Lesson"
                      onAction={handleOpenAddVideo}
                    />
                  )}
                </div>
              )}

              {/* Tab Content 2: PDF NOTES (Max 5MB) */}
              {activeTopicTab === 'notes' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading PDF notes..." />
                  ) : filteredNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredNotes.map((note) => (
                        <div
                          key={note._id}
                          className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-all group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-rose-600" />
                                PDF {note.fileSize ? `• ${note.fileSize}` : ''}
                              </span>
                              <StatusBadge status={note.status || 'published'} />
                            </div>

                            <h4 className="font-extrabold text-base text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-2">
                              {note.title}
                            </h4>

                            {note.fileName && (
                              <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                                📄 {note.fileName}
                              </p>
                            )}

                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              {note.description || 'Topic reference note in PDF format.'}
                            </p>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                            <Button
                              size="sm"
                              variant="outline"
                              icon={FileText}
                              onClick={() => setActiveNotePreview(note)}
                            >
                              View PDF
                            </Button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(note, 'note')}
                                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition"
                                title={note.status === 'published' ? 'Unpublish' : 'Publish'}
                              >
                                {note.status === 'published' ? (
                                  <Eye className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditNote(note)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit Note"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ open: true, type: 'note', item: note })}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Note"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No PDF Notes in this Topic"
                      description={`Upload comprehensive study notes in PDF format (max 5MB) for ${selectedTopic.title}.`}
                      actionText="Add Study Note (PDF)"
                      onAction={handleOpenAddNote}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. APTITUDE MODULE */}
      {/* ========================================================================= */}
      {isAptitudeModule && !selectedTopic && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <FilterTabs
              tabs={filterTabs}
              activeTab={activeCategory}
              onTabChange={(catId) => {
                setActiveCategory(catId);
                setSearchQuery('');
              }}
            />

            <div className="w-full lg:w-72">
              <Input
                placeholder={`Search ${activeCategoryLabel} topics...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {loading ? (
            <LoadingState message={`Loading ${activeCategoryLabel} topics...`} />
          ) : filteredTopics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTopics.map((topic) => (
                <div
                  key={topic._id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                        {topic.category || activeCategory}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={topic.status || 'published'} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePublish(topic, 'topic');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                          title={topic.status === 'published' ? 'Unpublish Topic' : 'Publish Topic'}
                        >
                          {topic.status === 'published' ? (
                            <Eye className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {topic.description || 'Topic training modules, video lectures, and PDF study notes.'}
                    </p>

                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Video className="w-4 h-4 text-blue-600" />
                        <span>{topic.videoCount || 0} Videos</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <FileText className="w-4 h-4 text-rose-600" />
                        <span>{topic.notesCount || 0} PDF Notes</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditTopic(topic, e)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Topic Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ open: true, type: 'topic', item: topic });
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Topic"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      icon={Settings2}
                      onClick={() => {
                        setSelectedTopic(topic);
                        setActiveTopicTab('videos');
                      }}
                    >
                      Manage Topic
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No Topics in ${activeCategoryLabel}`}
              description={`Get started by adding syllabus topics under ${activeCategoryLabel}.`}
              actionText="Add Topic"
              onAction={handleOpenAddTopic}
            />
          )}
        </div>
      )}

      {/* APTITUDE TOPIC CONTENT VIEW */}
      {isAptitudeModule && selectedTopic && (
        <div className="space-y-6">
          {/* Topic Overview Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  {selectedTopic.category}
                </span>
                <StatusBadge status={selectedTopic.status || 'published'} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">{selectedTopic.title}</h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {selectedTopic.description || 'Topic curriculum and training content.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                icon={Edit2}
                onClick={() => handleOpenEditTopic(selectedTopic)}
              >
                Edit Topic Details
              </Button>
            </div>
          </div>

          {/* Sub-Tabs: Videos & PDF Notes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTopicTab('videos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                  activeTopicTab === 'videos'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Videos ({videoContents.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTopicTab('notes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                  activeTopicTab === 'notes'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>PDF Notes ({noteContents.length})</span>
              </button>
            </div>

            <div className="w-full sm:w-64">
              <Input
                placeholder={`Search ${activeTopicTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Tab Content 1: VIDEOS */}
          {activeTopicTab === 'videos' && (
            <div>
              {loading ? (
                <LoadingState message="Loading videos..." />
              ) : filteredVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video) => (
                    <div
                      key={video._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div className="relative aspect-video bg-slate-900 overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                            <Video className="w-10 h-10 opacity-50" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setActiveVideoPreview(video)}
                            className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110"
                            title="Watch Video Preview"
                          >
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </button>
                        </div>

                        <div className="absolute top-2.5 left-2.5">
                          <StatusBadge status={video.status || 'published'} />
                        </div>
                        <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {video.difficulty || 'Beginner'}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-2">
                            {video.title}
                          </h4>
                          {video.description && (
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                              {video.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(video, 'video')}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                            title={video.status === 'published' ? 'Unpublish' : 'Publish'}
                          >
                            {video.status === 'published' ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px]">Published</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[11px]">Draft</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditVideo(video)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Video"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ open: true, type: 'video', item: video })}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Video"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Videos in this Topic"
                  description={`Add external YouTube or Vimeo video lessons for ${selectedTopic.title}.`}
                  actionText="Add Video Lesson"
                  onAction={handleOpenAddVideo}
                />
              )}
            </div>
          )}

          {/* Tab Content 2: PDF NOTES (Max 5MB) */}
          {activeTopicTab === 'notes' && (
            <div>
              {loading ? (
                <LoadingState message="Loading PDF notes..." />
              ) : filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNotes.map((note) => (
                    <div
                      key={note._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-rose-600" />
                            PDF {note.fileSize ? `• ${note.fileSize}` : ''}
                          </span>
                          <StatusBadge status={note.status || 'published'} />
                        </div>

                        <h4 className="font-extrabold text-base text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-2">
                          {note.title}
                        </h4>

                        {note.fileName && (
                          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                            📄 {note.fileName}
                          </p>
                        )}

                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {note.description || 'Topic reference note in PDF format.'}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={FileText}
                          onClick={() => setActiveNotePreview(note)}
                        >
                          View PDF
                        </Button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(note, 'note')}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition"
                            title={note.status === 'published' ? 'Unpublish' : 'Publish'}
                          >
                            {note.status === 'published' ? (
                              <Eye className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditNote(note)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Note"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ open: true, type: 'note', item: note })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No PDF Notes in this Topic"
                  description={`Upload comprehensive study notes in PDF format (max 5MB) for ${selectedTopic.title}.`}
                  actionText="Add Study Note (PDF)"
                  onAction={handleOpenAddNote}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COMMUNICATION MODULE - 3-LEVEL HIERARCHY */}
      {/* ========================================================================= */}
      {isCommunicationModule && (
        <div className="space-y-6">

          {/* LEVEL 1: COMMUNICATION CATEGORIES */}
          {!selectedCommCategory && !selectedTopic && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-violet-700 bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-200 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Communication Categories (5)
                  </span>
                </div>
                <div className="w-full sm:w-80">
                  <Input
                    placeholder="Search communication categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {loading ? (
                <LoadingState message="Loading communication categories..." />
              ) : commCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {commCategories
                    .filter((cat) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return cat.title?.toLowerCase().includes(q) || cat.description?.toLowerCase().includes(q);
                    })
                    .map((cat) => (
                    <div
                      key={cat._id}
                      onClick={() => {
                        setSelectedCommCategory(cat);
                        setSearchQuery('');
                      }}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-violet-400 hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-800 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200/60 flex items-center gap-1.5">
                            <FolderOpen className="w-3.5 h-3.5 text-violet-600" />
                            Communication
                          </span>
                          <StatusBadge status={cat.status || 'published'} />
                        </div>

                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-violet-700 transition-colors">
                          {cat.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {cat.description || 'Communication training category.'}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            {cat.topicCount || 0} Topics
                          </span>
                        </div>
                        <span className="text-xs font-bold text-violet-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Manage</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Communication Categories Found"
                  description="Communication categories will be auto-created on server start."
                />
              )}
            </div>
          )}

          {/* LEVEL 2: TOPICS FOR SELECTED COMMUNICATION CATEGORY */}
          {selectedCommCategory && !selectedTopic && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-violet-900 via-purple-900 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-violet-800/40 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-violet-500/30 text-violet-200 px-3 py-1 rounded-xl border border-violet-400/30 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        Communication
                      </span>
                      <span className="text-[11px] font-bold text-slate-300">
                        {commTopics.length} Topics
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{selectedCommCategory.title}</h2>
                    <p className="text-xs text-violet-100/80 mt-1 max-w-2xl leading-relaxed">
                      {selectedCommCategory.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-600">
                  Topics in {selectedCommCategory.title}
                </div>
                <div className="w-full lg:w-72">
                  <Input
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {loading ? (
                <LoadingState message={`Loading ${selectedCommCategory.title} topics...`} />
              ) : commTopics.filter(t => !searchQuery || t.title?.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {commTopics
                    .filter(t => !searchQuery || t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((topic) => (
                    <div
                      key={topic._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-violet-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-800 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200/60 flex items-center gap-1.5">
                            <FolderOpen className="w-3.5 h-3.5 text-violet-600" />
                            {selectedCommCategory.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={topic.status || 'published'} />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePublish(topic, 'topic');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                              title={topic.status === 'published' ? 'Unpublish Topic' : 'Publish Topic'}
                            >
                              {topic.status === 'published' ? (
                                <Eye className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-violet-700 transition-colors">
                          {topic.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {topic.description || 'Communication topic curriculum, video lessons, and study notes.'}
                        </p>

                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Video className="w-4 h-4 text-blue-600" />
                            <span>{topic.videoCount || 0} Videos</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span>{topic.notesCount || 0} PDF Notes</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditTopic(topic, e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Topic Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ open: true, type: 'topic', item: topic });
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Button
                          size="sm"
                          variant="primary"
                          icon={Settings2}
                          onClick={() => {
                            setSelectedTopic(topic);
                            setActiveTopicTab('videos');
                            setSearchQuery('');
                          }}
                        >
                          Manage Topic
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={`No Topics in ${selectedCommCategory.title}`}
                  description={`Add structured communication topics for ${selectedCommCategory.title}.`}
                  actionText="Add Topic"
                  onAction={handleOpenAddTopic}
                />
              )}
            </div>
          )}

          {/* LEVEL 3: TOPIC CONTENT (Videos / Notes) */}
          {selectedCommCategory && selectedTopic && (
            <div className="space-y-6">
              {/* Topic Overview Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-violet-800 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200">
                      Communication • {selectedCommCategory.title}
                    </span>
                    <StatusBadge status={selectedTopic.status || 'published'} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedTopic.title}</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {selectedTopic.description || 'Topic curriculum and training content.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => handleOpenEditTopic(selectedTopic)}
                  >
                    Edit Topic Details
                  </Button>
                </div>
              </div>

              {/* Sub-Tabs: Videos & PDF Notes */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('videos')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'videos'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Videos ({videoContents.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('notes')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'notes'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF Notes ({noteContents.length})</span>
                  </button>
                </div>

                <div className="w-full sm:w-64">
                  <Input
                    placeholder={`Search ${activeTopicTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* VIDEOS TAB */}
              {activeTopicTab === 'videos' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading videos..." />
                  ) : filteredVideos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredVideos.map((video) => (
                        <div
                          key={video._id}
                          className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                        >
                          <div className="relative aspect-video bg-slate-900 overflow-hidden">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                <Video className="w-10 h-10 opacity-50" />
                              </div>
                            )}

                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setActiveVideoPreview(video)}
                                className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110"
                                title="Watch Video Preview"
                              >
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </button>
                            </div>

                            <div className="absolute top-2.5 left-2.5">
                              <StatusBadge status={video.status || 'published'} />
                            </div>
                            <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              {video.difficulty || 'Beginner'}
                            </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{video.title}</h4>
                              {video.description && (
                                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                  {video.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(video, 'video')}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                                title={video.status === 'published' ? 'Unpublish' : 'Publish'}
                              >
                                {video.status === 'published' ? (
                                  <><Eye className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[11px]">Published</span></>
                                ) : (
                                  <><EyeOff className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px]">Draft</span></>
                                )}
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditVideo(video)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit Video"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm({ open: true, type: 'video', item: video })}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete Video"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No Videos in this Topic"
                      description={`Add YouTube or Vimeo video lessons for ${selectedTopic.title}.`}
                      actionText="Add Video Lesson"
                      onAction={handleOpenAddVideo}
                    />
                  )}
                </div>
              )}

              {/* PDF NOTES TAB */}
              {activeTopicTab === 'notes' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading PDF notes..." />
                  ) : filteredNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredNotes.map((note) => (
                        <div
                          key={note._id}
                          className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-all group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-rose-600" />
                                PDF {note.fileSize ? `• ${note.fileSize}` : ''}
                              </span>
                              <StatusBadge status={note.status || 'published'} />
                            </div>

                            <h4 className="font-extrabold text-base text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-2">
                              {note.title}
                            </h4>

                            {note.fileName && (
                              <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                                📄 {note.fileName}
                              </p>
                            )}

                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              {note.description || 'Topic reference note in PDF format.'}
                            </p>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                            <Button
                              size="sm"
                              variant="outline"
                              icon={FileText}
                              onClick={() => setActiveNotePreview(note)}
                            >
                              View PDF
                            </Button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(note, 'note')}
                                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition"
                                title={note.status === 'published' ? 'Unpublish' : 'Publish'}
                              >
                                {note.status === 'published' ? (
                                  <Eye className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditNote(note)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit Note"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ open: true, type: 'note', item: note })}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Note"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No PDF Notes in this Topic"
                      description={`Upload study notes in PDF format (max 5MB) for ${selectedTopic.title}.`}
                      actionText="Add Study Note (PDF)"
                      onAction={handleOpenAddNote}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RESUME MODULE - 3-LEVEL HIERARCHY */}
      {/* ========================================================================= */}
      {isResumeModule && (
        <div className="space-y-6">

          {/* LEVEL 1: RESUME CATEGORIES */}
          {!selectedResumeCategory && !selectedTopic && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Resume Categories (4)
                  </span>
                </div>
                <div className="w-full sm:w-80">
                  <Input
                    placeholder="Search resume categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {loading ? (
                <LoadingState message="Loading resume categories..." />
              ) : resumeCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {resumeCategories
                    .filter((cat) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return cat.title?.toLowerCase().includes(q) || cat.description?.toLowerCase().includes(q);
                    })
                    .map((cat) => (
                    <div
                      key={cat._id}
                      onClick={() => {
                        setSelectedResumeCategory(cat);
                        setSearchQuery('');
                      }}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 flex items-center gap-1.5">
                            <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                            Resume
                          </span>
                          <StatusBadge status={cat.status || 'published'} />
                        </div>

                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {cat.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {cat.description || 'Resume training category.'}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            {cat.topicCount || 0} Topics
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Manage</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Resume Categories Found"
                  description="Resume categories will be auto-created on server start."
                />
              )}
            </div>
          )}

          {/* LEVEL 2: TOPICS FOR SELECTED RESUME CATEGORY */}
          {selectedResumeCategory && !selectedTopic && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-emerald-800/40 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-xl border border-emerald-400/30 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Resume
                      </span>
                      <span className="text-[11px] font-bold text-slate-300">
                        {resumeTopics.length} Topics
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{selectedResumeCategory.title}</h2>
                    <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
                      {selectedResumeCategory.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-600">
                  Topics in {selectedResumeCategory.title}
                </div>
                <div className="w-full lg:w-72">
                  <Input
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {loading ? (
                <LoadingState message={`Loading ${selectedResumeCategory.title} topics...`} />
              ) : resumeTopics.filter(t => !searchQuery || t.title?.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resumeTopics
                    .filter(t => !searchQuery || t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((topic) => (
                    <div
                      key={topic._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 flex items-center gap-1.5">
                            <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                            {selectedResumeCategory.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={topic.status || 'published'} />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePublish(topic, 'topic');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                              title={topic.status === 'published' ? 'Unpublish Topic' : 'Publish Topic'}
                            >
                              {topic.status === 'published' ? (
                                <Eye className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {topic.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {topic.description || 'Resume topic curriculum, video lessons, and study notes.'}
                        </p>

                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Video className="w-4 h-4 text-blue-600" />
                            <span>{topic.videoCount || 0} Videos</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span>{topic.notesCount || 0} PDF Notes</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditTopic(topic, e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Topic Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ open: true, type: 'topic', item: topic });
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Button
                          size="sm"
                          variant="primary"
                          icon={Settings2}
                          onClick={() => {
                            setSelectedTopic(topic);
                            setActiveTopicTab('videos');
                            setSearchQuery('');
                          }}
                        >
                          Manage Topic
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={`No Topics in ${selectedResumeCategory.title}`}
                  description={`Add structured resume topics for ${selectedResumeCategory.title}.`}
                  actionText="Add Topic"
                  onAction={handleOpenAddTopic}
                />
              )}
            </div>
          )}

          {/* LEVEL 3: TOPIC CONTENT (Videos / Notes) */}
          {selectedResumeCategory && selectedTopic && (
            <div className="space-y-6">
              {/* Topic Overview Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      Resume • {selectedResumeCategory.title}
                    </span>
                    <StatusBadge status={selectedTopic.status || 'published'} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedTopic.title}</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {selectedTopic.description || 'Topic curriculum and training content.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => handleOpenEditTopic(selectedTopic)}
                  >
                    Edit Topic Details
                  </Button>
                </div>
              </div>

              {/* Sub-Tabs: Videos & PDF Notes */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('videos')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'videos'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Videos ({videoContents.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('notes')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'notes'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF Notes ({noteContents.length})</span>
                  </button>
                </div>

                <div className="w-full sm:w-64">
                  <Input
                    placeholder={`Search ${activeTopicTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* VIDEOS TAB */}
              {activeTopicTab === 'videos' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading videos..." />
                  ) : filteredVideos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredVideos.map((video) => (
                        <div
                          key={video._id}
                          className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                        >
                          <div className="relative aspect-video bg-slate-900 overflow-hidden">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                <Video className="w-10 h-10 opacity-50" />
                              </div>
                            )}

                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setActiveVideoPreview(video)}
                                className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110"
                                title="Watch Video Preview"
                              >
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </button>
                            </div>

                            <div className="absolute top-2.5 left-2.5">
                              <StatusBadge status={video.status || 'published'} />
                            </div>
                            <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              {video.difficulty || 'Beginner'}
                            </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{video.title}</h4>
                              {video.description && (
                                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                  {video.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(video, 'video')}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                                title={video.status === 'published' ? 'Unpublish' : 'Publish'}
                              >
                                {video.status === 'published' ? (
                                  <><Eye className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[11px]">Published</span></>
                                ) : (
                                  <><EyeOff className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px]">Draft</span></>
                                )}
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditVideo(video)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit Video"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm({ open: true, type: 'video', item: video })}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete Video"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No Videos in this Topic"
                      description={`Add YouTube or Vimeo video lessons for ${selectedTopic.title}.`}
                      actionText="Add Video Lesson"
                      onAction={handleOpenAddVideo}
                    />
                  )}
                </div>
              )}

              {/* PDF NOTES TAB */}
              {activeTopicTab === 'notes' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading PDF notes..." />
                  ) : filteredNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredNotes.map((note) => (
                        <div
                          key={note._id}
                          className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-all group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-rose-600" />
                                PDF {note.fileSize ? `• ${note.fileSize}` : ''}
                              </span>
                              <StatusBadge status={note.status || 'published'} />
                            </div>

                            <h4 className="font-extrabold text-base text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-2">
                              {note.title}
                            </h4>

                            {note.fileName && (
                              <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                                📄 {note.fileName}
                              </p>
                            )}

                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              {note.description || 'Topic reference note in PDF format.'}
                            </p>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                            <Button
                              size="sm"
                              variant="outline"
                              icon={FileText}
                              onClick={() => setActiveNotePreview(note)}
                            >
                              View PDF
                            </Button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(note, 'note')}
                                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition"
                                title={note.status === 'published' ? 'Unpublish' : 'Publish'}
                              >
                                {note.status === 'published' ? (
                                  <Eye className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditNote(note)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit Note"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ open: true, type: 'note', item: note })}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Note"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No PDF Notes in this Topic"
                      description={`Upload study notes in PDF format (max 5MB) for ${selectedTopic.title}.`}
                      actionText="Add Study Note (PDF)"
                      onAction={handleOpenAddNote}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INTERVIEW PREPARATION MODULE - 4-LEVEL HIERARCHY */}
      {/* ========================================================================= */}
      {isInterviewModule && (
        <div className="space-y-6">
          {/* LEVEL 1: 5 FIXED INTERVIEW CATEGORIES */}
          {!selectedInterviewCategory && !selectedTopic && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                    Interview Categories (5)
                  </span>
                </div>
                <div className="w-full sm:w-80">
                  <Input
                    placeholder="Search interview category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {loading ? (
                <LoadingState message="Loading interview categories..." />
              ) : filteredInterviewCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredInterviewCategories.map((cat) => {
                    const getIcon = () => {
                      if (cat.title === 'HR Interview') return UserCheck;
                      if (cat.title === 'Technical Interview') return Code2;
                      if (cat.title === 'Behavioral Questions') return MessageSquare;
                      if (cat.title === 'Company Preparation') return Building2;
                      if (cat.title === 'Mock Interview') return Users;
                      return BookOpen;
                    };
                    const Icon = getIcon();

                    return (
                      <div
                        key={cat._id}
                        onClick={() => {
                          setSelectedInterviewCategory(cat);
                          setSelectedCompany(null);
                          setSelectedTopic(null);
                          setSearchQuery('');
                        }}
                        className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                      >
                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                                <Icon className="w-6 h-6" />
                              </div>
                              <StatusBadge status={cat.status || 'published'} />
                            </div>

                            <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {cat.title}
                            </h3>

                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              {cat.description || 'Master interview questions, patterns, and preparatory resources.'}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-center">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">
                                {cat.title === 'Company Preparation' ? 'Companies' : 'Topics'}
                              </span>
                              <span className="text-sm font-black text-slate-800 mt-0.5">
                                {cat.title === 'Company Preparation' ? (cat.companyCount || companies.length || 10) : (cat.topicCount || 0)}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Videos</span>
                              <span className="text-sm font-black text-blue-600 mt-0.5">{cat.videoCount || 0}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">PDF Notes</span>
                              <span className="text-sm font-black text-rose-600 mt-0.5">{cat.notesCount || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition">
                            {cat.title === 'Company Preparation' ? 'Manage Companies' : 'Manage Topics'}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No Categories Available"
                  description="Interview Preparation categories are initializing..."
                  actionText="Refresh"
                  onAction={fetchInterviewCategories}
                />
              )}
            </div>
          )}

          {/* LEVEL 2 (STANDARD CATEGORIES): TOPICS LIST */}
          {selectedInterviewCategory && selectedInterviewCategory.title !== 'Company Preparation' && !selectedTopic && (
            <div className="space-y-6">
              {/* Category Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                      Interview Preparation
                    </span>
                    <StatusBadge status={selectedInterviewCategory.status || 'published'} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedInterviewCategory.title}</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {selectedInterviewCategory.description || 'Topic breakdown, video lessons, and PDF reference notes.'}
                  </p>
                </div>
              </div>

              {/* Topics Filter & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    Topics ({filteredInterviewTopics.length})
                  </span>
                </div>
                <div className="w-full sm:w-80">
                  <Input
                    placeholder="Search topics in this category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Topics Grid */}
              {loading ? (
                <LoadingState message="Loading interview topics..." />
              ) : filteredInterviewTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredInterviewTopics.map((topic) => (
                    <div
                      key={topic._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                              {selectedInterviewCategory.title}
                            </span>
                            <StatusBadge status={topic.status || 'published'} />
                          </div>

                          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {topic.title}
                          </h3>

                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {topic.description || 'Curriculum breakdown, video lessons, and PDF study notes.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Video className="w-4 h-4 text-blue-600" />
                            <span>{topic.videoCount || 0} Videos</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span>{topic.notesCount || 0} PDF Notes</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditTopic(topic, e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Topic Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ open: true, type: 'topic', item: topic });
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Button
                          size="sm"
                          variant="primary"
                          icon={Settings2}
                          onClick={() => {
                            setSelectedTopic(topic);
                            setActiveTopicTab('videos');
                            setSearchQuery('');
                          }}
                        >
                          Manage Topic
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={`No Topics in ${selectedInterviewCategory.title}`}
                  description={`Add structured interview topics for ${selectedInterviewCategory.title}.`}
                  actionText="Add Topic"
                  onAction={handleOpenAddTopic}
                />
              )}
            </div>
          )}

          {/* LEVEL 2 (COMPANY PREPARATION): COMPANIES LIST */}
          {selectedInterviewCategory && selectedInterviewCategory.title === 'Company Preparation' && !selectedCompany && !selectedTopic && (
            <div className="space-y-6">
              {/* Company Prep Overview Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                      Target Employers
                    </span>
                    <StatusBadge status={selectedInterviewCategory.status || 'published'} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Company Preparation</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Data-driven target companies for campus placements. Manage hiring roadmaps, syllabus, videos, and PDF notes per company.
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    Companies ({filteredCompanies.length})
                  </span>
                </div>
                <div className="w-full sm:w-80">
                  <Input
                    placeholder="Search target company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Companies Grid */}
              {loading ? (
                <LoadingState message="Loading target companies..." />
              ) : filteredCompanies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCompanies.map((comp) => (
                    <div
                      key={comp._id}
                      onClick={() => {
                        setSelectedCompany(comp);
                        setSelectedTopic(null);
                        setSearchQuery('');
                      }}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
                    >
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs font-black text-lg">
                              {comp.logoUrl ? (
                                <img src={comp.logoUrl} alt={comp.name} className="w-8 h-8 object-contain rounded-xl" />
                              ) : (
                                comp.name.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <StatusBadge status={comp.status || 'published'} />
                          </div>

                          <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">
                            {comp.name}
                          </h3>

                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {comp.description || `Placement patterns, interview rounds, and preparation roadmap for ${comp.name}.`}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-center">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Topics</span>
                            <span className="text-sm font-black text-slate-800 mt-0.5">{comp.topicCount || 0}</span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Videos</span>
                            <span className="text-sm font-black text-blue-600 mt-0.5">{comp.videoCount || 0}</span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Notes</span>
                            <span className="text-sm font-black text-rose-600 mt-0.5">{comp.notesCount || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditCompany(comp, e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Company Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ open: true, type: 'company', item: comp });
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Company"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 group-hover:text-amber-800">
                          <span>View Topics</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Companies Added"
                  description="Add target companies (e.g., TCS, Infosys, Google) to begin organizing company-specific preparation."
                  actionText="Add Target Company"
                  onAction={handleOpenAddCompany}
                />
              )}
            </div>
          )}

          {/* LEVEL 3 (COMPANY PREPARATION): TOPICS FOR SELECTED COMPANY */}
          {selectedInterviewCategory && selectedInterviewCategory.title === 'Company Preparation' && selectedCompany && !selectedTopic && (
            <div className="space-y-6">
              {/* Company Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                      Company • {selectedCompany.name}
                    </span>
                    <StatusBadge status={selectedCompany.status || 'published'} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedCompany.name} Preparation Topics</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {selectedCompany.description || `Overview of hiring rounds, syllabus, and test pattern for ${selectedCompany.name}.`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => handleOpenEditCompany(selectedCompany)}
                  >
                    Edit Company Details
                  </Button>
                </div>
              </div>

              {/* Topics Filter & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    Topics ({filteredCompanyTopics.length})
                  </span>
                </div>
                <div className="w-full sm:w-80">
                  <Input
                    placeholder={`Search ${selectedCompany.name} topics...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Topics Grid */}
              {loading ? (
                <LoadingState message="Loading company topics..." />
              ) : filteredCompanyTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCompanyTopics.map((topic) => (
                    <div
                      key={topic._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {selectedCompany.name}
                            </span>
                            <StatusBadge status={topic.status || 'published'} />
                          </div>

                          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-amber-600 transition-colors">
                            {topic.title}
                          </h3>

                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {topic.description || `${selectedCompany.name} curriculum, video lessons, and PDF study notes.`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Video className="w-4 h-4 text-blue-600" />
                            <span>{topic.videoCount || 0} Videos</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span>{topic.notesCount || 0} PDF Notes</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditTopic(topic, e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Topic Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ open: true, type: 'topic', item: topic });
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Button
                          size="sm"
                          variant="primary"
                          icon={Settings2}
                          onClick={() => {
                            setSelectedTopic(topic);
                            setActiveTopicTab('videos');
                            setSearchQuery('');
                          }}
                        >
                          Manage Topic
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={`No Topics for ${selectedCompany.name}`}
                  description={`Add structured topics (e.g. Pattern Overview, Technical Round, Coding Tests) for ${selectedCompany.name}.`}
                  actionText="Add Topic"
                  onAction={handleOpenAddTopic}
                />
              )}
            </div>
          )}

          {/* LEVEL 3 / LEVEL 4: TOPIC CONTENT (Videos / Notes) */}
          {selectedInterviewCategory && selectedTopic && (
            <div className="space-y-6">
              {/* Topic Overview Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                      Interview • {selectedCompany ? selectedCompany.name : selectedInterviewCategory.title}
                    </span>
                    <StatusBadge status={selectedTopic.status || 'published'} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedTopic.title}</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {selectedTopic.description || 'Topic curriculum and training content.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => handleOpenEditTopic(selectedTopic)}
                  >
                    Edit Topic Details
                  </Button>
                </div>
              </div>

              {/* Sub-Tabs: Videos & PDF Notes */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('videos')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'videos'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Videos ({videoContents.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('notes')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'notes'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF Notes ({noteContents.length})</span>
                  </button>
                </div>

                <div className="w-full sm:w-64">
                  <Input
                    placeholder={`Search ${activeTopicTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* VIDEOS TAB */}
              {activeTopicTab === 'videos' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading videos..." />
                  ) : filteredVideos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredVideos.map((video) => (
                        <div
                          key={video._id}
                          className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                        >
                          <div className="relative aspect-video bg-slate-900 overflow-hidden">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                <Video className="w-10 h-10 opacity-50" />
                              </div>
                            )}

                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setActiveVideoPreview(video)}
                                className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110"
                                title="Watch Video Preview"
                              >
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </button>
                            </div>

                            <div className="absolute top-2.5 left-2.5">
                              <StatusBadge status={video.status || 'published'} />
                            </div>
                            <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              {video.difficulty || 'Beginner'}
                            </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{video.title}</h4>
                              {video.description && (
                                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                  {video.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(video, 'video')}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                                title={video.status === 'published' ? 'Unpublish' : 'Publish'}
                              >
                                {video.status === 'published' ? (
                                  <><Eye className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[11px]">Published</span></>
                                ) : (
                                  <><EyeOff className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px]">Draft</span></>
                                )}
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditVideo(video)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit Video"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm({ open: true, type: 'video', item: video })}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete Video"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No Videos in this Topic"
                      description={`Add verified video lectures for ${selectedTopic.title}.`}
                      actionText="Add Video"
                      onAction={handleOpenAddVideo}
                    />
                  )}
                </div>
              )}

              {/* NOTES TAB */}
              {activeTopicTab === 'notes' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading study notes..." />
                  ) : filteredNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredNotes.map((note) => (
                        <div
                          key={note._id}
                          className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-all group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-rose-600" />
                                PDF {note.fileSize ? `• ${note.fileSize}` : ''}
                              </span>
                              <StatusBadge status={note.status || 'published'} />
                            </div>

                            <h4 className="font-extrabold text-base text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-2">
                              {note.title}
                            </h4>

                            {note.fileName && (
                              <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                                📄 {note.fileName}
                              </p>
                            )}

                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              {note.description || 'Topic reference note in PDF format.'}
                            </p>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                            <Button
                              size="sm"
                              variant="outline"
                              icon={FileText}
                              onClick={() => setActiveNotePreview(note)}
                            >
                              View PDF
                            </Button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(note, 'note')}
                                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition"
                                title={note.status === 'published' ? 'Unpublish' : 'Publish'}
                              >
                                {note.status === 'published' ? (
                                  <Eye className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditNote(note)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit Note"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ open: true, type: 'note', item: note })}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Note"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No PDF Notes in this Topic"
                      description={`Upload study notes in PDF format (max 5MB) for ${selectedTopic.title}.`}
                      actionText="Add Study Note (PDF)"
                      onAction={handleOpenAddNote}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. OTHER MODULES (Fallback) */}
      {/* ========================================================================= */}
      {!isAptitudeModule && !isDomainModule && !isCommunicationModule && !isResumeModule && !isInterviewModule && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <FilterTabs
              tabs={filterTabs}
              activeTab={activeCategory}
              onTabChange={setActiveCategory}
            />
            <div className="w-full lg:w-72">
              <Input
                placeholder={`Search ${currentModule} lessons...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {loading ? (
            <LoadingState message={`Loading ${currentModule} training contents...`} />
          ) : contents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div className="relative aspect-video bg-slate-900 overflow-hidden">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                        <Video className="w-10 h-10 opacity-50" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setActiveVideoPreview(item)}
                        className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110"
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
                    </div>

                    <div className="absolute top-2.5 left-2.5">
                      <StatusBadge status={item.status || 'published'} />
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        {item.category && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                            {item.category}
                          </span>
                        )}
                        {item.topic && (
                          <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {item.topic}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mt-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={item.videoUrl || item.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span>Open URL</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ open: true, type: 'video', item })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No Content in ${currentModule}`}
              description={`Add verified video links to publish lessons for ${currentModule}.`}
              actionText={`Add ${currentModule} Video`}
              onAction={handleOpenAddVideo}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Modal: Add / Edit Domain Category */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Domain Category' : `Add Category (${currentDeptObj?.code || selectedDept})`}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <span className="font-bold">Department: {currentDeptObj?.name || selectedDept}</span>
            <span className="text-[11px] font-semibold text-blue-700">({currentDeptObj?.code || selectedDept})</span>
          </div>

          <Input
            label="Category Title *"
            placeholder="e.g. DBMS & SQL, Programming & DSA, Operating Systems"
            value={categoryForm.title}
            onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Category Description</label>
            <textarea
              rows={3}
              placeholder="Curriculum overview and placement interview objectives..."
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Publish Status"
              options={['published', 'draft']}
              value={categoryForm.status}
              onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
            />
            <Input
              label="Display Order"
              type="number"
              value={categoryForm.order}
              onChange={(e) => setCategoryForm({ ...categoryForm, order: e.target.value })}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" loading={submitting} className="w-full justify-center">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 1.5. Modal: Add / Edit Company (Company Preparation) */}
      <Modal
        isOpen={isCompanyModalOpen}
        onClose={() => {
          setIsCompanyModalOpen(false);
          setEditingCompany(null);
        }}
        title={editingCompany ? 'Edit Target Company' : 'Add Target Company'}
      >
        <form onSubmit={handleSaveCompany} className="space-y-4">
          <Input
            label="Company Name *"
            placeholder="e.g. TCS, Infosys, Cognizant, Google, Microsoft"
            value={companyForm.name}
            onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Company Overview & Hiring Description</label>
            <textarea
              rows={3}
              placeholder="Hiring eligibility, recruitment stages, test pattern, and roadmap overview..."
              value={companyForm.description}
              onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
            />
          </div>

          <Input
            label="Logo URL (Optional)"
            placeholder="https://example.com/logo.png"
            value={companyForm.logoUrl}
            onChange={(e) => setCompanyForm({ ...companyForm, logoUrl: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Publish Status"
              options={['published', 'draft']}
              value={companyForm.status}
              onChange={(e) => setCompanyForm({ ...companyForm, status: e.target.value })}
            />
            <Input
              label="Display Order"
              type="number"
              value={companyForm.order}
              onChange={(e) => setCompanyForm({ ...companyForm, order: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" loading={submitting} className="w-full justify-center">
              {editingCompany ? 'Update Company' : 'Create Company'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Add / Edit Topic */}
      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title={
          editingTopic
            ? 'Edit Topic'
            : isDomainModule
            ? `Add Topic (${selectedDomainCategory?.title})`
            : isCommunicationModule
            ? `Add Topic (${selectedCommCategory?.title})`
            : isResumeModule
            ? `Add Topic (${selectedResumeCategory?.title})`
            : isInterviewModule
            ? (selectedCompany ? `Add Topic (${selectedCompany.name})` : `Add Topic (${selectedInterviewCategory?.title || 'Interview'})`)
            : 'Add Aptitude Topic'
        }
      >
        <form onSubmit={handleSaveTopic} className="space-y-4">
          {isDomainModule ? (
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center justify-between">
              <span className="font-bold">Category: {selectedDomainCategory?.title}</span>
              <span className="text-[11px] font-semibold text-blue-700">({currentDeptObj?.code || selectedDept})</span>
            </div>
          ) : isCommunicationModule ? (
            <div className="p-3 bg-violet-50/70 border border-violet-200/80 rounded-xl text-xs text-violet-900 flex items-center justify-between">
              <span className="font-bold">Category: {selectedCommCategory?.title || topicForm.category}</span>
              <span className="text-[11px] font-semibold text-violet-700">Communication</span>
            </div>
          ) : isResumeModule ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <span className="font-bold">Category: {selectedResumeCategory?.title || topicForm.category}</span>
              <span className="text-[11px] font-semibold text-emerald-700">Resume</span>
            </div>
          ) : isInterviewModule ? (
            selectedCompany ? (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <span className="font-bold">Company: {selectedCompany.name}</span>
                <span className="text-[11px] font-semibold text-amber-700">Company Preparation</span>
              </div>
            ) : (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
                <span className="font-bold">Category: {selectedInterviewCategory?.title || topicForm.category}</span>
                <span className="text-[11px] font-semibold text-indigo-700">Interview Preparation</span>
              </div>
            )
          ) : (
            <Select
              label="Aptitude Category *"
              options={MODULE_CATEGORIES.Aptitude.map((c) => ({ value: c.id, label: c.label }))}
              value={topicForm.category}
              onChange={(e) => setTopicForm({ ...topicForm, category: e.target.value })}
            />
          )}

          <Input
            label="Topic Title *"
            placeholder="e.g. Joins, DBMS Fundamentals, Binary Trees"
            value={topicForm.title}
            onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Topic Description</label>
            <textarea
              rows={3}
              placeholder="Summary of concepts and problem types in this topic..."
              value={topicForm.description}
              onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Publish Status"
              options={['published', 'draft']}
              value={topicForm.status}
              onChange={(e) => setTopicForm({ ...topicForm, status: e.target.value })}
            />
            <Input
              label="Display Order"
              type="number"
              value={topicForm.order}
              onChange={(e) => setTopicForm({ ...topicForm, order: e.target.value })}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" loading={submitting} className="w-full justify-center">
              {editingTopic ? 'Update Topic' : 'Create Topic'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal: Add / Edit Video */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title={editingVideo ? 'Edit Video Lesson' : 'Add Video Lesson'}
      >
        <form onSubmit={handleSaveVideo} className="space-y-4">
          {selectedTopic && (
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center justify-between">
              <span className="font-bold">Topic: {selectedTopic.title}</span>
              <span className="text-[11px] font-semibold text-blue-700">
                {isDomainModule ? `(${currentDeptObj?.code || selectedDept} • ${selectedDomainCategory?.title})` : `(${selectedTopic.category})`}
              </span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Video URL (YouTube or Vimeo) *</label>
            <div className="flex gap-2">
              <Input
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                value={videoForm.videoUrl}
                onChange={(e) => {
                  setVideoForm({ ...videoForm, videoUrl: e.target.value });
                  setFetchError('');
                }}
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                icon={Sparkles}
                loading={detecting}
                onClick={handleFetchVideoDetails}
                title="Auto-detect title and thumbnail"
              >
                Auto Detect
              </Button>
            </div>
            {fetchError && (
              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fetchError}
              </p>
            )}
          </div>

          <Input
            label="Video Title *"
            placeholder="e.g. SQL Joins Explained with Practical Examples"
            value={videoForm.title}
            onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Description</label>
            <textarea
              rows={2}
              placeholder="Lecture overview and learning goals..."
              value={videoForm.description}
              onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Difficulty Level"
              options={['Beginner', 'Intermediate', 'Advanced']}
              value={videoForm.difficulty}
              onChange={(e) => setVideoForm({ ...videoForm, difficulty: e.target.value })}
            />
            <Select
              label="Publish Status"
              options={['published', 'draft']}
              value={videoForm.status}
              onChange={(e) => setVideoForm({ ...videoForm, status: e.target.value })}
            />
          </div>

          {videoForm.thumbnailUrl && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <img
                src={videoForm.thumbnailUrl}
                alt="Thumbnail Preview"
                className="w-16 h-10 object-cover rounded-lg border border-slate-200"
              />
              <div className="text-xs text-slate-600 truncate flex-1">
                <span className="font-bold block text-slate-800">Thumbnail Detected</span>
                <span className="text-[11px] text-slate-400 truncate block">{videoForm.thumbnailUrl}</span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" loading={submitting} className="w-full justify-center">
              {editingVideo ? 'Update Video' : 'Save Video Lesson'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal: Add / Edit PDF Study Note (Max 5MB) */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title={editingNote ? 'Edit Study Note (PDF)' : 'Add Study Note (PDF)'}
      >
        <form onSubmit={handleSaveNote} className="space-y-4">
          {selectedTopic && (
            <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl text-xs text-rose-900 flex items-center justify-between">
              <span className="font-bold">Topic: {selectedTopic.title}</span>
              <span className="text-[11px] font-semibold text-rose-700">
                {isDomainModule ? `(${currentDeptObj?.code || selectedDept} • ${selectedDomainCategory?.title})` : `(${selectedTopic.category})`}
              </span>
            </div>
          )}

          {/* PDF File Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">PDF Document (Max 5MB) *</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              onChange={handlePdfFileSelect}
              className="hidden"
            />

            {!noteForm.pdfUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50 hover:bg-rose-50/30 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Click to upload PDF study notes</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Strictly PDF files (.pdf) up to 5MB</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-rose-600 text-white rounded-xl">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {noteForm.fileName || 'document.pdf'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 block">
                      {noteForm.fileSize || 'PDF Document'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 underline px-2 py-1"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteForm((prev) => ({ ...prev, pdfUrl: '', fileName: '', fileSize: '' }))}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Remove PDF"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {pdfError && (
              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {pdfError}
              </p>
            )}
          </div>

          <Input
            label="Note Title *"
            placeholder="e.g. Joins Concept Notes & Interview Reference"
            value={noteForm.title}
            onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Description</label>
            <textarea
              rows={2}
              placeholder="Brief summary of notes, formula sheets, or interview cheat sheet..."
              value={noteForm.description}
              onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Difficulty Level"
              options={['Beginner', 'Intermediate', 'Advanced']}
              value={noteForm.difficulty}
              onChange={(e) => setNoteForm({ ...noteForm, difficulty: e.target.value })}
            />
            <Select
              label="Publish Status"
              options={['published', 'draft']}
              value={noteForm.status}
              onChange={(e) => setNoteForm({ ...noteForm, status: e.target.value })}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" loading={submitting} className="w-full justify-center">
              {editingNote ? 'Update Note' : 'Upload Study Note'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Modal: Video Player Preview */}
      {activeVideoPreview && (
        <Modal
          isOpen={Boolean(activeVideoPreview)}
          onClose={() => setActiveVideoPreview(null)}
          title={activeVideoPreview.title}
          size="lg"
        >
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
              {activeVideoPreview.videoUrl && (activeVideoPreview.videoUrl.includes('youtube') || activeVideoPreview.videoUrl.includes('youtu.be')) ? (
                <iframe
                  src={
                    activeVideoPreview.videoUrl.includes('watch?v=')
                      ? activeVideoPreview.videoUrl.replace('watch?v=', 'embed/')
                      : activeVideoPreview.videoUrl.includes('youtu.be/')
                      ? activeVideoPreview.videoUrl.replace('youtu.be/', 'www.youtube.com/embed/')
                      : activeVideoPreview.videoUrl
                  }
                  title={activeVideoPreview.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeVideoPreview.videoUrl && activeVideoPreview.videoUrl.includes('vimeo.com') ? (
                <iframe
                  src={activeVideoPreview.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                  title={activeVideoPreview.title}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-6 text-center">
                  <Video className="w-12 h-12 mb-2 text-slate-400" />
                  <p className="text-sm font-bold text-white mb-2">Direct Video URL</p>
                  <a
                    href={activeVideoPreview.videoUrl || activeVideoPreview.resourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Open in External Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {activeVideoPreview.description && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {activeVideoPreview.description}
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* 6. Modal: PDF Note Reader */}
      {activeNotePreview && (
        <NoteReaderModal
          isOpen={Boolean(activeNotePreview)}
          onClose={() => setActiveNotePreview(null)}
          note={activeNotePreview}
        />
      )}

      {/* 7. Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: null, item: null })}
        onConfirm={() => {
          if (deleteConfirm.type === 'category') handleDeleteCategory();
          else if (deleteConfirm.type === 'topic') handleDeleteTopic();
          else handleDeleteContent();
        }}
        title={`Delete ${deleteConfirm.type === 'category' ? 'Category' : deleteConfirm.type === 'topic' ? 'Topic' : deleteConfirm.type === 'note' ? 'Study Note' : 'Video'}`}
        message={
          deleteConfirm.type === 'category'
            ? `Are you sure you want to delete "${deleteConfirm.item?.title}"? All associated topics, video lectures, and PDF study notes under this category will also be deleted permanently.`
            : deleteConfirm.type === 'topic'
            ? `Are you sure you want to delete "${deleteConfirm.item?.title}"? All video lectures and PDF study notes under this topic will also be permanently deleted.`
            : `Are you sure you want to delete "${deleteConfirm.item?.title}"? This action cannot be undone.`
        }
        confirmText="Delete Permanently"
        variant="danger"
      />
    </div>
  );
};

export default ContentManagementPage;
