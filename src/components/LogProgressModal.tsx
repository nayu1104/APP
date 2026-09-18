import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';
import { Task } from '../types';

interface LogProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  todayDate: string;
  initialIsEmergency?: boolean;
  onConfirmLog: (data: {
    task_id: number;
    units_completed: number;
    current_position_label: string;
    note: string;
    date: string;
    is_emergency?: boolean;
    minutes_spent?: number;
  }) => Promise<void>;
}

export const LogProgressModal: React.FC<LogProgressModalProps> = ({
  isOpen,
  onClose,
  task,
  todayDate,
  initialIsEmergency = false,
  onConfirmLog,
}) => {
  const standardMinutes = task?.minutes_per_unit || 50;
  // Only ONE option for time: Minimum Time (5 min) for emergency streak saving
  const [isMinimumTime, setIsMinimumTime] = useState<boolean>(initialIsEmergency);
  const [positionLabel, setPositionLabel] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when opening
  useEffect(() => {
    if (task) {
      setIsMinimumTime(initialIsEmergency);

      if (initialIsEmergency) {
        setPositionLabel(`5 min Minimum Time session on ${task.name}`);
      } else if (task.task_type === 'course') {
        const nextNum = Math.floor(task.completed_units) + 1;
        const singular = (task.unit_label || 'lecture').replace(/s$/, '');
        setPositionLabel(`Finished ${singular} ${nextNum}`);
      } else if (task.task_type === 'project') {
        const nextMilestone = task.milestones.find((m) => m.is_completed === 0);
        setPositionLabel(nextMilestone ? `Completed: ${nextMilestone.title}` : `Completed milestone`);
      } else {
        setPositionLabel(`Completed daily ${task.unit_label || 'session'}`);
      }
      setNote('');
      setError(null);
    }
  }, [task, isOpen, initialIsEmergency]);

  if (!isOpen || !task) return null;

  const handleToggleMinimum = (useMinimum: boolean) => {
    setIsMinimumTime(useMinimum);
    if (useMinimum) {
      setPositionLabel(`5 min Minimum Time review of ${task.name}`);
    } else {
      if (task.task_type === 'course') {
        const nextNum = Math.floor(task.completed_units) + 1;
        const singular = (task.unit_label || 'lecture').replace(/s$/, '');
        setPositionLabel(`Finished ${singular} ${nextNum}`);
      } else {
        setPositionLabel(`Completed daily focus session on ${task.name}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirmLog({
        task_id: task.id,
        units_completed: isMinimumTime ? 0.1 : 1,
        current_position_label: positionLabel.trim(),
        note: note.trim(),
        date: todayDate,
        is_emergency: isMinimumTime,
        minutes_spent: isMinimumTime ? 5 : standardMinutes,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record log');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Daily Single-Task Commitment
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Log Today's Work
            </h2>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              Date: <span className="text-neutral-200">{todayDate}</span> • Goal: <span className="text-white font-medium">{task.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-950/50 border border-red-800/80 p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* The Single Choice: Full Task Time vs 5 Min Minimum Time */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
              Session Time
            </div>

            {/* Minimum Time Streak Saver Toggle Card */}
            <div
              onClick={() => handleToggleMinimum(!isMinimumTime)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                isMinimumTime
                  ? 'border-amber-500 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'border-neutral-800 bg-neutral-950/80 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                    isMinimumTime ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Can't do {standardMinutes} min? Do Minimum Time (5 min)</span>
                      {isMinimumTime && (
                        <span className="rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-neutral-400 leading-relaxed font-sans">
                      {isMinimumTime
                        ? 'Minimum Time active: complete just 5 min to keep your streak alive (+10 Shield points).'
                        : `If you have an emergency or can't give ${standardMinutes} min today, toggle this to do 5 min and protect your streak.`}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    checked={isMinimumTime}
                    onChange={(e) => handleToggleMinimum(e.target.checked)}
                    className="h-5 w-5 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-900 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Time & Shield summary banner */}
            <div className="flex items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-950 px-3.5 py-2.5 text-xs font-mono">
              <span className="text-neutral-400">
                Logging: <strong className="text-white">{isMinimumTime ? '5 minutes (Minimum Time)' : `${standardMinutes} minutes (Standard Focus)`}</strong>
              </span>
              <span className={`flex items-center gap-1 font-bold ${
                isMinimumTime ? 'text-amber-300' : 'text-emerald-400'
              }`}>
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isMinimumTime ? '+10 Shield Pts (Streak Alive)' : '+100 Shield Pts (Full Pace)'}</span>
              </span>
            </div>
          </div>

          {/* Current Position Tag */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1.5">
              Progress Tag (Where you stopped)
            </label>
            <input
              type="text"
              required
              value={positionLabel}
              onChange={(e) => setPositionLabel(e.target.value)}
              placeholder="e.g., Finished lecture 12 or reviewed core concepts"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1.5">
              Quick Reflection / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Key takeaway, milestone note, or emergency context..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white placeholder-neutral-600 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-neutral-950 transition-all shadow-md disabled:opacity-50 ${
                isMinimumTime
                  ? 'bg-amber-500 hover:bg-amber-400'
                  : 'bg-emerald-500 hover:bg-emerald-400'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'Recording...'
                  : isMinimumTime
                  ? 'Log 5 min Minimum Time (+10 Pts)'
                  : `Log Full Session (+100 Pts)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
