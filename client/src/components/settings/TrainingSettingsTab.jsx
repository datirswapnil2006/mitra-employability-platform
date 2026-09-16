import React from 'react';
import Card from '../Card';
import Input from '../Input';
import { BookOpen, Flame, Award, Zap, CheckCircle2, Lock, Unlock } from 'lucide-react';

export const TrainingSettingsTab = ({ data = {}, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Training Module Progression & Access Policy */}
      <Card
        title="Training Progression & Module Access Policy"
        subtitle="Control how students navigate through Aptitude, Domain, and Soft Skills modules"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div
            onClick={() => onChange({ ...data, accessRules: 'open' })}
            className={`p-4 rounded-2xl border cursor-pointer transition shadow-xs flex flex-col justify-between ${
              (data.accessRules || 'open') === 'open'
                ? 'bg-blue-50/70 border-blue-500 text-blue-950'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700">Open Access</span>
                <Unlock className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-2">Unrestricted Exploration</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Students can practice any topic across Aptitude, Domain, Communication, Resume, and Interview in any order.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-blue-700">
              Recommended for General Practice
            </div>
          </div>

          <div
            onClick={() => onChange({ ...data, accessRules: 'sequential' })}
            className={`p-4 rounded-2xl border cursor-pointer transition shadow-xs flex flex-col justify-between ${
              data.accessRules === 'sequential'
                ? 'bg-blue-50/70 border-blue-500 text-blue-950'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">Sequential</span>
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-2">Topic by Topic Progression</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Submodules unlock only after successfully completing and scoring on preceding topics.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-slate-600">
              Structured Curriculum Delivery
            </div>
          </div>

          <div
            onClick={() => onChange({ ...data, accessRules: 'prerequisite' })}
            className={`p-4 rounded-2xl border cursor-pointer transition shadow-xs flex flex-col justify-between ${
              data.accessRules === 'prerequisite'
                ? 'bg-blue-50/70 border-blue-500 text-blue-950'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-700">Prerequisite</span>
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-2">Assessment Gatekeeper</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Students must score above the passing mark on intermediate quizzes before opening subsequent modules.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-purple-700">
              Rigorous Mastery Enforcement
            </div>
          </div>
        </div>
      </Card>

      {/* Gamification & XP Economy */}
      <Card
        title="Gamification & Student Experience Points (XP) Economy"
        subtitle="Incentivize daily learning consistency through awards, multipliers, and badges"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          <Input
            label="XP Per Completed Submodule *"
            type="number"
            min="10"
            max="200"
            icon={Zap}
            value={data.xpPerSubmodule ?? 50}
            onChange={(e) => onChange({ ...data, xpPerSubmodule: parseInt(e.target.value, 10) || 50 })}
            helperText="Points awarded upon finishing topic practice"
          />

          <Input
            label="XP Per Passed Assessment *"
            type="number"
            min="20"
            max="500"
            icon={Award}
            value={data.xpPerAssessmentPass ?? 100}
            onChange={(e) => onChange({ ...data, xpPerAssessmentPass: parseInt(e.target.value, 10) || 100 })}
            helperText="Points awarded upon achieving passing mark"
          />

          <Input
            label="Daily Streak Multiplier (x) *"
            type="number"
            step="0.1"
            min="1.0"
            max="2.0"
            icon={Flame}
            value={data.streakBonusMultiplier ?? 1.2}
            onChange={(e) => onChange({ ...data, streakBonusMultiplier: parseFloat(e.target.value) || 1.2 })}
            helperText="XP bonus for consecutive daily activity"
          />
        </div>

        {/* Progress & Completion Requirements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-4 border-t border-slate-100">
          <Input
            label="Minimum Pass Score for Topic Progress (%) *"
            type="number"
            min="40"
            max="90"
            icon={CheckCircle2}
            value={data.minPassScoreForProgress ?? 60}
            onChange={(e) => onChange({ ...data, minPassScoreForProgress: parseInt(e.target.value, 10) || 60 })}
            helperText="Passing threshold required to mark module complete"
          />

          <div className="flex flex-col justify-center">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Allow Streak Freeze</span>
                <span className="text-[10px] text-slate-500">Forgives single missed day without resetting streak</span>
              </div>
              <input
                type="checkbox"
                checked={data.streakFreezeAllowed ?? true}
                onChange={(e) => onChange({ ...data, streakFreezeAllowed: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TrainingSettingsTab;
