import React from 'react';
import { Target, Zap, Clock, Plus, Settings, Shield, ShieldCheck, ShieldAlert, User } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentTab: 'focus' | 'pipeline' | 'journal';
  onSelectTab: (tab: 'focus' | 'pipeline' | 'journal') => void;
  onOpenIntake: () => void;
  onOpenSettings: () => void;
  onOpenShield: () => void;
  onOpenAccount: () => void;
  streak: number;
  dailyBudget: number;
  todayDate: string;
  shieldScore: number;
  shieldStatus?: 'healthy' | 'vulnerable' | 'critical';
  currentUser: UserType | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenIntake,
  onOpenSettings,
  onOpenShield,
  onOpenAccount,
  streak,
  dailyBudget,
  todayDate,
  shieldScore,
  shieldStatus = 'healthy',
  currentUser,
}) => {
  // Format readable date
  const formattedDate = React.useMemo(() => {
    if (!todayDate) return '';
    try {
      const [year, month, day] = todayDate.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).toUpperCase();
    } catch {
      return todayDate;
    }
  }, [todayDate]);

  const scoreRounded = Math.round(shieldScore * 10) / 10;
  const isHealthy = scoreRounded >= 70;
  const isVulnerable = scoreRounded >= 30 && scoreRounded < 70;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-6">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                ONE<span className="text-amber-400">FOCUS</span>
              </span>
              <span className="hidden sm:inline-block rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 border border-neutral-700">
                Single-Task Engine
              </span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center gap-1 rounded-xl bg-neutral-900/90 p-1 border border-neutral-800 text-xs font-medium">
          <button
            id="nav-tab-focus"
            onClick={() => onSelectTab('focus')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 transition-all ${
              currentTab === 'focus'
                ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Today's Focus</span>
            <span className="xs:hidden">Focus</span>
          </button>
          <button
            id="nav-tab-pipeline"
            onClick={() => onSelectTab('pipeline')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 transition-all ${
              currentTab === 'pipeline'
                ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <span>Pipeline</span>
          </button>
          <button
            id="nav-tab-journal"
            onClick={() => onSelectTab('journal')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 transition-all ${
              currentTab === 'journal'
                ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <span>Journal</span>
          </button>
        </nav>

        {/* Right side stats & CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Streak pill */}
          <div
            title="Consecutive days with exactly ONE logged commitment"
            className="flex items-center gap-1 rounded-lg bg-neutral-900 border border-neutral-800 px-2 py-1 text-xs font-mono text-amber-400"
          >
            <Zap className="h-3.5 w-3.5 fill-amber-400/20 text-amber-400" />
            <span>{streak}d</span>
          </div>

          {/* Shield Score pill */}
          <button
            id="btn-open-shield"
            onClick={onOpenShield}
            title="Shield Score: Streak Defense System. Click to view protection details."
            className={`flex items-center gap-1.5 rounded-lg border px-2 sm:px-2.5 py-1 text-xs font-mono font-semibold transition-all hover:scale-105 ${
              isHealthy
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/70'
                : isVulnerable
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-400 hover:bg-amber-950/70'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400 hover:bg-rose-950/70'
            }`}
          >
            {isHealthy ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : isVulnerable ? (
              <Shield className="h-3.5 w-3.5" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5" />
            )}
            <span>{scoreRounded}</span>
            <span className="hidden md:inline text-[10px] uppercase opacity-75">SHIELD</span>
          </button>

          {/* Add Goal Button */}
          <button
            id="btn-add-task-intake"
            onClick={onOpenIntake}
            className="hidden sm:flex items-center gap-1 rounded-xl bg-neutral-100 px-2.5 py-1.5 text-xs font-semibold text-neutral-900 transition-all hover:bg-white active:scale-95 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Goal</span>
          </button>

          {/* Account / User Sync button */}
          <button
            id="btn-open-account"
            onClick={onOpenAccount}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs font-mono text-neutral-300 hover:border-amber-500/50 hover:text-white transition-colors"
            title="Account & Multi-Device Sync (Email & Passcode)"
          >
            <User className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden xl:inline truncate max-w-[110px]">
              {currentUser?.display_name || 'Account'}
            </span>
          </button>

          {/* Settings */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 transition-colors hover:border-neutral-700 hover:text-white"
            title="Settings & Daily Time Budget"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
