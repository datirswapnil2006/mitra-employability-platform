import React, { useState } from 'react';
import Card from '../Card';
import Button from '../Button';
import Badge from '../Badge';
import Modal from '../Modal';
import Input from '../Input';
import { api } from '../../services/api';
import { 
  Sparkles, 
  Key, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Gauge, 
  Lock, 
  ShieldCheck, 
  Zap, 
  Sliders, 
  Activity,
  FileText,
  BrainCircuit,
  Award
} from 'lucide-react';

export const AiConfigTab = ({ data = {}, onChange, onToast }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const dailyLimit = data.dailyRequestLimit || 500;
  const currentUsage = data.currentDailyUsage || 0;
  const remaining = Math.max(0, dailyLimit - currentUsage);
  const usagePct = Math.min(100, Math.round((currentUsage / dailyLimit) * 100));
  const isNearLimit = usagePct >= 80;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testAiConnection({ model: data.model || 'gemini-3.6-flash' });
      setTestResult(res);
      if (onToast) {
        onToast('success', 'Gemini AI Connected', res.message || 'API connection operational');
      }
    } catch (err) {
      setTestResult({
        success: false,
        status: 'error',
        message: err.message || 'Connection probe failed. Check API key.'
      });
      if (onToast) {
        onToast('error', 'Connection Failed', err.message || 'Could not connect to Gemini.');
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    setSavingKey(true);
    try {
      const res = await api.replaceApiKey(newKey.trim());
      if (res.success) {
        if (onToast) {
          onToast('success', 'API Key Replaced', 'Google Gemini API key has been securely updated and verified.');
        }
        onChange({
          ...data,
          apiKeyMasked: res.maskedKey,
          hasApiKey: true
        });
        setNewKey('');
        setKeyModalOpen(false);
      }
    } catch (err) {
      if (onToast) {
        onToast('error', 'Update Failed', err.message || 'Failed to replace API key.');
      }
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live AI Status & Connectivity Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-black text-slate-900">Google Gemini AI Engine</h3>
              <Badge variant={data.hasApiKey ? 'success' : 'danger'}>
                {data.hasApiKey ? 'Operational' : 'No Key Configured'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Powers automated question generation, syllabus-aware PDF assessment extraction, psychometric behavioral profiling, and candidate talent scoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={testing}
            onClick={handleTestConnection}
          >
            Test Connection
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Key}
            onClick={() => setKeyModalOpen(true)}
          >
            Replace API Key
          </Button>
        </div>
      </div>

      {/* Test Connection Live Banner if Tested */}
      {testResult && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${
          testResult.success
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            <p className="font-bold">{testResult.message}</p>
            {testResult.latencyMs && (
              <p className="text-[11px] opacity-80 mt-0.5">Roundtrip Latency: {testResult.latencyMs}ms</p>
            )}
          </div>
        </div>
      )}

      {/* API Key Security Display & Daily Quota Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Secure Masked Key Card */}
        <Card
          title="Active Gemini API Key"
          subtitle="Protected key storage (plain-text secrets never revealed)"
          className="lg:col-span-2"
        >
          <div className="space-y-4 pt-1">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Encrypted Key Digest
                </span>
                <span className="font-mono text-xs font-bold text-slate-800">
                  {data.apiKeyMasked || 'No API key configured'}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={Lock}
                onClick={() => setKeyModalOpen(true)}
                className="shrink-0 text-xs"
              >
                Change Key
              </Button>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              API credentials are encrypted in MongoDB. Database URIs and server secrets remain protected.
            </p>
          </div>
        </Card>

        {/* Daily Usage Monitor */}
        <Card
          title="Daily Request Quota"
          subtitle="Tracked requests for today"
        >
          <div className="space-y-3 pt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{currentUsage}</span>
              <span className="text-xs font-bold text-slate-400">/ {dailyLimit} requests</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isNearLimit ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Remaining: <strong>{remaining}</strong></span>
              <span className={isNearLimit ? 'text-amber-600 font-bold' : ''}>{usagePct}% consumed</span>
            </div>

            {isNearLimit && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[10px] font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Approaching daily threshold limit
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Model Selection & Parameters */}
      <Card
        title="Gemini Model Architecture & Parameters"
        subtitle="Select preferred Google generative model and response controls"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              Gemini Model *
            </label>
            <select
              value={data.model || 'gemini-3.6-flash'}
              onChange={(e) => onChange({ ...data, model: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="gemini-3.6-flash">gemini-3.6-flash (Recommended, High Speed & Precision)</option>
              <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra Fast, High Throughput)</option>
              <option value="gemini-3.5-flash">gemini-3.5-flash (Balanced Academic Fallback)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Underlying Google Generative Language foundation</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-600" />
              Daily Request Limit *
            </label>
            <input
              type="number"
              min="50"
              max="5000"
              value={data.dailyRequestLimit ?? 500}
              onChange={(e) => onChange({ ...data, dailyRequestLimit: parseInt(e.target.value, 10) || 500 })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">Prevents runaway API credit consumption</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              Maximum Output Tokens *
            </label>
            <select
              value={data.maxOutputTokens || 2048}
              onChange={(e) => onChange({ ...data, maxOutputTokens: parseInt(e.target.value, 10) })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value={1024}>1024 Tokens (Compact Q&A)</option>
              <option value={2048}>2048 Tokens (Standard Test Generation)</option>
              <option value={4096}>4096 Tokens (Full Syllabus Question Sets)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Max length of single generated question batch</p>
          </div>
        </div>
      </Card>

      {/* Feature Enablement Toggles */}
      <Card
        title="AI-Powered Capability Modules"
        subtitle="Selectively enable or disable individual AI-driven workflows"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer transition">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-900 block flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                AI Dynamic Question Generator
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Generates syllabus-aligned MCQs, coding challenges, and explanations automatically
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.enableQuestionGeneration ?? true}
              onChange={(e) => onChange({ ...data, enableQuestionGeneration: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded cursor-pointer shrink-0 mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer transition">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-900 block flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                PDF Question Extraction
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Parses raw campus placement paper PDFs into structured assessment questions
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.enablePdfExtraction ?? true}
              onChange={(e) => onChange({ ...data, enablePdfExtraction: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0 mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer transition">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-900 block flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-emerald-600" />
                Psychometric Behavioral AI
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Analyzes student workplace compatibility, Big-Five traits, and cultural readiness
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.enablePsychometricAnalysis ?? true}
              onChange={(e) => onChange({ ...data, enablePsychometricAnalysis: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded cursor-pointer shrink-0 mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer transition">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-900 block flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                Talent Intelligence Engine
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Synthesizes mock interview transcripts and resume alignment summaries
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.enableTalentIntelligence ?? true}
              onChange={(e) => onChange({ ...data, enableTalentIntelligence: e.target.checked })}
              className="w-4 h-4 text-amber-600 rounded cursor-pointer shrink-0 mt-0.5"
            />
          </label>
        </div>
      </Card>

      {/* Replace API Key Modal */}
      <Modal
        isOpen={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        title="Replace Google Gemini API Key"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKeyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={savingKey}
              onClick={handleSaveApiKey}
              disabled={!newKey.trim()}
            >
              Save & Validate Key
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveApiKey} className="space-y-4">
          <p className="text-xs text-slate-600">
            Enter your newly generated Google Gemini API key from Google AI Studio. The key will be stored securely and will never be displayed in plain text again.
          </p>

          <Input
            label="New Google Gemini API Key *"
            type="password"
            placeholder="AIzaSy..."
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            required
            helperText="Minimum 20 characters, issued by Google Cloud / AI Studio"
          />

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800">
            After saving, MITRA will automatically conduct an encrypted connectivity check to verify quota and model responsiveness.
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AiConfigTab;
