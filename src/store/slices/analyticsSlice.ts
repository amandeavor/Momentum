import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { RootState } from '../index';
import { colors } from '@/theme/colors';

/**
 * Streak data stored in the database.
 */
interface StreakData {
    user_id: string;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string;
    streak_start_date: string | null;
    updated_at: string;
}

/**
 * State definition for the Analytics module.
 */
interface AnalyticsState {
    /** Set of all unique dates (YYYY-MM-DD) with activity */
    activityDates: string[];
    /** Current streak count */
    currentStreak: number;
    /** Longest streak ever */
    longestStreak: number;
    /** Last activity date (YYYY-MM-DD) */
    lastActivityDate: string | null;
    /** Date when current streak started */
    streakStartDate: string | null;
    /** Loading state */
    loading: boolean;
    /** Error message */
    error: string | null;
    /** Timestamp of last successful update */
    lastUpdated: string | null;
}

const initialState: AnalyticsState = {
    activityDates: [],
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    streakStartDate: null,
    loading: false,
    error: null,
    lastUpdated: null,
};

/**
 * Get today's date in YYYY-MM-DD format (local timezone).
 */
const getToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * Get yesterday's date in YYYY-MM-DD format.
 */
const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
};

/**
 * Calculate the difference in days between two date strings.
 */
const daysDifference = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Fetches streak data from the server.
 */
export const fetchStreakData = createAsyncThunk<
    { currentStreak: number; longestStreak: number; lastActivityDate: string | null; streakStartDate: string | null },
    void,
    { state: RootState; rejectValue: string }
>(
    'analytics/fetchStreakData',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const userId = state.auth.user?.id;

            if (!userId) throw new Error('Not authenticated');

            // Try to get existing streak data
            const { data, error } = await (supabase.from('user_streaks') as any)
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                // PGRST116 = no rows returned, which is fine for new users
                throw error;
            }

            if (data) {
                const streakData = data as any;
                const today = getToday();
                const yesterday = getYesterday();
                const lastActivity = streakData.last_activity_date;

                // Check if streak is still valid (activity today or yesterday)
                let currentStreak = streakData.current_streak;
                if (lastActivity !== today && lastActivity !== yesterday) {
                    // Streak is broken
                    currentStreak = 0;
                }

                return {
                    currentStreak,
                    longestStreak: streakData.longest_streak,
                    lastActivityDate: lastActivity,
                    streakStartDate: streakData.streak_start_date,
                };
            }

            // No streak data yet
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: null,
                streakStartDate: null,
            };
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

/**
 * Records an activity and updates the streak.
 * Call this when user completes a journal entry, pomodoro session, or habit.
 */
export const recordActivity = createAsyncThunk<
    { currentStreak: number; longestStreak: number; lastActivityDate: string; streakStartDate: string },
    void,
    { state: RootState; rejectValue: string }
>(
    'analytics/recordActivity',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const userId = state.auth.user?.id;

            if (!userId) throw new Error('Not authenticated');

            const today = getToday();
            const yesterday = getYesterday();
            const currentState = state.analytics;

            let newStreak = 1;
            let newLongestStreak = currentState.longestStreak;
            let streakStartDate = today;

            // Check if we already recorded activity today
            if (currentState.lastActivityDate === today) {
                // Already recorded today, no change needed
                return {
                    currentStreak: currentState.currentStreak,
                    longestStreak: currentState.longestStreak,
                    lastActivityDate: today,
                    streakStartDate: currentState.streakStartDate || today,
                };
            }

            // Check if activity was yesterday (continuing streak)
            if (currentState.lastActivityDate === yesterday) {
                newStreak = currentState.currentStreak + 1;
                streakStartDate = currentState.streakStartDate || today;
            } else if (currentState.lastActivityDate) {
                // Streak was broken, starting fresh
                newStreak = 1;
                streakStartDate = today;
            }

            // Update longest streak if needed
            if (newStreak > newLongestStreak) {
                newLongestStreak = newStreak;
            }

            // Upsert streak data to server
            const { error } = await (supabase.from('user_streaks') as any)
                .upsert({
                    user_id: userId,
                    current_streak: newStreak,
                    longest_streak: newLongestStreak,
                    last_activity_date: today,
                    streak_start_date: streakStartDate,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id',
                });

            if (error) throw error;

            return {
                currentStreak: newStreak,
                longestStreak: newLongestStreak,
                lastActivityDate: today,
                streakStartDate,
            };
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

/**
 * Fetches activity history from all sources (Journals, Pomodoro Sessions, Habits).
 * Used for the activity heatmap.
 */
export const fetchActivityHistory = createAsyncThunk<
    string[],
    void,
    { state: RootState; rejectValue: string }
>(
    'analytics/fetchActivityHistory',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const userId = state.auth.user?.id;

            if (!userId) throw new Error('Not authenticated');

            // Fetch from all activity sources in parallel
            const [journalResult, pomodoroResult, habitResult] = await Promise.all([
                supabase
                    .from('journals')
                    .select('created_at')
                    .eq('user_id', userId),
                supabase
                    .from('pomodoro_sessions')
                    .select('started_at, completed, actual_duration_minutes')
                    .eq('user_id', userId),
                supabase
                    .from('habit_completions')
                    .select('completed_at')
                    .eq('user_id', userId),
            ]);

            if (journalResult.error) throw journalResult.error;
            if (pomodoroResult.error) throw pomodoroResult.error;
            if (habitResult.error) throw habitResult.error;

            // Collect all activity dates
            const allDates = new Set<string>();

            (journalResult.data as any[] | null)?.forEach((item: any) => {
                const date = item.created_at?.split('T')[0];
                if (date) allDates.add(date);
            });

            (pomodoroResult.data as any[] | null)?.forEach((item: any) => {
                // Include completed sessions OR partial sessions with actual time > 0
                const hasActualTime = typeof item.actual_duration_minutes === 'number' && item.actual_duration_minutes > 0;
                if (item.completed || hasActualTime) {
                    const date = item.started_at?.split('T')[0];
                    if (date) allDates.add(date);
                }
            });

            (habitResult.data as any[] | null)?.forEach((item: any) => {
                const date = item.completed_at?.split('T')[0];
                if (date) allDates.add(date);
            });

            // Return sorted array (newest first)
            return Array.from(allDates).sort().reverse();

        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

/**
 * Analytics Slice
 * Manages streak data and activity history.
 */
const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        clearAnalytics(state) {
            state.activityDates = [];
            state.currentStreak = 0;
            state.longestStreak = 0;
            state.lastActivityDate = null;
            state.streakStartDate = null;
            state.lastUpdated = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch streak data
        builder
            .addCase(fetchStreakData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStreakData.fulfilled, (state, action) => {
                state.loading = false;
                state.currentStreak = action.payload.currentStreak;
                state.longestStreak = action.payload.longestStreak;
                state.lastActivityDate = action.payload.lastActivityDate;
                state.streakStartDate = action.payload.streakStartDate;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchStreakData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Record activity
        builder
            .addCase(recordActivity.fulfilled, (state, action) => {
                state.currentStreak = action.payload.currentStreak;
                state.longestStreak = action.payload.longestStreak;
                state.lastActivityDate = action.payload.lastActivityDate;
                state.streakStartDate = action.payload.streakStartDate;
                state.lastUpdated = new Date().toISOString();
            });

        // Fetch activity history
        builder
            .addCase(fetchActivityHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchActivityHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.activityDates = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchActivityHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;

// --- Selectors ---

export const selectAnalyticsState = (state: RootState) => state.analytics;

export const selectActivityDates = createSelector(
    selectAnalyticsState,
    (state) => state.activityDates
);

export const selectCurrentStreak = createSelector(
    selectAnalyticsState,
    (state) => state.currentStreak
);

export const selectLongestStreak = createSelector(
    selectAnalyticsState,
    (state) => state.longestStreak
);

/**
 * Alias for backward compatibility with selectGlobalStreak.
 */
export const selectGlobalStreak = selectCurrentStreak;

/**
 * Generates an insight/motivational message based on user stats.
 */
export const selectAnalyticsInsights = createSelector(
    selectCurrentStreak,
    selectLongestStreak,
    (state: RootState) => state.pomodoro.weekFocusMinutes,
    (currentStreak, longestStreak, focusMinutes) => {
        // Priority 1: New personal best streak
        if (currentStreak > 0 && currentStreak === longestStreak && currentStreak > 3) {
            return {
                title: "New Personal Best! 🎉",
                message: `You've hit a ${currentStreak}-day streak — your longest ever! Keep going!`,
                icon: "trophy",
                color: colors.dark.pastelYellow,
            };
        }

        // Priority 2: Strong streak
        if (currentStreak >= 7) {
            return {
                title: "You're Unstoppable! 🔥",
                message: `${currentStreak} days in a row. You're building an incredible habit.`,
                icon: "flame",
                color: colors.dark.pastelOrange,
            };
        }

        // Priority 3: Building momentum
        if (currentStreak >= 3) {
            return {
                title: "Momentum Building",
                message: `${currentStreak}-day streak! Keep showing up — consistency is key.`,
                icon: "rocket",
                color: colors.dark.pastelBlue,
            };
        }

        // Priority 4: Deep work
        if (focusMinutes > 120) {
            return {
                title: "Deep Work Master",
                message: `${Math.floor(focusMinutes / 60)}+ hours of focus this week. Incredible dedication!`,
                icon: "timer",
                color: colors.dark.pastelPurple,
            };
        }

        // Priority 5: Starting fresh
        if (currentStreak === 1) {
            return {
                title: "Day 1 — Let's Go!",
                message: "Every streak starts with day one. Come back tomorrow to keep it going!",
                icon: "sunny",
                color: colors.dark.pastelGreen,
            };
        }

        // Default
        return {
            title: "Start Your Streak",
            message: "Complete a task, log a journal, or finish a focus session to begin.",
            icon: "pulse",
            color: colors.dark.textTertiary,
        };
    }
);
