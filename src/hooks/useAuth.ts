import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { useAppDispatch, useAppSelector, RootState } from '@/store';
import {
  initializeAuth,
  signIn,
  signUp,
  signInAnonymous,
  signInWithProvider,
  signOut,
  linkAccount,
  updateProfile,
  requestPasswordReset,
  setSession,
  clearError,
} from '@/store/slices/authSlice';
import * as Linking from 'expo-linking';
import { fetchCapabilities } from '@/store/slices/capabilitiesSlice';
import { fetchTodos, clearTodos } from '@/store/slices/tasksSlice';
import { fetchJournals, clearJournals } from '@/store/slices/journalSlice';
import { fetchTodaySessions, clearSessions } from '@/store/slices/pomodoroSlice';
import { clearSyncQueue } from '@/store/slices/syncSlice';
import { Profile } from '@/types/database';

// Auth context interface
interface AuthContextType {
  // State
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isLoading: boolean;
  loading: boolean;           // Alias for isLoading
  isInitializing: boolean;
  user: RootState['auth']['user'];
  profile: Profile | null;
  session: RootState['auth']['session'];
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: 'google', intent?: 'login' | 'register') => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;  // Alias for register
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;  // Alias for logout
  convertAccount: (email: string, password: string) => Promise<void>;
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearAuthError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  
  // Select auth state from Redux
  const auth = useAppSelector(state => state.auth);
  const {
    isAuthenticated,
    isAnonymous,
    user,
    profile,
    session,
    loading: isLoading,
    initializing: isInitializing,
    error,
  } = auth;

  // Initialize auth on mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Update session in Redux
        dispatch(setSession(session));

        // Handle specific events
        if (event === 'SIGNED_IN' && session) {
          // Fetch user data after sign in
          dispatch(fetchCapabilities());
          dispatch(fetchTodos());
          dispatch(fetchJournals({}));
          dispatch(fetchTodaySessions());
        } else if (event === 'SIGNED_OUT') {
          // Clear user data on sign out
          dispatch(clearTodos());
          dispatch(clearJournals());
          dispatch(clearSessions());
          dispatch(clearSyncQueue());
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  // Auth actions
  const login = async (email: string, password: string) => {
    await dispatch(signIn({ email, password })).unwrap();
  };

  const loginWithProvider = async (provider: 'google', intent?: 'login' | 'register') => {
    const url = await dispatch(signInWithProvider({ provider, intent })).unwrap();
    if (url) {
      // Native Google auth flow sometimes needs manual browser open.
      await Linking.openURL(url);
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    await dispatch(signUp({ email, password, displayName })).unwrap();
  };

  const loginAnonymously = async () => {
    await dispatch(signInAnonymous()).unwrap();
  };

  const logout = async () => {
    await dispatch(signOut()).unwrap();
  };

  const convertAccount = async (email: string, password: string) => {
    await dispatch(linkAccount({ email, password })).unwrap();
  };

  const updateUserProfile = async (updates: Partial<Profile>) => {
    await dispatch(updateProfile(updates)).unwrap();
  };

  const resetPassword = async (email: string) => {
    await dispatch(requestPasswordReset(email)).unwrap();
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    isAnonymous,
    isLoading,
    loading: isLoading,          // Alias
    isInitializing,
    user,
    profile,
    session,
    error,
    login,
    loginWithProvider,
    register,
    signUp: register,            // Alias
    loginAnonymously,
    logout,
    signOut: logout,             // Alias
    convertAccount,
    updateUserProfile,
    resetPassword,
    clearAuthError,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks for common auth checks
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

export function useIsAnonymous(): boolean {
  const { isAnonymous } = useAuth();
  return isAnonymous;
}

export function useUser() {
  const { user, profile } = useAuth();
  return { user, profile };
}

export default useAuth;