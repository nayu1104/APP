import React, { useState } from 'react';
import { X, User, Key, Smartphone, Copy, Check, RefreshCw, LogOut, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';
import { api } from '../api';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onUserChanged: (user: UserType | null) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const [emailInput, setEmailInput] = useState(currentUser?.email || 'nayanparmar1104@gmail.com');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'switch'>('view');

  if (!isOpen) return null;

  const handleCopyPasscode = () => {
    if (!currentUser?.passcode) return;
    navigator.clipboard.writeText(currentUser.passcode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passcodeInput) {
      setError('Please enter both your email and passcode');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const user = await api.login(emailInput.trim(), passcodeInput.trim());
      onUserChanged(user);
      setSuccessMessage(`Welcome back, ${user.display_name}! Data synced.`);
      setMode('view');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePasscode = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await api.generatePasscode(emailInput.trim());
      onUserChanged(result.user);
      setPasscodeInput(result.user.passcode);
      setSuccessMessage(
        result.isNew
          ? `Account created! Your 6-digit passcode is ${result.user.passcode}. Save it to restore your data!`
          : `New passcode generated: ${result.user.passcode}`
      );
      setMode('view');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate passcode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    api.logout();
    onUserChanged(null);
    setMode('switch');
    setSuccessMessage('Signed out. Enter your credentials to restore your data.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="my-auto w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Cross-Device Synchronization
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">Account & Data Backup</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-3 text-xs text-emerald-200">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {currentUser && mode === 'view' ? (
          <div className="mt-5 space-y-4">
            {/* Active User Card */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 font-bold text-neutral-950 text-xs">
                    {currentUser.display_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{currentUser.display_name}</div>
                    <div className="text-xs font-mono text-neutral-400">{currentUser.email}</div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-400 border border-emerald-500/20">
                  ● SYNCED
                </span>
              </div>

              {/* Passcode Box */}
              <div className="border-t border-neutral-800/80 pt-3">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Key className="h-3.5 w-3.5 text-amber-400" />
                    <span>Your 6-Digit Device Passcode:</span>
                  </span>
                  <button
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    {showPasscode ? 'Hide' : 'Reveal'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 font-mono text-base tracking-widest text-amber-400 font-bold">
                    {showPasscode ? currentUser.passcode : '••••••'}
                  </div>
                  <button
                    onClick={handleCopyPasscode}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-mono text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
                    title="Copy passcode to clipboard"
                  >
                    {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleGeneratePasscode}
                    disabled={isLoading}
                    className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-2 text-xs font-mono text-neutral-400 hover:text-amber-400 hover:border-neutral-700 transition-colors"
                    title="Generate a new passcode"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Cross-Device Instructions */}
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 space-y-2 text-xs font-mono text-neutral-400">
              <div className="flex items-center gap-2 text-neutral-200 font-bold">
                <Smartphone className="h-4 w-4 text-sky-400" />
                <span>How to restore on any device or after reinstalling:</span>
              </div>
              <p className="leading-relaxed">
                1. Open OneFocus on your mobile browser or laptop.
              </p>
              <p className="leading-relaxed">
                2. Tap Account and enter <strong className="text-neutral-200">{currentUser.email}</strong> with passcode <strong className="text-amber-400">{currentUser.passcode}</strong>.
              </p>
              <p className="leading-relaxed">
                3. Your tasks, milestones, logs, streak, and shield score will automatically reload!
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setMode('switch')}
                className="text-xs font-mono text-neutral-400 hover:text-amber-400 transition-colors"
              >
                Sign in with another email →
              </button>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 rounded-lg border border-neutral-800 px-3 py-1.5 text-xs font-mono text-neutral-400 hover:text-rose-400 hover:border-rose-900 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Restore / Generate Form */
          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1">
                Gmail or Email Address
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. nayanparmar1104@gmail.com"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm font-mono text-white focus:border-amber-500 focus:outline-none placeholder:text-neutral-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                  6-Digit Passcode
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePasscode}
                  disabled={isLoading}
                  className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Generate New Passcode</span>
                </button>
              </div>
              <input
                type="text"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter 6-digit code or click Generate above"
                maxLength={8}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm font-mono text-white tracking-wider focus:border-amber-500 focus:outline-none placeholder:text-neutral-600"
              />
              <p className="mt-1 text-[11px] font-mono text-neutral-500">
                If this is your first time or you forgot your code, click "Generate New Passcode".
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all shadow-sm disabled:opacity-50"
              >
                <span>{isLoading ? 'Connecting...' : 'Sign In & Restore Data'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleGeneratePasscode}
                disabled={isLoading}
                className="rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs font-mono text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
              >
                Instant Register
              </button>
            </div>

            {currentUser && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="text-xs font-mono text-neutral-500 hover:text-neutral-300"
                >
                  ← Back to active profile ({currentUser.email})
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
