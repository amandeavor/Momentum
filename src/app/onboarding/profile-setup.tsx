import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import Button from '@/components/common/Button';

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');

  const handleContinue = () => {
    if (name.trim()) {
      // TODO: Save name to profile
      router.push('/onboarding/bedtime');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>What should we call you?</Text>
          <Text style={styles.subtitle}>
            We'll use this to personalize your experience.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            label="Continue"
            onPress={handleContinue}
            disabled={!name.trim()}
            variant="primary"
            size="large"
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  input: {
    ...typography.h3,
    color: colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    backgroundColor: colors.dark.background,
  },
});
