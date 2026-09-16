import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Modal from '../Modal';
import Button from '../Button';
import Select from '../Select';
import { Sparkles, Play, Clock, Award, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';

export const PracticeTestModal = ({ isOpen, onClose, topic, availableQuestionsCount: propCount }) => {
  const navigate = useNavigate();
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bankCount, setBankCount] = useState(propCount !== undefined ? propCount : null);
  const [checkingCount, setCheckingCount] = useState(false);

  useEffect(() => {
    if (propCount !== undefined) {
      setBankCount(propCount);
    } else if (isOpen && topic?._id) {
      setCheckingCount(true);
      api.getTopicQuestionStats(topic._id, topic.title)
        .then((res) => {
          if (res.success && res.stats) {
            setBankCount(res.stats.total || 0);
          } else {
            setBankCount(0);
          }
        })
        .catch(() => {
          setBankCount(0);
        })
        .finally(() => {
          setCheckingCount(false);
        });
    } else if (!isOpen) {
      setError('');
    }
  }, [isOpen, topic?._id, propCount]);

  const effectiveQuestionsCount = bankCount !== null ? bankCount : (propCount !== undefined ? propCount : null);
  const isBankEmpty = effectiveQuestionsCount === 0 && !checkingCount;

  // Strict hard limit: Maximum 30 questions
  const QUESTION_OPTIONS = [
    { value: 5, label: '5 Questions (5 mins)' },
    { value: 10, label: '10 Questions (10 mins)' },
    { value: 15, label: '15 Questions (15 mins)' },
    { value: 20, label: '20 Questions (20 mins)' },
    { value: 25, label: '25 Questions (25 mins)' },
    { value: 30, label: '30 Questions (30 mins) — Maximum' }
  ];

  const DIFFICULTY_OPTIONS = [
    { value: 'All', label: 'Mixed Difficulties' },
    { value: 'Easy', label: 'Easy (Beginner)' },
    { value: 'Medium', label: 'Medium (Standard Placement)' },
    { value: 'Hard', label: 'Hard (Advanced)' }
  ];

  const handleStartTest = async (e) => {
    e.preventDefault();
    if (!topic || isBankEmpty) return;

    setLoading(true);
    setError('');

    try {
      // Enforce 30 question limit strictly before sending
      const cappedCount = Math.min(Math.max(parseInt(questionCount, 10) || 10, 1), 30);

      const res = await api.createPracticeTest({
        topicId: topic._id,
        topic: topic.title,
        questionCount: cappedCount,
        difficulty
      });

      if (res.success && res.assessmentId) {
        onClose();
        navigate(`/student/practice/${res.assessmentId}`, { state: { returnTopic: topic } });
      } else {
        setError(res.message || 'Failed to create practice test.');
      }
    } catch (err) {
      setError(err.message || 'Error generating practice test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create Self Practice Test — ${topic?.title || 'Topic'}`}
      size="md"
    >
      <form onSubmit={handleStartTest} className="space-y-5">
        {/* Info banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">Instant Database Selection (Zero AI Latency)</p>
            <p>
              Your practice test is generated dynamically from the institutional Question Bank.
              Questions you have not recently attempted will be prioritized.
            </p>
          </div>
        </div>

        {isBankEmpty && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>No questions are currently available in the Question Bank for this topic. Please contact your instructor to add questions.</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Question Count Selector */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Number of Questions <span className="text-slate-400 font-normal">(Max 30)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15, 20, 25, 30].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuestionCount(num)}
                disabled={isBankEmpty || checkingCount}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                  questionCount === num
                    ? 'bg-blue-600 text-white border-blue-600 dark:border-blue-500 shadow-sm shadow-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                } ${isBankEmpty ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {num} Questions
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Difficulty Level
          </label>
          <Select
            options={DIFFICULTY_OPTIONS}
            value={difficulty}
            disabled={isBankEmpty || checkingCount}
            onChange={(e) => setDifficulty(e.target.value)}
          />
        </div>

        {/* Practice parameters overview */}
        <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 grid grid-cols-2 gap-3 text-center">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-100">
              {questionCount} {questionCount === 1 ? 'Minute' : 'Minutes'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Question Pool</span>
            <span className={`text-sm font-black ${effectiveQuestionsCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              {checkingCount ? 'Checking...' : effectiveQuestionsCount > 0 ? `${effectiveQuestionsCount}+ in Bank` : '0 in Bank'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Play}
            loading={loading || checkingCount}
            disabled={isBankEmpty || checkingCount}
          >
            {isBankEmpty ? 'No Questions in Bank' : 'Start Practice Test'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PracticeTestModal;
