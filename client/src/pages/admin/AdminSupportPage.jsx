import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import { api } from '../../services/api';
import { OFFICIAL_DEPARTMENTS } from '../../constants/departments';
import {
  LifeBuoy,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Wrench,
  HelpCircle,
  Paperclip,
  X,
  RefreshCw,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquareQuote,
  Check,
  Calendar,
  Building2,
  GraduationCap,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  User,
  ShieldCheck,
  Send,
  Zap
} from 'lucide-react';

export const AdminSupportPage = () => {
  // Statistics State
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inReview: 0,
    resolved: 0,
    suggestions: 0,
    problems: 0,
    deptBreakdown: {}
  });

  // Table & Feedback List State
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const limit = 20;

  // Filter States
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [batch, setBatch] = useState('All');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Export Section State
  const [exportDept, setExportDept] = useState('All');
  const [exportBatch, setExportBatch] = useState('All');
  const [exportCategory, setExportCategory] = useState('All');
  const [exportStatus, setExportStatus] = useState('All');
  const [exportFromDate, setExportFromDate] = useState('');
  const [exportToDate, setExportToDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showExportHub, setShowExportHub] = useState(false);

  // Selected Feedback Detail & Edit Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [editStatus, setEditStatus] = useState('New');
  const [editResponse, setEditResponse] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Department & Batch options
  const departmentOptions = ['All', ...OFFICIAL_DEPARTMENTS];
  const batchOptions = [
    'All',
    '2024-2028',
    '2023-2027',
    '2022-2026',
    '2021-2025',
    '2026',
    '2025',
    '2024',
    '2027',
    '2028'
  ];

  const categoryOptions = [
    'All',
    'Suggestion / Improvement',
    'Technical Problem',
    'Feature Request',
    'Test/Assessment Issue',
    'Other'
  ];

  const statusOptions = ['All', 'New', 'In Review', 'Resolved'];

  const quickCannedResponses = [
    'Issue investigated and resolved by the technical team.',
    'Thank you for the valuable suggestion! This has been queued for the next platform release.',
    'Assessment submission verified and attempt timer reset successfully.',
    'Under active review with the respective Department Academic Head.',
    'Please try refreshing your browser cache or re-logging into your account.'
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [page, department, batch, category, status, fromDate, toDate]);

  const fetchStats = async () => {
    try {
      const res = await api.getAdminSupportStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to fetch support stats:', err);
    }
  };

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        department,
        batch,
        category,
        status,
        search,
        fromDate,
        toDate
      };
      const res = await api.getAdminSupportFeedback(params);
      if (res.success) {
        setFeedbackList(res.feedback || []);
        setTotalCount(res.total || 0);
        setPages(res.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
      setToast({
        type: 'error',
        title: 'Error',
        message: 'Could not load support feedback.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFeedback();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('All');
    setBatch('All');
    setCategory('All');
    setStatus('All');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      search.trim() !== '' ||
      department !== 'All' ||
      batch !== 'All' ||
      category !== 'All' ||
      status !== 'All' ||
      fromDate !== '' ||
      toDate !== ''
    );
  }, [search, department, batch, category, status, fromDate, toDate]);

  const openActionModal = (item) => {
    setSelectedItem(item);
    setEditStatus(item.status || 'New');
    setEditResponse(item.adminResponse || '');
  };

  const handleSaveAction = async () => {
    if (!selectedItem) return;
    setSavingAction(true);
    try {
      const res = await api.updateAdminSupportFeedback(selectedItem._id, {
        status: editStatus,
        adminResponse: editResponse
      });
      if (res.success) {
        setToast({
          type: 'success',
          title: 'Ticket Updated',
          message: `Ticket ${selectedItem.feedbackId} is now marked as ${editStatus}.`
        });
        setSelectedItem(null);
        fetchFeedback();
        fetchStats();
      } else {
        setToast({
          type: 'error',
          title: 'Update Failed',
          message: res.message || 'Could not update feedback.'
        });
      }
    } catch (err) {
      console.error('Save action error:', err);
      setToast({
        type: 'error',
        title: 'Error',
        message: 'Server error while updating feedback.'
      });
    } finally {
      setSavingAction(false);
    }
  };

  const handleDeleteFeedback = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const res = await api.deleteAdminSupportFeedback(itemToDelete._id);
      if (res.success) {
        setToast({
          type: 'success',
          title: 'Feedback Deleted',
          message: `Ticket ${itemToDelete.feedbackId} has been removed.`
        });
        setItemToDelete(null);
        fetchFeedback();
        fetchStats();
      } else {
        setToast({
          type: 'error',
          title: 'Delete Failed',
          message: res.message || 'Could not delete feedback.'
        });
      }
    } catch (err) {
      console.error('Delete feedback error:', err);
      setToast({
        type: 'error',
        title: 'Error',
        message: 'Server error while deleting feedback.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportExcel = async (deptOverride = null) => {
    setExporting(true);
    try {
      const targetDept = deptOverride !== null ? deptOverride : exportDept;
      const params = {
        department: targetDept,
        batch: exportBatch,
        category: exportCategory,
        status: exportStatus,
        fromDate: exportFromDate,
        toDate: exportToDate
      };
      await api.downloadSupportExcel(params);
      setToast({
        type: 'success',
        title: 'Excel Generated',
        message: `Support workbook exported for ${targetDept === 'All' ? 'All Departments' : targetDept}.`
      });
    } catch (err) {
      console.error('Export error:', err);
      setToast({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Failed to generate Excel report.'
      });
    } finally {
      setExporting(false);
    }
  };

  const getCategoryMeta = (cat) => {
    switch (cat) {
      case 'Suggestion / Improvement':
        return {
          icon: Sparkles,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dot: 'bg-emerald-500'
        };
      case 'Technical Problem':
        return {
          icon: Wrench,
          bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
          dot: 'bg-rose-500'
        };
      case 'Feature Request':
        return {
          icon: HelpCircle,
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
          dot: 'bg-indigo-500'
        };
      case 'Test/Assessment Issue':
        return {
          icon: AlertCircle,
          bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
          dot: 'bg-amber-500'
        };
      default:
        return {
          icon: FileText,
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-500'
        };
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
            Resolved
          </span>
        );
      case 'In Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            In Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            New
          </span>
        );
    }
  };

  // Helper for generating student avatar initials & color
  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (dept) => {
    const map = {
      CSE: 'from-blue-600 to-indigo-600 text-white',
      EXTC: 'from-violet-600 to-purple-600 text-white',
      IT: 'from-cyan-600 to-blue-600 text-white',
      AIDS: 'from-emerald-600 to-teal-600 text-white',
      'CSE (IOT)': 'from-sky-600 to-indigo-600 text-white',
      Civil: 'from-amber-600 to-orange-600 text-white',
      Mechanical: 'from-rose-600 to-red-600 text-white',
      MCA: 'from-pink-600 to-rose-600 text-white',
      MBA: 'from-teal-600 to-emerald-600 text-white'
    };
    return map[dept] || 'from-slate-700 to-slate-900 text-white';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Header & Executive Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Support & Suggestions Management
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Audit student queries, address curriculum feedback, and export formatted Excel workbooks.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => {
              fetchFeedback();
              fetchStats();
            }}
            loading={loading}
          >
            Refresh
          </Button>

          <Button
            variant={showExportHub ? 'primary' : 'outline'}
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => setShowExportHub(!showExportHub)}
            className={showExportHub ? 'shadow-md shadow-blue-600/20' : ''}
          >
            {showExportHub ? 'Close Export Hub' : 'Excel Export Hub'}
          </Button>

          <Button
            variant="success"
            size="sm"
            icon={Download}
            loading={exporting}
            onClick={() => handleExportExcel('All')}
            className="shadow-md shadow-emerald-700/20 font-bold"
          >
            Instant Export (.xlsx)
          </Button>
        </div>
      </div>

      {/* 1. Dashboard Summary KPI Cards (Interactive Filter Triggers) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div
          onClick={() => {
            setStatus('All');
            setCategory('All');
            setPage(1);
          }}
          className={`cursor-pointer transition-all duration-200 rounded-2xl ${
            status === 'All' && category === 'All'
              ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]'
              : 'hover:scale-[1.01]'
          }`}
        >
          <StatCard
            title="Total Tickets"
            value={stats.total || 0}
            icon={LifeBuoy}
            color="indigo"
            subtitle="All student queries"
          />
        </div>

        <div
          onClick={() => {
            setStatus('New');
            setCategory('All');
            setPage(1);
          }}
          className={`cursor-pointer transition-all duration-200 rounded-2xl ${
            status === 'New'
              ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]'
              : 'hover:scale-[1.01]'
          }`}
        >
          <StatCard
            title="New"
            value={stats.new || 0}
            icon={Clock}
            color="sky"
            subtitle="Pending triage"
          />
        </div>

        <div
          onClick={() => {
            setStatus('In Review');
            setCategory('All');
            setPage(1);
          }}
          className={`cursor-pointer transition-all duration-200 rounded-2xl ${
            status === 'In Review'
              ? 'ring-2 ring-amber-500 shadow-md scale-[1.02]'
              : 'hover:scale-[1.01]'
          }`}
        >
          <StatCard
            title="In Review"
            value={stats.inReview || 0}
            icon={AlertCircle}
            color="amber"
            subtitle="Investigating"
          />
        </div>

        <div
          onClick={() => {
            setStatus('Resolved');
            setCategory('All');
            setPage(1);
          }}
          className={`cursor-pointer transition-all duration-200 rounded-2xl ${
            status === 'Resolved'
              ? 'ring-2 ring-emerald-500 shadow-md scale-[1.02]'
              : 'hover:scale-[1.01]'
          }`}
        >
          <StatCard
            title="Resolved"
            value={stats.resolved || 0}
            icon={CheckCircle2}
            color="emerald"
            subtitle="Closed tickets"
          />
        </div>

        <div
          onClick={() => {
            setCategory('Suggestion / Improvement');
            setStatus('All');
            setPage(1);
          }}
          className={`cursor-pointer transition-all duration-200 rounded-2xl ${
            category === 'Suggestion / Improvement'
              ? 'ring-2 ring-indigo-500 shadow-md scale-[1.02]'
              : 'hover:scale-[1.01]'
          }`}
        >
          <StatCard
            title="Suggestions"
            value={stats.suggestions || 0}
            icon={Sparkles}
            color="indigo"
            subtitle="Ideas & features"
          />
        </div>

        <div
          onClick={() => {
            setCategory('Technical Problem');
            setStatus('All');
            setPage(1);
          }}
          className={`cursor-pointer transition-all duration-200 rounded-2xl ${
            category === 'Technical Problem'
              ? 'ring-2 ring-rose-500 shadow-md scale-[1.02]'
              : 'hover:scale-[1.01]'
          }`}
        >
          <StatCard
            title="Problems"
            value={stats.problems || 0}
            icon={Wrench}
            color="rose"
            subtitle="Bugs & glitches"
          />
        </div>
      </div>

      {/* 2. Department-Wise & Batch-Wise Excel Export Hub (Collapsible / Dynamic) */}
      {showExportHub && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-800 space-y-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black tracking-tight text-white">
                    Department-Wise & Batch-Wise Excel Export Hub
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                    Microsoft Excel (.xlsx)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Generate filtered spreadsheets with automated summary analytics and department breakdowns.
                </p>
              </div>
            </div>

            <Button
              variant="success"
              icon={Download}
              loading={exporting}
              onClick={() => handleExportExcel()}
              className="shadow-lg shadow-emerald-900/40 font-bold shrink-0"
            >
              Generate & Download Workbook
            </Button>
          </div>

          {/* Quick Department Export Chips */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Quick Preset Department Exports
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {['All', 'CSE', 'EXTC', 'IT', 'AIDS', 'Mechanical', 'Civil'].map((deptPreset) => (
                <button
                  key={deptPreset}
                  type="button"
                  onClick={() => handleExportExcel(deptPreset)}
                  disabled={exporting}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/30 hover:border-emerald-400 text-xs font-semibold text-white border border-white/15 transition flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{deptPreset === 'All' ? 'All Departments' : deptPreset}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Export Filter Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Department
              </label>
              <select
                value={exportDept}
                onChange={(e) => setExportDept(e.target.value)}
                className="w-full bg-slate-800/95 text-white border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
              >
                {departmentOptions.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    {d === 'All' ? 'All Departments' : d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Batch
              </label>
              <select
                value={exportBatch}
                onChange={(e) => setExportBatch(e.target.value)}
                className="w-full bg-slate-800/95 text-white border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
              >
                {batchOptions.map((b) => (
                  <option key={b} value={b} className="bg-slate-900 text-white">
                    {b === 'All' ? 'All Batches' : b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Category
              </label>
              <select
                value={exportCategory}
                onChange={(e) => setExportCategory(e.target.value)}
                className="w-full bg-slate-800/95 text-white border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Status
              </label>
              <select
                value={exportStatus}
                onChange={(e) => setExportStatus(e.target.value)}
                className="w-full bg-slate-800/95 text-white border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s} className="bg-slate-900 text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                From Date
              </label>
              <input
                type="date"
                value={exportFromDate}
                onChange={(e) => setExportFromDate(e.target.value)}
                className="w-full bg-slate-800/95 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                To Date
              </label>
              <input
                type="date"
                value={exportToDate}
                onChange={(e) => setExportToDate(e.target.value)}
                className="w-full bg-slate-800/95 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Export File Pattern Notice */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-300">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-slate-400 shrink-0">Export Filename:</span>
              <code className="bg-slate-950 px-2.5 py-1 rounded-lg text-emerald-300 font-mono text-[11px] border border-slate-800 truncate">
                {exportDept === 'All' && exportBatch === 'All'
                  ? 'Support_Feedback_All_Departments_All_Batches.xlsx'
                  : exportDept !== 'All' && exportBatch !== 'All'
                  ? `Support_Feedback_${exportDept.replace(/\s+/g, '_')}_${exportBatch}.xlsx`
                  : exportDept !== 'All'
                  ? `Support_Feedback_${exportDept.replace(/\s+/g, '_')}_All_Batches.xlsx`
                  : `Support_Feedback_All_Departments_${exportBatch}.xlsx`}
              </code>
            </div>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Includes Summary Sheet + Filtered Rows + Department Tabs
            </span>
          </div>
        </div>
      )}

      {/* 3. Search & Interactive Filter Control Center */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
        {/* Status Pill Tabs Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
            {[
              { id: 'All', label: 'All Feedback', count: stats.total || 0, color: 'text-slate-700' },
              { id: 'New', label: 'New', count: stats.new || 0, color: 'text-blue-600' },
              { id: 'In Review', label: 'In Review', count: stats.inReview || 0, color: 'text-amber-600' },
              { id: 'Resolved', label: 'Resolved', count: stats.resolved || 0, color: 'text-emerald-600' }
            ].map((tab) => {
              const active = status === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatus(tab.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 transition shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvancedFilters ? 'Simple Search' : 'Advanced Filters'}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Feedback ID (e.g. FB-2026...), Student Name, ERP No., Subject, or Keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" size="sm" icon={Search} className="px-5">
              Search
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={handleResetFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </form>

        {/* Advanced Filters Expandable Grid */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Department
              </label>
              <Select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setPage(1);
                }}
                options={departmentOptions.map(d => ({ value: d, label: d === 'All' ? 'All Departments' : d }))}
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Batch
              </label>
              <Select
                value={batch}
                onChange={(e) => {
                  setBatch(e.target.value);
                  setPage(1);
                }}
                options={batchOptions.map(b => ({ value: b, label: b === 'All' ? 'All Batches' : b }))}
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Category
              </label>
              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                options={categoryOptions.map(c => ({ value: c, label: c }))}
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Feedback Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Student Support Submissions</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {totalCount}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing Page {page} of {pages} ({feedbackList.length} items)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 sm:px-5">Feedback ID</th>
                <th className="py-3.5 px-4">Student & Identity</th>
                <th className="py-3.5 px-4">Department & Batch</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 min-w-[220px]">Subject & Description</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <span className="text-xs font-semibold">Loading verified student feedback...</span>
                  </td>
                </tr>
              ) : feedbackList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <LifeBuoy className="w-7 h-7" />
                    </div>
                    <p className="font-extrabold text-sm text-slate-800">No Support Tickets Found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      No feedback matches your current criteria. Try resetting your search query or adjusting your filters.
                    </p>
                    {hasActiveFilters && (
                      <div className="pt-3">
                        <Button variant="outline" size="sm" icon={RefreshCw} onClick={handleResetFilters}>
                          Reset All Filters
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                feedbackList.map((item) => {
                  const catMeta = getCategoryMeta(item.category);
                  const CatIcon = catMeta.icon;

                  return (
                    <tr key={item._id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Ticket ID */}
                      <td className="py-4 px-4 sm:px-5 font-mono font-bold text-blue-700 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200/70 text-blue-800 text-[11px]">
                          {item.feedbackId}
                        </span>
                      </td>

                      {/* Student Name & ERP */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${getAvatarColor(item.department)} flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs`}>
                            {getInitials(item.studentName)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {item.studentName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              ERP: {item.erpNumber || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Batch */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 text-xs block">
                            {item.department}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 inline-block">
                            Batch {item.batch}
                          </span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${catMeta.bg}`}>
                          <CatIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[130px]">{item.category}</span>
                        </span>
                      </td>

                      {/* Subject & Description Snippet */}
                      <td className="py-4 px-4">
                        <div className="max-w-[280px]">
                          <span className="font-bold text-slate-900 text-xs block truncate" title={item.subject}>
                            {item.subject}
                          </span>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5" title={item.description}>
                            {item.description}
                          </p>
                          {item.adminResponse && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Replied
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                        <span className="font-medium">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openActionModal(item)}
                            className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 transition shadow-2xs font-bold flex items-center gap-1 text-[11px]"
                            title="View, Respond & Manage"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Manage</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition shadow-2xs"
                            title="Delete Feedback Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Footer */}
        {pages > 1 && (
          <div className="p-4 sm:px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <span className="font-semibold text-slate-500">
              Page <strong>{page}</strong> of <strong>{pages}</strong> ({totalCount} total entries)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Executive Manage & Resolve Action Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-800 font-mono text-xs font-bold border border-blue-200 shadow-2xs">
                  {selectedItem.feedbackId}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Manage Support Ticket</h3>
                  <p className="text-[11px] text-slate-500">
                    Logged on {new Date(selectedItem.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Student Metadata Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Student</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 truncate">
                    <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    {selectedItem.studentName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">ERP Number</span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                    {selectedItem.erpNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Department</span>
                  <span className="font-bold text-slate-900">{selectedItem.department}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Batch</span>
                  <span className="font-bold text-slate-900">{selectedItem.batch}</span>
                </div>
              </div>

              {/* Student Feedback Details Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedItem.category}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs font-semibold text-slate-500">
                    Subject:
                  </span>
                  <h4 className="text-sm font-black text-slate-900">
                    {selectedItem.subject}
                  </h4>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Student's Description:
                  </label>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>
              </div>

              {/* Attachment if present */}
              {selectedItem.attachment && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    Uploaded Attachment / Screenshot
                  </label>
                  {selectedItem.attachment.startsWith('data:image') ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-72 bg-slate-950 flex items-center justify-center p-2">
                      <img
                        src={selectedItem.attachment}
                        alt="Screenshot"
                        className="max-h-64 object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <a
                      href={selectedItem.attachment}
                      download={`feedback-${selectedItem.feedbackId}-attachment`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200 hover:bg-blue-100 transition shadow-2xs"
                    >
                      <Download className="w-4 h-4" /> Download Attached Document
                    </a>
                  )}
                </div>
              )}

              {/* Administrative Resolution & Action Panel */}
              <div className="p-5 bg-gradient-to-br from-blue-50/70 via-indigo-50/60 to-purple-50/40 rounded-3xl border border-blue-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-blue-950 uppercase tracking-wide">
                    <MessageSquareQuote className="w-4 h-4 text-blue-600" />
                    Admin Review & Official Response
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    Student Viewable
                  </span>
                </div>

                {/* Status Segmented Buttons */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Update Ticket Status *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'New', label: 'New', desc: 'Pending review', color: 'border-blue-300 text-blue-800' },
                      { id: 'In Review', label: 'In Review', desc: 'Under investigation', color: 'border-amber-300 text-amber-800' },
                      { id: 'Resolved', label: 'Resolved', desc: 'Issue closed', color: 'border-emerald-300 text-emerald-800' }
                    ].map((st) => {
                      const isSelected = editStatus === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setEditStatus(st.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs block">{st.label}</span>
                          <span className={`text-[10px] block opacity-80 mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            {st.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Canned / Quick Response Chips */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" /> Quick Response Templates (Click to fill)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {quickCannedResponses.map((template, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditResponse(template)}
                        className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-blue-600 hover:text-white text-slate-700 text-[10px] font-medium border border-blue-200/60 transition truncate max-w-[260px] shadow-2xs"
                        title={template}
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin Remarks Textarea */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Administrative Remarks / Action Taken
                  </label>
                  <textarea
                    rows={3}
                    value={editResponse}
                    onChange={(e) => setEditResponse(e.target.value)}
                    placeholder="Enter resolution notes, explanation, or instructions for the student..."
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition resize-none font-medium leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={savingAction}
                onClick={handleSaveAction}
                icon={CheckCircle2}
                className="shadow-md shadow-blue-600/20"
              >
                Save & Update Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Dialog */}
      {itemToDelete && (
        <ConfirmDialog
          isOpen={Boolean(itemToDelete)}
          title="Delete Support Ticket"
          message={`Are you sure you want to permanently delete ticket ${itemToDelete.feedbackId} submitted by ${itemToDelete.studentName}? This action will permanently remove this record.`}
          confirmLabel="Delete Ticket"
          confirmVariant="danger"
          loading={deleting}
          onConfirm={handleDeleteFeedback}
          onClose={() => setItemToDelete(null)}
          onCancel={() => setItemToDelete(null)}
        />
      )}
    </div>
  );
};

export default AdminSupportPage;
