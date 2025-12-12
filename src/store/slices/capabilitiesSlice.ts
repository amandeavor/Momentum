import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { Capabilities, CapabilitiesUpdate, Database } from '@/types/database';
import { RootState, AppDispatch } from '../index';

// Default capabilities
const DEFAULT_CAPABILITIES: Omit<Capabilities, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  streaks_enabled: true,
  friends_enabled: false,
  notes_enabled: false,
  pinned_tabs: [],
};

/**
 * Valid identifiers for main navigation tabs.
 */
export type TabId = 'home' | 'focus' | 'streaks' | 'journal' | 'social' | 'profile' | 'more';

/**
 * State definition for User Capabilities (feature flags & nav preferences).
 */
interface CapabilitiesState {
  /** The user's capabilities record from DB. */
  capabilities: Capabilities | null;
  /** Loading state for fetch/update operations. */
  loading: boolean;
  /** Error message from last failed operation. */
  error: string | null;

  /** Computed list of visible tabs in the bottom navigation. */
  visibleTabs: TabId[];
  /** Cached list of pinned tabs. */
  pinnedTabs: TabId[];
}

const initialState: CapabilitiesState = {
  capabilities: null,
  loading: false,
  error: null,
  visibleTabs: ['home', 'focus', 'journal', 'profile'],
  pinnedTabs: [],
};

// Compute visible tabs based on capabilities
const computeVisibleTabs = (caps: Capabilities | null): TabId[] => {
  const baseTabs: TabId[] = ['home', 'focus', 'journal', 'profile'];

  if (!caps) return baseTabs;

  const tabs: TabId[] = ['home', 'focus'];

  // Add streaks tab if enabled and pinned
  if (caps.streaks_enabled && caps.pinned_tabs.includes('streaks')) {
    tabs.push('streaks');
  }

  // Always show journal
  tabs.push('journal');

  // Add social tab if friends enabled and pinned
  if (caps.friends_enabled && caps.pinned_tabs.includes('social')) {
    tabs.push('social');
  }

  // Profile always last
  tabs.push('profile');

  // If more than 5 tabs, add "more" and limit to 5
  if (tabs.length > 5) {
    const visible = tabs.slice(0, 4);
    visible.push('more');
    return visible;
  }

  return tabs;
};

// --- Async Thunks ---

/**
 * Fetches user capabilities from the database.
 */
export const fetchCapabilities = createAsyncThunk<
  Capabilities,
  void,
  { state: RootState; rejectValue: string }
>(
  'capabilities/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('capabilities')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as Capabilities;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Updates user capabilities (bulk update).
 */
export const updateCapabilities = createAsyncThunk<
  Capabilities,
  CapabilitiesUpdate,
  { state: RootState; rejectValue: string }
>(
  'capabilities/update',
  async (updates, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const updateData: Database['public']['Tables']['capabilities']['Update'] = updates;

      const { data, error } = await (supabase.from('capabilities') as any)
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as Capabilities;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Toggles a specific capability on or off.
 */
export const toggleCapability = createAsyncThunk<
  Capabilities,
  keyof Pick<Capabilities, 'streaks_enabled' | 'friends_enabled' | 'notes_enabled'>,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  'capabilities/toggle',
  async (capability, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState();
      const current = state.capabilities.capabilities;
      const userId = state.auth.user?.id;

      if (!current) throw new Error('Capabilities not loaded');
      if (!userId) throw new Error('Not authenticated');

      const newValue = !current[capability];
      const updateData: Database['public']['Tables']['capabilities']['Update'] = {
        [capability]: newValue,
      };

      const { data, error } = await (supabase.from('capabilities') as any)
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as Capabilities;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Pins or unpins a tab from the main navigation.
 */
export const togglePinnedTab = createAsyncThunk<
  Capabilities,
  TabId,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  'capabilities/togglePin',
  async (tabId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const current = state.capabilities.capabilities;
      const userId = state.auth.user?.id;

      if (!current) throw new Error('Capabilities not loaded');
      if (!userId) throw new Error('Not authenticated');

      const pinnedTabs = [...current.pinned_tabs];
      const index = pinnedTabs.indexOf(tabId);

      if (index >= 0) {
        pinnedTabs.splice(index, 1);
      } else {
        // Limit to 2 pinned tabs
        if (pinnedTabs.length >= 2) {
          pinnedTabs.shift(); // Remove oldest
        }
        pinnedTabs.push(tabId);
      }

      const updateData: Database['public']['Tables']['capabilities']['Update'] = {
        pinned_tabs: pinnedTabs,
      };

      const { data, error } = await (supabase.from('capabilities') as any)
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as Capabilities;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Capabilities slice
 * Manages feature flags and navigation preferences.
 */
const capabilitiesSlice = createSlice({
  name: 'capabilities',
  initialState,
  reducers: {
    clearCapabilitiesError(state) {
      state.error = null;
    },
    // Reset to defaults
    resetCapabilities(state) {
      state.capabilities = null;
      state.visibleTabs = ['home', 'focus', 'journal', 'profile'];
      state.pinnedTabs = [];
    },
    // Local update for optimistic UI
    setCapabilitiesLocal(state, action: PayloadAction<Partial<Capabilities>>) {
      if (state.capabilities) {
        state.capabilities = { ...state.capabilities, ...action.payload };
        state.visibleTabs = computeVisibleTabs(state.capabilities);
        state.pinnedTabs = state.capabilities.pinned_tabs as TabId[];
      }
    },
    // Set capabilities from onboarding (for local-first use before sync)
    setCapabilities(state, action: PayloadAction<Record<string, boolean>>) {
      const mapping = action.payload;
      // Create a partial capabilities object from the mapping
      const partial: Partial<Omit<Capabilities, 'id' | 'user_id' | 'created_at' | 'updated_at'>> = {
        streaks_enabled: mapping.streaks ?? true,
        friends_enabled: mapping.friends ?? false,
        notes_enabled: mapping.notes ?? false,
      };

      if (state.capabilities) {
        state.capabilities = { ...state.capabilities, ...partial };
      }

      // Compute visible tabs based on new capabilities
      state.visibleTabs = computeVisibleTabs(state.capabilities);
    },
  },
  extraReducers: (builder) => {
    // Fetch capabilities
    builder
      .addCase(fetchCapabilities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCapabilities.fulfilled, (state, action) => {
        state.loading = false;
        state.capabilities = action.payload;
        state.visibleTabs = computeVisibleTabs(action.payload);
        state.pinnedTabs = action.payload.pinned_tabs as TabId[];
      })
      .addCase(fetchCapabilities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update capabilities
    builder
      .addCase(updateCapabilities.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCapabilities.fulfilled, (state, action) => {
        state.loading = false;
        state.capabilities = action.payload;
        state.visibleTabs = computeVisibleTabs(action.payload);
        state.pinnedTabs = action.payload.pinned_tabs as TabId[];
      })
      .addCase(updateCapabilities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Toggle capability - no optimistic update to prevent double-toggle
    builder
      .addCase(toggleCapability.pending, (state) => {
        // Don't toggle here - wait for server response
        state.loading = true;
      })
      .addCase(toggleCapability.fulfilled, (state, action) => {
        state.loading = false;
        state.capabilities = action.payload;
        state.visibleTabs = computeVisibleTabs(action.payload);
        state.pinnedTabs = action.payload.pinned_tabs as TabId[];
      })
      .addCase(toggleCapability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Toggle pinned tab
    builder
      .addCase(togglePinnedTab.pending, (state) => {
        state.loading = true;
      })
      .addCase(togglePinnedTab.fulfilled, (state, action) => {
        state.loading = false;
        state.capabilities = action.payload;
        state.visibleTabs = computeVisibleTabs(action.payload);
        state.pinnedTabs = action.payload.pinned_tabs as TabId[];
      })
      .addCase(togglePinnedTab.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCapabilitiesError,
  resetCapabilities,
  setCapabilitiesLocal,
  setCapabilities,
} = capabilitiesSlice.actions;

export default capabilitiesSlice.reducer;

// --- Selectors ---

const selectCapabilitiesState = (state: RootState) => state.capabilities;

export const selectCapabilities = createSelector(
  [selectCapabilitiesState],
  (state) => state.capabilities
);

export const selectVisibleTabs = createSelector(
  [selectCapabilitiesState],
  (state) => state.visibleTabs
);

export const selectPinnedTabs = createSelector(
  [selectCapabilitiesState],
  (state) => state.pinnedTabs
);

export const selectCapabilitiesLoading = createSelector(
  [selectCapabilitiesState],
  (state) => state.loading
);

// Individual capability selectors
export const selectStreaksEnabled = createSelector(
  [selectCapabilities],
  (capabilities) => capabilities?.streaks_enabled ?? true
);

export const selectFriendsEnabled = createSelector(
  [selectCapabilities],
  (capabilities) => capabilities?.friends_enabled ?? false
);

export const selectNotesEnabled = createSelector(
  [selectCapabilities],
  (capabilities) => capabilities?.notes_enabled ?? false
);
