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
import ProgressBar from '../../components/ProgressBar';
import TopicAssessmentSection from '../../components/training/TopicAssessmentSection';
import SubmodulePracticeAnalytics from '../../components/training/SubmodulePracticeAnalytics';
import PracticeTestModal from '../../components/training/PracticeTestModal';
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
  Users,
  Award,
  ChevronLeft,
  ListVideo,
  Sparkles,
  Target,
  ShieldCheck
} from 'lucide-react';
import YoutubeIcon from '../../components/YoutubeIcon';
import { getEmbedVideoUrl, isPlaylistUrl, getExternalWatchUrl, extractPlaylistId } from '../../utils/videoUtils';


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
  // Domain Hierarchy for Student (Direct YouTube Playlist Workflow)
  // Level 1: selectedDept (e.g. 'EXTC', 'CSE', 'IT', etc.)
  // Level 2: selectedDomainCategory (Category object)
  // Level 3: domainPlaylists (Published YouTube Playlists)
  // Level 4: selectedDomainPlaylist (Embedded playlist viewer)
  // ==========================================
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedDomainCategory, setSelectedDomainCategory] = useState(null);
  const [domainCategories, setDomainCategories] = useState([]);
  const [deptStats, setDeptStats] = useState({});
  const [domainPlaylists, setDomainPlaylists] = useState([]);
  const [domainNotes, setDomainNotes] = useState([]);
  const [activeDomainTab, setActiveDomainTab] = useState('playlists');
  const [selectedDomainPlaylist, setSelectedDomainPlaylist] = useState(null);
  const [activeLectureIndex, setActiveLectureIndex] = useState(0);

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

  const [practiceModalTopic, setPracticeModalTopic] = useState(null);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);

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
        fetchCategoryPlaylists(selectedDomainCategory._id);
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
      // 1. Dedicated backend endpoint for real-time live department stats
      const statsRes = await api.getDepartmentOverviewStats();
      if (statsRes && statsRes.success && statsRes.stats) {
        setDeptStats(statsRes.stats);
        return;
      }

      // 2. Fallback: Aggregate from categories with alias canonicalization
      const res = await api.getCategories({ module: 'Domain' });
      if (res.success && res.categories) {
        const stats = {};
        DEPARTMENT_DETAILS.forEach((d) => {
          const canonId = canonicalizeDepartment(d.id);
          const deptCats = res.categories.filter((c) => {
            const cCanon = canonicalizeDepartment(c.department || c.departmentId);
            return cCanon === canonId || c.department === d.id || c.department === d.code || c.department === d.dbKey;
          });
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
            ),
            playlistCount: deptCats.reduce(
              (acc, c) => acc + (c.publishedPlaylistCount !== undefined ? c.publishedPlaylistCount : (c.playlistCount || 0)),
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

  const fetchCategoryPlaylists = async (categoryId) => {
    setLoading(true);
    try {
      const [plRes, notesRes] = await Promise.all([
        api.getPlaylists({ categoryId }),
        api.getContentList({ module: 'Domain', categoryId, resourceType: 'note' })
      ]);
      if (plRes.success) {
        setDomainPlaylists(plRes.playlists || []);
      }
      if (notesRes.success) {
        setDomainNotes((notesRes.contents || []).filter(c => c.status === 'published' || !c.status));
      }
    } catch (err) {
      console.error('Error fetching category playlists and notes:', err);
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
      const [res, progressRes] = await Promise.all([
        api.getContentList({
          module: moduleOverride || (isDomainModule ? 'Domain' : (isCommunicationModule ? 'Communication' : (isResumeModule ? 'Resume' : (isInterviewModule ? 'Interview Preparation' : 'Aptitude')))),
          topicId
        }),
        api.getSubmoduleProgress(topicId)
      ]);

      if (res.success) {
        setContents((res.contents || []).filter(c => c.status === 'published' || !c.status));
      }

      if (progressRes?.success && progressRes.progress?.completedContents) {
        const cMap = {};
        progressRes.progress.completedContents.forEach((id) => {
          cMap[id] = true;
        });
        setCompletedMap(cMap);
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

  const handleOpenCategoryPracticeTest = (catObj) => {
    if (!catObj) return;
    const categoryContext = {
      _id: catObj._id,
      categoryId: catObj._id,
      category: catObj.title,
      title: catObj.title,
      department: selectedDept,
      departmentId: currentDeptObj?._id,
      module: 'Domain'
    };
    setPracticeModalTopic(categoryContext);
    setIsPracticeModalOpen(true);
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

  const filteredDomainPlaylists = domainPlaylists.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.channelTitle?.toLowerCase().includes(q)
    );
  });

  const filteredDomainNotes = domainNotes.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title?.toLowerCase().includes(q) ||
      n.description?.toLowerCase().includes(q)
    );
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
      if (selectedDomainPlaylist) {
        return {
          title: selectedDomainPlaylist.title,
          subtitle: `${selectedDomainPlaylist.channelTitle ? `By ${selectedDomainPlaylist.channelTitle} • ` : ''}${selectedDomainPlaylist.videoCount || (selectedDomainPlaylist.videos ? selectedDomainPlaylist.videos.length : 0)} video lectures under ${selectedDomainCategory?.title} (${currentDeptObj?.code || selectedDept}).`,
          breadcrumbs: [
            { label: 'Student', link: '/student/dashboard' },
            { label: 'Training', onClick: () => { setSelectedDept(null); setSelectedDomainCategory(null); setSelectedDomainPlaylist(null); } },
            { label: 'Domain Knowledge', onClick: () => { setSelectedDept(null); setSelectedDomainCategory(null); setSelectedDomainPlaylist(null); } },
            { label: currentDeptObj?.code || selectedDept, onClick: () => { setSelectedDomainPlaylist(null); } },
            { label: selectedDomainCategory?.title || 'Category', onClick: () => { setSelectedDomainPlaylist(null); } },
            { label: selectedDomainPlaylist.title }
          ],
          actions: (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedDomainPlaylist(null)}
            >
              Back to Playlists
            </Button>
          )
        };
      }
      if (selectedDomainCategory) {
        return {
          title: `${selectedDomainCategory.title} • Playlists`,
          subtitle: `Explore structured YouTube video playlists and lecture curricula under ${selectedDomainCategory.title} for ${currentDeptObj?.name || selectedDept}.`,
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
                    const st = deptStats[dept.id] || deptStats[dept.code] || deptStats[canonicalizeDepartment(dept.id)] || { categoryCount: 0, topicCount: 0, videoCount: 0, notesCount: 0 };
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
                        setSelectedDomainPlaylist(null);
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
                          <span className="flex items-center gap-1 font-bold text-red-600">
                            <YoutubeIcon className="w-3.5 h-3.5 text-red-600" />
                            {cat.publishedPlaylistCount !== undefined ? cat.publishedPlaylistCount : (cat.playlistCount || 0)} Playlists
                          </span>
                          <span className="flex items-center gap-1 font-bold text-blue-600">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            {cat.publishedNotes !== undefined ? cat.publishedNotes : (cat.notesCount || 0)} Notes
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

          {/* LEVEL 3: Category Playlists & Practice Test (Domain Knowledge Direct Workflow) */}
          {selectedDept && selectedDomainCategory && !selectedDomainPlaylist && (
            <div className="space-y-6">
              {/* Category Header Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {currentDeptObj?.code || selectedDept} • {selectedDomainCategory.title}
                    </span>
                    <Badge variant="primary">Domain Knowledge</Badge>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {domainPlaylists.length} Playlists • {domainNotes.length} Notes Available
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedDomainCategory.title}</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {selectedDomainCategory.description || 'Watch structured YouTube video series, curated lecture curricula, read study notes, and test your knowledge with self practice assessments.'}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Award}
                    onClick={() => handleOpenCategoryPracticeTest(selectedDomainCategory)}
                    className="!bg-blue-600 hover:!bg-blue-700 !border-blue-600 shadow-sm shadow-blue-500/20 text-white font-bold"
                  >
                    Practice Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ArrowLeft}
                    onClick={() => { setSelectedDomainCategory(null); setSelectedDomainPlaylist(null); setActiveDomainTab('playlists'); }}
                  >
                    Back to Categories
                  </Button>
                </div>
              </div>

              {/* Dedicated Category Practice Test Banner */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden border border-blue-800/40">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 -mb-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs">
                        <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                        Interactive Assessment
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Question Bank Verified
                      </span>
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        Earn up to 40 XP
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-white tracking-tight">
                      {selectedDomainCategory.title} Practice Test
                    </h3>

                    <p className="text-xs text-blue-100/90 leading-relaxed">
                      Test your domain concepts in <span className="font-bold text-white">{selectedDomainCategory.title}</span> ({currentDeptObj?.code || selectedDept}). Practice with real timed MCQs, comprehensive solution breakdowns, instant evaluation, and XP rewards.
                    </p>

                    <div className="flex items-center gap-4 pt-1 flex-wrap text-[11px] text-blue-200/90 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>5 to 30 Minutes</span>
                      </div>
                      <span className="text-blue-400/40">•</span>
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Configurable Difficulties</span>
                      </div>
                      <span className="text-blue-400/40">•</span>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Detailed Explanations</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Button
                      variant="primary"
                      size="lg"
                      icon={Play}
                      onClick={() => handleOpenCategoryPracticeTest(selectedDomainCategory)}
                      className="!bg-blue-500 hover:!bg-blue-400 !border-blue-400 !text-slate-950 font-black shadow-lg shadow-blue-500/25 px-6 py-3.5 text-sm"
                    >
                      Start Practice Test
                    </Button>
                  </div>
                </div>
              </div>

              {/* Domain Content Tabs & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveDomainTab('playlists')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeDomainTab === 'playlists'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <YoutubeIcon className="w-4 h-4" />
                    <span>Playlists ({domainPlaylists.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDomainTab('notes')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeDomainTab === 'notes'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF Notes ({domainNotes.length})</span>
                  </button>
                </div>
                <div className="w-full sm:w-72">
                  <Input
                    placeholder={activeDomainTab === 'playlists' ? "Search playlists..." : "Search study notes..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Playlists & Notes Content Views */}
              {loading ? (
                <LoadingState message={activeDomainTab === 'playlists' ? "Loading playlists..." : "Loading study notes..."} />
              ) : activeDomainTab === 'playlists' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Dedicated Practice Test Card alongside Playlist Cards */}
                  <div
                    onClick={() => handleOpenCategoryPracticeTest(selectedDomainCategory)}
                    className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white rounded-3xl border-2 border-blue-200 hover:border-blue-500 shadow-xs hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="aspect-video bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 relative overflow-hidden flex flex-col items-center justify-center text-white p-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/40 border border-blue-400/40 flex items-center justify-center text-blue-200 mb-2 shadow-inner group-hover:scale-110 transition-transform">
                          <Award className="w-6 h-6 text-blue-300" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-blue-200">
                          Practice Assessment
                        </span>
                        <span className="text-[11px] text-blue-300/80 mt-0.5">
                          Timed MCQs • Instant Scoring
                        </span>
                        <div className="absolute bottom-3 right-3 bg-blue-500/30 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-blue-400/30">
                          <Clock className="w-3 h-3 text-blue-300" />
                          <span>5–30 Mins</span>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Interactive Drill</span>
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {selectedDomainCategory.title} Practice Test
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          Test and validate your domain mastery with questions from the institutional question bank.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full justify-center !bg-blue-600 hover:!bg-blue-700 !border-blue-600 font-bold"
                        icon={Play}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCategoryPracticeTest(selectedDomainCategory);
                        }}
                      >
                        Start Practice Test
                      </Button>
                    </div>
                  </div>

                  {/* Curated YouTube Playlists */}
                  {filteredDomainPlaylists.map((pl) => (
                    <div
                      key={pl._id}
                      onClick={() => {
                        setSelectedDomainPlaylist(pl);
                        setActiveLectureIndex(0);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-red-400 hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        {/* 16:9 Thumbnail preview container */}
                        <div className="aspect-video bg-slate-900 relative overflow-hidden group-hover:opacity-95 transition-opacity">
                          {pl.thumbnailUrl ? (
                            <img
                              src={pl.thumbnailUrl}
                              alt={pl.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white">
                              <YoutubeIcon className="w-12 h-12 text-red-500 mb-2" />
                              <span className="text-xs font-semibold text-slate-300">YouTube Playlist</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                          {/* Video count badge */}
                          <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
                            <ListVideo className="w-3.5 h-3.5 text-red-400" />
                            <span>{pl.videoCount === 1 ? '1 Video' : `${pl.videoCount || (pl.videos ? pl.videos.length : 0)} Lectures`}</span>
                          </div>

                          {/* Play button hover overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-2xs">
                            <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-white translate-x-0.5" />
                            </div>
                          </div>
                        </div>

                        {/* Card body */}
                        <div className="p-5">
                          {pl.channelTitle && (
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <span>{pl.channelTitle}</span>
                            </div>
                          )}
                          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2">
                            {pl.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {pl.description || 'Complete lecture playlist for structured concept mastery.'}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="p-5 pt-0">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full justify-center !bg-red-600 hover:!bg-red-700 !border-red-600"
                          icon={Play}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDomainPlaylist(pl);
                            setActiveLectureIndex(0);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          {pl.videoCount === 1 ? 'Watch Video' : 'Watch Playlist'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* PDF Notes Grid */
                filteredDomainNotes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDomainNotes.map((note) => (
                      <div
                        key={note._id}
                        className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-xl transition-all duration-200 p-6 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              PDF Document
                            </span>
                            {note.fileSize && (
                              <span className="text-[11px] font-semibold text-slate-400">
                                {Math.round(note.fileSize / 1024)} KB
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-base text-slate-900 line-clamp-2">
                            {note.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                            {note.description || 'Comprehensive domain study notes and reference material in PDF format.'}
                          </p>
                        </div>

                        <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            icon={FileText}
                            onClick={() => setActiveNote(note)}
                            className="!bg-blue-600 hover:!bg-blue-700 !border-blue-600 font-bold"
                          >
                            Read Note (PDF)
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleToggleComplete(note._id)}
                            className={`p-2 rounded-xl transition ${
                              completedMap[note._id]
                                ? 'text-emerald-600 bg-emerald-50 border border-emerald-200'
                                : 'text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100'
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
                    title="No PDF Notes in this Category"
                    description={`Study notes and reference guides for ${selectedDomainCategory.title} are being prepared.`}
                  />
                )
              )}
            </div>
          )}

          {/* LEVEL 4: Playlist / Video Viewing Page (Embedded Player + Lecture Navigation) */}
          {selectedDept && selectedDomainCategory && selectedDomainPlaylist && (() => {
            const currentVideos = selectedDomainPlaylist.videos || [];
            const activeLecture = currentVideos[activeLectureIndex] || null;
            const isSingle = !selectedDomainPlaylist.playlistId?.startsWith('PL') && currentVideos.length <= 1;
            const embedUrl = isSingle
              ? `https://www.youtube.com/embed/${activeLecture?.videoId || selectedDomainPlaylist.playlistId}?autoplay=1&rel=0`
              : (activeLecture?.videoId
                  ? `https://www.youtube.com/embed/${activeLecture.videoId}?list=${selectedDomainPlaylist.playlistId}&autoplay=1&rel=0`
                  : `https://www.youtube.com/embed/videoseries?list=${selectedDomainPlaylist.playlistId}&rel=0`);

            return (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                        {currentDeptObj?.code || selectedDept} • {selectedDomainCategory.title}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {isSingle ? 'Single Video Lecture' : 'Curated Playlist'}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">{selectedDomainPlaylist.title}</h2>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={ArrowLeft}
                      onClick={() => setSelectedDomainPlaylist(null)}
                    >
                      Back to Videos & Playlists
                    </Button>
                  </div>
                </div>

                {/* Main Player & Lectures Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Embedded YouTube Video Player + Current Lecture Info */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* 16:9 Video Embed Container */}
                    <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-xl border border-slate-900">
                      <iframe
                        key={activeLecture?.videoId || selectedDomainPlaylist.playlistId}
                        src={embedUrl}
                        title={activeLecture?.title || selectedDomainPlaylist.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>

                    {/* Lecture Meta & Next / Previous Navigation */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                            {currentVideos.length > 1 ? (
                              <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-md font-extrabold border border-red-200">
                                Lecture {activeLectureIndex + 1} of {currentVideos.length}
                              </span>
                            ) : (
                              <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-md font-extrabold border border-red-200">
                                Full Lecture Video
                              </span>
                            )}
                            {selectedDomainPlaylist.channelTitle && (
                              <span>Channel: {selectedDomainPlaylist.channelTitle}</span>
                            )}
                          </div>
                          <h3 className="text-lg font-black text-slate-900 leading-snug">
                            {activeLecture?.title || selectedDomainPlaylist.title}
                          </h3>
                        </div>

                        {/* Navigation Buttons */}
                        {currentVideos.length > 1 && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={ChevronLeft}
                              disabled={activeLectureIndex === 0}
                              onClick={() => {
                                if (activeLectureIndex > 0) {
                                  setActiveLectureIndex(activeLectureIndex - 1);
                                }
                              }}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={activeLectureIndex >= currentVideos.length - 1}
                              onClick={() => {
                                if (activeLectureIndex < currentVideos.length - 1) {
                                  setActiveLectureIndex(activeLectureIndex + 1);
                                }
                              }}
                            >
                              <span>Next</span>
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Playlist Description & YouTube External Link */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-slate-600 max-w-xl leading-relaxed">
                          {selectedDomainPlaylist.description || 'Watch all lectures in sequence for comprehensive concept understanding.'}
                        </div>
                        <a
                          href={activeLecture?.watchUrl || selectedDomainPlaylist.playlistUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1.5 shrink-0"
                        >
                          <YoutubeIcon className="w-4 h-4 text-red-600" />
                          <span>Open on YouTube</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Playlist Lecture List Sidebar */}
                  <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ListVideo className="w-4 h-4 text-red-600" />
                        <span className="font-extrabold text-sm text-slate-800">Playlist Lectures</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {currentVideos.length} Videos
                      </span>
                    </div>

                    {/* Scrollable list */}
                    <div className="max-h-[560px] overflow-y-auto divide-y divide-slate-100 p-2">
                      {currentVideos.length > 0 ? (
                        currentVideos.map((video, idx) => {
                          const isActive = idx === activeLectureIndex;
                          return (
                            <div
                              key={video.videoId || idx}
                              onClick={() => setActiveLectureIndex(idx)}
                              className={`p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-150 ${
                                isActive
                                  ? 'bg-red-50/80 border border-red-200 shadow-xs'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              {/* Index number or Playing Indicator */}
                              <div className="w-6 text-center shrink-0">
                                {isActive ? (
                                  <Play className="w-4 h-4 text-red-600 fill-red-600 mx-auto" />
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">
                                    {idx + 1}
                                  </span>
                                )}
                              </div>

                              {/* Thumbnail */}
                              <div className="w-20 aspect-video bg-slate-900 rounded-lg overflow-hidden shrink-0 relative">
                                {video.thumbnailUrl ? (
                                  <img
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                    <YoutubeIcon className="w-4 h-4 text-slate-500" />
                                  </div>
                                )}
                              </div>

                              {/* Video Details */}
                              <div className="min-w-0 flex-1">
                                <h4
                                  className={`text-xs font-extrabold leading-snug line-clamp-2 ${
                                    isActive ? 'text-red-700' : 'text-slate-800'
                                  }`}
                                >
                                  {video.title}
                                </h4>
                                {isActive && (
                                  <span className="text-[10px] font-black uppercase text-red-600 tracking-wider mt-0.5 inline-block">
                                    Now Playing
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-500">
                          <p>Individual lecture breakdown not loaded. You can watch the full series directly in the embedded player on the left.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

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
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('assessment')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'assessment'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Assessments & Practice</span>
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
                      {videoContents.map((video, idx) => {
                        const isPlaylist = isPlaylistUrl(video.videoUrl || video.resourceUrl);
                        return (
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

                              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                                <span className="bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                                  Lecture #{video.order !== undefined && video.order !== null ? video.order : idx + 1}
                                </span>
                                {isPlaylist && (
                                  <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                                    <Layers className="w-3 h-3" /> Playlist
                                  </span>
                                )}
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
                        );
                      })}
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

              {activeTopicTab === 'assessment' && (
                <TopicAssessmentSection
                  topic={selectedTopic}
                  moduleName="Domain Knowledge"
                  categoryName={selectedDomainCategory?.title || ''}
                />
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

          {/* Submodule Practice Analytics & Mastery Deck (Circle & Bar Charts) */}
          <SubmodulePracticeAnalytics
            moduleName="Aptitude"
            categoryName={activeSubfilter}
            categoryLabel={activeCategoryLabel}
            onStartPractice={(topicDoc) => {
              setPracticeModalTopic(topicDoc);
              setIsPracticeModalOpen(true);
            }}
          />

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
                {selectedTopic.description || 'Watch topic lectures, study revision notes, and take assessments.'}
              </p>
            </div>

            {/* Lecture/Topic Completion Progress */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl min-w-[240px]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-700">Topic Completion</span>
                <span className="font-black text-emerald-600">
                  {contents.length > 0
                    ? Math.round((Object.values(completedMap).filter(Boolean).length / contents.length) * 100)
                    : 0}%
                </span>
              </div>
              <ProgressBar
                progress={
                  contents.length > 0
                    ? Math.round((Object.values(completedMap).filter(Boolean).length / contents.length) * 100)
                    : 0
                }
                color="emerald"
              />
              <div className="text-[10px] text-slate-500 font-semibold mt-1.5 flex items-center justify-between">
                <span>{Object.values(completedMap).filter(Boolean).length} of {contents.length} resources completed</span>
                <span className="text-amber-600 font-bold">+50 XP on 100%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
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
              <button
                type="button"
                onClick={() => setActiveTopicTab('assessment')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                  activeTopicTab === 'assessment'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Assessments & Practice</span>
              </button>
            </div>
            {activeTopicTab !== 'assessment' && (
              <div className="w-full sm:w-64">
                <Input
                  placeholder={`Search ${activeTopicTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}
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

          {activeTopicTab === 'assessment' && (
            <TopicAssessmentSection
              topic={selectedTopic}
              moduleName="Aptitude"
              categoryName={selectedTopic?.category || activeSubfilter || 'Quantitative'}
            />
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

              {/* Submodule Practice Analytics & Mastery Deck */}
              <SubmodulePracticeAnalytics
                moduleName="Communication"
                categoryName={selectedCommCategory.title}
                categoryLabel={selectedCommCategory.title}
                onStartPractice={(topicDoc) => {
                  setPracticeModalTopic(topicDoc);
                  setIsPracticeModalOpen(true);
                }}
              />

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
                        <div
                          className="p-6 cursor-pointer"
                          onClick={() => {
                            setSelectedTopic(topic);
                            setActiveTopicTab('videos');
                            setSearchQuery('');
                          }}
                        >
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
                        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            icon={Award}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPracticeModalTopic(topic);
                              setIsPracticeModalOpen(true);
                            }}
                          >
                            Practice Test
                          </Button>
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

          {/* LEVEL 3: TOPIC CONTENT (Videos / Notes / Assessments & Practice) */}
          {selectedCommCategory && selectedTopic && (
            <div className="space-y-6">
              {/* Topic Banner with Progress */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-violet-800 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200">
                      Communication • {selectedCommCategory.title}
                    </span>
                    <Badge variant="primary">Study Topic</Badge>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedTopic.title}</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">{selectedTopic.description}</p>
                </div>

                {/* Progress Card */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl min-w-[240px]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700">Topic Completion</span>
                    <span className="font-black text-violet-600">
                      {contents.length > 0
                        ? Math.round((Object.values(completedMap).filter(Boolean).length / contents.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <ProgressBar
                    progress={
                      contents.length > 0
                        ? Math.round((Object.values(completedMap).filter(Boolean).length / contents.length) * 100)
                        : 0
                    }
                    color="violet"
                  />
                  <div className="text-[10px] text-slate-500 font-semibold mt-1.5 flex items-center justify-between">
                    <span>{Object.values(completedMap).filter(Boolean).length} of {contents.length} resources completed</span>
                    <span className="text-amber-600 font-bold">+50 XP on 100%</span>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: Videos, Notes, Assessments */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
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
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('assessment')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'assessment'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Assessments & Practice</span>
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

              {/* ASSESSMENTS & PRACTICE TAB */}
              {activeTopicTab === 'assessment' && (
                <TopicAssessmentSection
                  topic={selectedTopic}
                  moduleName="Communication"
                  categoryName={selectedCommCategory?.title || 'Grammar'}
                  totalContents={contents.length}
                  completedContentsCount={Object.values(completedMap).filter(Boolean).length}
                />
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
                  <button
                    type="button"
                    onClick={() => setActiveTopicTab('assessment')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTopicTab === 'assessment'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Assessments & Practice</span>
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

              {activeTopicTab === 'assessment' && (
                <TopicAssessmentSection
                  topic={selectedTopic}
                  moduleName="Interview Preparation"
                  categoryName={selectedInterviewCategory?.title || ''}
                />
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

      {/* 1. Modal: Video Player with Topic Playlist Navigation */}
      {activeVideo && (() => {
        const currentIdx = videoContents.findIndex(v => v._id === activeVideo._id);
        const prevVideo = currentIdx > 0 ? videoContents[currentIdx - 1] : null;
        const nextVideo = currentIdx >= 0 && currentIdx < videoContents.length - 1 ? videoContents[currentIdx + 1] : null;

        return (
          <Modal
            isOpen={Boolean(activeVideo)}
            onClose={() => setActiveVideo(null)}
            title={activeVideo.title}
            size="lg"
          >
            <div className="space-y-4">
              {/* Lecture header bar with navigation controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900">
                    {currentIdx >= 0 ? `Lecture ${currentIdx + 1} of ${videoContents.length}` : 'Lecture'}
                  </span>
                  {isPlaylistUrl(activeVideo.videoUrl || activeVideo.resourceUrl) && (
                    <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> YouTube Playlist
                    </span>
                  )}
                  {selectedTopic && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 font-semibold">{selectedTopic.title}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!prevVideo}
                    onClick={() => prevVideo && setActiveVideo(prevVideo)}
                    className="px-2.5 py-1 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-bold transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                  <button
                    type="button"
                    disabled={!nextVideo}
                    onClick={() => nextVideo && setActiveVideo(nextVideo)}
                    className="px-2.5 py-1 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-bold transition"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Secure responsive iframe */}
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  src={getEmbedVideoUrl(activeVideo.videoUrl || activeVideo.resourceUrl)}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Action bar under video */}
              <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleToggleComplete(activeVideo._id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    completedMap[activeVideo._id]
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{completedMap[activeVideo._id] ? 'Completed' : 'Mark as Completed'}</span>
                </button>

                <a
                  href={getExternalWatchUrl(activeVideo.videoUrl || activeVideo.resourceUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {activeVideo.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {activeVideo.description}
                </p>
              )}

              {/* Playlist drawer: Jump to another lecture in this topic */}
              {videoContents.length > 1 && (
                <div className="pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Topic Lectures ({videoContents.length})
                  </h5>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {videoContents.map((v, idx) => (
                      <button
                        key={v._id}
                        type="button"
                        onClick={() => setActiveVideo(v)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between gap-3 transition ${
                          v._id === activeVideo._id
                            ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold'
                            : 'hover:bg-slate-50 border border-transparent text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                            v._id === activeVideo._id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="truncate">{v.title}</span>
                        </div>
                        {completedMap[v._id] && (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* 2. Modal: PDF Note Reader */}
      {activeNote && (
        <NoteReaderModal
          isOpen={Boolean(activeNote)}
          onClose={() => setActiveNote(null)}
          note={activeNote}
        />
      )}

      {/* 3. Modal: Targeted Practice Test Configuration */}
      <PracticeTestModal
        isOpen={isPracticeModalOpen}
        onClose={() => {
          setIsPracticeModalOpen(false);
          setPracticeModalTopic(null);
        }}
        topic={practiceModalTopic}
      />
    </div>
  );
};

export default TrainingPage;
