import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import type { Timeblock, TimeblockInsert, TimeblockUpdate } from '@/types/database';
import type { RootState } from '../index';

interface TimeblocksState {
  timeblocks: Timeblock[];
  selectedDate: string; // YYYY-MM-DD format
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: TimeblocksState = {
  timeblocks: [],
  selectedDate: new Date().toISOString().split('T')[0],
  loading: false,
  error: null,
  lastFetched: null,
};

// Async thunks
export const fetchTimeblocks = createAsyncThunk(
  'timeblocks/fetchTimeblocks',
  async (date: string, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('timeblocks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return { timeblocks: data as Timeblock[], date };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchWeekTimeblocks = createAsyncThunk(
  'timeblocks/fetchWeekTimeblocks',
  async ({ startDate, endDate }: { startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('timeblocks')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as Timeblock[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createTimeblock = createAsyncThunk(
  'timeblocks/createTimeblock',
  async (timeblock: Omit<TimeblockInsert, 'user_id'>, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('timeblocks') as any)
        .insert({
          ...timeblock,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Timeblock;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTimeblock = createAsyncThunk(
  'timeblocks/updateTimeblock',
  async ({ id, updates }: { id: string; updates: TimeblockUpdate }, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('timeblocks') as any)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Timeblock;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTimeblock = createAsyncThunk(
  'timeblocks/deleteTimeblock',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('timeblocks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const moveTimeblock = createAsyncThunk(
  'timeblocks/moveTimeblock',
  async ({ id, startTime, endTime, date }: { id: string; startTime: string; endTime: string; date?: string }, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates: TimeblockUpdate = { start_time: startTime, end_time: endTime };
      if (date) updates.date = date;

      const { data, error } = await (supabase
        .from('timeblocks') as any)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Timeblock;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const timeblocksSlice = createSlice({
  name: 'timeblocks',
  initialState,
  reducers: {
    setSelectedDate(state, action: PayloadAction<string>) {
      state.selectedDate = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    // Optimistic update for drag-and-drop
    optimisticMoveTimeblock(state, action: PayloadAction<{ id: string; startTime: string; endTime: string; date?: string }>) {
      const { id, startTime, endTime, date } = action.payload;
      const index = state.timeblocks.findIndex(tb => tb.id === id);
      if (index !== -1) {
        state.timeblocks[index].start_time = startTime;
        state.timeblocks[index].end_time = endTime;
        if (date) state.timeblocks[index].date = date;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch timeblocks for a date
      .addCase(fetchTimeblocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimeblocks.fulfilled, (state, action) => {
        state.loading = false;
        state.timeblocks = action.payload.timeblocks;
        state.selectedDate = action.payload.date;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchTimeblocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch week timeblocks
      .addCase(fetchWeekTimeblocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeekTimeblocks.fulfilled, (state, action) => {
        state.loading = false;
        state.timeblocks = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchWeekTimeblocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create timeblock
      .addCase(createTimeblock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTimeblock.fulfilled, (state, action) => {
        state.loading = false;
        state.timeblocks.push(action.payload);
        // Sort by start time
        state.timeblocks.sort((a, b) => a.start_time.localeCompare(b.start_time));
      })
      .addCase(createTimeblock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update timeblock
      .addCase(updateTimeblock.pending, (state) => {
        state.error = null;
      })
      .addCase(updateTimeblock.fulfilled, (state, action) => {
        const index = state.timeblocks.findIndex(tb => tb.id === action.payload.id);
        if (index !== -1) {
          state.timeblocks[index] = action.payload;
        }
        // Sort by start time
        state.timeblocks.sort((a, b) => a.start_time.localeCompare(b.start_time));
      })
      .addCase(updateTimeblock.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete timeblock
      .addCase(deleteTimeblock.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteTimeblock.fulfilled, (state, action) => {
        state.timeblocks = state.timeblocks.filter(tb => tb.id !== action.payload);
      })
      .addCase(deleteTimeblock.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Move timeblock (drag-and-drop)
      .addCase(moveTimeblock.fulfilled, (state, action) => {
        const index = state.timeblocks.findIndex(tb => tb.id === action.payload.id);
        if (index !== -1) {
          state.timeblocks[index] = action.payload;
        }
        state.timeblocks.sort((a, b) => a.start_time.localeCompare(b.start_time));
      })
      .addCase(moveTimeblock.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedDate, clearError, optimisticMoveTimeblock } = timeblocksSlice.actions;
export default timeblocksSlice.reducer;

// Selectors
export const selectTimeblocks = (state: RootState) => state.timeblocks.timeblocks;
export const selectSelectedDate = (state: RootState) => state.timeblocks.selectedDate;
export const selectTimeblocksLoading = (state: RootState) => state.timeblocks.loading;
export const selectTimeblocksError = (state: RootState) => state.timeblocks.error;

export const selectTimeblocksByDate = (date: string) => (state: RootState) =>
  state.timeblocks.timeblocks.filter(tb => tb.date === date);

export const selectTodaysTimeblocks = (state: RootState) => {
  const today = new Date().toISOString().split('T')[0];
  return state.timeblocks.timeblocks.filter(tb => tb.date === today);
};
