import React, { useState } from 'react';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { Settings, ShieldCheck, Check } from 'lucide-react';

export const SettingsPage = () => {
  const [requiredFields, setRequiredFields] = useState([
    'erpNumber',
    'department',
    'year',
    'phone',
    'hometown',
    'aadhaarNumber',
    'educationGap',
    'hasBacklogs',
    'resumeUrl'
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const allPossibleFields = [
    { key: 'erpNumber', label: 'ERP Number' },
    { key: 'gender', label: 'Gender' },
    { key: 'section', label: 'Section / Division' },
    { key: 'department', label: 'Academic Department' },
    { key: 'year', label: 'Academic Year' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'aadhaarNumber', label: 'Aadhaar Card Number' },
    { key: 'hometown', label: 'Hometown (City & State)' },
    { key: 'educationGap', label: 'Education Year Gap Status' },
    { key: 'hasBacklogs', label: 'Current Backlogs Status' },
    { key: 'resumeUrl', label: 'PDF Resume URL' },
    { key: 'githubUrl', label: 'GitHub Profile Link' },
    { key: 'linkedinUrl', label: 'LinkedIn Profile Link' }
  ];

  const handleToggle = (key) => {
    if (requiredFields.includes(key)) {
      setRequiredFields(requiredFields.filter(f => f !== key));
    } else {
      setRequiredFields([...requiredFields, key]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await api.updateProfileConfig({ requiredFields });
      if (res.success) {
        setMessage('Gating rules updated successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" /> Platform & Gating Settings
        </h1>
        <p className="text-xs text-slate-600 mt-1">Configure required profile fields enforced by the Profile Gating Engine.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" /> {message}
        </div>
      )}

      <Card title="Mandatory Profile Gating Fields" subtitle="Students must complete 100% of selected fields to unlock training">
        <div className="space-y-3 py-2">
          {allPossibleFields.map((field) => {
            const isChecked = requiredFields.includes(field.key);
            return (
              <div
                key={field.key}
                onClick={() => handleToggle(field.key)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between shadow-xs ${
                  isChecked
                    ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm">{field.label}</span>
                </div>
                <Badge variant={isChecked ? 'primary' : 'neutral'}>
                  {isChecked ? 'Mandatory' : 'Optional'}
                </Badge>
              </div>
            );
          })}
        </div>

        <div className="pt-6 mt-4 border-t border-slate-100 flex justify-end">
          <Button size="lg" variant="primary" icon={ShieldCheck} loading={saving} onClick={handleSave}>
            Save Gating Configuration
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
