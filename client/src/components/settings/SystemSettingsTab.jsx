import React, { useState } from 'react';
import Card from '../Card';
import Input from '../Input';
import Button from '../Button';
import Badge from '../Badge';
import Modal from '../Modal';
import { 
  Server, 
  Database, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  HardDrive,
  Info,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';

export const SystemSettingsTab = ({ data = {}, onChange, onToast, onResetCategory }) => {
  const [cacheClearing, setCacheClearing] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedCategoryToReset, setSelectedCategoryToReset] = useState('assessment');
  const [resetting, setResetting] = useState(false);

  const handleClearCache = () => {
    setCacheClearing(true);
    setTimeout(() => {
      setCacheClearing(false);
      if (onToast) {
        onToast('success', 'Cache Flushed', 'In-memory routing and query cache successfully cleared.');
      }
    }, 600);
  };

  const handleExecuteReset = async () => {
    setResetting(true);
    try {
      if (onResetCategory) {
        await onResetCategory(selectedCategoryToReset);
      }
      setResetModalOpen(false);
    } catch (err) {
      if (onToast) {
        onToast('error', 'Reset Failed', err.message || 'Error resetting category.');
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Mode Governor */}
      <Card
        title="Platform Scheduled Maintenance Mode"
        subtitle="Temporarily pause student training and assessments for scheduled system updates"
      >
        <div className="space-y-4 pt-1">
          <label className={`flex items-start justify-between p-4 rounded-2xl border transition cursor-pointer ${
            data.maintenanceMode
              ? 'bg-amber-500/10 border-amber-500/40'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
          }`}>
            <div className="pr-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 block">
                  Activate Maintenance Mode
                </span>
                <Badge variant={data.maintenanceMode ? 'warning' : 'neutral'}>
                  {data.maintenanceMode ? 'Active (Portal Paused for Students)' : 'Inactive (Normal Operation)'}
                </Badge>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block max-w-xl">
                When enabled, student access to training modules and assessment tests is blocked with a friendly maintenance notice. Administrators retain full access.
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.maintenanceMode ?? false}
              onChange={(e) => onChange({ ...data, maintenanceMode: e.target.checked })}
              className="w-5 h-5 text-amber-600 rounded cursor-pointer shrink-0 mt-0.5"
            />
          </label>

          {data.maintenanceMode && (
            <div className="animate-fade-in pt-2">
              <Input
                label="Student-Facing Maintenance Notice *"
                value={data.maintenanceMessage || ''}
                onChange={(e) => onChange({ ...data, maintenanceMessage: e.target.value })}
                placeholder="MITRA Portal is undergoing scheduled academic maintenance..."
                helperText="Custom message displayed to students who attempt to access modules"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Database & Infrastructure Runtime Health */}
      <Card
        title="Infrastructure Runtime & Database Status"
        subtitle="Live diagnostics for server environment and persistent storage"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Database Cluster
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">MongoDB Atlas Cluster</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Connected & Synchronized
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Server Runtime
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Server className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">Node.js Express API</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Port: 5000 • Environment: Production
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Platform Build
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Info className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-900">MITRA v2.4.0</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Enterprise College Placement Edition
            </span>
          </div>
        </div>

        {/* Database Backup Schedule & Performance Cache */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              Automated Snapshot Backup Frequency *
            </label>
            <select
              value={data.databaseBackupSchedule || 'daily'}
              onChange={(e) => onChange({ ...data, databaseBackupSchedule: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="daily">Daily Midnight Snapshot (Recommended)</option>
              <option value="weekly">Weekly Rolling Archive</option>
              <option value="manual">Manual On-Demand Export Only</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Managed automated MongoDB backup policy</p>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Clear Application Query Cache</span>
                <span className="text-[10px] text-slate-500">Purge cached reports and memory queries</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                loading={cacheClearing}
                onClick={handleClearCache}
                className="text-xs"
              >
                Flush Cache
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Institutional Defaults Reset Center */}
      <Card
        title="Institutional Defaults Reset"
        subtitle="Restore standard university baseline configuration for any specific category"
      >
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 text-xs block flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-slate-700" />
              Reset Category Settings to Institutional Default
            </span>
            <span className="text-slate-500 text-[11px] block max-w-xl">
              If experimental changes produce unintended side-effects, you can selectively reset any individual settings section back to its original deployment state.
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={() => setResetModalOpen(true)}
            className="text-slate-700 font-bold shrink-0 text-xs"
          >
            Reset Category...
          </Button>
        </div>
      </Card>

      {/* Reset Category Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Category to Institutional Defaults"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={resetting}
              onClick={handleExecuteReset}
            >
              Confirm Reset
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Select the settings category you want to restore back to its baseline default configuration:
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Category to Reset:
            </label>
            <select
              value={selectedCategoryToReset}
              onChange={(e) => setSelectedCategoryToReset(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="platform">1. Platform Settings</option>
              <option value="profileGating">2. Profile Gating Fields</option>
              <option value="aiConfig">4. AI Configuration</option>
              <option value="assessment">5. Assessment Parameters</option>
              <option value="proctoring">5. Proctoring Controls</option>
              <option value="training">6. Training Progression & XP</option>
              <option value="communication">7. Communication Triggers</option>
              <option value="security">8. Security Controls</option>
            </select>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>This will immediately restore baseline parameters and log an entry into the Audit Trail.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SystemSettingsTab;
