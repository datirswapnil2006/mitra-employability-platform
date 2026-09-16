import React, { useState } from 'react';
import Card from '../Card';
import Input from '../Input';
import Select from '../Select';
import Badge from '../Badge';
import { Globe, Plus, X, Building2, Calendar, ShieldCheck, Mail, Phone, Users } from 'lucide-react';
import { OFFICIAL_DEPARTMENTS, ACADEMIC_YEARS } from '../../constants/departments';

export const PlatformSettingsTab = ({ data = {}, onChange }) => {
  const [newDept, setNewDept] = useState('');
  const [newDomain, setNewDomain] = useState('');

  const departments = data.departments || OFFICIAL_DEPARTMENTS;
  const allowedDomains = data.allowedEmailDomains || ['mitra.edu', 'college.ac.in'];

  const handleAddDept = () => {
    if (!newDept.trim()) return;
    const trimmed = newDept.trim().toUpperCase();
    if (!departments.includes(trimmed)) {
      onChange({ ...data, departments: [...departments, trimmed] });
    }
    setNewDept('');
  };

  const handleRemoveDept = (dept) => {
    if (departments.length <= 1) return;
    onChange({ ...data, departments: departments.filter(d => d !== dept) });
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    const clean = newDomain.trim().toLowerCase().replace(/^@/, '');
    if (!allowedDomains.includes(clean)) {
      onChange({ ...data, allowedEmailDomains: [...allowedDomains, clean] });
    }
    setNewDomain('');
  };

  const handleRemoveDomain = (domain) => {
    if (allowedDomains.length <= 1) return;
    onChange({ ...data, allowedEmailDomains: allowedDomains.filter(d => d !== domain) });
  };

  return (
    <div className="space-y-6">
      {/* Platform Branding & Identity */}
      <Card
        title="Institution & Portal Identity"
        subtitle="Public display information for students and placement stakeholders"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="md:col-span-2">
            <Input
              label="Platform / Institution Name *"
              icon={Building2}
              value={data.platformName || ''}
              onChange={(e) => onChange({ ...data, platformName: e.target.value })}
              placeholder="e.g. MITRA Employability & Skill Enhancement Platform"
              helperText="Displayed in portal header, browser title, and email correspondence"
            />
          </div>
          <Input
            label="Placement Cell Support Email *"
            type="email"
            icon={Mail}
            value={data.supportEmail || ''}
            onChange={(e) => onChange({ ...data, supportEmail: e.target.value })}
            placeholder="support@mitra.edu"
            helperText="Official student support and ticket handling address"
          />
          <Input
            label="Placement Cell Contact Phone *"
            icon={Phone}
            value={data.contactPhone || ''}
            onChange={(e) => onChange({ ...data, contactPhone: e.target.value })}
            placeholder="+91 20 2765 3000"
            helperText="Helpline displayed on student support and contact pages"
          />
        </div>
      </Card>

      {/* Academic Year & Registration Mode */}
      <Card
        title="Academic Calendar & Registration Mode"
        subtitle="Configure the active academic year and student enrollment policy"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Current Active Academic Year *
            </label>
            <select
              value={data.academicYear || '2025-2026'}
              onChange={(e) => onChange({ ...data, academicYear: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="2024-2025">2024 - 2025</option>
              <option value="2025-2026">2025 - 2026 (Current Academic Session)</option>
              <option value="2026-2027">2026 - 2027</option>
              <option value="2027-2028">2027 - 2028</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Default year tag assigned to newly enrolling students</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Student Registration Approval Policy *
            </label>
            <select
              value={data.registrationApprovalMode || 'instant'}
              onChange={(e) => onChange({ ...data, registrationApprovalMode: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="instant">Instant Activation (Immediate Portal Access)</option>
              <option value="domain_restricted">Domain Restricted (College Email Required)</option>
              <option value="manual">Manual Admin Review & Approval Required</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Controls how new student registrations are approved</p>
          </div>
        </div>

        {/* Student Feature Access Toggles */}
        <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-800">Student Access Rules</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Allow New Signups</span>
                <span className="text-[10px] text-slate-500">Public student registration</span>
              </div>
              <input
                type="checkbox"
                checked={data.studentAccessRules?.allowSignups ?? true}
                onChange={(e) => onChange({
                  ...data,
                  studentAccessRules: { ...data.studentAccessRules, allowSignups: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Training Modules</span>
                <span className="text-[10px] text-slate-500">Enable practice materials</span>
              </div>
              <input
                type="checkbox"
                checked={data.studentAccessRules?.trainingEnabled ?? true}
                onChange={(e) => onChange({
                  ...data,
                  studentAccessRules: { ...data.studentAccessRules, trainingEnabled: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Assessment Tests</span>
                <span className="text-[10px] text-slate-500">Enable exams & quizzes</span>
              </div>
              <input
                type="checkbox"
                checked={data.studentAccessRules?.assessmentsEnabled ?? true}
                onChange={(e) => onChange({
                  ...data,
                  studentAccessRules: { ...data.studentAccessRules, assessmentsEnabled: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </Card>

      {/* Authorized Academic Departments */}
      <Card
        title="College Academic Departments"
        subtitle="Manage official branches recognized across training, cohorts, and placement reports"
      >
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => (
              <span
                key={dept}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold shadow-xs"
              >
                <span>{dept}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDept(dept)}
                  className="hover:text-rose-600 transition cursor-pointer"
                  title={`Remove ${dept}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm">
            <Input
              placeholder="e.g. AI-DS, ROBOTICS"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              className="py-1.5 text-xs font-mono"
            />
            <button
              type="button"
              onClick={handleAddDept}
              disabled={!newDept.trim()}
              className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition"
            >
              <Plus className="w-4 h-4" /> Add Branch
            </button>
          </div>
        </div>
      </Card>

      {/* Allowed Email Domains */}
      <Card
        title="Institutional Email Domain Whitelist"
        subtitle="Restrict institutional self-registration to verified college domains"
      >
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {allowedDomains.map((dom) => (
              <span
                key={dom}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-mono font-bold shadow-xs"
              >
                <span>@{dom}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDomain(dom)}
                  className="hover:text-rose-600 transition cursor-pointer"
                  title={`Remove @${dom}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm">
            <Input
              placeholder="e.g. college.edu.in"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="py-1.5 text-xs font-mono"
            />
            <button
              type="button"
              onClick={handleAddDomain}
              disabled={!newDomain.trim()}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition"
            >
              <Plus className="w-4 h-4" /> Add Domain
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PlatformSettingsTab;
