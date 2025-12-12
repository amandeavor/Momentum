import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { supabase } from '@/services/supabase';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const ForgotPassword = () => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'momentum://reset-password',
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={sent ? 'mail-open-outline' : 'lock-closed-outline'}
            size={48}
            color={colors.dark.text}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {sent ? 'Check Your Email' : 'Reset Password'}
        </Text>
        <Text style={styles.subtitle}>
          {sent
            ? `We've sent a password reset link to ${email}`
            : 'Enter your email and we\'ll send you a reset link'}
        </Text>

        {/* Error */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color={colors.dark.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {sent ? (
          <>
            {/* Success Actions */}
            <Button
              label="Back to Login"
              onPress={() => router.replace('/(auth)/login')}
              fullWidth
              style={styles.actionButton}
            />
            <Pressable
              onPress={() => {
                setSent(false);
                setEmail('');
              }}
              style={styles.resendContainer}
            >
              <Text style={styles.resendText}>
                Didn't receive the email?{' '}
                <Text style={styles.resendLink}>Try again</Text>
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon={
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={colors.dark.textTertiary}
                  />
                }
              />

              <Button
                label="Send Reset Link"
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
                style={styles.actionButton}
              />
            </View>

            {/* Back to Login */}
            <Pressable
              onPress={() => router.back()}
              style={styles.backToLogin}
            >
              <Text style={styles.backToLoginText}>
                Back to <Text style={styles.backToLoginLink}>Login</Text>
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    paddingBottom: spacing.xxl * 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.dark.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
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
  actionButton: {
    marginTop: spacing.md,
  },
  backToLogin: {
    marginTop: spacing.xl,
    alignSelf: 'center',
  },
  backToLoginText: {
    ...typography.body,
    color: colors.dark.textSecondary,
  },
  backToLoginLink: {
    color: colors.dark.text,
    fontWeight: '600',
  },
  resendContainer: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
  resendText: {
    ...typography.bodySmall,
    color: colors.dark.textSecondary,
  },
  resendLink: {
    color: colors.dark.text,
    fontWeight: '600',
  },
});

export default ForgotPassword;