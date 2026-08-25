import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import LoadingState from '../../components/LoadingState';
import {
  Search,
  Users,
  Download,
  FileSpreadsheet,
  GraduationCap,
  SlidersHorizontal,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { OFFICIAL_DEPARTMENTS, ACADEMIC_YEARS } from '../../constants/departments';

export const StudentManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [year, setYear] = useState('All');

  const [confirmStudent, setConfirmStudent] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const departments = ['All', ...OFFICIAL_DEPARTMENTS];
  const years = ['All', ...ACADEMIC_YEARS];

  useEffect(() => {
    fetchStudents();
  }, [department, year]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (department !== 'All') params.department = department;
      if (year !== 'All') params.year = year;
      if (search) params.search = search;

      const res = await api.getAllStudentsAdmin(params);
      if (res.success) {
        setStudents(res.students || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (!s || !s.user) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (s.user.name || '').toLowerCase();
    const email = (s.user.email || '').toLowerCase();
    const erp = (s.erpNumber || s.rollNo || '').toLowerCase();
    return name.includes(q) || email.includes(q) || erp.includes(q);
  });

  const handleExecuteResetPassword = async () => {
    if (!confirmStudent?.user?._id) return;

    setActionLoading(confirmStudent.user._id);
    setActionMsg('');
    try {
      const res = await api.adminResetStudentPassword(confirmStudent.user._id);
      if (res.success) {
        // Update local state to reflect ENABLED status immediately
        setStudents(prev =>
          prev.map(st => {
            if (st.user?._id === confirmStudent.user._id) {
              return {
                ...st,
                passwordResetStatus: 'ENABLED',
                passwordResetApprovedAt: new Date()
              };
            }
            return st;
          })
        );
        setActionMsg(res.message || `Password reset link dispatched to ${confirmStudent.user.email}`);
        setConfirmStudent(null);
        setTimeout(() => setActionMsg(''), 6000);
      } else {
        alert(res.message || 'Failed to enable password reset.');
      }
    } catch (err) {
      alert('Error communicating with reset service.');
    } finally {
      setActionLoading(null);
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
            <p className="text-[11px] text-slate-500">{row.user?.email} • {row.hometown || row.gender || 'Male'}</p>
            {row.aadhaarNumber && <p className="text-[10px] text-slate-400 font-mono">Aadhaar: {row.aadhaarNumber}</p>}
          </div>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => <Badge variant="primary">{row.department}</Badge>
    },
    {
      header: 'Year / Sec',
      accessor: 'year',
      render: (row) => <span className="text-xs text-slate-600 font-semibold">{row.year} - Sec {row.section || 'A'}</span>
    },
    {
      header: 'Academics & Status',
      accessor: 'cgpa',
      render: (row) => (
        <div className="space-y-0.5 text-[11px]">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="text-slate-400">10th:</span>
            <span className="font-bold text-slate-900">{row.tenthPercentage ? `${row.tenthPercentage}%` : '—'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">12th:</span>
            <span className="font-bold text-slate-900">{row.twelfthPercentage ? `${row.twelfthPercentage}%` : (row.diplomaPercentage ? `${row.diplomaPercentage}% (Dip)` : '—')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-700">CGPA: {row.cgpa ? row.cgpa : '—'}</span>
            {row.hasBacklogs && row.hasBacklogs !== 'No' && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{row.hasBacklogs}</span>
            )}
            {row.educationGap && row.educationGap !== 'No' && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{row.educationGap}</span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Profile %',
      accessor: 'profileCompletionPercentage',
      render: (row) => (
        <span className={`font-bold ${row.profileCompletionPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
          {row.profileCompletionPercentage}%
        </span>
      )
    },
    {
      header: 'Account Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.user?.status === 'active' ? 'success' : 'danger'}>
          {row.user?.status?.toUpperCase() || 'ACTIVE'}
        </Badge>
      )
    },
    {
      header: 'Password Reset',
      accessor: 'passwordResetStatus',
      render: (row) => {
        const status = row.passwordResetStatus || 'NO_REQUEST';
        if (status === 'PENDING') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              RESET REQUESTED
            </span>
          );
        }
        if (status === 'ENABLED') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              RESET ENABLED
            </span>
          );
        }
        if (status === 'COMPLETED') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Completed
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            No Request
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => {
        const status = row.passwordResetStatus || 'NO_REQUEST';
        const isPending = status === 'PENDING';
        const isEnabled = status === 'ENABLED';
        const isCompleted = status === 'COMPLETED';

        let buttonLabel = 'Enable Reset';
        if (actionLoading === row.user?._id) {
          buttonLabel = 'Enabling...';
        } else if (isEnabled) {
          buttonLabel = 'Reset Enabled';
        } else if (isCompleted) {
          buttonLabel = 'Completed';
        }

        return (
          <button
            type="button"
            onClick={() => isPending && setConfirmStudent(row)}
            disabled={!isPending || actionLoading === row.user?._id}
            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition border ${
              isPending
                ? 'text-white bg-indigo-600 hover:bg-indigo-700 border-indigo-600 shadow-xs cursor-pointer active:scale-95'
                : 'text-slate-400 bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
            }`}
            title={
              isPending
                ? 'Authorize password reset and dispatch a secure reset link to this student'
                : isEnabled
                ? 'Password reset is enabled and link has been sent to the student'
                : isCompleted
                ? 'Password reset already completed by the student'
                : 'Enable Reset — Disabled (No request submitted)'
            }
          >
            {buttonLabel}
          </button>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registration Module</span>
            <span className="text-slate-300">•</span>
            <Badge variant="primary" className="text-[11px]">Directory Sub-Module</Badge>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Student Directory & Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Inspect student registration records, academic performance scores, and manage account access.
          </p>
        </div>

        {/* Action Button to Open Export Sub-Module */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/students/export"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition hover:scale-[1.02]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Profile Data Export Sub-Module →</span>
          </Link>
        </div>
      </div>

      {/* Sub-Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <div className="px-4 py-2.5 text-xs font-bold text-blue-600 border-b-2 border-blue-600 flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>Student Directory</span>
        </div>
        <Link
          to="/admin/students/export"
          className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Profile Data Export & Filters</span>
        </Link>
      </div>

      {actionMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
          <span>✅</span>
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Directory Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search student name, email, ERP number..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          label="Filter Department"
          options={departments}
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
        <Select
          label="Filter Academic Year"
          options={years}
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
      </div>

      {/* Directory Table */}
      {loading ? (
        <LoadingState message="Fetching student directory..." />
      ) : (
        <DataTable
          columns={columns}
          data={filteredStudents}
          emptyMessage="No student accounts match your filter criteria."
        />
      )}

      {/* Admin Reset Password Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmStudent)}
        onClose={() => setConfirmStudent(null)}
        title="Enable Password Reset"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Password Reset Request Pending</p>
              <p className="mt-1 leading-relaxed text-[11px]">
                This student has requested a password reset. Enable password reset for this student?
              </p>
            </div>
          </div>

          {confirmStudent && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Student Name:</span>
                <span className="font-bold text-slate-900">{confirmStudent.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Registered Email:</span>
                <span className="font-mono font-bold text-slate-800">{confirmStudent.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">ERP / Roll Number:</span>
                <span className="font-mono text-slate-700">{confirmStudent.erpNumber || confirmStudent.rollNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-semibold text-slate-700">{confirmStudent.department}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmStudent(null)}
              disabled={Boolean(actionLoading)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={Boolean(actionLoading)}
              onClick={handleExecuteResetPassword}
              icon={KeyRound}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Enable Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentManagementPage;
