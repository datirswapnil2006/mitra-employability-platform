import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import FilterTabs from '../../components/FilterTabs';
import Button from '../../components/Button';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import {
  TRAINING_MODULES,
  MODULE_CATEGORIES,
  normalizeModuleName
} from '../../constants/trainingModules';
import AICommunicationAssessmentView from '../../components/communication/AICommunicationAssessmentView';
import {
  FileCheck,
  Clock,
  Award,
  Play,
  Building2,
  Sparkles,
  BookOpen
} from 'lucide-react';

export const StudentAssessmentsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawModule = searchParams.get('type') || searchParams.get('category') || 'Aptitude';
  const currentModule = normalizeModuleName(rawModule);
  const isDomainModule = currentModule === 'Domain Knowledge';
  const isCommunicationModule = currentModule === 'Communication';

  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [activeSubfilter, setActiveSubfilter] = useState(
    isDomainModule ? (user?.department || 'CSE') : 'All'
  );

  const availableCategories =
    MODULE_CATEGORIES[currentModule] ||
    MODULE_CATEGORIES[rawModule] ||
    [];

  const filterTabs = [
    { id: 'All', label: isDomainModule ? 'All Departments' : 'All Topics' },
    ...availableCategories
  ];

  const assessmentModules = [
    ...TRAINING_MODULES,
    { id: 'Full', label: 'Full Assessment' }
  ];

  useEffect(() => {
    setActiveSubfilter(isDomainModule ? (user?.department || 'CSE') : 'All');
  }, [rawModule, user?.department]);

  useEffect(() => {
    if (!isCommunicationModule) {
      fetchStudentAssessments();
    }
  }, [rawModule, activeSubfilter, isCommunicationModule]);

  const fetchStudentAssessments = async () => {
    setLoading(true);
    try {
      const params = { module: currentModule };
      if (activeSubfilter !== 'All') {
        if (isDomainModule) {
          params.department = activeSubfilter;
        } else {
          params.category = activeSubfilter;
        }
      }

      const res = await api.getAssessments(params);
      if (res.success) {
        setAssessments(res.assessments || []);
      }
    } catch (err) {
      console.error('Error fetching student assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleChange = (newModuleId) => {
    setSearchParams({ type: newModuleId });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${currentModule} Assessments`}
        subtitle={
          isCommunicationModule
            ? "Practice and evaluate your real-world communication skills through AI-powered conversations and receive personalized feedback."
            : "Timed candidate evaluations, topic mock tests, and AI-generated placement assessments."
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
          {/* Subcategory / Department Filter Tabs */}
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <FilterTabs
              tabs={filterTabs}
              activeTab={activeSubfilter}
              onTabChange={setActiveSubfilter}
            />
          </div>

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
                {/* Header Chips */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.department && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {item.department}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {item.category || currentModule}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        item.difficulty === 'Easy'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.difficulty === 'Hard'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.difficulty || 'Medium'}
                    </span>
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

                {item.isAIGenerated && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-indigo-700 font-semibold bg-indigo-50/70 border border-indigo-200/50 px-2.5 py-1 rounded-xl">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI-Generated Assessment</span>
                  </div>
                )}
              </div>

              {/* Start Test Action */}
              <div className="pt-5 mt-4 border-t border-slate-100">
                <Button
                  size="md"
                  variant="primary"
                  icon={Play}
                  onClick={() => navigate(`/student/take-assessment/${item._id}`)}
                  className="w-full justify-center shadow-xs"
                >
                  Start Assessment
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${activeSubfilter !== 'All' ? activeSubfilter : currentModule} Assessments Available`}
          description="Faculty members have not published any tests for this category yet. Check back soon."
        />
      )}
        </>
      )}
    </div>
  );
};

export default StudentAssessmentsPage;
