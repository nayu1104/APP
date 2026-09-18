export type TaskType = 'course' | 'project' | 'habit';
export type TaskStatus = 'active' | 'paused' | 'done';

export interface Milestone {
  id: number;
  task_id: number;
  step_order: number;
  title: string;
  description: string | null;
  is_completed: number;
  completed_date: string | null;
}

export interface Task {
  id: number;
  name: string;
  task_type: TaskType;
  importance: number; // 1 to 5, 1 highest
  why_reason: string | null;
  resource_url: string | null;
  unit_label: string;
  total_units: number | null;
  minutes_per_unit: number;
  prerequisite_task_ids: string | null;
  status: TaskStatus;
  created_at: string;
  completed_units: number;
  progress_pct: number;
  current_position_label: string;
  next_mission_label: string;
  milestones: Milestone[];
  is_blocked: boolean;
  blocked_by_names?: string[];
}

export interface DailyLog {
  id: number;
  date: string;
  task_id: number;
  units_completed: number;
  current_position_label: string | null;
  note: string | null;
  is_emergency?: number;
  minutes_spent?: number;
  shield_delta?: number;
  created_at: string;
  task_name?: string;
  task_type?: TaskType;
  unit_label?: string;
}

export interface User {
  id: number;
  email: string;
  passcode: string;
  display_name: string;
  shield_score: number;
  daily_budget_minutes: number;
}

export interface TodayFocusData {
  date: string;
  is_logged: boolean;
  logged_entry: DailyLog | null;
  committed_task: Task | null;
  recommended_task: Task | null;
  recommendation_reason: string;
  shield_score?: number;
  shield_status?: 'healthy' | 'vulnerable' | 'critical';
}

export interface LogsHistoryData {
  logs: DailyLog[];
  streak: number;
  total_days_logged: number;
  total_units_completed: number;
  shield_score?: number;
  shield_status?: 'healthy' | 'vulnerable' | 'critical';
  shield_threshold?: number;
  emergency_sessions_count?: number;
  protected_days_count?: number;
  user?: User | null;
}

export interface UserSettings {
  daily_budget_minutes: number;
  email: string;
  shield_score?: number;
}

export interface DecomposedMilestone {
  step_order: number;
  title: string;
  description: string;
  est_minutes: number;
}

export interface DecomposeResponse {
  total_units: number;
  unit_label: string;
  milestones: DecomposedMilestone[];
}
