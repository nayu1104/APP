import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addMilestones,
  toggleMilestone,
  deleteMilestone,
  getTodayFocus,
  commitTodayFocus,
  logDailyProgress,
  getDailyLogsHistory,
  getUserSettings,
  updateUserSettings,
  seedInitialData,
  getTodayDateString,
  getUserById,
  getUserByEmail,
  loginUser,
  generateOrResetPasscode,
} from './server/db.js';
import { decomposeProjectWithGemini, getCoachAdviceWithGemini } from './server/gemini.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parsing
  app.use(express.json());

  // Helper to resolve authenticated user
  function resolveUserId(req: express.Request): number {
    const emailHeader = req.headers['x-user-email'] as string | undefined;
    const passcodeHeader = req.headers['x-user-passcode'] as string | undefined;
    if (emailHeader) {
      const user = getUserByEmail(emailHeader);
      if (user) {
        if (!passcodeHeader || user.passcode === passcodeHeader.trim()) {
          return user.id;
        }
      }
    }
    return 1; // Default user (Nayan)
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth & Multi-Device Sync Routes
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, passcode } = req.body;
      if (!email || !passcode) {
        return res.status(400).json({ error: 'Email and passcode are required' });
      }
      const user = loginUser(String(email), String(passcode));
      res.json({ success: true, user });
    } catch (err: unknown) {
      console.error('Login error:', err);
      res.status(401).json({ error: err instanceof Error ? err.message : 'Invalid credentials' });
    }
  });

  app.post('/api/auth/generate-passcode', (req, res) => {
    try {
      const { email, display_name } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      const result = generateOrResetPasscode(String(email), display_name ? String(display_name) : undefined);
      res.json({ success: true, user: result.user, isNew: result.isNew });
    } catch (err: unknown) {
      console.error('Passcode generation error:', err);
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to generate passcode' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const user = getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user });
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Tasks
  app.get('/api/tasks', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const tasks = getAllTasks(userId);
      res.json({ tasks });
    } catch (err: unknown) {
      console.error('Error fetching tasks:', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.get('/api/tasks/:id', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const id = parseInt(req.params.id, 10);
      const task = getTaskById(id, userId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ task });
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    try {
      const userId = resolveUserId(req);
      const {
        name,
        task_type,
        importance,
        why_reason,
        resource_url,
        unit_label,
        total_units,
        minutes_per_unit,
        prerequisite_task_ids,
        milestones,
      } = req.body;

      if (!name || !task_type) {
        return res.status(400).json({ error: 'Name and task_type are required' });
      }

      const taskId = createTask({
        name,
        task_type,
        importance: Number(importance) || 2,
        why_reason,
        resource_url,
        unit_label: unit_label || (task_type === 'project' ? 'milestones' : 'lectures'),
        total_units: total_units ? Number(total_units) : null,
        minutes_per_unit: Number(minutes_per_unit) || 30,
        prerequisite_task_ids: prerequisite_task_ids ? String(prerequisite_task_ids) : undefined,
      }, userId);

      // If milestones provided or needed
      if (Array.isArray(milestones) && milestones.length > 0) {
        addMilestones(taskId, milestones);
        updateTask(taskId, { total_units: milestones.length }, userId);
      }

      const created = getTaskById(taskId, userId);
      res.status(201).json({ task: created });
    } catch (err: unknown) {
      console.error('Error creating task:', err);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  app.put('/api/tasks/:id', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const id = parseInt(req.params.id, 10);
      const updated = updateTask(id, req.body, userId);
      if (!updated) {
        return res.status(400).json({ error: 'No valid fields provided or task not found' });
      }
      const task = getTaskById(id, userId);
      res.json({ task });
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  app.delete('/api/tasks/:id', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const id = parseInt(req.params.id, 10);
      deleteTask(id, userId);
      res.json({ success: true, id });
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // Milestones
  app.post('/api/tasks/:id/milestones', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const taskId = parseInt(req.params.id, 10);
      const { title, description, step_order } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Milestone title is required' });
      }
      addMilestones(taskId, [{
        title,
        description,
        step_order: Number(step_order) || 1,
      }]);
      const task = getTaskById(taskId, userId);
      res.json({ task });
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to add milestone' });
    }
  });

  app.put('/api/milestones/:id/toggle', (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = toggleMilestone(id);
      res.json({ success });
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to toggle milestone' });
    }
  });

  app.delete('/api/milestones/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      deleteMilestone(id);
      res.json({ success: true });
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to delete milestone' });
    }
  });

  // Today Focus
  app.get('/api/today', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const focus = getTodayFocus(userId);
      res.json(focus);
    } catch (err: unknown) {
      console.error('Error getting today focus:', err);
      res.status(500).json({ error: 'Failed to get today focus' });
    }
  });

  app.post('/api/today/commit', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const { task_id } = req.body;
      if (!task_id) {
        return res.status(400).json({ error: 'task_id is required' });
      }
      commitTodayFocus(Number(task_id), userId);
      const focus = getTodayFocus(userId);
      res.json(focus);
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to commit focus' });
    }
  });

  app.post('/api/today/log', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const { task_id, units_completed, current_position_label, note, date, is_emergency, minutes_spent } = req.body;
      if (!task_id || units_completed === undefined) {
        return res.status(400).json({ error: 'task_id and units_completed are required' });
      }

      const logDate = date || getTodayDateString();
      const result = logDailyProgress({
        date: logDate,
        task_id: Number(task_id),
        units_completed: Number(units_completed),
        current_position_label,
        note,
        is_emergency: Boolean(is_emergency),
        minutes_spent: minutes_spent ? Number(minutes_spent) : undefined,
      }, userId);

      const today = getTodayFocus(userId);
      const history = getDailyLogsHistory(userId);
      res.json({
        success: true,
        log_id: result.id,
        shield_delta: result.shield_delta,
        new_shield_score: result.new_shield_score,
        today,
        history,
      });
    } catch (err: unknown) {
      console.error('Error logging daily progress:', err);
      res.status(500).json({ error: 'Failed to log daily progress' });
    }
  });

  // History & Streak with Shield system
  app.get('/api/logs', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const history = getDailyLogsHistory(userId);
      res.json(history);
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to fetch logs history' });
    }
  });

  // Settings
  app.get('/api/settings', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const settings = getUserSettings(userId);
      res.json(settings);
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const { daily_budget_minutes } = req.body;
      if (!daily_budget_minutes) {
        return res.status(400).json({ error: 'daily_budget_minutes is required' });
      }
      updateUserSettings(Number(daily_budget_minutes), userId);
      res.json(getUserSettings(userId));
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // AI Routes (Gemini)
  app.post('/api/ai/decompose', async (req, res) => {
    try {
      const { taskName, whyReason, dailyMinutesAvailable, importance } = req.body;
      if (!taskName) {
        return res.status(400).json({ error: 'taskName is required' });
      }

      const decomposed = await decomposeProjectWithGemini({
        taskName,
        whyReason,
        dailyMinutesAvailable: Number(dailyMinutesAvailable) || 60,
        importance: Number(importance) || 2,
      });

      res.json(decomposed);
    } catch (err: unknown) {
      console.warn('Handling decompose fallback:', err);
      // Fallback safe decomposition
      res.json({
        total_units: 4,
        unit_label: 'milestones',
        milestones: [
          {
            step_order: 1,
            title: `Define scope & clear requirements`,
            description: 'Clarify deliverables and concrete outcomes.',
            est_minutes: 60,
          },
          {
            step_order: 2,
            title: 'Research patterns and setup environment',
            description: 'Review reference implementations and dependencies.',
            est_minutes: 60,
          },
          {
            step_order: 3,
            title: 'Build core implementation',
            description: 'Implement core functionality.',
            est_minutes: 60,
          },
          {
            step_order: 4,
            title: 'Review and verify against goal',
            description: 'Test, refine, and complete.',
            est_minutes: 45,
          },
        ],
      });
    }
  });

  app.post('/api/ai/coach-advice', async (req, res) => {
    try {
      const { taskName, taskType, whyReason, currentPosition, nextMission, streak } = req.body;
      const advice = await getCoachAdviceWithGemini({
        taskName: taskName || 'Daily Focus',
        taskType: taskType || 'course',
        whyReason,
        currentPosition: currentPosition || '',
        nextMission: nextMission || '',
        streak: Number(streak) || 0,
      });
      res.json({ advice });
    } catch (err: unknown) {
      const mission = req.body?.nextMission || 'today\'s priority';
      res.json({
        advice: `Commit completely to ${mission}. Radical single-tasking works because multitasking is an illusion of progress; execute this single step and ignore everything else.`,
      });
    }
  });

  // Seed sample data
  app.post('/api/seed', (req, res) => {
    try {
      const userId = resolveUserId(req);
      seedInitialData(userId, true);
      const tasks = getAllTasks(userId);
      const today = getTodayFocus(userId);
      const logs = getDailyLogsHistory(userId);
      res.json({ success: true, tasks, today, logs });
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to reset seed data' });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OneFocus Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
