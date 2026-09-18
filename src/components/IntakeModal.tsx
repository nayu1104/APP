import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Layers, Plus, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { Task, DecomposedMilestone } from '../types';

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
  existingTasks: Task[];
}

export const IntakeModal: React.FC<IntakeModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  existingTasks,
}) => {
  const [branch, setBranch] = useState<'course' | 'project'>('course');

  // Shared fields
  const [name, setName] = useState('');
  const [importance, setImportance] = useState<number>(1);
  const [whyReason, setWhyReason] = useState('');
  const [prerequisiteId, setPrerequisiteId] = useState<string>('');

  // Branch A fields (Course)
  const [resourceUrl, setResourceUrl] = useState('');
  const [unitLabel, setUnitLabel] = useState('lectures');
  const [totalUnits, setTotalUnits] = useState<number | ''>(100);
  const [minutesPerUnit, setMinutesPerUnit] = useState<number>(45);

  // Branch B fields (Project / Unstructured)
  const [dailyMinutes, setDailyMinutes] = useState<number>(60);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [milestones, setMilestones] = useState<DecomposedMilestone[]>([]);
  const [hasDecomposed, setHasDecomposed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Trigger Gemini decomposition
  const handleDecomposeWithAI = async () => {
    if (!name.trim()) {
      setError('Please provide a task or project name first before decomposing with AI.');
      return;
    }
    setIsDecomposing(true);
    setError(null);
    try {
      const result = await api.decomposeProjectWithAI({
        taskName: name.trim(),
        whyReason: whyReason.trim(),
        dailyMinutesAvailable: Number(dailyMinutes) || 60,
        importance: Number(importance) || 2,
      });

      setMilestones(result.milestones || []);
      setHasDecomposed(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI Decomposition failed');
    } finally {
      setIsDecomposing(false);
    }
  };

  const addManualMilestone = () => {
    const nextOrder = milestones.length + 1;
    setMilestones([
      ...milestones,
      {
        step_order: nextOrder,
        title: `Milestone ${nextOrder}`,
        description: '',
        est_minutes: dailyMinutes || 60,
      },
    ]);
  };

  const removeMilestone = (index: number) => {
    const updated = milestones.filter((_, idx) => idx !== index);
    // Reindex
    updated.forEach((m, idx) => {
      m.step_order = idx + 1;
    });
    setMilestones(updated);
  };

  const updateMilestone = (index: number, field: keyof DecomposedMilestone, value: string | number) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (branch === 'course') {
        const created = await api.createTask({
          name: name.trim(),
          task_type: 'course',
          importance: Number(importance),
          why_reason: whyReason.trim() || undefined,
          resource_url: resourceUrl.trim() || undefined,
          unit_label: unitLabel.trim() || 'lectures',
          total_units: totalUnits ? Number(totalUnits) : null,
          minutes_per_unit: Number(minutesPerUnit) || 30,
          prerequisite_task_ids: prerequisiteId ? prerequisiteId : undefined,
        });
        onTaskCreated(created);
      } else {
        // Project
        let projectMilestones = milestones;
        if (projectMilestones.length === 0) {
          // If user didn't hit decompose, provide initial standard milestone
          projectMilestones = [
            {
              step_order: 1,
              title: `Initial scope & setup for ${name}`,
              description: whyReason || 'Define initial foundation and first deliverable.',
              est_minutes: dailyMinutes || 60,
            },
          ];
        }

        const created = await api.createTask({
          name: name.trim(),
          task_type: 'project',
          importance: Number(importance),
          why_reason: whyReason.trim() || undefined,
          resource_url: resourceUrl.trim() || undefined,
          unit_label: 'milestones',
          total_units: projectMilestones.length,
          minutes_per_unit: Number(dailyMinutes) || 60,
          prerequisite_task_ids: prerequisiteId ? prerequisiteId : undefined,
          milestones: projectMilestones.map((m) => ({
            step_order: m.step_order,
            title: m.title,
            description: m.description,
          })),
        });
        onTaskCreated(created);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Intake Workflow
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
              What do you want to work on?
            </h2>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              Commit to ONE goal at a time. Define either a structured curriculum or decompose a complex project.
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
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-950/50 border border-red-800/80 p-3 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Branch Selector Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setBranch('course')}
            className={`flex flex-col items-start rounded-xl p-4 border transition-all text-left ${
              branch === 'course'
                ? 'border-amber-500/80 bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <BookOpen className={`h-4 w-4 ${branch === 'course' ? 'text-amber-400' : 'text-neutral-400'}`} />
              <span>Branch A: Structured Course</span>
            </div>
            <p className="text-[11px] font-mono mt-1 text-neutral-400 leading-snug">
              YouTube playlist, textbook, MOOC with numbered chapters or lectures. Tracks exact ordinal progress.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setBranch('project')}
            className={`flex flex-col items-start rounded-xl p-4 border transition-all text-left ${
              branch === 'project'
                ? 'border-amber-500/80 bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Layers className={`h-4 w-4 ${branch === 'project' ? 'text-amber-400' : 'text-neutral-400'}`} />
              <span>Branch B: Unstructured Project</span>
            </div>
            <p className="text-[11px] font-mono mt-1 text-neutral-400 leading-snug">
              Building an app, research, gym routine. Gemini AI breaks it down into sequential bite-sized milestones.
            </p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Task Name */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1.5">
              {branch === 'course' ? 'Course / Curriculum Title' : 'Project / Goal Name'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                branch === 'course'
                  ? 'e.g., CS229: Machine Learning (Stanford) or Real Analysis'
                  : 'e.g., Build SQLite Flask Application MVP or 1000lb Club'
              }
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Importance (1-5) & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1.5">
                Priority Rank (1 to 5) *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setImportance(level)}
                    className={`flex-1 rounded-xl py-2 text-xs font-mono font-bold transition-all border ${
                      importance === level
                        ? 'bg-amber-500 border-amber-400 text-neutral-950 shadow-sm'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    P{level}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[10px] font-mono text-neutral-400">
                1 = Absolute highest urgency / primary focus; 5 = Low urgency.
              </p>
            </div>

            {/* Optional Prerequisite Task */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1.5">
                Prerequisite Dependency (Optional)
              </label>
              <select
                value={prerequisiteId}
                onChange={(e) => setPrerequisiteId(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs font-mono text-neutral-300 focus:border-amber-500 focus:outline-none"
              >
                <option value="">None (Independent task)</option>
                {existingTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    Blocked until: {t.name} (P{t.importance})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Why Reason */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1.5">
              Why are you doing this? (Core Motivation)
            </label>
            <input
              type="text"
              value={whyReason}
              onChange={(e) => setWhyReason(e.target.value)}
              placeholder="e.g., Master mathematical ML foundations to lead production AI initiatives."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* BRANCH A SPECIFIC INPUTS */}
          {branch === 'course' && (
            <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/60 p-4 space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1.5">
                  Resource URL (YouTube playlist, Coursera link, etc.)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    placeholder="https://www.youtube.com/playlist?list=..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-3.5 pr-8 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                  <ExternalLink className="absolute right-3 top-2.5 h-4 w-4 text-neutral-600 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1.5">
                    Unit Label
                  </label>
                  <input
                    type="text"
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    placeholder="lectures, exercises"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1.5">
                    Total Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalUnits}
                    onChange={(e) => setTotalUnits(e.target.value ? parseInt(e.target.value, 10) : '')}
                    placeholder="e.g. 144"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1.5">
                    Est. Min / Unit
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={minutesPerUnit}
                    onChange={(e) => setMinutesPerUnit(parseInt(e.target.value, 10) || 30)}
                    placeholder="e.g. 45"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Ordinal Tracking Preview */}
              <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3 text-xs font-mono text-amber-400/90">
                <span className="text-neutral-500 font-semibold">ORDINAL RULE: </span>
                If you have completed 10 {unitLabel}, the app will explicitly command:
                <div className="text-white mt-1 font-bold">
                  "You are on {unitLabel.replace(/s$/, '')} 10. Today's mission: Complete {unitLabel.replace(/s$/, '')} 11."
                </div>
              </div>
            </div>
          )}

          {/* BRANCH B SPECIFIC INPUTS (Unstructured Project) */}
          {branch === 'project' && (
            <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/60 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                    Estimated Daily Minutes Available
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={dailyMinutes}
                    onChange={(e) => setDailyMinutes(parseInt(e.target.value, 10) || 60)}
                    className="mt-1 w-32 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Gemini AI Decompose Trigger Button */}
                <button
                  type="button"
                  id="btn-ai-decompose"
                  disabled={isDecomposing || !name.trim()}
                  onClick={handleDecomposeWithAI}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-neutral-950 hover:brightness-110 active:scale-95 transition-all shadow-md disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isDecomposing ? 'Decomposing with Gemini...' : 'Decompose with Gemini AI'}</span>
                </button>
              </div>

              {/* Milestones Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                    Sequenced Project Milestones ({milestones.length})
                  </span>
                  <button
                    type="button"
                    onClick={addManualMilestone}
                    className="flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Step</span>
                  </button>
                </div>

                {milestones.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-800 p-6 text-center text-xs font-mono text-neutral-500">
                    Click <span className="text-amber-400 font-bold">"Decompose with Gemini AI"</span> to automatically sequence your goal into actionable 4–8 daily milestones, or add steps manually.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-xs"
                      >
                        <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[10px] text-amber-400 font-bold">
                          #{m.step_order}
                        </span>
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                            placeholder="Milestone title"
                            className="w-full bg-transparent font-medium text-white focus:outline-none border-b border-transparent focus:border-amber-500/50 pb-0.5"
                          />
                          <input
                            type="text"
                            value={m.description || ''}
                            onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                            placeholder="Deliverable description..."
                            className="w-full bg-transparent text-[11px] font-mono text-neutral-400 focus:outline-none"
                          />
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className="text-[10px] font-mono text-neutral-500">{m.est_minutes}m</span>
                          <button
                            type="button"
                            onClick={() => removeMilestone(idx)}
                            className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
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
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Saving...' : 'Add to Pipeline'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
