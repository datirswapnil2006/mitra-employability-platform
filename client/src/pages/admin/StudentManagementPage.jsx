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
  Search,
  Users,
  Download,
  FileSpreadsheet,
  GraduationCap,
  SlidersHorizontal,
  KeyRound,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { OFFICIAL_DEPARTMENTS, ACADEMIC_YEARS } from '../../constants/departments';

export const StudentManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [year, setYear] = useState('All');

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

  const [actionLoading, setActionLoading] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const handleAdminResetPassword = async (student) => {
    if (!student.user?._id) return;
    const confirm = window.confirm(`Generate and dispatch a new password to ${student.user.name} (${student.user.email})?`);
    if (!confirm) return;

    setActionLoading(student.user._id);
    setActionMsg('');
    try {
      const res = await api.adminResetStudentPassword(student.user._id);
      if (res.success) {
        setActionMsg(res.message || `New password dispatched to ${student.user.email}`);
        setTimeout(() => setActionMsg(''), 6000);
      } else {
        alert(res.message || 'Failed to reset password.');
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
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleAdminResetPassword(row)}
          disabled={actionLoading === row.user?._id}
          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition disabled:opacity-50"
          title="Dispatch new password to student email"
        >
          {actionLoading === row.user?._id ? 'Sending...' : 'Reset Password'}
        </button>
      )
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
    </div>
  );
};

export default StudentManagementPage;
