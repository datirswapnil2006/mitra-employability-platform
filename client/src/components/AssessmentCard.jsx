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
        ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
        : 'bg-slate-50/80 border-slate-200/90 opacity-80'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          {isAIGenerated ? (
            <Badge variant="warning" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Assessment
            </Badge>
          ) : (
            <Badge variant="primary">Mock Assessment</Badge>
          )}
        </div>

        {isUnlocked ? (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Unlocked
          </span>
        ) : (
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Locked
          </span>
        )}
      </div>

      <h4 className="font-bold text-slate-900 text-base mb-1">{title}</h4>
      <p className="text-xs text-slate-600 mb-4 line-clamp-2">{description || 'Test your domain knowledge and problem solving skills.'}</p>

      <div className="flex items-center gap-4 text-xs text-slate-500 mb-5 pt-3 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-blue-600" /> {timeLimitMinutes || 15} mins
        </span>
        <span className="flex items-center gap-1">
          <FileCheck className="w-3.5 h-3.5 text-blue-600" /> {questions ? questions.length : 5} Questions
        </span>
        <span className="font-semibold text-slate-700">
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
        <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-center">
          <p className="text-xs text-amber-800 font-medium">
            🔒 Complete submodule training to unlock
          </p>
        </div>
      )}
    </div>
  );
};

export default AssessmentCard;
