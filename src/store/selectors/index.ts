import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import type { Todo, Journal } from '@/types/database';

// ============================================================================
// Auth Selectors
// ============================================================================
export const selectAuth = (state: RootState) => state.auth;

export const selectSession = createSelector(
  selectAuth,
  (auth) => auth.session
);

export const selectProfile = createSelector(
  selectAuth,
  (auth) => auth.profile
);

export const selectIsAuthenticated = createSelector(
  selectSession,
  (session) => !!session
);

export const selectAuthLoading = createSelector(
  selectAuth,
  (auth) => auth.loading
);

// ============================================================================
// Tasks (Todos) Selectors
// ============================================================================
export const selectTasksState = (state: RootState) => state.tasks;

export const selectAllTodos = createSelector(
  selectTasksState,
  (tasks) => tasks.todos
);

export const selectTodosLoading = createSelector(
  selectTasksState,
  (tasks) => tasks.loading
);

export const selectTodoById = (todoId: string) =>
  createSelector(selectAllTodos, (todos) =>
    todos.find(todo => todo.id === todoId)
  );

export const selectTodosByDate = (date: string) =>
  createSelector(selectAllTodos, (todos) =>
    todos.filter(todo => todo.due_date === date)
  );

export const selectTodaysTodos = createSelector(
  selectAllTodos,
  (todos) => {
    const today = new Date().toISOString().split('T')[0];
    return todos.filter(todo =>
      todo.due_date === today ||
      (!todo.due_date && !todo.completed)
    );
  }
);

export const selectCompletedTodos = createSelector(
  selectAllTodos,
  (todos) => todos.filter(todo => todo.completed)
);

export const selectIncompleteTodos = createSelector(
  selectAllTodos,
  (todos) => todos.filter(todo => !todo.completed)
);

export const selectTodosByPriority = (priority: 'high' | 'medium' | 'low') =>
  createSelector(selectAllTodos, (todos) =>
    todos.filter(todo => todo.priority === priority)
  );

export const selectHighPriorityTodos = createSelector(
  selectAllTodos,
  (todos) => todos.filter(todo => todo.priority === 'high' && !todo.completed)
);

export const selectTodosStats = createSelector(
  selectAllTodos,
  (todos) => {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const today = new Date().toISOString().split('T')[0];
    const todayTodos = todos.filter(t => t.due_date === today);
    const todayCompleted = todayTodos.filter(t => t.completed).length;

    return {
      total,
      completed,
      incomplete: total - completed,
      completionRate: total > 0 ? completed / total : 0,
      todayTotal: todayTodos.length,
      todayCompleted,
      todayCompletionRate: todayTodos.length > 0 ? todayCompleted / todayTodos.length : 0,
    };
  }
);

// ============================================================================
// Pomodoro Selectors
// ============================================================================
export const selectPomodoroState = (state: RootState) => state.pomodoro;

export const selectActiveSession = createSelector(
  selectPomodoroState,
  (pomodoro) => pomodoro.activeSession
);

export const selectIsTimerRunning = createSelector(
  selectPomodoroState,
  (pomodoro) => pomodoro.status === 'running'
);

export const selectTimeRemaining = createSelector(
  selectPomodoroState,
  (pomodoro) => pomodoro.remainingSeconds
);

export const selectPomodoroHistory = createSelector(
  selectPomodoroState,
  (pomodoro) => pomodoro.todaySessions
);

export const selectTodaysSessions = createSelector(
  selectPomodoroHistory,
  (sessions) => {
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter(session =>
      session.started_at.startsWith(today) && session.ended_at
    );
  }
);

export const selectTodaysFocusMinutes = createSelector(
  selectTodaysSessions,
  (sessions) => {
    return sessions.reduce((total, session: any) => {
      // Use actual_duration_minutes if available, otherwise use duration_minutes for completed sessions
      const actual = typeof session?.actual_duration_minutes === 'number' ? session.actual_duration_minutes : null;
      const minutes = actual !== null ? Math.max(0, actual) : (session.completed ? session.duration_minutes : 0);
      return total + minutes;
    }, 0);
  }
);

export const selectWeeklyFocusData = createSelector(
  selectPomodoroState,
  (pomodoro) => pomodoro.weekDailyBreakdown
);

export const selectCurrentSessionType = createSelector(
  selectPomodoroState,
  (pomodoro) => pomodoro.isBreak ? 'break' : 'focus'
);

export const selectSetsCompleted = createSelector(
  selectPomodoroState,
  (pomodoro) => pomodoro.setsCompleted
);

export const selectBreakStartTime = createSelector(
  selectPomodoroState,
  (pomodoro) => pomodoro.breakStartTime
);

// ============================================================================
// Journal Selectors
// ============================================================================
export const selectJournalState = (state: RootState) => state.journal;

export const selectAllEntries = createSelector(
  selectJournalState,
  (journal) => journal.entries
);

export const selectJournalLoading = createSelector(
  selectJournalState,
  (journal) => journal.loading
);

export const selectEntryById = (entryId: string) =>
  createSelector(selectAllEntries, (entries) =>
    entries.find(entry => entry.id === entryId)
  );

export const selectTodaysEntry = createSelector(
  selectAllEntries,
  (entries) => {
    const today = new Date().toISOString().split('T')[0];
    return entries.find(entry => entry.created_at.startsWith(today));
  }
);

export const selectEntriesByMonth = (year: number, month: number) =>
  createSelector(selectAllEntries, (entries) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return entries.filter(entry => entry.created_at.startsWith(prefix));
  });

export const selectJournalStreak = createSelector(
  selectAllEntries,
  (entries) => {
    if (entries.length === 0) return 0;

    const sortedDates = entries
      .map(e => e.created_at.split('T')[0])
      .sort()
      .reverse();

    const today = new Date();
    let streak = 0;
    let currentDate = today;

    for (const dateStr of sortedDates) {
      const entryDate = new Date(dateStr);
      const diffDays = Math.floor(
        (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 1) {
        streak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }

    return streak;
  }
);

// ============================================================================
// Capabilities Selectors
// ============================================================================
export const selectCapabilities = (state: RootState) => state.capabilities;

export const selectCapabilitiesData = createSelector(
  selectCapabilities,
  (capabilities) => capabilities.capabilities
);

export const selectVisibleTabs = createSelector(
  selectCapabilities,
  (capabilities) => capabilities.visibleTabs
);

// ============================================================================
// Settings Selectors
// ============================================================================
export const selectSettings = (state: RootState) => state.settings;

export const selectThemeMode = createSelector(
  selectSettings,
  (settings) => settings.theme
);

export const selectBedtime = createSelector(
  selectSettings,
  (settings) => settings.bedtime
);

export const selectPomodoroSettings = createSelector(
  selectSettings,
  (settings) => ({
    focusDuration: settings.pomodoro.focusDuration,
    shortBreakDuration: settings.pomodoro.shortBreakDuration,
    longBreakDuration: settings.pomodoro.longBreakDuration,
    sessionsUntilLongBreak: settings.pomodoro.sessionsUntilLongBreak,
    autoStartBreaks: settings.pomodoro.autoStartBreaks,
    autoStartFocus: settings.pomodoro.autoStartFocus,
  })
);

// ============================================================================
// Sync Selectors
// ============================================================================
export const selectSyncState = (state: RootState) => state.sync;

export const selectPendingSync = createSelector(
  selectSyncState,
  (sync) => sync.queue.length
);

export const selectIsSyncing = createSelector(
  selectSyncState,
  (sync) => sync.isSyncing
);

export const selectLastSyncTime = createSelector(
  selectSyncState,
  (sync) => sync.lastSyncedAt
);