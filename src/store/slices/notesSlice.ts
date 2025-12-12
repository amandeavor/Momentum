import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { Note, NoteInsert, NoteUpdate, Database } from '@/types/database';
import { RootState } from '../index';

interface NotesState {
    notes: Note[];
    loading: boolean;
    syncing: boolean;
    error: string | null;
    lastSynced: string | null;
}

const initialState: NotesState = {
    notes: [],
    loading: false,
    syncing: false,
    error: null,
    lastSynced: null,
};

// Async thunks

// Fetch notes
export const fetchNotes = createAsyncThunk<
    Note[],
    void,
    { state: RootState; rejectValue: string }
>(
    'notes/fetchNotes',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const userId = state.auth.user?.id;

            if (!userId) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', userId)
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data as Note[];
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

// Create note
export const createNote = createAsyncThunk<
    Note,
    Omit<NoteInsert, 'user_id'>,
    { state: RootState; rejectValue: string }
>(
    'notes/createNote',
    async (note, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const userId = state.auth.user?.id;

            if (!userId) throw new Error('Not authenticated');

            const insertData: Database['public']['Tables']['notes']['Insert'] = {
                ...note,
                user_id: userId,
            };

            const { data, error } = await (supabase.from('notes') as any)
                .insert(insertData)
                .select()
                .single();

            if (error) throw error;
            return data as Note;
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

// Update note
export const updateNote = createAsyncThunk<
    Note,
    { id: string; updates: NoteUpdate },
    { rejectValue: string }
>(
    'notes/updateNote',
    async ({ id, updates }, { rejectWithValue }) => {
        try {
            const { data, error } = await (supabase.from('notes') as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Note;
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

// Delete note
export const deleteNote = createAsyncThunk(
    'notes/deleteNote',
    async (id: string, { rejectWithValue }) => {
        try {
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return id;
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

const notesSlice = createSlice({
    name: 'notes',
    initialState,
    reducers: {
        clearNotesError(state) {
            state.error = null;
        },
        clearNotes(state) {
            state.notes = [];
            state.lastSynced = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch
        builder
            .addCase(fetchNotes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotes.fulfilled, (state, action) => {
                state.loading = false;
                state.notes = action.payload;
                state.lastSynced = new Date().toISOString();
            })
            .addCase(fetchNotes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Create
        builder
            .addCase(createNote.pending, (state) => {
                state.syncing = true;
            })
            .addCase(createNote.fulfilled, (state, action) => {
                state.syncing = false;
                state.notes.unshift(action.payload);
                state.notes.sort((a, b) => {
                    if (a.is_pinned === b.is_pinned) {
                        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                    }
                    return a.is_pinned ? -1 : 1;
                });
            })
            .addCase(createNote.rejected, (state, action) => {
                state.syncing = false;
                state.error = action.payload as string;
            });

        // Update
        builder
            .addCase(updateNote.pending, (state) => {
                state.syncing = true;
            })
            .addCase(updateNote.fulfilled, (state, action) => {
                state.syncing = false;
                const index = state.notes.findIndex(n => n.id === action.payload.id);
                if (index !== -1) {
                    state.notes[index] = action.payload;
                    state.notes.sort((a, b) => {
                        if (a.is_pinned === b.is_pinned) {
                            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                        }
                        return a.is_pinned ? -1 : 1;
                    });
                }
            })
            .addCase(updateNote.rejected, (state, action) => {
                state.syncing = false;
                state.error = action.payload as string;
            });

        // Delete
        builder
            .addCase(deleteNote.pending, (state) => {
                state.syncing = true;
            })
            .addCase(deleteNote.fulfilled, (state, action) => {
                state.syncing = false;
                state.notes = state.notes.filter(n => n.id !== action.payload);
            })
            .addCase(deleteNote.rejected, (state, action) => {
                state.syncing = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearNotesError, clearNotes } = notesSlice.actions;
export default notesSlice.reducer;

// Selectors
export const selectAllNotes = (state: RootState) => state.notes.notes;
export const selectNotesLoading = (state: RootState) => state.notes.loading;
