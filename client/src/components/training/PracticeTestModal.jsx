import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Modal from '../Modal';
import Button from '../Button';
import Select from '../Select';
import { Sparkles, Play, Clock, Award, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';

export const PracticeTestModal = ({ isOpen, onClose, topic, availableQuestionsCount = 0 }) => {
  const navigate = useNavigate();
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (!topic) return;

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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-900 mb-0.5">Instant Database Selection (Zero AI Latency)</p>
            <p>
              Your practice test is generated dynamically from the institutional Question Bank.
              Questions you have not recently attempted will be prioritized.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Question Count Selector */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            Number of Questions <span className="text-slate-400 font-normal">(Max 30)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15, 20, 25, 30].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuestionCount(num)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                  questionCount === num
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {num} Questions
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            Difficulty Level
          </label>
          <Select
            options={DIFFICULTY_OPTIONS}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          />
        </div>

        {/* Practice parameters overview */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-3 text-center">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</span>
            <span className="text-sm font-black text-slate-800">
              {questionCount} {questionCount === 1 ? 'Minute' : 'Minutes'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Question Pool</span>
            <span className="text-sm font-black text-blue-600">
              {availableQuestionsCount > 0 ? `${availableQuestionsCount}+ in Bank` : 'Verified Bank'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Play} loading={loading}>
            Start Practice Test
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PracticeTestModal;
