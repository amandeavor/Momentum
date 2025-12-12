import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

import { supabase, applySupabaseAuthSessionFromUrl } from '@/services/supabase';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

/**
 * Auth callback screen - handles deep links from email confirmation,
 * password reset, and magic links
 */
export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying...');

  useEffect(() => {
    // Handle initial URL (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // Handle incoming URLs (warm start)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleUrl = async (url: string) => {
    try {
      const result = await applySupabaseAuthSessionFromUrl(url);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.didSetSession) {
        setStatus('success');
        setMessage('Success! Redirecting...');

        setTimeout(() => {
          if (result.type === 'recovery') {
            router.replace('/(auth)/reset-password');
          } else {
            // Redirect to root to let the app decide where to go (Onboarding vs Dashboard)
            router.replace('/');
          }
        }, 500);
      } else {
        // If no tokens, check if we already have a session (maybe just a deep link to open app)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/');
        } else {
          // No session, no tokens -> Login
          router.replace('/(auth)/login');
        }
      }
    } catch (err: any) {
      console.error('Auth callback error:', err);
      setStatus('error');
      setMessage(err.message || 'Authentication failed');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 3000);
    }
  };

  return (
    <View style={styles.container}>
      {status === 'loading' && <ActivityIndicator size="large" color={colors.primary} />}
      <Text style={[styles.message, status === 'error' && styles.errorText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  message: {
    ...typography.body,
    color: colors.dark.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorText: {
    color: colors.dark.error,
  },
});
