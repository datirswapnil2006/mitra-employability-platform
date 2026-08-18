import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import ProgressBar from '../../components/ProgressBar';
import TrainingCard from '../../components/TrainingCard';
import AssessmentCard from '../../components/AssessmentCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { Lock, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';

export const SubmoduleViewPage = () => {
  const { submoduleId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [contentList, setContentList] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [progressInfo, setProgressInfo] = useState({ submoduleProgressPercentage: 0, isCompleted: false, completedContents: [] });
  const [markingId, setMarkingId] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    fetchSubmoduleData();
  }, [submoduleId]);

  const fetchSubmoduleData = async () => {
    setLoading(true);
    try {
      const [contentRes, progressRes, assessmentRes] = await Promise.all([
        api.getContentList({ submoduleId }),
        api.getSubmoduleProgress(submoduleId),
        api.getAssessmentsBySubmodule(submoduleId)
      ]);

      if (contentRes.success) setContentList(contentRes.contents || []);
      if (progressRes.success) setProgressInfo(progressRes.progress || {});
      if (assessmentRes.success) setAssessments(assessmentRes.assessments || []);
    } catch (err) {
      console.error('Error fetching submodule details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchLecture = (url) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleMarkComplete = async (contentId) => {
    setMarkingId(contentId);
    try {
      const res = await api.markContentComplete(contentId);
      if (res.success) {
        await fetchSubmoduleData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleGenerateAITest = async () => {
    setAiGenerating(true);
    try {
      const res = await api.generateAIAssessment({ submoduleId, questionCount: 5, difficulty: 'Medium' });
      if (res.success && res.assessmentId) {
        navigate(`/student/take-assessment/${res.assessmentId}`);
      }
    } catch (err) {
      console.error('Error generating AI assessment:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) return <LoadingState message="Loading submodule training content..." />;

  const isUnlocked = progressInfo.isCompleted || progressInfo.submoduleProgressPercentage >= 100;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/student/training')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Training Modules
      </button>

      {/* Submodule Progress Header Banner */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary">Training Submodule</Badge>
              {isUnlocked ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Submodule Completed (100%)
                </Badge>
              ) : (
                <Badge variant="warning">In Progress</Badge>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900">Curriculum Learning Content</h1>
            <p className="text-xs text-slate-600 mt-1">Watch lectures and complete learning items to unlock mapped assessments.</p>
          </div>

          <div className="w-full md:w-64 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <ProgressBar
              progress={progressInfo.submoduleProgressPercentage}
              label="Submodule Completion"
              color={isUnlocked ? 'emerald' : 'indigo'}
            />
          </div>
        </div>
      </div>

      {/* Section 1: External Resource Learning Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Learning Resources ({contentList.length})</h3>

        {contentList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentList.map((content) => {
              const isCompleted = (progressInfo.completedContents || []).some(
                id => id.toString() === content._id.toString()
              );
              return (
                <TrainingCard
                  key={content._id}
                  content={content}
                  isCompleted={isCompleted}
                  onWatch={handleWatchLecture}
                  onMarkComplete={handleMarkComplete}
                  loading={markingId === content._id}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No Resources Added"
            description="Admin has not published any learning resources for this submodule yet."
          />
        )}
      </div>

      {/* Section 2: Submodule Assessment Mapping */}
      <div className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Mapped Submodule Assessments</h3>
            <p className="text-xs text-slate-600 mt-0.5">Mock & AI tests mapped to this submodule topic.</p>
          </div>

          {isUnlocked && (
            <Button
              size="sm"
              variant="primary"
              icon={Sparkles}
              loading={aiGenerating}
              onClick={handleGenerateAITest}
            >
              Generate AI Grounded Test
            </Button>
          )}
        </div>

        {/* Lock Banner vs Unlock Banner */}
        {!isUnlocked ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 shadow-xs">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">🔒 Assessments Locked</h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Complete all required video lectures and learning resources above to reach 100% submodule completion. All mapped mock tests and AI assessments will unlock automatically!
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">🎯 Submodule Training Completed!</h4>
                <p className="text-xs text-emerald-700">You are ready to test your knowledge with mapped mock assessments.</p>
              </div>
            </div>
          </div>
        )}

        {/* Mapped Assessments List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((ast) => (
            <AssessmentCard
              key={ast._id}
              assessment={ast}
              isUnlocked={isUnlocked}
              onTakeTest={(id) => navigate(`/student/take-assessment/${id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubmoduleViewPage;
