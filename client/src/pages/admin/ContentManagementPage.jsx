import React, { useEffect, useState } from 'react';
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
import { OFFICIAL_DEPARTMENTS } from '../../constants/departments';
import { MODULE_CATEGORIES, normalizeModuleName } from '../../constants/trainingModules';
import { Plus, Sparkles, Play, Trash2, ExternalLink, Video, CheckCircle2, AlertCircle, Building2, BookOpen, MessageSquare } from 'lucide-react';

export const ContentManagementPage = () => {
  const [searchParams] = useSearchParams();
  const rawModule = searchParams.get('module') || 'Aptitude';
  const currentModule = normalizeModuleName(rawModule);
  const isDomainModule = currentModule === 'Domain Knowledge';

  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [previewData, setPreviewData] = useState(null);

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Video Player Preview Modal
  const [activeVideo, setActiveVideo] = useState(null);

  // Resolve available category options for the current module
  const availableCategories = MODULE_CATEGORIES[currentModule] || MODULE_CATEGORIES[rawModule] || [
    { id: 'General', label: 'General' }
  ];

  // Content Form
  const [form, setForm] = useState({
    module: currentModule,
    category: availableCategories[0]?.id || 'General',
    department: isDomainModule ? 'CSE' : null,
    subject: '',
    topic: '',
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    difficulty: 'Beginner',
    status: 'published'
  });

  const filterTabs = [
    { id: 'All', label: isDomainModule ? 'All Departments' : 'All Categories' },
    ...availableCategories
  ];

  useEffect(() => {
    setActiveFilter('All');
  }, [currentModule]);

  useEffect(() => {
    fetchContents();
  }, [currentModule, activeFilter]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const params = { module: currentModule };

      if (isDomainModule) {
        if (activeFilter !== 'All') {
          params.department = activeFilter;
        }
      } else {
        if (activeFilter !== 'All') {
          params.category = activeFilter;
        }
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

  // SSRF-safe video metadata fetch
  const handleFetchVideoDetails = async () => {
    if (!form.videoUrl || !form.videoUrl.trim()) {
      setFetchError('Please enter a valid video URL first.');
      return;
    }

    setDetecting(true);
    setFetchError('');
    setPreviewData(null);

    try {
      const res = await api.previewMetadata(form.videoUrl.trim());
      if (res.success && res.metadata) {
        const meta = res.metadata;
        setPreviewData(meta);
        setForm((prev) => ({
          ...prev,
          title: prev.title || meta.title,
          description: prev.description || meta.description,
          thumbnailUrl: meta.thumbnailUrl
        }));
      } else {
        setFetchError(res.message || 'Unable to fetch video information. Please verify the video URL.');
      }
    } catch (err) {
      setFetchError('Unable to fetch video information. Please verify the video URL.');
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmitContent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        module: currentModule,
        department: isDomainModule ? form.department : null,
        category: isDomainModule ? form.department : form.category,
        resourceUrl: form.videoUrl,
        resourceType: 'video',
        contentType: 'video'
      };

      const res = await api.createContent(payload);
      if (res.success) {
        setIsModalOpen(false);
        resetForm();
        fetchContents();
      }
    } catch (err) {
      console.error('Error creating content:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!itemToDelete) return;
    try {
      const res = await api.deleteContent(itemToDelete._id);
      if (res.success) {
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
        fetchContents();
      }
    } catch (err) {
      console.error('Error deleting content:', err);
    }
  };

  const resetForm = () => {
    setForm({
      module: currentModule,
      category: availableCategories[0]?.id || 'General',
      department: isDomainModule ? 'CSE' : null,
      subject: '',
      topic: '',
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      difficulty: 'Beginner',
      status: 'published'
    });
    setPreviewData(null);
    setFetchError('');
  };

  // Filter content by search query
  const filteredContents = contents.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.topic?.toLowerCase().includes(q) ||
      item.subject?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${currentModule} Training Management`}
        subtitle={
          currentModule === 'Interview Preparation'
            ? 'Manage HR Interview, Technical Interview, Behavioral Questions, Company Preparation, and Mock Interview resources.'
            : currentModule === 'Resume'
            ? 'Manage Resume Building, ATS Resume formatting, Project descriptions, and Resume Examples.'
            : currentModule === 'Communication'
            ? 'Manage Grammar, Vocabulary, Speaking, Listening, and Business Communication modules.'
            : isDomainModule
            ? 'Publish departmental lectures across the 9 official departments with SSRF-safe video links.'
            : `Configure verified video lessons, auto-detect YouTube/Vimeo metadata, and manage ${currentModule} syllabus.`
        }
        breadcrumbs={[
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Training' },
          { label: currentModule }
        ]}
        actions={
          <Button
            size="md"
            icon={Plus}
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            Add {currentModule} Video
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <FilterTabs
          tabs={filterTabs}
          activeTab={activeFilter}
          onTabChange={setActiveFilter}
        />

        <div className="w-full lg:w-72">
          <Input
            placeholder={`Search ${isDomainModule ? 'subject, topic, title' : 'topic or title'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <LoadingState message={`Loading ${currentModule} training contents...`} />
      ) : filteredContents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContents.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200 group"
            >
              {/* Thumbnail Header */}
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

                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveVideo(item)}
                    className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110"
                    title="Watch Video Preview"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>
                </div>

                <div className="absolute top-2.5 left-2.5">
                  <StatusBadge status={item.status || 'published'} />
                </div>

                <div className="absolute bottom-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded">
                  {item.department || item.category}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    {item.department && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {item.department}
                      </span>
                    )}
                    {item.category && !item.department && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                        {item.category}
                      </span>
                    )}
                    {item.subject && (
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {item.subject}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {item.topic || 'Topic'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      • {item.difficulty || 'Beginner'}
                    </span>
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

                {/* Actions Footer */}
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
                    onClick={() => {
                      setItemToDelete(item);
                      setDeleteConfirmOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Content"
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
          title={`No ${activeFilter === 'All' ? currentModule : activeFilter} Content Available`}
          description={`No training content has been published under ${
            activeFilter !== 'All' ? activeFilter : currentModule
          } yet. Add a verified video URL to publish a lesson.`}
          actionText={`Add ${currentModule} Video`}
          onAction={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        />
      )}

      {/* Modal: Add Training Video */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Add ${currentModule} Training Video`}
      >
        <form onSubmit={handleSubmitContent} className="space-y-4">
          {/* Module specific category / department fields */}
          {isDomainModule ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Department (Official List) *"
                  options={OFFICIAL_DEPARTMENTS}
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
                <Input
                  label="Subject Name *"
                  placeholder="e.g. Digital Signal Processing"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Topic Name *"
                placeholder="e.g. Fast Fourier Transform & Filtering"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                required
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label={`${currentModule} Category *`}
                options={availableCategories.map((c) => c.id)}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Input
                label="Topic Name *"
                placeholder={
                  currentModule === 'Interview Preparation'
                    ? 'e.g. STAR Method / System Design Rounds / HR Core Behavioral Questions'
                    : currentModule === 'Resume'
                    ? 'e.g. ATS Resume Formatting & Action Verbs / Key Metrics'
                    : currentModule === 'Communication'
                    ? 'e.g. Tenses & Voice / Business Email Writing'
                    : 'e.g. Percentages / Syllogisms'
                }
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                required
              />
            </div>
          )}

          {/* Video URL with Fetch Details button */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">External Video URL (YouTube / Vimeo) *</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=XXXXXXXX"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
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
                Fetch Details
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {fetchError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

          {/* Auto Fetched Video Preview */}
          {previewData && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center gap-3 text-xs animate-in fade-in duration-200">
              {previewData.thumbnailUrl && (
                <img
                  src={previewData.thumbnailUrl}
                  alt="Preview"
                  className="w-20 h-12 object-cover rounded-xl border border-blue-200 shadow-xs shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Auto-Detected Metadata ({previewData.provider})
                </span>
                <p className="font-bold text-slate-900 truncate">{previewData.title}</p>
                <p className="text-[11px] text-slate-500 line-clamp-1">{previewData.description}</p>
              </div>
            </div>
          )}

          <Input
            label="Lesson Title *"
            placeholder="e.g. Master Essential Grammar & Professional Communication"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Lesson Description</label>
            <textarea
              rows={3}
              placeholder="Summary of concepts covered in this training video..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Difficulty"
              options={['Beginner', 'Intermediate', 'Advanced']}
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            />
            <Select
              label="Publish Status"
              options={['published', 'draft']}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" loading={submitting} className="w-full justify-center">
              Publish Video Resource
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Video Player */}
      {activeVideo && (
        <Modal
          isOpen={Boolean(activeVideo)}
          onClose={() => setActiveVideo(null)}
          title={activeVideo.title}
        >
          <div className="space-y-4">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
              {activeVideo.videoUrl?.includes('youtube') || activeVideo.videoUrl?.includes('youtu.be') ? (
                <iframe
                  src={`https://www.youtube.com/embed/${
                    activeVideo.videoUrl.match(/(?:youtu\.be\/|v=)([^"&?/\s]{11})/)?.[1] || ''
                  }?autoplay=1`}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe
                  src={activeVideo.videoUrl}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {activeVideo.department && (
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                    {activeVideo.department}
                  </span>
                )}
                {activeVideo.category && !activeVideo.department && (
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                    {activeVideo.category}
                  </span>
                )}
                {activeVideo.subject && (
                  <span className="text-xs font-bold text-slate-700">{activeVideo.subject}</span>
                )}
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600 font-semibold">{activeVideo.topic}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{activeVideo.description}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteContent}
        title="Delete Training Video?"
        message={`Are you sure you want to permanently delete "${itemToDelete?.title}"? This cannot be undone.`}
        confirmText="Delete Video"
      />
    </div>
  );
};

export default ContentManagementPage;
