import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TodayFocusView } from './components/TodayFocusView';
import { TasksListView } from './components/TasksListView';
import { HistoryView } from './components/HistoryView';
import { IntakeModal } from './components/IntakeModal';
import { LogProgressModal } from './components/LogProgressModal';
import { SettingsModal } from './components/SettingsModal';
import { ShieldModal } from './components/ShieldModal';
import { AccountModal } from './components/AccountModal';
import { api } from './api';
import { Task, TodayFocusData, LogsHistoryData, UserSettings, User } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'focus' | 'pipeline' | 'journal'>('focus');

  // Application Data States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [todayData, setTodayData] = useState<TodayFocusData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [historyData, setHistoryData] = useState<LogsHistoryData | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Modals
  const [isIntakeOpen, setIsIntakeOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShieldOpen, setIsShieldOpen] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [loggingState, setLoggingState] = useState<{ task: Task; isEmergency: boolean } | null>(null);

  // Status & Error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch all core state
  const loadAllData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [userRes, todayRes, tasksRes, logsRes, settingsRes] = await Promise.all([
        api.getMe(),
        api.getTodayFocus(),
        api.getTasks(),
        api.getLogs(),
        api.getSettings(),
      ]);

      if (userRes) {
        setCurrentUser(userRes);
      }
      setTodayData(todayRes);
      setTasks(tasksRes);
      setHistoryData(logsRes);
      setSettings(settingsRes);
    } catch (err: unknown) {
      console.error('Failed to load application data:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Could not connect to OneFocus SQLite backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handler: Commit to single focus for today
  const handleCommitFocus = async (taskId: number) => {
    try {
      const updatedToday = await api.commitTodayFocus(taskId);
      setTodayData(updatedToday);
      const updatedTasks = await api.getTasks();
      setTasks(updatedTasks);
      setCurrentTab('focus');
    } catch (err) {
      console.error('Failed to commit focus:', err);
    }
  };

  // Handler: Log daily progress (standard or emergency minimum)
  const handleLogProgress = async (logData: {
    task_id: number;
    units_completed: number;
    current_position_label: string;
    note: string;
    date: string;
    is_emergency?: boolean;
    minutes_spent?: number;
  }) => {
    const result = await api.logDailyProgress(logData);
    setTodayData(result.today);
    setHistoryData(result.history);
    const updatedTasks = await api.getTasks();
    setTasks(updatedTasks);
    // Reload active user to get updated shield score
    const updatedUser = await api.getMe();
    if (updatedUser) setCurrentUser(updatedUser);
    setCurrentTab('focus');
  };

  // Handler: Task created via Intake modal
  const handleTaskCreated = async (created: Task) => {
    await loadAllData();
    if (!todayData?.committed_task && !todayData?.is_logged) {
      await handleCommitFocus(created.id);
    } else {
      setCurrentTab('pipeline');
    }
  };

  // Handler: Reset seed demo data
  const handleResetSeedData = async () => {
    await api.resetData();
    await loadAllData();
    setCurrentTab('focus');
  };

  // Handler: User signed in or generated passcode
  const handleUserChanged = async (user: User | null) => {
    setCurrentUser(user);
    await loadAllData();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 font-mono text-xs text-neutral-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-800 border-t-amber-500" />
          <span>Synchronizing OneFocus Engine...</span>
        </div>
      </div>
    );
  }

  const currentShieldScore = historyData?.shield_score ?? currentUser?.shield_score ?? 100;
  const currentShieldStatus = historyData?.shield_status ?? 'healthy';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenIntake={() => setIsIntakeOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShield={() => setIsShieldOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        streak={historyData?.streak || 0}
        dailyBudget={settings?.daily_budget_minutes || 180}
        todayDate={todayData?.date || ''}
        shieldScore={currentShieldScore}
        shieldStatus={currentShieldStatus}
        currentUser={currentUser}
      />

      {/* Backend error banner if any */}
      {errorMessage && (
        <div className="bg-red-950/80 border-b border-red-800 p-3 text-center text-xs font-mono text-red-200 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span>{errorMessage}</span>
          <button
            onClick={loadAllData}
            className="ml-2 underline flex items-center gap-1 hover:text-white"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Main Container with responsive mobile bottom spacing */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8 pb-28 md:pb-10">
        {currentTab === 'focus' && (
          <TodayFocusView
            todayData={todayData}
            tasks={tasks}
            streak={historyData?.streak || 0}
            shieldScore={currentShieldScore}
            shieldStatus={currentShieldStatus}
            onCommitFocus={handleCommitFocus}
            onOpenLogModal={(task, isEmergency) =>
              setLoggingState({ task, isEmergency: Boolean(isEmergency) })
            }
            onGoToPipeline={() => setCurrentTab('pipeline')}
            onOpenShield={() => setIsShieldOpen(true)}
          />
        )}

        {currentTab === 'pipeline' && (
          <TasksListView
            tasks={tasks}
            onCommitFocus={handleCommitFocus}
            onRefreshTasks={loadAllData}
            onOpenIntake={() => setIsIntakeOpen(true)}
            todayCommittedTaskId={todayData?.committed_task?.id}
          />
        )}

        {currentTab === 'journal' && (
          <HistoryView
            historyData={historyData}
            onOpenShield={() => setIsShieldOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <IntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onTaskCreated={handleTaskCreated}
        existingTasks={tasks}
      />

      {loggingState && (
        <LogProgressModal
          isOpen={!!loggingState}
          onClose={() => setLoggingState(null)}
          task={loggingState.task}
          todayDate={todayData?.date || ''}
          initialIsEmergency={loggingState.isEmergency}
          onConfirmLog={handleLogProgress}
        />
      )}

      <ShieldModal
        isOpen={isShieldOpen}
        onClose={() => setIsShieldOpen(false)}
        shieldScore={currentShieldScore}
        shieldStatus={currentShieldStatus}
        streak={historyData?.streak || 0}
      />

      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        currentUser={currentUser}
        onUserChanged={handleUserChanged}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsUpdated={setSettings}
        onResetData={handleResetSeedData}
      />

      {/* Footer (hidden on small mobile or padded above bottom bar) */}
      <footer className="border-t border-neutral-900 py-6 text-center text-xs font-mono text-neutral-400 mb-16 md:mb-0 px-4">
        <p>OneFocus • Radical Single-Tasking Engine • Commit to exactly ONE thing today</p>
      </footer>
    </div>
  );
}
