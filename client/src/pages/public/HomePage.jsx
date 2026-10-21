import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Layers,
  Cpu,
  Wrench,
  Building,
  Binary,
  Lightbulb,
  Compass,
  ArrowUpRight,
  Clock,
  Check
} from 'lucide-react';

export const HomePage = () => {
  const { user } = useAuth();
  const [activeDomainTab, setActiveDomainTab] = useState('all');

  // Truthful platform metrics based on MITRA's actual institutional architecture
  const stats = [
    { value: '9', label: 'Academic Departments', sub: 'Engineering, Tech & Management' },
    { value: '5', label: 'Modular Training Tracks', sub: 'Aptitude, Tech, Domain, SQL & Soft' },
    { value: '100%', label: 'Profile Gating', sub: 'Verified Academic Records' },
    { value: 'AI-Assisted', label: 'Diagnostic Engine', sub: 'Curriculum-Grounded Evaluations' }
  ];

  // 6 Core Features requested
  const coreFeatures = [
    {
      id: 'training',
      icon: GraduationCap,
      title: 'Employability Training',
      tag: 'Curriculum Tracks',
      desc: 'Structured modular learning paths spanning Quantitative Aptitude, Data Structures, SQL, Core Department Engineering, and Professional Communication.',
      cta: 'Explore Curriculum',
      link: user ? '/student/training' : '/training'
    },
    {
      id: 'assessments',
      icon: Brain,
      title: 'AI-Assisted Assessments',
      tag: 'Google Gemini AI',
      desc: 'Timed, gated diagnostic assessments with curriculum-grounded question generation, zero hallucinations, automated scoring, and objective evaluations.',
      cta: 'View Assessments',
      link: user ? '/student/assessments' : '/login'
    },
    {
      id: 'practice',
      icon: FileCheck,
      title: 'Practice Tests',
      tag: 'Self-Paced Drills',
      desc: 'Interactive topic-level drill tests with immediate answer feedback, detailed solution breakdowns, and unlimited attempts to strengthen weak areas.',
      cta: 'Start Practice Drills',
      link: user ? '/student/assessments' : '/login'
    },
    {
      id: 'technical',
      icon: Code,
      title: 'Technical Skills',
      tag: 'Coding & Systems',
      desc: 'Hands-on preparation in Data Structures & Algorithms, Object-Oriented Programming, Database Management (SQL), and modern software engineering.',
      cta: 'Technical Syllabus',
      link: user ? '/student/training' : '/training'
    },
    {
      id: 'aptitude',
      icon: Target,
      title: 'Aptitude & Reasoning',
      tag: 'MNC Screening',
      desc: 'Comprehensive training across Quantitative Ability, Logical Reasoning, and Verbal Comprehension mapped to top corporate hiring assessments.',
      cta: 'Aptitude Modules',
      link: user ? '/student/training' : '/training'
    },
    {
      id: 'tracking',
      icon: BarChart3,
      title: 'Performance Tracking',
      tag: 'Analytics & Gaps',
      desc: 'Cohort-level analytics for placement officers with student readiness percentiles, submodule-level completion tracking, and 1-click Excel exports.',
      cta: 'Readiness Insights',
      link: user ? (user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard') : '/login'
    }
  ];

  // 6 Learning Domains requested
  const learningDomains = [
    {
      id: 'cse',
      name: 'Computer Science',
      code: 'CSE',
      icon: Binary,
      description: 'Foundational computing, algorithm engineering, scalable system architecture, and modern application development.',
      topics: ['Data Structures & Algorithms', 'Operating Systems', 'DBMS & SQL', 'Object-Oriented Programming', 'System Design'],
      filterKey: 'engineering'
    },
    {
      id: 'it',
      name: 'Information Technology',
      code: 'IT',
      icon: Code,
      description: 'Enterprise web systems, cloud computing, information security, and practical software engineering methodologies.',
      topics: ['Full-Stack Web Dev', 'Cloud Computing', 'Computer Networks', 'Information Security', 'Python Programming'],
      filterKey: 'engineering'
    },
    {
      id: 'extc',
      name: 'Electronics & Telecommunication',
      code: 'EXTC',
      icon: Cpu,
      description: 'Microcontrollers, embedded firmware, digital signal processing, and telecommunication hardware systems.',
      topics: ['Embedded Systems', 'Digital Signal Processing', 'VLSI Design', 'Microcontrollers & IoT', 'Wireless Communication'],
      filterKey: 'engineering'
    },
    {
      id: 'mech',
      name: 'Mechanical Engineering',
      code: 'Mechanical',
      icon: Wrench,
      description: 'Design analysis, thermal systems, fluid dynamics, and modern computer-aided engineering manufacturing.',
      topics: ['CAD / CAM Modeling', 'Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Manufacturing Processes'],
      filterKey: 'core'
    },
    {
      id: 'civil',
      name: 'Civil Engineering',
      code: 'Civil',
      icon: Building,
      description: 'Structural integrity analysis, surveying, geotechnical engineering, and infrastructure project execution.',
      topics: ['Structural Analysis', 'Concrete Technology', 'Surveying & GIS', 'Geotechnical Engineering', 'Project Planning'],
      filterKey: 'core'
    },
    {
      id: 'aptitude',
      name: 'Aptitude & General Skills',
      code: 'Aptitude',
      icon: Lightbulb,
      description: 'Quantitative problem solving, analytical logical deduction, and verbal communication for recruitment rounds.',
      topics: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Technical Interviewing', 'Professional English'],
      filterKey: 'foundational'
    }
  ];

  // 4-Step How It Works Pipeline requested: Learn -> Practice -> Assess -> Improve
  const workflowSteps = [
    {
      step: '01',
      title: 'Learn',
      subtitle: 'Structured Curriculum',
      desc: 'Access department-aware syllabus modules, verified faculty notes, and structured lecture materials tailored to placement requirements.',
      icon: BookOpen,
      badge: 'Step 1'
    },
    {
      step: '02',
      title: 'Practice',
      subtitle: 'Targeted Problem Sets',
      desc: 'Build speed and precision through topic-level practice drills across coding, SQL queries, and quantitative aptitude.',
      icon: Code,
      badge: 'Step 2'
    },
    {
      step: '03',
      title: 'Assess',
      subtitle: 'Diagnostic Evaluations',
      desc: 'Take timed submodule tests and comprehensive mock placement assessments evaluated objectively by our AI diagnostic engine.',
      icon: FileCheck,
      badge: 'Step 3'
    },
    {
      step: '04',
      title: 'Improve',
      subtitle: 'Bridge Skill Gaps',
      desc: 'Analyze granular performance reports, isolate weak topics, and follow personalized learning recommendations to exceed recruiter benchmarks.',
      icon: TrendingUp,
      badge: 'Step 4'
    }
  ];

  // Dynamic links
  const trainingLink = user ? '/student/training' : '/training';
  const assessmentLink = user ? '/student/assessments' : '/login';
  const primaryCtaLink = user ? (user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard') : '/register';

  const filteredDomains = activeDomainTab === 'all'
    ? learningDomains
    : learningDomains.filter(d => d.filterKey === activeDomainTab);

  return (
    <div className="bg-[#FFF8E9] text-[#08284B] font-sans selection:bg-[#F8C85A] selection:text-[#08284B]">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#08284B] via-[#0A315C] to-[#08284B] text-white pt-8 sm:pt-14 pb-16 lg:pb-24 border-b border-[#F8C85A]/25">
        {/* Subtle decorative gold ambient glow & tech grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(248,200,90,0.18),transparent)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F8C85A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#08284B]/60 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Context Tag Badge */}
              <div className="inline-flex items-center gap-2 bg-[#FFF8E9]/10 border border-[#F8C85A]/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#FFF8E9] backdrop-blur-sm shadow-xs">
                <Sparkles className="w-4 h-4 text-[#F8C85A] shrink-0" />
                <span>AI-Assisted Employability & Placement Ecosystem</span>
              </div>

              {/* Exact Requested Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-white leading-[1.12]">
                Build Skills. Prove Your Potential.{' '}
                <span className="text-[#F8C85A] block sm:inline">Become Career Ready.</span>
              </h1>

              {/* Professional Description */}
              <p className="text-[#FFF8E9]/85 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-normal">
                MITRA is an institutional AI-assisted, department-aware employability training and assessment platform. Equip students with modular curriculum, AI-grounded diagnostic evaluations, and verifiable readiness analytics for campus recruitment.
              </p>

              {/* Action Buttons: Get Started & Explore Training */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link to={primaryCtaLink}>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#F8C85A] hover:bg-[#E5B74C] text-[#08284B] font-bold text-sm sm:text-base shadow-lg shadow-[#F8C85A]/20 transition-all hover:translate-y-[-1px] cursor-pointer"
                  >
                    <span>{user ? 'Go to My Dashboard' : 'Get Started'}</span>
                    <ArrowRight className="w-4 h-4 text-[#08284B]" />
                  </button>
                </Link>

                <Link to={trainingLink}>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FFF8E9]/10 hover:bg-[#FFF8E9]/20 text-[#FFF8E9] border border-[#F8C85A]/40 font-semibold text-sm sm:text-base backdrop-blur-sm transition-all hover:translate-y-[-1px] cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-[#F8C85A]" />
                    <span>Explore Training</span>
                  </button>
                </Link>
              </div>

              {/* Institutional Trust Indicators */}
              <div className="pt-3 flex flex-wrap items-center gap-5 text-xs font-medium text-[#FFF8E9]/75 border-t border-[#FFF8E9]/15">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#F8C85A]" />
                  9 Academic Departments
                </span>
                <span className="text-[#F8C85A]/40">•</span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#F8C85A]" />
                  100% Profile Gated
                </span>
                <span className="text-[#F8C85A]/40">•</span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F8C85A]" />
                  Google Gemini Diagnostics
                </span>
              </div>
            </div>

            {/* Right Column: Professional Student Illustration & Live Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl p-2 bg-gradient-to-tr from-[#F8C85A]/40 via-white/10 to-[#F8C85A]/20 shadow-2xl">
                
                {/* Main Illustration Container */}
                <div className="relative rounded-xl overflow-hidden bg-[#08284B] border border-[#F8C85A]/30">
                  <img
                    src="/student_career_hero.jpg"
                    alt="Engineering Students Preparing for Placements on MITRA Platform"
                    className="w-full h-auto object-cover max-h-[380px] sm:max-h-[440px] transform hover:scale-[1.02] transition-transform duration-500"
                  />
                  
                  {/* Subtle Gradient Overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#08284B] via-[#08284B]/70 to-transparent pointer-events-none" />

                  {/* Dynamic Floating Badge: Top Left */}
                  <div className="absolute top-3 left-3 bg-[#08284B]/90 backdrop-blur-md border border-[#F8C85A]/50 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-[#FFF8E9]">
                      T&P Recruitment Drive 2026
                    </span>
                  </div>

                  {/* Dynamic Floating Badge: Bottom Live Card */}
                  <div className="absolute bottom-3 inset-x-3 bg-[#08284B]/95 backdrop-blur-md rounded-xl p-3 border border-[#F8C85A]/40 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#F8C85A] text-[#08284B]">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Placement Readiness Score</div>
                          <div className="text-[10px] text-[#FFF8E9]/70">Campus Recruiter Benchmark: 75%</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-[#F8C85A]">88%</span>
                        <span className="text-[10px] text-emerald-400 font-bold block">Target Met</span>
                      </div>
                    </div>

                    {/* Readiness Bar */}
                    <div className="w-full bg-[#FFF8E9]/15 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#F8C85A] to-amber-400 h-full rounded-full transition-all duration-700"
                        style={{ width: '88%' }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#FFF8E9]/80 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-[#F8C85A]" />
                        6-Day Practice Streak
                      </span>
                      <span className="text-[#F8C85A] font-semibold">
                        14 / 16 Submodules Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. PLATFORM METRICS STRIP */}
      <section className="relative -mt-6 sm:-mt-8 max-w-7xl mx-auto px-4 sm:px-6 z-20">
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#F8C85A]/40 shadow-xl shadow-[#08284B]/8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {stats.map((s, idx) => (
            <div key={idx} className="space-y-1 text-center pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#08284B] tracking-tight">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800">
                {s.label}
              </div>
              <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto leading-tight">
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CORE FEATURES SECTION */}
      <section id="features" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#08284B]/10 border border-[#08284B]/20 text-[#08284B] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#08284B]" />
            Core Capabilities
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-[#08284B] tracking-tight">
            Integrated Features for Comprehensive Employability
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Engineered to unify curriculum learning, self-paced drills, AI diagnostic evaluations, and verifiable performance benchmarking for students and placement officers.
          </p>
        </div>

        {/* 6 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="bg-white rounded-2xl p-6 border border-[#F8C85A]/30 hover:border-[#F8C85A] hover:shadow-xl hover:shadow-[#08284B]/8 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Icon & Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-[#08284B] text-[#F8C85A] shadow-xs group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-[#08284B] uppercase tracking-wider bg-[#FFF8E9] px-2.5 py-1 rounded-full border border-[#F8C85A]/40">
                      {feat.tag}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-lg font-bold text-[#08284B] mb-2 group-hover:text-[#0A315C]">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                {/* Footer Action Link */}
                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={feat.link}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#08284B] group-hover:text-[#F8C85A] group-hover:translate-x-0.5 transition-all"
                  >
                    <span>{feat.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. LEARNING DOMAINS SECTION */}
      <section id="domains" className="py-16 sm:py-20 bg-white border-y border-[#F8C85A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#08284B]/10 text-[#08284B] text-xs font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-[#08284B]" />
                Specialized Curricula
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-[#08284B] tracking-tight">
                Academic & Engineering Learning Domains
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm max-w-xl">
                Curriculum-grounded modules mapped specifically to university syllabus tracks and campus recruiter job descriptions.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All 6 Domains' },
                { id: 'engineering', label: 'Tech & Computing' },
                { id: 'core', label: 'Core Engineering' },
                { id: 'foundational', label: 'General Aptitude' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDomainTab(tab.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeDomainTab === tab.id
                      ? 'bg-[#08284B] text-[#F8C85A] shadow-xs'
                      : 'bg-[#FFF8E9] text-[#08284B] hover:bg-[#F8C85A]/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Domain Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDomains.map((domain) => {
              const Icon = domain.icon;
              return (
                <div
                  key={domain.id}
                  className="bg-[#FFF8E9]/50 rounded-2xl p-6 border border-[#F8C85A]/40 hover:bg-white hover:border-[#08284B] hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#08284B] text-[#F8C85A]">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#08284B] text-base leading-tight">
                            {domain.name}
                          </h3>
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                            Track: {domain.code}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {domain.description}
                    </p>

                    {/* Topic Pills */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-[#08284B] uppercase tracking-wider">
                        Key Syllabus Topics:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {domain.topics.map((topic, tidx) => (
                          <span
                            key={tidx}
                            className="bg-white text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="pt-4 mt-4 border-t border-slate-200/60">
                    <Link
                      to={trainingLink}
                      className="inline-flex items-center justify-between w-full text-xs font-bold text-[#08284B] hover:text-[#F8C85A] transition"
                    >
                      <span>Browse {domain.code} Modules</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION (Learn -> Practice -> Assess -> Improve) */}
      <section id="how-it-works" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#08284B]/10 text-[#08284B] text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-[#08284B]" />
            Workflow & Progression
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-[#08284B] tracking-tight">
            How MITRA Prepares You for Campus Placements
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            A structured, 4-stage systematic journey ensuring complete mastery from foundational concepts to recruiter shortlisting.
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-[#F8C85A]/35 hover:border-[#08284B] hover:shadow-xl transition-all duration-300 relative flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar with Number Badge & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black tracking-wider text-[#08284B] bg-[#F8C85A] px-2.5 py-1 rounded-lg shadow-2xs font-mono">
                      STAGE {step.step}
                    </span>
                    <div className="p-2.5 rounded-xl bg-[#FFF8E9] text-[#08284B] border border-[#F8C85A]/30 group-hover:bg-[#08284B] group-hover:text-[#F8C85A] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-xl font-black text-[#08284B] mb-1">
                    {step.title}
                  </h3>
                  <div className="text-xs font-bold text-[#F8C85A] uppercase tracking-wider mb-3">
                    {step.subtitle}
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Bottom Step Indicator */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Milestone
                  </span>
                  {idx < 3 && (
                    <span className="text-[#08284B] font-mono text-xs hidden lg:inline">
                      Next →
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. CAREER READINESS SECTION (Progress Tracking, Skill-Gap Insights, Recommendations) */}
      <section id="readiness" className="py-16 sm:py-20 bg-[#08284B] text-white border-y border-[#F8C85A]/30 relative overflow-hidden">
        {/* Ambient lighting */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F8C85A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF8E9]/10 border border-[#F8C85A]/40 text-[#F8C85A] text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-[#F8C85A]" />
              Career Readiness & Skill-Gap Intelligence
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Actionable Intelligence That Drives Recruitment Success
            </h2>
            <p className="text-[#FFF8E9]/80 text-sm sm:text-base leading-relaxed">
              Real-time student progress tracking, automated skill-gap diagnosis, and personalized curriculum suggestions benchmarked against recruitment standards.
            </p>
          </div>

          {/* 2-Column Readiness Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Card: Progress Tracking & Skill-Gaps (7 cols) */}
            <div className="lg:col-span-7 bg-[#051B33] rounded-2xl p-6 sm:p-8 border border-[#F8C85A]/30 shadow-2xl space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                
                {/* Metric Overview Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#F8C85A] uppercase tracking-wider">
                      Student Benchmark Dashboard
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">
                      Overall Placement Readiness Index
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 bg-[#FFF8E9]/10 px-4 py-2 rounded-xl border border-[#F8C85A]/30">
                    <div className="text-right">
                      <div className="text-2xl font-black text-[#F8C85A] leading-none">88%</div>
                      <div className="text-[10px] text-emerald-400 font-bold">Cutoff 75% Met</div>
                    </div>
                  </div>
                </div>

                {/* Skill-Gap Competency Breakdown */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[#FFF8E9]">
                    <span>Competency Breakdown Across Placement Domains</span>
                    <span className="text-[#F8C85A]">Diagnostic Confidence: 94%</span>
                  </div>

                  {/* Domain Bars */}
                  {[
                    { domain: 'Technical Coding & DSA', score: 86, color: 'bg-blue-400', status: 'Recruiter Qualified' },
                    { domain: 'Quantitative & Logical Aptitude', score: 91, color: 'bg-emerald-400', status: 'Advanced Tier' },
                    { domain: 'Core Department Engineering', score: 80, color: 'bg-[#F8C85A]', status: 'Proficient' },
                    { domain: 'Professional & Verbal Communication', score: 84, color: 'bg-purple-400', status: 'Interview Ready' }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-white">{item.domain}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-300 font-normal">{item.status}</span>
                          <span className="font-bold text-[#F8C85A]">{item.score}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${item.color} h-full rounded-full transition-all duration-700`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Highlighted Skill-Gap Alert */}
                <div className="bg-[#FFF8E9]/10 rounded-xl p-4 border border-[#F8C85A]/40 flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-[#F8C85A] text-[#08284B] shrink-0 mt-0.5">
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-[#F8C85A] uppercase tracking-wider text-[11px]">
                      Identified Diagnostic Skill Gap
                    </div>
                    <p className="text-[#FFF8E9]/85 leading-relaxed">
                      Students in your cohort show high aptitude scores but require additional practice in <strong>Graph Traversal (BFS/DFS)</strong> and <strong>SQL Joins</strong>. Completing the two recommended submodules bridges this gap.
                    </p>
                  </div>
                </div>

              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-[#FFF8E9]/70">
                  Data updated dynamically from completed student submodule assessments.
                </span>
              </div>
            </div>

            {/* Right Card: Personalized Learning Recommendations (5 cols) */}
            <div className="lg:col-span-5 bg-[#051B33] rounded-2xl p-6 sm:p-8 border border-[#F8C85A]/30 shadow-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-4">
                  <span className="text-xs font-mono font-bold text-[#F8C85A] uppercase tracking-wider">
                    Personalized Next Actions
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    Recommended Study Path
                  </h3>
                  <p className="text-xs text-[#FFF8E9]/75 mt-1">
                    Prioritized based on your recent diagnostic assessment results.
                  </p>
                </div>

                {/* Recommendation 1 */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#F8C85A]/60 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#F8C85A] uppercase bg-[#F8C85A]/20 px-2 py-0.5 rounded">
                      Top Priority Drill
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 25 mins
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    Data Structures: Graph Traversals & Trees
                  </div>
                  <p className="text-xs text-[#FFF8E9]/70 leading-snug">
                    Strengthen recursion and graph algorithms to raise your technical coding percentile to 92%.
                  </p>
                  <Link
                    to={trainingLink}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#F8C85A] hover:underline pt-1"
                  >
                    Start Submodule Lesson <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Recommendation 2 */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#F8C85A]/60 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-400/20 px-2 py-0.5 rounded">
                      Practice Test
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 20 Questions
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    SQL Advanced Queries & Aggregations
                  </div>
                  <p className="text-xs text-[#FFF8E9]/70 leading-snug">
                    Hands-on practice queries to solidify multi-table joins and subquery optimizations.
                  </p>
                  <Link
                    to={assessmentLink}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#F8C85A] hover:underline pt-1"
                  >
                    Launch Practice Quiz <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Recommendation 3 */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#F8C85A]/60 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-400 uppercase bg-blue-400/20 px-2 py-0.5 rounded">
                      AI Diagnostic Exam
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Timed 45m
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    Full Department Diagnostic Mock Exam
                  </div>
                  <p className="text-xs text-[#FFF8E9]/70 leading-snug">
                    Comprehensive pre-placement mock assessment reviewed with Gemini AI automated scoring.
                  </p>
                  <Link
                    to={assessmentLink}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#F8C85A] hover:underline pt-1"
                  >
                    Take Diagnostic Exam <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Direct Access Button */}
              <div className="pt-2">
                <Link to={primaryCtaLink} className="block">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F8C85A] hover:bg-[#E5B74C] text-[#08284B] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                  >
                    <span>View Your Complete Readiness Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 7. PRACTICE TESTS & ASSESSMENTS DEDICATED ANCHORS */}
      <section id="practice" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div id="assessments" className="bg-white rounded-3xl p-8 sm:p-12 border border-[#F8C85A]/40 shadow-xl space-y-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#08284B]/10 text-[#08284B] text-xs font-bold uppercase tracking-wider">
              <FileCheck className="w-3.5 h-3.5 text-[#08284B]" />
              Practice Tests & Assessments Engine
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#08284B] tracking-tight">
              Test Your Knowledge With Targeted Assessments
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Choose between self-paced topic drill tests to build confidence or timed, AI-grounded diagnostic evaluations to benchmark campus placement readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="resources">
            {/* Practice Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#FFF8E9] border border-[#F8C85A]/50 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="p-3 bg-[#08284B] text-[#F8C85A] rounded-xl w-fit">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#08284B]">
                  Self-Paced Practice Drills
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Practice tests covering quantitative reasoning, SQL programming, core engineering fundamentals, and coding patterns with instant answers and solutions.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited attempts with progressive difficulty</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant step-by-step reasoning & answer keys</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Topic mastery streak tracking</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#F8C85A]/30">
                <Link to={assessmentLink}>
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#08284B] hover:bg-[#0A315C] text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-xs"
                  >
                    <span>Launch Practice Drills</span>
                    <ArrowRight className="w-4 h-4 text-[#F8C85A]" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Assessment Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#08284B] text-white border border-[#F8C85A]/40 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="p-3 bg-[#F8C85A] text-[#08284B] rounded-xl w-fit">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  AI-Assisted Diagnostic Assessments
                </h3>
                <p className="text-xs sm:text-sm text-[#FFF8E9]/80 leading-relaxed">
                  Timed, proctored mock examinations featuring Google Gemini AI-grounded question verification to measure true student competency against placement benchmarks.
                </p>
                <ul className="space-y-2 text-xs text-[#FFF8E9]/90 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#F8C85A] shrink-0" />
                    <span>Timed test environments mirroring MNC hiring rounds</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#F8C85A] shrink-0" />
                    <span>Curriculum-grounded zero-hallucination evaluations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#F8C85A] shrink-0" />
                    <span>Verifiable performance report for placement cells</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Link to={assessmentLink}>
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F8C85A] hover:bg-[#E5B74C] text-[#08284B] font-bold text-xs sm:text-sm transition cursor-pointer shadow-xs"
                  >
                    <span>Take Official Assessment</span>
                    <ArrowRight className="w-4 h-4 text-[#08284B]" />
                  </button>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 8. INSTITUTIONAL CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#08284B] via-[#0C3562] to-[#08284B] p-8 sm:p-12 text-white border-2 border-[#F8C85A]/40 shadow-2xl overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          
          <div className="space-y-2 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#F8C85A] uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#F8C85A]" />
              Start Your Preparation Today
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Ready to Prove Your Employability Potential?
            </h2>
            <p className="text-[#FFF8E9]/85 text-xs sm:text-sm leading-relaxed">
              Join thousands of engineering students preparing systematically with structured curriculum modules, AI diagnostics, and campus placement benchmarking.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
            <Link to={primaryCtaLink}>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#F8C85A] hover:bg-[#E5B74C] text-[#08284B] font-bold text-sm shadow-lg shadow-[#F8C85A]/25 transition cursor-pointer"
              >
                <span>{user ? 'Go to My Dashboard' : 'Create Free Account'}</span>
                <ArrowRight className="w-4 h-4 text-[#08284B]" />
              </button>
            </Link>
            
            <Link to="/about">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FFF8E9] border border-white/20 font-semibold text-sm transition cursor-pointer"
              >
                <span>About MITRA</span>
              </button>
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};

export default HomePage;
