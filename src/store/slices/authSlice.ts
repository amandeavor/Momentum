import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import {
  supabase,
  signInWithEmail,
  signUpWithEmail,
  signInAnonymously,
  signInWithOAuth,
  signOut as supabaseSignOut,
  getCurrentSession,
  linkEmailToAnonymousUser,
  resetPassword,
} from '@/services/supabase';
import { Profile, ProfileUpdate, Database } from '@/types/database';
import { Session, User } from '@supabase/supabase-js';
import { RootState } from '../index';

/**
 * State definition for the Authentication module.
 */
interface AuthState {
  /** Whether the user is currently authenticated (logged in). */
  isAuthenticated: boolean;
  /** Whether the current user is an anonymous (guest) user. */
  isAnonymous: boolean;
  /** The Supabase user object. */
  user: User | null;
  /** The user's profile data from the `profiles` table. */
  profile: Profile | null;
  /** The current active session. */
  session: Session | null;
  /** Loading state for auth operations (login, signup, etc). */
  loading: boolean;
  /** Internal initialization state (checking for session on app start). */
  initializing: boolean;
  /** Error message from last failed operation. */
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isAnonymous: false,
  user: null,
  profile: null,
  session: null,
  loading: false,
  initializing: true,
  error: null,
};

// --- Async Thunks ---

/**
 * Initializes authentication by checking for an existing Supabase session.
 * If a session exists, it also fetches the user's profile.
 */
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const { session, error } = await getCurrentSession();
      if (error) throw error;

      if (session?.user) {
        const userId = session.user.id;

        // Try to fetch existing profile
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        // If profile doesn't exist (e.g. legacy anon users), create it
        if (profileError || !profile) {
          const { data: newProfile } = await (supabase
            .from('profiles') as any)
            .insert({ id: userId })
            .select()
            .single();

          profile = newProfile;

          // Also create default capabilities
          await (supabase.from('capabilities') as any)
            .insert({ user_id: userId })
            .select()
            .single();
        }

        return {
          session,
          user: session.user,
          profile,
          isAnonymous: session.user.is_anonymous ?? false,
        };
      }

      return { session: null, user: null, profile: null, isAnonymous: false };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Signs in a user with email and password.
 */
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await signInWithEmail(email, password);
      if (error) throw error;

      if (data.session?.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        return {
          session: data.session,
          user: data.session.user,
          profile
        };
      }

      throw new Error('No session returned');
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Signs in with an OAuth provider (e.g., Google).
 * Note: On mobile, this often involves a redirect flow.
 */
export const signInWithProvider = createAsyncThunk(
  'auth/signInWithProvider',
  async (
    { provider, intent }: { provider: 'google'; intent?: 'login' | 'register' },
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await signInWithOAuth(provider, intent);
      if (error) throw error;
      // Return the URL for manual handling if needed
      return data?.url ?? null;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Signs up a new user with email and password.
 * Can optionally set an initial display name.
 */
export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({
    email,
    password,
    displayName
  }: {
    email: string;
    password: string;
    displayName?: string;
  }, { rejectWithValue }) => {
    try {
      const { data, error } = await signUpWithEmail(email, password);
      if (error) throw error;

      if (data.session?.user) {
        // Update profile with display name if provided
        if (displayName) {
          const profileUpdate: Database['public']['Tables']['profiles']['Update'] = {
            display_name: displayName,
          };
          await (supabase.from('profiles') as any)
            .update(profileUpdate)
            .eq('id', data.session.user.id);
        }

        // Fetch updated profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        return {
          session: data.session,
          user: data.session.user,
          profile
        };
      }

      throw new Error('No session returned');
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Signs in anonymously (Guest access).
 */
export const signInAnonymous = createAsyncThunk(
  'auth/signInAnonymous',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await signInAnonymously();
      if (error) throw error;

      if (data.session?.user) {
        const userId = data.session.user.id;

        // Try to fetch existing profile
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        // Create profile if missing
        if (profileError || !profile) {
          const { data: newProfile, error: insertError } = await (supabase
            .from('profiles') as any)
            .insert({ id: userId })
            .select()
            .single();

          if (insertError) {
            console.warn('Failed to create profile:', insertError);
          } else {
            profile = newProfile;
          }

          // Also create capabilities
          await (supabase.from('capabilities') as any)
            .insert({ user_id: userId })
            .select()
            .single();
        }

        return {
          session: data.session,
          user: data.session.user,
          profile,
          isAnonymous: true,
        };
      }

      throw new Error('No session returned');
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Links an email/password credential to an existing anonymous account.
 */
export const linkAccount = createAsyncThunk(
  'auth/linkAccount',
  async ({
    email,
    password
  }: {
    email: string;
    password: string;
  }, { rejectWithValue }) => {
    try {
      const { data, error } = await linkEmailToAnonymousUser(email, password);
      if (error) throw error;

      return { user: data.user, isAnonymous: false };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Signs out the current user.
 */
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabaseSignOut();
      if (error) throw error;
      return null;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Updates the user's profile information.
 */
export const updateProfile = createAsyncThunk<
  Profile,
  ProfileUpdate,
  { state: { auth: AuthState }; rejectValue: string }
>(
  'auth/updateProfile',
  async (updates, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const updateData: Database['public']['Tables']['profiles']['Update'] = updates;

      const { data, error } = await (supabase.from('profiles') as any)
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Requests a password reset email.
 */
export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email: string, { rejectWithValue }) => {
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      return true;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Auth Slice
 * Manages authentication state, user sessions, and profile data.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setSession(state, action: PayloadAction<Session | null>) {
      if (action.payload) {
        state.session = action.payload;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isAnonymous = action.payload.user.is_anonymous ?? false;
      } else {
        state.session = null;
        state.user = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.isAnonymous = false;
      }
    },
    setProfile(state, action: PayloadAction<Profile | null>) {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.initializing = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.initializing = false;
        state.session = action.payload.session;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAuthenticated = !!action.payload.session;
        state.isAnonymous = action.payload.isAnonymous;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.initializing = false;
        state.error = action.payload as string;
      });

    // Sign in
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload.session;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAuthenticated = true;
        state.isAnonymous = false;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Sign up
    builder
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload.session;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAuthenticated = true;
        state.isAnonymous = false;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Anonymous sign in
    builder
      .addCase(signInAnonymous.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInAnonymous.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload.session;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAuthenticated = true;
        state.isAnonymous = true;
      })
      .addCase(signInAnonymous.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // OAuth sign in
    builder
      .addCase(signInWithProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInWithProvider.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(signInWithProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Link account
    builder
      .addCase(linkAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(linkAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAnonymous = false;
      })
      .addCase(linkAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Sign out
    builder
      .addCase(signOut.pending, (state) => {
        state.loading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.loading = false;
        state.session = null;
        state.user = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.isAnonymous = false;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Password reset
    builder
      .addCase(requestPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSession, setProfile } = authSlice.actions;
export default authSlice.reducer;

// --- Selectors ---

const selectAuthState = (state: RootState) => state.auth;

export const selectUser = createSelector(
  [selectAuthState],
  (auth) => auth.user
);

export const selectProfile = createSelector(
  [selectAuthState],
  (auth) => auth.profile
);

export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth) => auth.isAuthenticated
);

export const selectIsAnonymous = createSelector(
  [selectAuthState],
  (auth) => auth.isAnonymous
);

export const selectAuthLoading = createSelector(
  [selectAuthState],
  (auth) => auth.loading
);

export const selectAuthInitializing = createSelector(
  [selectAuthState],
  (auth) => auth.initializing
);

export const selectAuthError = createSelector(
  [selectAuthState],
  (auth) => auth.error
);