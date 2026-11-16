import React, { useState } from 'react';
import { Key, X, Sparkles, Check, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';
import { getCustomApiKey, setCustomApiKey, removeCustomApiKey } from '../services/api';
import { AIStatus } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiStatus: AIStatus | null;
  onKeyUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  aiStatus,
  onKeyUpdated,
}) => {
  if (!isOpen) return null;

  const [apiKey, setApiKey] = useState(getCustomApiKey() || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (apiKey.trim()) {
      setCustomApiKey(apiKey.trim());
    } else {
      removeCustomApiKey();
    }
    setIsSaved(true);
    onKeyUpdated();
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    removeCustomApiKey();
    setApiKey('');
    onKeyUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Google Gemini AI Settings</h3>
              <p className="text-[11px] text-slate-500">Configure your Generative AI Model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="font-bold text-indigo-950 block">Model Architecture</span>
                <span className="text-[11px] text-indigo-700">Gemini 4 Hydrogen / 2.5 Flash</span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                aiStatus?.configured || apiKey
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {aiStatus?.configured || apiKey ? '● Live API' : '● Demo Simulation'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
              <span>Saved locally in your browser storage.</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
              >
                Get a free key <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              If no key is provided, MindFlow AI automatically runs with high-quality simulated AI outputs so all features (summarization, task extraction, rewrites, chat) can be thoroughly tested!
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
              >
                Clear Key
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
              {isSaved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
