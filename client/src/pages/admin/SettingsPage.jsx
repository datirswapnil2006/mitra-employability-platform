import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { 
  Settings, 
  Globe, 
  UserCheck, 
  Shield, 
  Sparkles, 
  FileCheck, 
  BookOpen, 
  Mail, 
  Lock, 
  Server, 
  History, 
  Save, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  HelpCircle,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

// Subcomponents for the 10 categories
import PlatformSettingsTab from '../../components/settings/PlatformSettingsTab';
import ProfileGatingTab from '../../components/settings/ProfileGatingTab';
import RolesPermissionsTab from '../../components/settings/RolesPermissionsTab';
import AiConfigTab from '../../components/settings/AiConfigTab';
import AssessmentSettingsTab from '../../components/settings/AssessmentSettingsTab';
import TrainingSettingsTab from '../../components/settings/TrainingSettingsTab';
import CommunicationSettingsTab from '../../components/settings/CommunicationSettingsTab';
import SecuritySettingsTab from '../../components/settings/SecuritySettingsTab';
import SystemSettingsTab from '../../components/settings/SystemSettingsTab';
import AuditLogsTab from '../../components/settings/AuditLogsTab';

export const SettingsPage = () => {
  const { user } = useAuth();

  // Active Category Selection
  const [activeTab, setActiveTab] = useState('platform');

  // Master Settings State from Database
  const [initialSettings, setInitialSettings] = useState(null);
  const [currentSettings, setCurrentSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notifications & Modals
  const [toast, setToast] = useState(null);
  const [gatingConfirmModal, setGatingConfirmModal] = useState(false);

  const categories = [
    {
      id: 'platform',
      label: '1. Platform',
      icon: Globe,
      description: 'Academic year, departments & registration access'
    },
    {
      id: 'profileGating',
      label: '2. User & Profile',
      icon: UserCheck,
      description: 'Profile gating fields required before training'
    },
    {
      id: 'roles',
      label: '3. Roles & Permissions',
      icon: Shield,
      description: 'Human-readable role access and permission matrix'
    },
    {
      id: 'aiConfig',
      label: '4. AI Configuration',
      icon: Sparkles,
      description: 'Google Gemini model, API key & quota controls'
    },
    {
      id: 'assessment',
      label: '5. Assessment',
      icon: FileCheck,
      description: 'Exam parameters, retake rules & proctoring surveillance'
    },
    {
      id: 'training',
      label: '6. Training',
      icon: BookOpen,
      description: 'Progression rules, XP rewards & streak economy'
    },
    {
      id: 'communication',
      label: '7. Communication',
      icon: Mail,
      description: 'Automated email alerts & placement bulletins'
    },
    {
      id: 'security',
      label: '8. Security',
      icon: Lock,
      description: 'Session timeout, lockout rules & multi-device sessions'
    },
    {
      id: 'system',
      label: '9. System',
      icon: Server,
      description: 'Maintenance mode, database status & cache flush'
    },
    {
      id: 'audit',
      label: '10. Audit Logs',
      icon: History,
      description: 'Chronological timeline of settings updates'
    }
  ];

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success && res.settings) {
        setInitialSettings(JSON.parse(JSON.stringify(res.settings)));
        setCurrentSettings(JSON.parse(JSON.stringify(res.settings)));
      }
    } catch (err) {
      showToast('error', 'Error Loading Settings', err.message || 'Could not fetch platform settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Detect unsaved changes in current active tab
  const hasChangesInTab = () => {
    if (!initialSettings || !currentSettings) return false;
    if (activeTab === 'roles' || activeTab === 'audit') return false; // Handled directly in tabs

    if (activeTab === 'assessment') {
      const aDiff = JSON.stringify(initialSettings.assessment) !== JSON.stringify(currentSettings.assessment);
      const pDiff = JSON.stringify(initialSettings.proctoring) !== JSON.stringify(currentSettings.proctoring);
      return aDiff || pDiff;
    }

    return JSON.stringify(initialSettings[activeTab]) !== JSON.stringify(currentSettings[activeTab]);
  };

  const handleDiscardChanges = () => {
    if (!initialSettings) return;
    setCurrentSettings(JSON.parse(JSON.stringify(initialSettings)));
    showToast('info', 'Changes Reverted', 'Unsaved changes discarded.');
  };

  const handleSaveClick = () => {
    if (activeTab === 'profileGating') {
      setGatingConfirmModal(true);
    } else {
      executeSave(activeTab);
    }
  };

  const executeSave = async (tabKey) => {
    try {
      setSaving(true);
      if (tabKey === 'assessment') {
        await api.updateSettingsCategory('assessment', currentSettings.assessment);
        await api.updateSettingsCategory('proctoring', currentSettings.proctoring);
      } else {
        await api.updateSettingsCategory(tabKey, currentSettings[tabKey]);
      }

      showToast('success', 'Settings Saved', 'Configuration updated successfully in database.');
      setGatingConfirmModal(false);
      await fetchSettings();
    } catch (err) {
      showToast('error', 'Save Failed', err.message || 'Could not save configuration changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetCategory = async (categoryKey) => {
    try {
      const res = await api.resetSettingsCategory(categoryKey);
      if (res.success) {
        showToast('success', 'Category Reset', `Default configuration restored for '${categoryKey}'.`);
        await fetchSettings();
      }
    } catch (err) {
      showToast('error', 'Reset Failed', err.message || 'Error resetting category.');
    }
  };

  const isDirty = hasChangesInTab();
  const currentCategoryMeta = categories.find(c => c.id === activeTab) || categories[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border shadow-xl flex items-center gap-3 animate-fade-in ${
          toast.type === 'success'
            ? 'bg-emerald-900/95 border-emerald-700 text-white'
            : toast.type === 'error'
            ? 'bg-rose-900/95 border-rose-700 text-white'
            : 'bg-slate-900/95 border-slate-700 text-white'
        }`}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="text-xs">
            <span className="font-black block">{toast.title}</span>
            <span className="opacity-90">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Centralized Admin Settings Center
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage business policies, profile gating, Gemini AI, proctoring, and roles without modifying code
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" className="text-xs px-3 py-1">
            MITRA College Edition
          </Badge>
          <Badge variant="neutral" className="text-xs px-3 py-1">
            Admin Governance
          </Badge>
        </div>
      </div>

      {/* Main Two-Column Layout: Left Category Rail & Right Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Category Rail */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-3 shadow-xs space-y-1">
          <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
            Settings Categories
          </div>

          <div className="space-y-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (isDirty) {
                      if (window.confirm('You have unsaved changes in this category. Discard them and switch tabs?')) {
                        handleDiscardChanges();
                        setActiveTab(cat.id);
                      }
                    } else {
                      setActiveTab(cat.id);
                    }
                  }}
                  className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition ${isActive ? 'text-blue-200 translate-x-0.5' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 px-3 py-2">
            <span className="text-[10px] text-slate-400 block font-medium">
              Administrator: <strong>{user?.name || 'Authorized Admin'}</strong>
            </span>
            <span className="text-[10px] text-slate-400 font-mono block truncate">
              {user?.email || 'admin@mitra.edu'}
            </span>
          </div>
        </div>

        {/* Right Active Configuration Panel */}
        <div className="lg:col-span-9 space-y-6">
          {/* Active Tab Header & Save Banner */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                Active Settings Category
              </span>
              <h2 className="text-lg font-black text-slate-900">
                {currentCategoryMeta.label}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentCategoryMeta.description}
              </p>
            </div>

            {/* Save & Discard Buttons for Current Category */}
            {activeTab !== 'roles' && activeTab !== 'audit' && (
              <div className="flex items-center gap-2 shrink-0">
                {isDirty && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={RotateCcw}
                    onClick={handleDiscardChanges}
                    className="text-slate-600"
                  >
                    Discard
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  icon={Save}
                  loading={saving}
                  disabled={!isDirty}
                  onClick={handleSaveClick}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {loading || !currentSettings ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold">Loading centralized settings configuration...</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Category 1: Platform */}
              {activeTab === 'platform' && (
                <PlatformSettingsTab
                  data={currentSettings.platform}
                  onChange={(updated) => setCurrentSettings({ ...currentSettings, platform: updated })}
                />
              )}

              {/* Category 2: User & Profile (Profile Gating) */}
              {activeTab === 'profileGating' && (
                <ProfileGatingTab
                  data={currentSettings.profileGating}
                  onChange={(updated) => setCurrentSettings({ ...currentSettings, profileGating: updated })}
                />
              )}

              {/* Category 3: Roles & Permissions */}
              {activeTab === 'roles' && (
                <RolesPermissionsTab onToast={showToast} />
              )}

              {/* Category 4: AI Configuration */}
              {activeTab === 'aiConfig' && (
                <AiConfigTab
                  data={currentSettings.aiConfig}
                  onChange={(updated) => setCurrentSettings({ ...currentSettings, aiConfig: updated })}
                  onToast={showToast}
                />
              )}

              {/* Category 5: Assessment & Proctoring */}
              {activeTab === 'assessment' && (
                <AssessmentSettingsTab
                  assessmentData={currentSettings.assessment}
                  proctoringData={currentSettings.proctoring}
                  onAssessmentChange={(updated) => setCurrentSettings({ ...currentSettings, assessment: updated })}
                  onProctoringChange={(updated) => setCurrentSettings({ ...currentSettings, proctoring: updated })}
                />
              )}

              {/* Category 6: Training */}
              {activeTab === 'training' && (
                <TrainingSettingsTab
                  data={currentSettings.training}
                  onChange={(updated) => setCurrentSettings({ ...currentSettings, training: updated })}
                />
              )}

              {/* Category 7: Communication */}
              {activeTab === 'communication' && (
                <CommunicationSettingsTab
                  data={currentSettings.communication}
                  onChange={(updated) => setCurrentSettings({ ...currentSettings, communication: updated })}
                />
              )}

              {/* Category 8: Security */}
              {activeTab === 'security' && (
                <SecuritySettingsTab
                  data={currentSettings.security}
                  onChange={(updated) => setCurrentSettings({ ...currentSettings, security: updated })}
                  onToast={showToast}
                />
              )}

              {/* Category 9: System */}
              {activeTab === 'system' && (
                <SystemSettingsTab
                  data={currentSettings.system}
                  onChange={(updated) => setCurrentSettings({ ...currentSettings, system: updated })}
                  onToast={showToast}
                  onResetCategory={handleResetCategory}
                />
              )}

              {/* Category 10: Audit Logs */}
              {activeTab === 'audit' && (
                <AuditLogsTab />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Profile Gating Access Changes */}
      <Modal
        isOpen={gatingConfirmModal}
        onClose={() => setGatingConfirmModal(false)}
        title="Confirm Profile Gating Policy Changes"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGatingConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              onClick={() => executeSave('profileGating')}
            >
              Confirm & Save Gating Rules
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <p className="font-bold">Important Access Impact Warning</p>
              <p className="mt-1">
                You are modifying the mandatory profile fields required before students can access <strong>Training Modules</strong> and <strong>Assessments</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">
              Active Mandatory Fields ({currentSettings?.profileGating?.requiredFields?.length || 0} fields selected):
            </span>
            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {(currentSettings?.profileGating?.requiredFields || []).map((f) => (
                <span key={f} className="px-2 py-0.5 bg-blue-100/70 text-blue-800 font-mono rounded text-[10px] font-bold">
                  {f}
                </span>
              ))}
            </div>
            <p className="text-slate-500 text-[11px] mt-1">
              Students who have not yet completed these fields will be gated until they fill in their profile.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
