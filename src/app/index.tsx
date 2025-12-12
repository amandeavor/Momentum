import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store';
import { selectOnboardingCompleted } from '@/store/slices/settingsSlice';
import { colors } from '@/theme/colors';

/**
 * Root index - handles initial routing based on auth state
 * Redirects to:
 * - /landing if first time user (onboarding not completed)
 * - (auth)/login if not authenticated
 * - (main)/dashboard if authenticated
 */
export default function Index() {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const isInitializing = useAppSelector(state => state.auth.initializing);
  const onboardingCompleted = useAppSelector(selectOnboardingCompleted);

  // Show loading while checking auth state
  if (isInitializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Route based on auth state
  if (!isAuthenticated) {
    return <Redirect href="/landing" />;
  }

  // Authenticated users go straight to dashboard
  return <Redirect href="/(main)/dashboard" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});