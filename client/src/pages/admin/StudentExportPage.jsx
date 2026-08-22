import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import LoadingState from '../../components/LoadingState';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  SlidersHorizontal,
  Sparkles,
  Award,
  CheckCircle2,
  RotateCcw,
  Users,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  MapPin,
  CreditCard,
  Layers,
  FileCheck
} from 'lucide-react';
import { OFFICIAL_DEPARTMENTS, ACADEMIC_YEARS } from '../../constants/departments';

export const StudentExportPage = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [tableSearch, setTableSearch] = useState('');

  // Applied Filter State
  const [filters, setFilters] = useState({
    department: 'All',
    batch: 'All',
    year: 'All',
    minTenth: '',
    minTwelfth: '',
    minCgpa: '',
    backlogStatus: 'All',
    gapStatus: 'All'
  });

  const departments = ['All', ...OFFICIAL_DEPARTMENTS];
  const years = ['All', ...ACADEMIC_YEARS];
  const batches = ['All', '2024', '2025', '2026', '2027', '2028'];

  const tenthOptions = [
    { value: '', label: 'All 10th Scores' },
    { value: '55', label: '55% & Above' },
    { value: '60', label: '60% & Above (Standard Placement)' },
    { value: '65', label: '65% & Above' },
    { value: '70', label: '70% & Above' },
    { value: '75', label: '75% & Above' },
    { value: '80', label: '80% & Above' },
    { value: '85', label: '85% & Above' }
  ];

  const twelfthOptions = [
    { value: '', label: 'All 12th / Diploma Scores' },
    { value: '55', label: '55% & Above' },
    { value: '60', label: '60% & Above (Standard Placement)' },
    { value: '65', label: '65% & Above' },
    { value: '70', label: '70% & Above' },
    { value: '75', label: '75% & Above' },
    { value: '80', label: '80% & Above' },
    { value: '85', label: '85% & Above' }
  ];

  const cgpaOptions = [
    { value: '', label: 'All CGPA Scores' },
    { value: '6.0', label: '6.0 CGPA & Above' },
    { value: '6.5', label: '6.5 CGPA & Above' },
    { value: '7.0', label: '7.0 CGPA & Above' },
    { value: '7.5', label: '7.5 CGPA & Above' },
    { value: '8.0', label: '8.0 CGPA & Above' },
    { value: '8.5', label: '8.5 CGPA & Above' },
    { value: '9.0', label: '9.0 CGPA & Above' }
  ];

  const backlogOptions = [
    { value: 'All', label: 'All (Any Backlog Status)' },
    { value: 'No', label: '0 Active Backlogs Only (Clear)' },
    { value: 'Yes', label: 'Has Active Backlogs' }
  ];

  const gapOptions = [
    { value: 'All', label: 'All (Any Gap Status)' },
    { value: 'No', label: 'No Education Gap Only' },
    { value: 'Yes', label: 'Has Education Gap' }
  ];

  useEffect(() => {
    fetchStudents();
  }, [filters.department, filters.year]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.department !== 'All') params.department = filters.department;
      if (filters.year !== 'All') params.year = filters.year;

      const res = await api.getAllStudentsAdmin(params);
      if (res.success) {
        setStudents(res.students || []);
      }
    } catch (err) {
      console.error('Error fetching students for export sub-module:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyPreset = (preset) => {
    if (preset === 'above60') {
      setFilters(prev => ({
        ...prev,
        minTenth: '60',
        minTwelfth: '60',
        backlogStatus: 'No'
      }));
    } else if (preset === 'above70') {
      setFilters(prev => ({
        ...prev,
        minTenth: '70',
        minTwelfth: '70',
        minCgpa: '7.0',
        backlogStatus: 'No'
      }));
    } else if (preset === 'clear') {
      setFilters(prev => ({
        ...prev,
        backlogStatus: 'No'
      }));
    } else if (preset === 'reset') {
      setFilters({
        department: 'All',
        batch: 'All',
        year: 'All',
        minTenth: '',
        minTwelfth: '',
        minCgpa: '',
        backlogStatus: 'All',
        gapStatus: 'All'
      });
    }
  };

  // Filter students based on all selected criteria
  const filteredStudents = students.filter((s) => {
    if (!s || !s.user) return false;

    // Batch filter
    if (filters.batch !== 'All' && s.batch !== filters.batch) return false;

    // Backlog filter
    if (filters.backlogStatus === 'No' && s.hasBacklogs !== 'No') return false;
    if (filters.backlogStatus === 'Yes' && s.hasBacklogs === 'No') return false;

    // Gap filter
    if (filters.gapStatus === 'No' && s.educationGap !== 'No') return false;
    if (filters.gapStatus === 'Yes' && s.educationGap === 'No') return false;

    // 10th score criteria
    if (filters.minTenth) {
      const tenth = parseFloat(filters.minTenth);
      if (s.tenthPercentage === null || s.tenthPercentage === undefined || s.tenthPercentage < tenth) {
        return false;
      }
    }

    // 12th / Diploma score criteria
    if (filters.minTwelfth) {
      const twelfthReq = parseFloat(filters.minTwelfth);
      const twelfth = s.twelfthPercentage;
      const diploma = s.diplomaPercentage;
      const best = Math.max(
        twelfth !== null && twelfth !== undefined ? twelfth : 0,
        diploma !== null && diploma !== undefined ? diploma : 0
      );
      if (best < twelfthReq) return false;
    }

    // CGPA criteria
    if (filters.minCgpa) {
      const cgpaReq = parseFloat(filters.minCgpa);
      if (s.cgpa === null || s.cgpa === undefined || s.cgpa < cgpaReq) return false;
    }

    // Search query
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      const name = (s.user.name || '').toLowerCase();
      const email = (s.user.email || '').toLowerCase();
      const erp = (s.erpNumber || s.rollNo || '').toLowerCase();
      const town = (s.hometown || '').toLowerCase();
      return name.includes(q) || email.includes(q) || erp.includes(q) || town.includes(q);
    }

    return true;
  });

  // Calculate summary statistics
  const totalMatched = filteredStudents.length;
  const avg10th = totalMatched > 0
    ? (filteredStudents.reduce((acc, s) => acc + (s.tenthPercentage || 0), 0) / totalMatched).toFixed(1)
    : 0;
  const avg12th = totalMatched > 0
    ? (filteredStudents.reduce((acc, s) => acc + Math.max(s.twelfthPercentage || 0, s.diplomaPercentage || 0), 0) / totalMatched).toFixed(1)
    : 0;
  const avgCgpa = totalMatched > 0
    ? (filteredStudents.reduce((acc, s) => acc + (s.cgpa || 0), 0) / totalMatched).toFixed(2)
    : 0;
  const clearBacklogCount = filteredStudents.filter((s) => s.hasBacklogs === 'No').length;

  const [downloading, setDownloading] = useState(null);
  const [downloadError, setDownloadError] = useState('');

  const handleDownload = async (format = 'xlsx') => {
    setDownloading(format);
    setDownloadError('');
    try {
      await api.downloadStudentReport(
        {
          department: filters.department,
          batch: filters.batch,
          year: filters.year,
          minTenth: filters.minTenth || '',
          minTwelfth: filters.minTwelfth || '',
          minCgpa: filters.minCgpa || '',
          backlogStatus: filters.backlogStatus,
          gapStatus: filters.gapStatus
        },
        format
      );
    } catch (err) {
      console.error('Download error:', err);
      setDownloadError(err.message || 'Failed to download report. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const columns = [
    {
      header: 'ERP Number',
      accessor: 'erpNumber',
      render: (row) => <span className="font-mono text-slate-700 font-bold">{row.erpNumber || row.rollNo || 'N/A'}</span>
    },
    {
      header: 'Student Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.profilePhoto || row.user?.profilePhoto ? (
            <img
              src={row.profilePhoto || row.user?.profilePhoto}
              alt={row.user?.name || 'Student'}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
              {row.user?.name ? row.user.name.charAt(0).toUpperCase() : 'S'}
            </div>
          )}
          <div>
            <p className="font-bold text-slate-900">{row.user?.name}</p>
            <p className="text-[11px] text-slate-500">{row.user?.email} • {row.gender || 'Male'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Dept / Batch',
      accessor: 'department',
      render: (row) => (
        <div>
          <Badge variant="primary">{row.department}</Badge>
          <p className="text-[10px] text-slate-500 mt-1 font-semibold">Batch: {row.batch || '2026'}</p>
        </div>
      )
    },
    {
      header: 'Year / Sec',
      accessor: 'year',
      render: (row) => <span className="text-xs text-slate-600 font-semibold">{row.year} - Sec {row.section || 'A'}</span>
    },
    {
      header: '10th %',
      accessor: 'tenthPercentage',
      render: (row) => (
        <span className={`font-mono text-xs font-bold whitespace-nowrap ${row.tenthPercentage >= 60 ? 'text-emerald-700' : 'text-slate-700'}`}>
          {row.tenthPercentage !== null && row.tenthPercentage !== undefined ? `${row.tenthPercentage}%` : '—'}
        </span>
      )
    },
    {
      header: '12th / Diploma %',
      accessor: 'twelfthPercentage',
      render: (row) => {
        const val = row.twelfthPercentage !== null && row.twelfthPercentage !== undefined
          ? `${row.twelfthPercentage}% (12th)`
          : (row.diplomaPercentage !== null && row.diplomaPercentage !== undefined ? `${row.diplomaPercentage}% (Dip)` : '—');
        const num = row.twelfthPercentage || row.diplomaPercentage || 0;
        return (
          <span className={`font-mono text-xs font-bold whitespace-nowrap ${num >= 60 ? 'text-emerald-700' : 'text-slate-700'}`}>
            {val}
          </span>
        );
      }
    },
    {
      header: 'Current CGPA',
      accessor: 'cgpa',
      render: (row) => (
        <span className={`font-mono text-xs font-bold whitespace-nowrap inline-flex items-center px-2 py-0.5 rounded-lg border ${row.cgpa >= 7.0 ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-slate-800 bg-slate-50 border-slate-200'}`}>
          {row.cgpa ? `${row.cgpa} / 10` : '—'}
        </span>
      )
    },
    {
      header: 'Backlogs & Gap',
      accessor: 'hasBacklogs',
      render: (row) => (
        <div className="space-y-1 whitespace-nowrap">
          <div>
            {row.hasBacklogs === 'No' ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                0 Backlogs
              </span>
            ) : (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block">
                {row.hasBacklogs}
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Gap: {row.educationGap || 'No'}
          </div>
        </div>
      )
    },
    {
      header: 'Identity Details',
      accessor: 'hometown',
      render: (row) => (
        <div className="text-[11px] text-slate-600">
          <p className="font-medium truncate max-w-[140px]" title={row.hometown}>{row.hometown || '—'}</p>
          {row.aadhaarNumber && <p className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Aadhaar: {row.aadhaarNumber}</p>}
        </div>
      )
    },
    {
      header: 'Profile %',
      accessor: 'profileCompletionPercentage',
      render: (row) => (
        <span className={`font-bold text-xs whitespace-nowrap ${row.profileCompletionPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
          {row.profileCompletionPercentage}%
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Module Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registration Module</span>
            <span className="text-slate-300">•</span>
            <Badge variant="primary" className="text-[11px]">Export & Placement Sub-Module</Badge>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            Student Profile Data Export & Eligibility Filter
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Apply Department, Batch, 10th & 12th percentage (≥ 60%), CGPA, and Backlog criteria to download formatted Excel spreadsheets.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/students"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Open Student Directory</span>
          </Link>
          <button
            type="button"
            onClick={() => handleDownload('xlsx')}
            disabled={downloading !== null}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition hover:scale-[1.02] cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{downloading === 'xlsx' ? 'Generating Excel...' : 'Download Excel (.xlsx)'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleDownload('csv')}
            disabled={downloading !== null}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'csv' ? 'Preparing CSV...' : 'CSV'}</span>
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium flex items-center justify-between">
          <span>❌ {downloadError}</span>
          <button type="button" onClick={() => setDownloadError('')} className="text-rose-600 hover:text-rose-900 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Sub-Module Tab Links */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <Link
          to="/admin/students"
          className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          <span>Student Directory</span>
        </Link>
        <div
          className="px-4 py-2.5 text-xs font-bold text-blue-600 border-b-2 border-blue-600 flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Profile Data Export & Filters</span>
        </div>
      </div>

      {/* Filter Configuration Card */}
      <Card
        title="Placement & Academic Filter Criteria"
        subtitle="Configure criteria to instantly filter student master records and download structured Excel data"
      >
        <div className="space-y-4 pt-2">
          {/* Quick Filter Presets */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Quick Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('above60')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                filters.minTenth === '60' && filters.minTwelfth === '60' && filters.backlogStatus === 'No'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>10th & 12th ≥ 60% (Clear Backlogs)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('above70')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                filters.minTenth === '70' && filters.minTwelfth === '70' && filters.minCgpa === '7.0'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Distinction (≥ 70% + 7.0 CGPA)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('clear')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                filters.backlogStatus === 'No' && !filters.minTenth
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>0 Active Backlogs Only</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('reset')}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Department */}
            <Select
              label="Academic Department"
              options={departments}
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            />

            {/* Batch */}
            <Select
              label="Graduation Batch"
              options={batches.map(b => b === 'All' ? 'All' : b)}
              value={filters.batch}
              onChange={(e) => handleFilterChange('batch', e.target.value)}
            />

            {/* 10th Marks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">10th Minimum Score (%)</label>
              <select
                value={filters.minTenth}
                onChange={(e) => handleFilterChange('minTenth', e.target.value)}
                className={`w-full bg-white border text-sm rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  filters.minTenth ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold' : 'border-slate-300 text-slate-900'
                }`}
              >
                {tenthOptions.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 12th / Diploma Marks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">12th / Diploma Minimum Score (%)</label>
              <select
                value={filters.minTwelfth}
                onChange={(e) => handleFilterChange('minTwelfth', e.target.value)}
                className={`w-full bg-white border text-sm rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  filters.minTwelfth ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold' : 'border-slate-300 text-slate-900'
                }`}
              >
                {twelfthOptions.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* CGPA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Degree Minimum CGPA</label>
              <select
                value={filters.minCgpa}
                onChange={(e) => handleFilterChange('minCgpa', e.target.value)}
                className={`w-full bg-white border text-sm rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  filters.minCgpa ? 'border-purple-500 bg-purple-50/40 text-purple-900 font-bold' : 'border-slate-300 text-slate-900'
                }`}
              >
                {cgpaOptions.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Backlogs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Backlog Criteria</label>
              <select
                value={filters.backlogStatus}
                onChange={(e) => handleFilterChange('backlogStatus', e.target.value)}
                className={`w-full bg-white border text-sm rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  filters.backlogStatus === 'No' ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold' : 'border-slate-300 text-slate-900'
                }`}
              >
                {backlogOptions.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Gap */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Education Gap Criteria</label>
              <select
                value={filters.gapStatus}
                onChange={(e) => handleFilterChange('gapStatus', e.target.value)}
                className={`w-full bg-white border text-sm rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  filters.gapStatus === 'No' ? 'border-amber-500 bg-amber-50/40 text-amber-900 font-bold' : 'border-slate-300 text-slate-900'
                }`}
              >
                {gapOptions.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <Select
              label="Academic Year"
              options={years}
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Summary KPI Cards for Matching Dataset */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Eligible Students</p>
            <p className="text-xl font-black text-slate-900">{totalMatched}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Avg 10th Score</p>
            <p className="text-xl font-black text-emerald-700">{avg10th}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Avg 12th/Dip</p>
            <p className="text-xl font-black text-indigo-700">{avg12th}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Avg Degree CGPA</p>
            <p className="text-xl font-black text-purple-700">{avgCgpa}</p>
          </div>
        </div>
      </div>

      {/* Filtered Data Preview Table Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Filtered Student Profile Dataset Preview</span>
              <Badge variant="success">{totalMatched} Records Found</Badge>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live preview of students matching the applied batch, department, and academic score criteria.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Search in filtered results..."
              icon={Search}
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading filtered dataset..." />
        ) : (
          <DataTable
            columns={columns}
            data={filteredStudents}
            emptyMessage="No students match the current criteria. Try adjusting the score thresholds or department filters."
          />
        )}
      </div>
    </div>
  );
};

export default StudentExportPage;
