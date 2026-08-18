import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import FilterTabs from '../../components/FilterTabs';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { OFFICIAL_DEPARTMENTS } from '../../constants/departments';
import { TRAINING_MODULES } from '../../constants/trainingModules';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  Building2,
  TrendingUp,
  FileCheck,
  Calendar,
  Users
} from 'lucide-react';

export const ResultsManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    total: 0,
    passRate: 0,
    avgScore: 0,
    passedCount: 0,
    failedCount: 0,
    attempts: []
  });

  const [activeModule, setActiveModule] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const moduleTabs = [
    { id: 'All', label: 'All Modules' },
    ...TRAINING_MODULES.map((m) => ({ id: m.id, label: m.label })),
    { id: 'Full', label: 'Full Assessment' }
  ];

  useEffect(() => {
    fetchResults();
  }, [activeModule, departmentFilter, statusFilter]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeModule !== 'All') params.module = activeModule;
      if (departmentFilter !== 'All') params.department = departmentFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getAllAttemptsAdmin(params);
      if (res.success) {
        setData({
          total: res.total || 0,
          passRate: res.passRate || 0,
          avgScore: res.avgScore || 0,
          passedCount: res.passedCount || 0,
          failedCount: res.failedCount || 0,
          attempts: res.attempts || []
        });
      }
    } catch (err) {
      console.error('Error fetching admin results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResults();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor((seconds || 0) / 60);
    const secs = (seconds || 0) % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment Results & Evaluations"
        subtitle="Track candidate exam attempts, review score distributions, and inspect detailed response audits."
        breadcrumbs={[
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Results' }
        ]}
      />

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Attempts</span>
            <span className="text-2xl font-black text-slate-900">{data.total}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Pass Rate</span>
            <span className="text-2xl font-black text-emerald-600">{data.passRate}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Average Score</span>
            <span className="text-2xl font-black text-indigo-700">{data.avgScore}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Passed / Failed</span>
            <span className="text-lg font-black text-slate-900">
              <span className="text-emerald-600">{data.passedCount}</span> /{' '}
              <span className="text-rose-600">{data.failedCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Module Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <FilterTabs
          tabs={moduleTabs}
          activeTab={activeModule}
          onTabChange={setActiveModule}
        />
      </div>

      {/* Filters Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-44">
            <Select
              options={['All', ...OFFICIAL_DEPARTMENTS]}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            />
          </div>
          <div className="w-36">
            <Select
              options={['All', 'PASSED', 'FAILED']}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full sm:w-72 flex gap-2">
          <Input
            placeholder="Search candidate, ERP, test..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs flex-1"
          />
          <Button type="submit" size="sm" variant="outline" icon={Search} />
        </form>
      </div>

      {/* Results Table */}
      {loading ? (
        <LoadingState message="Loading candidate results and performance metrics..." />
      ) : data.attempts.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Department & Year</th>
                  <th className="py-3.5 px-4">Assessment Evaluation</th>
                  <th className="py-3.5 px-4 text-center">Score</th>
                  <th className="py-3.5 px-4 text-center">Percentage</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Time & Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data.attempts.map((att) => {
                  const student = att.user || {};
                  const test = att.assessmentId || {};
                  const isPassed = att.status === 'PASSED';
                  return (
                    <tr key={att._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{student.name || 'Candidate'}</div>
                        <div className="text-[11px] text-slate-400">
                          {student.erpNumber || student.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 text-[10px]">
                          {student.department || 'N/A'}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1.5">{student.year || 'FE'}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">{test.title || 'Assessment'}</div>
                        <div className="text-[11px] text-slate-400">
                          {test.module || 'Aptitude'} • {test.category || 'General'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {att.score} / {att.totalMarks}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-slate-900">
                        {att.percentage}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[10px] tracking-wider uppercase ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        <div>{formatDate(att.attemptedAt)}</div>
                        <div className="text-[10px] text-slate-400">{formatDuration(att.timeSpentSeconds)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Eye}
                          onClick={() => setSelectedAttempt(att)}
                        >
                          Audit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Candidate Results Found"
          description="No student assessment attempts have been recorded matching your active filter criteria."
        />
      )}

      {/* Attempt Audit Modal */}
      {selectedAttempt && (
        <Modal
          isOpen={Boolean(selectedAttempt)}
          onClose={() => setSelectedAttempt(null)}
          title="Candidate Examination Response Audit"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-300">
                  {selectedAttempt.user?.department} • {selectedAttempt.user?.year} • ERP: {selectedAttempt.user?.erpNumber || 'N/A'}
                </span>
                <h4 className="text-lg font-black text-white">{selectedAttempt.user?.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{selectedAttempt.assessmentId?.title}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-0.5 rounded-full font-black text-xs uppercase mb-1 ${
                    selectedAttempt.status === 'PASSED'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {selectedAttempt.status}
                </span>
                <div className="text-xl font-black text-white">
                  {selectedAttempt.score} / {selectedAttempt.totalMarks} ({selectedAttempt.percentage}%)
                </div>
              </div>
            </div>

            {/* Questions breakdown */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              {selectedAttempt.answers?.map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    ans.isCorrect
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">Question {idx + 1}</span>
                    <span
                      className={`font-bold text-[11px] ${
                        ans.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {ans.isCorrect ? `✓ Correct (+${ans.marksAwarded})` : '✗ Incorrect (0)'}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800 leading-relaxed">{ans.questionText}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200/80 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Candidate Submission:</span>
                      <span className={ans.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {ans.studentAnswer || '(No response)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Correct Reference:</span>
                      <span className="text-emerald-700 font-bold">{ans.correctAnswer}</span>
                    </div>
                  </div>

                  {ans.explanation && (
                    <p className="text-[11px] text-slate-600 bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/60 leading-relaxed">
                      <strong className="text-blue-900">Explanation: </strong>
                      {ans.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ResultsManagementPage;
