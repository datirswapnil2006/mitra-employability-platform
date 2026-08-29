import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAssessments } from '../../hooks/queries/useAssessmentQueries';
import PageHeader from '../../components/PageHeader';
import FilterTabs from '../../components/FilterTabs';
import Button from '../../components/Button';
import Input from '../../components/Input';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import {
  TRAINING_MODULES,
  MODULE_CATEGORIES,
  normalizeModuleName
} from '../../constants/trainingModules';
import { APTITUDE_TOPICS } from '../../constants/aptitudeTopics';
import AICommunicationAssessmentView from '../../components/communication/AICommunicationAssessmentView';
import {
  FileCheck,
  Clock,
  Award,
  Play,
  Building2,
  Sparkles,
  BookOpen,
  ShieldAlert,
  Search,
  Tag,
  Layers
} from 'lucide-react';

export const StudentAssessmentsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawModule = searchParams.get('type') || searchParams.get('category') || 'Aptitude';
  const currentModule = normalizeModuleName(rawModule);
  const isAptitudeModule = currentModule === 'Aptitude';
  const isDomainModule = currentModule === 'Domain Knowledge';
  const isCommunicationModule = currentModule === 'Communication';

  const [activeSubfilter, setActiveSubfilter] = useState(
    isDomainModule ? (user?.department || 'CSE') : 'All'
  );
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const availableCategories =
    MODULE_CATEGORIES[currentModule] ||
    MODULE_CATEGORIES[rawModule] ||
    [];

  const filterTabs = isAptitudeModule
    ? availableCategories
    : [
        { id: 'All', label: isDomainModule ? 'All Departments' : 'All Topics' },
        ...availableCategories
      ];

  const assessmentModules = [
    ...TRAINING_MODULES,
    { id: 'Full', label: 'Full Assessment' }
  ];

  useEffect(() => {
    if (isAptitudeModule) {
      setActiveSubfilter(availableCategories[0]?.id || 'Quantitative');
    } else if (isDomainModule) {
      setActiveSubfilter(user?.department || 'CSE');
    } else {
      setActiveSubfilter('All');
    }
    setSelectedTopic('All');
    setSearchQuery('');
  }, [rawModule, user?.department, isDomainModule, isAptitudeModule]);

  const queryParams = useMemo(() => {
    const params = { module: currentModule };
    if (activeSubfilter !== 'All') {
      if (isDomainModule) {
        params.department = activeSubfilter;
      } else {
        params.category = activeSubfilter;
      }
    }
    return params;
  }, [currentModule, activeSubfilter, isDomainModule]);

  const { data: assessmentsRes, isLoading: queryLoading } = useAssessments(queryParams, {
    enabled: !isCommunicationModule
  });

  const rawAssessments = assessmentsRes?.assessments || [];
  const loading = isCommunicationModule ? false : queryLoading;

  // Filter assessments by topic and search query
  const assessments = useMemo(() => {
    return rawAssessments.filter((a) => {
      // Topic filter
      if (selectedTopic !== 'All') {
        const itemTopic = (a.topic || '').toLowerCase().trim();
        const selTopic = selectedTopic.toLowerCase().trim();
        if (!itemTopic.includes(selTopic) && !selTopic.includes(itemTopic)) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (a.title || '').toLowerCase().includes(q);
        const topicMatch = (a.topic || '').toLowerCase().includes(q);
        const descMatch = (a.description || '').toLowerCase().includes(q);
        const catMatch = (a.category || '').toLowerCase().includes(q);
        if (!titleMatch && !topicMatch && !descMatch && !catMatch) {
          return false;
        }
      }

      return true;
    });
  }, [rawAssessments, selectedTopic, searchQuery]);

  // Curated topics for the currently selected category in Aptitude
  const currentCategoryTopics = useMemo(() => {
    if (!isAptitudeModule) return [];
    if (activeSubfilter === 'All') {
      // Return combined top topics
      return Object.values(APTITUDE_TOPICS).flat().slice(0, 12);
    }
    // Match activeSubfilter to category key
    const fullCat =
      activeSubfilter === 'Quantitative' || activeSubfilter === 'Quantitative Aptitude'
        ? 'Quantitative Aptitude'
        : activeSubfilter === 'Reasoning' || activeSubfilter === 'Logical Reasoning'
        ? 'Logical Reasoning'
        : activeSubfilter === 'Verbal' || activeSubfilter === 'Verbal Ability'
        ? 'Verbal Ability'
        : activeSubfilter === 'Mix Assessment' || activeSubfilter === 'Mix'
        ? 'Mix Assessment'
        : activeSubfilter;
    return APTITUDE_TOPICS[fullCat] || [];
  }, [isAptitudeModule, activeSubfilter]);

  const handleModuleChange = (newModuleId) => {
    setSearchParams({ type: newModuleId });
  };

  const handleSubfilterChange = (newFilter) => {
    setActiveSubfilter(newFilter);
    setSelectedTopic('All');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${currentModule} Assessments`}
        subtitle={
          isCommunicationModule
            ? "Practice and evaluate your real-world communication skills through conversational practice and receive personalized feedback."
            : "Timed candidate evaluations and topic mock assessments."
        }
        breadcrumbs={[
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Assessments' },
          { label: currentModule }
        ]}
      />

      {/* Module Selector Pills */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {assessmentModules.map((m) => {
            const isActive =
              rawModule === m.id ||
              currentModule === m.label ||
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
                <FileCheck className="w-4 h-4" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* If Communication Module -> Render Dedicated AI Communication Assessment Hub */}
      {isCommunicationModule ? (
        <AICommunicationAssessmentView />
      ) : (
        <>
          {/* Subcategory / Department Filter Tabs & Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <FilterTabs
              tabs={filterTabs}
              activeTab={activeSubfilter}
              onTabChange={handleSubfilterChange}
            />

            <div className="w-full lg:w-72">
              <Input
                placeholder="Search by assessment title or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Topic Filter Chips (Identical to Training Section) */}
          {isAptitudeModule && currentCategoryTopics.length > 0 && (
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto custom-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1 mr-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Topics:
              </span>

              <button
                type="button"
                onClick={() => setSelectedTopic('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  selectedTopic === 'All'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Topics
              </button>

              {currentCategoryTopics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTopic(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    selectedTopic === t
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Assessment Cards Grid */}
          {loading ? (
            <LoadingState message={`Fetching published ${currentModule} assessments...`} />
          ) : assessments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group"
                >
                  <div>
                    {/* Clean Header Chips: Category & Topic */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.department && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200/60 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {item.department}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/60">
                          {item.category || currentModule}
                        </span>
                        {item.topic && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-lg border border-indigo-200/60">
                            {item.topic}
                          </span>
                        )}
                        {item.assessmentMode === 'PROCTORED' && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200/60 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Proctored
                          </span>
                        )}
                        {item.isLocked && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Cooldown ({item.remainingHours ? `${item.remainingHours}h ` : ''}{(item.remainingMinutes || 0) % 60}m)
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200/60 rounded-2xl p-3 mt-4 text-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Questions</span>
                        <span className="text-sm font-black text-slate-900">{item.questions?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Time</span>
                        <span className="text-sm font-black text-blue-600 flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {item.timeLimitMinutes || 20}m
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Pass Mark</span>
                        <span className="text-sm font-black text-emerald-600">{item.passingScorePercentage || 70}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Start Test Action */}
                  <div className="pt-5 mt-4 border-t border-slate-100">
                    {item.isLocked ? (
                      <Button
                        size="md"
                        variant="outline"
                        disabled
                        className="w-full justify-center opacity-60 cursor-not-allowed bg-slate-50 text-slate-500 border-slate-200 font-bold"
                      >
                        Locked (Retake in {item.remainingHours ? `${item.remainingHours}h ` : ''}{(item.remainingMinutes || 0) % 60}m)
                      </Button>
                    ) : (
                      <Button
                        size="md"
                        variant="primary"
                        icon={Play}
                        onClick={() => navigate(`/student/take-assessment/${item._id}`)}
                        className="w-full justify-center shadow-xs"
                      >
                        Start Assessment
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No ${selectedTopic !== 'All' ? selectedTopic : activeSubfilter !== 'All' ? activeSubfilter : currentModule} Assessments Available`}
              description="Faculty members have not published tests matching your selected topic or category yet. Check back soon."
            />
          )}
        </>
      )}
    </div>
  );
};

export default StudentAssessmentsPage;
