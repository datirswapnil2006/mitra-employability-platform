import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { Settings, Shield, User, Bell, Key, Check } from 'lucide-react';

export const StudentSettingsPage = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [assessmentReminders, setAssessmentReminders] = useState(true);
  const [aiVoiceFeedback, setAiVoiceFeedback] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & Preferences"
        subtitle="Manage your MITRA platform preferences, communication settings, and account details."
        breadcrumbs={[
          { label: 'Student', link: '/student/dashboard' },
          { label: 'Settings' }
        ]}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account Info */}
        <Card title="Account Details" subtitle="Your institutional registration information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-500 font-bold block mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={user?.name || ''}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-slate-500 font-bold block mb-1">Institutional Email</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-slate-500 font-bold block mb-1">Department</label>
              <input
                type="text"
                disabled
                value={user?.department || 'CSE'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-slate-500 font-bold block mb-1">Registration Roll No</label>
              <input
                type="text"
                disabled
                value={user?.rollNumber || 'N/A'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* Platform Preferences */}
        <Card title="Assessment & AI Preferences" subtitle="Customize your assessment experience">
          <div className="space-y-4 text-xs text-slate-700">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="font-bold text-slate-900 block">AI Voice Mode Audio Playback</span>
                <span className="text-slate-500 text-[11px]">Automatically read out AI interview prompts using speech synthesis</span>
              </div>
              <input
                type="checkbox"
                checked={aiVoiceFeedback}
                onChange={(e) => setAiVoiceFeedback(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="font-bold text-slate-900 block">Assessment Completion Alerts</span>
                <span className="text-slate-500 text-[11px]">Receive summary reports after completing mock and AI tests</span>
              </div>
              <input
                type="checkbox"
                checked={assessmentReminders}
                onChange={(e) => setAssessmentReminders(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="font-bold text-slate-900 block">Email Digest & Training Updates</span>
                <span className="text-slate-500 text-[11px]">Periodic updates on new training modules and placement readiness</span>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" /> Preferences saved successfully
            </span>
          ) : <span />}

          <Button type="submit" size="md" variant="primary">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StudentSettingsPage;
