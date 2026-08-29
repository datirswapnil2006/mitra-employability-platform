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
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Institutional Reports & Data Export"
        subtitle="Generate formatted Microsoft Excel workbooks and CSV files for placement drives, accreditations, and audits."
        breadcrumbs={[
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Reports & Exports' }
        ]}
      />

      {/* 1. Report Type Selection Cards */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Select Report Type *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypes.map((t) => {
            const Icon = t.icon;
            const isSelected = reportType === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setReportType(t.id)}
                className={`p-5 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-2">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{t.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100/80 flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                  <CheckCircle2
                    className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}
                  />
                  <span>{isSelected ? 'Selected' : 'Click to select'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Export Configuration Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Export Parameters & Format
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            label="File Format *"
            options={['Excel Workbook (.xlsx)', 'Comma-Separated (.csv)']}
            value={format === 'csv' ? 'Comma-Separated (.csv)' : 'Excel Workbook (.xlsx)'}
            onChange={(e) =>
              setFormat(e.target.value.includes('.csv') ? 'csv' : 'xlsx')
            }
          />
        </div>

        {/* Info Box */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
          <p className="font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Export Data Schema Details:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 leading-relaxed">
            <li>
              <strong>Student Identification & Academics:</strong> Full Name, Email, ERP Number, Gender, Department, Academic Year, 10th Standard %, 12th Standard %, Diploma %, and Degree CGPA.
            </li>
            <li>
              <strong>Assessment Analytics:</strong> Total tests taken, pass count, average test score %, and individual attempt logs.
            </li>
            <li>
              <strong>Employability Metrics:</strong> Big Five Psychometric Readiness Index % and overall employability rating.
            </li>
          </ul>
        </div>

        <Button
          size="lg"
          variant="primary"
          icon={Download}
          loading={downloading}
          onClick={handleExport}
          className="w-full justify-center text-sm font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
        >
          Download {department} {format === 'csv' ? 'CSV Report' : 'Excel Report (.xlsx)'}
        </Button>
      </div>
    </div>
  );
};

export default ReportsPage;
