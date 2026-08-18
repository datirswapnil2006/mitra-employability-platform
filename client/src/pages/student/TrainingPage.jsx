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
import {
  TRAINING_MODULES,
  MODULE_CATEGORIES,
  normalizeModuleName
} from '../../constants/trainingModules';
import { Play, CheckCircle, Video, BookOpen, ExternalLink, Building2, MessageSquare } from 'lucide-react';

export const TrainingPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected training module category from URL or default 'Aptitude'
  const rawCategory = searchParams.get('category') || 'Aptitude';
  const currentCategory = normalizeModuleName(rawCategory);
  const isDomainModule = currentCategory === 'Domain Knowledge';

  // Available sub-categories / department tabs for the active module
  const availableCategories =
    MODULE_CATEGORIES[currentCategory] ||
    MODULE_CATEGORIES[rawCategory] ||
    [];

  const [activeSubfilter, setActiveSubfilter] = useState(
    isDomainModule ? (user?.department || 'CSE') : 'All'
  );
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [completedMap, setCompletedMap] = useState({});

  const filterTabs = [
    { id: 'All', label: isDomainModule ? 'All Departments' : 'All Topics' },
    ...availableCategories
  ];

  useEffect(() => {
    setActiveSubfilter(isDomainModule ? (user?.department || 'CSE') : 'All');
  }, [rawCategory, user?.department]);

  useEffect(() => {
    fetchTrainingContents();
  }, [rawCategory, activeSubfilter]);

  const fetchTrainingContents = async () => {
    setLoading(true);
    try {
      const params = { module: currentCategory };

      if (isDomainModule) {
        if (activeSubfilter !== 'All') {
          params.department = activeSubfilter;
        }
      } else {
        if (activeSubfilter !== 'All') {
          params.category = activeSubfilter;
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

  const handleModuleChange = (newModuleId) => {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${currentCategory} Training Modules`}
        subtitle={
          currentCategory === 'Interview Preparation'
            ? 'Comprehensive guide to HR rounds, technical interviews, behavioral questions, and company mock tests.'
            : currentCategory === 'Resume'
            ? 'Master modern resume building, ATS keyword optimization, project descriptions, and verified examples.'
            : currentCategory === 'Communication'
            ? 'Master corporate verbal, written, listening, and workplace communication skills.'
            : isDomainModule
            ? `Specialized engineering & management domain curriculum for ${user?.department || 'all'} departments.`
            : 'Structured video curriculum, topic lectures, and placement preparation resources.'
        }
        breadcrumbs={[
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Training' },
          { label: currentCategory }
        ]}
      />

      {/* Module Selector Pills */}
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

      {/* Subcategory / Department Filter Tabs */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <FilterTabs
          tabs={filterTabs}
          activeTab={activeSubfilter}
          onTabChange={setActiveSubfilter}
        />
      </div>

      {/* Content Video Grid */}
      {loading ? (
        <LoadingState message={`Fetching published ${currentCategory} lectures...`} />
      ) : contents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {contents.map((item) => {
            const isCompleted = completedMap[item._id];
            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-200 group"
              >
                {/* Auto Thumbnail Header */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                      <Video className="w-12 h-12 opacity-40" />
                    </div>
                  )}

                  {/* Play Button Overlay */}
                  <div
                    onClick={() => setActiveVideo(item)}
                    className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <div className="p-4 bg-blue-600 text-white rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition">
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Department / Category Pill */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    {item.department || item.category || currentCategory}
                  </div>

                  {/* Completed Badge */}
                  {isCompleted && (
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <CheckCircle className="w-3 h-3" /> Completed
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
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
                        {item.topic || 'Lesson'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">• {item.difficulty || 'Beginner'}</span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-2 mt-1 leading-snug">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      icon={Play}
                      onClick={() => setActiveVideo(item)}
                      className="flex-1 justify-center shadow-xs"
                    >
                      Watch Video
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleToggleComplete(item._id)}
                      className={`p-2 rounded-xl border transition ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={`No Training Content Available`}
          description={`No published lessons have been added for ${
            activeSubfilter !== 'All' ? activeSubfilter : currentCategory
          } yet. Check back soon as faculty members upload new training lessons.`}
        />
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {activeVideo.department && (
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                      {activeVideo.department}
                    </span>
                  )}
                  {activeVideo.category && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {activeVideo.category}
                    </span>
                  )}
                  {activeVideo.subject && (
                    <span className="text-xs font-bold text-slate-700">{activeVideo.subject}</span>
                  )}
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-600 font-semibold">{activeVideo.topic}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{activeVideo.description}</p>
              </div>

              <a
                href={activeVideo.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 shrink-0"
              >
                <span>Open in Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TrainingPage;
