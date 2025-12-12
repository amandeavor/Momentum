import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppDispatch } from '@/store';
import { resetOnboarding } from '@/store/slices/settingsSlice';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

const Register = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { signUp, loginWithProvider, loginAnonymously, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError('');
    if (!validateForm()) return;

    try {
      await signUp(email, password, name);
      // Reset onboarding state for new user
      dispatch(resetOnboarding());
      // On success, the auth state change will redirect
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  const handleProviderLogin = async (provider: 'google') => {
    try {
      setError('');
      await loginWithProvider(provider, 'register');
    } catch (err: any) {
      setError(err?.message || 'Unable to continue with that provider. Please try again.');
    }
  };

  const handleAnonymousRegister = async () => {
    try {
      setError('');
      await loginAnonymously();
      dispatch(resetOnboarding());
    } catch (err: any) {
      setError(err?.message || 'Failed to continue anonymously');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { marginTop: insets.top }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={24} color={colors.dark.text} />
          </Pressable>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Start building better habits today
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color={colors.dark.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          <Input
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            activeBorderColor={colors.primary}
            inactiveBorderColor={colors.dark.border}
            inputStyle={{ color: colors.dark.text }}
            placeholderTextColor={colors.dark.textTertiary}
            leftIcon={
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.dark.textSecondary}
              />
            }
          />

          <Input
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            activeBorderColor={colors.primary}
            inactiveBorderColor={colors.dark.border}
            inputStyle={{ color: colors.dark.text }}
            placeholderTextColor={colors.dark.textTertiary}
            leftIcon={
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.dark.textSecondary}
              />
            }
          />

          <Input
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            activeBorderColor={colors.primary}
            inactiveBorderColor={colors.dark.border}
            inputStyle={{ color: colors.dark.text }}
            placeholderTextColor={colors.dark.textTertiary}
            leftIcon={
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.dark.textSecondary}
              />
            }
          />

          <Input
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
            activeBorderColor={colors.primary}
            inactiveBorderColor={colors.dark.border}
            inputStyle={{ color: colors.dark.text }}
            placeholderTextColor={colors.dark.textTertiary}
            leftIcon={
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.dark.textSecondary}
              />
            }
          />

          <Button
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            variant="primary"
            size="large"
            style={styles.registerButton}
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

          <Button
            label="Try without account (new)"
            onPress={handleAnonymousRegister}
            variant="secondary"
            fullWidth
            size="large"
            style={styles.socialButton}
          />

          {/* Terms */}
          <Text style={styles.terms}>
            By creating an account, you agree to our{' '}
            <Text
              style={styles.termsLink}
              onPress={() => router.push('/(auth)/terms')}
            >
              Terms of Service
            </Text> and{' '}
            <Text
              style={styles.termsLink}
              onPress={() => router.push('/(auth)/privacy')}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable hitSlop={12}>
              <Text style={styles.loginLink}>Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing.sm,
  },
  titleContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.dark.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.dark.error}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.dark.error,
    flex: 1,
  },
  form: {
    gap: spacing.md,
  },
  registerButton: {
    marginTop: spacing.sm,
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
  terms: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  termsLink: {
    color: colors.dark.text,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.xl,
    gap: spacing.xs,
  },
  footerText: {
    ...typography.body,
    color: colors.dark.textSecondary,
  },
  loginLink: {
    ...typography.body,
    color: colors.dark.text,
    fontWeight: '600',
  },
});

export default Register;