import {
  Task,
  TodayFocusData,
  LogsHistoryData,
  UserSettings,
  DecomposeResponse,
  User,
} from './types';

const AUTH_KEY = 'onefocus_auth_credentials';

export interface StoredAuth {
  email: string;
  passcode: string;
}

export function getStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth | null) {
  if (!auth) {
    localStorage.removeItem(AUTH_KEY);
  } else {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  }
}

function getAuthHeaders(): Record<string, string> {
  const auth = getStoredAuth();
  if (!auth) return {};
  return {
    'x-user-email': auth.email,
    'x-user-passcode': auth.passcode,
  };
}

export const api = {
  // Auth & Multi-Device Sync
  async login(email: string, passcode: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, passcode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sign in');
    setStoredAuth({ email: data.user.email, passcode: data.user.passcode });
    return data.user;
  },

  async generatePasscode(email: string, displayName?: string): Promise<{ user: User; isNew: boolean }> {
    const res = await fetch('/api/auth/generate-passcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, display_name: displayName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate passcode');
    setStoredAuth({ email: data.user.email, passcode: data.user.passcode });
    return data;
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  logout() {
    setStoredAuth(null);
  },

  // Tasks
  async getTasks(): Promise<Task[]> {
    const res = await fetch('/api/tasks', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to load tasks');
    const data = await res.json();
    return data.tasks;
  },

  async createTask(taskData: {
    name: string;
    task_type: 'course' | 'project' | 'habit';
    importance: number;
    why_reason?: string;
    resource_url?: string;
    unit_label?: string;
    total_units?: number | null;
    minutes_per_unit?: number;
    prerequisite_task_ids?: string;
    milestones?: { step_order: number; title: string; description?: string }[];
  }): Promise<Task> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(taskData),
    });
    if (!res.ok) throw new Error('Failed to create task');
    const data = await res.json();
    return data.task;
  },

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(taskData),
    });
    if (!res.ok) throw new Error('Failed to update task');
    const data = await res.json();
    return data.task;
  },

  async deleteTask(id: number): Promise<void> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  async toggleMilestone(id: number): Promise<void> {
    const res = await fetch(`/api/milestones/${id}/toggle`, {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to toggle milestone');
  },

  // Today Focus
  async getTodayFocus(): Promise<TodayFocusData> {
    const res = await fetch('/api/today', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to get today focus');
    return res.json();
  },

  async commitTodayFocus(taskId: number): Promise<TodayFocusData> {
    const res = await fetch('/api/today/commit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ task_id: taskId }),
    });
    if (!res.ok) throw new Error('Failed to commit focus');
    return res.json();
  },

  async logDailyProgress(data: {
    task_id: number;
    units_completed: number;
    current_position_label?: string;
    note?: string;
    date?: string;
    is_emergency?: boolean;
    minutes_spent?: number;
  }): Promise<{
    success: boolean;
    shield_delta: number;
    new_shield_score: number;
    today: TodayFocusData;
    history: LogsHistoryData;
  }> {
    const res = await fetch('/api/today/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to log daily progress');
    return res.json();
  },

  // Logs & History
  async getLogs(): Promise<LogsHistoryData> {
    const res = await fetch('/api/logs', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to fetch logs history');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<UserSettings> {
    const res = await fetch('/api/settings', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to get settings');
    return res.json();
  },

  async updateSettings(dailyBudgetMinutes: number): Promise<UserSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ daily_budget_minutes: dailyBudgetMinutes }),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // AI Routes
  async decomposeProjectWithAI(params: {
    taskName: string;
    whyReason?: string;
    dailyMinutesAvailable?: number;
    importance?: number;
  }): Promise<DecomposeResponse> {
    const res = await fetch('/api/ai/decompose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to decompose project with AI');
    return res.json();
  },

  async getCoachAdvice(params: {
    taskName: string;
    taskType: string;
    whyReason?: string | null;
    currentPosition: string;
    nextMission: string;
    streak: number;
  }): Promise<string> {
    const res = await fetch('/api/ai/coach-advice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to get coach advice');
    const data = await res.json();
    return data.advice;
  },

  async resetData(): Promise<void> {
    const res = await fetch('/api/seed', {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to reset sample data');
  },
};
