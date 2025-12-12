import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { DbHabit, DbHabitInsert, DbHabitUpdate, HabitCompletion } from '@/types/database';
import { RootState } from '../index';

/**
 * State definition for the Habits module.
 */
interface HabitsState {
  /** List of all habits matching the user's current filter (active/archived). */
  habits: DbHabit[];
  /** List of habit completions for the current day. */
  completions: HabitCompletion[];
  /** Loading state for fetching habits/completions. */
  loading: boolean;
  /** Syncing state for mutations (create/update/delete/check-in). */
  syncing: boolean;
  /** Error message if any operation fails. */
  error: string | null;
  /** Timestamp of last successful sync. */
  lastSynced: string | null;
}

const initialState: HabitsState = {
  habits: [],
  completions: [],
  loading: false,
  syncing: false,
  error: null,
  lastSynced: null,
};

/**
 * Helper to get the start and end indices for today's date range.
 * Used for querying daily completions.
 */
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
};

// --- Async Thunks ---

/**
 * Fetches all habits for the authenticated user.
 * Can filter by archive status.
 */
export const fetchHabits = createAsyncThunk<
  DbHabit[],
  { includeArchived?: boolean } | undefined,
  { state: RootState; rejectValue: string }
>(
  'habits/fetchHabits',
  async (args = {}, { getState, rejectWithValue }) => {
    const { includeArchived = false } = args;
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      let query = (supabase.from('habits') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DbHabit[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Fetches habit completions for the current day.
 */
export const fetchTodayCompletions = createAsyncThunk<
  HabitCompletion[],
  void,
  { state: RootState; rejectValue: string }
>(
  'habits/fetchTodayCompletions',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const { start, end } = getTodayRange();

      const { data, error } = await (supabase.from('habit_completions') as any)
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', start)
        .lte('completed_at', end);

      if (error) throw error;
      return data as HabitCompletion[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Creates a new habit definition.
 */
export const createHabit = createAsyncThunk<
  DbHabit,
  Omit<DbHabitInsert, 'user_id'>,
  { state: RootState; rejectValue: string }
>(
  'habits/createHabit',
  async (habitData, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await (supabase.from('habits') as any)
        .insert({ ...habitData, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data as DbHabit;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Updates an existing habit's details.
 */
export const updateHabitAsync = createAsyncThunk<
  DbHabit,
  { id: string; updates: DbHabitUpdate },
  { rejectValue: string }
>(
  'habits/updateHabit',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data, error } = await (supabase.from('habits') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DbHabit;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Deletes a habit permanently (and its history, depending on cascade rules).
 */
export const deleteHabitAsync = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'habits/deleteHabit',
  async (id, { rejectWithValue }) => {
    try {
      const { error } = await (supabase.from('habits') as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Marks a habit as completed for today (Check-in).
 * Also increments the habit's streak.
 */
export const completeHabit = createAsyncThunk<
  { habit: DbHabit; completion: HabitCompletion },
  { habitId: string; notes?: string },
  { state: RootState; rejectValue: string }
>(
  'habits/completeHabit',
  async ({ habitId, notes }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      // Create completion record
      const { data: completion, error: completionError } = await (supabase
        .from('habit_completions') as any)
        .insert({
          habit_id: habitId,
          user_id: userId,
          notes,
        })
        .select()
        .single();

      if (completionError) throw completionError;

      // Update habit streak
      const habit = state.habits.habits.find((h: DbHabit) => h.id === habitId);
      const newStreak = (habit?.streak_count || 0) + 1;
      const newBestStreak = Math.max(newStreak, habit?.best_streak || 0);

      const { data: updatedHabit, error: habitError } = await (supabase
        .from('habits') as any)
        .update({
          streak_count: newStreak,
          best_streak: newBestStreak,
          last_completed_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .select()
        .single();

      if (habitError) throw habitError;

      return {
        habit: updatedHabit as DbHabit,
        completion: completion as HabitCompletion,
      };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Archives a habit, hiding it from the main list but preserving history.
 */
export const archiveHabit = createAsyncThunk<
  DbHabit,
  string,
  { rejectValue: string }
>(
  'habits/archiveHabit',
  async (id, { rejectWithValue }) => {
    try {
      const { data, error } = await (supabase.from('habits') as any)
        .update({ is_archived: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DbHabit;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Habits Slice
 * Manages user habits, daily completions, and streak tracking.
 */
const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    clearHabitsError(state) {
      state.error = null;
    },
    // Local-only operations for optimistic updates and offline support
    addHabitLocal(state, action: PayloadAction<DbHabit>) {
      state.habits.unshift(action.payload);
    },
    updateHabitLocal(state, action: PayloadAction<DbHabit>) {
      const index = state.habits.findIndex(h => h.id === action.payload.id);
      if (index !== -1) {
        state.habits[index] = action.payload;
      }
    },
    removeHabitLocal(state, action: PayloadAction<string>) {
      state.habits = state.habits.filter(h => h.id !== action.payload);
    },
    clearHabits(state) {
      state.habits = [];
      state.completions = [];
      state.lastSynced = null;
    },
    // Legacy actions for backward compatibility
    addHabit(state, action: PayloadAction<DbHabit>) {
      state.habits.push(action.payload);
    },
    removeHabit(state, action: PayloadAction<string>) {
      state.habits = state.habits.filter(habit => habit.id !== action.payload);
    },
    updateHabit(state, action: PayloadAction<DbHabit>) {
      const index = state.habits.findIndex(habit => habit.id === action.payload.id);
      if (index !== -1) {
        state.habits[index] = action.payload;
      }
    },
    setHabits(state, action: PayloadAction<DbHabit[]>) {
      state.habits = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch habits
    builder
      .addCase(fetchHabits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHabits.fulfilled, (state, action) => {
        state.loading = false;
        state.habits = action.payload;
        state.lastSynced = new Date().toISOString();
      })
      .addCase(fetchHabits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch today's completions
    builder
      .addCase(fetchTodayCompletions.fulfilled, (state, action) => {
        state.completions = action.payload;
      });

    // Create habit
    builder
      .addCase(createHabit.pending, (state) => {
        state.syncing = true;
      })
      .addCase(createHabit.fulfilled, (state, action) => {
        state.syncing = false;
        state.habits.unshift(action.payload);
      })
      .addCase(createHabit.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Update habit
    builder
      .addCase(updateHabitAsync.pending, (state) => {
        state.syncing = true;
      })
      .addCase(updateHabitAsync.fulfilled, (state, action) => {
        state.syncing = false;
        const index = state.habits.findIndex(h => h.id === action.payload.id);
        if (index !== -1) {
          state.habits[index] = action.payload;
        }
      })
      .addCase(updateHabitAsync.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Delete habit
    builder
      .addCase(deleteHabitAsync.pending, (state) => {
        state.syncing = true;
      })
      .addCase(deleteHabitAsync.fulfilled, (state, action) => {
        state.syncing = false;
        state.habits = state.habits.filter(h => h.id !== action.payload);
      })
      .addCase(deleteHabitAsync.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Complete habit
    builder
      .addCase(completeHabit.pending, (state) => {
        state.syncing = true;
      })
      .addCase(completeHabit.fulfilled, (state, action) => {
        state.syncing = false;
        const index = state.habits.findIndex(h => h.id === action.payload.habit.id);
        if (index !== -1) {
          state.habits[index] = action.payload.habit;
        }
        state.completions.push(action.payload.completion);
      })
      .addCase(completeHabit.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Archive habit
    builder
      .addCase(archiveHabit.fulfilled, (state, action) => {
        state.habits = state.habits.filter(h => h.id !== action.payload.id);
      });
  },
});

export const {
  clearHabitsError,
  addHabitLocal,
  updateHabitLocal,
  removeHabitLocal,
  clearHabits,
  addHabit,
  removeHabit,
  updateHabit,
  setHabits,
} = habitsSlice.actions;

export default habitsSlice.reducer;

// --- Selectors ---

const selectHabitsState = (state: RootState) => state.habits;

export const selectAllHabits = createSelector(
  [selectHabitsState],
  (habitsState) => habitsState.habits
);

/** Selects only non-archived habits. */
export const selectActiveHabits = createSelector(
  [selectAllHabits],
  (habits) => habits.filter(h => !h.is_archived)
);

export const selectTodayCompletions = createSelector(
  [selectHabitsState],
  (habitsState) => habitsState.completions
);

export const selectHabitsLoading = createSelector(
  [selectHabitsState],
  (habitsState) => habitsState.loading
);

export const selectHabitsSyncing = createSelector(
  [selectHabitsState],
  (habitsState) => habitsState.syncing
);

/**
 * Checks if a specific habit has been completed today.
 * Returns a boolean selector.
 */
export const selectIsHabitCompletedToday = (habitId: string) =>
  createSelector(
    [selectTodayCompletions],
    (completions) => completions.some(c => c.habit_id === habitId)
  );

export const selectHabitById = (habitId: string) =>
  createSelector(
    [selectAllHabits],
    (habits) => habits.find(h => h.id === habitId)
  );