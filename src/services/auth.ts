// Auth Service - Now using Supabase
// See src/store/slices/authSlice.ts for actual implementation

import { supabase } from './supabase';
import { logger } from '../utils/logger';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  session: Session | null;
}

export const login = async (email: string, password: string): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    logger.error('Login failed', error);
    throw error;
  }
  return { user: data.user, session: data.session };
};

export const register = async (email: string, password: string, name: string): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
    },
  });
  if (error) {
    logger.error('Registration failed', error);
    throw error;
  }
  return { user: data.user, session: data.session };
};

export const forgotPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    logger.error('Password reset request failed', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.error('Logout failed', error);
    throw error;
  }
};