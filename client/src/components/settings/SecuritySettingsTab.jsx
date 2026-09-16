import React from 'react';
import Card from '../Card';
import Input from '../Input';
import Button from '../Button';
import { Shield, Lock, Key, Clock, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SecuritySettingsTab = ({ data = {}, onChange, onToast }) => {
  const { logoutAll } = useAuth();

  const handleLogoutAllDevices = async () => {
    try {
      if (logoutAll) {
        await logoutAll();
      }
      if (onToast) {
        onToast('success', 'Sessions Terminated', 'All active sessions across all devices have been logged out.');
      }
    } catch (err) {
      if (onToast) {
        onToast('error', 'Action Failed', err.message || 'Error terminating sessions.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Governance & Lockout Controls */}
      <Card
        title="Session Timeout & Account Lockout Controls"
        subtitle="Manage login thresholds to protect administrative accounts and student confidentiality"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          <Input
            label="Inactivity Session Timeout (Minutes) *"
            type="number"
            min="15"
            max="720"
            icon={Clock}
            value={data.sessionTimeoutMinutes ?? 60}
            onChange={(e) => onChange({ ...data, sessionTimeoutMinutes: parseInt(e.target.value, 10) || 60 })}
            helperText="Auto-logout after period of user inactivity"
          />

          <Input
            label="Max Failed Login Attempts *"
            type="number"
            min="3"
            max="10"
            icon={ShieldAlert}
            value={data.maxLoginAttempts ?? 5}
            onChange={(e) => onChange({ ...data, maxLoginAttempts: parseInt(e.target.value, 10) || 5 })}
            helperText="Consecutive password failures before temporary lockout"
          />

          <Input
            label="Account Lockout Duration (Minutes) *"
            type="number"
            min="5"
            max="60"
            icon={Lock}
            value={data.lockoutDurationMinutes ?? 15}
            onChange={(e) => onChange({ ...data, lockoutDurationMinutes: parseInt(e.target.value, 10) || 15 })}
            helperText="Cooling period before account accepts login again"
          />
        </div>
      </Card>

      {/* Password Policy */}
      <Card
        title="Password Strength & Governance Policy"
        subtitle="Set organizational complexity constraints for user accounts"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Input
            label="Minimum Password Character Length *"
            type="number"
            min="6"
            max="16"
            icon={Key}
            value={data.minPasswordLength ?? 8}
            onChange={(e) => onChange({ ...data, minPasswordLength: parseInt(e.target.value, 10) || 8 })}
            helperText="Standard minimum required characters (Recommended: 8)"
          />

          <div className="flex flex-col justify-center">
            <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Enforce Password Complexity</span>
                <span className="text-[11px] text-slate-500">Require mix of uppercase, lowercase, numbers, and symbols</span>
              </div>
              <input
                type="checkbox"
                checked={data.enforcePasswordComplexity ?? true}
                onChange={(e) => onChange({ ...data, enforcePasswordComplexity: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-0.5"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-4 border-t border-slate-100">
          <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Allow Concurrent Multi-Device Logins</span>
              <span className="text-[11px] text-slate-500">Permit students to be logged into mobile and desktop simultaneously</span>
            </div>
            <input
              type="checkbox"
              checked={data.multiDeviceLoginAllowed ?? true}
              onChange={(e) => onChange({ ...data, multiDeviceLoginAllowed: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Log Sensitive Administrative Actions</span>
              <span className="text-[11px] text-slate-500">Record all settings updates to immutable Audit Trail</span>
            </div>
            <input
              type="checkbox"
              checked={data.logSensitiveActions ?? true}
              onChange={(e) => onChange({ ...data, logSensitiveActions: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-0.5"
            />
          </label>
        </div>
      </Card>

      {/* Emergency Active Session Eviction */}
      <Card
        title="Active Administrative Sessions Security"
        subtitle="Terminate all active refresh tokens and active browser cookies"
      >
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 text-xs block flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-600" />
              Administrative Multi-Device Session Invalidation
            </span>
            <span className="text-slate-500 text-[11px] block max-w-xl">
              Use this if an administrator account has been compromised or after changing passwords. All logged-in browser instances across all devices will immediately be forced to re-authenticate.
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={LogOut}
            onClick={handleLogoutAllDevices}
            className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold shrink-0 text-xs"
          >
            Log Out All Devices
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SecuritySettingsTab;
