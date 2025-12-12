import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { Todo, TodoInsert, TodoUpdate } from '@/types/database';
import { RootState } from '../index';

/**
 * State definition for the Tasks module.
 */
interface TasksState {
  /** List of all todos for the current user */
  todos: Todo[];
  /** Loading state for initial fetch */
  loading: boolean;
  /** Syncing state for mutations (create/update/delete) */
  syncing: boolean;
  /** Error message if any operation fails */
  error: string | null;
  /** Timestamp of last successful sync */
  lastSynced: string | null;
}

const initialState: TasksState = {
  todos: [],
  loading: false,
  syncing: false,
  error: null,
  lastSynced: null,
};

// --- Async Thunks ---

/**
 * Fetches all todos for the authenticated user.
 * Orders by custom order index (asc) and then creation time (desc).
 */
export const fetchTodos = createAsyncThunk(
  'tasks/fetchTodos',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Creates a new todo item in Supabase.
 */
export const createTodo = createAsyncThunk<Todo, Omit<TodoInsert, 'user_id'>>(
  'tasks/createTodo',
  async (todo, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const insertData: TodoInsert = { ...todo, user_id: userId };
      const { data, error } = await (supabase
        .from('todos') as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Updates an existing todo item.
 */
export const updateTodo = createAsyncThunk<Todo, { id: string; updates: TodoUpdate }>(
  'tasks/updateTodo',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data, error } = await (supabase
        .from('todos') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Toggles the 'completed' status of a todo.
 */
export const toggleTodoComplete = createAsyncThunk<Todo, string>(
  'tasks/toggleTodoComplete',
  async (id, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const todo = state.tasks.todos.find(t => t.id === id);

      if (!todo) throw new Error('Todo not found');

      const { data, error } = await (supabase
        .from('todos') as any)
        .update({ completed: !todo.completed })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Deletes a todo item permanently.
 */
export const deleteTodo = createAsyncThunk(
  'tasks/deleteTodo',
  async (id: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('todos')
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
 * Links or unlinks a task to a specific timeblock in the schedule.
 */
export const linkTaskToTimeblock = createAsyncThunk<Todo, { taskId: string; timeblockId: string | null }>(
  'tasks/linkTaskToTimeblock',
  async ({ taskId, timeblockId }, { rejectWithValue }) => {
    try {
      const { data, error } = await (supabase
        .from('todos') as any)
        .update({ timeblock_id: timeblockId })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Batched update to reorder multiple todos.
 * Updates the 'order_index' field.
 */
export const reorderTodos = createAsyncThunk<string[], string[]>(
  'tasks/reorderTodos',
  async (orderedIds, { rejectWithValue }) => {
    try {
      // Update order_index for each todo
      const updates = orderedIds.map((id, index) =>
        (supabase.from('todos') as any)
          .update({ order_index: index })
          .eq('id', id)
      );

      await Promise.all(updates);
      return orderedIds;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Tasks Slice
 * Handles all logic for Todo management including optimistic updates and syncing.
 */
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasksError(state) {
      state.error = null;
    },
    // Optimistic update for toggle
    optimisticToggle(state, action: PayloadAction<string>) {
      const todo = state.todos.find(t => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    // Revert optimistic update
    revertToggle(state, action: PayloadAction<string>) {
      const todo = state.todos.find(t => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    // Local-only add (for offline support)
    addTodoLocal(state, action: PayloadAction<Todo>) {
      state.todos.unshift(action.payload);
    },
    // Local-only update (for offline support)
    updateTodoLocal(state, action: PayloadAction<Todo>) {
      const index = state.todos.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.todos[index] = action.payload;
      }
    },
    // Local-only delete (for offline support)
    deleteTodoLocal(state, action: PayloadAction<string>) {
      state.todos = state.todos.filter(t => t.id !== action.payload);
    },
    // Clear all todos (on logout)
    clearTodos(state) {
      state.todos = [];
      state.lastSynced = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch todos
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = action.payload;
        state.lastSynced = new Date().toISOString();
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create todo
    builder
      .addCase(createTodo.pending, (state) => {
        state.syncing = true;
      })
      .addCase(createTodo.fulfilled, (state, action) => {
        state.syncing = false;
        state.todos.unshift(action.payload);
      })
      .addCase(createTodo.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Update todo
    builder
      .addCase(updateTodo.pending, (state) => {
        state.syncing = true;
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        state.syncing = false;
        const index = state.todos.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.todos[index] = action.payload;
        }
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Toggle todo
    builder
      .addCase(toggleTodoComplete.fulfilled, (state, action) => {
        const index = state.todos.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.todos[index] = action.payload;
        }
      });

    // Delete todo
    builder
      .addCase(deleteTodo.pending, (state) => {
        state.syncing = true;
      })
      .addCase(deleteTodo.fulfilled, (state, action) => {
        state.syncing = false;
        state.todos = state.todos.filter(t => t.id !== action.payload);
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });

    // Reorder todos
    builder
      .addCase(reorderTodos.fulfilled, (state, action) => {
        const orderedIds = action.payload;
        state.todos.sort((a, b) => {
          return orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id);
        });
      });

    // Link task to timeblock
    builder
      .addCase(linkTaskToTimeblock.fulfilled, (state, action) => {
        const index = state.todos.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.todos[index] = action.payload;
        }
      });
  },
});

export const {
  clearTasksError,
  optimisticToggle,
  revertToggle,
  addTodoLocal,
  updateTodoLocal,
  deleteTodoLocal,
  clearTodos,
} = tasksSlice.actions;

export default tasksSlice.reducer;

// --- Selectors ---

export const selectAllTodos = (state: RootState) => state.tasks.todos;
export const selectIncompleteTodos = (state: RootState) =>
  state.tasks.todos.filter(t => !t.completed);
export const selectCompletedTodos = (state: RootState) =>
  state.tasks.todos.filter(t => t.completed);
export const selectTodoById = (id: string) => (state: RootState) =>
  state.tasks.todos.find(t => t.id === id);
export const selectTodosByTimeblock = (timeblockId: string) => (state: RootState) =>
  state.tasks.todos.filter(t => t.timeblock_id === timeblockId);
export const selectTodosLoading = (state: RootState) => state.tasks.loading;
export const selectTodosSyncing = (state: RootState) => state.tasks.syncing;