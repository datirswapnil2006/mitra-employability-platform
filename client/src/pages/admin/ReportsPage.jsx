import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Select from '../../components/Select';
import Button from '../../components/Button';
import { api } from '../../services/api';
import { OFFICIAL_DEPARTMENTS } from '../../constants/departments';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Building2,
  Users,
  CheckCircle2,
  Table,
  Layers
} from 'lucide-react';

export const ReportsPage = () => {
  const [reportType, setReportType] = useState('students');
  const [department, setDepartment] = useState('All');
  const [batch, setBatch] = useState('All');
  const [format, setFormat] = useState('xlsx');
  const [downloading, setDownloading] = useState(false);
  const [batches, setBatches] = useState(['All', '2024', '2025', '2026', '2027', '2028', '2029', '2030']);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.getBatches();
        if (res.success && Array.isArray(res.batches)) {
          setBatches(res.batches);
        }
      } catch (err) {
        console.warn('Failed to load dynamic batches:', err);
      }
    };
    fetchBatches();
  }, []);

  const departments = ['All', ...OFFICIAL_DEPARTMENTS];

  const reportTypes = [
    {
      id: 'students',
      title: 'Student Master Placement Report',
      description: 'Comprehensive registry with profile status, test scores, and employability index.',
      icon: Users
    },
    {
      id: 'assessments',
      title: 'Assessment Attempts & Audit Log',
      description: 'Granular exam submissions with ERP numbers, proctoring violation counts, camera proofs, and submission reason.',
      icon: FileText
    },
    {
      id: 'summary',
      title: 'Departmental Comparative Talent Summary',
      description: 'Executive overview aggregating metrics across the 9 official departments.',
      icon: Building2
    }
  ];

  const handleExport = async () => {
    setDownloading(true);
    try {
      await api.downloadStudentReport({ type: reportType, department, batch }, format);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200/80 uppercase tracking-wider">
              Institutional Reports
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">Placement & Accreditation Audits</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
            Institutional Reports & Data Export
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Generate and download formatted Microsoft Excel workbooks (.xlsx) and CSV files for placement drives, audits, and department reviews.
          </p>
        </div>

        {/* Quick Access Links to Live Data Tables */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/admin/students/export"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Student Export Table</span>
          </a>
          <a
            href="/admin/results"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition"
          >
            <Table className="w-4 h-4 text-indigo-600" />
            <span>Results Log</span>
          </a>
        </div>
      </div>

      {/* 1. Report Type Selection Cards */}
      <div className="space-y-3.5">
        <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
          1. Select Report Type *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypes.map((t) => {
            const Icon = t.icon;
            const isSelected = reportType === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setReportType(t.id)}
                className={`p-6 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-50/90 to-blue-50/50 border-indigo-600 ring-2 ring-indigo-500/25 shadow-sm scale-[1.01]'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-2xs'
                }`}
              >
                <div className="space-y-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 leading-snug">{t.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{t.description}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className={isSelected ? 'text-indigo-700' : 'text-slate-400'}>
                    {isSelected ? 'Active Selection' : 'Click to select'}
                  </span>
                  <CheckCircle2
                    className={`w-4 h-4 transition ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Export Configuration Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            2. Configure Export Parameters
          </h3>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            Format: {format.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Select
            label="Target Department *"
            options={departments}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />

          <Select
            label="Graduation Batch *"
            options={batches}
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
          />

          <Select
            label="Output File Format *"
            options={['Excel Workbook (.xlsx)', 'Comma-Separated (.csv)']}
            value={format === 'csv' ? 'Comma-Separated (.csv)' : 'Excel Workbook (.xlsx)'}
            onChange={(e) =>
              setFormat(e.target.value.includes('.csv') ? 'csv' : 'xlsx')
            }
          />
        </div>

        {/* Info Box */}
        <div className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-700">
          <p className="font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Included Report Data Attributes:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-600">
            <li className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-indigo-700">
                Student & Academics
              </span>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Name, Institutional ERP, Email, Gender, Dept, 10th %, 12th %, Diploma %, Degree CGPA.
              </p>
            </li>
            <li className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-blue-700">
                Assessment Analytics
              </span>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Tests completed, pass/fail status, average score %, category performance logs.
              </p>
            </li>
            <li className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-emerald-700">
                Employability Readiness
              </span>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Big Five psychometric score, core strengths, proctoring violations summary.
              </p>
            </li>
          </ul>
        </div>

        <div className="pt-2">
          <Button
            size="lg"
            variant="primary"
            icon={Download}
            loading={downloading}
            onClick={handleExport}
            className="w-full justify-center text-sm font-black py-3.5 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
          >
            {downloading
              ? 'Generating Report...'
              : `Download ${department === 'All' ? 'All Departments' : department} ${
                  format === 'csv' ? 'CSV Report' : 'Excel Report (.xlsx)'
                }`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
