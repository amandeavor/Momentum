import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { RootState } from '../index';
import { colors } from '@/theme/colors';

interface AnalyticsState {
    activityDates: string[]; // Set of all unique dates (YYYY-MM-DD) with activity
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
}

const initialState: AnalyticsState = {
    activityDates: [],
    loading: false,
    error: null,
    lastUpdated: null,
};

// Helper to normalize date to YYYY-MM-DD
const normalizeDate = (dateStr: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toISOString().split('T')[0];
};

// Fetch activity history from all sources
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

            // 1. Fetch Journal Dates
            const { data: journalData, error: journalError } = await supabase
                .from('journal_entries')
                .select('created_at')
                .eq('user_id', userId);

            if (journalError) throw journalError;

            // 2. Fetch Completed Pomodoro Dates (include partial sessions with actual_duration > 0)
            const { data: pomodoroData, error: pomodoroError } = await supabase
                .from('pomodoro_sessions')
                .select('started_at, completed, actual_duration_minutes')
                .eq('user_id', userId);

            if (pomodoroError) throw pomodoroError;

            // 3. Fetch Habit Completion Dates
            const { data: habitData, error: habitError } = await supabase
                .from('habit_completions')
                .select('completed_at')
                .eq('user_id', userId);

            if (habitError) throw habitError;

            // Combine and unique dates
            const allDates = new Set<string>();

            (journalData as any[])?.forEach(item => {
                const date = normalizeDate(item.created_at);
                if (date) allDates.add(date);
            });

            (pomodoroData as any[])?.forEach(item => {
                // Include completed sessions OR partial sessions with actual time > 0
                const hasActualTime = typeof item.actual_duration_minutes === 'number' && item.actual_duration_minutes > 0;
                if (item.completed || hasActualTime) {
                    const date = normalizeDate(item.started_at);
                    if (date) allDates.add(date);
                }
            });

            (habitData as any[])?.forEach(item => {
                const date = normalizeDate(item.completed_at);
                if (date) allDates.add(date);
            });

            // Return sorted array (newest first)
            return Array.from(allDates).sort().reverse();

        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        clearAnalytics(state) {
            state.activityDates = [];
            state.lastUpdated = null;
        }
    },
    extraReducers: (builder) => {
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

// Selectors
export const selectAnalyticsState = (state: any) => state.analytics;

export const selectActivityDates = createSelector(
    selectAnalyticsState,
    (state: AnalyticsState) => state.activityDates
);

export const selectGlobalStreak = createSelector(
    selectActivityDates,
    (dates) => {
        if (!dates || dates.length === 0) return 0;

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Check if the most recent activity is today or yesterday to consider streak active
        if (dates[0] !== today && dates[0] !== yesterday) {
            return 0;
        }

        let streak = 0;
        let currentDate = new Date(dates[0]);

        // Iterate through dates to find consecutive days
        for (let i = 0; i < dates.length; i++) {
            const entryDate = new Date(dates[i]);
            const diffTime = Math.abs(currentDate.getTime() - entryDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (i === 0) {
                streak = 1; // Start counting
            } else if (diffDays === 1) {
                streak++; // Consecutive day
            } else if (diffDays === 0) {
                continue; // Same day, ignore
            } else {
                break; // Gap found
            }
            currentDate = entryDate;
        }

        return streak;
    }
);

export const selectPeakFocusHour = createSelector(
    (state: RootState) => state.pomodoro.weekDailyBreakdown, // Using daily breakdown isn't enough for hourly.
    (state: RootState) => state.pomodoro.sessions, // We need raw sessions
    (breakdown, sessions) => {
        if (!sessions || sessions.length === 0) return null;

        const hourCounts = new Array(24).fill(0);

        sessions.forEach(session => {
            // Only count productive sessions > 10 mins
            if (session.duration_minutes > 10) {
                const hour = new Date(session.started_at).getHours();
                hourCounts[hour]++;
            }
        });

        let maxCount = 0;
        let peakHour = -1;

        hourCounts.forEach((count, hour) => {
            if (count > maxCount) {
                maxCount = count;
                peakHour = hour;
            }
        });

        if (peakHour === -1) return null;

        // Convert to 12h format string
        const ampm = peakHour >= 12 ? 'PM' : 'AM';
        const displayHour = peakHour % 12 || 12;
        return `${displayHour} ${ampm}`;
    }
);

export const selectAnalyticsInsights = createSelector(
    selectGlobalStreak,
    (state: any) => state.pomodoro.weekFocusMinutes,
    (state: any) => state.tasks.todos.filter((t: any) => t.completed).length,
    selectPeakFocusHour,
    (streak, focusMinutes, completedTasks, peakHour) => {
        // Priority 1: Streak Milestones
        if (streak > 3) {
            return {
                title: "You're on fire!",
                message: `You've maintained a ${streak}-day streak. Keep the momentum going!`,
                icon: "flame",
                color: colors.dark.pastelOrange
            };
        }

        // Priority 2: Deep Work
        if (focusMinutes > 120) {
            return {
                title: "Deep Work Master",
                message: `You've focused for over ${(focusMinutes / 60).toFixed(1)} hours this week. Impressive focus!`,
                icon: "timer",
                color: colors.dark.pastelPurple
            };
        }

        // Priority 3: Peak Performance (New!)
        if (peakHour) {
            return {
                title: "Peak Performer",
                message: `You're most productive around ${peakHour}. Schedule your hardest tasks then!`,
                icon: "flash",
                color: colors.dark.pastelYellow
            };
        }

        // Priority 4: Task Completion
        if (completedTasks > 5) {
            return {
                title: "Task Crusher",
                message: `You've completed ${completedTasks} tasks. You're getting things done!`,
                icon: "checkmark-circle",
                color: colors.dark.pastelGreen
            };
        }

        return {
            title: "Build Momentum",
            message: "Complete a task, log a journal, or start a focus session to build your streak.",
            icon: "pulse",
            color: colors.dark.textTertiary
        };
    }
);
