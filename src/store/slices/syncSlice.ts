import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { SyncQueueItem, SyncQueueInsert, Json } from '@/types/database';
import { RootState } from '../index';

/**
 * Type of operation being synced.
 */
export type SyncOperation = 'insert' | 'update' | 'delete';

/**
 * Tables that support offline sync.
 */
export type SyncTable = 'todos' | 'pomodoro_sessions' | 'journals' | 'streaks' | 'timeblocks' | 'habits' | 'habit_completions';

/**
 * Strategy to resolve data conflicts.
 * - 'last-write-wins': Most recent timestamp wins.
 * - 'server-wins': Server data is authoritative.
 * - 'client-wins': Local data overwrites server.
 * - 'merge': Smart merge depending on data type.
 */
export type ConflictStrategy = 'last-write-wins' | 'server-wins' | 'client-wins' | 'merge';

/**
 * Item in the local sync queue.
 */
interface LocalSyncItem {
  id: string;
  operation: SyncOperation;
  table: SyncTable;
  recordId: string;
  payload: Json;
  createdAt: string;
  retryCount: number;
  lastError?: string;
  conflictStrategy: ConflictStrategy;
  version?: number; // For optimistic locking
}

/**
 * State definition for the Sync module.
 */
interface SyncState {
  // Connection status
  isOnline: boolean;
  lastOnlineAt: string | null;

  // Sync queue
  queue: LocalSyncItem[];
  isSyncing: boolean;
  lastSyncedAt: string | null;

  // Sync status per table
  tableStatus: Record<SyncTable, {
    lastSynced: string | null;
    pendingCount: number;
    lastError?: string;
  }>;

  // Errors
  syncErrors: Array<{
    id: string;
    error: string;
    timestamp: string;
    table: SyncTable;
    operation: SyncOperation;
  }>;

  // Conflict tracking
  conflicts: Array<{
    id: string;
    table: SyncTable;
    localData: Json;
    serverData: Json;
    resolvedAt?: string;
    resolution?: 'local' | 'server' | 'merged';
  }>;
}

const initialTableStatus: Record<SyncTable, { lastSynced: string | null; pendingCount: number }> = {
  todos: { lastSynced: null, pendingCount: 0 },
  pomodoro_sessions: { lastSynced: null, pendingCount: 0 },
  journals: { lastSynced: null, pendingCount: 0 },
  streaks: { lastSynced: null, pendingCount: 0 },
  timeblocks: { lastSynced: null, pendingCount: 0 },
  habits: { lastSynced: null, pendingCount: 0 },
  habit_completions: { lastSynced: null, pendingCount: 0 },
};

const initialState: SyncState = {
  isOnline: true,
  lastOnlineAt: null,
  queue: [],
  isSyncing: false,
  lastSyncedAt: null,
  tableStatus: initialTableStatus,
  syncErrors: [],
  conflicts: [],
};

// Generate unique ID for queue items
const generateQueueId = () => `sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// Get conflict strategy for a table
const getConflictStrategy = (table: SyncTable): ConflictStrategy => {
  // Immutable logs should use server-wins to prevent duplicate entries
  const immutableTables: SyncTable[] = ['pomodoro_sessions', 'habit_completions'];
  if (immutableTables.includes(table)) {
    return 'server-wins';
  }

  // User content uses last-write-wins
  const userContentTables: SyncTable[] = ['journals', 'todos', 'habits', 'timeblocks'];
  if (userContentTables.includes(table)) {
    return 'last-write-wins';
  }

  // Streaks need merge strategy to handle concurrent updates
  return 'merge';
};

// Merge two objects for conflict resolution
const mergePayloads = (local: Json, server: Json, table: SyncTable): Json => {
  if (!local || !server) return local || server;

  const localObj = local as Record<string, unknown>;
  const serverObj = server as Record<string, unknown>;

  // For streaks, take the higher count values
  if (table === 'streaks') {
    return {
      ...serverObj,
      ...localObj,
      current_count: Math.max(
        Number(localObj.current_count) || 0,
        Number(serverObj.current_count) || 0
      ),
      best_count: Math.max(
        Number(localObj.best_count) || 0,
        Number(serverObj.best_count) || 0
      ),
      updated_at: new Date().toISOString(),
    };
  }

  // Default: prefer local changes but keep server timestamps
  return {
    ...serverObj,
    ...localObj,
    updated_at: new Date().toISOString(),
  };
};

// --- Async Thunks ---

/**
 * Processes the sync queue.
 * Handles insert/update/delete operations and conflict resolution.
 */
export const processSyncQueue = createAsyncThunk(
  'sync/processQueue',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState() as RootState;

    if (!state.sync.isOnline) {
      return rejectWithValue('Offline - cannot sync');
    }

    if (state.sync.queue.length === 0) {
      return { processed: 0, conflicts: 0 };
    }

    const results: { success: string[]; failed: string[]; conflicts: string[] } = {
      success: [],
      failed: [],
      conflicts: [],
    };

    // Process items in chronological order
    const sortedQueue = [...state.sync.queue].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (const item of sortedQueue) {
      try {
        const result = await processSyncItem(item);
        results.success.push(item.id);

        if (result.conflict) {
          results.conflicts.push(item.id);
        }

        dispatch(removeSyncItem(item.id));
      } catch (error) {
        results.failed.push(item.id);
        dispatch(incrementRetryCount({
          id: item.id,
          error: (error as Error).message,
          table: item.table,
          operation: item.operation,
        }));
      }
    }

    return {
      processed: results.success.length,
      failed: results.failed.length,
      conflicts: results.conflicts.length,
    };
  }
);

// Process a single sync item with conflict resolution
async function processSyncItem(item: LocalSyncItem): Promise<{ success: boolean; conflict?: boolean }> {
  const { operation, table, recordId, payload, conflictStrategy } = item;

  switch (operation) {
    case 'insert': {
      // Check if record already exists (might have been synced from another device)
      const { data: existing } = await (supabase
        .from(table) as any)
        .select('id, updated_at')
        .eq('id', recordId)
        .single();

      if (existing) {
        // Record already exists - skip insert
        console.log(`[Sync] Record ${recordId} already exists in ${table}, skipping insert`);
        return { success: true, conflict: true };
      }

      const { error } = await (supabase
        .from(table) as any)
        .insert(payload);
      if (error) throw error;
      return { success: true };
    }

    case 'update': {
      // Get server version for conflict detection
      const { data: serverRecord } = await (supabase
        .from(table) as any)
        .select('*')
        .eq('id', recordId)
        .single();

      if (!serverRecord) {
        // Record doesn't exist on server - convert to insert
        const { error } = await (supabase
          .from(table) as any)
          .insert({ ...(payload as object), id: recordId });
        if (error) throw error;
        return { success: true };
      }

      // Check for conflict (server was modified after our local change)
      const localUpdatedAt = (payload as Record<string, unknown>).updated_at as string;
      const serverUpdatedAt = serverRecord.updated_at;

      let finalPayload = payload;

      if (serverUpdatedAt && localUpdatedAt && new Date(serverUpdatedAt) > new Date(localUpdatedAt)) {
        // Conflict detected - apply resolution strategy
        switch (conflictStrategy) {
          case 'server-wins':
            // Don't update - server version is kept
            console.log(`[Sync] Conflict in ${table}/${recordId}: server-wins`);
            return { success: true, conflict: true };

          case 'client-wins':
            // Overwrite server with local
            break;

          case 'merge':
            // Merge the payloads
            finalPayload = mergePayloads(payload, serverRecord, table);
            console.log(`[Sync] Conflict in ${table}/${recordId}: merged`);
            break;

          case 'last-write-wins':
          default:
            // Use timestamps to determine winner
            if (new Date(serverUpdatedAt) > new Date(localUpdatedAt)) {
              console.log(`[Sync] Conflict in ${table}/${recordId}: server was newer, skipping`);
              return { success: true, conflict: true };
            }
            break;
        }
      }

      const { error } = await (supabase
        .from(table) as any)
        .update(finalPayload)
        .eq('id', recordId);
      if (error) throw error;
      return { success: true };
    }

    case 'delete': {
      const { error } = await (supabase
        .from(table) as any)
        .delete()
        .eq('id', recordId);
      // Ignore "not found" errors for deletes - already deleted
      if (error && !error.message.includes('not found')) throw error;
      return { success: true };
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

/**
 * Downloads all data for supported tables from the server.
 */
export const syncFromServer = createAsyncThunk(
  'sync/syncFromServer',
  async (tables: SyncTable[], { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const results: Partial<Record<SyncTable, unknown[]>> = {};

      for (const table of tables) {
        const { data, error } = await (supabase
          .from(table) as any)
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        results[table] = data;
      }

      return results;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Sync Slice
 * Manages offline synchronization queue and status.
 */
const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    // Connection status
    setOnline(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
      if (action.payload) {
        state.lastOnlineAt = new Date().toISOString();
      }
    },

    // Add item to sync queue
    addToSyncQueue(state, action: PayloadAction<{
      operation: SyncOperation;
      table: SyncTable;
      recordId: string;
      payload: Json;
    }>) {
      const { operation, table, recordId, payload } = action.payload;
      const conflictStrategy = getConflictStrategy(table);

      // Check for existing item with same record
      const existingIndex = state.queue.findIndex(
        item => item.table === table && item.recordId === recordId
      );

      if (existingIndex >= 0) {
        // Merge operations (last write wins for updates)
        const existing = state.queue[existingIndex];

        if (operation === 'delete') {
          // If inserting then deleting, remove from queue entirely
          if (existing.operation === 'insert') {
            state.queue.splice(existingIndex, 1);
            return;
          }
          // Otherwise, just update to delete
          const updateItem = state.queue[existingIndex];
          updateItem.operation = 'delete';
          (updateItem as any).payload = {};
          updateItem.createdAt = new Date().toISOString();
        } else if (operation === 'update') {
          // Merge update payloads
          const updateItem = state.queue[existingIndex] as any;
          updateItem.payload = { ...updateItem.payload, ...(payload as object) };
          updateItem.createdAt = new Date().toISOString();
        }
      } else {
        // Add new item
        (state.queue as any[]).push({
          id: generateQueueId(),
          operation,
          table,
          recordId,
          payload,
          createdAt: new Date().toISOString(),
          retryCount: 0,
          conflictStrategy,
        });
      }

      // Update pending count
      state.tableStatus[table].pendingCount = state.queue.filter(
        item => item.table === table
      ).length;
    },

    // Remove item from queue (after successful sync)
    removeSyncItem(state, action: PayloadAction<string>) {
      const item = state.queue.find(i => i.id === action.payload);
      if (item) {
        state.queue = state.queue.filter(i => i.id !== action.payload);
        state.tableStatus[item.table].pendingCount = state.queue.filter(
          i => i.table === item.table
        ).length;
      }
    },

    // Increment retry count on failure
    incrementRetryCount(state, action: PayloadAction<{
      id: string;
      error: string;
      table?: SyncTable;
      operation?: SyncOperation;
    }>) {
      const item = state.queue.find(i => i.id === action.payload.id);
      if (item) {
        item.retryCount += 1;
        item.lastError = action.payload.error;

        // Update table status with error
        if (item.table && state.tableStatus[item.table]) {
          state.tableStatus[item.table].lastError = action.payload.error;
        }

        // Add to error log with more details
        state.syncErrors.push({
          id: action.payload.id,
          error: action.payload.error,
          timestamp: new Date().toISOString(),
          table: action.payload.table || item.table,
          operation: action.payload.operation || item.operation,
        });

        // Keep only last 100 errors
        if (state.syncErrors.length > 100) {
          state.syncErrors = state.syncErrors.slice(-100);
        }

        // Remove items that have failed too many times (max 5 retries)
        if (item.retryCount >= 5) {
          state.queue = state.queue.filter(i => i.id !== action.payload.id);
          console.warn(`[Sync] Removed item ${action.payload.id} after 5 failed retries`);
        }
      }
    },

    // Update table sync status
    setTableSynced(state, action: PayloadAction<SyncTable>) {
      state.tableStatus[action.payload].lastSynced = new Date().toISOString();
    },

    // Clear sync queue (on logout)
    clearSyncQueue(state) {
      state.queue = [];
      state.syncErrors = [];
      state.conflicts = [];
      state.tableStatus = initialTableStatus;
    },

    // Clear sync errors
    clearSyncErrors(state) {
      state.syncErrors = [];
    },

    // Add a conflict for user resolution
    addConflict(state, action: PayloadAction<{
      table: SyncTable;
      localData: Json;
      serverData: Json;
    }>) {
      state.conflicts.push({
        id: generateQueueId(),
        table: action.payload.table,
        localData: action.payload.localData,
        serverData: action.payload.serverData,
      } as any);
    },

    // Resolve a conflict
    resolveConflict(state, action: PayloadAction<{
      id: string;
      resolution: 'local' | 'server' | 'merged';
    }>) {
      const conflict = state.conflicts.find(c => c.id === action.payload.id);
      if (conflict) {
        conflict.resolvedAt = new Date().toISOString();
        conflict.resolution = action.payload.resolution;
        // Remove resolved conflicts after marking
        state.conflicts = state.conflicts.filter(c => c.id !== action.payload.id);
      }
    },
  },
  extraReducers: (builder) => {
    // Process queue
    builder
      .addCase(processSyncQueue.pending, (state) => {
        state.isSyncing = true;
      })
      .addCase(processSyncQueue.fulfilled, (state) => {
        state.isSyncing = false;
        state.lastSyncedAt = new Date().toISOString();
      })
      .addCase(processSyncQueue.rejected, (state) => {
        state.isSyncing = false;
      });

    // Sync from server
    builder
      .addCase(syncFromServer.pending, (state) => {
        state.isSyncing = true;
      })
      .addCase(syncFromServer.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.lastSyncedAt = new Date().toISOString();

        // Update table status
        const tables = Object.keys(action.payload) as SyncTable[];
        tables.forEach(table => {
          state.tableStatus[table].lastSynced = new Date().toISOString();
        });
      })
      .addCase(syncFromServer.rejected, (state) => {
        state.isSyncing = false;
      });
  },
});

export const {
  setOnline,
  addToSyncQueue,
  removeSyncItem,
  incrementRetryCount,
  setTableSynced,
  clearSyncQueue,
  clearSyncErrors,
  addConflict,
  resolveConflict,
} = syncSlice.actions;

export default syncSlice.reducer;

// --- Selectors ---

const selectSyncState = (state: RootState) => state.sync;

export const selectIsOnline = createSelector(
  [selectSyncState],
  (sync) => sync.isOnline
);
export const selectIsSyncing = createSelector(
  [selectSyncState],
  (sync) => sync.isSyncing
);
export const selectSyncQueue = createSelector(
  [selectSyncState],
  (sync) => sync.queue
);
export const selectPendingCount = createSelector(
  [selectSyncState],
  (sync) => sync.queue.length
);
export const selectLastSyncedAt = createSelector(
  [selectSyncState],
  (sync) => sync.lastSyncedAt
);
export const selectSyncErrors = createSelector(
  [selectSyncState],
  (sync) => sync.syncErrors
);

// Table-specific pending counts
export const selectTablePendingCount = (table: SyncTable) =>
  createSelector(
    [selectSyncState],
    (sync) => sync.tableStatus[table]?.pendingCount || 0
  );
