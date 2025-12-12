import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { DbGoal, DbGoalInsert, DbGoalUpdate, DbMilestone, DbMilestoneInsert, DbMilestoneUpdate, GoalSession, GoalSessionInsert } from '@/types/database';
import { RootState } from '../index';

/**
 * State definition for the Goals module.
 */
interface GoalsState {
  /** List of all user goals. */
  goals: DbGoal[];
  /** Flattened list of all milestones across all goals. */
  milestones: DbMilestone[];
  /** Recent work sessions on goals. */
  sessions: GoalSession[];
  /** Currently selected or active goal for detailed view. */
  currentGoal: DbGoal | null;
  /** Loading state for fetching data. */
  loading: boolean;
  /** Syncing state for mutations (create/update/delete). */
  syncing: boolean;
  /** Error message if any operation fails. */
  error: string | null;
  /** Timestamp of last successful sync. */
  lastSynced: string | null;
}

const initialState: GoalsState = {
  goals: [],
  milestones: [],
  sessions: [],
  currentGoal: null,
  loading: false,
  syncing: false,
  error: null,
  lastSynced: null,
};

// Helper to get typed table access (bypassing strict Supabase types until regenerated)
const goalsTable = () => (supabase.from('goals') as any);
const milestonesTable = () => (supabase.from('milestones') as any);

// --- Async Thunks ---

/**
 * Fetches all goals and their associated milestones.
 * Can filter by goal status (e.g., 'active', 'completed').
 */
export const fetchGoals = createAsyncThunk<
  { goals: DbGoal[]; milestones: DbMilestone[] },
  { status?: 'active' | 'completed' | 'paused' | 'abandoned' } | undefined,
  { state: RootState; rejectValue: string }
>(
  'goals/fetchGoals',
  async (args = {}, { getState, rejectWithValue }) => {
    const { status } = args;
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      // Fetch goals
      let goalsQuery = goalsTable()
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        goalsQuery = goalsQuery.eq('status', status);
      }

      const { data: goals, error: goalsError } = await goalsQuery;
      if (goalsError) throw goalsError;

      // Fetch milestones for all goals
      const goalIds = (goals as DbGoal[]).map(g => g.id);
      let milestones: DbMilestone[] = [];

      if (goalIds.length > 0) {
        const { data: milestonesData, error: milestonesError } = await milestonesTable()
          .select('*')
          .in('goal_id', goalIds)
          .order('order_index', { ascending: true });

        if (milestonesError) throw milestonesError;
        milestones = milestonesData as DbMilestone[];
      }

      return { goals: goals as DbGoal[], milestones };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Creates a new goal.
 */
export const createGoalAsync = createAsyncThunk<
  DbGoal,
  Omit<DbGoalInsert, 'user_id'>,
  { state: RootState; rejectValue: string }
>(
  'goals/createGoal',
  async (goalData, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await goalsTable()
        .insert({ ...goalData, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data as DbGoal;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Updates an existing goal.
 */
export const updateGoalAsync = createAsyncThunk<
  DbGoal,
  { id: string; updates: DbGoalUpdate },
  { rejectValue: string }
>(
  'goals/updateGoal',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data, error } = await goalsTable()
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DbGoal;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Deletes a goal and its associated milestones (via cascade).
 */
export const deleteGoalAsync = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'goals/deleteGoal',
  async (id, { rejectWithValue }) => {
    try {
      const { error } = await goalsTable()
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
 * Creates a new milestone for a goal.
 */
export const createMilestone = createAsyncThunk<
  DbMilestone,
  Omit<DbMilestoneInsert, 'user_id'>,
  { state: RootState; rejectValue: string }
>(
  'goals/createMilestone',
  async (milestoneData, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await milestonesTable()
        .insert({ ...milestoneData, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data as DbMilestone;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Updates a milestone.
 */
export const updateMilestone = createAsyncThunk<
  DbMilestone,
  { id: string; updates: DbMilestoneUpdate },
  { rejectValue: string }
>(
  'goals/updateMilestone',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data, error } = await milestonesTable()
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DbMilestone;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Toggles a milestone's completion status.
 * Automatically recalculates and updates the parent goal's progress percentage.
 */
export const toggleMilestone = createAsyncThunk<
  { milestone: DbMilestone; goal: DbGoal },
  string,
  { state: RootState; rejectValue: string }
>(
  'goals/toggleMilestone',
  async (milestoneId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const milestone = state.goals.milestones.find(m => m.id === milestoneId);

      if (!milestone) throw new Error('Milestone not found');

      const newAchieved = !milestone.achieved;

      // Update milestone
      const { data: updatedMilestone, error: milestoneError } = await milestonesTable()
        .update({
          achieved: newAchieved,
          achieved_at: newAchieved ? new Date().toISOString() : null,
        })
        .eq('id', milestoneId)
        .select()
        .single();

      if (milestoneError) throw milestoneError;

      // Recalculate goal progress
      const goalMilestones = state.goals.milestones.filter(
        m => m.goal_id === milestone.goal_id
      );

      // Count completed milestones (including the updated one)
      const completedCount = goalMilestones.filter(m =>
        m.id === milestoneId ? newAchieved : m.achieved
      ).length;

      const newProgress = goalMilestones.length > 0
        ? Math.round((completedCount / goalMilestones.length) * 100)
        : 0;

      // Update goal progress
      const { data: updatedGoal, error: goalError } = await goalsTable()
        .update({
          progress: newProgress,
          status: newProgress === 100 ? 'completed' : 'active',
        })
        .eq('id', milestone.goal_id)
        .select()
        .single();

      if (goalError) throw goalError;

      return {
        milestone: updatedMilestone as DbMilestone,
        goal: updatedGoal as DbGoal,
      };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Deletes a milestone.
 */
export const deleteMilestone = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'goals/deleteMilestone',
  async (id, { rejectWithValue }) => {
    try {
      const { error } = await milestonesTable()
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
 * Records a work session against a goal (Check-in).
 * Updates an existing session if one exists for today, otherwise creates new.
 */
export const checkInGoal = createAsyncThunk<
  GoalSession,
  { goalId: string; durationMinutes?: number; notes?: string },
  { state: RootState; rejectValue: string }
>(
  'goals/checkInGoal',
  async ({ goalId, durationMinutes = 0, notes }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];

      // Check if already checked in today
      const { data: existing } = await (supabase.from('goal_sessions') as any)
        .select('*')
        .eq('goal_id', goalId)
        .eq('session_date', today)
        .single();

      if (existing) {
        // Update existing session
        const { data, error } = await (supabase.from('goal_sessions') as any)
          .update({
            duration_minutes: (existing.duration_minutes || 0) + durationMinutes,
            notes: notes || existing.notes,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as GoalSession;
      } else {
        // Create new session
        const { data, error } = await (supabase.from('goal_sessions') as any)
          .insert({
            goal_id: goalId,
            user_id: userId,
            session_date: today,
            duration_minutes: durationMinutes,
            notes,
          })
          .select()
          .single();

        if (error) throw error;
        return data as GoalSession;
      }
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Goals Slice
 * Manages state for Goals, Milestones, and Goal Sessions.
 */
const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    clearGoalsError(state) {
      state.error = null;
    },
    setCurrentGoal(state, action: PayloadAction<DbGoal | null>) {
      state.currentGoal = action.payload;
    },
    // Local-only operations for optimistic updates
    addGoalLocal(state, action: PayloadAction<DbGoal>) {
      state.goals.unshift(action.payload);
    },
    updateGoalLocal(state, action: PayloadAction<DbGoal>) {
      const index = state.goals.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.goals[index] = action.payload;
      }
    },
    removeGoalLocal(state, action: PayloadAction<string>) {
      state.goals = state.goals.filter(g => g.id !== action.payload);
      state.milestones = state.milestones.filter(m => m.goal_id !== action.payload);
    },
    clearGoals(state) {
      state.goals = [];
      state.milestones = [];
      state.sessions = [];
      state.currentGoal = null;
      state.lastSynced = null;
    },
    // Legacy compatibility actions
    fetchGoalsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchGoalsSuccess(state, action: PayloadAction<DbGoal[]>) {
      state.loading = false;
      state.goals = action.payload;
    },
    fetchGoalsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    addGoal(state, action: PayloadAction<DbGoal>) {
      state.goals.push(action.payload);
    },
    updateGoal(state, action: PayloadAction<DbGoal>) {
      const index = state.goals.findIndex(goal => goal.id === action.payload.id);
      if (index !== -1) {
        state.goals[index] = action.payload;
      }
    },
    removeGoal(state, action: PayloadAction<string>) {
      state.goals = state.goals.filter(goal => goal.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Fetch goals
    builder
      .addCase(fetchGoals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = action.payload.goals;
        state.milestones = action.payload.milestones;
        state.lastSynced = new Date().toISOString();
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create goal
    builder
      .addCase(createGoalAsync.pending, (state) => {
        state.syncing = true;
      })
      .addCase(createGoalAsync.fulfilled, (state, action) => {
        state.syncing = false;
        state.goals.unshift(action.payload);
      })
      .addCase(createGoalAsync.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Update goal
    builder
      .addCase(updateGoalAsync.pending, (state) => {
        state.syncing = true;
      })
      .addCase(updateGoalAsync.fulfilled, (state, action) => {
        state.syncing = false;
        const index = state.goals.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
        if (state.currentGoal?.id === action.payload.id) {
          state.currentGoal = action.payload;
        }
      })
      .addCase(updateGoalAsync.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Delete goal
    builder
      .addCase(deleteGoalAsync.pending, (state) => {
        state.syncing = true;
      })
      .addCase(deleteGoalAsync.fulfilled, (state, action) => {
        state.syncing = false;
        state.goals = state.goals.filter(g => g.id !== action.payload);
        state.milestones = state.milestones.filter(m => m.goal_id !== action.payload);
        if (state.currentGoal?.id === action.payload) {
          state.currentGoal = null;
        }
      })
      .addCase(deleteGoalAsync.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Create milestone
    builder
      .addCase(createMilestone.fulfilled, (state, action) => {
        state.milestones.push(action.payload);
      });

    // Update milestone
    builder
      .addCase(updateMilestone.fulfilled, (state, action) => {
        const index = state.milestones.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.milestones[index] = action.payload;
        }
      });

    // Toggle milestone
    builder
      .addCase(toggleMilestone.fulfilled, (state, action) => {
        const milestoneIndex = state.milestones.findIndex(
          m => m.id === action.payload.milestone.id
        );
        if (milestoneIndex !== -1) {
          state.milestones[milestoneIndex] = action.payload.milestone;
        }
        const goalIndex = state.goals.findIndex(
          g => g.id === action.payload.goal.id
        );
        if (goalIndex !== -1) {
          state.goals[goalIndex] = action.payload.goal;
        }
      });

    // Delete milestone
    builder
      .addCase(deleteMilestone.fulfilled, (state, action) => {
        state.milestones = state.milestones.filter(m => m.id !== action.payload);
      });

    // Check in goal
    builder
      .addCase(checkInGoal.fulfilled, (state, action) => {
        const existingIndex = state.sessions.findIndex(
          s => s.id === action.payload.id
        );
        if (existingIndex !== -1) {
          state.sessions[existingIndex] = action.payload;
        } else {
          state.sessions.push(action.payload);
        }
      });
  },
});

export const {
  clearGoalsError,
  setCurrentGoal,
  addGoalLocal,
  updateGoalLocal,
  removeGoalLocal,
  clearGoals,
  fetchGoalsStart,
  fetchGoalsSuccess,
  fetchGoalsFailure,
  addGoal,
  updateGoal,
  removeGoal,
} = goalsSlice.actions;

export default goalsSlice.reducer;

// --- Selectors ---

const selectGoalsState = (state: RootState) => state.goals;

export const selectAllGoals = createSelector(
  [selectGoalsState],
  (goalsState) => goalsState.goals
);

export const selectActiveGoals = createSelector(
  [selectAllGoals],
  (goals) => goals.filter(g => g.status === 'active')
);

export const selectCompletedGoals = createSelector(
  [selectAllGoals],
  (goals) => goals.filter(g => g.status === 'completed')
);

export const selectCurrentGoal = createSelector(
  [selectGoalsState],
  (goalsState) => goalsState.currentGoal
);

export const selectGoalsLoading = createSelector(
  [selectGoalsState],
  (goalsState) => goalsState.loading
);

export const selectGoalsSyncing = createSelector(
  [selectGoalsState],
  (goalsState) => goalsState.syncing
);

export const selectAllMilestones = createSelector(
  [selectGoalsState],
  (goalsState) => goalsState.milestones
);

/**
 * Gets a specific goal by ID.
 * Memoized.
 */
export const selectGoalById = (goalId: string) =>
  createSelector(
    [selectAllGoals],
    (goals) => goals.find(g => g.id === goalId)
  );

/**
 * Gets all milestones associated with a specific goal ID.
 * Memoized.
 */
export const selectMilestonesByGoalId = (goalId: string) =>
  createSelector(
    [selectAllMilestones],
    (milestones) => milestones.filter(m => m.goal_id === goalId)
  );

/**
 * Calculates percentage progress for a goal based on its milestones.
 * Returns a number between 0 and 100.
 */
export const selectGoalProgress = (goalId: string) =>
  createSelector(
    [selectAllMilestones],
    (milestones) => {
      const goalMilestones = milestones.filter(m => m.goal_id === goalId);
      if (goalMilestones.length === 0) return 0;
      const completed = goalMilestones.filter(m => m.achieved).length;
      return Math.round((completed / goalMilestones.length) * 100);
    }
  );