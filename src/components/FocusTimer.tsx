import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Zap, Shield, CheckCircle2 } from 'lucide-react';

interface FocusTimerProps {
  defaultMinutes?: number;
  taskName: string;
  onLogWithTime?: (minutes: number, isEmergency?: boolean) => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  defaultMinutes = 50,
  taskName,
  onLogWithTime,
}) => {
  // Only ONE choice: Normal full session (defaultMinutes, e.g. 50m) OR Minimum Time (5m)
  const [isMinimumTime, setIsMinimumTime] = useState(false);
  const targetMinutes = isMinimumTime ? 5 : defaultMinutes;

  const [secondsLeft, setSecondsLeft] = useState(targetMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync if target minutes change and timer is paused
  useEffect(() => {
    if (!isActive) {
      setSecondsLeft(targetMinutes * 60);
    }
  }, [targetMinutes, isActive]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Chime sound upon completion
            if (soundEnabled) {
              try {
                const audioCtx = new (window.AudioContext ||
                  (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
                osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.6);
              } catch {
                // AudioContext unavailable or blocked
              }
            }
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, soundEnabled]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(targetMinutes * 60);
  };

  const handleToggleMinimumTime = () => {
    setIsActive(false);
    const nextState = !isMinimumTime;
    setIsMinimumTime(nextState);
    setSecondsLeft((nextState ? 5 : defaultMinutes) * 60);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const totalTargetSecs = targetMinutes * 60;
  const progressPercent = totalTargetSecs > 0
    ? Math.min(100, Math.round(((totalTargetSecs - secondsLeft) / totalTargetSecs) * 100))
    : 0;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2">
          {isMinimumTime ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-mono text-amber-300 font-bold">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              MINIMUM TIME (5 MIN) • STREAK SAVER
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono text-emerald-400 font-bold">
              🎯 STANDARD TASK ({defaultMinutes} MIN)
            </span>
          )}
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          title={soundEnabled ? 'Chime sound enabled' : 'Sound muted'}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-neutral-600" />}
        </button>
      </div>

      {/* The Single Option: Minimum Time (5 min) Toggle */}
      <div className="mt-4">
        <button
          type="button"
          id="btn-toggle-minimum-time"
          onClick={handleToggleMinimumTime}
          className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
            isMinimumTime
              ? 'border-amber-500/60 bg-amber-500/15 text-white shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              : 'border-neutral-800 bg-neutral-950/70 text-neutral-300 hover:border-amber-500/40 hover:bg-neutral-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              isMinimumTime ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-amber-400'
            }`}>
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Can't do {defaultMinutes} min? Do Minimum Time (5 min)</span>
                {isMinimumTime && (
                  <span className="rounded bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.2 font-mono font-semibold">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-neutral-400">
                {isMinimumTime
                  ? 'Keeps your streak alive and earns +10 Shield points (10% pace)'
                  : 'Emergency option: complete just 5 min to keep your streak alive'}
              </div>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-amber-400 shrink-0 ml-2">
            {isMinimumTime ? 'Switch back to 50 min →' : 'Switch to 5 min →'}
          </span>
        </button>
      </div>

      {/* Timer Display */}
      <div className="py-5 flex flex-col items-center justify-center">
        <div className="font-mono text-5xl sm:text-6xl font-extrabold tracking-wider text-white select-none">
          {formattedTime}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full max-w-xs">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className={`h-full transition-all duration-500 ${
                isMinimumTime ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] font-mono text-neutral-500">
            <span>{Math.floor((totalTargetSecs - secondsLeft) / 60)}m done</span>
            <span>{targetMinutes}m target ({isMinimumTime ? '+10 Shield pts' : '+100 Shield pts'})</span>
          </div>
        </div>

        <div className="mt-2 text-xs font-mono text-neutral-400 text-center truncate max-w-sm">
          Locked onto: <span className="text-neutral-200">{taskName}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          id="btn-timer-toggle"
          onClick={toggleTimer}
          className={`flex items-center gap-2 rounded-xl px-7 py-2.5 text-sm font-bold transition-all active:scale-95 shadow-md ${
            isActive
              ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700'
              : isMinimumTime
              ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400'
              : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
          }`}
        >
          {isActive ? (
            <>
              <Pause className="h-4 w-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>{isMinimumTime ? 'Start 5m Minimum Time' : `Start ${defaultMinutes}m Focus`}</span>
            </>
          )}
        </button>

        <button
          id="btn-timer-reset"
          onClick={resetTimer}
          className="rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
          title="Reset Timer"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {onLogWithTime && (
          <button
            onClick={() => onLogWithTime(targetMinutes, isMinimumTime)}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs font-mono text-amber-400 hover:border-amber-500/50 hover:text-amber-300 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Log Finished</span>
          </button>
        )}
      </div>

      {/* Streak Protection Callout */}
      <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
        <span className="flex items-center gap-1 text-neutral-400">
          <Shield className="h-3.5 w-3.5 text-amber-400" />
          {isMinimumTime ? (
            <span className="text-amber-300 font-semibold">Minimum Time saves your streak & awards +10 Shield points</span>
          ) : (
            <span>Full {defaultMinutes}m session awards +100 Shield points</span>
          )}
        </span>
      </div>
    </div>
  );
};
