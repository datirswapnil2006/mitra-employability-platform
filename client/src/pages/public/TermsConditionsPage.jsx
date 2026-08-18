import React from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { ShieldCheck, FileText } from 'lucide-react';

export const TermsConditionsPage = () => {
  const sections = [
    {
      title: '1. Introduction',
      content: 'Welcome to the MITRA Employability Portal ("MITRA", "the Platform"). By accessing or registering for an account, students, faculty, and administrative personnel agree to adhere to these Terms & Conditions. This platform is designed to facilitate institutional training, modular assessments, and employability evaluation.'
    },
    {
      title: '2. User Eligibility',
      content: 'Access to MITRA is restricted to currently enrolled students, faculty members, and authorized Training & Placement Officers (TPO) possessing valid institutional credentials and ERP numbers.'
    },
    {
      title: '3. Account and Credentials',
      content: 'Users are responsible for maintaining the confidentiality of their login credentials (email, password, and JWT session tokens). Account sharing, credential transfer, or unauthorized access attempts are strictly prohibited.'
    },
    {
      title: '4. Student Responsibilities',
      content: 'Students agree to provide accurate, verified academic details including Roll/ERP Number, Department, Year, Section, and Resume links. Incomplete or falsified profiles will restrict access via the Profile Gating Engine.'
    },
    {
      title: '5. Training Content',
      content: 'Curriculum modules, external video links, visual learning cards, notes, and documentation provided on MITRA are curated strictly for educational and career preparation purposes.'
    },
    {
      title: '6. Assessments & Submodule Mapping',
      content: 'Assessments are unlocked strictly upon achieving 100% completion of the respective training submodule. All mock test submissions, SQL executions, and scoring calculations are logged as official academic activity.'
    },
    {
      title: '7. AI-Assisted Features',
      content: 'MITRA utilizes secure backend AI services (Google Gemini API) to generate grounded assessment items. AI-generated evaluations are structured as supplementary practice tools to assist student learning.'
    },
    {
      title: '8. Academic Integrity',
      content: 'Students must complete all MCQ, conceptual, and SQL query assessments independently. Any use of unauthorized automation, malicious scripts, or test tampering violates the institutional code of conduct.'
    },
    {
      title: '9. Proctoring and Monitoring',
      content: 'Assessment attempts may log timers, attempt counts, answer histories, and focus states where applicable to ensure test authenticity and fairness across all participating departments.'
    },
    {
      title: '10. Intellectual Property',
      content: 'The MITRA platform architecture, software components, evaluation algorithms, and proprietary curriculum schemas remain the intellectual property of the institution and software authors.'
    },
    {
      title: '11. External Links and Third-Party Resources',
      content: 'MITRA links to external learning videos (e.g. YouTube, documentation sites). The platform does not host the underlying external media files and is not responsible for external content availability or changes.'
    },
    {
      title: '12. Platform Availability',
      content: 'While we strive for continuous availability, system maintenance, upgrades, or database backups may cause temporary scheduled downtime. The placement cell will notify students of scheduled assessment windows.'
    },
    {
      title: '13. Limitation of Liability',
      content: 'MITRA is an educational enablement platform. While it prepares students for recruitment drives, platform metrics and mock assessment scores do not constitute a direct guarantee of corporate employment.'
    },
    {
      title: '14. Changes to Terms',
      content: 'The Training & Placement Directorate reserves the right to amend these terms to reflect evolving institutional policies or regulatory guidelines. Continued platform use signifies acceptance of updated terms.'
    },
    {
      title: '15. Contact Information',
      content: 'For questions regarding these Terms & Conditions or institutional grievance resolution, please contact the Placement Directorate at placements@mitra.edu.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="text-center space-y-4">
        <Badge variant="primary" className="flex items-center gap-1 w-fit mx-auto">
          <FileText className="w-3.5 h-3.5" /> Institutional Policy
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Terms & Conditions
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Effective Date: Academic Year 2026 • MITRA Employability Platform Guidelines
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

export default TermsConditionsPage;
