import React, { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, Shield, Check, AlertCircle } from 'lucide-react';
import { UserSettings } from '../types';
import { api } from '../api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings | null;
  onSettingsUpdated: (settings: UserSettings) => void;
  onResetData: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsUpdated,
  onResetData,
}) => {
  const [dailyBudget, setDailyBudget] = useState<number>(180);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setDailyBudget(settings.daily_budget_minutes || 180);
      setSavedSuccess(false);
      setError(null);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const updated = await api.updateSettings(Number(dailyBudget));
      onSettingsUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset database to clean starter data? This will restore the Stanford ML course, SaaS MVP project, and sample logs.')) {
      return;
    }
    setIsResetting(true);
    try {
      await onResetData();
      onClose();
    } catch (err) {
      console.error('Failed to reset data:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Configuration & Principles
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-950/50 border border-red-800/80 p-3 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="mt-5 space-y-4">
          {/* Daily Budget */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1.5">
              Daily Time Budget (Minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="15"
                step="15"
                required
                value={dailyBudget}
                onChange={(e) => setDailyBudget(parseInt(e.target.value, 10) || 60)}
                className="w-32 rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
              />
              <span className="text-xs font-mono text-neutral-400">
                (~{(dailyBudget / 60).toFixed(1)} hours of deliberate single-tasking)
              </span>
            </div>
            <p className="mt-1 text-[11px] font-mono text-neutral-500">
              Saved in SQLite `user_settings`. Used by the smart intake & scheduling system.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              {savedSuccess ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span>{savedSuccess ? 'Saved' : isSaving ? 'Saving...' : 'Save Budget'}</span>
            </button>
          </div>
        </form>

        {/* The Radical Single-Tasking Manifesto */}
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-400">
            <Shield className="h-3.5 w-3.5" />
            <span>The Single-Task Manifesto</span>
          </div>
          <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">
            1. <strong>Radical Single-Tasking:</strong> Splitting 2 hours across 3 subjects produces 0 mastery. You must choose ONE goal per day.
          </p>
          <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">
            2. <strong>Ordinal Momentum:</strong> Progress is measured step-by-step (e.g. Lecture 10 → Lecture 11). Never start a session wondering what to do.
          </p>
          <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">
            3. <strong>Sealed Completion:</strong> Once today's mission is logged, you stop. Let sleep synthesize what you practiced.
          </p>
        </div>

        {/* Danger Zone / Reset */}
        <div className="mt-6 border-t border-neutral-800/80 pt-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold text-neutral-300">Starter Demo Data</div>
            <div className="text-[11px] font-mono text-neutral-500">
              Reload sample Stanford ML course and SaaS MVP project
            </div>
          </div>
          <button
            type="button"
            disabled={isResetting}
            onClick={handleResetData}
            className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-mono text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isResetting ? 'Resetting...' : 'Reset Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
