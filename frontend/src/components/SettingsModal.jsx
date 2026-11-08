import React, { useState, useEffect } from 'react';
import { X, Key, Building2, BookOpen, Check, ShieldCheck, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsModal({ isOpen, onClose, onSettingsUpdated }) {
  const [settings, setSettings] = useState({
    institution: '',
    department: '',
    llm_provider: 'offline',
    has_gemini_key: false,
    has_openai_key: false,
  });
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      api.getSettings()
        .then((data) => {
          setSettings(data);
          setInstitution(data.institution || 'University of Ibadan');
          setDepartment(data.department || 'Computer Science');
        })
        .catch((err) => {
          setErrorMsg('Failed to load current settings.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        institution,
        department,
        gemini_key: geminiKey.trim() || undefined,
        openai_key: openaiKey.trim() || undefined,
      };
      const res = await api.updateSettings(payload);
      setSettings(res.settings);
      setSuccessMsg('Settings saved successfully!');
      if (onSettingsUpdated) {
        onSettingsUpdated(res.settings);
      }
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-800 to-purple-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-200">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Study Better Settings</h3>
              <p className="text-xs text-purple-200">Institutional Identity & Model Provider Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-purple-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            <span className="text-xs text-slate-500">Loading settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-5">
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Institutional Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <Building2 className="w-4 h-4 mr-1.5 text-sky-600" />
                Institution & Department Identity
              </h4>
              <p className="text-xs text-slate-500">
                Any university or faculty can use this framework. Customize your institution name and default department below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Institution Name</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. University of Ibadan"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Primary Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science, Economics"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-sky-600" />
                  Reasoning & LLM Provider
                </h4>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                  settings.llm_provider === 'offline' 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  Current Mode: {settings.llm_provider.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                By default, the agent runs in <strong>100% Offline Mode</strong> using local vector search and rule-based rubric evaluation without needing any API keys. You can optionally add a Gemini or OpenAI key below for natural language synthesis.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between mb-1">
                    <span>Google Gemini API Key</span>
                    {settings.has_gemini_key && (
                      <span className="text-emerald-600 font-mono text-[10px] flex items-center">
                        <Check className="w-3 h-3 mr-0.5" /> Key Configured
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={settings.has_gemini_key ? '••••••••••••••••••••••••' : 'Enter AI Studio API Key (optional)'}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between mb-1">
                    <span>OpenAI API Key</span>
                    {settings.has_openai_key && (
                      <span className="text-emerald-600 font-mono text-[10px] flex items-center">
                        <Check className="w-3 h-3 mr-0.5" /> Key Configured
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder={settings.has_openai_key ? '••••••••••••••••••••••••' : 'Enter OpenAI API Key (optional)'}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white px-5 py-2 text-xs font-semibold rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center space-x-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
