import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
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

// Auth state interface
interface AuthState {
  isAuthenticated: boolean;
  isAnonymous: boolean;
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  initializing: boolean;
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

// Async thunks

// Initialize auth - check for existing session
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
        
        // If profile doesn't exist (for older anonymous users), create it
        if (profileError || !profile) {
          const { data: newProfile } = await (supabase
            .from('profiles') as any)
            .insert({ id: userId })
            .select()
            .single();
          
          profile = newProfile;
          
          // Also create capabilities
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

// Sign in with email and password
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

// Sign in with OAuth provider (currently Google only)
export const signInWithProvider = createAsyncThunk(
  'auth/signInWithProvider',
  async (
    { provider, intent }: { provider: 'google'; intent?: 'login' | 'register' },
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await signInWithOAuth(provider, intent);
      if (error) throw error;
      // On native, we often need to manually open the returned URL.
      return data?.url ?? null;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Sign up with email and password
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

// Sign in anonymously
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
        
        // If profile doesn't exist, create it
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

// Convert anonymous account to permanent
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

// Sign out
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

// Update profile
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

// Request password reset
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

// Auth slice
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
        // Session is handled by onAuthStateChange / callback screen
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