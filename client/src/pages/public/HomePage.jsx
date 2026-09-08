import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import {
  ArrowRight,
  BookOpen,
  Cpu,
  Brain,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Award,
  Users,
  Terminal,
  Code,
  FileCheck,
  PlayCircle,
  FileSpreadsheet,
  GraduationCap,
  Layers
} from 'lucide-react';

export const HomePage = () => {
  const [activeTab, setActiveTab] = useState('curriculum');

  const stats = [
    { label: 'Student Capacity', value: '4,000+', icon: Users, color: 'text-blue-600' },
    { label: 'Academic Streams', value: '9 Branches', icon: GraduationCap, color: 'text-indigo-600' },
    { label: 'AI Question Grounding', value: '100%', icon: Sparkles, color: 'text-emerald-600' },
    { label: 'T&P Excel Reports', value: 'Instant', icon: FileSpreadsheet, color: 'text-sky-600' }
  ];

  const features = [
    {
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      title: 'Curated Training Modules',
      desc: 'Structured curriculum across Technical Coding, Aptitude, SQL, Domain Knowledge, and Soft Skills.'
    },
    {
      icon: Brain,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      title: 'Grounded AI Assessments',
      desc: 'Topic-grounded assessments powered by Gemini AI with diagnostic feedback and zero hallucination.'
    },
    {
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      title: '100% Profile Gating',
      desc: 'Enforces complete academic and contact verification before unlocking modules and placement tests.'
    },
    {
      icon: BarChart3,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      title: 'Placement Intelligence',
      desc: 'Cohort-level analytics with 1-click department Excel (.xlsx) export for Training & Placement Officers.'
    }
  ];

  const trainingModules = [
    { title: 'Aptitude & Reasoning', icon: Brain, desc: 'Quantitative, logical reasoning, and speed drills.' },
    { title: 'Technical Coding & DSA', icon: Code, desc: 'Data structures, algorithms, and technical interview patterns.' },
    { title: 'SQL & Databases', icon: Terminal, desc: 'Relational queries, Joins, grouping, and schema evaluation.' },
    { title: 'Domain Knowledge', icon: Cpu, desc: 'Curriculum mapped to EXTC, CSE, IT, ME, Civil, IoT, AI/DS, MBA, MCA.' },
    { title: 'Corporate Communication', icon: Users, desc: 'Business etiquette, group discussions, and presentations.' },
    { title: 'Resume & Interviews', icon: Award, desc: 'ATS resume formatting and STAR-method behavioral preparation.' }
  ];

  const departments = [
    { name: 'EXTC', desc: 'Embedded Systems & IoT' },
    { name: 'CSE', desc: 'Algorithms & Full-Stack' },
    { name: 'IT', desc: 'Cloud, DevOps & Systems' },
    { name: 'Mechanical', desc: 'CAD/CAM & Automation' },
    { name: 'Civil', desc: 'Structural Design & BIM' },
    { name: 'CSE-IoT', desc: 'Connected Edge Devices' },
    { name: 'AI & DS', desc: 'Machine Learning & Big Data' },
    { name: 'MBA', desc: 'Management & Finance' },
    { name: 'MCA', desc: 'Enterprise Applications' }
  ];

  const steps = [
    { num: '01', title: 'Onboard', desc: 'Register with institutional credentials' },
    { num: '02', title: 'Verify Profile', desc: 'Complete 100% academic profile gating' },
    { num: '03', title: 'Learn & Assess', desc: 'Curated videos, notes & AI evaluations' },
    { num: '04', title: 'Get Placed', desc: 'Placement readiness & T&P shortlisting' }
  ];

  return (
    <div className="space-y-16 sm:space-y-20 pb-16">
      {/* 1. Compact Hero Section */}
      <section className="relative pt-8 sm:pt-14 px-4 sm:px-6 max-w-7xl mx-auto hero-glow">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full text-xs font-bold text-blue-700 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Institutional Employability & Placement Platform
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
            Build Skills. Test Knowledge. <br className="hidden sm:block" />
            <span className="gradient-brand">Become Placement Ready.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            An integrated campus platform uniting structured training, AI-grounded assessments, 
            mandatory profile gating, and real-time placement analytics.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" icon={ArrowRight} className="w-full sm:w-auto justify-center shadow-md">
                Get Started
              </Button>
            </Link>
            <Link to="/training" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto justify-center bg-white">
                Explore Curriculum
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Dashboard Preview Mockup */}
        <div className="mt-10 max-w-4xl mx-auto bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xl relative">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[11px] font-mono text-slate-400 pl-2">mitra.edu/student/dashboard</span>
            </div>
            <Badge variant="success">Verified Profile</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Profile Completion</span>
                <span className="text-emerald-600 font-bold">100%</span>
              </div>
              <ProgressBar progress={100} color="emerald" showPercentage={false} />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Core Curriculum</span>
                <span className="text-blue-600 font-bold">82%</span>
              </div>
              <ProgressBar progress={82} color="indigo" showPercentage={false} />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">AI Mapped Tests</span>
                <span className="text-slate-900 font-bold">9 / 10 Passed</span>
              </div>
              <ProgressBar progress={90} color="sky" showPercentage={false} />
            </div>
          </div>

          <div className="mt-3.5 p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                <PlayCircle className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-900 truncate">
                Next: <strong className="text-blue-700">SQL Joins & Relational Queries</strong>
              </span>
            </div>
            <Link to="/login" className="text-blue-600 font-bold hover:underline shrink-0 flex items-center gap-1">
              Resume <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Compact Statistics Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="space-y-1 pt-3 md:pt-0">
                <div className={`flex items-center justify-center gap-1.5 ${s.color} mb-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{s.value}</h3>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Core Capabilities Grid (4 Concise Cards) */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge variant="primary">Core Capabilities</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Engineered for Campus Employability
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <Card key={idx} className="p-5 hover:shadow-md transition-all border-slate-200 flex flex-col justify-between">
                <div>
                  <div className={`p-2.5 rounded-xl w-fit mb-3 border ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 4. Tabbed Curriculum & Department Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Curriculum & Departments</h2>
            <p className="text-xs text-slate-500">Comprehensive training modules and supported academic branches</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'curriculum' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Training Modules (6)
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'departments' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Academic Branches (9)
            </button>
          </div>
        </div>

        {activeTab === 'curriculum' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainingModules.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all shadow-xs">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{m.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600">{m.desc}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {departments.map((dept, idx) => (
              <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all shadow-xs">
                <span className="font-black text-blue-600 text-sm block">{dept.name}</span>
                <span className="text-xs text-slate-600 block mt-0.5">{dept.desc}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Compact 4-Step Placement Roadmap */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-6 space-y-1">
            <Badge variant="primary">How MITRA Works</Badge>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">4 Steps to Placement Readiness</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 relative">
                <span className="text-blue-600 font-mono font-bold text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  STEP {step.num}
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{step.title}</h4>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. High-Conversion Professional CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 sm:p-10 text-white shadow-xl space-y-6">
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to Accelerate Your Career?
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm">
              Join students preparing with verified curriculum, AI assessments, and institutional analytics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" icon={ArrowRight} className="w-full sm:w-auto bg-white hover:bg-slate-100 text-blue-700 font-bold border-0 shadow-md">
                Get Started
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="hover:bg-slate-100 text-blue-700 font-bold border-0 shadow-md">
                Sign In to Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
