import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Get the redirect URL for deep linking
const redirectUrl = Linking.createURL('auth/callback');

// Custom storage adapter that uses SecureStore for small items, AsyncStorage for large ones
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Try SecureStore first
      const secureValue = await SecureStore.getItemAsync(key);
      if (secureValue) return secureValue;

      // Fall back to AsyncStorage for large items
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // If value is small enough (< 2048 bytes), use SecureStore
      if (value.length < 2048) {
        await SecureStore.setItemAsync(key, value);
      } else {
        // Use AsyncStorage for large values (like session tokens)
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      // Fall back to AsyncStorage if SecureStore fails
      try {
        await AsyncStorage.setItem(key, value);
      } catch {
        console.warn('Failed to store item:', key);
      }
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore errors when removing
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helper functions
export const signUpWithEmail = async (email: string, password: string) => {
  // Use the deep link URL for email confirmation redirect
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });
  return { data, error };
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signInWithOAuth = async (provider: 'google', intent?: 'login' | 'register') => {
  const redirectUrlWithParams = intent
    ? `${redirectUrl}?intent=${intent}`
    : redirectUrl;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrlWithParams,
    },
  });
  return { data, error };
};

export const signInAnonymously = async () => {
  const { data, error } = await supabase.auth.signInAnonymously();
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

// Convert anonymous user to permanent account
export const linkEmailToAnonymousUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.updateUser({
    email,
    password,
  });
  return { data, error };
};

// Password reset
export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  return { data, error };
};

export type OAuthIntent = 'login' | 'register';

export interface AuthDeepLinkResult {
  didSetSession: boolean;
  type: string | null;
  intent: OAuthIntent | null;
  error: string | null;
}

export const extractAuthParamsFromUrl = (url: string) => {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');

  const params = new URLSearchParams();

  if (hashIndex !== -1) {
    const hashStr = url.substring(hashIndex + 1);
    const hashParams = new URLSearchParams(hashStr);
    hashParams.forEach((value, key) => params.append(key, value));
  }

  if (queryIndex !== -1) {
    const queryStr = url.substring(queryIndex + 1, hashIndex !== -1 ? hashIndex : undefined);
    const queryParams = new URLSearchParams(queryStr);
    queryParams.forEach((value, key) => params.append(key, value));
  }

  return params;
};

// Apply auth tokens from a deep link URL (email confirmation, password recovery, OAuth redirect)
export const applySupabaseAuthSessionFromUrl = async (url: string): Promise<AuthDeepLinkResult> => {
  try {
    const params = extractAuthParamsFromUrl(url);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    const type = params.get('type');
    const intentParam = params.get('intent');
    const intent = intentParam === 'login' || intentParam === 'register' ? intentParam : null;

    if (error) {
      return {
        didSetSession: false,
        type,
        intent,
        error: errorDescription || error,
      };
    }

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        return {
          didSetSession: false,
          type,
          intent,
          error: sessionError.message,
        };
      }

      return {
        didSetSession: true,
        type,
        intent,
        error: null,
      };
    }

    return {
      didSetSession: false,
      type,
      intent,
      error: null,
    };
  } catch (e) {
    const message = (e as any)?.message;
    return {
      didSetSession: false,
      type: null,
      intent: null,
      error: message || 'Failed to handle authentication link',
    };
  }
};
