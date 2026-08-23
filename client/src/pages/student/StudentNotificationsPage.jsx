import React from 'react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { Bell, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StudentNotificationsPage = () => {
  const { user, profileCompletion } = useAuth();

  const notifications = [
    {
      id: 1,
      type: 'assessment',
      title: 'AI Communication Assessment Live',
      description: 'Practice interactive voice & text simulations across 6 tracks with instant AI feedback.',
      time: 'Just now',
      unread: true,
      badge: 'New Feature'
    },
    {
      id: 2,
      type: profileCompletion === 100 ? 'success' : 'warning',
      title: profileCompletion === 100 ? 'Profile 100% Complete' : `Profile at ${profileCompletion}%`,
      description: profileCompletion === 100
        ? 'Your academic and portfolio profile is verified. All assessments and training modules are unlocked.'
        : 'Please complete remaining profile sections to unlock institutional placement assessments.',
      time: '1 hour ago',
      unread: profileCompletion < 100,
      badge: profileCompletion === 100 ? 'Verified' : 'Action Needed'
    },
    {
      id: 3,
      type: 'info',
      title: 'Campus Recruitment Season 2026',
      description: 'Review updated department training modules and complete topic assessments to boost your placement readiness index.',
      time: '1 day ago',
      unread: false,
      badge: 'Announcement'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated on new assessments, module releases, and placement readiness milestones."
        breadcrumbs={[
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Notifications' }
        ]}
      />

      <div className="space-y-4">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-5 rounded-3xl border transition-all ${
              n.unread
                ? 'bg-white border-blue-200 shadow-sm'
                : 'bg-white/80 border-slate-200/80 shadow-2xs'
            } flex items-start gap-4`}
          >
            <div className={`p-3 rounded-2xl shrink-0 ${
              n.type === 'assessment' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
              n.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
              n.type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
              'bg-indigo-50 text-indigo-600 border border-indigo-100'
            }`}>
              {n.type === 'assessment' && <Sparkles className="w-5 h-5" />}
              {n.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {n.type === 'warning' && <AlertCircle className="w-5 h-5" />}
              {n.type === 'info' && <Bell className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                  {n.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {n.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">{n.time}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{n.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentNotificationsPage;
