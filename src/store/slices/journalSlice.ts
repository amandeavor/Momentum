import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { Journal, JournalInsert, JournalUpdate, Database } from '@/types/database';
import { RootState } from '../index';

/**
 * Predefined mood options for journal entries.
 */
export const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy', rating: 5 },
  { emoji: '🙂', label: 'Good', rating: 4 },
  { emoji: '😐', label: 'Okay', rating: 3 },
  { emoji: '😔', label: 'Down', rating: 2 },
  { emoji: '😢', label: 'Sad', rating: 1 },
] as const;

/**
 * State definition for the Journal module.
 */
interface JournalState {
  /** List of all journal entries for the current user */
  entries: Journal[];
  /** The currently selected or active entry (for viewing/editing) */
  currentEntry: Journal | null;
  /** Loading state for fetching entries */
  loading: boolean;
  /** Syncing state for mutations (create/update/delete) */
  syncing: boolean;
  /** Error message if any operation fails */
  error: string | null;
  /** Timestamp of last successful sync */
  lastSynced: string | null;
}

const initialState: JournalState = {
  entries: [],
  currentEntry: null,
  loading: false,
  syncing: false,
  error: null,
  lastSynced: null,
};

/**
 * Helper to get a date string for N days ago.
 */
const getDateRange = (days: number) => {
  const now = new Date();
  now.setDate(now.getDate() - days);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
};

// --- Async Thunks ---

/**
 * Fetches journal entries for the authenticated user.
 * Supports an optional limit (default 50).
 */
export const fetchJournals = createAsyncThunk<
  Journal[],
  { limit?: number } | undefined,
  { state: RootState; rejectValue: string }
>(
  'journal/fetchJournals',
  async (args = {}, { getState, rejectWithValue }) => {
    const { limit = 50 } = args;
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Journal[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Fetches journal entries created within the last 7 days.
 * Useful for streak calculation and weekly views.
 */
export const fetchRecentJournals = createAsyncThunk<
  Journal[],
  void,
  { state: RootState; rejectValue: string }
>(
  'journal/fetchRecentJournals',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', getDateRange(7))
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Journal[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Creates a new journal entry in Supabase.
 */
export const createJournal = createAsyncThunk<
  Journal,
  Omit<JournalInsert, 'user_id'>,
  { state: RootState; rejectValue: string }
>(
  'journal/createJournal',
  async (entry, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const insertData: Database['public']['Tables']['journals']['Insert'] = {
        ...entry,
        user_id: userId,
      };

      const { data, error } = await (supabase.from('journals') as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as Journal;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Updates an existing journal entry.
 */
export const updateJournal = createAsyncThunk<
  Journal,
  { id: string; updates: JournalUpdate },
  { rejectValue: string }
>(
  'journal/updateJournal',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const updateData: Database['public']['Tables']['journals']['Update'] = updates;

      const { data, error } = await (supabase.from('journals') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Journal;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Deletes a journal entry permanently.
 */
export const deleteJournal = createAsyncThunk(
  'journal/deleteJournal',
  async (id: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('journals')
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
 * Fetches a single journal entry by its ID.
 */
export const fetchJournalById = createAsyncThunk<
  Journal,
  string,
  { rejectValue: string }
>(
  'journal/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Journal;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Journal Slice
 * Handles state management for user journal entries.
 */
const journalSlice = createSlice({
  name: 'journal',
  initialState,
  reducers: {
    clearJournalError(state) {
      state.error = null;
    },
    setCurrentEntry(state, action: PayloadAction<Journal | null>) {
      state.currentEntry = action.payload;
    },
    // Local-only add (for offline support)
    addJournalLocal(state, action: PayloadAction<Journal>) {
      state.entries.unshift(action.payload);
    },
    // Local-only update (for offline support)
    updateJournalLocal(state, action: PayloadAction<Journal>) {
      const index = state.entries.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.entries[index] = action.payload;
      }
    },
    // Local-only delete (for offline support)
    deleteJournalLocal(state, action: PayloadAction<string>) {
      state.entries = state.entries.filter(e => e.id !== action.payload);
    },
    // Clear all entries (on logout)
    clearJournals(state) {
      state.entries = [];
      state.currentEntry = null;
      state.lastSynced = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch journals
    builder
      .addCase(fetchJournals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJournals.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
        state.lastSynced = new Date().toISOString();
      })
      .addCase(fetchJournals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch recent journals
    builder
      .addCase(fetchRecentJournals.fulfilled, (state, action) => {
        // Merge with existing entries, avoiding duplicates
        const existingIds = new Set(state.entries.map(e => e.id));
        state.entries = [...action.payload, ...state.entries.filter(e =>
          !action.payload.some(ne => ne.id === e.id)
        )];
      });

    // Create journal
    builder
      .addCase(createJournal.pending, (state) => {
        state.syncing = true;
      })
      .addCase(createJournal.fulfilled, (state, action) => {
        state.syncing = false;
        state.entries.unshift(action.payload);
        state.currentEntry = action.payload;
      })
      .addCase(createJournal.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Update journal
    builder
      .addCase(updateJournal.pending, (state) => {
        state.syncing = true;
      })
      .addCase(updateJournal.fulfilled, (state, action) => {
        state.syncing = false;
        const index = state.entries.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.entries[index] = action.payload;
        }
        if (state.currentEntry?.id === action.payload.id) {
          state.currentEntry = action.payload;
        }
      })
      .addCase(updateJournal.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Delete journal
    builder
      .addCase(deleteJournal.pending, (state) => {
        state.syncing = true;
      })
      .addCase(deleteJournal.fulfilled, (state, action) => {
        state.syncing = false;
        state.entries = state.entries.filter(e => e.id !== action.payload);
        if (state.currentEntry?.id === action.payload) {
          state.currentEntry = null;
        }
      })
      .addCase(deleteJournal.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Fetch by ID
    builder
      .addCase(fetchJournalById.fulfilled, (state, action) => {
        state.currentEntry = action.payload;
      });
  },
});

export const {
  clearJournalError,
  setCurrentEntry,
  addJournalLocal,
  updateJournalLocal,
  deleteJournalLocal,
  clearJournals,
} = journalSlice.actions;

// Alias exports for backward compatibility
export const fetchEntries = fetchJournals;
export const addEntry = createJournal;
export const updateEntry = updateJournal;
export const deleteEntry = deleteJournal;

export default journalSlice.reducer;

// --- Selectors ---

export const selectAllJournals = (state: RootState) => state.journal.entries;
export const selectCurrentJournal = (state: RootState) => state.journal.currentEntry;
export const selectJournalLoading = (state: RootState) => state.journal.loading;
export const selectJournalSyncing = (state: RootState) => state.journal.syncing;

/**
 * Select entries by date. Useful for daily view or calendar.
 */
export const selectJournalsByDate = (date: string) => (state: RootState) => {
  const targetDate = new Date(date).toDateString();
  return state.journal.entries.filter(e =>
    new Date(e.created_at).toDateString() === targetDate
  );
};

/**
 * Get mood trend for use in charts.
 * Returns array of objects with date, mood rating, and emoji.
 */
export const selectMoodTrend = (days: number) => (state: RootState) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return state.journal.entries
    .filter(e => new Date(e.created_at) >= cutoff && e.mood_rating)
    .map(e => ({
      date: e.created_at,
      rating: e.mood_rating!,
      mood: e.mood,
    }))
    .reverse();
};
