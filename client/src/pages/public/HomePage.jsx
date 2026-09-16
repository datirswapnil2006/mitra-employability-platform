import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowRight,
  BookOpen,
  Brain,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Award,
  Code,
  FileCheck,
  PlayCircle,
  GraduationCap,
  ChevronRight,
  Target,
  TrendingUp,
  Flame,
  Layers
} from 'lucide-react';

export const HomePage = () => {
  const { user } = useAuth();

  // Truthful platform metrics based on actual system architecture
  const stats = [
    { value: '9', label: 'Academic Departments', sub: 'Engineering & Management' },
    { value: '5', label: 'Core Training Tracks', sub: 'Aptitude, Tech, Domain & Soft' },
    { value: '100%', label: 'Profile Gating', sub: 'Verified Academic Records' },
    { value: 'AI-Assisted', label: 'Diagnostic Engine', sub: 'Grounded Topic Assessments' }
  ];

  // 4 Single-Row Major Platform Capabilities
  const capabilities = [
    {
      icon: BookOpen,
      title: 'Training',
      tag: 'Curriculum',
      desc: 'Modular learning paths spanning Aptitude, Data Structures, SQL, Department Domains, and Professional Communication.',
      iconColor: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      icon: FileCheck,
      title: 'Assessments',
      tag: 'Evaluations',
      desc: 'Timed submodule tests with automated evaluation, performance percentiles, and actionable solution explanations.',
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      icon: Brain,
      title: 'AI Assistance',
      tag: 'Intelligence',
      desc: 'Curriculum-grounded question bank generator and psychometric self-discovery powered by Google Gemini.',
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      tag: 'Analytics',
      desc: 'Cohort-level analytics for Training & Placement Officers with 1-click Excel export and student readiness benchmarking.',
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200'
    }
  ];

  // 5-Step Horizontal Placement Journey
  const journeySteps = [
    {
      step: '01',
      title: 'Learn',
      desc: 'Curated department-aware lessons and notes',
      icon: BookOpen
    },
    {
      step: '02',
      title: 'Practice',
      desc: 'Targeted drills across coding & aptitude',
      icon: Code
    },
    {
      step: '03',
      title: 'Assess',
      desc: 'Timed AI-grounded diagnostic tests',
      icon: FileCheck
    },
    {
      step: '04',
      title: 'Improve',
      desc: 'Review diagnostic reports & bridge gaps',
      icon: TrendingUp
    },
    {
      step: '05',
      title: 'Get Placement Ready',
      desc: 'Verified readiness for campus recruiters',
      icon: Award
    }
  ];

  // Resolved dynamic CTA targets
  const learningLink = user ? '/student/training' : '/training';
  const assessmentLink = user ? '/student/assessments' : '/login';
  const primaryCtaLink = user ? (user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard') : '/register';

  return (
    <div className="space-y-10 sm:space-y-12 pb-12">
      {/* 1. Compact Hero Section (2-Column Layout for minimum vertical scroll) */}
      <section className="pt-6 sm:pt-10 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 space-y-4 text-left">
            {/* Context Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full text-xs font-semibold text-blue-700 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Institutional Employability & Placement Ecosystem</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
              Build Skills. Assess Yourself.{' '}
              <span className="text-blue-600">Get Placement Ready.</span>
            </h1>

            {/* Concise Professional Description */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
              MITRA is an AI-assisted, department-aware employability training and assessment platform. 
              Equip students with structured curriculum, AI-grounded evaluations, and verifiable readiness analytics for campus recruitment.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to={learningLink}>
                <Button size="md" variant="primary" icon={ArrowRight} className="shadow-xs font-bold text-xs sm:text-sm">
                  Start Learning
                </Button>
              </Link>
              <Link to={assessmentLink}>
                <Button size="md" variant="outline" icon={CheckCircle2} className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm">
                  Take Assessment
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Department Mapped
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Zero Hallucination AI
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Placement Office Verified
              </span>
            </div>
          </div>

          {/* Right Column: Compact Live Dashboard Mockup */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
              {/* Mockup Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 pl-1">student.mitra.edu</span>
                </div>
                <Badge variant="success" className="text-[10px] py-0.5 px-2">
                  Profile Verified 100%
                </Badge>
              </div>

              {/* Metric Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-600">Readiness Score</span>
                    <span className="text-blue-600 font-bold text-xs">88%</span>
                  </div>
                  <ProgressBar progress={88} color="indigo" showPercentage={false} />
                  <span className="text-[10px] text-slate-400 mt-1 block">Recruiter Benchmark: 75%</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-600">Tests Passed</span>
                    <span className="text-emerald-600 font-bold text-xs">14 / 16</span>
                  </div>
                  <ProgressBar progress={87.5} color="emerald" showPercentage={false} />
                  <span className="text-[10px] text-slate-400 mt-1 block">Diagnostic Accuracy: 91%</span>
                </div>
              </div>

              {/* Active Next Step Banner */}
              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-blue-600 text-white rounded-md shrink-0">
                    <PlayCircle className="w-4 h-4" />
                  </div>
                  <div className="truncate text-xs">
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">Recommended Next</span>
                    <span className="font-semibold text-slate-900 truncate block">Technical Coding: DSA Trees & Graphs</span>
                  </div>
                </div>
                <Link to={assessmentLink} className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Start <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Quick Tags Footer */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <strong>6-Day</strong> Practice Streak
                </span>
                <span className="text-slate-400 font-mono text-[10px]">T&P Cohort 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Compact Statistics / Trust Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs grid grid-cols-2 md:grid-cols-4 gap-3 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {stats.map((s, idx) => (
            <div key={idx} className="space-y-0.5 pt-2.5 md:pt-0">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{s.value}</h2>
              <div className="text-xs font-bold text-slate-700">{s.label}</div>
              <p className="text-[11px] text-slate-400">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Single-Row Feature Section (4 Compact Cards) */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 border-b border-slate-200/80 pb-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Platform Features</span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Integrated Capabilities for Employability
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-sm sm:text-right">
            Purpose-built modules designed to align students, faculty, and recruiters.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-4 border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg border ${cap.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {cap.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{cap.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{cap.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Compact "How MITRA Works" Horizontal Pipeline Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Learning Journey</span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                How MITRA Prepares You For Placements
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              A structured 5-stage roadmap from foundational learning to verified recruiter shortlisting.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {journeySteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/70 hover:bg-white hover:border-blue-200 hover:shadow-2xs transition-all space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      STAGE {step.step}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{step.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Final Compact CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 rounded-xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Ready to prepare for your next opportunity?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Equip yourself with curated syllabus modules, take AI diagnostic assessments, and benchmark your readiness today.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to={primaryCtaLink}>
              <Button size="md" variant="primary" icon={ArrowRight} className="font-bold text-xs sm:text-sm shadow-xs">
                Start Your Preparation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

