import React from 'react';
import Card from '../Card';
import Input from '../Input';
import { 
  FileCheck, 
  Clock, 
  Award, 
  ShieldAlert, 
  Camera, 
  Smartphone, 
  Users, 
  ExternalLink, 
  Copy, 
  Maximize, 
  ScreenShare,
  Sliders,
  AlertTriangle
} from 'lucide-react';

export const AssessmentSettingsTab = ({ 
  assessmentData = {}, 
  proctoringData = {}, 
  onAssessmentChange, 
  onProctoringChange 
}) => {
  return (
    <div className="space-y-6">
      {/* General Assessment Examination Parameters */}
      <Card
        title="Default Assessment Parameters"
        subtitle="Standard parameters applied automatically when teachers or placement officers create new tests"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          <Input
            label="Default Question Count *"
            type="number"
            min="5"
            max="100"
            value={assessmentData.defaultQuestionCount ?? 30}
            onChange={(e) => onAssessmentChange({ ...assessmentData, defaultQuestionCount: parseInt(e.target.value, 10) || 30 })}
            helperText="Default items per generated assessment"
          />

          <Input
            label="Default Duration (Minutes) *"
            type="number"
            min="10"
            max="180"
            icon={Clock}
            value={assessmentData.defaultDurationMinutes ?? 45}
            onChange={(e) => onAssessmentChange({ ...assessmentData, defaultDurationMinutes: parseInt(e.target.value, 10) || 45 })}
            helperText="Timer duration allocated to examinees"
          />

          <Input
            label="Passing Score Percentage (%) *"
            type="number"
            min="30"
            max="90"
            icon={Award}
            value={assessmentData.passingPercentage ?? 60}
            onChange={(e) => onAssessmentChange({ ...assessmentData, passingPercentage: parseInt(e.target.value, 10) || 60 })}
            helperText="Minimum score required to pass & earn XP"
          />
        </div>

        {/* Retake & Attempts Policy */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Retake Governance Policy *
            </label>
            <select
              value={assessmentData.retakePolicy || 'cooldown'}
              onChange={(e) => onAssessmentChange({ ...assessmentData, retakePolicy: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="allowed">Immediate Retake Allowed</option>
              <option value="cooldown">Cooldown Required Between Attempts</option>
              <option value="disallowed">Single Attempt Only (Strict Examination)</option>
            </select>
          </div>

          <Input
            label="Cooldown Duration (Hours)"
            type="number"
            min="1"
            max="168"
            value={assessmentData.retakeCooldownHours ?? 24}
            onChange={(e) => onAssessmentChange({ ...assessmentData, retakeCooldownHours: parseInt(e.target.value, 10) || 24 })}
            disabled={assessmentData.retakePolicy !== 'cooldown'}
            helperText="Hours required before student can retry"
          />

          <Input
            label="Maximum Allowed Attempts"
            type="number"
            min="1"
            max="10"
            value={assessmentData.maximumAttempts ?? 3}
            onChange={(e) => onAssessmentChange({ ...assessmentData, maximumAttempts: parseInt(e.target.value, 10) || 3 })}
            helperText="Cap on retries (1 = strict single attempt)"
          />
        </div>

        {/* Randomization & Automation Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-100">
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition">
            <span className="text-xs font-bold text-slate-800">Shuffle Questions</span>
            <input
              type="checkbox"
              checked={assessmentData.questionRandomization ?? true}
              onChange={(e) => onAssessmentChange({ ...assessmentData, questionRandomization: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition">
            <span className="text-xs font-bold text-slate-800">Shuffle MCQ Options</span>
            <input
              type="checkbox"
              checked={assessmentData.optionRandomization ?? true}
              onChange={(e) => onAssessmentChange({ ...assessmentData, optionRandomization: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition">
            <span className="text-xs font-bold text-slate-800">Auto-Submit On Timeout</span>
            <input
              type="checkbox"
              checked={assessmentData.autoSubmitOnTimeOut ?? true}
              onChange={(e) => onAssessmentChange({ ...assessmentData, autoSubmitOnTimeOut: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition">
            <span className="text-xs font-bold text-slate-800">Immediate Results</span>
            <input
              type="checkbox"
              checked={assessmentData.showResultImmediately ?? true}
              onChange={(e) => onAssessmentChange({ ...assessmentData, showResultImmediately: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>
        </div>
      </Card>

      {/* Proctoring & Examination Integrity Controls */}
      <Card
        title="Proctoring & Anti-Cheating Surveillance Controls"
        subtitle="Configure real-time browser integrity checks and AI vision surveillance"
      >
        {/* Violation Thresholds */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          <Input
            label="Tab-Switch Warning Threshold *"
            type="number"
            min="1"
            max="10"
            value={proctoringData.maxTabSwitchWarnings ?? 3}
            onChange={(e) => onProctoringChange({ ...proctoringData, maxTabSwitchWarnings: parseInt(e.target.value, 10) || 3 })}
            helperText="Warnings given before recording violation"
          />

          <Input
            label="Total Violation Termination Threshold *"
            type="number"
            min="1"
            max="15"
            value={proctoringData.maxViolationThreshold ?? 5}
            onChange={(e) => onProctoringChange({ ...proctoringData, maxViolationThreshold: parseInt(e.target.value, 10) || 5 })}
            helperText="Maximum infractions before auto-submitting test"
          />

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition self-end">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Auto-Terminate Test</span>
              <span className="text-[10px] text-slate-500">When violation threshold is breached</span>
            </div>
            <input
              type="checkbox"
              checked={proctoringData.autoTerminateOnViolations ?? true}
              onChange={(e) => onProctoringChange({ ...proctoringData, autoTerminateOnViolations: e.target.checked })}
              className="w-4 h-4 text-rose-600 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Feature Switches Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-5 mt-5 border-t border-slate-100">
          <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Camera className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Face Presence Detection</span>
                <span className="text-[11px] text-slate-500">Detect student absence from webcam</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={proctoringData.faceDetection ?? true}
              onChange={(e) => onProctoringChange({ ...proctoringData, faceDetection: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Mobile Phone Detection</span>
                <span className="text-[11px] text-slate-500">Alert on phone detected in webcam view</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={proctoringData.mobileDetection ?? true}
              onChange={(e) => onProctoringChange({ ...proctoringData, mobileDetection: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Multiple Person Detection</span>
                <span className="text-[11px] text-slate-500">Flag unauthorized bystander / second face</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={proctoringData.multiplePersonDetection ?? true}
              onChange={(e) => onProctoringChange({ ...proctoringData, multiplePersonDetection: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition shadow-2xs">
            <div className="flex items-start gap-2.5">
              <ExternalLink className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Tab / Window Switch Detection</span>
                <span className="text-[11px] text-slate-500">Record blur events when user leaves tab</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={proctoringData.tabSwitchDetection ?? true}
              onChange={(e) => onProctoringChange({ ...proctoringData, tabSwitchDetection: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Copy className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Clipboard & Paste Restriction</span>
                <span className="text-[11px] text-slate-500">Block copying questions or pasting answers</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={proctoringData.copyPasteRestriction ?? true}
              onChange={(e) => onProctoringChange({ ...proctoringData, copyPasteRestriction: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Maximize className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Full-Screen Enforcement</span>
                <span className="text-[11px] text-slate-500">Require full-screen during entire test</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={proctoringData.fullScreenEnforcement ?? true}
              onChange={(e) => onProctoringChange({ ...proctoringData, fullScreenEnforcement: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-0.5"
            />
          </label>
        </div>
      </Card>
    </div>
  );
};

export default AssessmentSettingsTab;
