import React from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { GraduationCap, ShieldCheck, Target, Award, Users, BookOpen, Sparkles } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="primary">About the Platform</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          About MITRA Employability Portal
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed">
          Bridging the gap between academic learning and corporate placement standards through modular training, grounded AI evaluation, and departmental analytics.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-all">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4 border border-blue-100">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Our Mission</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To empower over 4,000+ engineering and management students with high-yield employability skills, hands-on SQL and coding practice, and instant performance feedback before appearing for campus placement drives.
          </p>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4 border border-emerald-100">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Our Vision</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To establish an institutional benchmark where learning progress is rigorously tracked at the submodule level, ensuring students only sit for assessments once core concepts have been thoroughly learned and verified.
          </p>
        </Card>
      </div>

      {/* Core Institutional Pillars */}
      <Card title="Institutional Pillars of MITRA" subtitle="Four core foundations of the employability framework">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">100% Profile Gating</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every student account is mapped to their institutional ERP Number, Department, Section, and Resume link, ensuring authentic credentials and verifiable records.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-600" />
              <h4 className="font-bold text-slate-900 text-sm">Department-Aware Curriculum</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Specialized domain training customized for EXTC, CSE, IT, Mechanical, Civil, CSE-IoT, AI & DS, MBA, and MCA branches.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-slate-900 text-sm">Grounded AI Assessment</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gemini API evaluates students on precise submodule contents, preventing out-of-scope questions and providing structured performance feedback.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-sm">Placement Officer Analytics</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Training and Placement Officers (TPO) can export verified department-wise Excel workbooks for recruiter coordination.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AboutPage;
