import React from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPolicyPage = () => {
  const sections = [
    {
      title: '1. Information We Collect',
      content: 'MITRA collects user information necessary to provide structured training, profile verification, assessment scoring, and placement cell reporting.'
    },
    {
      title: '2. Student Profile Information',
      content: 'We collect student academic details: Full Name, Institutional Email, ERP Number, Gender, Section, Department, Academic Year, Graduation Batch, Phone Number, Bio, Technical Skills, Resume URL, and LinkedIn/GitHub links.'
    },
    {
      title: '3. Learning and Assessment Activity',
      content: 'We record student submodule completion timestamps, watched lectures, assessment attempt counts, scores, category breakdowns (MCQ, SQL Query, Conceptual), and query execution histories.'
    },
    {
      title: '4. Authentication Information',
      content: 'User passwords are cryptographically hashed using industry-standard bcrypt before storage. Session authorization is managed via secure, signed JSON Web Tokens (JWT).'
    },
    {
      title: '5. Proctoring Data where applicable',
      content: 'Assessment timers, submission timestamps, and attempt history are logged to verify test authenticity and compliance with placement cell evaluation rules.'
    },
    {
      title: '6. AI Processing',
      content: 'AI-assisted assessments are generated using Google Gemini API through an isolated backend service. Student personally identifiable information (PII) is not transmitted to external AI endpoints; only topic curricula are processed for question generation.'
    },
    {
      title: '7. How Data Is Used',
      content: 'Collected data is used strictly to enforce profile gating, track curriculum progression, calculate employability readiness scores, and compile department-level placement reports.'
    },
    {
      title: '8. Data Storage',
      content: 'All student, module, and assessment records are stored in secure MongoDB databases with indexed querying and role-based access restrictions.'
    },
    {
      title: '9. Data Security',
      content: 'We implement role-based access control (RBAC), API rate-limiting, encrypted token verification, and strict backend authorization to prevent unauthorized access.'
    },
    {
      title: '10. Third-Party Services',
      content: 'We do not sell student data. Third-party interactions are limited to secure cloud database storage and Google Gemini AI services operated under strict backend isolation.'
    },
    {
      title: '11. External Learning Links',
      content: 'MITRA references external learning resources (e.g. YouTube video lectures). External websites have their own respective privacy policies when students view resources outside MITRA.'
    },
    {
      title: '12. Data Retention',
      content: 'Student records and placement performance metrics are retained for the duration of the student’s academic tenure and graduation placement cycle.'
    },
    {
      title: '13. Student Rights',
      content: 'Students have the right to inspect their stored profile details, review assessment score breakdowns, and request data corrections through their department coordinator.'
    },
    {
      title: '14. Policy Updates',
      content: 'Any updates to this Privacy Policy will be posted directly on this page with an updated effective date.'
    },
    {
      title: '15. Contact Information',
      content: 'For privacy inquiries, data verification, or policy questions, please contact the Placement Directorate at privacy@mitra.edu.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="text-center space-y-4">
        <Badge variant="success" className="flex items-center gap-1 w-fit mx-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Data Privacy & Protection
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Effective Date: Academic Year 2026 • Student Data Protection & Institutional Privacy
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((sec, idx) => (
          <Card key={idx} className="hover:shadow-sm transition-all">
            <h3 className="text-base font-bold text-slate-900 mb-2">{sec.title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{sec.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
