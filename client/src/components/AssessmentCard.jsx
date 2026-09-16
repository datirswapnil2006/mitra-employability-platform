import React from 'react';
import Badge from './Badge';
import Button from './Button';
import { Lock, Sparkles, Clock, FileCheck, ArrowRight } from 'lucide-react';

export const AssessmentCard = ({
  assessment,
  isUnlocked = false,
  onTakeTest
}) => {
  const { title, description, timeLimitMinutes, totalMarks, isAIGenerated, questions } = assessment;

  return (
    <div className={`rounded-2xl p-5 border relative overflow-hidden transition-all ${
      isUnlocked
        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
        : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800 opacity-80'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          <Badge variant="primary">Assessment</Badge>
        </div>

        {isUnlocked ? (
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
            Unlocked
          </span>
        ) : (
          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Locked
          </span>
        )}
      </div>

      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">{title}</h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{description || 'Test your domain knowledge and problem solving skills.'}</p>

      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-5 pt-3 border-t border-slate-100 dark:border-slate-800">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {timeLimitMinutes || 15} mins
        </span>
        <span className="flex items-center gap-1">
          <FileCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {questions ? questions.length : 5} Questions
        </span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Marks: {totalMarks || 20}
        </span>
      </div>

      {isUnlocked ? (
        <Button
          size="sm"
          className="w-full justify-center"
          icon={ArrowRight}
          onClick={() => onTakeTest(assessment._id)}
        >
          Take Assessment
        </Button>
      ) : (
        <div className="p-2.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-center">
          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
            🔒 Complete submodule training to unlock
          </p>
        </div>
      )}
    </div>
  );
};

export default AssessmentCard;
