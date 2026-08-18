import React from 'react';
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
  Layers,
  Sparkles,
  ShieldCheck,
  Award,
  Users,
  Clock,
  Terminal,
  Code,
  FileCheck,
  PlayCircle,
  FileSpreadsheet
} from 'lucide-react';

export const HomePage = () => {
  const departments = [
    { name: 'EXTC', desc: 'Embedded Systems, IoT & Telecommunications' },
    { name: 'CSE', desc: 'Algorithms, Full-Stack & System Design' },
    { name: 'IT', desc: 'Cloud Computing, DevOps & Software Engineering' },
    { name: 'Mechanical', desc: 'CAD/CAM, Thermal Systems & Robotics' },
    { name: 'Civil', desc: 'Structural Design, BIM & Geotechnical' },
    { name: 'CSE-IoT', desc: 'Connected Devices, Sensors & Edge AI' },
    { name: 'AI & DS', desc: 'Machine Learning, Deep Learning & Analytics' },
    { name: 'MBA', desc: 'Strategic Management, Marketing & Finance' },
    { name: 'MCA', desc: 'Enterprise Systems, Database & Applications' }
  ];

  const trainingCategories = [
    { title: 'Aptitude', icon: Brain, desc: 'Quantitative problem solving, logical reasoning, and placement test speed drills.' },
    { title: 'Domain Knowledge', icon: Cpu, desc: 'Core engineering curriculum modules tailored to your specific academic department.' },
    { title: 'Technical Coding', icon: Code, desc: 'Data structures, algorithms, runtime optimization, and technical interview problems.' },
    { title: 'SQL & Databases', icon: Terminal, desc: 'Relational queries, complex Joins, aggregation, and in-memory schema evaluation.' },
    { title: 'Communication', icon: Users, desc: 'Corporate communication, email writing, presentation skills, and group discussion.' },
    { title: 'Resume Building', icon: FileCheck, desc: 'ATS-optimized resume structuring, portfolio links, and keyword optimization.' },
    { title: 'Interview Preparation', icon: Award, desc: 'HR interview behavioral questions, technical rounds, and mock assessment drills.' }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="relative pt-12 md:pt-18 px-4 sm:px-6 max-w-7xl mx-auto hero-glow">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-700 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Next-Gen Institutional Employability Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Build Skills. Test Knowledge. <br className="hidden sm:block" />
            <span className="gradient-brand">Become Placement Ready.</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal">
            MITRA is an integrated employability platform connecting structured training, assessments, AI-assisted learning, and student performance analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" icon={ArrowRight} className="w-full justify-center">
                Get Started
              </Button>
            </Link>
            <Link to="/training" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full justify-center">
                Explore Training Curriculum
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Visual Mockup */}
        <div className="mt-14 max-w-5xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs font-mono text-slate-500 pl-2">mitra-portal.edu/student/dashboard</span>
            </div>
            <Badge variant="success">Institutional Verified</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Widget 1: Profile */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-semibold">Profile Completion</span>
                <span className="text-emerald-600 font-bold">100%</span>
              </div>
              <ProgressBar progress={100} color="emerald" showPercentage={false} />
              <p className="text-[11px] text-slate-500">All required academic fields verified</p>
            </div>

            {/* Widget 2: Training */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-semibold">Overall Curriculum</span>
                <span className="text-blue-600 font-bold">80%</span>
              </div>
              <ProgressBar progress={80} color="indigo" showPercentage={false} />
              <p className="text-[11px] text-slate-500">SQL & Aptitude submodules finished</p>
            </div>

            {/* Widget 3: Assessments */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-semibold">Mapped Assessments</span>
                <span className="text-slate-900 font-bold">8 / 10 Completed</span>
              </div>
              <ProgressBar progress={80} color="sky" showPercentage={false} />
              <p className="text-[11px] text-slate-500">Average score: 85% PASSED</p>
            </div>
          </div>

          {/* Continue Learning Banner */}
          <div className="mt-5 p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                <PlayCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-blue-700 font-bold">Next Recommended Action:</span>
                <p className="text-sm font-bold text-slate-900">SQL → Joins & Relational Querying (78% in progress)</p>
              </div>
            </div>
            <Link to="/login">
              <Button size="sm" variant="primary" icon={ArrowRight}>
                Continue Learning
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="space-y-1 pt-4 md:pt-0">
            <h3 className="text-3xl font-black text-slate-900">4,000+</h3>
            <p className="text-xs text-slate-500 font-semibold">Designed Student Capacity</p>
          </div>
          <div className="space-y-1 pt-4 md:pt-0">
            <h3 className="text-3xl font-black text-blue-600">9</h3>
            <p className="text-xs text-slate-500 font-semibold">Academic Departments</p>
          </div>
          <div className="space-y-1 pt-4 md:pt-0">
            <h3 className="text-3xl font-black text-emerald-600">100%</h3>
            <p className="text-xs text-slate-500 font-semibold">Grounded AI Assessments</p>
          </div>
          <div className="space-y-1 pt-4 md:pt-0">
            <h3 className="text-3xl font-black text-sky-600">Instant</h3>
            <p className="text-xs text-slate-500 font-semibold">Excel Placement Reports</p>
          </div>
        </div>
      </section>

      {/* 3. Core Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="primary">Core Capabilities</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">Engineered for Complete Employability</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            From verified student profile onboarding to AI-evaluated domain tests and department analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-all">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4 border border-blue-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Structured Training</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Organized learning curriculum across technical coding, aptitude, SQL, domain engineering, and communication skills.
            </p>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl w-fit mb-4 border border-sky-100">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Department-Aware Learning</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Domain training mapped to specific academic streams: EXTC, CSE, IT, Mechanical, Civil, CSE-IoT, AI & DS, MBA, and MCA.
            </p>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit mb-4 border border-amber-100">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">AI-Assisted Assessments</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dynamically generated tests powered by Google Gemini API, grounded strictly in approved submodule topics.
            </p>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4 border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Profile Gating Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enforces 100% profile completeness before allowing access to training modules and placement tests.
            </p>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4 border border-indigo-100">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Module-Based Assessments</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Submodule assessment mapping locks tests until all required video lectures and learning items are completed.
            </p>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl w-fit mb-4 border border-rose-100">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Placement Analytics & Reports</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Centralized student performance monitoring and instant department-wise Excel export for placement officers.
            </p>
          </Card>
        </div>
      </section>

      {/* 4. How MITRA Works (Visual Workflow) */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="primary">The MITRA Methodology</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">How MITRA Works</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            A structured six-step workflow designed to take every student from enrollment to career readiness.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-blue-600 font-mono font-bold text-xs">01</span>
              <h4 className="font-bold text-slate-900 text-sm">Register</h4>
              <p className="text-[11px] text-slate-500">Student ERP & credentials</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-blue-600 font-mono font-bold text-xs">02</span>
              <h4 className="font-bold text-slate-900 text-sm">Complete Profile</h4>
              <p className="text-[11px] text-slate-500">100% gating verification</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-blue-600 font-mono font-bold text-xs">03</span>
              <h4 className="font-bold text-slate-900 text-sm">Learn</h4>
              <p className="text-[11px] text-slate-500">Watch lectures & notes</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-blue-600 font-mono font-bold text-xs">04</span>
              <h4 className="font-bold text-slate-900 text-sm">Assess</h4>
              <p className="text-[11px] text-slate-500">Mock & AI tests</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-blue-600 font-mono font-bold text-xs">05</span>
              <h4 className="font-bold text-slate-900 text-sm">Analyze</h4>
              <p className="text-[11px] text-slate-500">Category score audit</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-blue-600 font-mono font-bold text-xs">06</span>
              <h4 className="font-bold text-slate-900 text-sm">Improve</h4>
              <p className="text-[11px] text-slate-500">Placement readiness</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-700 font-semibold uppercase tracking-wider">
              Core Concept:{' '}
              <span className="text-blue-600 font-bold">
                Learn → Complete → Assess → Analyze → Improve
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* 5. Training Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="primary">Curriculum Areas</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">Comprehensive Training Modules</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Structured skill building covering every aspect of campus placement drives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainingCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Card key={idx} className="flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-3 border border-blue-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">{cat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{cat.desc}</p>
                </div>
                <Link to="/training">
                  <Button size="sm" variant="outline" className="w-full justify-center">
                    Explore Module
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 6. Supported Domain Knowledge Departments */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="primary">Multi-Department Ecosystem</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">9 Supported Academic Departments</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Tailored learning and domain knowledge mapped for every degree branch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {departments.map((dept, idx) => (
            <div
              key={idx}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-blue-600 text-base">{dept.name}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Department</span>
              </div>
              <p className="text-xs text-slate-600">{dept.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. AI Assessment Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white rounded-3xl p-8 sm:p-12 border border-blue-200/80 shadow-xs relative overflow-hidden">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-100/80 border border-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Grounded AI Assessment Engine
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Smarter Assessments with AI
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed font-normal">
              When students complete a training submodule, the backend securely uses Gemini API to generate structured, topic-grounded assessments with multiple question types.
            </p>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-700 font-mono space-y-1.5 shadow-xs">
              <p className="text-blue-600 font-bold">Grounded Pipeline Flow:</p>
              <p className="text-slate-600">Training Completed → Topic Identified → Gemini Grounding → Structured Questions → Safe Evaluation → Performance Feedback</p>
            </div>

            <Link to="/register">
              <Button size="lg" variant="primary" icon={ArrowRight}>
                Try AI Assessments
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Admin Experience Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <Badge variant="primary">Placement Cell & HOD Control</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Complete Platform Control for Administrators</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Administrators manage training modules, submodules, external video URL metadata, mapped assessments, student progress, and one-click Excel department reports.
              </p>
              <div className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block">
                Students → Progress → Results → Department Excel Report (.xlsx)
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3 shrink-0 shadow-xs">
              <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-900">Excel Placement Reports</h4>
              <p className="text-[11px] text-slate-500">Department-wise export with weighted scores</p>
              <Link to="/login">
                <Button size="sm" variant="outline">Admin Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-10 sm:p-14 text-white shadow-xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Build Your Employability?
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto leading-relaxed">
            Learn smarter. Practice better. Prepare for your career with structured curriculum, AI assessments, and institutional verification.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link to="/register">
              <Button size="lg" variant="secondary" icon={ArrowRight} className="bg-white hover:bg-slate-100 text-blue-700 font-bold border-0 shadow-md">
                Get Started as a Student
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
