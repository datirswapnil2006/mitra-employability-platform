import React from 'react';
import Card from '../Card';
import Badge from '../Badge';
import { 
  Check, 
  AlertTriangle, 
  Lock, 
  FileCheck2, 
  Hash, 
  Users, 
  Layers, 
  Building, 
  Calendar, 
  Phone, 
  CreditCard, 
  MapPin, 
  Clock, 
  AlertCircle, 
  FileText, 
  Globe, 
  Link as LinkIcon,
  ShieldAlert
} from 'lucide-react';

export const ProfileGatingTab = ({ data = {}, onChange }) => {
  const requiredFields = data.requiredFields || [
    'erpNumber',
    'gender',
    'section',
    'department',
    'year',
    'phone',
    'aadhaarNumber',
    'hometown',
    'educationGap',
    'hasBacklogs',
    'resumeUrl'
  ];

  const candidateFields = [
    { 
      key: 'erpNumber', 
      label: 'ERP / Permanent Roll Number', 
      description: 'Institutional identification key assigned by college registrar',
      icon: Hash,
      recommended: true 
    },
    { 
      key: 'gender', 
      label: 'Gender Identity', 
      description: 'Diversity reporting and gender-specific placement metrics',
      icon: Users,
      recommended: true 
    },
    { 
      key: 'section', 
      label: 'Section / Division Code', 
      description: 'Batch section (e.g. A, B, C) for lab and classroom cohorting',
      icon: Layers,
      recommended: true 
    },
    { 
      key: 'department', 
      label: 'Academic Department', 
      description: 'Core branch discipline (e.g. CSE, IT, ECE, Mechanical)',
      icon: Building,
      recommended: true 
    },
    { 
      key: 'year', 
      label: 'Academic Year of Study', 
      description: 'Current standing: First, Second, Third, or Final Year',
      icon: Calendar,
      recommended: true 
    },
    { 
      key: 'phone', 
      label: 'Primary Phone Number', 
      description: '10-digit mobile contact for interview call & SMS coordination',
      icon: Phone,
      recommended: true 
    },
    { 
      key: 'aadhaarNumber', 
      label: 'Government Aadhaar ID', 
      description: '12-digit national ID used for corporate background verification',
      icon: CreditCard,
      recommended: true 
    },
    { 
      key: 'hometown', 
      label: 'Hometown (City & State)', 
      description: 'Geographic origin and relocation preference mapping',
      icon: MapPin,
      recommended: true 
    },
    { 
      key: 'educationGap', 
      label: 'Education Year Gap Status', 
      description: 'Disclose breaks between 10th, 12th, or degree studies',
      icon: Clock,
      recommended: true 
    },
    { 
      key: 'hasBacklogs', 
      label: 'Active Backlogs Status', 
      description: 'Current uncleared university semester backlogs',
      icon: AlertCircle,
      recommended: true 
    },
    { 
      key: 'resumeUrl', 
      label: 'PDF Resume Document URL', 
      description: 'Active cloud PDF link for campus recruiter screening',
      icon: FileText,
      recommended: true 
    },
    { 
      key: 'githubUrl', 
      label: 'GitHub Developer Portfolio Link', 
      description: 'Repository profile showcasing code and project contributions',
      icon: Globe,
      recommended: false 
    },
    { 
      key: 'linkedinUrl', 
      label: 'LinkedIn Professional Profile Link', 
      description: 'Public professional networking profile URL',
      icon: LinkIcon,
      recommended: false 
    }
  ];

  const handleToggle = (key) => {
    let next;
    if (requiredFields.includes(key)) {
      if (requiredFields.length <= 1) return; // Prevent empty required fields
      next = requiredFields.filter(f => f !== key);
    } else {
      next = [...requiredFields, key];
    }
    onChange({ ...data, requiredFields: next });
  };

  const mandatoryCount = requiredFields.length;
  const optionalCount = candidateFields.length - mandatoryCount;

  return (
    <div className="space-y-6">
      {/* Policy Summary & Access Warning */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
              Profile Gating Engine Impact
            </h4>
            <p className="text-xs text-amber-900 mt-1 max-w-2xl">
              Students must complete <strong>100% of all Mandatory fields</strong> configured below before the portal unlocks 
              Training Modules and Assessment Tests. Making additional fields mandatory may temporarily lock out students who have not yet supplied those details.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <div className="text-center px-3 py-1.5 bg-white border border-amber-200 rounded-xl shadow-2xs">
            <span className="text-xs font-black text-blue-700 block">{mandatoryCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Mandatory</span>
          </div>
          <div className="text-center px-3 py-1.5 bg-white border border-amber-200 rounded-xl shadow-2xs">
            <span className="text-xs font-black text-slate-600 block">{optionalCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Optional</span>
          </div>
        </div>
      </div>

      {/* Field Configuration Matrix */}
      <Card
        title="Student Profile Gating Fields"
        subtitle="Click any field card to toggle its enforcement status between Mandatory and Optional"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {candidateFields.map((field) => {
            const isMandatory = requiredFields.includes(field.key);
            const Icon = field.icon;

            return (
              <div
                key={field.key}
                onClick={() => handleToggle(field.key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 shadow-xs ${
                  isMandatory
                    ? 'bg-blue-50/70 border-blue-400/80 hover:bg-blue-50'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isMandatory
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'border-slate-300 bg-slate-100 text-slate-400'
                  }`}>
                    {isMandatory ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {field.label}
                      </span>
                      {field.recommended && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded-md">
                          Core
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {field.description}
                    </p>
                  </div>
                </div>

                <Badge variant={isMandatory ? 'primary' : 'neutral'} className="shrink-0 text-[10px]">
                  {isMandatory ? 'Mandatory' : 'Optional'}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Advanced Gating Parameters */}
      <Card
        title="Verification & Lockdown Governance"
        subtitle="Control student profile editing permissions once a student is verified"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 cursor-pointer transition">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-800 block">Lock ERP After Verification</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Prevents students from altering their roll / ERP number once verified by admin
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.lockErpAfterVerification ?? true}
              onChange={(e) => onChange({ ...data, lockErpAfterVerification: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0 mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 cursor-pointer transition">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-800 block">Allow Profile Edits After 100%</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Allow students to update contact details and resume links after reaching 100%
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.allowProfileEditsAfterVerification ?? true}
              onChange={(e) => onChange({ ...data, allowProfileEditsAfterVerification: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0 mt-0.5"
            />
          </label>
        </div>
      </Card>
    </div>
  );
};

export default ProfileGatingTab;
