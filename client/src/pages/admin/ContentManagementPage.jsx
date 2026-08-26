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
  X
} from 'lucide-react';

export const ContentManagementPage = () => {
  const [searchParams] = useSearchParams();
  const rawModule = searchParams.get('module') || 'Aptitude';
  const currentModule = normalizeModuleName(rawModule);
  const isAptitudeModule = currentModule === 'Aptitude';
  const isDomainModule = currentModule === 'Domain Knowledge';

  // Available categories for current module
  const availableCategories = MODULE_CATEGORIES[currentModule] || MODULE_CATEGORIES[rawModule] || [
    { id: 'General', label: 'General' }
  ];

  // Selected Category filter
  const [activeCategory, setActiveCategory] = useState(
    isAptitudeModule ? (availableCategories[0]?.id || 'Quantitative') : 'All'
  );

  // Selected Topic (For Topic Details View)
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeTopicTab, setActiveTopicTab] = useState('videos'); // 'videos' | 'notes'

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [contents, setContents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Topic Modal State (Add / Edit)
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm] = useState({
    title: '',
    description: '',
    category: availableCategories[0]?.id || 'Quantitative',
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
    type: null, // 'topic' | 'video' | 'note'
    item: null
  });

  // Preview Modals
  const [activeVideoPreview, setActiveVideoPreview] = useState(null);
  const [activeNotePreview, setActiveNotePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Filter tabs for category row
  const filterTabs = isAptitudeModule
    ? availableCategories
    : [
        { id: 'All', label: isDomainModule ? 'All Departments' : 'All Categories' },
        ...availableCategories
      ];

  // Reset topic selection when module changes
  useEffect(() => {
    setSelectedTopic(null);
    if (isAptitudeModule) {
      setActiveCategory(availableCategories[0]?.id || 'Quantitative');
    } else {
      setActiveCategory('All');
    }
  }, [currentModule]);

  // Fetch topics or contents
  useEffect(() => {
    if (isAptitudeModule) {
      if (!selectedTopic) {
        fetchTopics();
      } else {
        fetchTopicContents(selectedTopic._id);
      }
    } else {
      fetchNonAptitudeContents();
    }
  }, [currentModule, activeCategory, selectedTopic]);

  // ==========================================
  // API Fetch Handlers
  // ==========================================
  const fetchTopics = async () => {
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

  const fetchTopicContents = async (topicId) => {
    setLoading(true);
    try {
      const res = await api.getContentList({
        module: 'Aptitude',
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

  const fetchNonAptitudeContents = async () => {
    setLoading(true);
    try {
      const params = { module: currentModule };
      if (isDomainModule) {
        if (activeCategory !== 'All') params.department = activeCategory;
      } else {
        if (activeCategory !== 'All') params.category = activeCategory;
      }
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
  // Topic Management Handlers
  // ==========================================
  const handleOpenAddTopic = () => {
    setEditingTopic(null);
    setTopicForm({
      title: '',
      description: '',
      category: activeCategory !== 'All' ? activeCategory : (availableCategories[0]?.id || 'Quantitative'),
      status: 'published',
      order: topics.length + 1
    });
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (topic, e) => {
    if (e) e.stopPropagation();
    setEditingTopic(topic);
    setTopicForm({
      title: topic.title,
      description: topic.description || '',
      category: topic.category || activeCategory,
      status: topic.status || 'published',
      order: topic.order || 0
    });
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...topicForm,
        module: 'Aptitude'
      };
      let res;
      if (editingTopic) {
        res = await api.updateTopic(editingTopic._id, payload);
      } else {
        res = await api.createTopic(payload);
      }

      if (res.success) {
        setIsTopicModalOpen(false);
        setEditingTopic(null);
        fetchTopics();
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
        fetchTopics();
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
    setVideoForm({
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      difficulty: 'Beginner',
      status: 'published',
      category: selectedTopic ? selectedTopic.category : activeCategory
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
      category: video.category || (selectedTopic ? selectedTopic.category : activeCategory)
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
      const payload = {
        ...videoForm,
        module: currentModule,
        resourceType: 'video',
        contentType: 'video',
        topicId: selectedTopic ? selectedTopic._id : undefined,
        topic: selectedTopic ? selectedTopic.title : undefined,
        category: selectedTopic ? selectedTopic.category : (videoForm.category || activeCategory)
      };

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
          fetchTopicContents(selectedTopic._id);
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
    setNoteForm({
      title: '',
      description: '',
      pdfUrl: '',
      fileName: '',
      fileSize: '',
      difficulty: 'Beginner',
      status: 'published',
      category: selectedTopic ? selectedTopic.category : activeCategory
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
      category: note.category || (selectedTopic ? selectedTopic.category : activeCategory)
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
      const payload = {
        ...noteForm,
        module: currentModule,
        resourceType: 'note',
        contentType: 'note',
        resourceUrl: noteForm.pdfUrl,
        topicId: selectedTopic ? selectedTopic._id : undefined,
        topic: selectedTopic ? selectedTopic.title : undefined,
        category: selectedTopic ? selectedTopic.category : (noteForm.category || activeCategory)
      };

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
          fetchTopicContents(selectedTopic._id);
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
        if (res.success) fetchTopics();
      } else {
        res = await api.updateContent(item._id, { status: newStatus });
        if (res.success) {
          if (selectedTopic) fetchTopicContents(selectedTopic._id);
          else fetchNonAptitudeContents();
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
        if (selectedTopic) fetchTopicContents(selectedTopic._id);
        else fetchNonAptitudeContents();
      }
    } catch (err) {
      console.error('Error deleting content:', err);
    }
  };

  // Filtered topics / contents by search
  const filteredTopics = topics.filter((t) => {
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

  // Get active category label
  const activeCategoryObj = availableCategories.find((c) => c.id === activeCategory);
  const activeCategoryLabel = activeCategoryObj ? activeCategoryObj.label : activeCategory;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={
          selectedTopic
            ? `${selectedTopic.title} • Topic Management`
            : `${currentModule} Training Management`
        }
        subtitle={
          selectedTopic
            ? `Manage verified video lectures and 5MB PDF study notes for ${selectedTopic.title} under ${activeCategoryLabel}.`
            : isAptitudeModule
            ? `Manage Aptitude topics, video lectures, and PDF study notes organized topic-wise across Quantitative, Reasoning, and Verbal Ability.`
            : `Configure verified video lessons and syllabus resources for ${currentModule}.`
        }
        breadcrumbs={[
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Training' },
          ...(selectedTopic
            ? [
                {
                  label: currentModule,
                  onClick: () => setSelectedTopic(null),
                  link: undefined
                },
                { label: activeCategoryLabel },
                { label: selectedTopic.title }
              ]
            : [{ label: currentModule }])
        ]}
        actions={
          selectedTopic ? (
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
                <Button
                  size="md"
                  icon={Plus}
                  onClick={handleOpenAddVideo}
                >
                  Add Video
                </Button>
              ) : (
                <Button
                  size="md"
                  icon={Plus}
                  onClick={handleOpenAddNote}
                >
                  Add Study Note (PDF)
                </Button>
              )}
            </div>
          ) : isAptitudeModule ? (
            <Button
              size="md"
              icon={Plus}
              onClick={handleOpenAddTopic}
            >
              Add Topic
            </Button>
          ) : (
            <Button
              size="md"
              icon={Plus}
              onClick={handleOpenAddVideo}
            >
              Add {currentModule} Video
            </Button>
          )
        }
      />

      {/* ========================================================================= */}
      {/* 1. APTITUDE MODULE - TOPIC MANAGEMENT VIEW */}
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

      {/* ========================================================================= */}
      {/* 2. APTITUDE MODULE - TOPIC CONTENT DETAILS VIEW (Inside selected topic) */}
      {/* ========================================================================= */}
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
      {/* 3. NON-APTITUDE MODULES */}
      {/* ========================================================================= */}
      {!isAptitudeModule && (
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
                        {item.department && (
                          <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {item.department}
                          </span>
                        )}
                        {item.category && !item.department && (
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

      {/* 1. Modal: Add / Edit Topic */}
      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title={editingTopic ? 'Edit Aptitude Topic' : 'Add Aptitude Topic'}
      >
        <form onSubmit={handleSaveTopic} className="space-y-4">
          <Select
            label="Aptitude Category *"
            options={MODULE_CATEGORIES.Aptitude.map((c) => ({ value: c.id, label: c.label }))}
            value={topicForm.category}
            onChange={(e) => setTopicForm({ ...topicForm, category: e.target.value })}
          />

          <Input
            label="Topic Title *"
            placeholder="e.g. Percentage, Profit & Loss, Syllogism"
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

      {/* 2. Modal: Add / Edit Video */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title={editingVideo ? 'Edit Training Video' : 'Add Training Video'}
      >
        <form onSubmit={handleSaveVideo} className="space-y-4">
          {selectedTopic && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <span className="font-bold">Topic: {selectedTopic.title}</span>
              <span className="text-[11px] font-semibold text-emerald-700">({selectedTopic.category})</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Video URL (YouTube / Vimeo) *</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=XXXXXXXX"
                value={videoForm.videoUrl}
                onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                required
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={Sparkles}
                loading={detecting}
                onClick={handleFetchVideoDetails}
              >
                Auto-Detect
              </Button>
            </div>
          </div>

          {fetchError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

          {previewData && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center gap-3 text-xs">
              {previewData.thumbnailUrl && (
                <img
                  src={previewData.thumbnailUrl}
                  alt="Preview"
                  className="w-20 h-12 object-cover rounded-xl border border-blue-200 shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold text-blue-600 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Auto-Detected ({previewData.provider})
                </span>
                <p className="font-bold text-slate-900 truncate">{previewData.title}</p>
              </div>
            </div>
          )}

          <Input
            label="Video Title *"
            placeholder="e.g. Percentage Basics & Quick Tricks"
            value={videoForm.title}
            onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Video Description</label>
            <textarea
              rows={3}
              placeholder="Summary of concepts covered..."
              value={videoForm.description}
              onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Difficulty"
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

          <div className="pt-2">
            <Button type="submit" loading={submitting} className="w-full justify-center">
              {editingVideo ? 'Update Video Resource' : 'Publish Video Resource'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal: Add / Edit Study Note (ONLY PDF up to 5MB) */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title={editingNote ? 'Edit Study Note (PDF)' : 'Add Study Note (PDF Format Only)'}
      >
        <form onSubmit={handleSaveNote} className="space-y-4">
          {selectedTopic && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <span className="font-bold">Topic: {selectedTopic.title}</span>
              <span className="text-[11px] font-semibold text-emerald-700">({selectedTopic.category})</span>
            </div>
          )}

          <Input
            label="Note Title *"
            placeholder="e.g. Percentage Shortcuts & Comprehensive Formula Guide"
            value={noteForm.title}
            onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
            required
          />

          {/* PDF File Upload Zone (Strict 5MB limit) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>PDF Document * <span className="text-rose-600 font-semibold">(Only .pdf allowed, Max 5MB)</span></span>
              {noteForm.fileSize && (
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Size: {noteForm.fileSize}
                </span>
              )}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              onChange={handlePdfFileSelect}
              className="hidden"
            />

            {!noteForm.pdfUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50/60 hover:bg-rose-50/30 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
              >
                <div className="p-3 bg-rose-100/70 text-rose-600 rounded-full group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to select or drag PDF file
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Format: <span className="font-semibold text-slate-700">PDF (.pdf)</span> • Max File Size: <span className="font-semibold text-slate-700">5 MB</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-rose-50/70 border border-rose-200/90 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{noteForm.fileName || 'Selected Document.pdf'}</p>
                    <p className="text-[11px] text-slate-500">PDF Document • {noteForm.fileSize || 'Ready to upload'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteForm({ ...noteForm, pdfUrl: '', fileName: '', fileSize: '' })}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Remove File"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {pdfError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pdfError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Note Summary / Description</label>
            <textarea
              rows={2}
              placeholder="Brief summary of concepts and formulas in this PDF..."
              value={noteForm.description}
              onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Difficulty"
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
              {editingNote ? 'Update Study Note PDF' : 'Upload & Publish PDF Note'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal: Video Player Preview */}
      {activeVideoPreview && (
        <Modal
          isOpen={Boolean(activeVideoPreview)}
          onClose={() => setActiveVideoPreview(null)}
          title={activeVideoPreview.title}
        >
          <div className="space-y-4">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
              {activeVideoPreview.videoUrl?.includes('youtube') || activeVideoPreview.videoUrl?.includes('youtu.be') ? (
                <iframe
                  src={`https://www.youtube.com/embed/${
                    activeVideoPreview.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/|.+\?v=)|youtu\.be\/)([^"&?/\s]{11})/)?.[1] || ''
                  }?autoplay=1`}
                  title={activeVideoPreview.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe
                  src={activeVideoPreview.videoUrl}
                  title={activeVideoPreview.title}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {activeVideoPreview.category || 'Quantitative'}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600 font-semibold">{activeVideoPreview.topic || 'Topic'}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{activeVideoPreview.description}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Modal: PDF Note Reader Preview */}
      {activeNotePreview && (
        <NoteReaderModal
          isOpen={Boolean(activeNotePreview)}
          note={activeNotePreview}
          onClose={() => setActiveNotePreview(null)}
        />
      )}

      {/* 6. Confirm Dialog for Delete */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: null, item: null })}
        onConfirm={
          deleteConfirm.type === 'topic' ? handleDeleteTopic : handleDeleteContent
        }
        title={
          deleteConfirm.type === 'topic'
            ? `Delete Topic "${deleteConfirm.item?.title}"?`
            : deleteConfirm.type === 'note'
            ? `Delete Study Note "${deleteConfirm.item?.title}"?`
            : `Delete Video "${deleteConfirm.item?.title}"?`
        }
        message={
          deleteConfirm.type === 'topic'
            ? `Are you sure you want to permanently delete this topic? All associated videos and PDF notes within this topic will also be deleted.`
            : `Are you sure you want to permanently delete "${deleteConfirm.item?.title}"? This cannot be undone.`
        }
        confirmText="Delete Permanently"
      />
    </div>
  );
};

export default ContentManagementPage;
