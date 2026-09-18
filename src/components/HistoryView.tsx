import React from 'react';
import { Calendar, Zap, BookOpen, Clock, ShieldCheck, Shield, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { LogsHistoryData } from '../types';

interface HistoryViewProps {
  historyData: LogsHistoryData | null;
  onOpenShield?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ historyData, onOpenShield }) => {
  const logs = historyData?.logs || [];
  const streak = historyData?.streak || 0;
  const totalDays = historyData?.total_days_logged || 0;
  const totalUnits = historyData?.total_units_completed || 0;
  const shieldScore = Math.round((historyData?.shield_score ?? 100) * 10) / 10;
  const shieldStatus = historyData?.shield_status || 'healthy';

  const isHealthy = shieldScore >= 70;
  const isVulnerable = shieldScore >= 30 && shieldScore < 70;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header & Metrics */}
      <div className="border-b border-neutral-800 pb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Discipline Journal</h1>
          <p className="text-xs font-mono text-neutral-400 mt-0.5">
            Single source of truth for every calendar day committed to deliberate focus.
          </p>
        </div>

        {onOpenShield && (
          <button
            onClick={onOpenShield}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-neutral-300 hover:border-amber-500/40 hover:text-white transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            <span>Shield Protocol Details</span>
            <ArrowUpRight className="h-3 w-3 text-neutral-500" />
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Streak */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <Zap className="h-4 w-4 text-amber-400 fill-amber-400/20" />
            <span>RADICAL STREAK</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono">
            {streak} <span className="text-sm font-normal text-amber-400">Days</span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-neutral-500">
            Consecutive single-task commitments
          </p>
        </div>

        {/* Shield Score */}
        <div
          onClick={onOpenShield}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md cursor-pointer hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <div className="flex items-center gap-1.5">
              {isHealthy ? (
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              ) : isVulnerable ? (
                <Shield className="h-4 w-4 text-amber-400" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-rose-400" />
              )}
              <span>SHIELD SCORE</span>
            </div>
            <span className={`text-[10px] font-bold ${
              isHealthy ? 'text-emerald-400' : isVulnerable ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {isHealthy ? 'ACTIVE' : isVulnerable ? 'VULN' : 'CRIT'}
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono">
            {shieldScore} <span className="text-sm font-normal text-neutral-400">pts</span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-neutral-500">
            Safeguards streak on missed days
          </p>
        </div>

        {/* Days Committed */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <Calendar className="h-4 w-4 text-sky-400" />
            <span>DAYS COMMITTED</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono">
            {totalDays} <span className="text-sm font-normal text-neutral-400">Days</span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-neutral-500">
            Verified entries in SQLite daily_logs
          </p>
        </div>

        {/* Units Completed */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span>UNITS COMPLETED</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono">
            {totalUnits} <span className="text-sm font-normal text-neutral-400">Units</span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-neutral-500">
            Lectures, milestones, & sessions logged
          </p>
        </div>
      </div>

      {/* Shield Protection Protocol Summary */}
      <div className="flex items-start gap-3 rounded-2xl border border-neutral-800/90 bg-neutral-950 p-4 text-xs font-mono text-neutral-400">
        <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-neutral-200">Shield Defense Mechanics: </strong>
          Standard focus tasks reward <strong className="text-emerald-400">+100 Shield pts</strong>. Can't do the full session? Completing Minimum Time (5 min) keeps your streak alive and earns <strong className="text-amber-400">+10 Shield pts</strong>. If you ever miss a day entirely, your Shield absorbs the blow by burning 30% of your total points to save your streak!
        </div>
      </div>

      {/* Logs Feed */}
      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 p-12 text-center text-xs font-mono text-neutral-500">
          No daily logs recorded yet. Complete today's focus session to begin your journal!
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isMinimumTime = Boolean(log.is_emergency);

            return (
              <div
                key={log.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 hover:border-neutral-700/80 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-neutral-950 border border-neutral-800 px-2 py-0.5 font-mono text-xs font-bold text-amber-400">
                      {log.date}
                    </span>
                    <span className="text-xs font-mono uppercase text-neutral-400">
                      {log.task_type}
                    </span>
                    {isMinimumTime ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300 font-bold">
                        <Zap className="h-3 w-3" />
                        MINIMUM TIME (5m) • STREAK SAVED (+10 Pts)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-semibold">
                        <ShieldCheck className="h-3 w-3" />
                        FULL FOCUS (+100 Pts)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
                    {log.minutes_spent && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-neutral-500" />
                        <span>{log.minutes_spent}m</span>
                      </span>
                    )}
                    <span>
                      +{log.units_completed} {log.unit_label || 'units'}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="text-base font-bold text-white">
                    {log.task_name}
                  </h4>

                  {log.current_position_label && (
                    <div className="mt-1 text-xs font-mono text-amber-400/90">
                      → {log.current_position_label}
                    </div>
                  )}

                  {log.note && (
                    <div className="mt-3 rounded-xl border border-neutral-800/80 bg-neutral-950/70 p-3 text-xs text-neutral-300 font-sans leading-relaxed">
                      <span className="text-[10px] font-mono text-neutral-500 block mb-1">NOTES & REFLECTION:</span>
                      {log.note}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
