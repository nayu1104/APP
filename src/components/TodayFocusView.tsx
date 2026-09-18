import React, { useState, useEffect } from 'react';
import {
  Target,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Zap,
  Lock,
  Compass,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { Task, TodayFocusData } from '../types';
import { FocusTimer } from './FocusTimer';
import { api } from '../api';

interface TodayFocusViewProps {
  todayData: TodayFocusData | null;
  tasks: Task[];
  streak: number;
  shieldScore?: number;
  shieldStatus?: 'healthy' | 'vulnerable' | 'critical';
  onCommitFocus: (taskId: number) => Promise<void>;
  onOpenLogModal: (task: Task, isEmergency?: boolean) => void;
  onGoToPipeline: () => void;
  onOpenShield?: () => void;
}

export const TodayFocusView: React.FC<TodayFocusViewProps> = ({
  todayData,
  tasks,
  streak,
  shieldScore = 100,
  shieldStatus = 'healthy',
  onCommitFocus,
  onOpenLogModal,
  onGoToPipeline,
  onOpenShield,
}) => {
  const [coachAdvice, setCoachAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState<boolean>(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState<boolean>(false);
  const [showMilestones, setShowMilestones] = useState<boolean>(false);

  const committedTask = todayData?.committed_task;
  const isLogged = todayData?.is_logged;
  const loggedEntry = todayData?.logged_entry;
  const recommendedTask = todayData?.recommended_task;
  const recommendationReason = todayData?.recommendation_reason;

  const standardMinutes = committedTask?.minutes_per_unit || 50;

  // Load AI coach advice when committed task is active
  useEffect(() => {
    let isMounted = true;
    if (committedTask && !isLogged) {
      setLoadingAdvice(true);
      api
        .getCoachAdvice({
          taskName: committedTask.name,
          taskType: committedTask.task_type,
          whyReason: committedTask.why_reason,
          currentPosition: committedTask.current_position_label,
          nextMission: committedTask.next_mission_label,
          streak,
        })
        .then((adv) => {
          if (isMounted) setCoachAdvice(adv);
        })
        .catch(() => {
          if (isMounted) {
            setCoachAdvice(
              `Eliminate all peripheral noise. Commit your full cognitive energy to ${committedTask.next_mission_label}. Multitasking splits your free time into zero results.`
            );
          }
        })
        .finally(() => {
          if (isMounted) setLoadingAdvice(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [committedTask?.id, isLogged, streak]);

  // SCENARIO 1: TODAY'S FOCUS HAS BEEN LOGGED (MISSION COMPLETE)
  if (isLogged && loggedEntry) {
    const isMinimumTimeSession = Boolean(loggedEntry.is_emergency);

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Sealed Completion Hero */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-9 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber-400 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Mission Sealed for Today</span>
            </div>

            {/* Shield Reward Badge */}
            <button
              onClick={onOpenShield}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono font-bold transition-colors ${
                isMinimumTimeSession
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>
                {isMinimumTimeSession ? '+10 Shield Pts (Streak Alive)' : '+100 Shield Pts (Full Pace)'}
              </span>
            </button>
          </div>

          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            Daily Focus Complete
          </h1>

          <div className="mt-4 rounded-2xl border border-neutral-800/80 bg-neutral-950/80 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-neutral-400 mb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span>SESSION LOGGED</span>
                {isMinimumTimeSession ? (
                  <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-300 font-bold">
                    ⚡ 5 MIN MINIMUM TIME (STREAK SAVED)
                  </span>
                ) : (
                  <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-300 font-bold">
                    🎯 FULL SESSION ({loggedEntry.minutes_spent || 50} MIN)
                  </span>
                )}
              </div>
              <span className="text-amber-400 font-bold">{loggedEntry.date}</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white">
              {loggedEntry.task_name}
            </div>
            {loggedEntry.current_position_label && (
              <div className="mt-1 text-sm font-mono text-amber-400/90 font-semibold">
                → {loggedEntry.current_position_label}
              </div>
            )}
            {loggedEntry.note && (
              <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-xs text-neutral-300">
                <span className="text-[10px] font-mono text-neutral-500 block mb-1">LOGGED REFLECTION:</span>
                "{loggedEntry.note}"
              </div>
            )}
          </div>

          {/* Radical Single Tasking Protocol Enforced */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-neutral-800/80 bg-neutral-950/50 p-4">
            <Lock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Radical Single-Tasking Enforced
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                You have fulfilled your single deliberate task for today. Step away, let your mind consolidate your learning, and return tomorrow for the next single focus.
              </p>
            </div>
          </div>

          {/* Streak & Shield Stat */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/80 pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-300">
                <Zap className="h-4 w-4 text-amber-400 fill-amber-400/30" />
                <span>
                  Streak: <strong className="text-amber-400">{streak} Days</strong>
                </span>
              </div>
              <button
                onClick={onOpenShield}
                className="flex items-center gap-1 text-xs font-mono text-neutral-400 hover:text-emerald-400 transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>Shield: <strong className="text-white">{Math.round(shieldScore)} pts</strong></span>
              </button>
            </div>
            <button
              onClick={onGoToPipeline}
              className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View Pipeline</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCENARIO 2: TASK COMMITTED FOR TODAY (ACTIVE MISSION)
  if (committedTask) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Main Mission Card */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 border-t-2 border-r-2 border-amber-500/40 rounded-tr-3xl pointer-events-none" />

          {/* Subheader badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                Today's Sole Commitment
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-neutral-800 border border-neutral-700 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-400">
                Priority P{committedTask.importance}
              </span>
              <span className="rounded-lg bg-neutral-950 border border-neutral-800 px-2 py-0.5 text-[11px] font-mono uppercase text-neutral-400">
                {committedTask.task_type}
              </span>
            </div>
          </div>

          {/* Task Name & Motivation */}
          <div className="mt-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {committedTask.name}
            </h1>
            {committedTask.why_reason && (
              <p className="mt-2 text-xs sm:text-sm text-neutral-400 italic font-sans">
                "{committedTask.why_reason}"
              </p>
            )}
          </div>

          {/* ORDINAL PROGRESS MISSION BLOCK */}
          <div className="mt-6 rounded-2xl border-2 border-amber-500/30 bg-neutral-950 p-5 shadow-[0_0_25px_rgba(245,158,11,0.06)]">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="uppercase tracking-wider font-semibold">Today's Exact Mission</span>
              {committedTask.resource_url && (
                <a
                  href={committedTask.resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold hover:underline"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Dictated Mission Text */}
            <div className="mt-2 text-lg sm:text-xl font-extrabold text-white">
              {committedTask.next_mission_label}
            </div>

            <div className="mt-1 text-xs font-mono text-neutral-400">
              Status: <span className="text-amber-400">{committedTask.current_position_label}</span>
              {committedTask.total_units && (
                <span> • {committedTask.completed_units}/{committedTask.total_units} {committedTask.unit_label} ({committedTask.progress_pct}%)</span>
              )}
            </div>

            {/* Progress bar */}
            {committedTask.total_units && committedTask.total_units > 0 && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-900 border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${committedTask.progress_pct}%` }}
                />
              </div>
            )}

            {/* Milestones accordion for projects */}
            {committedTask.task_type === 'project' && committedTask.milestones.length > 0 && (
              <div className="mt-3 pt-3 border-t border-neutral-800/80">
                <button
                  onClick={() => setShowMilestones(!showMilestones)}
                  className="flex items-center justify-between w-full text-xs font-mono text-neutral-400 hover:text-white"
                >
                  <span>
                    Project Milestones ({committedTask.milestones.filter((m) => m.is_completed === 1).length}/
                    {committedTask.milestones.length} completed)
                  </span>
                  {showMilestones ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {showMilestones && (
                  <div className="mt-2 space-y-1.5">
                    {committedTask.milestones.map((m) => (
                      <div
                        key={m.id}
                        className={`flex items-center gap-2 rounded-lg p-2 text-xs font-mono ${
                          m.is_completed === 1
                            ? 'bg-neutral-900/50 text-neutral-500 line-through'
                            : 'bg-neutral-900 text-neutral-200 border border-neutral-800'
                        }`}
                      >
                        <span className="shrink-0 text-[10px] font-bold text-amber-400">#{m.step_order}</span>
                        <span className="flex-1 truncate">{m.title}</span>
                        {m.is_completed === 1 && <span className="text-[10px] text-emerald-400">✓ Done</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Gemini AI Coach Advice Card */}
          <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>OneFocus AI Coach</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
              {loadingAdvice ? (
                <span className="text-neutral-500 font-mono animate-pulse">Formulating tactical single-task advice...</span>
              ) : (
                coachAdvice
              )}
            </p>
          </div>

          {/* Focus Timer (Standard task time or 5 min Minimum Time) */}
          <div className="mt-6">
            <FocusTimer
              defaultMinutes={standardMinutes}
              taskName={committedTask.name}
              onLogWithTime={(mins, isEmergency) => onOpenLogModal(committedTask, isEmergency)}
            />
          </div>

          {/* Completion Actions: Standard Full Task vs 5 Min Minimum Time Streak Saver */}
          <div className="mt-6 space-y-3">
            {/* Primary Action: Complete Full Session */}
            <button
              id="btn-log-standard"
              onClick={() => onOpenLogModal(committedTask, false)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-extrabold text-neutral-950 hover:bg-emerald-400 active:scale-98 transition-all shadow-lg"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>Complete Full Focus ({standardMinutes} min) • +100 Shield Pts</span>
            </button>

            {/* The ONLY other option: Minimum Time (5 min) Streak Saver */}
            <button
              id="btn-log-minimum-time"
              onClick={() => onOpenLogModal(committedTask, true)}
              className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left hover:border-amber-500/60 hover:bg-amber-500/15 transition-all group min-h-[44px]"
            >
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors mt-0.5 sm:mt-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    Can't do {standardMinutes} min today? Do Minimum Time (5 min)
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                    Emergency fallback: keeps your streak alive & earns +10 Shield points
                  </div>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-amber-400 shrink-0 self-end sm:self-auto mt-1 sm:mt-0">
                Log 5 min →
              </span>
            </button>

            <div className="flex items-center justify-between text-xs font-mono text-neutral-500 px-1 pt-1">
              <span>Only one task per calendar day.</span>
              <button
                onClick={() => setShowSwitchConfirm(!showSwitchConfirm)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors py-1 px-2"
              >
                Switch Focus Goal
              </button>
            </div>
          </div>

          {/* Friction Confirmation for Switching */}
          {showSwitchConfirm && (
            <div className="mt-4 rounded-2xl border border-amber-900/50 bg-amber-950/20 p-4 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-neutral-300">
                  <span className="font-bold text-amber-300">Intentional Friction Warning:</span>
                  <p>
                    Radical single-tasking works because you refuse to scatter your free time. Switching tasks mid-day causes cognitive fragmentation.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={onGoToPipeline}
                      className="rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-mono px-3 py-2 text-xs font-bold min-h-[38px]"
                    >
                      I Understand, Select Different Task
                    </button>
                    <button
                      onClick={() => setShowSwitchConfirm(false)}
                      className="text-neutral-400 hover:text-white font-mono px-2 py-2 text-xs min-h-[38px]"
                    >
                      Keep Current Commitment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // SCENARIO 3: NO FOCUS COMMITTED YET TODAY (DECISION GATE)
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Shield Alert Header */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex flex-wrap items-center gap-1.5">
              <span>Daily Shield Defense Active</span>
              <span className="text-[11px] font-mono text-amber-400">({Math.round(shieldScore)} pts)</span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
              Complete your task (or 5 min Minimum Time if busy) to keep your streak alive!
            </div>
          </div>
        </div>
        <button
          onClick={onOpenShield}
          className="self-end sm:self-auto rounded-lg border border-neutral-800 px-3 py-1.5 text-xs font-mono text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors min-h-[36px]"
        >
          Details
        </button>
      </div>

      {/* Commitment Decision Gate */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber-400 font-bold">
          <Compass className="h-4 w-4" />
          <span>The Daily Decision Gate</span>
        </div>

        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
          Commit to Exactly ONE Focus Today
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
          The core philosophy of OneFocus: scattering your attention across 3 subjects achieves zero depth. Commit to one single goal, make visible linear progress, and lock the rest out.
        </p>

        {/* Recommended Mission by Algorithm */}
        {recommendedTask && (
          <div className="mt-6 rounded-2xl border-2 border-amber-500/40 bg-neutral-950 p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono text-amber-400 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <Target className="h-4 w-4" />
                <span>ALGORITHMIC PRIORITY RECOMMENDATION</span>
              </span>
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase border border-amber-500/30">
                P{recommendedTask.importance}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white">
              {recommendedTask.name}
            </h3>

            <div className="mt-2 text-xs font-mono text-neutral-300">
              Next target: <span className="text-amber-300 font-bold">{recommendedTask.next_mission_label}</span>
            </div>

            {recommendationReason && (
              <p className="mt-2 text-xs text-neutral-400 italic font-sans">
                Reason: {recommendationReason}
              </p>
            )}

            <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
              <button
                id="btn-commit-recommended"
                onClick={() => onCommitFocus(recommendedTask.id)}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-extrabold text-neutral-950 hover:bg-amber-400 active:scale-98 transition-all shadow-md"
              >
                <span>Commit Sole Focus to This Goal</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={onGoToPipeline}
                className="w-full sm:w-auto text-xs font-mono text-neutral-400 hover:text-white py-2 px-3"
              >
                Browse Other Pipeline Goals →
              </button>
            </div>
          </div>
        )}

        {/* If no tasks exist */}
        {!recommendedTask && tasks.length === 0 && (
          <div className="mt-6 text-center py-8 rounded-2xl border border-dashed border-neutral-800 p-6">
            <p className="text-sm text-neutral-400 mb-4">
              You haven't defined any goals in your pipeline yet.
            </p>
            <button
              onClick={onGoToPipeline}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors"
            >
              Add First Goal or Course
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
