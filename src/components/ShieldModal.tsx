import React from 'react';
import { X, Shield, ShieldAlert, ShieldCheck, Zap } from 'lucide-react';

interface ShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  shieldScore: number;
  shieldStatus?: 'healthy' | 'vulnerable' | 'critical';
  streak: number;
}

export const ShieldModal: React.FC<ShieldModalProps> = ({
  isOpen,
  onClose,
  shieldScore,
  shieldStatus = 'healthy',
  streak,
}) => {
  if (!isOpen) return null;

  const score = Math.round(shieldScore * 10) / 10;
  const isHealthy = score >= 70;
  const isVulnerable = score >= 30 && score < 70;
  const isCritical = score < 30;

  // Potential penalty if a day is missed
  const penalty = Math.round(score * 0.30 * 10) / 10;
  const scoreAfterMiss = Math.max(0, Math.round((score - penalty) * 10) / 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
              isHealthy
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : isVulnerable
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {isHealthy ? (
                <ShieldCheck className="h-5 w-5" />
              ) : isVulnerable ? (
                <Shield className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Streak Defense System
              </span>
              <h2 className="text-xl font-bold text-white">Shield Score & Protection</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Status Banner */}
        <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase text-neutral-400">Current Shield Score</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-white">{score}</span>
                <span className="text-xs font-mono text-neutral-400">pts</span>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-bold ${
                isHealthy
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : isVulnerable
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {isHealthy ? '● SHIELD ACTIVE' : isVulnerable ? '▲ VULNERABLE' : '✖ CRITICAL'}
              </span>
              <div className="mt-1 text-[11px] font-mono text-neutral-400">
                Threshold: 30 pts
              </div>
            </div>
          </div>

          {/* Progress gauge */}
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className={`h-full transition-all ${
                  isHealthy ? 'bg-emerald-400' : isVulnerable ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, (score / 150) * 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-mono text-neutral-500">
              <span>0 (Streak Loss)</span>
              <span>30 (Min Defense Reserve)</span>
              <span>150+ (Fortified)</span>
            </div>
          </div>
        </div>

        {/* Streak Protection Simulation */}
        <div className="mt-4 rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-neutral-200">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>Active Streak Status: {streak} Days</span>
          </div>
          <p className="mt-1.5 text-xs text-neutral-300 leading-relaxed">
            {score >= 30 ? (
              <>
                Your shield can absorb an emergency missed day. If you cannot focus tomorrow, your shield will absorb the blow with a <strong className="text-amber-400">30% penalty (-{penalty} pts)</strong>, leaving you with <strong>{scoreAfterMiss} pts</strong> and <strong className="text-emerald-400">saving your {streak}-day streak</strong>.
              </>
            ) : (
              <>
                <strong className="text-rose-400">Warning:</strong> Your shield is below the 30-point threshold. If you miss a day without logging, <strong className="text-rose-300">your {streak}-day streak will be lost!</strong> Complete today's focus with Main Time (or Minimum Time) to recharge.
              </>
            )}
          </p>
        </div>

        {/* Shield Mechanics Card */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-mono uppercase text-neutral-400 font-bold">How the Shield Score Operates</div>
          
          <div className="space-y-2 text-xs font-mono">
            {/* Rule 1: Full Session */}
            <div className="flex items-start gap-2.5 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                +100
              </span>
              <div>
                <span className="font-bold text-neutral-200">Full Focus Session (50 min):</span>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Completing your standard daily assigned session (~50 min) yields +100 Shield Score points.
                </p>
              </div>
            </div>

            {/* Rule 2: Minimum Time Streak Saver */}
            <div className="flex items-start gap-2.5 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                +10
              </span>
              <div>
                <span className="font-bold text-neutral-200">Emergency Minimum Time (5 min):</span>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Can't do 50 min? Complete just 5 min. It keeps your daily streak alive and earns <strong className="text-amber-400">+10 Shield points</strong>!
                </p>
              </div>
            </div>

            {/* Rule 3: Missed Task */}
            <div className="flex items-start gap-2.5 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                -30%
              </span>
              <div>
                <span className="font-bold text-neutral-200">Missed Day & Streak Defense:</span>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  If you miss a day, the shield burns 30% of your total score to protect your streak. If your score falls below 30%, the shield breaks and your streak is lost.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-neutral-800 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-700 transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
