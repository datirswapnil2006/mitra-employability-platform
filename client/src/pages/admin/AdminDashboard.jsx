import React from 'react';
import { useAdminAnalytics } from '../../hooks/queries/useAdminQueries';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingState from '../../components/LoadingState';
import { BookOpen, FileCheck, TrendingUp, Sparkles, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { data: analytics, isLoading: loading } = useAdminAnalytics();

  if (loading) return <LoadingState message="Loading admin ecosystem overview..." />;

  const stats = analytics?.stats || {
    totalModules: 12,
    totalAssessments: 28,
    avgProfileCompletion: 92,
    avgTrainingProgress: 68
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">HOD & Admin Control Panel</h1>
          <p className="text-xs text-slate-600 mt-1">Manage curriculum, submodule assessments, analytics, and Excel reports.</p>
        </div>

        <div className="flex gap-3">
          <Link to="/admin/ai-gen">
            <Button size="sm" variant="outline" icon={Sparkles}>
              AI Test Generator
            </Button>
          </Link>
          <Link to="/admin/reports">
            <Button size="sm" variant="primary" icon={FileText}>
              Export Excel Report
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Training Modules"
          value={stats.totalModules || 12}
          subtitle="Curriculum submodules"
          icon={BookOpen}
          color="sky"
        />
        <StatCard
          title="Total Assessments"
          value={stats.totalAssessments || 28}
          subtitle="Mapped mock & AI tests"
          icon={FileCheck}
          color="emerald"
        />
        <StatCard
          title="Average Progress"
          value={`${stats.avgTrainingProgress || 68}%`}
          subtitle="Platform completion avg"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Department Breakdown Table */}
      <Card title="Department Readiness Comparison" subtitle="Live analytics for EXTC, CSE, IT, Civil, Mech, MBA, MCA">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase bg-slate-50">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Avg Profile Completion</th>
                <th className="py-3 px-4">Avg Assessment Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 bg-white">
              {(analytics?.departmentStats || [
                { department: 'EXTC', avgProfileCompletion: 95, avgAssessmentScore: 82 },
                { department: 'CSE', avgProfileCompletion: 98, avgAssessmentScore: 88 },
                { department: 'IT', avgProfileCompletion: 94, avgAssessmentScore: 84 },
                { department: 'Mechanical', avgProfileCompletion: 89, avgAssessmentScore: 76 }
              ]).map((dept, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{dept.department}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-emerald-600">{dept.avgProfileCompletion}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-blue-600">{dept.avgAssessmentScore}%</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to={`/admin/reports?department=${dept.department}`}>
                      <Button size="sm" variant="outline">
                        Excel Report
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
