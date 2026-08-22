import React from 'react';
import { Sparkles, BrainCircuit, Target, Clock, ShieldCheck, ArrowRight, Layers, Lightbulb, Users, Compass, Zap } from 'lucide-react';
import Button from '../Button';

const COMPETENCIES_LIST = [
  { name: 'Communication', desc: 'Clarity & Articulation', icon: Users },
  { name: 'Teamwork', desc: 'Collaborative Alignment', icon: Users },
  { name: 'Leadership', desc: 'Ownership in Ambiguity', icon: Compass },
  { name: 'Adaptability', desc: 'Agility during Pivots', icon: Zap },
  { name: 'Emotional Intelligence', desc: 'Self-Regulation & Tact', icon: ShieldCheck },
  { name: 'Problem Solving', desc: 'Root-Cause Rigor', icon: BrainCircuit },
  { name: 'Initiative', desc: 'Proactive Innovation', icon: Sparkles },
  { name: 'Time Management', desc: 'Prioritization & Pacing', icon: Clock },
  { name: 'Resilience', desc: 'Pressure Composure', icon: Target },
  { name: 'Professionalism', desc: 'Work Ethic & Integrity', icon: ShieldCheck }
];

export const PsychometricInstructions = ({
  testTitle = 'Master AI Talent & Psychometric Assessment',
  questionCount = 25,
  durationMinutes = 15,
  onStartAssessment
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 z-10 text-center md:text-left flex-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-3.5 py-1.5 rounded-full border border-indigo-800/80 shadow-2xs">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            AI Talent & Psychometric Engine
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Discover Your Professional Behavioral Profile
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Evaluate your core workplace competencies, decision-making style, and professional readiness through a validated {questionCount}-item situational assessment powered by MITRA AI.
          </p>

          {/* Dynamic Assessment Tags */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2 text-xs font-bold text-indigo-200">
            <span className="bg-indigo-900/60 px-3 py-1.5 rounded-xl border border-indigo-700/50 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              {questionCount} Questions
            </span>
            <span className="bg-indigo-900/60 px-3 py-1.5 rounded-xl border border-indigo-700/50 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {durationMinutes} Minutes
            </span>
            <span className="bg-indigo-900/60 px-3 py-1.5 rounded-xl border border-indigo-700/50 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              AI-Powered Analysis
            </span>
          </div>

          <div className="pt-4 flex justify-center md:justify-start">
            <Button
              size="lg"
              variant="primary"
              icon={ArrowRight}
              onClick={onStartAssessment}
              className="bg-indigo-600 hover:bg-indigo-500 text-sm font-black shadow-lg shadow-indigo-600/30 px-8 py-3.5"
            >
              Start Assessment Now
            </Button>
          </div>
        </div>

        <div className="relative shrink-0 flex items-center justify-center p-8 rounded-full bg-indigo-600/10 border border-indigo-500/20 shadow-2xl">
          <BrainCircuit className="w-24 h-24 sm:w-28 sm:h-28 text-indigo-400 animate-pulse" />
        </div>
      </div>

      {/* Assessment Guidelines Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lightbulb className="w-4 h-4 text-indigo-600" />
          Key Instructions & Behavioral Guidelines
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
            <span className="font-extrabold text-slate-900 block">1. Honest & Spontaneous</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              There are no right or wrong answers. Select the choice that best reflects your genuine behavior in real workplace situations.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
            <span className="font-extrabold text-slate-900 block">2. Flexible Navigation</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              You can jump between questions, mark questions for review, and change responses at any time before final submission.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
            <span className="font-extrabold text-slate-900 block">3. Auto-Save Protected</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Your responses are automatically saved as you select them. Refreshing or switching devices will not lose your answers.
            </p>
          </div>
        </div>
      </div>

      {/* 10 Evaluated Competencies Preview Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <Target className="w-4 h-4 text-indigo-600" />
          10 Evaluated Behavioral Dimensions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {COMPETENCIES_LIST.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={c.name} className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-700">
                  <Icon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider block">{i + 1}. {c.name}</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-tight block">{c.desc}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PsychometricInstructions;
