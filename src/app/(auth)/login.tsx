import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useAuth } from '@/hooks/useAuth';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, loginWithProvider, isLoading, error, clearAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const validateForm = useCallback(() => {
    if (!email.trim()) {
      setLocalError('Please enter your email');
      return false;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setLocalError('Please enter a valid email');
      return false;
    }
    setLocalError('');
    return true;
  }, [email, password]);

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      clearAuthError();
      await login(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleProviderLogin = async (provider: 'google') => {
    try {
      clearAuthError();
      await loginWithProvider(provider, 'login');
      // OAuth flow will handle redirect
    } catch (err) {
      setLocalError('Unable to sign in with that provider. Please try again or use email.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Brand */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.brandSection}
        >
          <Text style={styles.brandName}>Momentum</Text>
          <Text style={styles.tagline}>Focus. Track. Achieve.</Text>
        </Animated.View>

        {/* Login Form */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.formSection}
        >
          <Text style={styles.title}>Welcome back</Text>

          {displayError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            activeBorderColor={colors.primary}
            inactiveBorderColor={colors.dark.border}
            inputStyle={{ color: colors.dark.text }}
            placeholderTextColor={colors.dark.textTertiary}
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            activeBorderColor={colors.primary}
            inactiveBorderColor={colors.dark.border}
            inputStyle={{ color: colors.dark.text }}
            placeholderTextColor={colors.dark.textTertiary}
          />

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>
          </Link>

          <Button
            label={isLoading ? 'Signing in...' : 'Sign In'}
            onPress={handleLogin}
            disabled={isLoading}
            fullWidth
            variant="primary"
            size="large"
            style={styles.primaryButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label="Continue with Google"
            onPress={() => handleProviderLogin('google')}
            variant="secondary"
            iconName="logo-google"
            fullWidth
            size="large"
            style={styles.socialButton}
          />
        </Animated.View>

        {/* Register Link */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.footer}
        >
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Create one</Text>
            </Pressable>
          </Link>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  brandName: {
    ...typography.caption,
    color: colors.dark.textSecondary,
    marginTop: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  tagline: {
    ...typography.bodySmall,
    color: colors.dark.textTertiary,
    marginTop: spacing.xs,
  },
  formSection: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.dark.text,
    marginBottom: spacing.xl,
  },
  errorContainer: {
    backgroundColor: colors.dark.error + '20',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.dark.error,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    padding: spacing.xs,
  },
  forgotPasswordText: {
    ...typography.bodySmall,
    color: colors.dark.textSecondary,
  },
  primaryButton: {
    marginBottom: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.dark.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    marginHorizontal: spacing.lg,
  },
  socialButton: {
    marginBottom: spacing.md,
  },
  secondaryButton: {
    marginBottom: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  footerText: {
    ...typography.body,
    color: colors.dark.textSecondary,
  },
  footerLink: {
    ...typography.body,
    color: colors.dark.text,
    fontWeight: '600',
  },
});