import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import FilterTabs from '../../components/FilterTabs';
import Button from '../../components/Button';
import Input from '../../components/Input';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import NoteReaderModal from '../../components/NoteReaderModal';
import Badge from '../../components/Badge';
import {
  TRAINING_MODULES,
  MODULE_CATEGORIES,
  normalizeModuleName
} from '../../constants/trainingModules';
import { DEPARTMENT_DETAILS, getDepartmentDetails, canonicalizeDepartment } from '../../constants/departments';
import {
  Play,
  CheckCircle,
  Video,
  FileText,
  BookOpen,
  ArrowLeft,
  Clock,
  FolderOpen,
  ChevronRight,
  ExternalLink,
  Layers,
  Building2,
  GraduationCap,
  UserCheck,
  Code2,
  MessageSquare,
  Users
} from 'lucide-react';

export const TrainingPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected training module category from URL or default 'Aptitude'
  const rawCategory = searchParams.get('category') || 'Aptitude';
  const currentCategory = normalizeModuleName(rawCategory);
  const isAptitudeModule = currentCategory === 'Aptitude';
  const isDomainModule = currentCategory === 'Domain Knowledge' || rawCategory === 'Domain';
  const isCommunicationModule = currentCategory === 'Communication';
  const isResumeModule = currentCategory === 'Resume';
  const isInterviewModule = currentCategory === 'Interview Preparation' || currentCategory === 'Interview' || rawCategory === 'Interview';

  // Available sub-categories / tabs for standard modules
  const availableCategories =
    MODULE_CATEGORIES[currentCategory] ||
    MODULE_CATEGORIES[rawCategory] ||
    [];

  const studentDeptRaw = user?.department || user?.studentProfile?.department || 'EXTC';
  const studentDept = canonicalizeDepartment(studentDeptRaw);
  const studentDeptDetails = getDepartmentDetails(studentDept);

  const [activeSubfilter, setActiveSubfilter] = useState(
    isAptitudeModule
      ? (availableCategories[0]?.id || 'Quantitative')
      : 'All'
  );

  // ==========================================
  // Domain Hierarchy for Student (Identical to Admin View)
  // Level 1: selectedDept (e.g. 'EXTC', 'CSE', 'IT', etc.)
  // Level 2: selectedDomainCategory (Category object)
  // Level 3: selectedTopic (Topic object)
  // Level 4: Topic Details (Videos / Notes)
  // ==========================================
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedDomainCategory, setSelectedDomainCategory] = useState(null);
  const [domainCategories, setDomainCategories] = useState([]);
  const [deptStats, setDeptStats] = useState({});

  // ==========================================
  // Communication Hierarchy for Student (Read-Only)
  // Level 1: commCategories (5 fixed categories)
  // Level 2: selectedCommCategory (Category object) → commTopics
  // Level 3: selectedTopic (Topic object)
  // Level 4: Topic Details (Videos / Notes) — read-only
  // ==========================================
  const [commCategories, setCommCategories] = useState([]);
  const [selectedCommCategory, setSelectedCommCategory] = useState(null);
  const [commTopics, setCommTopics] = useState([]);

  // ==========================================
  // Resume Hierarchy for Student (Read-Only)
  // Level 1: resumeCategories (4 fixed categories)
  // Level 2: selectedResumeCategory (Category object) → resumeTopics
  // Level 3: selectedTopic (Topic object)
  // Level 4: Topic Details (Videos / Notes) — read-only
  // ==========================================
  const [resumeCategories, setResumeCategories] = useState([]);
  const [selectedResumeCategory, setSelectedResumeCategory] = useState(null);
  const [resumeTopics, setResumeTopics] = useState([]);

  // ==========================================
  // Interview Preparation Hierarchy for Student (Read-Only)
  // Level 1: interviewCategories (5 fixed categories)
  // Level 2 (Standard): selectedInterviewCategory (Category object) → interviewTopics
  // Level 2 (Company Prep): companies (Data-driven published companies)
  // Level 3 (Company Prep): selectedCompany (Company object) → companyTopics
  // Level 3/4: selectedTopic (Topic object) → Topic Details (Videos / Notes)
  // ==========================================
  const [interviewCategories, setInterviewCategories] = useState([]);
  const [selectedInterviewCategory, setSelectedInterviewCategory] = useState(null);
  const [interviewTopics, setInterviewTopics] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyTopics, setCompanyTopics] = useState([]);

  // Selected Topic for Aptitude, Domain, Communication, Resume & Interview
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeTopicTab, setActiveTopicTab] = useState('videos'); // 'videos' | 'notes'

  // Data States
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [contents, setContents] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [completedMap, setCompletedMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = isAptitudeModule
    ? availableCategories
    : [
        { id: 'All', label: 'All Topics' },
        ...availableCategories
      ];

  // Reset states when module changes
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
      setActiveSubfilter(availableCategories[0]?.id || 'Quantitative');
    } else {
      setActiveSubfilter('All');
    }
  }, [rawCategory]);

  // Orchestrator for data fetching
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
  }, [rawCategory, activeSubfilter, selectedDept, selectedDomainCategory, selectedTopic, selectedCommCategory, selectedResumeCategory, selectedInterviewCategory, selectedCompany]);

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
          const deptCats = res.categories.filter(
            (c) => c.department === d.id || c.department === d.dbKey || c.department === d.code
          );
          stats[d.id] = {
            categoryCount: deptCats.length,
            topicCount: deptCats.reduce(
              (acc, c) => acc + (c.publishedTopicCount !== undefined ? c.publishedTopicCount : (c.topicCount || 0)),
              0
            ),
            videoCount: deptCats.reduce(
              (acc, c) => acc + (c.publishedVideos !== undefined ? c.publishedVideos : (c.videoCount || 0)),
              0
            ),
            notesCount: deptCats.reduce(
              (acc, c) => acc + (c.publishedNotes !== undefined ? c.publishedNotes : (c.notesCount || 0)),
              0
            )
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
      const res = await api.getCategories({
        module: 'Domain',
        department: deptCode
      });
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
      const res = await api.getTopics({
        module: 'Domain',
        categoryId
      });
      if (res.success) {
        setTopics(res.topics || []);
      }
    } catch (err) {
      console.error('Error fetching domain category topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAptitudeTopics = async () => {
    setLoading(true);
    try {
      const params = {
        module: 'Aptitude',
        category: activeSubfilter
      };
      const res = await api.getTopics(params);
      if (res.success) {
        setTopics(res.topics || []);
      }
    } catch (err) {
      console.error('Error fetching aptitude topics:', err);
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
        setContents((res.contents || []).filter(c => c.status === 'published' || !c.status));
      }
    } catch (err) {
      console.error('Error fetching topic contents:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Communication Fetch Handlers (Student - Read-Only published content)
  // ==========================================
  const fetchCommCategories = async () => {
    setLoading(true);
    try {
      const res = await api.getCategories({ module: 'Communication' });
      if (res.success) {
        setCommCategories((res.categories || []).filter(c => c.status === 'published' || !c.status));
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
        // Students only see published topics
        setCommTopics((res.topics || []).filter(t => t.status === 'published'));
      }
    } catch (err) {
      console.error('Error fetching communication topics:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Resume Fetch Handlers (Student - Read-Only published content)
  // ==========================================
  const fetchResumeCategories = async () => {
    setLoading(true);
    try {
      const res = await api.getCategories({ module: 'Resume' });
      if (res.success) {
        setResumeCategories((res.categories || []).filter(c => c.status === 'published' || !c.status));
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
        // Students only see published topics
        setResumeTopics((res.topics || []).filter(t => t.status === 'published'));
      }
    } catch (err) {
      console.error('Error fetching resume topics:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Interview Preparation Fetch Handlers (Student - Read-Only published content)
  // ==========================================
  const fetchInterviewCategories = async () => {
    setLoading(true);
    try {
      const res = await api.getCategories({ module: 'Interview Preparation' });
      if (res.success) {
        setInterviewCategories((res.categories || []).filter(c => c.status === 'published' || !c.status));
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
        setInterviewTopics((res.topics || []).filter(t => t.status === 'published'));
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
        setCompanies((res.companies || []).filter(c => c.status === 'published' || !c.status));
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
        setCompanyTopics((res.topics || []).filter(t => t.status === 'published'));
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
      const params = { module: currentCategory };
      if (activeSubfilter !== 'All') params.category = activeSubfilter;

      const res = await api.getContentList(params);
      if (res.success) {
        setContents((res.contents || []).filter(c => c.status === 'published' || !c.status));
      }
    } catch (err) {
      console.error('Error fetching training contents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleChange = (newModuleId) => {
    setSelectedDept(null);
    setSelectedDomainCategory(null);
    setSelectedCommCategory(null);
    setSelectedResumeCategory(null);
    setSelectedInterviewCategory(null);
    setSelectedCompany(null);
    setSelectedTopic(null);
    setSearchParams({ category: newModuleId });
  };

  const handleToggleComplete = async (contentId) => {
    try {
      setCompletedMap((prev) => ({
        ...prev,
        [contentId]: !prev[contentId]
      }));
      await api.markContentComplete(contentId);
    } catch (err) {
      console.error('Error marking content complete:', err);
    }
  };

  const videoContents = contents.filter((c) => c.resourceType !== 'note');
  const noteContents = contents.filter((c) => c.resourceType === 'note');

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

  const activeCategoryObj = availableCategories.find((c) => c.id === activeSubfilter);
  const activeCategoryLabel = activeCategoryObj ? activeCategoryObj.label : activeSubfilter;
  const currentDeptObj = selectedDept ? getDepartmentDetails(selectedDept) : null;

  // Header Props Calculation
  const getHeaderProps = () => {
    if (isDomainModule) {
      if (selectedTopic) {
        return {
          title: `${selectedTopic.title} • Resources`,
          subtitle: `Watch video lectures and study comprehensive PDF notes for ${selectedTopic.title} in ${selectedDomainCategory?.title} (${currentDeptObj?.code || selectedDept}).`,
          breadcrumbs: [
            { label: 'Student', link: '/student/dashboard' },
            { label: 'Training', onClick: () => { setSelectedDept(null); setSelectedDomainCategory(null); setSelectedTopic(null); } },
            { label: 'Domain Knowledge', onClick: () => { setSelectedDept(null); setSelectedDomainCategory(null); setSelectedTopic(null); } },
            { label: currentDeptObj?.code || selectedDept, onClick: () => { setSelectedTopic(null); } },
            { label: selectedDomainCategory?.title || 'Category', onClick: () => { setSelectedTopic(null); } },
            { label: selectedTopic.title }
          ],
          actions: (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedTopic(null)}
            >
              Back to Topics
            </Button>
          )
        };
      }
      if (selectedDomainCategory) {
        return {
          title: `${selectedDomainCategory.title} • Topics`,
          subtitle: `Select a topic to access verified video lectures and downloadable PDF notes for ${currentDeptObj?.name || selectedDept}.`,
          breadcrumbs: [
            { label: 'Student', link: '/student/dashboard' },
            { label: 'Training', onClick: () => { setSelectedDept(null); setSelectedDomainCategory(null); } },
            { label: 'Domain Knowledge', onClick: () => { setSelectedDept(null); setSelectedDomainCategory(null); } },
            { label: currentDeptObj?.code || selectedDept, onClick: () => setSelectedDomainCategory(null) },
            { label: selectedDomainCategory.title }
          ],
          actions: (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedDomainCategory(null)}
            >
              Back to Categories
            </Button>
          )
        };
      }
      if (selectedDept) {
        return {
          title: `${currentDeptObj?.name || selectedDept}`,
          subtitle: `Placement training categories and core curriculum for ${currentDeptObj?.code || selectedDept}.`,
          breadcrumbs: [
            { label: 'Student', link: '/student/dashboard' },
            { label: 'Training', onClick: () => setSelectedDept(null) },
            { label: 'Domain Knowledge', onClick: () => setSelectedDept(null) },
            { label: currentDeptObj?.code || selectedDept }
          ],
          actions: (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedDept(null)}
            >
              Back to Departments
            </Button>
          )
        };
      }
      return {
        title: 'Domain Knowledge Curriculum',
        subtitle: 'Explore specialized core engineering & management placement curriculum across all 9 official academic departments.',
        breadcrumbs: [
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Training' },
          { label: 'Domain Knowledge' }
        ],
        actions: null
      };
    }

    // ==========================================
    // COMMUNICATION MODULE HEADERS (STUDENT)
    // ==========================================
    if (isCommunicationModule) {
      if (selectedTopic && selectedCommCategory) {
        return {
          title: `${selectedTopic.title} • Communication`,
          subtitle: `Watch video lectures and review study notes for ${selectedTopic.title} under ${selectedCommCategory.title}.`,
          breadcrumbs: [
            { label: 'Student', link: '/student/dashboard' },
            { label: 'Training' },
            { label: 'Communication', onClick: () => { setSelectedCommCategory(null); setSelectedTopic(null); } },
            { label: selectedCommCategory.title, onClick: () => setSelectedTopic(null) },
            { label: selectedTopic.title }
          ],
          actions: (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedTopic(null)}
            >
              Back to Topics
            </Button>
          )
        };
      }
      if (selectedCommCategory) {
        return {
          title: `${selectedCommCategory.title} • Topics`,
          subtitle: `Select a topic to access video lectures and study notes for ${selectedCommCategory.title}.`,
          breadcrumbs: [
            { label: 'Student', link: '/student/dashboard' },
            { label: 'Training' },
            { label: 'Communication', onClick: () => setSelectedCommCategory(null) },
            { label: selectedCommCategory.title }
          ],
          actions: (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedCommCategory(null)}
            >
              Back to Categories
            </Button>
          )
        };
      }
      return {
        title: 'Communication Training',
        subtitle: 'Master corporate verbal, written, listening, and workplace communication skills across 5 structured categories.',
        breadcrumbs: [
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Training' },
          { label: 'Communication' }
        ],
        actions: null
      };
    }

    // ==========================================
    // RESUME MODULE HEADERS (STUDENT)
    // ==========================================
    if (isResumeModule) {
      if (selectedTopic && selectedResumeCategory) {
        return {
          title: `${selectedTopic.title} • Resume`,
          subtitle: `Watch video guides and review study notes for ${selectedTopic.title} under ${selectedResumeCategory.title}.`,
          breadcrumbs: [
            { label: 'Student', link: '/student/dashboard' },
            { label: 'Training' },
            { label: 'Resume', onClick: () => { setSelectedResumeCategory(null); setSelectedTopic(null); } },
            { label: selectedResumeCategory.title, onClick: () => setSelectedTopic(null) },
            { label: selectedTopic.title }
          ],
          actions: (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedTopic(null)}
            >
              Back to Topics
            </Button>
          )
        };
      }
      if (selectedResumeCategory) {
        return {
          title: `${selectedResumeCategory.title} • Topics`,
          subtitle: `Select a topic to access video guides, templates, and study notes for ${selectedResumeCategory.title}.`,
          breadcrumbs: [
            { label: 'Student', link: '/student/dashboard' },
            { label: 'Training' },
            { label: 'Resume', onClick: () => setSelectedResumeCategory(null) },
            { label: selectedResumeCategory.title }
          ],
          actions: (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedResumeCategory(null)}
            >
              Back to Categories
            </Button>
          )
        };
      }
      return {
        title: 'Resume Training',
        subtitle: 'Master modern resume building, ATS optimization, project descriptions, and verified examples across 4 structured categories.',
        breadcrumbs: [
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Training' },
          { label: 'Resume' }
        ],
        actions: null
      };
    }

    // ==========================================
    // INTERVIEW PREPARATION HEADERS (STUDENT)
    // ==========================================
    if (isInterviewModule) {
      if (selectedTopic && selectedCompany) {
        return {
          title: `${selectedTopic.title} • ${selectedCompany.name}`,
          subtitle: `Watch video lessons and study notes for ${selectedTopic.title} under ${selectedCompany.name} Company Preparation.`,
          breadcrumbs: [
            { label: 'Student', link: '/student/dashboard' },
            { label: 'Training' },
            { label: 'Interview Preparation', onClick: () => { setSelectedInterviewCategory(null); setSelectedCompany(null); setSelectedTopic(null); } },
            { label: 'Company Preparation', onClick: () => { setSelectedCompany(null); setSelectedTopic(null); } },
            { label: selectedCompany.name, onClick: () => setSelectedTopic(null) },
            { label: selectedTopic.title }
          ],
          actions: (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedTopic(null)}
            >
              Back to Topics
            </Button>
          )
        };
      }
      if (selectedTopic && selectedInterviewCategory) {
        return {
          title: `${selectedTopic.title} • ${selectedInterviewCategory.title}`,
          subtitle: `Watch video lessons and study notes for ${selectedTopic.title} under ${selectedInterviewCategory.title}.`,
          breadcrumbs: [
            { label: 'Student', link: '/student/dashboard' },
            { label: 'Training' },
            { label: 'Interview Preparation', onClick: () => { setSelectedInterviewCategory(null); setSelectedTopic(null); } },
            { label: selectedInterviewCategory.title, onClick: () => setSelectedTopic(null) },
            { label: selectedTopic.title }
          ],
          actions: (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedTopic(null)}
            >
              Back to Topics
            </Button>
          )
        };
      }
      if (selectedCompany) {
        return {
          title: `${selectedCompany.name} • Preparation Topics`,
          subtitle: `Select a topic to access test patterns, interview rounds, and preparation resources for ${selectedCompany.name}.`,
          breadcrumbs: [
            { label: 'Student', link: '/student/dashboard' },
            { label: 'Training' },
            { label: 'Interview Preparation', onClick: () => { setSelectedInterviewCategory(null); setSelectedCompany(null); } },
            { label: 'Company Preparation', onClick: () => setSelectedCompany(null) },
            { label: selectedCompany.name }
          ],
          actions: (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedCompany(null)}
            >
              Back to Companies
            </Button>
          )
        };
      }
      if (selectedInterviewCategory) {
        if (selectedInterviewCategory.title === 'Company Preparation') {
          return {
            title: 'Company Preparation • Target Employers',
            subtitle: 'Select a company to access employer-specific test patterns, syllabus, and interview preparation.',
            breadcrumbs: [
              { label: 'Student', link: '/student/dashboard' },
              { label: 'Training' },
              { label: 'Interview Preparation', onClick: () => setSelectedInterviewCategory(null) },
              { label: 'Company Preparation' }
            ],
            actions: (
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setSelectedInterviewCategory(null)}
              >
                Back to Categories
              </Button>
            )
          };
        }
        return {
          title: `${selectedInterviewCategory.title} • Topics`,
          subtitle: `Select a topic to access interview questions, video lessons, and study notes for ${selectedInterviewCategory.title}.`,
          breadcrumbs: [
            { label: 'Student', link: '/student/dashboard' },
            { label: 'Training' },
            { label: 'Interview Preparation', onClick: () => setSelectedInterviewCategory(null) },
            { label: selectedInterviewCategory.title }
          ],
          actions: (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedInterviewCategory(null)}
            >
              Back to Categories
            </Button>
          )
        };
      }
      return {
        title: 'Interview Preparation',
        subtitle: 'Ace campus placements with structured HR, Technical, Behavioral, Company-Specific, and Mock Interview resources.',
        breadcrumbs: [
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Training' },
          { label: 'Interview Preparation' }
        ],
        actions: null
      };
    }

    if (selectedTopic) {
      return {
        title: `${selectedTopic.title} • Training`,
        subtitle: `Watch topic video lectures and review comprehensive study notes for ${selectedTopic.title}.`,
        breadcrumbs: [
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Training' },
          {
            label: currentCategory,
            onClick: () => setSelectedTopic(null)
          },
          { label: activeCategoryLabel },
          { label: selectedTopic.title }
        ],
        actions: (
          <Button
            variant="outline"
            size="md"
            icon={ArrowLeft}
            onClick={() => setSelectedTopic(null)}
          >
            Back to Topics
          </Button>
        )
      };
    }

    return {
      title: `${currentCategory} Training Modules`,
      subtitle:
        currentCategory === 'Interview Preparation'
          ? 'Comprehensive guide to HR rounds, technical interviews, behavioral questions, and company mock tests.'
          : 'Topic-based structured video lectures, conceptual breakdowns, and rich notes for placement aptitude.',
      breadcrumbs: [
        { label: 'Student', link: '/student/dashboard' },
        { label: 'Training' },
        { label: currentCategory }
      ],
      actions: null
    };
  };

  const headerProps = getHeaderProps();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={headerProps.title}
        subtitle={headerProps.subtitle}
        breadcrumbs={headerProps.breadcrumbs}
        actions={headerProps.actions}
      />

      {/* Module Selector Pills (Top Bar) */}
      {!selectedTopic && !selectedDomainCategory && !selectedCommCategory && !selectedResumeCategory && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {TRAINING_MODULES.map((m) => {
              const isActive =
                rawCategory === m.id ||
                currentCategory === m.label ||
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
                  <BookOpen className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DOMAIN MODULE (Full 4-Level Academic Exploration - Same as Admin View) */}
      {/* ========================================================================= */}
      {isDomainModule && (
        <div className="space-y-6">
          {/* LEVEL 1: ALL 9 ACADEMIC DEPARTMENTS OVERVIEW */}
          {!selectedDept && (
            <div className="space-y-6">
              {/* Department Overview Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Official Academic Departments (9)
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

              {/* Department Cards Grid */}
              {loading ? (
                <LoadingState message="Loading academic departments..." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDepartments.map((dept) => {
                    const st = deptStats[dept.id] || { categoryCount: 0, topicCount: 0, videoCount: 0, notesCount: 0 };
                    const isStudentOwnDept =
                      dept.id === studentDept ||
                      dept.code === studentDept ||
                      dept.dbKey === studentDept;

                    return (
                      <div
                        key={dept.id}
                        onClick={() => {
                          setSelectedDept(dept.id);
                          setSearchQuery('');
                        }}
                        className={`bg-white rounded-3xl border shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer group ${
                          isStudentOwnDept
                            ? 'border-blue-300 ring-2 ring-blue-500/20 hover:border-blue-500'
                            : 'border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl border flex items-center gap-1.5 ${dept.badgeColor}`}
                              >
                                <Building2 className="w-3.5 h-3.5" />
                                {dept.code}
                              </span>
                              {isStudentOwnDept && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                                  <GraduationCap className="w-3 h-3" />
                                  Your Branch
                                </span>
                              )}
                            </div>
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
                              <span className="block text-[10px] font-bold text-blue-500/80 uppercase">Videos</span>
                            </div>
                            <div className="bg-rose-50/50 p-2 rounded-xl border border-rose-100/60">
                              <span className="block text-xs font-black text-rose-700">{st.notesCount}</span>
                              <span className="block text-[10px] font-bold text-rose-500/80 uppercase">Notes</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50/70 group-hover:bg-blue-50/50 px-6 py-3 border-t border-slate-100 flex items-center justify-between transition-colors">
                          <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">
                            Explore Curriculum
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 2: Department Categories */}
          {selectedDept && !selectedDomainCategory && !selectedTopic && (
            <div className="space-y-6">
              {/* Department Banner */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-blue-800/40 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 px-3 py-1 rounded-xl border border-blue-400/30 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {currentDeptObj?.code || selectedDept}
                      </span>
                      <span className="text-[11px] font-bold text-slate-300">
                        {domainCategories.length} Published Categories
                      </span>
                      {(selectedDept === studentDept || currentDeptObj?.code === studentDept) && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/40 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          Your Branch
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-black text-white">{currentDeptObj?.name || selectedDept}</h2>
                    <p className="text-xs text-blue-100/80 mt-1 max-w-2xl leading-relaxed">
                      {currentDeptObj?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Search Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-600">
                  Select a category in {currentDeptObj?.code || selectedDept} to explore curriculum topics
                </div>
                <div className="w-full sm:w-72">
                  <Input
                    placeholder="Search domain categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Categories Grid */}
              {loading ? (
                <LoadingState message={`Fetching ${currentDeptObj?.code || selectedDept} categories...`} />
              ) : filteredDomainCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDomainCategories.map((cat) => (
                    <div
                      key={cat._id}
                      onClick={() => {
                        setSelectedDomainCategory(cat);
                        setSearchQuery('');
                      }}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 flex items-center gap-1.5">
                            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                            {currentDeptObj?.code || selectedDept}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                          {cat.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {cat.description || 'Core domain category training curriculum and interview prep.'}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            {cat.publishedTopicCount !== undefined ? cat.publishedTopicCount : (cat.topicCount || 0)} Topics
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1">
                            <Video className="w-3.5 h-3.5 text-blue-600" />
                            {cat.publishedVideos !== undefined ? cat.publishedVideos : (cat.videoCount || 0)} Videos
                          </span>
                        </div>

                        <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Explore</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Published Categories Found"
                  description={`Domain categories for ${currentDeptObj?.name || selectedDept} are currently being curated by instructors. Please check back shortly.`}
                />
              )}
            </div>
          )}

          {/* LEVEL 3: Category Topics */}
          {selectedDept && selectedDomainCategory && !selectedTopic && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {currentDeptObj?.code || selectedDept} • {selectedDomainCategory.title}
                    </span>
                    <Badge variant="primary">Category</Badge>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedDomainCategory.title} Topics</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {selectedDomainCategory.description || 'Topic breakdown, video lessons, and verified notes.'}
                  </p>
                </div>
              </div>

              {/* Topics search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-600">
                  Showing topics in {selectedDomainCategory.title}
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

              {/* Topics Grid */}
              {loading ? (
                <LoadingState message="Loading topics..." />
              ) : filteredTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTopics.map((topic) => (
                    <div
                      key={topic._id}
                      onClick={() => {
                        setSelectedTopic(topic);
                        setActiveTopicTab('videos');
                        setSearchQuery('');
                      }}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 flex items-center gap-1.5">
                            <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                            {topic.category || selectedDomainCategory.title}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {topic.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {topic.description || 'Topic video curriculum, conceptual breakdowns, and revision notes.'}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                          <span className="flex items-center gap-1">
                            <Video className="w-3.5 h-3.5 text-blue-600" />
                            {topic.publishedVideos !== undefined ? topic.publishedVideos : (topic.videoCount || 0)} Videos
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-rose-600" />
                            {topic.publishedNotes !== undefined ? topic.publishedNotes : (topic.notesCount || 0)} Notes
                          </span>
                        </div>

                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Explore</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={`No Topics in ${selectedDomainCategory.title}`}
                  description="Your instructors have not published topics for this category yet. Please check back soon."
                />
              )}
            </div>
          )}

          {/* LEVEL 4: Topic Details (Videos / Notes) */}
          {selectedDept && selectedDomainCategory && selectedTopic && (
            <div className="space-y-6">
              {/* Topic Overview Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {currentDeptObj?.code || selectedDept} • {selectedDomainCategory.title}
                    </span>
                    <Badge variant="primary">Study Topic</Badge>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedTopic.title}</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {selectedTopic.description || 'Watch topic lectures and review notes.'}
                  </p>
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
              </div>

              {/* VIDEOS TAB */}
              {activeTopicTab === 'videos' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading videos..." />
                  ) : videoContents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {videoContents.map((video) => (
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
                                onClick={() => setActiveVideo(video)}
                                className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110"
                              >
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </button>
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
                              <Button
                                size="sm"
                                variant="primary"
                                icon={Play}
                                onClick={() => setActiveVideo(video)}
                              >
                                Watch Lesson
                              </Button>

                              <button
                                type="button"
                                onClick={() => handleToggleComplete(video._id)}
                                className={`p-1.5 rounded-lg transition ${
                                  completedMap[video._id]
                                    ? 'text-emerald-600 bg-emerald-50'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={completedMap[video._id] ? 'Completed' : 'Mark Complete'}
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No Videos in this Topic"
                      description="Video lectures for this topic are being uploaded."
                    />
                  )}
                </div>
              )}

              {/* PDF NOTES TAB */}
              {activeTopicTab === 'notes' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading notes..." />
                  ) : noteContents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {noteContents.map((note) => (
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
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {note.difficulty || 'Study Note'}
                              </span>
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
                              variant="primary"
                              icon={FileText}
                              onClick={() => setActiveNote(note)}
                            >
                              Read Note (PDF)
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleToggleComplete(note._id)}
                              className={`p-1.5 rounded-lg transition ${
                                completedMap[note._id]
                                  ? 'text-emerald-600 bg-emerald-50'
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                              title={completedMap[note._id] ? 'Completed' : 'Mark Complete'}
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No PDF Notes in this Topic"
                      description="Study notes for this topic are being prepared."
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. APTITUDE MODULE (Student Topic-Based Flow) */}
      {/* ========================================================================= */}
      {isAptitudeModule && !selectedTopic && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <FilterTabs
              tabs={filterTabs}
              activeTab={activeSubfilter}
              onTabChange={setActiveSubfilter}
            />
          </div>

          {loading ? (
            <LoadingState message={`Fetching published ${activeCategoryLabel} topics...`} />
          ) : topics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topics.map((topic) => (
                <div
                  key={topic._id}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setActiveTopicTab('videos');
                  }}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                        {topic.category || activeSubfilter}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {topic.description || 'Topic video curriculum, conceptual breakdowns, and revision notes.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-blue-600" />
                        {topic.publishedVideos !== undefined ? topic.publishedVideos : (topic.videoCount || 0)} Videos
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        {topic.publishedNotes !== undefined ? topic.publishedNotes : (topic.notesCount || 0)} Notes
                      </span>
                    </div>

                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Explore</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No topics available in ${activeCategoryLabel}`}
              description="Your instructors have not published topics for this section yet. Please check back soon."
            />
          )}
        </div>
      )}

      {/* APTITUDE TOPIC CONTENT VIEW */}
      {isAptitudeModule && selectedTopic && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  {selectedTopic.category}
                </span>
                <Badge variant="primary">Study Topic</Badge>
              </div>
              <h2 className="text-2xl font-black text-slate-900">{selectedTopic.title}</h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {selectedTopic.description || 'Watch topic lectures and review notes.'}
              </p>
            </div>
          </div>

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
          </div>

          {activeTopicTab === 'videos' && (
            <div>
              {loading ? (
                <LoadingState message="Loading videos..." />
              ) : videoContents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videoContents.map((video) => (
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
                            onClick={() => setActiveVideo(video)}
                            className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110"
                          >
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </button>
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
                          <Button
                            size="sm"
                            variant="primary"
                            icon={Play}
                            onClick={() => setActiveVideo(video)}
                          >
                            Watch Lesson
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleToggleComplete(video._id)}
                            className={`p-1.5 rounded-lg transition ${
                              completedMap[video._id]
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title={completedMap[video._id] ? 'Completed' : 'Mark Complete'}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Videos in this Topic"
                  description="Video lectures for this topic are being uploaded."
                />
              )}
            </div>
          )}

          {activeTopicTab === 'notes' && (
            <div>
              {loading ? (
                <LoadingState message="Loading notes..." />
              ) : noteContents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {noteContents.map((note) => (
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
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {note.difficulty || 'Study Note'}
                          </span>
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
                          variant="primary"
                          icon={FileText}
                          onClick={() => setActiveNote(note)}
                        >
                          Read Note (PDF)
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleToggleComplete(note._id)}
                          className={`p-1.5 rounded-lg transition ${
                            completedMap[note._id]
                              ? 'text-emerald-600 bg-emerald-50'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                          title={completedMap[note._id] ? 'Completed' : 'Mark Complete'}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No PDF Notes in this Topic"
                  description="Study notes for this topic are being prepared."
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COMMUNICATION MODULE - 3-LEVEL HIERARCHY (Read-Only Student View) */}
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
                    Communication Categories
                  </span>
                </div>
                <div className="w-full sm:w-72">
                  <Input
                    placeholder="Search categories..."
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
                    .filter((cat) => !searchQuery || cat.title?.toLowerCase().includes(searchQuery.toLowerCase()) || cat.description?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((cat) => (
                      <div
                        key={cat._id}
                        onClick={() => { setSelectedCommCategory(cat); setSearchQuery(''); }}
                        className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-violet-400 hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-800 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200/60 flex items-center gap-1.5">
                              <FolderOpen className="w-3.5 h-3.5 text-violet-600" />
                              Communication
                            </span>
                          </div>
                          <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-violet-700 transition-colors">{cat.title}</h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{cat.description || 'Communication training category.'}</p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-indigo-600" />
                              {cat.topicCount || 0} Topics
                            </span>
                          </div>
                          <span className="text-xs font-bold text-violet-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span>View Topics</span>
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyState
                  title="Communication Content Coming Soon"
                  description="Your instructor is setting up communication training content."
                />
              )}
            </div>
          )}

          {/* LEVEL 2: TOPICS */}
          {selectedCommCategory && !selectedTopic && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-violet-900 via-purple-900 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-violet-800/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-violet-500/30 text-violet-200 px-3 py-1 rounded-xl border border-violet-400/30 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Communication
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">{commTopics.length} Topics</span>
                </div>
                <h2 className="text-2xl font-black text-white">{selectedCommCategory.title}</h2>
                <p className="text-xs text-violet-100/80 mt-1 leading-relaxed">{selectedCommCategory.description}</p>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-600">Topics in {selectedCommCategory.title}</div>
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
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-800 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200/60 flex items-center gap-1.5">
                              <FolderOpen className="w-3.5 h-3.5 text-violet-600" />
                              {selectedCommCategory.title}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-violet-700 transition-colors">{topic.title}</h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{topic.description || 'Communication topic curriculum and training resources.'}</p>
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5 font-bold">
                              <Video className="w-4 h-4 text-blue-600" />
                              <span>{topic.videoCount || 0} Videos</span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <div className="flex items-center gap-1.5 font-bold">
                              <FileText className="w-4 h-4 text-rose-600" />
                              <span>{topic.notesCount || 0} Notes</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="primary"
                            icon={BookOpen}
                            onClick={() => {
                              setSelectedTopic(topic);
                              setActiveTopicTab('videos');
                              setSearchQuery('');
                            }}
                          >
                            Study Topic
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyState
                  title={`No Topics in ${selectedCommCategory.title}`}
                  description="Topics for this category are being prepared."
                />
              )}
            </div>
          )}

          {/* LEVEL 3: TOPIC CONTENT (Read-Only Videos / Notes) */}
          {selectedCommCategory && selectedTopic && (
            <div className="space-y-6">
              {/* Topic Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-violet-800 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200">
                    Communication • {selectedCommCategory.title}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">{selectedTopic.title}</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedTopic.description}</p>
              </div>

              {/* Sub-Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('videos')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'videos'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Videos ({contents.filter(c => c.resourceType === 'video' || c.contentType === 'video').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('notes')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'notes'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF Notes ({contents.filter(c => c.resourceType === 'note' || c.contentType === 'note').length})</span>
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
                  ) : contents.filter(c => (c.resourceType === 'video' || c.contentType === 'video') && (!searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()))).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {contents
                        .filter(c => (c.resourceType === 'video' || c.contentType === 'video') && (!searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase())))
                        .map((video) => (
                          <div
                            key={video._id}
                            className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                          >
                            <div className="relative aspect-video bg-slate-900 overflow-hidden">
                              {video.thumbnailUrl ? (
                                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                  <Video className="w-10 h-10 opacity-50" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button type="button" onClick={() => setActiveVideo(video)} className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                </button>
                              </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{video.title}</h4>
                                {video.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{video.description}</p>}
                              </div>
                              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                                <Button size="sm" variant="primary" icon={Play} onClick={() => setActiveVideo(video)}>
                                  Watch Video
                                </Button>
                                <button type="button" onClick={() => handleToggleComplete(video._id)} className={`p-1.5 rounded-lg transition ${completedMap[video._id] ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}>
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <EmptyState title="No Videos in this Topic" description="Video lessons for this topic are being prepared." />
                  )}
                </div>
              )}

              {/* PDF NOTES TAB */}
              {activeTopicTab === 'notes' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading PDF notes..." />
                  ) : contents.filter(c => (c.resourceType === 'note' || c.contentType === 'note') && (!searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()))).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {contents
                        .filter(c => (c.resourceType === 'note' || c.contentType === 'note') && (!searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase())))
                        .map((note) => (
                          <div key={note._id} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-all group">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-rose-600" />
                                  PDF {note.fileSize ? `• ${note.fileSize}` : ''}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-base text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-2">{note.title}</h4>
                              {note.fileName && <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">📄 {note.fileName}</p>}
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{note.description || 'Study notes in PDF format.'}</p>
                            </div>
                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                              <Button size="sm" variant="outline" icon={FileText} onClick={() => setActiveNote(note)}>
                                View PDF
                              </Button>
                              <button type="button" onClick={() => handleToggleComplete(note._id)} className={`p-1.5 rounded-lg transition ${completedMap[note._id] ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}>
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <EmptyState title="No PDF Notes in this Topic" description="Study notes for this topic are being prepared." />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RESUME MODULE - 3-LEVEL HIERARCHY (Read-Only Student View) */}
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
                    Resume Categories
                  </span>
                </div>
                <div className="w-full sm:w-72">
                  <Input
                    placeholder="Search categories..."
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
                    .filter((cat) => !searchQuery || cat.title?.toLowerCase().includes(searchQuery.toLowerCase()) || cat.description?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((cat) => (
                      <div
                        key={cat._id}
                        onClick={() => { setSelectedResumeCategory(cat); setSearchQuery(''); }}
                        className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 flex items-center gap-1.5">
                              <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                              Resume
                            </span>
                          </div>
                          <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">{cat.title}</h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{cat.description || 'Resume training category.'}</p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-indigo-600" />
                              {cat.topicCount || 0} Topics
                            </span>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span>View Topics</span>
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyState
                  title="Resume Content Coming Soon"
                  description="Your instructor is setting up resume training content."
                />
              )}
            </div>
          )}

          {/* LEVEL 2: TOPICS */}
          {selectedResumeCategory && !selectedTopic && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-emerald-800/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-xl border border-emerald-400/30 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Resume
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">{resumeTopics.length} Topics</span>
                </div>
                <h2 className="text-2xl font-black text-white">{selectedResumeCategory.title}</h2>
                <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">{selectedResumeCategory.description}</p>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-600">Topics in {selectedResumeCategory.title}</div>
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
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 flex items-center gap-1.5">
                              <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                              {selectedResumeCategory.title}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">{topic.title}</h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{topic.description || 'Resume topic curriculum and training resources.'}</p>
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5 font-bold">
                              <Video className="w-4 h-4 text-blue-600" />
                              <span>{topic.videoCount || 0} Videos</span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <div className="flex items-center gap-1.5 font-bold">
                              <FileText className="w-4 h-4 text-rose-600" />
                              <span>{topic.notesCount || 0} Notes</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="primary"
                            icon={BookOpen}
                            onClick={() => {
                              setSelectedTopic(topic);
                              setActiveTopicTab('videos');
                              setSearchQuery('');
                            }}
                          >
                            Study Topic
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyState
                  title={`No Topics in ${selectedResumeCategory.title}`}
                  description="Topics for this category are being prepared."
                />
              )}
            </div>
          )}

          {/* LEVEL 3: TOPIC CONTENT (Read-Only Videos / Notes) */}
          {selectedResumeCategory && selectedTopic && (
            <div className="space-y-6">
              {/* Topic Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Resume • {selectedResumeCategory.title}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">{selectedTopic.title}</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedTopic.description}</p>
              </div>

              {/* Sub-Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('videos')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'videos'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Videos ({contents.filter(c => c.resourceType === 'video' || c.contentType === 'video').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('notes')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'notes'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF Notes ({contents.filter(c => c.resourceType === 'note' || c.contentType === 'note').length})</span>
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
                  ) : contents.filter(c => (c.resourceType === 'video' || c.contentType === 'video') && (!searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()))).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {contents
                        .filter(c => (c.resourceType === 'video' || c.contentType === 'video') && (!searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase())))
                        .map((video) => (
                          <div
                            key={video._id}
                            className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                          >
                            <div className="relative aspect-video bg-slate-900 overflow-hidden">
                              {video.thumbnailUrl ? (
                                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                  <Video className="w-10 h-10 opacity-50" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button type="button" onClick={() => setActiveVideo(video)} className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                </button>
                              </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{video.title}</h4>
                                {video.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{video.description}</p>}
                              </div>
                              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                                <Button size="sm" variant="primary" icon={Play} onClick={() => setActiveVideo(video)}>
                                  Watch Video
                                </Button>
                                <button type="button" onClick={() => handleToggleComplete(video._id)} className={`p-1.5 rounded-lg transition ${completedMap[video._id] ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}>
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <EmptyState title="No Videos in this Topic" description="Video lessons for this topic are being prepared." />
                  )}
                </div>
              )}

              {/* PDF NOTES TAB */}
              {activeTopicTab === 'notes' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading PDF notes..." />
                  ) : contents.filter(c => (c.resourceType === 'note' || c.contentType === 'note') && (!searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()))).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {contents
                        .filter(c => (c.resourceType === 'note' || c.contentType === 'note') && (!searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase())))
                        .map((note) => (
                          <div key={note._id} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-all group">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-rose-600" />
                                  PDF {note.fileSize ? `• ${note.fileSize}` : ''}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-base text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-2">{note.title}</h4>
                              {note.fileName && <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">📄 {note.fileName}</p>}
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{note.description || 'Study notes in PDF format.'}</p>
                            </div>
                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                              <Button size="sm" variant="outline" icon={FileText} onClick={() => setActiveNote(note)}>
                                View PDF
                              </Button>
                              <button type="button" onClick={() => handleToggleComplete(note._id)} className={`p-1.5 rounded-lg transition ${completedMap[note._id] ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}>
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <EmptyState title="No PDF Notes in this Topic" description="Study notes for this topic are being prepared." />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INTERVIEW PREPARATION MODULE (STUDENT READ-ONLY) */}
      {/* ========================================================================= */}
      {isInterviewModule && (
        <div className="space-y-6">
          {/* LEVEL 1: 5 FIXED INTERVIEW CATEGORIES */}
          {!selectedInterviewCategory && !selectedTopic && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                    Interview Categories ({interviewCategories.length})
                  </span>
                </div>
                <div className="w-full lg:w-72">
                  <Input
                    placeholder="Search interview categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {loading ? (
                <LoadingState message="Loading interview preparation modules..." />
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
                        className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer group"
                      >
                        <div className="p-6">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                            <Icon className="w-6 h-6" />
                          </div>
                          <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {cat.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {cat.description || 'Master placement interview rounds, video tutorials, and reference notes.'}
                          </p>
                        </div>
                        <div className="mt-6 pt-4 px-6 pb-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-indigo-600" />
                              {cat.title === 'Company Preparation' ? `${cat.companyCount || companies.length || 10} Companies` : `${cat.topicCount || 0} Topics`}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span>{cat.title === 'Company Preparation' ? 'Explore Companies' : 'Explore Topics'}</span>
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="Interview Preparation Coming Soon"
                  description="Your instructor is setting up interview preparation resources."
                />
              )}
            </div>
          )}

          {/* LEVEL 2 (STANDARD CATEGORIES): TOPICS LIST */}
          {selectedInterviewCategory && selectedInterviewCategory.title !== 'Company Preparation' && !selectedTopic && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-indigo-800/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-xl border border-indigo-400/30 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Interview Preparation
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">{filteredInterviewTopics.length} Topics</span>
                </div>
                <h2 className="text-2xl font-black text-white">{selectedInterviewCategory.title}</h2>
                <p className="text-xs text-indigo-100/80 mt-1 leading-relaxed">{selectedInterviewCategory.description}</p>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-600">Topics in {selectedInterviewCategory.title}</div>
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
                <LoadingState message={`Loading ${selectedInterviewCategory.title} topics...`} />
              ) : filteredInterviewTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredInterviewTopics.map((topic) => (
                    <div
                      key={topic._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60 flex items-center gap-1.5">
                            <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                            {selectedInterviewCategory.title}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-indigo-700 transition-colors">{topic.title}</h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{topic.description || 'Topic curriculum and training resources.'}</p>
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Video className="w-4 h-4 text-blue-600" />
                            <span>{topic.videoCount || 0} Videos</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span>{topic.notesCount || 0} Notes</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-end">
                        <Button
                          size="sm"
                          variant="primary"
                          icon={BookOpen}
                          onClick={() => {
                            setSelectedTopic(topic);
                            setActiveTopicTab('videos');
                            setSearchQuery('');
                          }}
                        >
                          Study Topic
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={`No Topics in ${selectedInterviewCategory.title}`}
                  description="Topics for this category are being prepared."
                />
              )}
            </div>
          )}

          {/* LEVEL 2 (COMPANY PREPARATION): COMPANIES LIST */}
          {selectedInterviewCategory && selectedInterviewCategory.title === 'Company Preparation' && !selectedCompany && !selectedTopic && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white p-6 rounded-3xl shadow-md border border-amber-800/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-200 px-3 py-1 rounded-xl border border-amber-400/30 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Target Employers
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">{filteredCompanies.length} Companies</span>
                </div>
                <h2 className="text-2xl font-black text-white">Company-Specific Preparation</h2>
                <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">
                  Targeted recruitment patterns, aptitude syllabus, coding tests, and interview rounds for top recruiters.
                </p>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-600">Placement Target Companies</div>
                <div className="w-full lg:w-72">
                  <Input
                    placeholder="Search target company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

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
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer group"
                    >
                      <div className="p-6">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 mb-4 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs font-black text-lg">
                          {comp.logoUrl ? (
                            <img src={comp.logoUrl} alt={comp.name} className="w-8 h-8 object-contain rounded-xl" />
                          ) : (
                            comp.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">
                          {comp.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {comp.description || `Placement patterns, test formats, and interview preparation for ${comp.name}.`}
                        </p>
                      </div>
                      <div className="mt-6 pt-4 px-6 pb-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-amber-600" />
                            {comp.topicCount || 0} Topics
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>View Company Prep</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Companies Coming Soon"
                  description="Target company preparation modules are being set up."
                />
              )}
            </div>
          )}

          {/* LEVEL 3 (COMPANY PREPARATION): TOPICS FOR SELECTED COMPANY */}
          {selectedInterviewCategory && selectedInterviewCategory.title === 'Company Preparation' && selectedCompany && !selectedTopic && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white p-6 rounded-3xl shadow-md border border-amber-800/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-200 px-3 py-1 rounded-xl border border-amber-400/30 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedCompany.name}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">{filteredCompanyTopics.length} Topics</span>
                </div>
                <h2 className="text-2xl font-black text-white">{selectedCompany.name} Preparation Topics</h2>
                <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">
                  {selectedCompany.description || `Comprehensive test patterns, technical rounds, and interview roadmap for ${selectedCompany.name}.`}
                </p>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-600">Topics for {selectedCompany.name}</div>
                <div className="w-full lg:w-72">
                  <Input
                    placeholder={`Search ${selectedCompany.name} topics...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {loading ? (
                <LoadingState message={`Loading ${selectedCompany.name} topics...`} />
              ) : filteredCompanyTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCompanyTopics.map((topic) => (
                    <div
                      key={topic._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-amber-600" />
                            {selectedCompany.name}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-amber-700 transition-colors">{topic.title}</h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{topic.description || `${selectedCompany.name} curriculum and preparation resources.`}</p>
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Video className="w-4 h-4 text-blue-600" />
                            <span>{topic.videoCount || 0} Videos</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span>{topic.notesCount || 0} Notes</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-end">
                        <Button
                          size="sm"
                          variant="primary"
                          icon={BookOpen}
                          onClick={() => {
                            setSelectedTopic(topic);
                            setActiveTopicTab('videos');
                            setSearchQuery('');
                          }}
                        >
                          Study Topic
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={`No Topics for ${selectedCompany.name}`}
                  description="Topics for this company are being prepared."
                />
              )}
            </div>
          )}

          {/* LEVEL 3 / LEVEL 4: TOPIC CONTENT (Read-Only Videos / Notes) */}
          {selectedInterviewCategory && selectedTopic && (
            <div className="space-y-6">
              {/* Topic Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                    Interview • {selectedCompany ? selectedCompany.name : selectedInterviewCategory.title}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">{selectedTopic.title}</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedTopic.description}</p>
              </div>

              {/* Sub-Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('videos')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'videos'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
                  ) : videoContents.filter(c => !searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {videoContents
                        .filter(c => !searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((video) => (
                          <div
                            key={video._id}
                            className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                          >
                            <div className="relative aspect-video bg-slate-900 overflow-hidden">
                              {video.thumbnailUrl ? (
                                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                  <Video className="w-10 h-10 opacity-50" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button type="button" onClick={() => setActiveVideo(video)} className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                </button>
                              </div>
                              <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                {video.difficulty || 'Beginner'}
                              </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{video.title}</h4>
                                {video.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{video.description}</p>}
                              </div>
                              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                                <Button size="sm" variant="primary" icon={Play} onClick={() => setActiveVideo(video)}>
                                  Watch Video
                                </Button>
                                <button type="button" onClick={() => handleToggleComplete(video._id)} className={`p-1.5 rounded-lg transition ${completedMap[video._id] ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}>
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <EmptyState title="No Videos in this Topic" description="Video lessons for this topic are being prepared." />
                  )}
                </div>
              )}

              {/* PDF NOTES TAB */}
              {activeTopicTab === 'notes' && (
                <div>
                  {loading ? (
                    <LoadingState message="Loading PDF notes..." />
                  ) : noteContents.filter(c => !searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {noteContents
                        .filter(c => !searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((note) => (
                          <div key={note._id} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-all group">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-rose-600" />
                                  PDF {note.fileSize ? `• ${note.fileSize}` : ''}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-base text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-2">{note.title}</h4>
                              {note.fileName && <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">📄 {note.fileName}</p>}
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{note.description || 'Study notes in PDF format.'}</p>
                            </div>
                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                              <Button size="sm" variant="outline" icon={FileText} onClick={() => setActiveNote(note)}>
                                View PDF
                              </Button>
                              <button type="button" onClick={() => handleToggleComplete(note._id)} className={`p-1.5 rounded-lg transition ${completedMap[note._id] ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}>
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <EmptyState title="No PDF Notes in this Topic" description="Study notes for this topic are being prepared." />
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
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <FilterTabs
              tabs={filterTabs}
              activeTab={activeSubfilter}
              onTabChange={setActiveSubfilter}
            />
          </div>

          {loading ? (
            <LoadingState message={`Fetching ${currentCategory} content...`} />
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
                        onClick={() => setActiveVideo(item)}
                        className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110"
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
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
                      <Button
                        size="sm"
                        variant="primary"
                        icon={Play}
                        onClick={() => setActiveVideo(item)}
                      >
                        Watch Video
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleToggleComplete(item._id)}
                        className={`p-1.5 rounded-lg transition ${
                          completedMap[item._id]
                            ? 'text-emerald-600 bg-emerald-50'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No Content in ${currentCategory}`}
              description="Instructors are preparing curriculum resources for this module."
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Modal: Video Player */}
      {activeVideo && (
        <Modal
          isOpen={Boolean(activeVideo)}
          onClose={() => setActiveVideo(null)}
          title={activeVideo.title}
          size="lg"
        >
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
              {activeVideo.videoUrl && (activeVideo.videoUrl.includes('youtube') || activeVideo.videoUrl.includes('youtu.be')) ? (
                <iframe
                  src={
                    activeVideo.videoUrl.includes('watch?v=')
                      ? activeVideo.videoUrl.replace('watch?v=', 'embed/')
                      : activeVideo.videoUrl.includes('youtu.be/')
                      ? activeVideo.videoUrl.replace('youtu.be/', 'www.youtube.com/embed/')
                      : activeVideo.videoUrl
                  }
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeVideo.videoUrl && activeVideo.videoUrl.includes('vimeo.com') ? (
                <iframe
                  src={activeVideo.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-6 text-center">
                  <Video className="w-12 h-12 mb-2 text-slate-400" />
                  <p className="text-sm font-bold text-white mb-2">Direct Video Resource</p>
                  <a
                    href={activeVideo.videoUrl || activeVideo.resourceUrl}
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

            {activeVideo.description && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {activeVideo.description}
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* 2. Modal: PDF Note Reader */}
      {activeNote && (
        <NoteReaderModal
          isOpen={Boolean(activeNote)}
          onClose={() => setActiveNote(null)}
          note={activeNote}
        />
      )}
    </div>
  );
};

export default TrainingPage;
