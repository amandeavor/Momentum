import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { PomodoroSession, PomodoroSessionInsert, PomodoroSessionUpdate, Database } from '@/types/database';
import { RootState } from '../index';

// Pomodoro presets
export const POMODORO_PRESETS = {
  classic: { focus: 25, break: 5, label: '25/5' },
  long: { focus: 52, break: 17, label: '52/17' },
  short: { focus: 15, break: 3, label: '15/3' },
} as const;

export type PomodoroPreset = keyof typeof POMODORO_PRESETS;

// Session status
export type SessionStatus = 'idle' | 'running' | 'paused' | 'break' | 'completed';

interface PomodoroState {
  // Current session config
  currentPreset: PomodoroPreset;
  customFocusMinutes: number;
  customBreakMinutes: number;
  customLongBreakMinutes: number;

  // Active session
  activeSession: PomodoroSession | null;
  status: SessionStatus;
  remainingSeconds: number;
  isBreak: boolean;
  linkedTodoId: string | null;

  // Session history
  sessions: PomodoroSession[];
  todaySessions: PomodoroSession[];

  // Stats
  todayFocusMinutes: number;
  weekFocusMinutes: number;
  weekDailyBreakdown: { day: string; minutes: number }[];

  // Sets Logic
  setsCompleted: number;
  sessionsUntilLongBreak: number;

  // State
  loading: boolean;
  error: string | null;
}

const initialState: PomodoroState = {
  currentPreset: 'classic',
  customFocusMinutes: 25,
  customBreakMinutes: 5,
  customLongBreakMinutes: 15,

  activeSession: null,
  status: 'idle',
  remainingSeconds: 25 * 60,
  isBreak: false,
  linkedTodoId: null,

  sessions: [],
  todaySessions: [],

  todayFocusMinutes: 0,
  weekFocusMinutes: 0,
  weekDailyBreakdown: [],

  setsCompleted: 0,
  sessionsUntilLongBreak: 4,

  loading: false,
  error: null,
};

// Helper to get today's start
const getTodayStart = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
};

// Helper to get week start
const getWeekStart = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  now.setDate(diff);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
};

// Async thunks

// Fetch today's sessions
export const fetchTodaySessions = createAsyncThunk<
  PomodoroSession[],
  void,
  { state: RootState; rejectValue: string }
>(
  'pomodoro/fetchTodaySessions',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', getTodayStart())
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as PomodoroSession[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Start a new pomodoro session
export const startSession = createAsyncThunk<
  PomodoroSession,
  { todoId?: string; durationMinutes: number; breakMinutes: number },
  { state: RootState; rejectValue: string }
>(
  'pomodoro/startSession',
  async ({ todoId, durationMinutes, breakMinutes }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const sessionData: Database['public']['Tables']['pomodoro_sessions']['Insert'] = {
        user_id: userId,
        todo_id: todoId ?? null,
        duration_minutes: durationMinutes,
        break_duration_minutes: breakMinutes,
        started_at: new Date().toISOString(),
        completed: false,
      };

      const { data, error } = await (supabase.from('pomodoro_sessions') as any)
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data as PomodoroSession;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Complete a session
export const completeSession = createAsyncThunk<
  PomodoroSession,
  { sessionId: string; rating?: number; notes?: string; actualMinutes?: number },
  { rejectValue: string }
>(
  'pomodoro/completeSession',
  async ({ sessionId, rating, notes, actualMinutes }, { rejectWithValue }) => {
    try {
      const updateData: Database['public']['Tables']['pomodoro_sessions']['Update'] = {
        ended_at: new Date().toISOString(),
        completed: true,
        actual_duration_minutes: typeof actualMinutes === 'number' ? actualMinutes : undefined,
        rating,
        notes,
      };

      const { data, error } = await (supabase.from('pomodoro_sessions') as any)
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as PomodoroSession;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Cancel a session
export const cancelSession = createAsyncThunk<
  PomodoroSession,
  { sessionId: string; elapsedMinutes?: number },
  { rejectValue: string }
>(
  'pomodoro/cancelSession',
  async ({ sessionId, elapsedMinutes }, { rejectWithValue }) => {
    try {
      const updateData: Database['public']['Tables']['pomodoro_sessions']['Update'] = {
        ended_at: new Date().toISOString(),
        completed: false,
        actual_duration_minutes: typeof elapsedMinutes === 'number' ? elapsedMinutes : 0,
      };

      const { data, error } = await (supabase.from('pomodoro_sessions') as any)
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as PomodoroSession;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Fetch focus stats
export const fetchFocusStats = createAsyncThunk<
  { todayMinutes: number; weekMinutes: number; dailyBreakdown: { day: string; minutes: number }[] },
  void,
  { state: RootState; rejectValue: string }
>(
  'pomodoro/fetchFocusStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      // Today's focus minutes
      const { data: todayData } = await supabase
        .from('pomodoro_sessions')
        .select('duration_minutes, actual_duration_minutes, completed, ended_at')
        .eq('user_id', userId)
        .gte('started_at', getTodayStart())
        .not('ended_at', 'is', null);

      // Week's focus minutes (last 7 days)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const { data: weekData } = await supabase
        .from('pomodoro_sessions')
        .select('duration_minutes, actual_duration_minutes, completed, ended_at, started_at')
        .eq('user_id', userId)
        .gte('started_at', weekStart.toISOString())
        .not('ended_at', 'is', null);

      const effectiveMinutes = (row: any) => {
        const actual = typeof row?.actual_duration_minutes === 'number' ? row.actual_duration_minutes : null;
        if (actual !== null) return Math.max(0, actual);
        return row?.completed ? (row?.duration_minutes ?? 0) : 0;
      };

      const todayMinutes = (todayData as any[] | null)?.reduce((sum, row) => sum + effectiveMinutes(row), 0) ?? 0;
      const weekMinutes = (weekData as any[] | null)?.reduce((sum, row) => sum + effectiveMinutes(row), 0) ?? 0;

      // Calculate daily breakdown
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyMap = new Map<string, number>();

      // Initialize last 7 days with 0
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyMap.set(dateStr, 0);
      }

      // Fill with data
      weekData?.forEach((session: any) => {
        const dateStr = session.started_at.split('T')[0];
        if (dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + effectiveMinutes(session));
        }
      });

      const dailyBreakdown = Array.from(dailyMap.entries())
        .map(([dateStr, minutes]) => {
          const d = new Date(dateStr);
          return {
            day: days[d.getDay()],
            minutes
          };
        })
        .reverse(); // Show oldest to newest

      return { todayMinutes, weekMinutes, dailyBreakdown };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Pomodoro slice
const pomodoroSlice = createSlice({
  name: 'pomodoro',
  initialState,
  reducers: {
    // Set preset
    setPreset(state, action: PayloadAction<PomodoroPreset>) {
      state.currentPreset = action.payload;
      const preset = POMODORO_PRESETS[action.payload];
      state.customFocusMinutes = preset.focus;
      state.customBreakMinutes = preset.break;
      if (state.status === 'idle') {
        state.remainingSeconds = preset.focus * 60;
      }
    },

    // Set custom duration
    setCustomDuration(state, action: PayloadAction<{ focus: number; break: number }>) {
      state.customFocusMinutes = action.payload.focus;
      state.customBreakMinutes = action.payload.break;
      if (state.status === 'idle') {
        state.remainingSeconds = action.payload.focus * 60;
      }
    },

    // Update settings (alias for setCustomDuration)
    updateSettings(state, action: PayloadAction<{ focusDuration: number; shortBreakDuration: number; longBreakDuration: number }>) {
      state.customFocusMinutes = action.payload.focusDuration;
      state.customBreakMinutes = action.payload.shortBreakDuration;
      state.customLongBreakMinutes = action.payload.longBreakDuration;
      if (state.status === 'idle') {
        state.remainingSeconds = action.payload.focusDuration * 60;
      }
    },

    // Link todo to session
    setLinkedTodo(state, action: PayloadAction<string | null>) {
      state.linkedTodoId = action.payload;
    },

    // Timer controls
    tick(state) {
      if (state.status === 'running' && state.remainingSeconds > 0) {
        state.remainingSeconds -= 1;
      }
    },

    pause(state) {
      if (state.status === 'running') {
        state.status = 'paused';
      }
    },

    resume(state) {
      if (state.status === 'paused') {
        state.status = 'running';
      }
    },

    // Start break
    startBreak(state) {
      state.status = 'break';
      state.isBreak = true;

      // Check if long break is due
      // We check if sets > 0 and mod is 0. 
      // E.g. 4 completed: 4 % 4 === 0 -> Long Break.
      const isLongBreak = state.setsCompleted > 0 && state.setsCompleted % state.sessionsUntilLongBreak === 0;

      if (isLongBreak) {
        state.remainingSeconds = state.customLongBreakMinutes * 60;
        state.setsCompleted = 0; // Reset sets after starting long break
      } else {
        state.remainingSeconds = state.customBreakMinutes * 60;
      }
    },

    // Reset timer
    reset(state) {
      state.status = 'idle';
      state.isBreak = false;
      state.remainingSeconds = state.customFocusMinutes * 60;
      state.activeSession = null;
      state.linkedTodoId = null;
    },

    // Add time
    addTime(state, action: PayloadAction<number>) {
      state.remainingSeconds += action.payload * 60;
    },

    // Clear error
    clearPomodoroError(state) {
      state.error = null;
    },

    // Clear sessions on logout
    clearSessions(state) {
      state.sessions = [];
      state.todaySessions = [];
      state.todayFocusMinutes = 0;
      state.weekFocusMinutes = 0;
      state.weekDailyBreakdown = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch today's sessions
    builder
      .addCase(fetchTodaySessions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTodaySessions.fulfilled, (state, action) => {
        state.loading = false;
        state.todaySessions = action.payload;
        state.todayFocusMinutes = action.payload.reduce((sum, s: any) => {
          const actual = typeof s?.actual_duration_minutes === 'number' ? s.actual_duration_minutes : null;
          const minutes = actual !== null ? Math.max(0, actual) : (s.completed ? s.duration_minutes : 0);
          return sum + minutes;
        }, 0);
      })
      .addCase(fetchTodaySessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Start session
    builder
      .addCase(startSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(startSession.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload;
        state.status = 'running';
        state.remainingSeconds = action.payload.duration_minutes * 60;
        state.isBreak = false;
      })
      .addCase(startSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Complete session
    builder
      .addCase(completeSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(completeSession.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'completed';
        // Upsert into today's sessions (avoid duplicates)
        state.todaySessions = [
          action.payload,
          ...state.todaySessions.filter(s => s.id !== action.payload.id),
        ];

        const completedMinutes =
          typeof (action.payload as any)?.actual_duration_minutes === 'number'
            ? Math.max(0, (action.payload as any).actual_duration_minutes)
            : action.payload.duration_minutes;

        state.todayFocusMinutes += completedMinutes;

        // Keep week stats in sync so Analytics updates immediately.
        // (fetchFocusStats still runs to reconcile historical/server truth.)
        const startedAtIso = (action.payload as any)?.started_at as string | undefined;
        if (startedAtIso) {
          const startedAt = new Date(startedAtIso);
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - 6);
          weekStart.setHours(0, 0, 0, 0);

          if (startedAt >= weekStart) {
            state.weekFocusMinutes += completedMinutes;

            const dayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][startedAt.getDay()];
            const existing = state.weekDailyBreakdown.find(d => d.day === dayLabel);
            if (existing) {
              existing.minutes += completedMinutes;
            }
          }
        }

        // Increment sets completed
        state.setsCompleted += 1;
      })
      .addCase(completeSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Cancel session
    builder
      .addCase(cancelSession.fulfilled, (state, action) => {
        state.status = 'idle';
        state.activeSession = null;
        state.remainingSeconds = state.customFocusMinutes * 60;

        // Upsert canceled session into today's sessions so UI/analytics can reflect it.
        state.todaySessions = [
          action.payload,
          ...state.todaySessions.filter(s => s.id !== action.payload.id),
        ];

        const canceledMinutes =
          typeof (action.payload as any)?.actual_duration_minutes === 'number'
            ? Math.max(0, (action.payload as any).actual_duration_minutes)
            : 0;

        if (canceledMinutes > 0) {
          state.todayFocusMinutes += canceledMinutes;

          const startedAtIso = (action.payload as any)?.started_at as string | undefined;
          if (startedAtIso) {
            const startedAt = new Date(startedAtIso);
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 6);
            weekStart.setHours(0, 0, 0, 0);

            if (startedAt >= weekStart) {
              state.weekFocusMinutes += canceledMinutes;

              const dayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][startedAt.getDay()];
              const existing = state.weekDailyBreakdown.find(d => d.day === dayLabel);
              if (existing) {
                existing.minutes += canceledMinutes;
              }
            }
          }
        }
      });

    // Fetch stats
    builder
      .addCase(fetchFocusStats.fulfilled, (state, action) => {
        state.todayFocusMinutes = action.payload.todayMinutes;
        state.weekFocusMinutes = action.payload.weekMinutes;
        state.weekDailyBreakdown = action.payload.dailyBreakdown;
      });
  },
});

export const {
  setPreset,
  setCustomDuration,
  updateSettings,
  setLinkedTodo,
  tick,
  pause,
  resume,
  startBreak,
  reset,
  addTime,
  clearPomodoroError,
  clearSessions,
} = pomodoroSlice.actions;

// Action aliases for backward compatibility
export const pauseSession = pause;
export const resumeSession = resume;
export const resetSession = reset;
export const skipSession = reset;  // Skip is same as reset

export default pomodoroSlice.reducer;

// Selectors
export const selectPomodoroStatus = (state: RootState) => state.pomodoro.status;
export const selectRemainingSeconds = (state: RootState) => state.pomodoro.remainingSeconds;
export const selectActiveSession = (state: RootState) => state.pomodoro.activeSession;
export const selectIsBreak = (state: RootState) => state.pomodoro.isBreak;
export const selectTodayFocusMinutes = (state: RootState) => state.pomodoro.todayFocusMinutes;
export const selectWeekFocusMinutes = (state: RootState) => state.pomodoro.weekFocusMinutes;
export const selectWeekDailyBreakdown = (state: RootState) => state.pomodoro.weekDailyBreakdown;
export const selectPomodoroLoading = (state: RootState) => state.pomodoro.loading;
export const selectPomodoroError = (state: RootState) => state.pomodoro.error;
export const selectLinkedTodoId = (state: RootState) => state.pomodoro.linkedTodoId;
export const selectCurrentPreset = (state: RootState) => state.pomodoro.currentPreset;
export const selectSetsCompleted = (state: RootState) => state.pomodoro.setsCompleted;

export const selectProgress = (state: RootState) => {
  const { remainingSeconds, isBreak, customFocusMinutes, customBreakMinutes } = state.pomodoro;
  const totalSeconds = (isBreak ? customBreakMinutes : customFocusMinutes) * 60;
  if (totalSeconds === 0) return 0;
  return 1 - (remainingSeconds / totalSeconds);
};
