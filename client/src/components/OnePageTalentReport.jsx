import React, { useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Target,
  Printer,
  X,
  Lightbulb,
  Building2,
  ShieldCheck
} from 'lucide-react';
import Button from './Button';

const COMPETENCY_ORDER = [
  { key: 'communication', label: 'Communication' },
  { key: 'teamwork', label: 'Teamwork' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'adaptability', label: 'Adaptability' },
  { key: 'emotionalIntelligence', label: 'Emotional Intelligence' },
  { key: 'problemSolving', label: 'Problem Solving' },
  { key: 'initiative', label: 'Initiative' },
  { key: 'timeManagement', label: 'Time Management' },
  { key: 'resilience', label: 'Resilience' },
  { key: 'professionalism', label: 'Professionalism' }
];

export const OnePageTalentReport = ({
  attempt,
  onClose
}) => {
  const reportRef = useRef(null);

  if (!attempt) return null;

  const studentName = attempt.studentName || attempt.user?.name || 'Student Candidate';
  const department = attempt.department || attempt.user?.department || 'Engineering';
  const batch = attempt.batch || attempt.user?.batch || '2026';
  const erpNumber = attempt.erpNumber || attempt.user?.erpNumber || attempt.user?.rollNo || 'N/A';
  const assessmentDate = attempt.submittedAt || attempt.createdAt
    ? new Date(attempt.submittedAt || attempt.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const overallScore = attempt.overallScore ?? attempt.employabilityIndex ?? 81;
  const overallReadiness = attempt.overallReadiness || (overallScore >= 85 ? 'Exceptional' : overallScore >= 70 ? 'Strong' : 'Developing');
  const aiSummary = attempt.aiAnalysis?.aiSummary || attempt.aiSummary ||
    'Your assessment responses indicate strong foundation in analytical rigor and collaborative alignment with high adaptability in workplace team settings.';
  const traitScores = attempt.traitScores || {};
  const strengths = attempt.strengths || [];
  const developmentAreas = attempt.developmentAreas || [];
  const recommendations = attempt.recommendations || [];
  const workEnvironments = attempt.suggestedWorkEnvironment || [
    'Collaborative cross-functional engineering teams',
    'Fast-paced, technology-driven environments',
    'Structured enterprise teams with high delivery rigor'
  ];

  const docId = attempt._id ? String(attempt._id).slice(-6).toUpperCase() : '842910';

  // Isolated Single-Page Print Engine
  const handlePrint = () => {
    if (!reportRef.current) {
      window.print();
      return;
    }

    const printFrame = document.createElement('iframe');
    printFrame.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;');
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;

    // Collect all stylesheets from parent document
    let stylesHtml = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      stylesHtml += node.outerHTML;
    });

    const reportContentHtml = reportRef.current.innerHTML;

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>AI Talent Intelligence Report - ${studentName}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          ${stylesHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 4mm 6mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              width: 100%;
              height: auto;
            }
            .print-page-container {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              padding: 8px 12px;
              background: #ffffff;
            }
          </style>
        </head>
        <body>
          <div class="print-page-container">
            ${reportContentHtml}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 2000);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 flex justify-center items-start">
      {/* Control Bar (Hidden on Print) */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-3 no-print">
        <Button
          variant="primary"
          icon={Printer}
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 text-xs font-bold"
        >
          Print / Save PDF Report
        </Button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition cursor-pointer"
            title="Close Report"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Printable Single-Page Talent Intelligence Document */}
      <div
        ref={reportRef}
        className="w-full max-w-[800px] bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 my-2 text-xs"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        {/* 1. Document Header */}
        <div className="border-b-2 border-indigo-900 pb-2.5 mb-2.5 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[8.5px] font-black tracking-widest uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80">
                Official Institutional Record
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Placement Intelligence</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-tight">
              MITRA EMPLOYABILITY PORTAL
            </h1>
            <h2 className="text-xs font-extrabold text-indigo-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              AI TALENT INTELLIGENCE REPORT
            </h2>
          </div>

          <div className="text-right space-y-0.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center font-black text-sm ml-auto shadow-xs">
              M
            </div>
            <span className="text-[8px] font-mono text-slate-400 block pt-0.5">
              ID: MITRA-TR-{docId}
            </span>
          </div>
        </div>

        {/* 2. Student Information Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/90 mb-2.5 text-[10.5px]">
          <div>
            <span className="text-[8px] font-bold uppercase text-slate-400 block">Candidate Name</span>
            <span className="font-black text-slate-900 truncate block text-[10.5px]">{studentName}</span>
          </div>
          <div>
            <span className="text-[8px] font-bold uppercase text-slate-400 block">Department & Batch</span>
            <span className="font-bold text-indigo-900 block text-[10.5px]">{department} • {batch}</span>
          </div>
          <div>
            <span className="text-[8px] font-bold uppercase text-slate-400 block">Roll / ERP No</span>
            <span className="font-mono font-bold text-slate-700 block text-[10.5px]">{erpNumber}</span>
          </div>
          <div>
            <span className="text-[8px] font-bold uppercase text-slate-400 block">Evaluation Date</span>
            <span className="font-bold text-slate-700 block text-[10.5px]">{assessmentDate}</span>
          </div>
        </div>

        {/* 3. Overall Professional Readiness Banner */}
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 mb-2.5 flex items-center justify-between gap-3">
          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                Evaluation Tier: {overallReadiness}
              </span>
              <span className="text-[9px] text-slate-400 font-semibold hidden sm:inline">
                • 10-Dimension AI Synthesis
              </span>
            </div>
            <p className="text-[9.5px] sm:text-[10px] text-slate-300 leading-snug font-medium line-clamp-2">
              "{aiSummary}"
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center px-2.5 py-1 bg-slate-950 rounded-xl border border-indigo-500/30 text-center min-w-[90px]">
            <div className="text-xl font-black text-indigo-400 font-mono leading-none">
              {overallScore}
              <span className="text-[10px] font-semibold text-slate-400">/100</span>
            </div>
            <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
              Readiness Score
            </span>
          </div>
        </div>

        {/* 4. 10 Talent Dimensions Grid (Compact 2x5 Grid) */}
        <div className="mb-2.5 space-y-1">
          <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
            <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-900 flex items-center gap-1">
              <Target className="w-3 h-3 text-indigo-600" />
              10 Evaluated Behavioral Dimensions
            </h3>
            <span className="text-[8.5px] font-semibold text-slate-400">Standard Norms (0-100)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {COMPETENCY_ORDER.map((c) => {
              const scoreObj = traitScores[c.key] || { score: 75, level: 'Strong' };
              const score = typeof scoreObj === 'number' ? scoreObj : scoreObj.score || 75;
              const level = scoreObj.level || (score >= 85 ? 'Excellent' : score >= 70 ? 'Strong' : 'Developing');

              return (
                <div
                  key={c.key}
                  className="p-1.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-0.5"
                >
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="font-bold text-slate-800 truncate" title={c.label}>
                      {c.label}
                    </span>
                    <span className="font-mono font-black text-indigo-700">
                      {score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        score >= 85 ? 'bg-emerald-600' : score >= 70 ? 'bg-indigo-600' : 'bg-amber-600'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="text-[7.5px] font-semibold text-slate-400 block text-right">
                    {level}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Two-Column Layout: Strengths & Development Areas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
          {/* Top 3 Strengths */}
          <div className="p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
            <h4 className="font-extrabold text-[9.5px] uppercase tracking-wider text-emerald-900 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Validated Core Strengths (Top 3)
            </h4>
            <div className="space-y-1 text-[9px]">
              {strengths.slice(0, 3).map((s, idx) => (
                <div key={idx} className="bg-white p-1.5 rounded-lg border border-emerald-100">
                  <div className="flex items-center justify-between font-bold text-emerald-950">
                    <span>{idx + 1}. {s.competency || `Strength #${idx + 1}`}</span>
                    <span className="font-mono text-emerald-700 text-[8.5px]">{s.score ? `${s.score}%` : 'High'}</span>
                  </div>
                  <p className="text-[8.5px] text-slate-600 mt-0.5 leading-snug line-clamp-1">
                    {s.explanation || s.workplaceRelevance || (typeof s === 'string' ? s : '')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Development Opportunities */}
          <div className="p-2 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
            <h4 className="font-extrabold text-[9.5px] uppercase tracking-wider text-amber-900 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-600" />
              High-Impact Growth Areas (Top 2-3)
            </h4>
            <div className="space-y-1 text-[9px]">
              {developmentAreas.slice(0, 3).map((d, idx) => (
                <div key={idx} className="bg-white p-1.5 rounded-lg border border-amber-100">
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span>{idx + 1}. {d.area || `Opportunity #${idx + 1}`}</span>
                    <span className="font-mono text-amber-700 text-[8.5px]">{d.currentScore ? `${d.currentScore}%` : 'Focus'}</span>
                  </div>
                  <p className="text-[8.5px] text-slate-600 mt-0.5 leading-snug line-clamp-1">
                    {d.improvementSuggestion || d.whyItMatters || (typeof d === 'string' ? d : '')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. AI Actionable Recommendations & Suggested Environment */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-slate-50 border border-slate-200/90 rounded-xl mb-2">
          <div className="sm:col-span-2 space-y-0.5">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-900 block flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Actionable AI Recommendations
            </span>
            <div className="space-y-0.5 text-[8.5px] text-slate-700">
              {recommendations.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-start gap-1">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span className="leading-tight"><strong>{r.title}:</strong> {r.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-1 sm:pt-0 sm:pl-2">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-900 block flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-600" />
              Suggested Work Environments
            </span>
            <ul className="space-y-0.5 text-[8px] text-slate-600">
              {workEnvironments.slice(0, 3).map((env, i) => (
                <li key={i} className="flex items-start gap-1 leading-tight">
                  <span className="text-indigo-600">✓</span>
                  <span>{env}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 7. Institutional Sign-off Footer */}
        <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between text-[8px] text-slate-400 font-medium">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-indigo-600" />
            <span>Verified by MITRA Psychometric Evaluation Engine</span>
            <span className="mx-1">•</span>
            <span>Non-Diagnostic Talent Intelligence System</span>
          </div>
          <div className="text-right font-mono font-bold text-slate-500">
            Placement Cell Autonomous Certification
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnePageTalentReport;
