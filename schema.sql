-- OneFocus SQLite Database Schema

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  date DATE UNIQUE NOT NULL, -- YYYY-MM-DD
  task_id INTEGER NOT NULL,
  units_completed REAL NOT NULL,
  current_position_label TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  daily_budget_minutes INTEGER DEFAULT 180,
  email TEXT UNIQUE,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS daily_focus (
  date DATE PRIMARY KEY,
  task_id INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
