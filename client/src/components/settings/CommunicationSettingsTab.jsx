import React from 'react';
import Card from '../Card';
import Input from '../Input';
import { Mail, Send, Bell, Award, Shield, LifeBuoy, Sparkles } from 'lucide-react';

export const CommunicationSettingsTab = ({ data = {}, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Sender Identity */}
      <Card
        title="Email Dispatcher & Sender Identity"
        subtitle="Outgoing sender branding shown in students' inboxes for platform communications"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <Input
            label="Sender Display Name *"
            icon={Send}
            value={data.smtpSenderName || ''}
            onChange={(e) => onChange({ ...data, smtpSenderName: e.target.value })}
            placeholder="e.g. MITRA Training & Placement Cell"
            helperText="Friendly sender name displayed on emails"
          />

          <Input
            label="From Email Address *"
            type="email"
            icon={Mail}
            value={data.smtpSenderEmail || ''}
            onChange={(e) => onChange({ ...data, smtpSenderEmail: e.target.value })}
            placeholder="placements@mitra.edu"
            helperText="Address from which automated platform emails originate"
          />
        </div>
      </Card>

      {/* Automated Email Notification Triggers */}
      <Card
        title="Automated Email Notification Triggers"
        subtitle="Configure which institutional milestones send automatic notifications to students"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer transition">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-900 block flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Student Welcome Email
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Sends onboarding instructions, login credentials, and profile completion link upon account creation
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.welcomeEmailEnabled ?? true}
              onChange={(e) => onChange({ ...data, welcomeEmailEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0 mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer transition">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-900 block flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Password Reset Verification Email
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Dispatches secure 1-hour expiration reset token links for student and admin account recovery
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.passwordResetEmailEnabled ?? true}
              onChange={(e) => onChange({ ...data, passwordResetEmailEnabled: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded cursor-pointer shrink-0 mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer transition">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-900 block flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                Assessment Scorecard Email
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Delivers detailed performance scorecards and percentile rank after finishing mock tests
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.assessmentReportEmailEnabled ?? true}
              onChange={(e) => onChange({ ...data, assessmentReportEmailEnabled: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded cursor-pointer shrink-0 mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer transition">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-900 block flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                Placement Drive Bulletins
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Broadcasting eligible hiring drives and corporate visit dates to verified batch students
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.placementAlertEmailEnabled ?? true}
              onChange={(e) => onChange({ ...data, placementAlertEmailEnabled: e.target.checked })}
              className="w-4 h-4 text-amber-600 rounded cursor-pointer shrink-0 mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer transition sm:col-span-2">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-900 block flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-blue-600" />
                Support Ticket Status Updates
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Notifies students and administrators when support inquiries or ERP corrections are resolved
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.supportTicketNotifications ?? true}
              onChange={(e) => onChange({ ...data, supportTicketNotifications: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0 mt-0.5"
            />
          </label>
        </div>
      </Card>
    </div>
  );
};

export default CommunicationSettingsTab;
