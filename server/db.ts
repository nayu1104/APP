import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

// Database file path in root directory
const DB_PATH = path.resolve(process.cwd(), 'onefocus.db');

export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables and migrations
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  passcode TEXT NOT NULL,
  display_name TEXT,
  shield_score REAL DEFAULT 120.0,
  daily_budget_minutes INTEGER DEFAULT 180,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  task_type TEXT NOT NULL, -- 'course' | 'project' | 'habit'
  importance INTEGER NOT NULL, -- 1 to 5 (1 is highest priority)
  why_reason TEXT,
  resource_url TEXT,
  unit_label TEXT DEFAULT 'units',
  total_units INTEGER,
  minutes_per_unit INTEGER DEFAULT 30,
  prerequisite_task_ids TEXT,
  status TEXT DEFAULT 'active', -- 'active' | 'paused' | 'done'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT 0,
  completed_date DATE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL DEFAULT 1,
  date DATE NOT NULL,
  task_id INTEGER NOT NULL,
  units_completed REAL NOT NULL,
  current_position_label TEXT,
  note TEXT,
  is_emergency INTEGER DEFAULT 0,
  minutes_spent INTEGER DEFAULT 45,
  shield_delta REAL DEFAULT 100.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_focus (
  user_id INTEGER NOT NULL DEFAULT 1,
  date DATE NOT NULL,
  task_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER DEFAULT 1,
  daily_budget_minutes INTEGER DEFAULT 180,
  email TEXT,
  password_hash TEXT
);
`);

// Ensure default user exists (Nayan)
const defaultUserCheck = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (defaultUserCheck.count === 0) {
  db.prepare(`
    INSERT INTO users (id, email, passcode, display_name, shield_score, daily_budget_minutes)
    VALUES (1, 'nayanparmar1104@gmail.com', '582914', 'Nayan', 120.0, 180)
  `).run();
}

// Ensure columns in tasks if table was created in earlier schema
try {
  const taskCols = db.prepare('PRAGMA table_info(tasks)').all() as { name: string }[];
  if (!taskCols.some(c => c.name === 'user_id')) {
    db.exec('ALTER TABLE tasks ADD COLUMN user_id INTEGER DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE;');
  }
} catch {
  // column already exists
}

// Ensure columns in daily_logs if needed
try {
  const logCols = db.prepare('PRAGMA table_info(daily_logs)').all() as { name: string }[];
  if (!logCols.some(c => c.name === 'user_id')) {
    db.exec('ALTER TABLE daily_logs ADD COLUMN user_id INTEGER DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE;');
  }
  if (!logCols.some(c => c.name === 'is_emergency')) {
    db.exec('ALTER TABLE daily_logs ADD COLUMN is_emergency INTEGER DEFAULT 0;');
  }
  if (!logCols.some(c => c.name === 'minutes_spent')) {
    db.exec('ALTER TABLE daily_logs ADD COLUMN minutes_spent INTEGER DEFAULT 45;');
  }
  if (!logCols.some(c => c.name === 'shield_delta')) {
    db.exec('ALTER TABLE daily_logs ADD COLUMN shield_delta REAL DEFAULT 100.0;');
  }
} catch {
  // columns already exist
}

// Interfaces
export interface UserRecord {
  id: number;
  email: string;
  passcode: string;
  display_name: string;
  shield_score: number;
  daily_budget_minutes: number;
  created_at: string;
}

export interface TaskRecord {
  id: number;
  user_id: number;
  name: string;
  task_type: 'course' | 'project' | 'habit';
  importance: number;
  why_reason: string | null;
  resource_url: string | null;
  unit_label: string;
  total_units: number | null;
  minutes_per_unit: number;
  prerequisite_task_ids: string | null;
  status: 'active' | 'paused' | 'done';
  created_at: string;
}

export interface MilestoneRecord {
  id: number;
  task_id: number;
  step_order: number;
  title: string;
  description: string | null;
  is_completed: number;
  completed_date: string | null;
}

export interface DailyLogRecord {
  id: number;
  user_id: number;
  date: string;
  task_id: number;
  units_completed: number;
  current_position_label: string | null;
  note: string | null;
  is_emergency: number;
  minutes_spent: number;
  shield_delta: number;
  created_at: string;
  task_name?: string;
  task_type?: string;
  unit_label?: string;
}

export interface TaskWithProgress extends TaskRecord {
  completed_units: number;
  progress_pct: number;
  current_position_label: string;
  next_mission_label: string;
  milestones: MilestoneRecord[];
  is_blocked: boolean;
  blocked_by_names?: string[];
}

// Helper to get formatted local date (YYYY-MM-DD)
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateRandomPasscode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// User & Auth queries
export function getUserById(id: number): UserRecord | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRecord | undefined;
  return row || null;
}

export function getUserByEmail(email: string): UserRecord | null {
  const normalized = email.trim().toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?').get(normalized) as UserRecord | undefined;
  return row || null;
}

export function loginUser(email: string, passcode: string): UserRecord {
  const normalized = email.trim().toLowerCase();
  const cleanPasscode = passcode.trim();
  const user = getUserByEmail(normalized);

  if (!user) {
    throw new Error('No account found for this email. Click "Generate Passcode" to create your account.');
  }

  if (user.passcode !== cleanPasscode) {
    throw new Error('Invalid passcode. Please check the 6-digit code or generate a new one.');
  }

  return user;
}

export function generateOrResetPasscode(email: string, displayName?: string): { user: UserRecord; isNew: boolean } {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  const existing = getUserByEmail(normalized);
  const newPasscode = generateRandomPasscode();

  if (existing) {
    db.prepare('UPDATE users SET passcode = ? WHERE id = ?').run(newPasscode, existing.id);
    const updated = getUserById(existing.id)!;
    return { user: updated, isNew: false };
  }

  // Create new user
  const name = displayName || normalized.split('@')[0];
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  
  db.prepare(`
    INSERT INTO users (email, passcode, display_name, shield_score, daily_budget_minutes)
    VALUES (?, ?, ?, 100.0, 180)
  `).run(normalized, newPasscode, capitalizedName);

  const row = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
  const newUser = getUserById(row.id)!;

  // Seed sample starter tasks for new user
  seedInitialData(newUser.id);

  return { user: newUser, isNew: true };
}

// Task queries (scoped to user)
export function getAllTasks(userId: number = 1): TaskWithProgress[] {
  const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY status ASC, importance ASC, id ASC').all(userId) as unknown as TaskRecord[];
  const allLogs = db.prepare('SELECT task_id, SUM(units_completed) as total_completed FROM daily_logs WHERE user_id = ? GROUP BY task_id').all(userId) as unknown as { task_id: number; total_completed: number }[];
  const logsMap = new Map<number, number>();
  for (const l of allLogs) {
    logsMap.set(l.task_id, Number(l.total_completed) || 0);
  }

  const taskIds = tasks.map(t => t.id);
  let allMilestones: MilestoneRecord[] = [];
  if (taskIds.length > 0) {
    allMilestones = db.prepare('SELECT * FROM task_milestones ORDER BY task_id ASC, step_order ASC').all() as unknown as MilestoneRecord[];
  }
  
  const milestonesMap = new Map<number, MilestoneRecord[]>();
  for (const m of allMilestones) {
    const list = milestonesMap.get(m.task_id) || [];
    list.push(m);
    milestonesMap.set(m.task_id, list);
  }

  const tasksMap = new Map<number, TaskRecord>();
  for (const t of tasks) {
    tasksMap.set(t.id, t);
  }

  return tasks.map(task => {
    const taskMilestones = milestonesMap.get(task.id) || [];
    let completedUnits = 0;
    let totalUnits = task.total_units;
    let currentPosition = '';
    let nextMission = '';

    if (task.task_type === 'project') {
      const completedCount = taskMilestones.filter(m => m.is_completed === 1).length;
      completedUnits = completedCount;
      if (!totalUnits || totalUnits < taskMilestones.length) {
        totalUnits = taskMilestones.length;
      }
      const nextMilestone = taskMilestones.find(m => m.is_completed === 0);
      if (nextMilestone) {
        currentPosition = `Step ${completedCount} of ${totalUnits} completed`;
        nextMission = `Step ${nextMilestone.step_order}: ${nextMilestone.title}`;
      } else if (taskMilestones.length > 0) {
        currentPosition = `All ${taskMilestones.length} milestones complete`;
        nextMission = 'Project finished. Ready to mark as done.';
      } else {
        currentPosition = 'No milestones defined';
        nextMission = 'Decompose project with AI';
      }
    } else if (task.task_type === 'course') {
      completedUnits = logsMap.get(task.id) || 0;
      const unitLabelSingular = (task.unit_label || 'lecture').replace(/s$/, '');
      const unitLabelPlural = task.unit_label || 'lectures';
      
      if (completedUnits === 0) {
        currentPosition = `Starting point`;
        nextMission = `Complete ${unitLabelSingular} 1`;
      } else {
        currentPosition = `You are on ${unitLabelSingular} ${completedUnits}`;
        const nextNumber = Math.floor(completedUnits) + 1;
        if (totalUnits && nextNumber > totalUnits) {
          nextMission = `Course curriculum complete (${totalUnits}/${totalUnits} ${unitLabelPlural})`;
        } else {
          nextMission = `Complete ${unitLabelSingular} ${nextNumber}`;
        }
      }
    } else {
      // Habit
      completedUnits = logsMap.get(task.id) || 0;
      currentPosition = `${completedUnits} sessions logged`;
      nextMission = `Complete today's ${task.unit_label || 'session'}`;
    }

    const progressPct = totalUnits && totalUnits > 0
      ? Math.min(100, Math.round((completedUnits / totalUnits) * 100))
      : 0;

    // Check prerequisites
    let isBlocked = false;
    const blockedByNames: string[] = [];
    if (task.prerequisite_task_ids && task.prerequisite_task_ids.trim().length > 0) {
      const prereqIds = task.prerequisite_task_ids.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      for (const pId of prereqIds) {
        const prereqTask = tasksMap.get(pId);
        if (prereqTask && prereqTask.status !== 'done') {
          isBlocked = true;
          blockedByNames.push(prereqTask.name);
        }
      }
    }

    return {
      ...task,
      completed_units: completedUnits,
      total_units: totalUnits,
      progress_pct: progressPct,
      current_position_label: currentPosition,
      next_mission_label: nextMission,
      milestones: taskMilestones,
      is_blocked: isBlocked,
      blocked_by_names: blockedByNames,
    };
  });
}

export function getTaskById(id: number, userId: number = 1): TaskWithProgress | null {
  const all = getAllTasks(userId);
  return all.find(t => t.id === id) || null;
}

export function createTask(data: {
  name: string;
  task_type: 'course' | 'project' | 'habit';
  importance: number;
  why_reason?: string;
  resource_url?: string;
  unit_label?: string;
  total_units?: number | null;
  minutes_per_unit?: number;
  prerequisite_task_ids?: string;
}, userId: number = 1): number {
  const stmt = db.prepare(`
    INSERT INTO tasks (
      user_id, name, task_type, importance, why_reason, resource_url,
      unit_label, total_units, minutes_per_unit, prerequisite_task_ids, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);
  
  stmt.run(
    userId,
    data.name,
    data.task_type,
    data.importance,
    data.why_reason || null,
    data.resource_url || null,
    data.unit_label || 'units',
    data.total_units !== undefined ? data.total_units : null,
    data.minutes_per_unit || 30,
    data.prerequisite_task_ids || null
  );

  const lastId = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
  return lastId.id;
}

export function updateTask(id: number, data: Partial<TaskRecord>, userId: number = 1): boolean {
  const fields: string[] = [];
  const values: unknown[] = [];

  const allowed = [
    'name', 'task_type', 'importance', 'why_reason', 'resource_url',
    'unit_label', 'total_units', 'minutes_per_unit', 'prerequisite_task_ids', 'status'
  ];

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push((data as Record<string, unknown>)[key]);
    }
  }

  if (fields.length === 0) return false;

  values.push(id, userId);
  const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
  db.prepare(sql).run(...(values as (string | number | null)[]));
  return true;
}

export function deleteTask(id: number, userId: number = 1): boolean {
  db.prepare('DELETE FROM task_milestones WHERE task_id = ?').run(id);
  db.prepare('DELETE FROM daily_logs WHERE task_id = ? AND user_id = ?').run(id, userId);
  db.prepare('DELETE FROM daily_focus WHERE task_id = ? AND user_id = ?').run(id, userId);
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, userId);
  return true;
}

// Milestone queries
export function addMilestones(taskId: number, milestones: { step_order: number; title: string; description?: string }[]) {
  const insert = db.prepare(`
    INSERT INTO task_milestones (task_id, step_order, title, description, is_completed)
    VALUES (?, ?, ?, ?, 0)
  `);
  for (const m of milestones) {
    insert.run(taskId, m.step_order, m.title, m.description || null);
  }
}

export function toggleMilestone(id: number): boolean {
  const current = db.prepare('SELECT is_completed, task_id FROM task_milestones WHERE id = ?').get() as { is_completed: number; task_id: number } | undefined;
  if (!current) return false;
  const newStatus = current.is_completed === 1 ? 0 : 1;
  const completedDate = newStatus === 1 ? getTodayDateString() : null;
  db.prepare('UPDATE task_milestones SET is_completed = ?, completed_date = ? WHERE id = ?').run(newStatus, completedDate, id);
  return true;
}

export function deleteMilestone(id: number): boolean {
  db.prepare('DELETE FROM task_milestones WHERE id = ?').run(id);
  return true;
}

// Daily focus & daily logs queries (scoped to user)
export function getTodayFocus(userId: number = 1): {
  date: string;
  is_logged: boolean;
  logged_entry: DailyLogRecord | null;
  committed_task: TaskWithProgress | null;
  recommended_task: TaskWithProgress | null;
  recommendation_reason: string;
  shield_score: number;
  shield_status: 'healthy' | 'vulnerable' | 'critical';
} {
  const today = getTodayDateString();
  const allTasks = getAllTasks(userId);
  const activeTasks = allTasks.filter(t => t.status === 'active');
  const user = getUserById(userId);
  const shieldScore = user ? user.shield_score : 100.0;

  // Check if already logged for today
  const existingLog = db.prepare(`
    SELECT dl.*, t.name as task_name, t.task_type, t.unit_label
    FROM daily_logs dl
    JOIN tasks t ON dl.task_id = t.id
    WHERE dl.user_id = ? AND dl.date = ?
  `).get(userId, today) as DailyLogRecord | undefined;

  // Check if committed in daily_focus
  const focusEntry = db.prepare('SELECT task_id FROM daily_focus WHERE user_id = ? AND date = ?').get(userId, today) as { task_id: number } | undefined;
  let committedTask: TaskWithProgress | null = null;
  if (focusEntry) {
    committedTask = allTasks.find(t => t.id === focusEntry.task_id) || null;
  }

  // Calculate smart recommendation
  const unblockedActive = activeTasks.filter(t => !t.is_blocked);
  unblockedActive.sort((a, b) => {
    if (a.importance !== b.importance) return a.importance - b.importance;
    return a.id - b.id;
  });

  const recommendedTask = unblockedActive.length > 0 ? unblockedActive[0] : null;
  let recommendationReason = 'No active tasks available. Add a course or project to get started!';

  if (recommendedTask) {
    if (recommendedTask.importance === 1) {
      recommendationReason = `Highest priority commitment (Priority 1). ${recommendedTask.why_reason ? `Remember: "${recommendedTask.why_reason}".` : ''} Finish today's mission to protect your deep work momentum.`;
    } else {
      recommendationReason = `Ranked #1 actionable goal today based on priority weight (${recommendedTask.importance}/5) and prerequisite clearance.`;
    }
  }

  const shieldStatus: 'healthy' | 'vulnerable' | 'critical' =
    shieldScore >= 70 ? 'healthy' : shieldScore >= 30 ? 'vulnerable' : 'critical';

  return {
    date: today,
    is_logged: !!existingLog,
    logged_entry: existingLog || null,
    committed_task: committedTask,
    recommended_task: recommendedTask,
    recommendation_reason: recommendationReason,
    shield_score: Math.round(shieldScore * 10) / 10,
    shield_status: shieldStatus,
  };
}

export function commitTodayFocus(taskId: number, userId: number = 1): boolean {
  const today = getTodayDateString();
  db.prepare(`
    INSERT INTO daily_focus (user_id, date, task_id)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET task_id = excluded.task_id
  `).run(userId, today, taskId);
  return true;
}

export function logDailyProgress(data: {
  date: string;
  task_id: number;
  units_completed: number;
  current_position_label?: string;
  note?: string;
  is_emergency?: boolean;
  minutes_spent?: number;
}, userId: number = 1): { success: boolean; id: number; shield_delta: number; new_shield_score: number } {
  const task = getTaskById(data.task_id, userId);
  if (task && task.task_type === 'project' && data.units_completed >= 1) {
    const nextMilestone = task.milestones.find(m => m.is_completed === 0);
    if (nextMilestone) {
      db.prepare('UPDATE task_milestones SET is_completed = 1, completed_date = ? WHERE id = ?')
        .run(data.date, nextMilestone.id);
    }
  }

  const isEmergency = data.is_emergency ? 1 : 0;
  // Shield score pace rule:
  // Regular task completion: +100 points
  // Minimum emergency task completion (5-10 min): +10 points (exactly 10% of regular pace)
  const shieldDelta = isEmergency === 1 ? 10.0 : 100.0;
  const minutesSpent = data.minutes_spent || (isEmergency === 1 ? 10 : 45);

  db.prepare(`
    INSERT INTO daily_logs (user_id, date, task_id, units_completed, current_position_label, note, is_emergency, minutes_spent, shield_delta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      task_id = excluded.task_id,
      units_completed = excluded.units_completed,
      current_position_label = excluded.current_position_label,
      note = excluded.note,
      is_emergency = excluded.is_emergency,
      minutes_spent = excluded.minutes_spent,
      shield_delta = excluded.shield_delta
  `).run(
    userId,
    data.date,
    data.task_id,
    data.units_completed,
    data.current_position_label || null,
    data.note || null,
    isEmergency,
    minutesSpent,
    shieldDelta
  );

  // Update user's shield score
  db.prepare('UPDATE users SET shield_score = shield_score + ? WHERE id = ?').run(shieldDelta, userId);
  const updatedUser = getUserById(userId);
  const newShieldScore = updatedUser ? updatedUser.shield_score : 100.0;

  const row = db.prepare('SELECT id FROM daily_logs WHERE user_id = ? AND date = ?').get(userId, data.date) as { id: number };
  return {
    success: true,
    id: row.id,
    shield_delta: shieldDelta,
    new_shield_score: Math.round(newShieldScore * 10) / 10,
  };
}

// Calculate streak with Shield Defense logic
export function getDailyLogsHistory(userId: number = 1): {
  logs: DailyLogRecord[];
  streak: number;
  total_days_logged: number;
  total_units_completed: number;
  shield_score: number;
  shield_status: 'healthy' | 'vulnerable' | 'critical';
  shield_threshold: number;
  emergency_sessions_count: number;
  protected_days_count: number;
  user: {
    id: number;
    email: string;
    display_name: string;
    shield_score: number;
    passcode: string;
    daily_budget_minutes: number;
  } | null;
} {
  const logs = db.prepare(`
    SELECT dl.*, t.name as task_name, t.task_type, t.unit_label
    FROM daily_logs dl
    JOIN tasks t ON dl.task_id = t.id
    WHERE dl.user_id = ?
    ORDER BY dl.date DESC
  `).all(userId) as unknown as DailyLogRecord[];

  const user = getUserById(userId);
  let userShieldScore = user ? user.shield_score : 100.0;
  const SHIELD_THRESHOLD = 30.0; // Minimum score needed to absorb a miss

  // Consecutive streak with Shield protection
  let streak = 0;
  let protectedDaysCount = 0;
  let simulatedShield = userShieldScore;

  if (logs.length > 0) {
    const dates = new Set(logs.map(l => l.date));
    const now = new Date();
    const todayStr = getTodayDateString();

    const checkDate = new Date(now);
    let checkStr = todayStr;
    
    // If today is not yet logged, start checking from yesterday
    if (!dates.has(checkStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      checkStr = `${y}-${m}-${d}`;
    }

    // Traverse consecutive calendar days
    // If a day was completed: streak increments
    // If a day was missed:
    //   If simulatedShield >= 30: Shield absorbs the miss! -30% penalty, streak is SAVED
    //   If simulatedShield < 30: Shield fails, streak breaks!
    let maxLookback = 60;
    while (maxLookback > 0) {
      maxLookback--;
      if (dates.has(checkStr)) {
        streak++;
      } else {
        // Missed day: check if shield can protect it
        if (simulatedShield >= SHIELD_THRESHOLD) {
          // Shield absorbs the miss: burns 30% of total score
          simulatedShield = simulatedShield * 0.70;
          protectedDaysCount++;
          streak++; // Streak maintained through shield defense!
        } else {
          // Shield is depleted below 30%: streak breaks!
          break;
        }
      }

      checkDate.setDate(checkDate.getDate() - 1);
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      checkStr = `${y}-${m}-${d}`;

      // Stop looking back if we reached before the user's earliest log and before user creation
      const earliestLog = logs[logs.length - 1].date;
      if (checkStr < earliestLog) {
        break;
      }
    }
  }

  let totalUnits = 0;
  let emergencyCount = 0;
  for (const l of logs) {
    totalUnits += l.units_completed;
    if (l.is_emergency === 1) {
      emergencyCount++;
    }
  }

  const roundedScore = Math.round(userShieldScore * 10) / 10;
  const shieldStatus: 'healthy' | 'vulnerable' | 'critical' =
    roundedScore >= 70 ? 'healthy' : roundedScore >= 30 ? 'vulnerable' : 'critical';

  return {
    logs,
    streak,
    total_days_logged: logs.length,
    total_units_completed: totalUnits,
    shield_score: roundedScore,
    shield_status: shieldStatus,
    shield_threshold: SHIELD_THRESHOLD,
    emergency_sessions_count: emergencyCount,
    protected_days_count: protectedDaysCount,
    user: user ? {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      shield_score: roundedScore,
      passcode: user.passcode,
      daily_budget_minutes: user.daily_budget_minutes,
    } : null,
  };
}

export function getUserSettings(userId: number = 1): { daily_budget_minutes: number; email: string; shield_score: number } {
  const user = getUserById(userId);
  if (user) {
    return {
      daily_budget_minutes: user.daily_budget_minutes,
      email: user.email,
      shield_score: Math.round(user.shield_score * 10) / 10,
    };
  }
  return { daily_budget_minutes: 180, email: 'user@onefocus.app', shield_score: 100.0 };
}

export function updateUserSettings(dailyBudgetMinutes: number, userId: number = 1): boolean {
  db.prepare('UPDATE users SET daily_budget_minutes = ? WHERE id = ?').run(dailyBudgetMinutes, userId);
  return true;
}

// Seed realistic starter data
export function seedInitialData(userId: number = 1, force = false) {
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?').get(userId) as { count: number };
  if (taskCount.count > 0 && !force) return;

  if (force) {
    db.prepare('DELETE FROM daily_logs WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM daily_focus WHERE user_id = ?').run(userId);
    const existingTasks = db.prepare('SELECT id FROM tasks WHERE user_id = ?').all(userId) as { id: number }[];
    for (const t of existingTasks) {
      db.prepare('DELETE FROM task_milestones WHERE task_id = ?').run(t.id);
    }
    db.prepare('DELETE FROM tasks WHERE user_id = ?').run(userId);
  }

  // 1. Structured Course (Stanford Machine Learning)
  const courseId = createTask({
    name: 'CS229: Machine Learning (Stanford)',
    task_type: 'course',
    importance: 1,
    why_reason: 'Deep mastery of mathematical foundations and gradient descent to transition into senior ML engineering.',
    resource_url: 'https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU',
    unit_label: 'lectures',
    total_units: 144,
    minutes_per_unit: 50,
  }, userId);

  // 2. Unstructured Decomposed Project (OneFocus MVP)
  const projectId = createTask({
    name: 'Build High-Performance Single-Tasking Web App',
    task_type: 'project',
    importance: 2,
    why_reason: 'Ship a production-grade application demonstrating radical focus and full-stack craftsmanship.',
    resource_url: 'https://github.com',
    unit_label: 'milestones',
    total_units: 6,
    minutes_per_unit: 60,
  }, userId);

  addMilestones(projectId, [
    { step_order: 1, title: 'Create system architecture & radical focus philosophy', description: 'Define database schema, REST endpoints, and UX flow.' },
    { step_order: 2, title: 'Design SQLite tables with strict constraints & foreign keys', description: 'Implement tasks, task_milestones, daily_logs, and user_settings.' },
    { step_order: 3, title: 'Implement Express API with Gemini structured JSON breakdown', description: 'Create endpoints for task intake, decomposition, and daily focus locks.' },
    { step_order: 4, title: 'Build responsive single-screen Mission Control UI', description: 'Minimalist brutalism aesthetic with glassmorphism and focus stopwatch.' },
    { step_order: 5, title: 'Implement daily ordinal progress engine and daily log journal', description: 'Explicit ordinal instructions (e.g., lecture 10 -> 11) and streak tracker.' },
    { step_order: 6, title: 'End-to-end integration tests & deployment packaging', description: 'Verify build scripts, bundle size, and offline-ready responsiveness.' },
  ]);

  // Mark first two milestones as completed
  const milestones = db.prepare('SELECT id, step_order FROM task_milestones WHERE task_id = ? ORDER BY step_order ASC').all(projectId) as unknown as { id: number; step_order: number }[];
  for (const m of milestones) {
    if (m.step_order <= 2) {
      db.prepare('UPDATE task_milestones SET is_completed = 1, completed_date = ? WHERE id = ?').run('2026-09-16', m.id);
    }
  }

  // 3. Deliberate Practice Habit (System Design Drills)
  createTask({
    name: 'Distributed Systems & Data Structures Drill',
    task_type: 'habit',
    importance: 3,
    why_reason: 'Retain razor-sharp problem solving skills and architectural intuition.',
    unit_label: 'problems',
    total_units: null,
    minutes_per_unit: 45,
  }, userId);

  // Seed past daily logs
  const today = new Date();
  const d1 = new Date(today); d1.setDate(d1.getDate() - 3);
  const d2 = new Date(today); d2.setDate(d2.getDate() - 2);
  const d3 = new Date(today); d3.setDate(d3.getDate() - 1);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  db.prepare(`
    INSERT OR IGNORE INTO daily_logs (user_id, date, task_id, units_completed, current_position_label, note, is_emergency, minutes_spent, shield_delta)
    VALUES (?, ?, ?, ?, ?, ?, 0, 50, 100.0)
  `).run(userId, fmt(d1), courseId, 1, 'Finished Lecture 9: Support Vector Machines', 'Derivation of soft margin optimization in dual form.');

  db.prepare(`
    INSERT OR IGNORE INTO daily_logs (user_id, date, task_id, units_completed, current_position_label, note, is_emergency, minutes_spent, shield_delta)
    VALUES (?, ?, ?, ?, ?, ?, 0, 50, 100.0)
  `).run(userId, fmt(d2), courseId, 1, 'Finished Lecture 10: Kernel Methods', 'Mercer theorem and RBF kernels. Mind blown by infinite dimensions.');

  db.prepare(`
    INSERT OR IGNORE INTO daily_logs (user_id, date, task_id, units_completed, current_position_label, note, is_emergency, minutes_spent, shield_delta)
    VALUES (?, ?, ?, ?, ?, ?, 0, 50, 100.0)
  `).run(userId, fmt(d3), courseId, 1, 'Finished Lecture 11: Deep Learning Foundations', 'Backpropagation gradient flow calculus.');

  // Set today's committed focus to CS229
  commitTodayFocus(courseId, userId);
}

// Seed on startup for default user
seedInitialData(1);
