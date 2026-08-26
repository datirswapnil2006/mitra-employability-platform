import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import FilterTabs from '../../components/FilterTabs';
import Button from '../../components/Button';
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
  ExternalLink
} from 'lucide-react';

export const TrainingPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected training module category from URL or default 'Aptitude'
  const rawCategory = searchParams.get('category') || 'Aptitude';
  const currentCategory = normalizeModuleName(rawCategory);
  const isAptitudeModule = currentCategory === 'Aptitude';
  const isDomainModule = currentCategory === 'Domain Knowledge';

  // Available sub-categories / department tabs for the active module
  const availableCategories =
    MODULE_CATEGORIES[currentCategory] ||
    MODULE_CATEGORIES[rawCategory] ||
    [];

  const [activeSubfilter, setActiveSubfilter] = useState(
    isAptitudeModule
      ? (availableCategories[0]?.id || 'Quantitative')
      : isDomainModule
      ? (user?.department || 'CSE')
      : 'All'
  );

  // Selected Topic for Aptitude
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeTopicTab, setActiveTopicTab] = useState('videos'); // 'videos' | 'notes'

  // Data States
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [contents, setContents] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [completedMap, setCompletedMap] = useState({});

  const filterTabs = isAptitudeModule
    ? availableCategories
    : [
        { id: 'All', label: isDomainModule ? 'All Departments' : 'All Topics' },
        ...availableCategories
      ];

  // Reset states when module changes
  useEffect(() => {
    setSelectedTopic(null);
    if (isAptitudeModule) {
      setActiveSubfilter(availableCategories[0]?.id || 'Quantitative');
    } else {
      setActiveSubfilter(isDomainModule ? (user?.department || 'CSE') : 'All');
    }
  }, [rawCategory, user?.department]);

  // Fetch topics or contents
  useEffect(() => {
    if (isAptitudeModule) {
      if (!selectedTopic) {
        fetchAptitudeTopics();
      } else {
        fetchTopicContents(selectedTopic._id);
      }
    } else {
      fetchNonAptitudeContents();
    }
  }, [rawCategory, activeSubfilter, selectedTopic]);

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
      const params = { module: currentCategory };
      if (isDomainModule) {
        if (activeSubfilter !== 'All') params.department = activeSubfilter;
      } else {
        if (activeSubfilter !== 'All') params.category = activeSubfilter;
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

  const handleModuleChange = (newModuleId) => {
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

  const activeCategoryObj = availableCategories.find((c) => c.id === activeSubfilter);
  const activeCategoryLabel = activeCategoryObj ? activeCategoryObj.label : activeSubfilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={
          selectedTopic
            ? `${selectedTopic.title} • Training`
            : `${currentCategory} Training Modules`
        }
        subtitle={
          selectedTopic
            ? `Watch topic video lectures and review comprehensive study notes for ${selectedTopic.title}.`
            : currentCategory === 'Interview Preparation'
            ? 'Comprehensive guide to HR rounds, technical interviews, behavioral questions, and company mock tests.'
            : currentCategory === 'Resume'
            ? 'Master modern resume building, ATS keyword optimization, project descriptions, and verified examples.'
            : currentCategory === 'Communication'
            ? 'Master corporate verbal, written, listening, and workplace communication skills.'
            : isDomainModule
            ? `Specialized engineering & management domain curriculum for ${user?.department || 'all'} departments.`
            : 'Topic-based structured video lectures, conceptual breakdowns, and rich notes for placement aptitude.'
        }
        breadcrumbs={[
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Training' },
          ...(selectedTopic
            ? [
                {
                  label: currentCategory,
                  onClick: () => setSelectedTopic(null),
                  link: undefined
                },
                { label: activeCategoryLabel },
                { label: selectedTopic.title }
              ]
            : [{ label: currentCategory }])
        ]}
        actions={
          selectedTopic && (
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setSelectedTopic(null)}
            >
              Back to Topics
            </Button>
          )
        }
      />

      {/* Module Selector Pills (Top Bar) */}
      {!selectedTopic && (
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
      {/* 1. APTITUDE - TOPIC LIST VIEW (Student Flow) */}
      {/* ========================================================================= */}
      {isAptitudeModule && !selectedTopic && (
        <div className="space-y-6">
          {/* Category Tabs: Quantitative, Reasoning, Verbal */}
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <FilterTabs
              tabs={filterTabs}
              activeTab={activeSubfilter}
              onTabChange={setActiveSubfilter}
            />
          </div>

          {/* Topics Grid */}
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

      {/* ========================================================================= */}
      {/* 2. APTITUDE - TOPIC CONTENT VIEW (Inside e.g. Percentage) */}
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
                <Badge variant="primary">Study Topic</Badge>
              </div>
              <h2 className="text-2xl font-black text-slate-900">{selectedTopic.title}</h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {selectedTopic.description || 'Watch topic lectures and review notes.'}
              </p>
            </div>
          </div>

          {/* Sub-Tabs: Videos & Notes */}
          <div className="flex items-center gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
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
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Notes ({noteContents.length})</span>
            </button>
          </div>

          {/* Videos Tab Content */}
          {activeTopicTab === 'videos' && (
            <div>
              {loading ? (
                <LoadingState message="Loading videos..." />
              ) : videoContents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videoContents.map((item) => {
                    const isCompleted = completedMap[item._id];
                    return (
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
                              title="Watch Video"
                            >
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </button>
                          </div>

                          <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            {item.difficulty || 'Beginner'}
                          </div>

                          {isCompleted && (
                            <div className="absolute top-2.5 left-2.5 bg-emerald-600 text-white p-1 rounded-full shadow-md">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              icon={Play}
                              onClick={() => setActiveVideo(item)}
                            >
                              Watch Video
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleToggleComplete(item._id)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1 ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              {isCompleted ? '✓ Completed' : 'Mark Done'}
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
                  description="No video lectures have been published for this topic yet."
                />
              )}
            </div>
          )}

          {/* Notes Tab Content (PDF) */}
          {activeTopicTab === 'notes' && (
            <div>
              {loading ? (
                <LoadingState message="Loading PDF notes..." />
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
                            {note.difficulty || 'Beginner'}
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

                        <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                          {note.description || 'Topic reference study note in PDF format.'}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="primary"
                          icon={FileText}
                          onClick={() => setActiveNote(note)}
                        >
                          View / Read PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No PDF Notes in this Topic"
                  description="No PDF study notes have been published for this topic yet."
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NON-APTITUDE MODULES (Domain, Communication, Resume, Interview) */}
      {/* ========================================================================= */}
      {!isAptitudeModule && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <FilterTabs
              tabs={filterTabs}
              activeTab={activeSubfilter}
              onTabChange={setActiveSubfilter}
            />
          </div>

          {loading ? (
            <LoadingState message={`Fetching published ${currentCategory} lectures...`} />
          ) : contents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.map((item) => {
                const isCompleted = completedMap[item._id];
                return (
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

                      <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {item.difficulty || 'Beginner'}
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
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Play}
                          onClick={() => setActiveVideo(item)}
                        >
                          Watch Lecture
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleToggleComplete(item._id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1 ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          {isCompleted ? '✓ Completed' : 'Mark Done'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={`No ${currentCategory} training resources found`}
              description="New lectures and resources are being prepared. Check back shortly."
            />
          )}
        </div>
      )}

      {/* Video Modal Player */}
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
                    activeVideo.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/|.+\?v=)|youtu\.be\/)([^"&?/\s]{11})/)?.[1] || ''
                  }?autoplay=1`}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe
                  src={activeVideo.videoUrl || activeVideo.resourceUrl}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {activeVideo.category || 'Quantitative'}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600 font-semibold">{activeVideo.topic || 'Topic'}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{activeVideo.description}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Note Reader Modal */}
      {activeNote && (
        <NoteReaderModal
          isOpen={Boolean(activeNote)}
          note={activeNote}
          onClose={() => setActiveNote(null)}
        />
      )}
    </div>
  );
};

export default TrainingPage;
