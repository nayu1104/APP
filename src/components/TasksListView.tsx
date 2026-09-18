import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  Repeat,
  CheckCircle2,
  Circle,
  ExternalLink,
  Target,
  Pause,
  Play,
  Trash2,
  Sparkles,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { api } from '../api';

interface TasksListViewProps {
  tasks: Task[];
  onCommitFocus: (taskId: number) => Promise<void>;
  onRefreshTasks: () => Promise<void>;
  onOpenIntake: () => void;
  todayCommittedTaskId?: number;
}

export const TasksListView: React.FC<TasksListViewProps> = ({
  tasks,
  onCommitFocus,
  onRefreshTasks,
  onOpenIntake,
  todayCommittedTaskId,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'done'>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState<{ [taskId: number]: string }>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  const handleToggleMilestone = async (milestoneId: number) => {
    try {
      await api.toggleMilestone(milestoneId);
      await onRefreshTasks();
    } catch (err) {
      console.error('Error toggling milestone:', err);
    }
  };

  const handleAddMilestone = async (taskId: number) => {
    const title = newMilestoneTitle[taskId]?.trim();
    if (!title) return;
    try {
      const currentTask = tasks.find((t) => t.id === taskId);
      const nextOrder = (currentTask?.milestones.length || 0) + 1;
      const res = await fetch(`/api/tasks/${taskId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, step_order: nextOrder }),
      });
      if (res.ok) {
        setNewMilestoneTitle((prev) => ({ ...prev, [taskId]: '' }));
        await onRefreshTasks();
      }
    } catch (err) {
      console.error('Error adding milestone:', err);
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: TaskStatus) => {
    setActionLoading(taskId);
    try {
      await api.updateTask(taskId, { status: newStatus });
      await onRefreshTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Delete this task and all its associated logs/milestones?')) return;
    setActionLoading(taskId);
    try {
      await api.deleteTask(taskId);
      await onRefreshTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-4 w-4 text-amber-400" />;
      case 'project':
        return <Layers className="h-4 w-4 text-sky-400" />;
      case 'habit':
        return <Repeat className="h-4 w-4 text-emerald-400" />;
      default:
        return <Target className="h-4 w-4 text-neutral-400" />;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Task Pipeline</h1>
          <p className="text-xs font-mono text-neutral-400 mt-0.5">
            Your committed repository of courses, projects, and deliberate practices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Chips */}
          <div className="flex rounded-xl bg-neutral-900 border border-neutral-800 p-1 text-xs font-mono">
            {(['all', 'active', 'paused', 'done'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-lg px-2.5 py-1 uppercase transition-colors ${
                  filterStatus === s
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenIntake}
            className="flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 p-12 text-center">
          <p className="text-sm font-mono text-neutral-400">No tasks found matching filter: "{filterStatus}".</p>
          <button
            onClick={onOpenIntake}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create a new goal now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const isCommittedToday = task.id === todayCommittedTaskId;
            const isExpanded = expandedTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`rounded-2xl border transition-all ${
                  isCommittedToday
                    ? 'border-amber-500/80 bg-neutral-900/90 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                    : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700/80'
                }`}
              >
                <div className="p-5">
                  {/* Top row: Priority, Type, Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-neutral-950 border border-neutral-800 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-400">
                        P{task.importance}
                      </span>
                      <span className="flex items-center gap-1 rounded-lg bg-neutral-950 border border-neutral-800 px-2 py-0.5 text-[11px] font-mono uppercase text-neutral-400">
                        {getTaskIcon(task.task_type)}
                        <span>{task.task_type}</span>
                      </span>
                      {isCommittedToday && (
                        <span className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 uppercase">
                          ★ Today's Focus
                        </span>
                      )}
                      {task.is_blocked && (
                        <span className="flex items-center gap-1 rounded-lg bg-red-950/60 border border-red-900 px-2 py-0.5 text-[10px] font-mono text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          <span>Blocked</span>
                        </span>
                      )}
                    </div>

                    {/* Quick status button */}
                    <div className="flex items-center gap-2">
                      {task.status === 'active' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'paused')}
                          disabled={actionLoading === task.id}
                          className="text-[11px] font-mono text-neutral-500 hover:text-neutral-300 p-1 flex items-center gap-1"
                          title="Pause Task"
                        >
                          <Pause className="h-3 w-3" />
                          <span>Pause</span>
                        </button>
                      )}
                      {task.status === 'paused' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'active')}
                          disabled={actionLoading === task.id}
                          className="text-[11px] font-mono text-amber-400 hover:text-amber-300 p-1 flex items-center gap-1"
                          title="Resume Task"
                        >
                          <Play className="h-3 w-3" />
                          <span>Resume</span>
                        </button>
                      )}
                      {task.status !== 'done' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'done')}
                          disabled={actionLoading === task.id}
                          className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 p-1 flex items-center gap-1"
                          title="Mark Complete"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Done</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={actionLoading === task.id}
                        className="text-neutral-600 hover:text-red-400 transition-colors p-1"
                        title="Delete Task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Task Title & Details */}
                  <div className="mt-3">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {task.name}
                    </h3>
                    {task.why_reason && (
                      <p className="mt-1 text-xs text-neutral-400 italic">
                        "{task.why_reason}"
                      </p>
                    )}
                  </div>

                  {/* Ordinal mission or next step */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-neutral-950/80 p-3 text-xs font-mono border border-neutral-800/80">
                    <div>
                      <span className="text-neutral-500 block text-[10px]">CURRENT MISSION:</span>
                      <span className="text-amber-400 font-bold">{task.next_mission_label}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-neutral-400 text-[11px]">
                        {task.current_position_label}
                      </span>
                      {task.resource_url && (
                        <a
                          href={task.resource_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Link</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {task.total_units && task.total_units > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] font-mono text-neutral-500 mb-1">
                        <span>Progress: {task.completed_units}/{task.total_units} {task.unit_label}</span>
                        <span>{task.progress_pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-950 border border-neutral-800">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${task.progress_pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions & Accordion toggle */}
                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-neutral-800/60">
                    <div className="flex items-center gap-2">
                      {task.status === 'active' && !isCommittedToday && (
                        <button
                          onClick={() => onCommitFocus(task.id)}
                          className="flex items-center gap-1 rounded-xl bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 px-3 py-1.5 text-xs font-mono font-bold text-neutral-200 transition-all shadow-sm"
                        >
                          <Target className="h-3.5 w-3.5" />
                          <span>Set as Today's Focus</span>
                        </button>
                      )}
                    </div>

                    {task.task_type === 'project' && (
                      <button
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="flex items-center gap-1 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
                      >
                        <span>{task.milestones.length} Milestones</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Milestones Section for Projects */}
                {isExpanded && task.task_type === 'project' && (
                  <div className="border-t border-neutral-800 bg-neutral-950/70 p-5 rounded-b-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                        Milestones Breakdown ({task.milestones.filter((m) => m.is_completed === 1).length}/{task.milestones.length} Done)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {task.milestones.map((m) => (
                        <div
                          key={m.id}
                          className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                            m.is_completed === 1
                              ? 'border-neutral-800/60 bg-neutral-900/30 text-neutral-500'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-200'
                          }`}
                        >
                          <button
                            onClick={() => handleToggleMilestone(m.id)}
                            className="text-neutral-400 hover:text-amber-400 transition-colors"
                          >
                            {m.is_completed === 1 ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className={`text-xs font-mono font-medium ${m.is_completed === 1 ? 'line-through text-neutral-500' : 'text-white'}`}>
                              Step {m.step_order}: {m.title}
                            </div>
                            {m.description && (
                              <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                                {m.description}
                              </div>
                            )}
                          </div>
                          {m.completed_date && (
                            <span className="text-[10px] font-mono text-neutral-500">
                              {m.completed_date}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add new milestone inline */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Add next sequential step..."
                        value={newMilestoneTitle[task.id] || ''}
                        onChange={(e) =>
                          setNewMilestoneTitle((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddMilestone(task.id);
                        }}
                        className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none font-mono"
                      />
                      <button
                        onClick={() => handleAddMilestone(task.id)}
                        className="rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-mono font-bold text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
